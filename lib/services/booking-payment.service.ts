import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { MAX_CENTS } from "@/lib/commerce/money";
import {
  PAYMENT_KINDS,
  PAYMENT_METHODS,
  canTransitionPayment,
  looksLikeCardNumber,
  summarizePayments,
  type PaymentKind,
  type PaymentLine,
  type PaymentStatus,
} from "@/lib/payments/payment-state";
import { BOOKING_LOCK_TIMEOUT, BOOKING_TRANSACTION_OPTIONS, isBookingBusyError } from "@/lib/services/booking.service";

/**
 * RT-125 manual payment control (local, Sprint 11). An authenticated ADMIN registers what was received by Pix, card
 * terminal or cash; nothing is charged, no card data is stored, no message is sent and the booking status is never
 * changed here (confirming a booking stays a separate admin decision).
 *
 * Every operation runs in one transaction under a per-booking advisory lock (bounded wait), is idempotent by its
 * request key, and writes an append-only BookingPaymentEvent with the responsible ADMIN. Expected deposit and balance
 * come from the booking's immutable quote snapshot; no formula is assumed here.
 */
export type AdminActor = { userId: string; role: "ADMIN" };

const idempotencyKey = z.string().trim().regex(/^[A-Za-z0-9_-]{16,100}$/);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "control characters")
    .refine((value) => !looksLikeCardNumber(value), "card number")
    .optional()
    .transform((value) => (value ? value : undefined));

export const recordPaymentInputSchema = z.object({
  bookingId: z.string().trim().min(1).max(64),
  kind: z.enum(PAYMENT_KINDS),
  method: z.enum(PAYMENT_METHODS),
  amountCents: z.number().int().min(1).max(MAX_CENTS),
  /** PENDING = expected/charged, not received yet; RECORDED = received, waiting for the admin's confirmation. */
  initialStatus: z.enum(["PENDING", "RECORDED"]),
  reference: optionalText(80),
  note: optionalText(300),
  idempotencyKey,
});

export const transitionPaymentInputSchema = z.object({
  paymentId: z.string().trim().min(1).max(64),
  to: z.enum(["RECORDED", "CONFIRMED", "CANCELED", "REFUNDED"]),
  note: optionalText(300),
  idempotencyKey,
});

function assertAdmin(actor: AdminActor | null | undefined): asserts actor is AdminActor {
  if (!actor || actor.role !== "ADMIN" || typeof actor.userId !== "string" || !actor.userId) {
    throw new DomainError("Nao autorizado", { code: "FORBIDDEN", status: 403 });
  }
}

function invalidInput(error: z.ZodError): never {
  const cardIssue = error.issues.some((issue) => issue.message === "card number");
  throw new DomainError(
    cardIssue ? "Nao registre numero de cartao. Use apenas o NSU ou o codigo de autorizacao." : "Dados do pagamento invalidos",
    { code: cardIssue ? "CARD_DATA_REFUSED" : "INVALID_PAYMENT_INPUT", status: 400 },
  );
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function lockBooking(tx: Tx, bookingId: string) {
  await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
  await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`booking-payments:${bookingId}`}))) AS l`;
}

async function loadBookingForPayments(tx: Tx, bookingId: string) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      pricingModel: true,
      quote: { select: { totalCents: true, depositCents: true, balanceCents: true } },
      payments: { select: { kind: true, status: true, amountCents: true } },
    },
  });
  if (!booking) throw new DomainError("Reserva nao encontrada", { code: "BOOKING_NOT_FOUND", status: 404 });
  if (booking.pricingModel !== "PRIVATE_GROUP" || !booking.quote) {
    throw new DomainError("Controle de pagamentos disponivel apenas para reservas privativas com cotacao registrada.", {
      code: "PAYMENTS_REQUIRE_PRIVATE_QUOTE",
      status: 409,
    });
  }
  return { ...booking, quote: booking.quote, lines: booking.payments as PaymentLine[] };
}

/** Recomputes Booking.paymentStatus from the payment lines (only CONFIRMED money counts as paid). */
async function syncPaymentStatus(tx: Tx, bookingId: string) {
  const { quote, lines } = await loadBookingForPayments(tx, bookingId);
  const summary = summarizePayments(quote, lines);
  await tx.booking.update({ where: { id: bookingId }, data: { paymentStatus: summary.paymentStatus } });
  return summary;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

async function runPaymentTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(fn, BOOKING_TRANSACTION_OPTIONS);
  } catch (error) {
    if (error instanceof DomainError) throw error;
    if (isUniqueViolation(error)) {
      throw new DomainError("Esta operacao ja foi registrada.", { code: "IDEMPOTENCY_KEY_REUSED", status: 409 });
    }
    if (isBookingBusyError(error)) {
      throw new DomainError("Outra operacao financeira desta reserva esta em andamento. Tente novamente.", { code: "BOOKING_BUSY", status: 409 });
    }
    throw error;
  }
}

const KIND_LABEL: Record<PaymentKind, string> = { DEPOSIT: "sinal", BALANCE: "saldo" };

export async function recordBookingPayment(actor: AdminActor, rawInput: unknown) {
  assertAdmin(actor);
  const parsed = recordPaymentInputSchema.safeParse(rawInput);
  if (!parsed.success) invalidInput(parsed.error);
  const input = parsed.data;

  return runPaymentTransaction(async (tx) => {
    await lockBooking(tx, input.bookingId);

    // Idempotency: the same request (same key) returns the line it created; a different request with that key is refused.
    const existing = await tx.bookingPayment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      const same =
        existing.bookingId === input.bookingId &&
        existing.kind === input.kind &&
        existing.method === input.method &&
        existing.amountCents === input.amountCents;
      if (!same) throw new DomainError("Esta chave de operacao ja foi usada para outro registro.", { code: "IDEMPOTENCY_KEY_REUSED", status: 409 });
      return { payment: existing, replayed: true as const };
    }

    const booking = await loadBookingForPayments(tx, input.bookingId);
    if (booking.status === "CANCELED") {
      throw new DomainError("Reserva cancelada: novos pagamentos nao podem ser registrados.", { code: "BOOKING_CANCELED", status: 409 });
    }
    const summary = summarizePayments(booking.quote, booking.lines);
    const open = input.kind === "DEPOSIT" ? summary.deposit.openCents : summary.balance.openCents;
    if (input.amountCents > open) {
      throw new DomainError(
        `Valor acima do ${KIND_LABEL[input.kind]} em aberto (${(Math.max(open, 0) / 100).toFixed(2).replace(".", ",")}).`,
        { code: "AMOUNT_EXCEEDS_EXPECTED", status: 409 },
      );
    }

    const payment = await tx.bookingPayment.create({
      data: {
        bookingId: input.bookingId,
        kind: input.kind,
        method: input.method,
        amountCents: input.amountCents,
        status: input.initialStatus,
        reference: input.reference ?? null,
        idempotencyKey: input.idempotencyKey,
        createdByUserId: actor.userId,
      },
    });
    await tx.bookingPaymentEvent.create({
      data: {
        paymentId: payment.id,
        bookingId: input.bookingId,
        type: "CREATED",
        fromStatus: null,
        toStatus: input.initialStatus,
        amountCents: input.amountCents,
        actorUserId: actor.userId,
        idempotencyKey: input.idempotencyKey,
        note: input.note ?? null,
      },
    });
    await syncPaymentStatus(tx, input.bookingId);
    return { payment, replayed: false as const };
  });
}

export async function transitionBookingPayment(actor: AdminActor, rawInput: unknown) {
  assertAdmin(actor);
  const parsed = transitionPaymentInputSchema.safeParse(rawInput);
  if (!parsed.success) invalidInput(parsed.error);
  const input = parsed.data;

  const target = await prisma.bookingPayment.findUnique({ where: { id: input.paymentId }, select: { bookingId: true } });
  if (!target) throw new DomainError("Pagamento nao encontrado", { code: "PAYMENT_NOT_FOUND", status: 404 });

  return runPaymentTransaction(async (tx) => {
    await lockBooking(tx, target.bookingId);

    const replay = await tx.bookingPaymentEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (replay) {
      if (replay.paymentId !== input.paymentId || replay.toStatus !== input.to) {
        throw new DomainError("Esta chave de operacao ja foi usada para outro registro.", { code: "IDEMPOTENCY_KEY_REUSED", status: 409 });
      }
      const payment = await tx.bookingPayment.findUniqueOrThrow({ where: { id: input.paymentId } });
      return { payment, replayed: true as const };
    }

    const payment = await tx.bookingPayment.findUniqueOrThrow({ where: { id: input.paymentId } });
    const from = payment.status as PaymentStatus;
    if (!canTransitionPayment(from, input.to)) {
      throw new DomainError(`Operacao nao permitida para um pagamento ${from}.`, { code: "INVALID_PAYMENT_TRANSITION", status: 409 });
    }
    // Conditional on the status read under the lock; the database trigger enforces the same transition table.
    const updated = await tx.bookingPayment.updateMany({ where: { id: payment.id, status: from }, data: { status: input.to } });
    if (updated.count !== 1) {
      throw new DomainError("O pagamento mudou durante a operacao. Atualize a pagina.", { code: "PAYMENT_STATUS_CHANGED", status: 409 });
    }
    await tx.bookingPaymentEvent.create({
      data: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        type: input.to,
        fromStatus: from,
        toStatus: input.to,
        amountCents: payment.amountCents,
        actorUserId: actor.userId,
        idempotencyKey: input.idempotencyKey,
        note: input.note ?? null,
      },
    });
    await syncPaymentStatus(tx, payment.bookingId);
    return { payment: { ...payment, status: input.to }, replayed: false as const };
  });
}

/** Admin read model: lines, history and the deposit/balance summary of one booking (null when not a private booking). */
export async function getBookingPaymentsOverview(actor: AdminActor, bookingId: string) {
  assertAdmin(actor);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      pricingModel: true,
      paymentStatus: true,
      quote: { select: { totalCents: true, depositCents: true, balanceCents: true, priceTableId: true, priceTableVersion: true } },
      payments: { orderBy: { createdAt: "asc" } },
      paymentEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking || booking.pricingModel !== "PRIVATE_GROUP" || !booking.quote) return null;
  // Names of the admins who acted (the event row keeps only the id, by design).
  const actorIds = [...new Set(booking.paymentEvents.map((event) => event.actorUserId))];
  const actors = actorIds.length ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } }) : [];
  const actorNames = new Map(actors.map((user) => [user.id, user.name]));
  return {
    quote: booking.quote,
    paymentStatus: booking.paymentStatus,
    payments: booking.payments,
    events: booking.paymentEvents.map((event) => ({ ...event, actorName: actorNames.get(event.actorUserId) ?? null })),
    summary: summarizePayments(booking.quote, booking.payments as PaymentLine[]),
  };
}
