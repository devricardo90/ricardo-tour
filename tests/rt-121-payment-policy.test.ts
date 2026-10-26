import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DEPOSIT_BASIS_POINTS, quoteGroupPrice, splitDeposit } from "@/lib/commerce/group-pricing";
import { getApprovedGroupPriceTable, listApprovedGroupPriceTables } from "@/lib/commerce/price-tables";
import { BOOKING_PRICE_NOT_APPROVED_TRIP_IDS } from "@/lib/catalog/price-on-request";

/**
 * RT-121 (Owner decision 26/10/2026): deposit 30% and balance 70% of the TOTAL for every tour; the only approved table
 * is TOUR-03 4 hours (R$ 650 / 760 / 900 / 1.040 for 1-4 people). TOUR-01 and TOUR-02 prices stay pending, the TOUR-01
 * child policy is not extended, and nothing here opens sales.
 */
const prismaTouched = vi.hoisted(() => vi.fn());
vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy({}, { get: () => { prismaTouched(); throw new Error("database must not be reached"); } }),
}));

const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_02 = "cmli1a6im000034zqqzc9sppb";
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";
const TOUR_04 = "cmljo0s1u0000t0zqa0bpd23p";

describe("RT-121 approved price registry", () => {
  it("holds exactly the TOUR-03 4-hour table, with the approved values and no child rule", () => {
    expect(listApprovedGroupPriceTables()).toHaveLength(1);
    expect(getApprovedGroupPriceTable(TOUR_03)).toMatchObject({
      id: "TOUR-03-4H",
      tripId: TOUR_03,
      currency: "BRL",
      groupTotalCents: { 1: 65_000, 2: 76_000, 3: 90_000, 4: 104_000 },
      childPolicy: "NOT_APPROVED",
    });
    expect(Object.keys(getApprovedGroupPriceTable(TOUR_03)!.groupTotalCents)).toEqual(["1", "2", "3", "4"]);
  });

  it("TOUR-01, TOUR-02, TOUR-04 and the TOUR-03 6-hour option have no table", () => {
    for (const tripId of [TOUR_01, TOUR_02, TOUR_04, "unknown-trip"]) expect(getApprovedGroupPriceTable(tripId)).toBeNull();
    expect(getApprovedGroupPriceTable(TOUR_03, "TOUR-03-6H")).toBeNull();
    expect(getApprovedGroupPriceTable(TOUR_03, "TOUR-03-4H")?.id).toBe("TOUR-03-4H");
    expect(getApprovedGroupPriceTable(TOUR_01, "TOUR-03-4H")).toBeNull();
  });

  it("the legacy booking API stays blocked for all four tours (it would store the obsolete per-person price)", () => {
    for (const tripId of [TOUR_01, TOUR_02, TOUR_03, TOUR_04]) expect(BOOKING_PRICE_NOT_APPROVED_TRIP_IDS.has(tripId)).toBe(true);
  });
});

describe("RT-121 TOUR-03 4 h: every group size", () => {
  const table = getApprovedGroupPriceTable(TOUR_03)!;
  it.each([
    [1, 65_000, 19_500, 45_500],
    [2, 76_000, 22_800, 53_200],
    [3, 90_000, 27_000, 63_000],
    [4, 104_000, 31_200, 72_800],
  ])("%i person(s): total %i, deposit %i, balance %i", (people, total, deposit, balance) => {
    const quote = quoteGroupPrice(table, { fullFare: people, infants: 0 });
    expect(quote.totalCents).toBe(total);
    expect(splitDeposit(quote.totalCents)).toEqual({ totalCents: total, depositCents: deposit, balanceCents: balance, depositBasisPoints: 3000 });
    expect(deposit * 10_000).toBe(total * 3_000);
    expect(deposit + balance).toBe(total);
  });

  it("5 people are refused (the table ends at 4)", () => {
    expect(() => quoteGroupPrice(table, { fullFare: 5, infants: 0 })).toThrowError(/Maximo de 4/);
  });

  it("the deposit share is 30% for every tour (no per-table override exists)", () => {
    expect(DEPOSIT_BASIS_POINTS).toBe(3000);
    expect(table).not.toHaveProperty("depositBasisPoints");
    expect(table).not.toHaveProperty("prepaidTicketsCents");
  });
});

describe("RT-121 booking engine guards (refused before any database access)", () => {
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const };
  const book = async (input: Record<string, unknown>) => {
    const { createPrivateBookingForUser } = await import("@/lib/services/private-booking.service");
    return createPrivateBookingForUser("user-1", { scheduleId: "s1", contact, ...input });
  };

  it("TOUR-01 and TOUR-02 keep PRICE_NOT_APPROVED", async () => {
    for (const tripId of [TOUR_01, TOUR_02, TOUR_04]) {
      await expect(book({ tripId, party: { fullFare: 2, infants: 0 } })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED", status: 409 });
    }
    await expect(book({ tripId: TOUR_03, priceTableId: "TOUR-03-6H", party: { fullFare: 2, infants: 0 } })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    expect(prismaTouched).not.toHaveBeenCalled();
  });

  it("TOUR-03 with children 0-2 is refused: the TOUR-01 child policy is not applied to it", async () => {
    await expect(book({ tripId: TOUR_03, party: { fullFare: 2, infants: 1 } })).rejects.toMatchObject({ code: "CHILD_POLICY_NOT_APPROVED", status: 409 });
    expect(prismaTouched).not.toHaveBeenCalled();
  });
});

describe("RT-121 sales stay closed", () => {
  it("no route, page or server action reaches the private booking engine", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx)$/.test(name) && readFileSync(path, "utf8").includes("private-booking.service")) offenders.push(path);
      }
    };
    walk(join(process.cwd(), "app"));
    expect(offenders).toEqual([]);
  });
});
