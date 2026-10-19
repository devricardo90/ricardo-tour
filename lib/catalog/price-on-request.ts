/**
 * The legacy Trip.priceCents value is not authorized for public display for any of the four own-catalog tours. Local
 * cards/details therefore show a quote-on-request label and JSON-LD omits Offer pricing. This does not replace the
 * commercial decisions in the Manual, modify Trip rows, or authorize publication.
 * LOCAL ONLY: reaching production requires the Owner's release authorization (main auto-deploys production).
 */
export const PRICE_ON_REQUEST_TRIP_IDS: ReadonlySet<string> = new Set([
  "cmlhxkpy9000028zq27rhytew", // TOUR-01 Cristo Redentor + Pão de Açúcar
  "cmli1a6im000034zqqzc9sppb", // TOUR-02 Rocinha
  "cmlibniq40000z4zqkbujnutt", // TOUR-03 Centro Histórico
  "cmljo0s1u0000t0zqa0bpd23p", // TOUR-04 Premium
]);

const LABELS = {
  pt: { label: "Preço", value: "Orçamento sob consulta" },
  en: { label: "Price", value: "Quote on request" },
  es: { label: "Precio", value: "Presupuesto a consultar" },
} as const;

/**
 * RT-110 (Owner authorization 18/10/2026, local only): a tour whose commercial price is not approved cannot receive a new
 * booking through the legacy booking API, because that flow would store the obsolete published price. Availability is
 * requested through the WhatsApp / request-form flow with human confirmation instead. Existing bookings are untouched.
 */
export function isBookingBlockedForUnapprovedPrice(tripId: string): boolean {
  return BOOKING_PRICE_NOT_APPROVED_TRIP_IDS.has(tripId);
}

/**
 * The four own-catalog tours (Owner, 16/10/2026: old catalog prices are not approved for the new private experiences).
 * None has an approved price stored on Trip, so none may receive a booking that would store the old price. Remove an id
 * only when its approved commercial price is stored and the Owner authorizes bookings for it.
 */
export const BOOKING_PRICE_NOT_APPROVED_TRIP_IDS: ReadonlySet<string> = new Set([
  "cmlhxkpy9000028zq27rhytew", // TOUR-01 Cristo Redentor + Pão de Açúcar (stored R$ 385, obsolete)
  "cmli1a6im000034zqqzc9sppb", // TOUR-02 Rocinha (stored R$ 120, obsolete; new table not approved)
  "cmlibniq40000z4zqkbujnutt", // TOUR-03 Centro Histórico (stored R$ 245 per person; approved table is per group, not stored)
  "cmljo0s1u0000t0zqa0bpd23p", // TOUR-04 Premium (stored R$ 900, not validated)
]);

/** Price for the JSON-LD Offer: null (no Offer) while the published price is obsolete. */
export function publicOfferPriceCents(tripId: string, priceCents: number): number | null {
  return PRICE_ON_REQUEST_TRIP_IDS.has(tripId) ? null : priceCents;
}

/** Returns the quote-on-request texts for a tour whose price must not be shown, or null when the stored price applies. */
export function priceOnRequest(tripId: string, locale: string): { label: string; value: string } | null {
  if (!PRICE_ON_REQUEST_TRIP_IDS.has(tripId)) return null;
  return LABELS[(locale === "en" || locale === "es" ? locale : "pt") as keyof typeof LABELS];
}
