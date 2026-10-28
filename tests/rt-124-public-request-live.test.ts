import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { guideDayPicker } from "./helpers/guide-day";

/**
 * RT-124 public booking request (27/10/2026) on a REAL PostgreSQL with the REAL approved registry (TOUR-03 4 h).
 * SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (RT-104 guard, operation "write", runs first).
 * Customers, contacts and payment references are fictitious; nothing is charged and no message is sent.
 */
const url = process.env.S11_LOCAL_DB_URL;
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const key = () => randomUUID().replace(/-/g, "");
type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("RT-124 public booking request (local isolated database only)", () => {
  let prisma: Client;
  let requests: typeof import("@/lib/services/private-booking-request.service");
  let payments: typeof import("@/lib/services/booking-payment.service");
  let bookings: typeof import("@/lib/services/booking.service");
  let admin: { userId: string; role: "ADMIN" };
  const tag = `rt124-request-${Date.now()}`;
  // A free guide day per test (YYYY-MM-DD in Rio): one departure per guide per day, also across earlier runs.
  let nextDay: () => Promise<string>;
  const contact = (n: number) => ({ fullName: `Cliente Site ${n}`, email: `${tag}-${n}@example.invalid`, phone: "+55 21 98888-0000", language: "pt" as const, pickupAddress: "Hotel no Centro (teste)" });

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-124 public request live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    nextDay = guideDayPicker(prisma, 121, 240);
    requests = await import("@/lib/services/private-booking-request.service");
    payments = await import("@/lib/services/booking-payment.service");
    bookings = await import("@/lib/services/booking.service");
    // Other live suites create the same fixture trip in parallel: insert it once, never fail on a concurrent insert.
    await prisma.$executeRaw`INSERT INTO "Trip" ("id", "city", "priceCents", "title", "highlights", "isPublished", "maxGuests", "updatedAt")
      VALUES (${TOUR_03}, 'Rio de Janeiro', 0, ${JSON.stringify({ pt: `TOUR-03 fixture ${tag}` })}::jsonb, '[]'::jsonb, false, 4, now())
      ON CONFLICT ("id") DO NOTHING`;
    admin = { userId: (await prisma.user.create({ data: { name: "Admin Teste", email: `${tag}-admin@example.invalid`, role: "ADMIN" } })).id, role: "ADMIN" };
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("a request without an account creates a PENDING booking with the approved quote, the contact e-mail and the day's slot", async () => {
    const date = await nextDay();
    const created = await requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 3, contact: contact(1) });
    expect(created).toMatchObject({ status: "PENDING", paymentStatus: "UNPAID", guestCount: 3, totalPriceCents: 90_000 });
    expect(created.quote).toMatchObject({ totalCents: 90_000, depositCents: 27_000, balanceCents: 63_000, priceTableId: "TOUR-03-4H" });

    const row = await prisma.booking.findUniqueOrThrow({
      where: { id: created.id },
      select: { pricingModel: true, user: { select: { email: true } }, contact: true, schedule: { select: { startAt: true, capacity: true, pricePerPersonCents: true } } },
    });
    expect(row.pricingModel).toBe("PRIVATE_GROUP");
    expect(row.user.email).toBe(requests.GUEST_REQUEST_OWNER_EMAIL);
    expect(row.contact).toMatchObject({ fullName: "Cliente Site 1", email: `${tag}-1@example.invalid`, phone: "+55 21 98888-0000", language: "pt" });
    // Slot: 09:00 in Rio (PROVISIONAL, RT-123), capacity 4, no legacy per-person price.
    expect(row.schedule).toMatchObject({ startAt: new Date(`${date}T12:00:00.000Z`), capacity: 4, pricePerPersonCents: 0 });
    // No account is created for the customer's e-mail: they stay free to register with it.
    expect(await prisma.user.count({ where: { email: `${tag}-1@example.invalid` } })).toBe(0);
  });

  it("one private group per tour per day: a second request for the same day is refused and no second slot is created", async () => {
    const date = await nextDay();
    await requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 2, contact: contact(2) });
    await expect(requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 1, contact: contact(3) })).rejects.toMatchObject({ status: 409 });
    expect(await prisma.tripSchedule.count({ where: { tripId: TOUR_03, startAt: new Date(`${date}T12:00:00.000Z`) } })).toBe(1);
  });

  it("concurrent requests for the same free day: exactly one booking and one slot", async () => {
    const date = await nextDay();
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) => requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 2, contact: contact(10 + i) })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const startAt = new Date(`${date}T12:00:00.000Z`);
    expect(await prisma.tripSchedule.count({ where: { tripId: TOUR_03, startAt } })).toBe(1);
    expect(await prisma.booking.count({ where: { tripId: TOUR_03, schedule: { startAt }, status: { in: ["PENDING", "CONFIRMED"] } } })).toBe(1);
  }, 30_000);

  it("a canceled request frees the day for a new request", async () => {
    const date = await nextDay();
    const first = await requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 2, contact: contact(20) });
    await bookings.cancelBookingByAdmin(first.id, admin);
    const second = await requests.createPublicBookingRequest({ tripId: TOUR_03, date, fullFare: 4, contact: contact(21) });
    expect(second).toMatchObject({ status: "PENDING", totalPriceCents: 104_000 });
  });

  it("MVP policy: the booking is confirmed only after the full 30% deposit is VERIFIED, and only by the admin", async () => {
    const { id } = await requests.createPublicBookingRequest({ tripId: TOUR_03, date: await nextDay(), fullFare: 3, contact: contact(30) });
    const state = () => prisma.booking.findUniqueOrThrow({ where: { id }, select: { status: true, paymentStatus: true } });
    const record = (amountCents: number) =>
      payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents, initialStatus: "RECORDED", reference: "TESTE-PIX", idempotencyKey: key() });
    const verify = (paymentId: string) => payments.transitionBookingPayment(admin, { paymentId, to: "CONFIRMED", idempotencyKey: key() });

    // Nothing received: refused.
    await expect(bookings.confirmBookingByAdmin(id, admin)).rejects.toMatchObject({ code: "DEPOSIT_NOT_CONFIRMED", status: 409 });
    // Deposit recorded but not verified: still refused.
    const part = await record(10_000);
    await expect(bookings.confirmBookingByAdmin(id, admin)).rejects.toMatchObject({ code: "DEPOSIT_NOT_CONFIRMED" });
    // Partial deposit verified: still refused.
    await verify(part.payment.id);
    await expect(bookings.confirmBookingByAdmin(id, admin)).rejects.toMatchObject({ code: "DEPOSIT_NOT_CONFIRMED" });
    expect(await state()).toEqual({ status: "PENDING", paymentStatus: "PARTIAL" });
    // Rest of the deposit verified: the payment alone does not confirm the booking; the admin does.
    const rest = await record(17_000);
    await verify(rest.payment.id);
    expect(await state()).toEqual({ status: "PENDING", paymentStatus: "PARTIAL" });
    await expect(bookings.confirmBookingByAdmin(id, admin)).resolves.toMatchObject({ status: "CONFIRMED", paymentStatus: "PARTIAL" });
    // Balance at the start of the tour.
    const balance = await payments.recordBookingPayment(admin, { bookingId: id, kind: "BALANCE", method: "CASH", amountCents: 63_000, initialStatus: "RECORDED", reference: "TESTE-RECIBO", idempotencyKey: key() });
    await verify(balance.payment.id);
    expect(await state()).toEqual({ status: "CONFIRMED", paymentStatus: "PAID" });
  });

  it("a legacy (non-private) booking keeps the previous confirmation rule", async () => {
    const user = await prisma.user.create({ data: { name: "Cliente legado", email: `${tag}-legacy@example.invalid` } });
    const legacy = await prisma.booking.create({ data: { userId: user.id, tripId: TOUR_03, guestCount: 1, totalPriceCents: 1, status: "PENDING", paymentStatus: "UNPAID" } });
    await expect(bookings.confirmBookingByAdmin(legacy.id, admin)).resolves.toMatchObject({ status: "CONFIRMED" });
  });
});
