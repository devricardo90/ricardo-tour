import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  trip: {
    findUnique: vi.fn(),
  },
  booking: {
    findFirst: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  tripSchedule: {
    findUnique: vi.fn(),
  },
  $queryRaw: vi.fn(async () => [{ locked: 1 }]),
  // Interactive transaction: the callback receives the same client mock (tx === prisma in these unit tests).
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prismaMock)),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// These tests cover the booking rules on an arbitrary trip; the RT-110 public gate is tested on its own
// (tests/rt-110-booking-public-gate.test.ts), so here it lets every trip through.
vi.mock("@/lib/catalog/public-trips", () => ({
  getPublicTripById: vi.fn(async (id: string) => ({ id })),
}));

import { DomainError } from "@/lib/errors/domain-error";
import {
  BOOKING_LOCK_TIMEOUT,
  BOOKING_TRANSACTION_OPTIONS,
  cancelBookingByAdmin,
  cancelBookingForUser,
  confirmBookingByAdmin,
  createBookingForUser,
} from "@/lib/services/booking.service";

describe("booking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("requires a schedule when the trip has open schedules", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      priceCents: 10000,
      maxGuests: 10,
      schedules: [{ id: "schedule-1" }],
    });

    await expect(createBookingForUser("user-1", { tripId: "trip-1" })).rejects.toMatchObject({
      code: "SCHEDULE_REQUIRED",
    } satisfies Partial<DomainError>);
  });

  it("blocks duplicate bookings for the same schedule", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      priceCents: 10000,
      maxGuests: 10,
      schedules: [{ id: "schedule-1" }],
    });
    prismaMock.booking.findFirst.mockResolvedValue({ id: "booking-1" });

    await expect(
      createBookingForUser("user-1", { tripId: "trip-1", scheduleId: "schedule-1" })
    ).rejects.toMatchObject({
      code: "DUPLICATE_BOOKING",
    } satisfies Partial<DomainError>);
  });

  it("blocks booking when schedule capacity is exceeded", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      priceCents: 10000,
      maxGuests: 10,
      schedules: [{ id: "schedule-1" }],
    });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.tripSchedule.findUnique.mockResolvedValue({
      id: "schedule-1",
      tripId: "trip-1",
      capacity: 4,
      pricePerPersonCents: 12000,
      status: "OPEN",
      startAt: new Date(Date.now() + 7 * 86_400_000),
    });
    prismaMock.booking.aggregate.mockResolvedValue({
      _sum: { guestCount: 3 },
    });

    await expect(
      createBookingForUser("user-1", {
        tripId: "trip-1",
        scheduleId: "schedule-1",
        guestCount: 2,
      })
    ).rejects.toMatchObject({
      code: "SCHEDULE_CAPACITY_EXCEEDED",
    } satisfies Partial<DomainError>);
  });

  it("creates a pending unpaid booking with schedule price when valid", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({
      id: "trip-1",
      priceCents: 10000,
      maxGuests: 10,
      schedules: [{ id: "schedule-1" }],
    });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.tripSchedule.findUnique.mockResolvedValue({
      id: "schedule-1",
      tripId: "trip-1",
      capacity: 10,
      pricePerPersonCents: 15000,
      status: "OPEN",
      startAt: new Date(Date.now() + 7 * 86_400_000),
    });
    prismaMock.booking.aggregate.mockResolvedValue({
      _sum: { guestCount: 2 },
    });
    prismaMock.booking.create.mockResolvedValue({
      id: "booking-2",
      status: "PENDING",
      paymentStatus: "UNPAID",
      totalPriceCents: 30000,
    });

    const result = await createBookingForUser("user-1", {
      tripId: "trip-1",
      scheduleId: "schedule-1",
      guestCount: 2,
    });

    expect(prismaMock.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          paymentStatus: "UNPAID",
          totalPriceCents: 30000,
        }),
      })
    );
    expect(result).toMatchObject({
      id: "booking-2",
      status: "PENDING",
    });
  });

  it("blocks cancellation inside the 24h window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T10:00:00.000Z"));

    prismaMock.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      status: "PENDING",
      schedule: {
        startAt: new Date("2026-03-21T05:00:00.000Z"),
      },
    });

    await expect(cancelBookingForUser("user-1", "booking-1")).rejects.toMatchObject({
      code: "CANCELLATION_WINDOW_EXPIRED",
    } satisfies Partial<DomainError>);
  });

  it("another account's booking answers exactly like a missing one (RT-129: no id probing)", async () => {
    prismaMock.booking.findUnique.mockResolvedValueOnce(null);
    const missing = await cancelBookingForUser("user-1", "booking-x").catch((e: DomainError) => e);
    prismaMock.booking.findUnique.mockResolvedValueOnce({ id: "booking-2", userId: "user-2", status: "PENDING", schedule: null });
    const foreign = await cancelBookingForUser("user-1", "booking-2").catch((e: DomainError) => e);

    for (const error of [missing, foreign]) expect(error).toBeInstanceOf(DomainError);
    const shape = (e: DomainError) => ({ code: e.code, status: e.status, message: e.message });
    expect(shape(foreign as DomainError)).toEqual(shape(missing as DomainError));
    expect(shape(foreign as DomainError)).toEqual({ code: "BOOKING_NOT_FOUND", status: 404, message: "Reserva nao encontrada" });
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it("confirms pending bookings without changing payment status, with a write conditional on PENDING", async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      status: "PENDING",
      paymentStatus: "UNPAID",
    });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });

    const result = await confirmBookingByAdmin(" booking-1 ");

    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith({
      where: { id: "booking-1", status: "PENDING" },
      data: { status: "CONFIRMED" },
    });
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
    expect(result).toEqual({ id: "booking-1", status: "CONFIRMED", paymentStatus: "UNPAID" });
  });

  it("refuses to confirm a booking canceled between the read and the write (no resurrection, no overbooking)", async () => {
    prismaMock.booking.findUnique.mockResolvedValue({ id: "booking-1", status: "PENDING", paymentStatus: "UNPAID" });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 0 }); // a concurrent cancel already changed the row

    await expect(confirmBookingByAdmin("booking-1")).rejects.toMatchObject({
      code: "BOOKING_STATUS_CHANGED",
      status: 409,
    } satisfies Partial<DomainError>);
  });

  it("blocks admin confirmation unless the booking is pending", async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      status: "CONFIRMED",
    });

    await expect(confirmBookingByAdmin("booking-1")).rejects.toMatchObject({
      code: "INVALID_STATUS_FOR_CONFIRMATION",
    } satisfies Partial<DomainError>);
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it("allows admin cancellation for pending and confirmed bookings only, with a conditional write", async () => {
    prismaMock.booking.findUnique.mockResolvedValueOnce({
      id: "booking-1",
      status: "CONFIRMED",
    });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(cancelBookingByAdmin("booking-1")).resolves.toEqual({ id: "booking-1", status: "CANCELED" });

    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith({
      where: { id: "booking-1", status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELED" },
    });
  });

  it("treats an admin cancel that lost the race to another cancel as idempotent", async () => {
    prismaMock.booking.findUnique
      .mockResolvedValueOnce({ id: "booking-1", status: "PENDING" })
      .mockResolvedValueOnce({ status: "CANCELED" });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 0 });

    await expect(cancelBookingByAdmin("booking-1")).resolves.toEqual({ id: "booking-1", status: "CANCELED" });
  });

  it("cancels a user's own active booking with a write conditional on owner and status", async () => {
    prismaMock.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      status: "PENDING",
      schedule: { startAt: new Date(Date.now() + 7 * 86_400_000) },
    });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });

    await expect(cancelBookingForUser("user-1", "booking-1")).resolves.toEqual({ id: "booking-1", status: "CANCELED" });
    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith({
      where: { id: "booking-1", userId: "user-1", status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELED" },
    });
  });

  it.each([0.5, 0, -1, 1.5, Number.NaN, "2"])("refuses guestCount %s with 400 INVALID_GUEST_COUNT before the database", async (value) => {
    await expect(
      createBookingForUser("user-1", { tripId: "trip-1", scheduleId: "schedule-1", guestCount: value as number })
    ).rejects.toMatchObject({ code: "INVALID_GUEST_COUNT", status: 400 } satisfies Partial<DomainError>);
    expect(prismaMock.trip.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("refuses a schedule that already started even if it is still OPEN", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({ id: "trip-1", priceCents: 10000, maxGuests: 10, schedules: [{ id: "schedule-1" }] });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.tripSchedule.findUnique.mockResolvedValue({
      id: "schedule-1",
      tripId: "trip-1",
      capacity: 10,
      pricePerPersonCents: 15000,
      status: "OPEN",
      startAt: new Date(Date.now() - 60_000),
    });
    prismaMock.booking.aggregate.mockResolvedValue({ _sum: { guestCount: 0 } });

    await expect(
      createBookingForUser("user-1", { tripId: "trip-1", scheduleId: "schedule-1", guestCount: 1 })
    ).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" } satisfies Partial<DomainError>);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it("refuses a total that does not fit the INTEGER column instead of failing with a database error", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({ id: "trip-1", priceCents: 100_000_000, maxGuests: null, schedules: [] });
    prismaMock.booking.findFirst.mockResolvedValue(null);

    await expect(createBookingForUser("user-1", { tripId: "trip-1", guestCount: 50 })).rejects.toMatchObject({
      code: "INVALID_GUEST_COUNT",
    } satisfies Partial<DomainError>);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it.each([
    ["Prisma P2028 (transaction expired or no connection in time)", Object.assign(new Error("Transaction API error"), { code: "P2028" })],
    ["Postgres 55P03 lock_timeout", Object.assign(new Error("canceling statement due to lock timeout"), { cause: { originalCode: "55P03" } })],
  ])("maps %s to 409 BOOKING_BUSY", async (_label, failure) => {
    prismaMock.trip.findUnique.mockResolvedValue({ id: "trip-1", priceCents: 10000, maxGuests: 10, schedules: [] });
    prismaMock.$transaction.mockRejectedValueOnce(failure);

    await expect(createBookingForUser("user-1", { tripId: "trip-1", guestCount: 1 })).rejects.toMatchObject({
      code: "BOOKING_BUSY",
      status: 409,
    } satisfies Partial<DomainError>);
  });

  it("does not hide other database failures behind BOOKING_BUSY", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({ id: "trip-1", priceCents: 10000, maxGuests: 10, schedules: [] });
    const failure = Object.assign(new Error("connection refused"), { code: "ECONNREFUSED" });
    prismaMock.$transaction.mockRejectedValueOnce(failure);

    await expect(createBookingForUser("user-1", { tripId: "trip-1", guestCount: 1 })).rejects.toBe(failure);
  });

  it("bounds the lock wait inside the transaction and passes explicit transaction limits", async () => {
    prismaMock.trip.findUnique.mockResolvedValue({ id: "trip-1", priceCents: 10000, maxGuests: 10, schedules: [] });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.booking.create.mockResolvedValue({ id: "b1" });

    await createBookingForUser("user-1", { tripId: "trip-1", guestCount: 1 });

    const first = (prismaMock.$queryRaw.mock.calls[0] as unknown[])[0] as TemplateStringsArray;
    const second = (prismaMock.$queryRaw.mock.calls[1] as unknown[])[0] as TemplateStringsArray;
    expect(first.join("?")).toContain("set_config('lock_timeout'");
    expect((prismaMock.$queryRaw.mock.calls[0] as unknown[])[1]).toBe(BOOKING_LOCK_TIMEOUT);
    expect(second.join("?")).toContain("pg_advisory_xact_lock");
    expect((prismaMock.$transaction.mock.calls[0] as unknown[])[1]).toEqual(BOOKING_TRANSACTION_OPTIONS);
  });
});
