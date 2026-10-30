import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";
import { GUIDE_DAY_TRIP_IDS, MAX_DEPARTURES_PER_GUIDE_DAY, guideDayLockKey, isGuideDayTrip, rioDayOf } from "@/lib/booking/guide-calendar";
import { guideDayPicker } from "./helpers/guide-day";

/**
 * Guide calendar (Sprint 11, 28/10/2026; rule PROVISIONAL until RT-123): Ricardo guides TOUR-01, TOUR-02 and TOUR-03,
 * so one active booking of any of them makes that Rio day unavailable for the other two.
 *
 * The LIVE block is SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (RT-104 guard first). The
 * price table is TEST ONLY (invented numbers injected into the engine so TOUR-01/02 can be booked here); it is not a
 * price and not an approval: the real registry quotes TOUR-01/TOUR-02 only with the Owner's RT-121 tables (28/10/2026).
 */
const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_02 = "cmli1a6im000034zqqzc9sppb";
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";

describe("guide calendar rules", () => {
  it("the three launched own tours share the guide; one departure per Rio day", () => {
    expect([...GUIDE_DAY_TRIP_IDS].sort()).toEqual([TOUR_01, TOUR_02, TOUR_03].sort());
    expect(isGuideDayTrip("cmljo0s1u0000t0zqa0bpd23p")).toBe(false); // TOUR-04: out of the launch
    expect(MAX_DEPARTURES_PER_GUIDE_DAY).toBe(1);
    expect(guideDayLockKey("2026-11-03")).toBe("booking:guide-day:2026-11-03");
  });

  it("days are Rio calendar days (UTC-3), not UTC days", () => {
    // 23:30 in Rio on 3 Nov is 02:30 UTC on 4 Nov: still Rio's 3 Nov.
    expect(rioDayOf(new Date("2026-11-04T02:30:00Z"))).toEqual({ day: "2026-11-03", start: new Date("2026-11-03T03:00:00Z"), end: new Date("2026-11-04T03:00:00Z") });
    expect(rioDayOf(new Date("2026-11-04T03:00:00Z")).day).toBe("2026-11-04"); // 00:00 in Rio
    expect(rioDayOf(new Date("2026-11-04T02:59:59.999Z")).day).toBe("2026-11-03");
  });
});

const url = process.env.S11_LOCAL_DB_URL;

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const TEST_ONLY_TABLE = (tripId: string): ApprovedGroupPriceTable => ({
  id: "TEST-ONLY-GUIDE-DAY",
  version: "test-1",
  tripId,
  currency: "BRL",
  groupTotalCents: { 1: 100_000, 2: 120_000, 3: 150_000, 4: 160_000 },
  childPolicy: "NOT_APPROVED",
  approvalRecord: "TEST ONLY — not an approval",
});

type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("guide calendar live (local isolated database only)", () => {
  let prisma: Client;
  let engine: typeof import("@/lib/services/private-booking.service");
  let bookings: typeof import("@/lib/services/booking.service");
  let nextFreeGuideDay: () => Promise<string>;
  const tag = `rt123-guide-${Date.now()}`;
  let fixtureTrip = "";
  let user = 0;
  const customer = async () => (await prisma.user.create({ data: { name: `Cliente ${user}`, email: `${tag}-${user++}@example.invalid` } })).id;
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const };
  const slot = async (tripId: string, startAt: Date) => (await prisma.tripSchedule.create({ data: { tripId, startAt, capacity: 4, pricePerPersonCents: 0 } })).id;
  /** `HH:MM` in Rio on a Rio day. */
  const rio = (day: string, time: string) => new Date(`${day}T${time}:00-03:00`);
  const book = async (tripId: string, startAt: Date) =>
    engine.createPrivateBookingForUser(await customer(), { tripId, scheduleId: await slot(tripId, startAt), party: { fullFare: 2, infants: 0 }, contact }, { resolvePriceTable: (id) => TEST_ONLY_TABLE(id) });
  const nextDayOf = (day: string) => new Date(Date.parse(`${day}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-123 guide calendar live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    engine = await import("@/lib/services/private-booking.service");
    bookings = await import("@/lib/services/booking.service");
    nextFreeGuideDay = guideDayPicker(prisma, 241, 360);
    for (const [id, name] of [[TOUR_01, "TOUR-01"], [TOUR_02, "TOUR-02"], [TOUR_03, "TOUR-03"]]) {
      // Other live suites create the same fixture trips in parallel: insert once, never fail on a concurrent insert.
      await prisma.$executeRaw`INSERT INTO "Trip" ("id", "city", "priceCents", "title", "highlights", "isPublished", "maxGuests", "updatedAt")
        VALUES (${id}, 'Rio de Janeiro', 0, ${JSON.stringify({ pt: `${name} fixture ${tag}` })}::jsonb, '[]'::jsonb, false, 4, now())
        ON CONFLICT ("id") DO NOTHING`;
    }
    fixtureTrip = (await prisma.trip.create({ data: { city: "Rio de Janeiro", priceCents: 0, title: { pt: `Fixture ${tag}` }, highlights: [], isPublished: false, maxGuests: 4 } })).id;
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("a booking of one tour makes the day unavailable for the other two (same answer as a taken slot); the next day stays free", async () => {
    const day = await nextFreeGuideDay();
    await expect(book(TOUR_03, rio(day, "09:00"))).resolves.toMatchObject({ status: "PENDING" });
    await expect(book(TOUR_01, rio(day, "14:00"))).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE", status: 409 });
    await expect(book(TOUR_02, rio(day, "07:00"))).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE", status: 409 });
    await expect(book(TOUR_03, rio(day, "15:00"))).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" }); // another TOUR-03 slot
    const other = await nextFreeGuideDay();
    await expect(book(TOUR_01, rio(other, "08:00"))).resolves.toMatchObject({ status: "PENDING" });
  });

  it("uses the Rio day: 23:30 and 00:30 of the next Rio day are different days; 00:30 and 23:30 of one Rio day are the same", async () => {
    let first = await nextFreeGuideDay();
    let second = await nextFreeGuideDay();
    while (second !== nextDayOf(first)) [first, second] = [second, await nextFreeGuideDay()];
    await expect(book(TOUR_02, rio(first, "23:30"))).resolves.toMatchObject({ status: "PENDING" }); // 02:30 UTC on `second`
    await expect(book(TOUR_01, rio(second, "00:30"))).resolves.toMatchObject({ status: "PENDING" }); // other Rio day
    await expect(book(TOUR_03, rio(first, "00:30"))).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" }); // same Rio day
  });

  it("a canceled booking frees the guide's day", async () => {
    const day = await nextFreeGuideDay();
    const first = await book(TOUR_03, rio(day, "09:00"));
    await bookings.cancelBookingByAdmin(first.id, { userId: null, role: "SYSTEM" });
    await expect(book(TOUR_01, rio(day, "08:00"))).resolves.toMatchObject({ status: "PENDING" });
  });

  it("concurrent requests for the three tours on one free day: exactly one booking", async () => {
    const day = await nextFreeGuideDay();
    const trips = [TOUR_01, TOUR_02, TOUR_03, TOUR_01, TOUR_02, TOUR_03];
    const scheduleIds = await Promise.all(trips.map((tripId, i) => slot(tripId, rio(day, `0${7 + (i % 3)}:00`))));
    const users = await Promise.all(trips.map(() => customer()));
    const results = await Promise.allSettled(
      trips.map((tripId, i) => engine.createPrivateBookingForUser(users[i], { tripId, scheduleId: scheduleIds[i], party: { fullFare: 2, infants: 0 }, contact }, { resolvePriceTable: (id) => TEST_ONLY_TABLE(id) })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) if (r.status === "rejected") expect((r.reason as { code?: string }).code).toMatch(/^(SCHEDULE_UNAVAILABLE|BOOKING_BUSY)$/);
    const { start, end } = rioDayOf(rio(day, "12:00"));
    expect(await prisma.booking.count({ where: { tripId: { in: [...GUIDE_DAY_TRIP_IDS] }, status: { in: ["PENDING", "CONFIRMED"] }, schedule: { startAt: { gte: start, lt: end } } } })).toBe(1);
  }, 30_000);

  it("a trip outside the guide calendar is not affected", async () => {
    const day = await nextFreeGuideDay();
    await book(TOUR_03, rio(day, "09:00"));
    const scheduleId = await slot(fixtureTrip, rio(day, "10:00"));
    await expect(
      engine.createPrivateBookingForUser(await customer(), { tripId: fixtureTrip, scheduleId, party: { fullFare: 1, infants: 0 }, contact }, { resolvePriceTable: (id) => TEST_ONLY_TABLE(id) }),
    ).resolves.toMatchObject({ status: "PENDING" });
  });

  it("with the real registry, TOUR-01 quotes the Owner's table (never the TEST ONLY one) and blocks TOUR-02 on the same day", async () => {
    const day = await nextFreeGuideDay();
    const first = await engine.createPrivateBookingForUser(await customer(), { tripId: TOUR_01, scheduleId: await slot(TOUR_01, rio(day, "09:00")), party: { fullFare: 2, infants: 0 }, contact });
    expect(first.quote).toMatchObject({ totalCents: 170_000, priceTableId: "TOUR-01" });
    const scheduleId = await slot(TOUR_02, rio(day, "09:00"));
    await expect(engine.createPrivateBookingForUser(await customer(), { tripId: TOUR_02, scheduleId, party: { fullFare: 2, infants: 0 }, contact })).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" });
  });
});
