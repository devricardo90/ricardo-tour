import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { getPublicTripById } from "@/lib/catalog/public-trips";
import { PricingError, quoteGroupPrice, splitDeposit } from "@/lib/commerce/group-pricing";
import { getApprovedGroupPriceTable, type ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/booking/booking-state";
import { BOOKING_LOCK_TIMEOUT, BOOKING_TRANSACTION_OPTIONS, bookingLockKey, isBookingBusyError } from "@/lib/services/booking.service";

/**
 * RT-124 private group booking engine (local, Sprint 11). NOT wired to any public route: sales stay closed until the
 * Owner approves prices (RT-121), terms (RT-81/RT-118) and the payment flow (RT-125).
 *
 * Model (Owner decisions recorded in the Manual Mestre): one private group per schedule slot; closed price per group
 * by number of participants; children 0-2 only where the table's child policy is approved; deposit 30% and balance 70%
 * of the total (RT-121). The price comes ONLY from an approved table (lib/commerce/price-tables.ts: TOUR-03 4 h).
 */
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), "control characters");

export const privateBookingInputSchema = z.object({
  tripId: z.string().trim().min(1).max(64),
  scheduleId: z.string().trim().min(1).max(64),
  /** The approved option (e.g. "TOUR-03-4H"); required when a trip has more than one approved table. */
  priceTableId: z.string().trim().min(1).max(64).optional(),
  party: z.object({
    fullFare: z.number().int().min(1).max(20),
    infants: z.number().int().min(0).max(20),
  }),
  contact: z.object({
    fullName: text(120).refine((value) => value.length >= 2, "too short"),
    phone: z.string().trim().regex(/^\+?[0-9][0-9 ()-]{6,22}[0-9]$/, "phone"),
    /** Required by the public request form (no account); optional for a signed-in customer, whose account has one. */
    email: z.string().trim().toLowerCase().max(254).email().optional(),
    language: z.enum(["pt", "en", "es"]),
    pickupAddress: text(300).optional(),
    notes: text(1000).optional(),
  }),
});

export type PrivateBookingInput = z.infer<typeof privateBookingInputSchema>;

export type PrivateBookingDeps = {
  /** Approved table lookup; tests inject a TEST ONLY table, production uses the (empty) approved registry. */
  resolvePriceTable?: (tripId: string, priceTableId?: string) => ApprovedGroupPriceTable | null;
  now?: () => Date;
};

const PRICING_ERROR_MESSAGES: Record<string, string> = {
  NO_ADULT_RESPONSIBLE: "A reserva precisa de pelo menos um participante pagante integral.",
  PARTY_TOO_LARGE: "O grupo excede o maximo de participantes deste passeio.",
};

export async function createPrivateBookingForUser(userId: string, rawInput: unknown, deps: PrivateBookingDeps = {}) {
  const parsed = privateBookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new DomainError("Dados da reserva invalidos", { code: "INVALID_BOOKING_INPUT", status: 400 });
  }
  const { tripId, scheduleId, priceTableId, party, contact } = parsed.data;
  const now = deps.now ?? (() => new Date());

  // Same public catalog gate as the tour page: a hidden trip answers exactly like a missing one.
  if (!(await getPublicTripById(tripId))) {
    throw new DomainError("Trip nao encontrada", { code: "TRIP_NOT_FOUND", status: 404 });
  }

  const table = (deps.resolvePriceTable ?? getApprovedGroupPriceTable)(tripId, priceTableId);
  if (!table || table.tripId !== tripId || (priceTableId !== undefined && table.id !== priceTableId)) {
    throw new DomainError("Este passeio e reservado mediante solicitacao de disponibilidade. Fale com a equipe pelo WhatsApp.", {
      code: "PRICE_NOT_APPROVED",
      status: 409,
    });
  }

  // RT-121: no child rule is presumed. Without an approved policy for this table, children 0-2 cannot be quoted here.
  if (party.infants > 0 && table.childPolicy !== "INFANT_HALF_FARE_0_2") {
    throw new DomainError("Para criancas de 0 a 2 anos, fale com a equipe pelo WhatsApp para confirmar as condicoes.", {
      code: "CHILD_POLICY_NOT_APPROVED",
      status: 409,
    });
  }

  // The quote is computed before the transaction (pure) and stored as an immutable snapshot with the booking.
  let quote;
  let split;
  try {
    quote = quoteGroupPrice(table, { fullFare: party.fullFare, infants: party.infants });
    split = splitDeposit(quote.totalCents);
  } catch (error) {
    if (error instanceof PricingError) {
      throw new DomainError(PRICING_ERROR_MESSAGES[error.code] ?? "Composicao do grupo invalida.", { code: error.code, status: 400 });
    }
    throw error;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${bookingLockKey(userId, tripId, scheduleId)}))) AS l`;

      const schedule = await tx.tripSchedule.findUnique({
        where: { id: scheduleId },
        select: { id: true, tripId: true, capacity: true, status: true, startAt: true, trip: { select: { maxGuests: true } } },
      });
      if (!schedule || schedule.tripId !== tripId || schedule.status !== "OPEN" || schedule.startAt.getTime() <= now().getTime()) {
        throw new DomainError("Agenda nao disponivel", { code: "SCHEDULE_UNAVAILABLE", status: 409 });
      }
      const limit = Math.min(
        schedule.capacity > 0 ? schedule.capacity : Number.POSITIVE_INFINITY,
        schedule.trip.maxGuests && schedule.trip.maxGuests > 0 ? schedule.trip.maxGuests : Number.POSITIVE_INFINITY,
      );
      if (quote.participants > limit) {
        throw new DomainError("O grupo excede a capacidade desta data.", { code: "SCHEDULE_CAPACITY_EXCEEDED", status: 400 });
      }

      // Private tour: the slot belongs to one group. The same customer gets DUPLICATE_BOOKING; anyone else gets the
      // same answer as an unavailable date (nothing about the other booking is revealed).
      const active = await tx.booking.findFirst({
        where: { scheduleId, status: { in: [...ACTIVE_BOOKING_STATUSES] } },
        select: { userId: true },
      });
      if (active) {
        if (active.userId === userId) {
          throw new DomainError("Voce ja possui reserva para esta data", { code: "DUPLICATE_BOOKING", status: 409 });
        }
        throw new DomainError("Agenda nao disponivel", { code: "SCHEDULE_UNAVAILABLE", status: 409 });
      }

      return tx.booking.create({
        data: {
          userId,
          tripId,
          scheduleId,
          status: "PENDING",
          paymentStatus: "UNPAID",
          pricingModel: "PRIVATE_GROUP",
          guestCount: quote.participants,
          fullFareCount: party.fullFare,
          infantCount: party.infants,
          totalPriceCents: quote.totalCents,
          quote: {
            create: {
              currency: table.currency,
              priceTableId: table.id,
              priceTableVersion: table.version,
              participants: quote.participants,
              fullFareCount: party.fullFare,
              infantCount: party.infants,
              groupTotalCents: table.groupTotalCents[quote.participants],
              totalCents: split.totalCents,
              // RT-121 discarded the "tickets + 30%" formula: tickets are part of the total, nothing is split off.
              prepaidTicketsCents: 0,
              depositBasisPoints: split.depositBasisPoints,
              depositCents: split.depositCents,
              balanceCents: split.balanceCents,
            },
          },
          contact: {
            create: {
              fullName: contact.fullName,
              phone: contact.phone,
              email: contact.email ?? null,
              language: contact.language,
              pickupAddress: contact.pickupAddress ?? null,
              notes: contact.notes ?? null,
            },
          },
          events: { create: { type: "CREATED", toStatus: "PENDING", actorUserId: userId, actorRole: "USER" } },
        },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          guestCount: true,
          totalPriceCents: true,
          quote: { select: { totalCents: true, depositCents: true, balanceCents: true, priceTableId: true, priceTableVersion: true } },
        },
      });
    }, BOOKING_TRANSACTION_OPTIONS);
  } catch (error) {
    if (!(error instanceof DomainError) && isBookingBusyError(error)) {
      throw new DomainError("Muitas solicitacoes para esta data agora. Tente novamente em instantes.", { code: "BOOKING_BUSY", status: 409 });
    }
    throw error;
  }
}
