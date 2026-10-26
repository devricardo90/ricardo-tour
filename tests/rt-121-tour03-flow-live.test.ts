import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * RT-121 first complete commercial test flow: TOUR-03 4 hours on a REAL PostgreSQL, quoted from the REAL approved
 * registry (no injected table). SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (RT-104 guard,
 * operation "write", runs first). Payment rows are permanent by design, so the database is dropped afterwards.
 * Customers, contacts and payment references are fictitious; nothing is charged and no message is sent.
 */
const url = process.env.S11_LOCAL_DB_URL;
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";
const TOUR_01 = "cmlhxkpy9000028zq27rhytew";

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const key = () => randomUUID().replace(/-/g, "");

type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("RT-121 TOUR-03 4 h complete flow (local isolated database only)", () => {
  let prisma: Client;
  let engine: typeof import("@/lib/services/private-booking.service");
  let payments: typeof import("@/lib/services/booking-payment.service");
  let bookings: typeof import("@/lib/services/booking.service");
  const tag = `rt121-live-${Date.now()}`;
  let admin: { userId: string; role: "ADMIN" };
  const customers: string[] = [];
  let day = 0;
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const, pickupAddress: "Hotel no Centro (teste)" };

  const newSchedule = async (tripId = TOUR_03) =>
    (await prisma.tripSchedule.create({
      data: { tripId, startAt: new Date(Date.now() + (14 + ++day) * 86_400_000), capacity: 4, pricePerPersonCents: 0 },
    })).id;
  const record = (bookingId: string, kind: "DEPOSIT" | "BALANCE", amountCents: number, method = "PIX") =>
    payments.recordBookingPayment(admin, { bookingId, kind, method, amountCents, initialStatus: "RECORDED", reference: `TESTE-${kind}`, idempotencyKey: key() });
  const confirm = (paymentId: string) => payments.transitionBookingPayment(admin, { paymentId, to: "CONFIRMED", idempotencyKey: key() });
  const state = (id: string) => prisma.booking.findUniqueOrThrow({ where: { id }, select: { status: true, paymentStatus: true } });

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-121 TOUR-03 flow live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    engine = await import("@/lib/services/private-booking.service");
    payments = await import("@/lib/services/booking-payment.service");
    bookings = await import("@/lib/services/booking.service");
    for (const [id, name] of [[TOUR_03, "TOUR-03 fixture"], [TOUR_01, "TOUR-01 fixture"]]) {
      await prisma.trip.upsert({
        where: { id },
        update: {},
        create: { id, city: "Rio de Janeiro", priceCents: 0, title: { pt: `${name} ${tag}` }, highlights: [], isPublished: false, maxGuests: 4 },
      });
    }
    admin = { userId: (await prisma.user.create({ data: { name: "Admin Teste", email: `${tag}-admin@example.invalid`, role: "ADMIN" } })).id, role: "ADMIN" };
    for (let i = 0; i < 6; i++) customers.push((await prisma.user.create({ data: { name: `Cliente ${i}`, email: `${tag}-${i}@example.invalid` } })).id);
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it.each([
    [1, 65_000, 19_500, 45_500],
    [2, 76_000, 22_800, 53_200],
    [3, 90_000, 27_000, 63_000],
    [4, 104_000, 31_200, 72_800],
  ])("%i person(s): stores total %i, deposit %i and balance %i in the snapshot", async (people, total, deposit, balance) => {
    const created = await engine.createPrivateBookingForUser(customers[people - 1], { tripId: TOUR_03, scheduleId: await newSchedule(), priceTableId: "TOUR-03-4H", party: { fullFare: people, infants: 0 }, contact });
    expect(created).toMatchObject({ status: "PENDING", paymentStatus: "UNPAID", guestCount: people, totalPriceCents: total });
    const quote = await prisma.bookingQuote.findUniqueOrThrow({ where: { bookingId: created.id } });
    expect(quote).toMatchObject({
      priceTableId: "TOUR-03-4H",
      priceTableVersion: "2026-10-26",
      participants: people,
      groupTotalCents: total,
      totalCents: total,
      prepaidTicketsCents: 0,
      depositBasisPoints: 3000,
      depositCents: deposit,
      balanceCents: balance,
    });
    // The payment control reads the expected amounts from the snapshot.
    const overview = await payments.getBookingPaymentsOverview(admin, created.id);
    expect(overview?.summary).toMatchObject({ totalCents: total, deposit: { expectedCents: deposit, openCents: deposit }, balance: { expectedCents: balance, openCents: balance } });
    await expect(prisma.bookingQuote.update({ where: { bookingId: created.id }, data: { depositCents: 1 } })).rejects.toThrow(/immutable/);
  });

  it("deposit, then balance at the start of the tour: payments never confirm the booking; the admin does", async () => {
    const { id } = await engine.createPrivateBookingForUser(customers[4], { tripId: TOUR_03, scheduleId: await newSchedule(), party: { fullFare: 2, infants: 0 }, contact });

    await expect(record(id, "DEPOSIT", 22_801)).rejects.toMatchObject({ code: "AMOUNT_EXCEEDS_EXPECTED" });
    const deposit = await record(id, "DEPOSIT", 22_800);
    expect(await state(id)).toEqual({ status: "PENDING", paymentStatus: "UNPAID" });
    await confirm(deposit.payment.id);
    expect(await state(id)).toEqual({ status: "PENDING", paymentStatus: "PARTIAL" });

    // Balance received in cash at the meeting point, then confirmed by the admin.
    const balance = await record(id, "BALANCE", 53_200, "CASH");
    await confirm(balance.payment.id);
    expect(await state(id)).toEqual({ status: "PENDING", paymentStatus: "PAID" });

    // Confirming the booking is a separate administrative action, and it does not touch the payments.
    await bookings.confirmBookingByAdmin(id, { userId: admin.userId, role: "ADMIN" });
    expect(await state(id)).toEqual({ status: "CONFIRMED", paymentStatus: "PAID" });
    const history = await prisma.bookingPaymentEvent.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" } });
    expect(history.map((e) => `${e.type}:${e.toStatus}:${e.amountCents}`)).toEqual([
      "CREATED:RECORDED:22800",
      "CONFIRMED:CONFIRMED:22800",
      "CREATED:RECORDED:53200",
      "CONFIRMED:CONFIRMED:53200",
    ]);
    expect(history.every((e) => e.actorUserId === admin.userId)).toBe(true);
  });

  it("refusals: children 0-2 (no TOUR-03 child rule), 5 people, the 6-hour option and TOUR-01 (price pending)", async () => {
    const scheduleId = await newSchedule();
    await expect(engine.createPrivateBookingForUser(customers[5], { tripId: TOUR_03, scheduleId, party: { fullFare: 2, infants: 1 }, contact })).rejects.toMatchObject({ code: "CHILD_POLICY_NOT_APPROVED" });
    await expect(engine.createPrivateBookingForUser(customers[5], { tripId: TOUR_03, scheduleId, party: { fullFare: 5, infants: 0 }, contact })).rejects.toMatchObject({ code: "PARTY_TOO_LARGE" });
    await expect(engine.createPrivateBookingForUser(customers[5], { tripId: TOUR_03, scheduleId, priceTableId: "TOUR-03-6H", party: { fullFare: 2, infants: 0 }, contact })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    await expect(engine.createPrivateBookingForUser(customers[5], { tripId: TOUR_01, scheduleId: await newSchedule(TOUR_01), party: { fullFare: 2, infants: 0 }, contact })).rejects.toMatchObject({ code: "PRICE_NOT_APPROVED" });
    expect(await prisma.booking.count({ where: { userId: customers[5] } })).toBe(0);
  });
});
