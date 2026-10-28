"use server";

import { headers } from "next/headers";
import { isDomainError } from "@/lib/errors/domain-error";
import { isFormSubmissionLimited } from "@/lib/rate-limit/server";
import { reportServerError } from "@/lib/observability/report";
import { sendContactNotification } from "@/lib/services/tour-request-notification";
import { createPublicBookingRequest } from "@/lib/services/private-booking-request.service";
import { isRequestDateAllowed, isRequestLeadTimeAllowed, publicRequestTable, type PublicRequestMode } from "@/lib/booking/public-request";
import { isValidEmail, isValidPhone, todayInRio, NAME_MAX, NOTES_MAX } from "@/lib/tour-request";
import { formatBrl } from "@/lib/commerce/money";

// RT-124 (27/10/2026, local): private booking REQUEST from the tour page. It creates a PENDING booking through the
// existing engine; nothing is charged and nothing is confirmed here. The team verifies the request, sends the deposit
// instructions, records the deposit (RT-125) and confirms the booking. Abuse protection as the guest tour request:
// server-side validation, Next's same-origin check for Server Actions, honeypot and the shared rate limiter.

export type BookingRequestField = "name" | "email" | "phone" | "date" | "party" | "pickup" | "notes";
export type BookingRequestErrorCode = "required" | "invalid" | "too_long" | "date_not_allowed" | "party_invalid";
export type BookingRequestErrors = Partial<Record<BookingRequestField, BookingRequestErrorCode>>;

export type BookingRequestState =
  | { ok: true; reference: string; totalCents: number; depositCents: number; balanceCents: number }
  | { ok: false; reason: "invalid"; errors: BookingRequestErrors }
  | { ok: false; reason: "date_unavailable" | "not_available" | "rate_limited" | "busy" | "unavailable" };

const LOCALES = ["pt", "en", "es"] as const;
const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function submitPrivateBookingRequest(formData: FormData): Promise<BookingRequestState> {
  // Honeypot: real visitors never see or fill this field. Pretend nothing happened and store nothing.
  if (str(formData, "company_website") !== "") return { ok: false, reason: "unavailable" };

  const tripId = str(formData, "tripId");
  const mode: PublicRequestMode = str(formData, "mode") === "lab" ? "lab" : "public";
  const table = publicRequestTable(tripId, mode);
  if (!table) return { ok: false, reason: "not_available" };

  const h = await headers();
  if (await isFormSubmissionLimited(h, "private_booking_request")) return { ok: false, reason: "rate_limited" };

  const rawLocale = str(formData, "locale");
  const language = (LOCALES as readonly string[]).includes(rawLocale) ? (rawLocale as (typeof LOCALES)[number]) : "pt";
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone");
  const date = str(formData, "date");
  const party = Number(str(formData, "party"));
  const pickup = str(formData, "pickup");
  const notes = str(formData, "notes");
  const maxParty = Math.max(...Object.keys(table.groupTotalCents).map(Number));

  const errors: BookingRequestErrors = {};
  if (!name) errors.name = "required";
  else if (name.length > NAME_MAX || name.length < 2) errors.name = name.length < 2 ? "invalid" : "too_long";
  if (!email) errors.email = "required";
  else if (!isValidEmail(email) || email.length > 254) errors.email = "invalid";
  if (!phone) errors.phone = "required";
  else if (!isValidPhone(phone) || !/^\+?[0-9][0-9 ()-]{6,22}[0-9]$/.test(phone)) errors.phone = "invalid";
  if (!date) errors.date = "required";
  else if (!isRequestDateAllowed(date, todayInRio()) || !isRequestLeadTimeAllowed(tripId, date)) errors.date = "date_not_allowed";
  if (!Number.isInteger(party) || party < 1 || party > maxParty) errors.party = "party_invalid";
  if (pickup.length > 300) errors.pickup = "too_long";
  if (notes.length > NOTES_MAX) errors.notes = "too_long";
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  let booking: Awaited<ReturnType<typeof createPublicBookingRequest>>;
  try {
    booking = await createPublicBookingRequest({
      tripId,
      date,
      fullFare: party,
      contact: { fullName: name, email, phone, language, pickupAddress: pickup || undefined, notes: notes || undefined },
    });
  } catch (error) {
    if (isDomainError(error)) {
      // The same answer for a taken day and for this customer's own earlier request: nothing about other bookings leaks.
      if (error.code === "SCHEDULE_UNAVAILABLE" || error.code === "DUPLICATE_BOOKING" || error.code === "SCHEDULE_CAPACITY_EXCEEDED") return { ok: false, reason: "date_unavailable" };
      if (error.code === "BOOKING_BUSY") return { ok: false, reason: "busy" };
      if (error.code === "TRIP_NOT_FOUND" || error.code === "PRICE_NOT_APPROVED") return { ok: false, reason: "not_available" };
      if (error.code === "INVALID_BOOKING_INPUT" || error.code === "INVALID_REQUEST_DATE") return { ok: false, reason: "invalid", errors: {} };
    }
    reportServerError({ source: "form", where: "private-booking-request:create", error });
    return { ok: false, reason: "unavailable" };
  }

  const quote = booking.quote!;
  const reference = booking.id.slice(-8).toUpperCase();
  // The team is told at once; the request is already stored, so a delivery problem never turns it into a failure.
  await sendContactNotification({
    submissionId: booking.id,
    subject: `Nova solicitação de reserva ${reference} (${date}, ${party} ${party === 1 ? "pessoa" : "pessoas"})`,
    message: [
      "[Solicitação de reserva privativa — site]",
      `Referência: ${reference} (reserva PENDENTE no ADMIN › Reservas)`,
      `Passeio: ${tripId} · tabela ${quote.priceTableId} v${quote.priceTableVersion}`,
      `Data pedida: ${date} (horário de início a confirmar com o cliente)`,
      `Participantes: ${party}`,
      `Total: ${formatBrl(quote.totalCents)} · sinal 30%: ${formatBrl(quote.depositCents)} · saldo 70% no início: ${formatBrl(quote.balanceCents)}`,
      `Idioma: ${language}`,
      "Contato e endereço: no ADMIN (dados pessoais não vão por e-mail).",
    ].join("\n"),
    replyTo: email,
    logTag: "private-booking-request",
  });

  return { ok: true, reference, totalCents: quote.totalCents, depositCents: quote.depositCents, balanceCents: quote.balanceCents };
}
