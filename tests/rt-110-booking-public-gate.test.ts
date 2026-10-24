import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  trip: { findUnique: vi.fn(), findFirst: vi.fn() },
  booking: { findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  tripSchedule: { findUnique: vi.fn() },
  $queryRaw: vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => [{ locked: 1 }]),
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prismaMock)),
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/authz", () => ({ requireSession: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/observability/report", () => ({ reportServerError: vi.fn() }));
// The price guard (tests/rt-110-booking-price-guard.test.ts) blocks the four own tours today. It is lifted here so the
// public gate that runs after it can be exercised on a launch id, as it will be once a price is approved and stored.
const priceGuard = vi.hoisted(() => ({ blocked: false }));
vi.mock("@/lib/catalog/price-on-request", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog/price-on-request")>();
  return { ...actual, isBookingBlockedForUnapprovedPrice: vi.fn(() => priceGuard.blocked) };
});

import { POST } from "@/app/api/bookings/route";
import { bookingLockKey, createBookingForUser } from "@/lib/services/booking.service";

const CENTRO = "cmlibniq40000z4zqkbujnutt";

/** A trip row that passes the public gate (shape of the select in createBookingForUser). */
function publicTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: CENTRO,
    title: { pt: "Centro Histórico e Cultural do Rio", en: "Historic Center", es: "Centro Histórico" },
    description: { pt: "Passeio privativo pelo Centro.", en: "Private tour.", es: "Paseo privado." },
    city: "Rio de Janeiro",
    location: "Centro",
    imageUrl: "/media/tours/centro/hero.webp",
    isPublished: true,
    operationType: "OWN",
    partner: null,
    priceCents: 65000,
    maxGuests: 4,
    schedules: [],
    ...overrides,
  };
}

/** Stores a trip row as the database would answer both the gate query (findFirst, where isPublished) and the booking read. */
function setTrip(row: ReturnType<typeof publicTrip> | null) {
  prismaMock.trip.findFirst.mockImplementation(async ({ where }: { where: { id: string; isPublished?: boolean } }) =>
    row && row.id === where.id && (where.isPublished === undefined || row.isPublished === where.isPublished) ? row : null,
  );
  prismaMock.trip.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => (row && row.id === where.id ? row : null));
}

describe("RT-110: the booking API applies the public catalog gate on the server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    priceGuard.blocked = false;
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.booking.create.mockResolvedValue({ id: "b1" });
  });

  it("accepts a trip that is visible in the public catalog", async () => {
    setTrip(publicTrip());
    await createBookingForUser("user-1", { tripId: CENTRO, guestCount: 2 });
    expect(prismaMock.booking.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.booking.create.mock.calls[0][0].data).toMatchObject({ status: "PENDING", paymentStatus: "UNPAID", guestCount: 2 });
  });

  const hidden: Array<[string, Record<string, unknown>]> = [
    ["unpublished (isPublished = false)", { isPublished: false }],
    ["outside the launch allowlist", { id: "cm-not-in-the-launch-set" }],
    ["PARTNER with an inactive partner", { operationType: "PARTNER", partner: { status: "INACTIVE", publicLabel: { pt: "Op", en: "Op", es: "Op" } } }],
    ["PARTNER without a partner row", { operationType: "PARTNER", partner: null }],
    ["outside Rio de Janeiro", { city: "São Paulo" }],
    ["a test/artifact record", { title: { pt: "Passeio teste", en: "x", es: "x" } }],
    ["placeholder media", { imageUrl: "/images/placeholder.svg" }],
    ["incomplete data (no PT description)", { description: { pt: "", en: "x", es: "x" } }],
  ];

  for (const [label, overrides] of hidden) {
    it(`rejects a trip ${label} with 404 TRIP_NOT_FOUND and writes nothing`, async () => {
      const trip = publicTrip(overrides);
      setTrip(trip);
      await expect(createBookingForUser("user-1", { tripId: String(trip.id), guestCount: 1 })).rejects.toMatchObject({ code: "TRIP_NOT_FOUND", status: 404 });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.booking.create).not.toHaveBeenCalled();
    });
  }

  it("answers a hidden trip exactly like a missing one through POST /api/bookings (no existence leak)", async () => {
    setTrip(publicTrip({ isPublished: false }));
    const hiddenRes = await POST(new Request("http://test.local/api/bookings", { method: "POST", body: JSON.stringify({ tripId: CENTRO }) }));
    setTrip(null);
    const missingRes = await POST(new Request("http://test.local/api/bookings", { method: "POST", body: JSON.stringify({ tripId: "cm-missing" }) }));
    expect(hiddenRes.status).toBe(404);
    expect(missingRes.status).toBe(404);
    expect(await hiddenRes.json()).toEqual(await missingRes.json());
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["no tripId", JSON.stringify({ guestCount: 1 })],
    ["guestCount as a string", JSON.stringify({ tripId: CENTRO, guestCount: "2" })],
    ["fractional guestCount", JSON.stringify({ tripId: CENTRO, guestCount: 0.5 })],
    ["guestCount zero", JSON.stringify({ tripId: CENTRO, guestCount: 0 })],
    ["a JSON array", JSON.stringify([CENTRO])],
  ])("answers 400 to a malformed body (%s) without reading the database", async (_label, body) => {
    setTrip(publicTrip());
    const res = await POST(new Request("http://test.local/api/bookings", { method: "POST", body }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Dados da reserva invalidos" });
    expect(prismaMock.trip.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("keeps the price guard first: with the guard on, the database is not read", async () => {
    priceGuard.blocked = true;
    await expect(createBookingForUser("user-1", { tripId: CENTRO })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED", status: 409 });
    expect(prismaMock.trip.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.trip.findUnique).not.toHaveBeenCalled();
  });
});

describe("Booking write is serialized (no overbooking or duplicate under concurrency)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    priceGuard.blocked = false;
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.booking.create.mockResolvedValue({ id: "b1" });
  });

  it("takes the advisory lock inside the transaction before the checks and the insert", async () => {
    const order: string[] = [];
    setTrip(publicTrip({ schedules: [{ id: "s1" }] }));
    prismaMock.$queryRaw
      .mockImplementationOnce(async () => (order.push("lock-timeout"), [{ lock_timeout: "2s" }]))
      .mockImplementationOnce(async () => (order.push("lock"), [{ locked: 1 }]));
    prismaMock.booking.findFirst.mockImplementationOnce(async () => (order.push("duplicate-check"), null));
    prismaMock.tripSchedule.findUnique.mockImplementationOnce(async () => (order.push("schedule"), { id: "s1", tripId: CENTRO, capacity: 4, pricePerPersonCents: 1000, status: "OPEN", startAt: new Date(Date.now() + 7 * 86_400_000) }));
    prismaMock.booking.aggregate.mockImplementationOnce(async () => (order.push("capacity"), { _sum: { guestCount: 0 } }));
    prismaMock.booking.create.mockImplementationOnce(async () => (order.push("insert"), { id: "b1" }));

    await createBookingForUser("user-1", { tripId: CENTRO, scheduleId: "s1", guestCount: 2 });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    // The lock wait is bounded first (transaction-local lock_timeout), then the lock is taken before any check.
    expect(order.slice(0, 2)).toEqual(["lock-timeout", "lock"]);
    expect(order.at(-1)).toBe("insert");
    const sql = (prismaMock.$queryRaw.mock.calls[1][0] as TemplateStringsArray).join("?");
    expect(sql).toContain("pg_advisory_xact_lock");
    expect(prismaMock.$queryRaw.mock.calls[1][1]).toBe(bookingLockKey("user-1", CENTRO, "s1"));
  });

  it("uses one key per schedule (shared by all users) and one per user+trip without a schedule", () => {
    expect(bookingLockKey("u1", "t1", "s1")).toBe(bookingLockKey("u2", "t1", "s1"));
    expect(bookingLockKey("u1", "t1")).not.toBe(bookingLockKey("u2", "t1"));
    expect(bookingLockKey("u1", "t1")).not.toBe(bookingLockKey("u1", "t2"));
  });

  it("rejects when the capacity read inside the lock is already used", async () => {
    setTrip(publicTrip({ schedules: [{ id: "s1" }] }));
    prismaMock.tripSchedule.findUnique.mockResolvedValue({ id: "s1", tripId: CENTRO, capacity: 4, pricePerPersonCents: 1000, status: "OPEN", startAt: new Date(Date.now() + 7 * 86_400_000) });
    prismaMock.booking.aggregate.mockResolvedValue({ _sum: { guestCount: 3 } });
    await expect(createBookingForUser("user-1", { tripId: CENTRO, scheduleId: "s1", guestCount: 2 })).rejects.toMatchObject({ code: "SCHEDULE_CAPACITY_EXCEEDED" });
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });
});
