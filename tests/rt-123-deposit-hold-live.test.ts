import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";
import { DEPOSIT_HOLD_HOURS, INSTRUCTIONS_DUE_HOURS, depositHoldDeadline, holdDeadline, isDepositHoldExpired } from "@/lib/booking/deposit-hold";
import { guideDayPicker } from "./helpers/guide-day";

/**
 * RT-123 temporary hold (Owner decisions 28/10/2026 and 29/10/2026): a PENDING private request holds its date.
 * D1: the deposit instructions must be sent within 24 hours of the request, otherwise the hold lapses 24 hours after it.
 * Then the customer has 48 hours from the (first) sending; a payment canceled later does not restart the window (D2).
 * Payments registered or under verification protect the request; a CONFIRMED booking never expires.
 *
 * The LIVE block is SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (RT-104 guard first). TOUR-03
 * uses the REAL approved registry; the TOUR-01 table below is TEST ONLY (never a price, never an approval).
 */
const requested = new Date("2026-11-02T12:00:00Z");
const sent = new Date("2026-11-02T15:00:00Z");
const hold = (over: Partial<Parameters<typeof isDepositHoldExpired>[0]> = {}) => ({
  status: "PENDING",
  pricingModel: "PRIVATE_GROUP",
  requestedAt: requested,
  instructionsSentAt: sent,
  protectingPayments: 0,
  ...over,
});

describe("deposit hold rules", () => {
  it("lapses exactly 48 hours after the instructions were sent, and only then", () => {
    expect(DEPOSIT_HOLD_HOURS).toBe(48);
    expect(depositHoldDeadline(sent).toISOString()).toBe("2026-11-04T15:00:00.000Z");
    expect(isDepositHoldExpired(hold(), new Date("2026-11-04T14:59:59Z"))).toBe(false);
    expect(isDepositHoldExpired(hold(), new Date("2026-11-04T15:00:00Z"))).toBe(true);
  });

  it("D1: without instructions sent within 24 hours, the hold lapses 24 hours after the request", () => {
    expect(INSTRUCTIONS_DUE_HOURS).toBe(24);
    const none = hold({ instructionsSentAt: null });
    expect(holdDeadline(none).toISOString()).toBe("2026-11-03T12:00:00.000Z");
    expect(isDepositHoldExpired(none, new Date("2026-11-03T11:59:59Z"))).toBe(false);
    expect(isDepositHoldExpired(none, new Date("2026-11-03T12:00:00Z"))).toBe(true);
    // Instructions recorded only after the 24 hours do not revive the hold.
    const late = hold({ instructionsSentAt: new Date("2026-11-03T13:00:00Z") });
    expect(holdDeadline(late).toISOString()).toBe("2026-11-03T12:00:00.000Z");
  });

  it("never expires with a protecting payment, when confirmed or canceled, or for a legacy booking", () => {
    const later = new Date("2026-12-01T00:00:00Z");
    expect(isDepositHoldExpired(hold({ protectingPayments: 1 }), later)).toBe(false);
    expect(isDepositHoldExpired(hold({ instructionsSentAt: null, protectingPayments: 1 }), later)).toBe(false);
    expect(isDepositHoldExpired(hold({ status: "CONFIRMED" }), later)).toBe(false);
    expect(isDepositHoldExpired(hold({ status: "CANCELED" }), later)).toBe(false);
    expect(isDepositHoldExpired(hold({ pricingModel: "PER_PERSON" }), later)).toBe(false);
  });
});

const url = process.env.S11_LOCAL_DB_URL;
const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

const TEST_ONLY_TOUR01: ApprovedGroupPriceTable = {
  id: "TEST-ONLY-HOLD",
  version: "test-1",
  tripId: TOUR_01,
  currency: "BRL",
  groupTotalCents: { 1: 100_000, 2: 120_000, 3: 150_000, 4: 160_000 },
  childPolicy: "NOT_APPROVED",
  approvalRecord: "TEST ONLY — not an approval",
};

type Client = typeof import("@/lib/prisma")["prisma"];

describe.skipIf(!url)("deposit hold live (local isolated database only)", () => {
  let prisma: Client;
  let engine: typeof import("@/lib/services/private-booking.service");
  let hold: typeof import("@/lib/services/deposit-hold.service");
  let payments: typeof import("@/lib/services/booking-payment.service");
  let nextFreeGuideDay: () => Promise<string>;
  let admin: { userId: string; role: "ADMIN" };
  const tag = `rt123-hold-${Date.now()}`;
  let n = 0;
  const key = () => randomUUID().replace(/-/g, "");
  const contact = { fullName: "Cliente Teste", phone: "+55 21 99999-0000", language: "pt" as const };
  const customer = async () => (await prisma.user.create({ data: { name: `Cliente ${n}`, email: `${tag}-${n++}@example.invalid` } })).id;
  const slot = async (tripId: string, startAt: Date) => (await prisma.tripSchedule.create({ data: { tripId, startAt, capacity: 4, pricePerPersonCents: 0 } })).id;
  const hoursFromNow = (h: number) => () => new Date(Date.now() + h * 3_600_000);
  const tour03 = async (scheduleId: string, now?: () => Date) =>
    engine.createPrivateBookingForUser(await customer(), { tripId: TOUR_03, scheduleId, priceTableId: "TOUR-03-4H", party: { fullFare: 2, infants: 0 }, contact }, now ? { now } : {});
  const state = async (id: string) => prisma.booking.findUniqueOrThrow({ where: { id }, select: { status: true, paymentStatus: true } });
  const events = async (id: string) => (await prisma.bookingEvent.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" }, select: { type: true, actorRole: true } })).map((e) => `${e.type}:${e.actorRole}`);
  /** A free Rio day with a TOUR-03 slot at 09:00 and one PENDING request on it. */
  const pendingRequest = async () => {
    const day = await nextFreeGuideDay();
    const scheduleId = await slot(TOUR_03, new Date(`${day}T12:00:00.000Z`));
    const first = await tour03(scheduleId);
    return { day, scheduleId, id: first.id };
  };

  beforeAll(async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-123 deposit hold live test", url, env: { DATABASE_URL: url } });
    process.env.DATABASE_URL = url;
    prisma = (await import("@/lib/prisma")).prisma;
    engine = await import("@/lib/services/private-booking.service");
    hold = await import("@/lib/services/deposit-hold.service");
    payments = await import("@/lib/services/booking-payment.service");
    nextFreeGuideDay = guideDayPicker(prisma, 361, 600);
    for (const [id, name] of [[TOUR_01, "TOUR-01"], [TOUR_03, "TOUR-03"]]) {
      // Other live suites create the same fixture trips in parallel: insert once, never fail on a concurrent insert.
      await prisma.$executeRaw`INSERT INTO "Trip" ("id", "city", "priceCents", "title", "highlights", "isPublished", "maxGuests", "updatedAt")
        VALUES (${id}, 'Rio de Janeiro', 0, ${JSON.stringify({ pt: `${name} fixture ${tag}` })}::jsonb, '[]'::jsonb, false, 4, now())
        ON CONFLICT ("id") DO NOTHING`;
    }
    admin = { userId: (await prisma.user.create({ data: { name: "Admin Teste", email: `${tag}-admin@example.invalid`, role: "ADMIN" } })).id, role: "ADMIN" };
  }, 60_000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it("D1: without instructions sent, the date is held for 24 hours, then released; late instructions are refused", async () => {
    const { scheduleId, id } = await pendingRequest();
    await expect(tour03(scheduleId, hoursFromNow(23))).rejects.toMatchObject({ status: 409 });
    expect(await state(id)).toEqual({ status: "PENDING", paymentStatus: "UNPAID" });
    await expect(hold.markDepositInstructionsSent(id, admin, { now: hoursFromNow(25) })).rejects.toMatchObject({ code: "INSTRUCTIONS_DEADLINE_PASSED" });
    await expect(tour03(scheduleId, hoursFromNow(25))).resolves.toMatchObject({ status: "PENDING" });
    expect(await state(id)).toEqual({ status: "CANCELED", paymentStatus: "UNPAID" });
    expect(await events(id)).toEqual(["CREATED:USER", "EXPIRED:SYSTEM"]);
  });

  it("D1: a payment registered before the instructions protects the request past the 24 hours", async () => {
    const { scheduleId, id } = await pendingRequest();
    await payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() });
    await expect(tour03(scheduleId, hoursFromNow(30))).rejects.toMatchObject({ status: 409 });
    expect((await state(id)).status).toBe("PENDING");
  });

  it("D2: a payment canceled after the 48 hours does not restart the window (marking again keeps the first sending)", async () => {
    const { scheduleId, id } = await pendingRequest();
    const { sentAt } = await hold.markDepositInstructionsSent(id, admin);
    const line = await payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() });
    await expect(tour03(scheduleId, hoursFromNow(50))).rejects.toMatchObject({ status: 409 }); // protected while recorded
    await payments.transitionBookingPayment(admin, { paymentId: line.payment.id, to: "CANCELED", idempotencyKey: key() });
    expect(await hold.markDepositInstructionsSent(id, admin)).toEqual({ sentAt });
    await expect(tour03(scheduleId, hoursFromNow(50))).resolves.toMatchObject({ status: "PENDING" });
    expect((await state(id)).status).toBe("CANCELED");
  });

  it("instructions sent: held for 48 hours; after that, the next request expires it (SYSTEM event) and takes the date", async () => {
    const { scheduleId, id } = await pendingRequest();
    const { sentAt } = await hold.markDepositInstructionsSent(id, admin);
    expect(await hold.markDepositInstructionsSent(id, admin)).toEqual({ sentAt }); // idempotent: the first sending counts
    await expect(tour03(scheduleId, hoursFromNow(47))).rejects.toMatchObject({ status: 409 });
    expect((await state(id)).status).toBe("PENDING");
    await expect(tour03(scheduleId, hoursFromNow(49))).resolves.toMatchObject({ status: "PENDING" });
    expect(await state(id)).toEqual({ status: "CANCELED", paymentStatus: "UNPAID" });
    expect(await events(id)).toEqual(["CREATED:USER", "DEPOSIT_INSTRUCTIONS_SENT:ADMIN", "EXPIRED:SYSTEM"]);
    // Money can no longer be registered on the expired request.
    await expect(
      payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("a payment registered or under verification protects the request; only canceled lines do not", async () => {
    const recorded = await pendingRequest();
    await hold.markDepositInstructionsSent(recorded.id, admin);
    await payments.recordBookingPayment(admin, { bookingId: recorded.id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() });
    await expect(tour03(recorded.scheduleId, hoursFromNow(72))).rejects.toMatchObject({ status: 409 });
    expect((await state(recorded.id)).status).toBe("PENDING");

    const canceled = await pendingRequest();
    await hold.markDepositInstructionsSent(canceled.id, admin);
    const line = await payments.recordBookingPayment(admin, { bookingId: canceled.id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "PENDING", reference: "TESTE", idempotencyKey: key() });
    await payments.transitionBookingPayment(admin, { paymentId: line.payment.id, to: "CANCELED", idempotencyKey: key() });
    await expect(tour03(canceled.scheduleId, hoursFromNow(49))).resolves.toMatchObject({ status: "PENDING" });
    expect((await state(canceled.id)).status).toBe("CANCELED");
  });

  it("a CONFIRMED booking never expires", async () => {
    const { scheduleId, id } = await pendingRequest();
    await hold.markDepositInstructionsSent(id, admin);
    const line = await payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() });
    await payments.transitionBookingPayment(admin, { paymentId: line.payment.id, to: "CONFIRMED", idempotencyKey: key() });
    const { confirmBookingByAdmin } = await import("@/lib/services/booking.service");
    await confirmBookingByAdmin(id, admin);
    await expect(tour03(scheduleId, hoursFromNow(24 * 30))).rejects.toMatchObject({ status: 409 });
    expect(await state(id)).toEqual({ status: "CONFIRMED", paymentStatus: "PARTIAL" });
    await expect(hold.markDepositInstructionsSent(id, admin)).rejects.toMatchObject({ code: "INVALID_STATUS_FOR_INSTRUCTIONS" });
  });

  it("the guide calendar releases a lapsed request of another tour on the same day", async () => {
    const { day, id } = await pendingRequest();
    await hold.markDepositInstructionsSent(id, admin);
    const tour01Slot = await slot(TOUR_01, new Date(`${day}T11:00:00.000Z`));
    const book01 = async (now: () => Date) =>
      engine.createPrivateBookingForUser(await customer(), { tripId: TOUR_01, scheduleId: tour01Slot, party: { fullFare: 2, infants: 0 }, contact }, { now, resolvePriceTable: () => TEST_ONLY_TOUR01 });
    await expect(book01(hoursFromNow(47))).rejects.toMatchObject({ code: "SCHEDULE_UNAVAILABLE" });
    await expect(book01(hoursFromNow(49))).resolves.toMatchObject({ status: "PENDING" });
    expect((await state(id)).status).toBe("CANCELED");
  });

  it("two concurrent requests on a lapsed day (same slot and another tour) serialize: one wins, no deadlock", async () => {
    for (let round = 0; round < 3; round++) {
      const { day, scheduleId, id } = await pendingRequest();
      await hold.markDepositInstructionsSent(id, admin);
      const tour01Slot = await slot(TOUR_01, new Date(`${day}T11:00:00.000Z`));
      const later = hoursFromNow(49);
      const results = await Promise.allSettled([
        tour03(scheduleId, later),
        engine.createPrivateBookingForUser(await customer(), { tripId: TOUR_01, scheduleId: tour01Slot, party: { fullFare: 2, infants: 0 }, contact }, { now: later, resolvePriceTable: () => TEST_ONLY_TOUR01 }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const loser = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      expect(loser.reason).toMatchObject({ code: "SCHEDULE_UNAVAILABLE" });
      expect((await state(id)).status).toBe("CANCELED");
      expect((await events(id)).filter((e) => e === "EXPIRED:SYSTEM")).toHaveLength(1);
    }
  });

  it("a deposit refunded while the admin confirms is never confirmed (check and write under the payment lock)", async () => {
    const { id } = await pendingRequest();
    const line = await payments.recordBookingPayment(admin, { bookingId: id, kind: "DEPOSIT", method: "PIX", amountCents: 22_800, initialStatus: "RECORDED", reference: "TESTE", idempotencyKey: key() });
    await payments.transitionBookingPayment(admin, { paymentId: line.payment.id, to: "CONFIRMED", idempotencyKey: key() });
    const { confirmBookingByAdmin } = await import("@/lib/services/booking.service");
    // A refund in progress: it holds the booking's payment lock and has refunded the deposit, not yet committed.
    const refund = new pg.Client({ connectionString: url });
    await refund.connect();
    try {
      await refund.query("BEGIN");
      await refund.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`booking-payments:${id}`]);
      await refund.query(`UPDATE "BookingPayment" SET status = 'REFUNDED' WHERE id = $1`, [line.payment.id]);
      const confirm = confirmBookingByAdmin(id, admin).then(() => "CONFIRMED", (error: { code?: string }) => error.code);
      await new Promise((resolve) => setTimeout(resolve, 500)); // the confirm is now waiting for the lock
      await refund.query("COMMIT");
      expect(await confirm).toBe("DEPOSIT_NOT_CONFIRMED");
    } finally {
      await refund.end();
    }
    expect((await state(id)).status).toBe("PENDING");
  });

  it("only an ADMIN records the instructions, and only for a PENDING private request", async () => {
    const { id } = await pendingRequest();
    await expect(hold.markDepositInstructionsSent(id, { userId: await customer(), role: "USER" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(hold.markDepositInstructionsSent("missing-booking", admin)).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
    expect(await events(id)).toEqual(["CREATED:USER"]);
  });
});
