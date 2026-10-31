import { getApprovedGroupPriceTable, type ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";
import { legalPagesPublished } from "@/lib/legal/publication";
import { PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS } from "@/lib/catalog/public-tour-presentation";
import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";

/**
 * RT-124 (27/10/2026, local): which tours accept a private booking REQUEST from the public tour page, and the slot it
 * reserves. A request creates a PENDING booking through the existing engine (one group per slot, immutable quote); the
 * ADMIN verifies it, records the 30% deposit (RT-125) and only then confirms the booking. Nothing is charged online.
 *
 * Owner decisions (RT-123, 28/10/2026): operation every day; one confirmed private tour per day across TOUR-01/02/03;
 * less than 24 hours ahead is "on request" (WhatsApp), not an online request; the exact start time is agreed with the
 * customer. The 09:00 slot below is only the reference for the request and the 24-hour rule. One slot per tour per day, and one departure per guide per Rio day across TOUR-01/02/03
 * (lib/booking/guide-calendar.ts); the team confirms the exact start time with the customer before the deposit.
 */
export type PublicRequestSlot = {
  startLocalTime: string;
  durationMinutes: number;
  priceTableId: string;
  /** Adults only (TOUR-02, minimum age 18): the form says so instead of the infant hint. */
  adultsOnly?: true;
  /** Fixed meeting point instead of hotel pickup (TOUR-02): the form hides the pickup-address field. */
  meetingPoint?: true;
  /** Which option the online request quotes, when the page shows more than one (TOUR-03: 4 h online, 6 h on WhatsApp). */
  optionNote?: { pt: string; en: string; es: string };
};

export const PUBLIC_REQUEST_SLOTS: Readonly<Record<string, PublicRequestSlot>> = {
  // TOUR-01 Cristo + Selarón + Pão de Açúcar, ~8 hours hotel to hotel (Ficha TOUR-01 §4.1); table RT-121 28/10/2026.
  cmlhxkpy9000028zq27rhytew: { startLocalTime: "09:00", durationMinutes: 480, priceTableId: "TOUR-01" },
  // TOUR-02 Favela da Rocinha, ~3 hours; table RT-121 28/10/2026.
  cmli1a6im000034zqqzc9sppb: { startLocalTime: "09:00", durationMinutes: 180, priceTableId: "TOUR-02", adultsOnly: true, meetingPoint: true },
  // TOUR-03 Centro Histórico e Cultural, 4-hour route (RT-121 26/10/2026; the 6-hour option is not offered online).
  cmlibniq40000z4zqkbujnutt: {
    startLocalTime: "09:00",
    durationMinutes: 240,
    priceTableId: "TOUR-03-4H",
    optionNote: {
      pt: "A solicitação online é para o passeio de 4 horas (Centro Histórico Essencial). Para o roteiro de 6 horas, fale com a equipe pelo WhatsApp.",
      en: "The online request is for the 4-hour tour (Essential Historic Center). For the 6-hour itinerary, please contact our team on WhatsApp.",
      es: "La solicitud en línea es para el recorrido de 4 horas (Centro Histórico Esencial). Para el itinerario de 6 horas, habla con el equipo por WhatsApp.",
    },
  },
};

/** A request is for tomorrow or later, never for today (and see REQUEST_MIN_LEAD_HOURS). */
export const REQUEST_MIN_DAYS_AHEAD = 1;
/** Owner, 28/10/2026 (RT-123): with less than 24 hours before the start, the booking is on request (WhatsApp). */
export const REQUEST_MIN_LEAD_HOURS = 24;
export const REQUEST_MAX_DAYS_AHEAD = 365;
const RIO_UTC_OFFSET = "-03:00"; // Brazil has no daylight saving time since 2019.

export type PublicRequestMode = "public" | "lab";

/**
 * The approved table a public request may quote with, or null. The booking request is offered only where the price is
 * approved (registry) AND may be shown: publicly that needs the Owner's price-publication authorization; in the local
 * rebuild lab (never enabled on deployments) the approved table is enough, for the Owner's review.
 */
export function publicRequestTable(tripId: string, mode: PublicRequestMode, env: Record<string, string | undefined> = process.env): ApprovedGroupPriceTable | null {
  const slot = PUBLIC_REQUEST_SLOTS[tripId];
  if (!slot) return null;
  const table = getApprovedGroupPriceTable(tripId, slot.priceTableId);
  if (!table) return null;
  if (mode === "lab") return isRebuildLabEnabled(env) ? table : null;
  // A public request carries the acceptance of the Terms, so it also needs the Terms and the Privacy Policy published.
  return PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(tripId) && legalPagesPublished() ? table : null;
}

/** The slot instant for a requested day (YYYY-MM-DD, Rio time). */
export function requestSlotStart(tripId: string, isoDate: string): Date | null {
  const slot = PUBLIC_REQUEST_SLOTS[tripId];
  if (!slot || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const start = new Date(`${isoDate}T${slot.startLocalTime}:00${RIO_UTC_OFFSET}`);
  return Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== isoDate ? null : start;
}

/** At least REQUEST_MIN_LEAD_HOURS between now and the day's reference start (09:00 in Rio). */
export function isRequestLeadTimeAllowed(tripId: string, isoDate: string, now: Date = new Date()) {
  const start = requestSlotStart(tripId, isoDate);
  return !!start && start.getTime() - now.getTime() >= REQUEST_MIN_LEAD_HOURS * 3_600_000;
}

/** Accepted request window for a day (YYYY-MM-DD in Rio), relative to today's date in Rio. */
export function isRequestDateAllowed(isoDate: string, todayRio: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || Number.isNaN(Date.parse(`${isoDate}T12:00:00Z`))) return false;
  const days = Math.round((Date.parse(`${isoDate}T12:00:00Z`) - Date.parse(`${todayRio}T12:00:00Z`)) / 86_400_000);
  return days >= REQUEST_MIN_DAYS_AHEAD && days <= REQUEST_MAX_DAYS_AHEAD;
}
