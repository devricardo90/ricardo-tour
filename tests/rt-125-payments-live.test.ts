import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";

/**
 * RT-125 manual payments on a REAL PostgreSQL. SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database
 * (RT-104 guard, operation "write", runs first). The price table is TEST ONLY: invented numbers living only in this file,
 * injected into the RT-124 engine to create a private booking with a quote; never a price, never an approval.
 * Rows with payments are never deleted (the financial history is permanent by design); the database is thrown away.
 */
const url = process.env.S11_LOCAL_DB_URL;

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const key = () => randomUUID().replace(/-/g, "");
const TEST_ONLY_TABLE = (tripId: string): ApprovedGroupPriceTable => ({
  id: "TEST-ONLY-TABLE",
  version: "test-1",
  tripId,
  currency: "BRL",
  groupTotalCents: { 1: 100_000, 2: 120_000, 3: 150_000, 4: 160_000 },
  childPolicy: "NOT_APPROVED",
  approvalRecord: "TEST ONLY — not an approval",
});

type Payments = typeof import("@/lib/services/booking-payment.service");
type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("RT-125 manual payments (local isolated database only)", () => {
  let payments: Payments;
  let prisma: Client;
  const tag = `rt125-live-${Date.now()}`;
  let tripId = "";
  let admin: { userId: string; role: "ADMIN" };
  let customerIds: string[] = [];
  let slot = 0;

  /** A fresh private booking: 2 participants -> total 120000, deposit 36000, balance 84000 (TEST ONLY numbers). */
  const newPrivateBooking = async () => {
    const schedule = await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + (10 + ++slot) * 86_400_000), capacity: 4, pricePerPersonCents: 0 },
    });
    const { createPrivateBookingForUser } = await import("@/lib/services/private-booking.service");
    const booking = await createPrivateBookingForUser(
      customerIds[slot % customerIds.length],
      { tripId, scheduleId: schedule.id, party: { fullFare: 2, infants: 0 }, contact: { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" } },
      { resolvePriceTable: (id) => (id === tripId ? TEST_ONLY_TABLE(tripId) : null) },
    );
    return booking.id;
  };
  const record = (bookingId: string, over: Record<string, unknown> = {}) =>
    payments.recordBookingPayment(admin, { bookingId, kind: "DEPOSIT", method: "PIX", amountCents: 36_000, initialStatus: "RECORDED", idempotencyKey: key(), ...over });
  const move = (paymentId: string, to: string, idempotencyKey = key()) => payments.transitionBookingPayment(admin, { paymentId, to, idempotencyKey });
  const bookingRow = (id: string) => prisma.booking.findUniqueOrThrow({ where: { id }, select: { status: true, paymentStatus: true } });

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-125 payments live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    payments = await import("@/lib/services/booking-payment.service");
    tripId = (await prisma.trip.create({
      data: { city: "Rio de Janeiro", priceCents: 0, title: { pt: `Fixture ${tag}` }, highlights: [], isPublished: false, maxGuests: 4 },
    })).id;
    const adminUser = await prisma.user.create({ data: { name: "Admin Teste", email: `${tag}-admin@example.invalid`, role: "ADMIN" } });
    admin = { userId: adminUser.id, role: "ADMIN" };
    customerIds = [];
    for (let i = 0; i < 3; i++) customerIds.push((await prisma.user.create({ data: { name: `Cliente ${i}`, email: `${tag}-${i}@example.invalid` } })).id);
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("the full lifecycle: recorded is not paid, confirmation is explicit, deposit and balance are separate, refund is recorded", async () => {
    const bookingId = await newPrivateBooking();
    const deposit = await record(bookingId);
    expect(deposit.replayed).toBe(false);
    // Recording a receipt confirms nothing: neither the payment status of the booking nor the booking itself.
    expect(await bookingRow(bookingId)).toEqual({ status: "PENDING", paymentStatus: "UNPAID" });

    await move(deposit.payment.id, "CONFIRMED");
    expect(await bookingRow(bookingId)).toEqual({ status: "PENDING", paymentStatus: "PARTIAL" });

    const balance = await record(bookingId, { kind: "BALANCE", method: "CARD_TERMINAL", amountCents: 84_000, initialStatus: "PENDING", reference: "NSU 004512" });
    await move(balance.payment.id, "RECORDED");
    await move(balance.payment.id, "CONFIRMED");
    expect((await bookingRow(bookingId)).paymentStatus).toBe("PAID");

    await move(balance.payment.id, "REFUNDED");
    expect((await bookingRow(bookingId)).paymentStatus).toBe("PARTIAL");

    const overview = await payments.getBookingPaymentsOverview(admin, bookingId);
    expect(overview?.summary).toMatchObject({ confirmedCents: 36_000, refundedCents: 84_000, deposit: { openCents: 0 }, balance: { openCents: 84_000 } });
    expect(overview?.events.map((e) => [e.type, e.fromStatus, e.toStatus, e.actorUserId === admin.userId])).toEqual([
      ["CREATED", null, "RECORDED", true],
      ["CONFIRMED", "RECORDED", "CONFIRMED", true],
      ["CREATED", null, "PENDING", true],
      ["RECORDED", "PENDING", "RECORDED", true],
      ["CONFIRMED", "RECORDED", "CONFIRMED", true],
      ["REFUNDED", "CONFIRMED", "REFUNDED", true],
    ]);
  });

  it("never more than the contracted deposit or balance; canceled lines free the amount", async () => {
    const bookingId = await newPrivateBooking();
    await expect(record(bookingId, { amountCents: 36_001 })).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_EXPECTED", status: 409 });
    const first = await record(bookingId, { amountCents: 20_000 });
    await expect(record(bookingId, { amountCents: 16_001 })).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_EXPECTED" });
    await record(bookingId, { amountCents: 16_000, method: "CASH" });
    await expect(record(bookingId, { amountCents: 1 })).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_EXPECTED" });
    await move(first.payment.id, "CANCELED");
    await expect(record(bookingId, { amountCents: 20_000 })).resolves.toMatchObject({ replayed: false });
    await expect(record(bookingId, { kind: "BALANCE", amountCents: 84_001 })).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_EXPECTED" });
  });

  it("idempotent: the same request twice registers once; the same key for something else is refused", async () => {
    const bookingId = await newPrivateBooking();
    const k = key();
    const a = await record(bookingId, { idempotencyKey: k, amountCents: 10_000 });
    const b = await record(bookingId, { idempotencyKey: k, amountCents: 10_000 });
    expect(b).toMatchObject({ replayed: true, payment: { id: a.payment.id } });
    await expect(record(bookingId, { idempotencyKey: k, amountCents: 10_001 })).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED" });
    const t = key();
    await move(a.payment.id, "CONFIRMED", t);
    await expect(move(a.payment.id, "CONFIRMED", t)).resolves.toMatchObject({ replayed: true });
    await expect(move(a.payment.id, "REFUNDED", t)).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED" });
    expect(await prisma.bookingPayment.count({ where: { bookingId } })).toBe(1);
    expect(await prisma.bookingPaymentEvent.count({ where: { bookingId } })).toBe(2);
  });

  it("concurrency: 8 simultaneous full-deposit registrations -> exactly one; 6 parallel replays of one key -> one row", async () => {
    const bookingId = await newPrivateBooking();
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => record(bookingId)));
    const codes = results.flatMap((r) => (r.status === "rejected" ? [(r.reason as { code?: string }).code] : []));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(codes.every((c) => c === "AMOUNT_EXCEEDS_EXPECTED" || c === "BOOKING_BUSY")).toBe(true);
    const active = await prisma.bookingPayment.aggregate({ where: { bookingId, status: { in: ["PENDING", "RECORDED", "CONFIRMED"] } }, _sum: { amountCents: true } });
    expect(active._sum.amountCents).toBe(36_000);

    const other = await newPrivateBooking();
    const k = key();
    const replays = await Promise.allSettled(Array.from({ length: 6 }, () => record(other, { idempotencyKey: k, amountCents: 5_000 })));
    expect(replays.every((r) => r.status === "fulfilled" || (r.reason as { code?: string }).code === "BOOKING_BUSY")).toBe(true);
    expect(await prisma.bookingPayment.count({ where: { bookingId: other } })).toBe(1);
  }, 60_000);

  it("rollback: when the history row cannot be written, the payment line is not written either", async () => {
    const bookingId = await newPrivateBooking();
    const first = await record(bookingId, { amountCents: 1_000 });
    const transitionKey = key();
    await move(first.payment.id, "CONFIRMED", transitionKey);
    // A new line whose key already belongs to a history row: the line insert succeeds, the event insert violates the
    // unique key, and the whole transaction rolls back.
    await expect(record(bookingId, { idempotencyKey: transitionKey, amountCents: 2_000 })).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED" });
    expect(await prisma.bookingPayment.count({ where: { bookingId } })).toBe(1);
    expect((await bookingRow(bookingId)).paymentStatus).toBe("PARTIAL");
  });

  it("refuses card numbers, non-private bookings, canceled bookings and invalid transitions, writing nothing", async () => {
    const bookingId = await newPrivateBooking();
    await expect(record(bookingId, { method: "CARD_TERMINAL", reference: "4111 1111 1111 1111" })).rejects.toMatchObject({ code: "CARD_DATA_REFUSED", status: 400 });
    const legacy = await prisma.booking.create({ data: { userId: customerIds[0], tripId, guestCount: 1, totalPriceCents: 1000 } });
    await expect(record(legacy.id)).rejects.toMatchObject({ code: "PAYMENTS_REQUIRE_PRIVATE_QUOTE" });
    await expect(record("missing-booking")).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND", status: 404 });

    const line = await record(bookingId, { amountCents: 1_000 });
    await move(line.payment.id, "CONFIRMED");
    await expect(move(line.payment.id, "CANCELED")).rejects.toMatchObject({ code: "INVALID_PAYMENT_TRANSITION" });
    await expect(move(line.payment.id, "RECORDED")).rejects.toMatchObject({ code: "INVALID_PAYMENT_TRANSITION" });

    const { cancelBookingByAdmin } = await import("@/lib/services/booking.service");
    await cancelBookingByAdmin(bookingId, admin);
    await expect(record(bookingId, { amountCents: 1_000 })).rejects.toMatchObject({ code: "BOOKING_CANCELED" });
    await expect(move(line.payment.id, "REFUNDED")).resolves.toMatchObject({ replayed: false }); // refund stays possible
    expect(await prisma.bookingPayment.count({ where: { bookingId } })).toBe(1);
  });

  it("the database itself refuses silent edits or deletions of the financial records", async () => {
    const bookingId = await newPrivateBooking();
    const line = await record(bookingId, { amountCents: 1_000 });
    await expect(prisma.bookingPayment.update({ where: { id: line.payment.id }, data: { amountCents: 1 } })).rejects.toThrow(/only the status may change/);
    await expect(prisma.bookingPayment.update({ where: { id: line.payment.id }, data: { status: "REFUNDED" } })).rejects.toThrow(/not allowed/);
    await expect(prisma.bookingPayment.delete({ where: { id: line.payment.id } })).rejects.toThrow(/never deleted/);
    await expect(prisma.bookingPaymentEvent.updateMany({ where: { bookingId }, data: { amountCents: 1 } })).rejects.toThrow(/append-only/);
    await expect(prisma.bookingPaymentEvent.deleteMany({ where: { bookingId } })).rejects.toThrow(/append-only/);
    // A booking with financial records cannot be deleted (no cascade over the history).
    await expect(prisma.booking.delete({ where: { id: bookingId } })).rejects.toThrow();
    expect(await prisma.bookingPaymentEvent.count({ where: { bookingId } })).toBe(1);
  });
});
