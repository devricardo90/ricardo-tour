import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  trip: { findUnique: vi.fn() },
  booking: { findFirst: vi.fn(), aggregate: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  tripSchedule: { findUnique: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/authz", () => ({ requireSession: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/observability/report", () => ({ reportServerError: vi.fn() }));

import { POST } from "@/app/api/bookings/route";
import { isBookingBlockedForUnapprovedPrice } from "@/lib/catalog/price-on-request";
import { createBookingForUser } from "@/lib/services/booking.service";

const CRISTO = "cmlhxkpy9000028zq27rhytew";
const CATALOG = ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];
const OTHER = "trip-not-in-the-own-catalog";

describe("RT-110 (local, Owner 18/10/2026): no new booking for a tour without an approved commercial price", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks TOUR-01 in the service before any database access", async () => {
    await expect(createBookingForUser("user-1", { tripId: CRISTO, guestCount: 2 })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED", status: 409 });
    expect(prismaMock.trip.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
    // Whitespace around the id cannot bypass the guard (the service trims the id first).
    await expect(createBookingForUser("user-1", { tripId: `  ${CRISTO} ` })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
  });

  it("returns 409 from POST /api/bookings (server-side, independent of the interface) and creates nothing", async () => {
    const res = await POST(new Request("http://test.local/api/bookings", { method: "POST", body: JSON.stringify({ tripId: CRISTO, guestCount: 1 }) }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/solicitacao de disponibilidade/);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it("blocks all four own-catalog tours (none has an approved price stored)", async () => {
    for (const id of CATALOG) {
      expect(isBookingBlockedForUnapprovedPrice(id), id).toBe(true);
      await expect(createBookingForUser("user-1", { tripId: id })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    }
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it("leaves any other trip on the existing flow", async () => {
    expect(isBookingBlockedForUnapprovedPrice(OTHER)).toBe(false);
    prismaMock.trip.findUnique.mockResolvedValue({ id: OTHER, priceCents: 12000, maxGuests: null, schedules: [] });
    prismaMock.booking.findFirst.mockResolvedValue(null);
    prismaMock.booking.create.mockResolvedValue({ id: "b1" });
    await createBookingForUser("user-1", { tripId: OTHER, guestCount: 2 });
    expect(prismaMock.booking.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.booking.create.mock.calls[0][0].data.totalPriceCents).toBe(24000);
  });

  it("does not touch existing bookings (no update/cancel path is involved)", async () => {
    await expect(createBookingForUser("user-1", { tripId: CRISTO })).rejects.toBeTruthy();
    expect(prismaMock.booking.update).not.toHaveBeenCalled();
    expect(prismaMock.booking.findUnique).not.toHaveBeenCalled();
  });
});
