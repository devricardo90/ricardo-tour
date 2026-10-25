import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";

/**
 * RT-124 private group booking engine on a REAL PostgreSQL. SKIPPED unless S11_LOCAL_DB_URL points at a disposable
 * local database (RT-104 guard, operation "write", runs first). The price table below is TEST ONLY: invented numbers
 * that exist only inside this file, injected into the engine; they are not a price and never an approval.
 */
const url = process.env.S11_LOCAL_DB_URL;

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const TEST_ONLY_TABLE = (tripId: string): ApprovedGroupPriceTable => ({
  id: "TEST-ONLY-TABLE",
  version: "test-1",
  tripId,
  currency: "BRL",
  groupTotalCents: { 1: 100_000, 2: 120_000, 3: 150_000, 4: 160_000 },
  depositBasisPoints: 3000,
  prepaidTicketsCents: { fullFare: 5_000, infant: 2_500 },
  approvalRecord: "TEST ONLY — not an approval",
});

type Service = typeof import("@/lib/services/private-booking.service");
type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("RT-124 private group booking (local isolated database only)", () => {
  let service: Service;
  let prisma: Client;
  const tag = `rt124-live-${Date.now()}`;
  let tripId = "";
  const scheduleIds: string[] = [];
  const userIds: string[] = [];
  const deps = () => ({ resolvePriceTable: (id: string) => (id === tripId ? TEST_ONLY_TABLE(tripId) : null) });
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const, pickupAddress: "Hotel em Copacabana" };
  const newSchedule = async (offsetDays = 7, capacity = 4) => {
    const schedule = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + offsetDays * 86_400_000), capacity, pricePerPersonCents: 0 },
    });
    scheduleIds.push(schedule.id);
    return schedule.id;
  };

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-124 private booking live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    service = await import("@/lib/services/private-booking.service");
    const trip = await prisma.trip.create({
      data: { city: "Rio de Janeiro", priceCents: 0, title: { pt: `Fixture ${tag}` }, highlights: [], isPublished: false, maxGuests: 4 },
    });
    tripId = trip.id;
    for (let i = 0; i < 8; i++) {
      userIds.push((await prisma.user.create({ data: { name: `Fixture ${i}`, email: `${tag}-${i}@example.invalid` } })).id);
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

  it("refuses every booking while no price table is approved (the real registry is empty)", async () => {
    const scheduleId = await newSchedule();
    await expect(
      service.createPrivateBookingForUser(userIds[0], { tripId, scheduleId, party: { fullFare: 2, infants: 0 }, contact }),
    ).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED", status: 409 });
    expect(await prisma.booking.count({ where: { tripId } })).toBe(0);
  });

  it("stores the booking, its immutable quote snapshot, the contact and a CREATED event in one write", async () => {
    const scheduleId = await newSchedule();
    const created = await service.createPrivateBookingForUser(userIds[0], { tripId, scheduleId, party: { fullFare: 2, infants: 1 }, contact }, deps());
    // 3 participants: P(3) = 150000 / 3 = 50000; total = 50000 × (2 + 0.5) = 125000; tickets 2×5000 + 2500 = 12500;
    // deposit = 12500 + 30% × 112500 = 46250; balance = 78750.
    expect(created).toMatchObject({ status: "PENDING", paymentStatus: "UNPAID", guestCount: 3, totalPriceCents: 125_000 });
    expect(created.quote).toMatchObject({ totalCents: 125_000, depositCents: 46_250, balanceCents: 78_750, priceTableId: "TEST-ONLY-TABLE" });

    const row = await prisma.booking.findUniqueOrThrow({ where: { id: created.id }, include: { quote: true, contact: true, events: true } });
    expect(row).toMatchObject({ pricingModel: "PRIVATE_GROUP", fullFareCount: 2, infantCount: 1 });
    expect(row.quote).toMatchObject({ participants: 3, groupTotalCents: 150_000, prepaidTicketsCents: 12_500, depositBasisPoints: 3000 });
    expect(row.contact).toMatchObject({ fullName: "Cliente Teste", language: "pt", pickupAddress: "Hotel em Copacabana" });
    expect(row.events.map((e) => [e.type, e.fromStatus, e.toStatus, e.actorRole])).toEqual([["CREATED", null, "PENDING", "USER"]]);

    // The snapshot and the history cannot be edited, even directly in the database.
    await expect(prisma.bookingQuote.update({ where: { bookingId: created.id }, data: { totalCents: 1 } })).rejects.toThrow(/immutable/);
    await expect(prisma.bookingEvent.updateMany({ where: { bookingId: created.id }, data: { type: "X" } })).rejects.toThrow(/immutable/);
    // An inconsistent quote or composition is refused by the database itself.
    await expect(prisma.booking.update({ where: { id: created.id }, data: { guestCount: 9 } })).rejects.toThrow(/Booking_private_group_check/);
  });

  it("one private group per slot: N concurrent customers on one schedule -> exactly one booking; same customer twice -> DUPLICATE", async () => {
    const scheduleId = await newSchedule();
    const results = await Promise.allSettled(
      userIds.map((userId) => service.createPrivateBookingForUser(userId, { tripId, scheduleId, party: { fullFare: 2, infants: 0 }, contact }, deps())),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const codes = results.flatMap((r) => (r.status === "rejected" ? [(r.reason as { code?: string }).code] : []));
    expect(ok).toHaveLength(1);
    expect(codes.every((c) => c === "SCHEDULE_UNAVAILABLE" || c === "BOOKING_BUSY")).toBe(true);
    expect(await prisma.booking.count({ where: { scheduleId, status: { in: ["PENDING", "CONFIRMED"] } } })).toBe(1);

    const winner = (await prisma.booking.findFirstOrThrow({ where: { scheduleId } })).userId;
    await expect(
      service.createPrivateBookingForUser(winner, { tripId, scheduleId, party: { fullFare: 1, infants: 0 }, contact }, deps()),
    ).rejects.toMatchObject({ code: "DUPLICATE_BOOKING", status: 409 });
  }, 60_000);

  it("a canceled booking frees the slot, and the cancellation is recorded in the history", async () => {
    const scheduleId = await newSchedule();
    const first = await service.createPrivateBookingForUser(userIds[1], { tripId, scheduleId, party: { fullFare: 1, infants: 0 }, contact }, deps());
    const { cancelBookingForUser } = await import("@/lib/services/booking.service");
    await cancelBookingForUser(userIds[1], first.id);
    const events = await prisma.bookingEvent.findMany({ where: { bookingId: first.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((e) => [e.type, e.fromStatus, e.toStatus, e.actorRole])).toEqual([
      ["CREATED", null, "PENDING", "USER"],
      ["CANCELED_BY_USER", "PENDING", "CANCELED", "USER"],
    ]);
    await expect(
      service.createPrivateBookingForUser(userIds[2], { tripId, scheduleId, party: { fullFare: 2, infants: 0 }, contact }, deps()),
    ).resolves.toMatchObject({ status: "PENDING" });
  });

  it("capacity, composition, past dates and malformed input are refused before anything is written", async () => {
    const small = await newSchedule(7, 2);
    const past = await newSchedule(-1);
    const before = await prisma.booking.count({ where: { tripId } });
    const attempt = (userId: string, input: Record<string, unknown>) => service.createPrivateBookingForUser(userId, input, deps());

    await expect(attempt(userIds[3], { tripId, scheduleId: small, party: { fullFare: 2, infants: 1 }, contact })).rejects.toMatchObject({ code: "SCHEDULE_CAPACITY_EXCEEDED" });
    await expect(attempt(userIds[3], { tripId, scheduleId: small, party: { fullFare: 0, infants: 2 }, contact })).rejects.toMatchObject({ status: 400 });
    await expect(attempt(userIds[3], { tripId, scheduleId: small, party: { fullFare: 4, infants: 1 }, contact })).rejects.toMatchObject({ code: "PARTY_TOO_LARGE" });
    await expect(attempt(userIds[3], { tripId, scheduleId: past, party: { fullFare: 1, infants: 0 }, contact })).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" });
    for (const bad of [
      { tripId, scheduleId: small, party: { fullFare: 1.5, infants: 0 }, contact },
      { tripId, scheduleId: small, party: { fullFare: 1, infants: 0 }, contact: { ...contact, phone: "call me" } },
      { tripId, scheduleId: small, party: { fullFare: 1, infants: 0 }, contact: { ...contact, language: "fr" } },
      { tripId, scheduleId: small, party: { fullFare: 1, infants: 0 }, contact: { ...contact, fullName: "A\u0000B" } },
      { tripId, scheduleId: small, party: { fullFare: 1, infants: 0 } },
    ]) {
      await expect(attempt(userIds[3], bad)).rejects.toMatchObject({ code: "INVALID_BOOKING_INPUT", status: 400 });
    }
    expect(await prisma.booking.count({ where: { tripId } })).toBe(before);
  });
});
