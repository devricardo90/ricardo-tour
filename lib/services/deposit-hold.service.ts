import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { ACTIVE_BOOKING_STATUSES, type BookingActor } from "@/lib/booking/booking-state";
import { DEPOSIT_INSTRUCTIONS_SENT_EVENT, HOLD_EXPIRED_EVENT, PROTECTING_PAYMENT_STATUSES, instructionsDueAt, isDepositHoldExpired } from "@/lib/booking/deposit-hold";
import { BOOKING_LOCK_TIMEOUT, BOOKING_TRANSACTION_OPTIONS, isBookingBusyError } from "@/lib/services/booking.service";

/*
 * RT-123 temporary hold of private requests (rules in lib/booking/deposit-hold.ts). Kept apart from the private booking
 * engine so the admin action can record the instructions without importing the engine (RT-121 guard: no route, page or
 * server action reaches the engine).
 */
const isActive = (status: string) => (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);

/**
 * RT-123 lazy expiry (Owner decisions 28-29/10/2026): cancels a PENDING private request whose hold lapsed without any
 * protecting payment: 48 hours after the deposit instructions were sent, or 24 hours after the request when they were
 * not sent in time (lib/booking/deposit-hold.ts). Runs inside the
 * caller's booking transaction and takes the booking's payment lock first, so a payment being recorded at the same
 * moment either lands before (and protects the request) or is refused afterwards (the booking is no longer PENDING).
 * Never touches a CONFIRMED booking. Returns true when the request no longer holds its date: expired here, or already
 * canceled by a concurrent transaction while this one waited for the lock (read committed sees the committed status).
 */
export async function expireLapsedHold(tx: Prisma.TransactionClient, bookingId: string, now: Date): Promise<boolean> {
  await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`booking-payments:${bookingId}`}))) AS l`;
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      pricingModel: true,
      createdAt: true,
      events: { where: { type: DEPOSIT_INSTRUCTIONS_SENT_EVENT }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } },
      _count: { select: { payments: { where: { status: { in: [...PROTECTING_PAYMENT_STATUSES] } } } } },
    },
  });
  if (!booking || !isActive(booking.status)) return true;
  const expired = isDepositHoldExpired(
    { status: booking.status, pricingModel: booking.pricingModel ?? "", requestedAt: booking.createdAt, instructionsSentAt: booking.events[0]?.createdAt ?? null, protectingPayments: booking._count.payments },
    now,
  );
  if (!expired) return false;
  const updated = await tx.booking.updateMany({ where: { id: bookingId, status: "PENDING" }, data: { status: "CANCELED" } });
  if (updated.count === 0) {
    // Left PENDING between the read and the write (a cancellation does not take the payment lock): re-read.
    const current = await tx.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
    return !current || !isActive(current.status);
  }
  await tx.bookingEvent.create({
    data: { bookingId, type: HOLD_EXPIRED_EVENT, fromStatus: "PENDING", toStatus: "CANCELED", actorUserId: null, actorRole: "SYSTEM" },
  });
  return true;
}

/**
 * RT-123: the ADMIN records that the deposit instructions were sent to the customer, which starts the 48-hour window.
 * Only for a PENDING private request and within 24 hours of the request (D1, 29/10/2026); idempotent (the first sending
 * counts; a second call returns the same instant, so a later payment cancellation never restarts the window, D2).
 */
export async function markDepositInstructionsSent(
  bookingId: string,
  actor: BookingActor,
  options: { now?: () => Date } = {},
): Promise<{ sentAt: Date }> {
  const now = options.now ?? (() => new Date());
  const adminId = actor.role === "ADMIN" ? actor.userId : null;
  if (!adminId) throw new DomainError("Acesso negado", { code: "FORBIDDEN", status: 403 });
  const id = typeof bookingId === "string" ? bookingId.trim() : "";
  if (!id) throw new DomainError("bookingId invalido", { code: "INVALID_BOOKING_ID", status: 400 });
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`booking-payments:${id}`}))) AS l`;
      const booking = await tx.booking.findUnique({
        where: { id },
        select: { status: true, pricingModel: true, createdAt: true, events: { where: { type: DEPOSIT_INSTRUCTIONS_SENT_EVENT }, orderBy: { createdAt: "asc" }, take: 1, select: { createdAt: true } } },
      });
      if (!booking) throw new DomainError("Reserva nao encontrada", { code: "BOOKING_NOT_FOUND", status: 404 });
      if (booking.pricingModel !== "PRIVATE_GROUP" || booking.status !== "PENDING") {
        throw new DomainError("So uma solicitacao privativa pendente recebe instrucoes do sinal.", { code: "INVALID_STATUS_FOR_INSTRUCTIONS", status: 409 });
      }
      if (booking.events[0]) return { sentAt: booking.events[0].createdAt };
      if (now().getTime() >= instructionsDueAt(booking.createdAt).getTime()) {
        throw new DomainError("O prazo de 24 horas para enviar as instrucoes do sinal venceu: a solicitacao expira e a data pode ser liberada.", {
          code: "INSTRUCTIONS_DEADLINE_PASSED",
          status: 409,
        });
      }
      const event = await tx.bookingEvent.create({
        data: { bookingId: id, type: DEPOSIT_INSTRUCTIONS_SENT_EVENT, actorUserId: adminId, actorRole: "ADMIN", createdAt: now() },
        select: { createdAt: true },
      });
      return { sentAt: event.createdAt };
    }, BOOKING_TRANSACTION_OPTIONS);
  } catch (error) {
    if (!(error instanceof DomainError) && isBookingBusyError(error)) {
      throw new DomainError("Operacao em andamento nesta reserva. Tente novamente.", { code: "BOOKING_BUSY", status: 409 });
    }
    throw error;
  }
}
