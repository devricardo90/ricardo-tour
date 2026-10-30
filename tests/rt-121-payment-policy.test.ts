import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DEPOSIT_BASIS_POINTS, quoteGroupPrice, splitDeposit } from "@/lib/commerce/group-pricing";
import { getApprovedGroupPriceTable, listApprovedGroupPriceTables } from "@/lib/commerce/price-tables";
import { BOOKING_PRICE_NOT_APPROVED_TRIP_IDS } from "@/lib/catalog/price-on-request";

/**
 * RT-121 (Owner decision 26/10/2026): deposit 30% and balance 70% of the TOTAL for every tour; TOUR-03 4 hours approved
 * (R$ 650 / 760 / 900 / 1.040 for 1-4 people). 28/10/2026 final decision, registered locally 29/10/2026: TOUR-01
 * R$ 1.200 / 1.700 / 2.200 / 2.600 (tickets included, 0-2 pay 50%) and TOUR-02 R$ 450 / 580 / 690 / 780 (adults only).
 * The TOUR-01 child policy is not extended to TOUR-03, and nothing here opens sales.
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
  it("holds exactly the three approved tables (TOUR-01, TOUR-02, TOUR-03 4 h)", () => {
    expect(listApprovedGroupPriceTables().map((table) => table.id)).toEqual(["TOUR-01", "TOUR-02", "TOUR-03-4H"]);
    expect(getApprovedGroupPriceTable(TOUR_01)).toMatchObject({
      id: "TOUR-01",
      version: "2026-10-28",
      groupTotalCents: { 1: 120_000, 2: 170_000, 3: 220_000, 4: 260_000 },
      childPolicy: "INFANT_HALF_FARE_0_2",
    });
    expect(getApprovedGroupPriceTable(TOUR_02)).toMatchObject({
      id: "TOUR-02",
      version: "2026-10-28",
      groupTotalCents: { 1: 45_000, 2: 58_000, 3: 69_000, 4: 78_000 },
      childPolicy: "NOT_APPROVED",
    });
  });

  it("the TOUR-03 4-hour table keeps its approved values, with the Ficha TOUR-03 §13 child rule enabled 30/10/2026", () => {
    expect(getApprovedGroupPriceTable(TOUR_03)).toMatchObject({
      id: "TOUR-03-4H",
      version: "2026-10-30",
      tripId: TOUR_03,
      currency: "BRL",
      groupTotalCents: { 1: 65_000, 2: 76_000, 3: 90_000, 4: 104_000 },
      childPolicy: "INFANT_HALF_FARE_0_2",
    });
    expect(Object.keys(getApprovedGroupPriceTable(TOUR_03)!.groupTotalCents)).toEqual(["1", "2", "3", "4"]);
  });

  it("TOUR-04 and the TOUR-03 6-hour option have no table, and a table never applies to another tour", () => {
    for (const tripId of [TOUR_04, "unknown-trip"]) expect(getApprovedGroupPriceTable(tripId)).toBeNull();
    expect(getApprovedGroupPriceTable(TOUR_02, "TOUR-01")).toBeNull();
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

describe("RT-121 TOUR-01 and TOUR-02: every group size, 30% deposit of the total", () => {
  it.each([
    [TOUR_01, 1, 120_000, 36_000], [TOUR_01, 2, 170_000, 51_000], [TOUR_01, 3, 220_000, 66_000], [TOUR_01, 4, 260_000, 78_000],
    [TOUR_02, 1, 45_000, 13_500], [TOUR_02, 2, 58_000, 17_400], [TOUR_02, 3, 69_000, 20_700], [TOUR_02, 4, 78_000, 23_400],
  ])("%s, %i person(s): total %i, deposit %i", (tripId, people, total, deposit) => {
    const quote = quoteGroupPrice(getApprovedGroupPriceTable(tripId)!, { fullFare: people, infants: 0 });
    expect(quote.totalCents).toBe(total);
    expect(splitDeposit(total)).toEqual({ totalCents: total, depositCents: deposit, balanceCents: total - deposit, depositBasisPoints: 3000 });
  });

  it("TOUR-03 4 h: mixed groups follow Ficha §13 (child 0-2 = 50% of the band's per-person price, counts for the band)", () => {
    const table = getApprovedGroupPriceTable(TOUR_03)!;
    // 1 adult + 1 infant = band 2 (R$ 760): 380 + 190 = R$ 570.
    expect(quoteGroupPrice(table, { fullFare: 1, infants: 1 }).totalCents).toBe(57_000);
    // 2 adults + 1 infant = band 3 (R$ 900): 2 x 300 + 150 = R$ 750.
    expect(quoteGroupPrice(table, { fullFare: 2, infants: 1 }).totalCents).toBe(75_000);
    // 2 adults + 2 infants = band 4 (R$ 1.040): 2 x 260 + 2 x 130 = R$ 780.
    expect(quoteGroupPrice(table, { fullFare: 2, infants: 2 }).totalCents).toBe(78_000);
    // Children count toward the limit of 4; a child never travels without a full-fare adult.
    expect(() => quoteGroupPrice(table, { fullFare: 3, infants: 2 })).toThrowError(/Maximo de 4/);
    expect(() => quoteGroupPrice(table, { fullFare: 0, infants: 1 })).toThrowError(/pelo menos um participante/);
  });

  it("TOUR-01: a child 0-2 pays 50% of the band's per-person price and counts for the band", () => {
    // 2 adults + 1 infant = band 3 (R$ 2.200): 2 x 733,33 + 366,67 = R$ 1.833,33.
    expect(quoteGroupPrice(getApprovedGroupPriceTable(TOUR_01)!, { fullFare: 2, infants: 1 }).totalCents).toBe(183_333);
    // 3 adults + 1 infant = band 4 (R$ 2.600): 3 x 650 + 325 = R$ 2.275.
    expect(quoteGroupPrice(getApprovedGroupPriceTable(TOUR_01)!, { fullFare: 3, infants: 1 }).totalCents).toBe(227_500);
    // 1 adult + 1 infant = band 2 (R$ 1.700): 850 + 425 = R$ 1.275; 1 adult + 3 infants = band 4: 650 + 3 x 325 = R$ 1.625.
    expect(quoteGroupPrice(getApprovedGroupPriceTable(TOUR_01)!, { fullFare: 1, infants: 1 }).totalCents).toBe(127_500);
    expect(quoteGroupPrice(getApprovedGroupPriceTable(TOUR_01)!, { fullFare: 1, infants: 3 }).totalCents).toBe(162_500);
    expect(() => quoteGroupPrice(getApprovedGroupPriceTable(TOUR_01)!, { fullFare: 4, infants: 1 })).toThrowError(/Maximo de 4/);
  });
});

describe("RT-121 booking engine guards (refused before any database access)", () => {
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const };
  const book = async (input: Record<string, unknown>) => {
    const { createPrivateBookingForUser } = await import("@/lib/services/private-booking.service");
    return createPrivateBookingForUser("user-1", { scheduleId: "s1", contact, ...input });
  };

  it("TOUR-04, the TOUR-03 6-hour option and a table of another tour keep PRICE_NOT_APPROVED", async () => {
    await expect(book({ tripId: TOUR_04, party: { fullFare: 2, infants: 0 } })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED", status: 409 });
    await expect(book({ tripId: TOUR_02, priceTableId: "TOUR-01", party: { fullFare: 2, infants: 0 } })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    await expect(book({ tripId: TOUR_03, priceTableId: "TOUR-03-6H", party: { fullFare: 2, infants: 0 } })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    expect(prismaTouched).not.toHaveBeenCalled();
  });


  it("TOUR-02 is adults only: a party with a child is refused", async () => {
    await expect(book({ tripId: TOUR_02, party: { fullFare: 2, infants: 1 } })).rejects.toMatchObject({ code: "CHILD_POLICY_NOT_APPROVED", status: 409 });
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
