import pg from "pg";
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
 * Audit 24/10/2026 additions: a confirm parked between its read and its write cannot overwrite a cancel (the old code
 * resurrected the booking: 6 guests on a 4-seat schedule); a held lock answers BOOKING_BUSY within the lock_timeout
 * instead of hanging; a schedule that already started is refused.
 */
const url = process.env.S11_LOCAL_DB_URL;
const enabled = Boolean(url);

// The public gate and the price guard are covered by their own unit tests; here they let the fixture trip through so
// that only the database behaviour is measured.
vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));
vi.mock("@/lib/catalog/price-on-request", () => ({ isBookingBlockedForUnapprovedPrice: () => false }));

// Interleaving hook for the confirm/cancel race: while `parked` is set, a booking.updateMany that writes the parked status
// waits (its read already happened) until the test releases it. Everything else goes straight to the real client.
const parked = vi.hoisted(() => ({ current: undefined as undefined | { status: string; reached: () => void; release: Promise<void> } }));
vi.mock("@/lib/prisma", async (importOriginal) => {
  const real = (await importOriginal()) as { prisma: Record<string, unknown> & { booking: Record<string, unknown> } };
  const bind = (target: object, key: string | symbol) => {
    const value = Reflect.get(target, key);
    return typeof value === "function" ? value.bind(target) : value;
  };
  const booking = new Proxy(real.prisma.booking, {
    get(target, key) {
      if (key !== "updateMany") return bind(target, key);
      return async (args: { data?: { status?: string } }) => {
        const gate = parked.current;
        if (gate && args?.data?.status === gate.status) {
          gate.reached();
          await gate.release;
        }
        return (target.updateMany as (a: unknown) => Promise<unknown>)(args);
      };
    },
  });
  return { prisma: new Proxy(real.prisma, { get: (target, key) => (key === "booking" ? booking : bind(target, key)) }) };
});

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

  it("a confirm parked between its read and its write cannot overwrite a cancel (no resurrection, no overbooking)", async () => {
    const schedule = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + 8 * 86_400_000), capacity: 4, pricePerPersonCents: 1000 },
    });
    const victim = await service.createBookingForUser(userIds[0], { tripId, scheduleId: schedule.id, guestCount: 2 });
    await service.createBookingForUser(userIds[1], { tripId, scheduleId: schedule.id, guestCount: 2 }); // 4/4

    let reached!: () => void;
    let release!: () => void;
    const reachedP = new Promise<void>((resolve) => (reached = resolve));
    parked.current = { status: "CONFIRMED", reached, release: new Promise<void>((resolve) => (release = resolve)) };
    try {
      const confirm = service.confirmBookingByAdmin(victim.id).then(
        () => "CONFIRMED",
        (error: { code?: string }) => error.code,
      ); // reads PENDING, then parks before its write
      await reachedP;
      await expect(service.cancelBookingForUser(userIds[0], victim.id)).resolves.toMatchObject({ status: "CANCELED" });
      await service.createBookingForUser(userIds[2], { tripId, scheduleId: schedule.id, guestCount: 2 }); // takes the freed seats
      release();
      expect(await confirm).toBe("BOOKING_STATUS_CHANGED");
    } finally {
      parked.current = undefined;
    }

    expect((await prisma.booking.findUnique({ where: { id: victim.id } }))?.status).toBe("CANCELED");
    const sum = await prisma.booking.aggregate({ where: { scheduleId: schedule.id, status: { in: ["PENDING", "CONFIRMED"] } }, _sum: { guestCount: true } });
    expect(sum._sum.guestCount).toBe(4);
  }, 60_000);

  it("a held lock answers BOOKING_BUSY within the lock_timeout instead of hanging, and leaves no waiting backend", async () => {
    const schedule = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + 9 * 86_400_000), capacity: 4, pricePerPersonCents: 1000 },
    });
    const holder = new pg.Client({ connectionString: url });
    await holder.connect();
    try {
      await holder.query("SELECT pg_advisory_lock(hashtext($1))", [service.bookingLockKey(userIds[3], tripId, schedule.id)]);
      const started = Date.now();
      await expect(service.createBookingForUser(userIds[3], { tripId, scheduleId: schedule.id, guestCount: 1 })).rejects.toMatchObject({
        code: "BOOKING_BUSY",
        status: 409,
      });
      expect(Date.now() - started).toBeLessThan(4_500); // bounded by the 2 s lock_timeout, not by the holder
      const waiting = await holder.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event = 'advisory'");
      expect(waiting.rows[0].n).toBe(0);
    } finally {
      await holder.query("SELECT pg_advisory_unlock_all()");
      await holder.end();
    }
    expect(await prisma.booking.count({ where: { scheduleId: schedule.id } })).toBe(0);
  }, 60_000);

  it("refuses a schedule that already started, even while it is still OPEN", async () => {
    const past = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() - 86_400_000), capacity: 4, pricePerPersonCents: 1000 },
    });
    await expect(service.createBookingForUser(userIds[4], { tripId, scheduleId: past.id, guestCount: 1 })).rejects.toMatchObject({
      code: "SCHEDULE_UNAVAILABLE",
    });
    expect(await prisma.booking.count({ where: { scheduleId: past.id } })).toBe(0);
  }, 60_000);
});
