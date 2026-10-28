import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { createPrivateBookingForUser } from "@/lib/services/private-booking.service";
import { BOOKING_LOCK_TIMEOUT, BOOKING_TRANSACTION_OPTIONS, isBookingBusyError } from "@/lib/services/booking.service";
import { PUBLIC_REQUEST_SLOTS, requestSlotStart } from "@/lib/booking/public-request";

/**
 * RT-124 (27/10/2026, local): a private booking requested from the public tour page. It reuses the engine as is
 * (approved table, immutable quote, one group per slot, contact, history) and adds only what a request without an
 * account needs:
 *  - the day's slot (one per tour per day; created on the first request, under a lock, never duplicated);
 *  - an owner for the booking: the signed-in customer, or the site's request account, which has no password and cannot
 *    sign in (the customer's contact data, e-mail included, lives in BookingContact, shown only to ADMIN).
 * Using the site's request account instead of creating an account per e-mail keeps the customer free to register later
 * with the same e-mail, and never attaches a request to someone else's account because an e-mail was typed.
 */
export const GUEST_REQUEST_OWNER_EMAIL = "solicitacoes-site@ricardotour.invalid";
const GUEST_REQUEST_OWNER_NAME = "Solicitação pelo site";

export async function getGuestRequestOwnerId(): Promise<string> {
  const owner = await prisma.user.upsert({
    where: { email: GUEST_REQUEST_OWNER_EMAIL },
    update: {},
    create: { email: GUEST_REQUEST_OWNER_EMAIL, name: GUEST_REQUEST_OWNER_NAME, role: "USER" },
    select: { id: true },
  });
  return owner.id;
}

/** The OPEN slot of a tour for a requested day, created on first use. Serialized per tour and day. */
export async function ensureRequestSlot(tripId: string, isoDate: string): Promise<string> {
  const config = PUBLIC_REQUEST_SLOTS[tripId];
  const startAt = requestSlotStart(tripId, isoDate);
  if (!config || !startAt) throw new DomainError("Data invalida", { code: "INVALID_REQUEST_DATE", status: 400 });
  const endAt = new Date(startAt.getTime() + config.durationMinutes * 60_000);
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
      await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`request-slot:${tripId}:${isoDate}`}))) AS l`;
      const existing = await tx.tripSchedule.findFirst({ where: { tripId, startAt }, orderBy: { createdAt: "asc" }, select: { id: true } });
      if (existing) return existing.id;
      // pricePerPersonCents 0: a private booking never uses the legacy per-person price (the quote snapshot holds the price).
      const created = await tx.tripSchedule.create({ data: { tripId, startAt, endAt, capacity: 4, pricePerPersonCents: 0 }, select: { id: true } });
      return created.id;
    }, BOOKING_TRANSACTION_OPTIONS);
  } catch (error) {
    if (!(error instanceof DomainError) && isBookingBusyError(error)) {
      throw new DomainError("Muitas solicitacoes para esta data agora. Tente novamente em instantes.", { code: "BOOKING_BUSY", status: 409 });
    }
    throw error;
  }
}

export type PublicBookingRequest = {
  tripId: string;
  date: string;
  fullFare: number;
  contact: { fullName: string; email: string; phone: string; language: "pt" | "en" | "es"; pickupAddress?: string; notes?: string };
};

/** Creates the PENDING booking for a request. `userId` = signed-in customer; without it, the site's request account. */
export async function createPublicBookingRequest(request: PublicBookingRequest, userId?: string | null) {
  const config = PUBLIC_REQUEST_SLOTS[request.tripId];
  if (!config) throw new DomainError("Passeio sem reserva online", { code: "PRICE_NOT_APPROVED", status: 409 });
  const scheduleId = await ensureRequestSlot(request.tripId, request.date);
  const ownerId = userId ?? (await getGuestRequestOwnerId());
  return createPrivateBookingForUser(ownerId, {
    tripId: request.tripId,
    scheduleId,
    priceTableId: config.priceTableId,
    party: { fullFare: request.fullFare, infants: 0 },
    contact: request.contact,
  });
}
