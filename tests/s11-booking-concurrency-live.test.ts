import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * LIVE verification of the serialized booking write against a REAL PostgreSQL. SKIPPED unless explicitly enabled:
 *
 *   S11_LOCAL_DB_URL=postgresql://…@localhost:5433/<db>   (a disposable database of the local Docker container,
 *                                                          migrated and marked with npm run db:mark-local -- <db>)
 *
 * The RT-104 guard (assertDatabaseAccess, operation "write") runs first: it only accepts a positively identified
 * local isolated database, so this file can never write to a hosted (Preview or Production) database.
 * It fires concurrent bookings at one schedule and checks that capacity is never exceeded and that a user never gets
 * two active bookings for the same date, which the previous read-then-insert code could not guarantee.
 */
const url = process.env.S11_LOCAL_DB_URL;
const enabled = Boolean(url);

// The public gate and the price guard are covered by their own unit tests; here they let the fixture trip through so
// that only the database behaviour is measured.
vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));
vi.mock("@/lib/catalog/price-on-request", () => ({ isBookingBlockedForUnapprovedPrice: () => false }));

type Service = typeof import("@/lib/services/booking.service");
type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!enabled)("Sprint 11 — booking concurrency on a real PostgreSQL (local isolated database only)", () => {
  let service: Service;
  let prisma: Client;
  const tag = `s11-live-${Date.now()}`;
  let tripId = "";
  let scheduleId = "";
  const userIds: string[] = [];

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "s11 booking concurrency live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    service = await import("@/lib/services/booking.service");

    const trip = await prisma.trip.create({
      data: { city: "Rio de Janeiro", priceCents: 1000, title: { pt: `Fixture ${tag}` }, highlights: [], isPublished: false, maxGuests: 4 },
    });
    tripId = trip.id;
    const schedule = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + 7 * 86_400_000), capacity: 4, pricePerPersonCents: 1000 },
    });
    scheduleId = schedule.id;
    for (let i = 0; i < 8; i++) {
      const user = await prisma.user.create({ data: { name: `Fixture ${i}`, email: `${tag}-${i}@example.invalid` } });
      userIds.push(user.id);
    }
  }, 60_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.booking.deleteMany({ where: { tripId } });
    await prisma.tripSchedule.deleteMany({ where: { tripId } });
    await prisma.trip.deleteMany({ where: { id: tripId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("8 users × 2 guests racing for a 4-seat schedule: exactly 2 bookings, never more than 4 guests", async () => {
    const results = await Promise.allSettled(
      userIds.map((userId) => service.createBookingForUser(userId, { tripId, scheduleId, guestCount: 2 })),
    );
    const created = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(created).toBe(2);
    expect(rejected.every((r) => (r.reason as { code?: string }).code === "SCHEDULE_CAPACITY_EXCEEDED")).toBe(true);
    const sum = await prisma.booking.aggregate({ where: { scheduleId, status: { in: ["PENDING", "CONFIRMED"] } }, _sum: { guestCount: true } });
    expect(sum._sum.guestCount).toBe(4);
  }, 60_000);

  it("one user double-submitting 5 times in parallel gets exactly one active booking", async () => {
    await prisma.booking.deleteMany({ where: { tripId } });
    const userId = userIds[0];
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => service.createBookingForUser(userId, { tripId, scheduleId, guestCount: 1 })),
    );
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(rejected.every((r) => (r.reason as { code?: string }).code === "DUPLICATE_BOOKING")).toBe(true);
    expect(await prisma.booking.count({ where: { userId, scheduleId, status: { in: ["PENDING", "CONFIRMED"] } } })).toBe(1);
  }, 60_000);
});
