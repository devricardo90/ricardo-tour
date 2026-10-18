/**
 * Tours whose published price is OBSOLETE and must not be shown (Owner, 18/10/2026). TOUR-01 Cristo Redentor + Pão de
 * Açúcar: the R$ 385 stored on Trip belongs to the old catalog and is not the price of the new private experience, which
 * is not approved yet. Until an approved price exists, public surfaces show a quote-on-request label instead of any amount
 * and the JSON-LD carries no Offer price. The Trip row and the database are NOT changed.
 * LOCAL ONLY: reaching production requires the Owner's release authorization (main auto-deploys production).
 */
export const PRICE_ON_REQUEST_TRIP_IDS: ReadonlySet<string> = new Set(["cmlhxkpy9000028zq27rhytew"]);

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
  return PRICE_ON_REQUEST_TRIP_IDS.has(tripId);
}

/** Price for the JSON-LD Offer: null (no Offer) while the published price is obsolete. */
export function publicOfferPriceCents(tripId: string, priceCents: number): number | null {
  return PRICE_ON_REQUEST_TRIP_IDS.has(tripId) ? null : priceCents;
}

/** Returns the quote-on-request texts for a tour whose price must not be shown, or null when the stored price applies. */
export function priceOnRequest(tripId: string, locale: string): { label: string; value: string } | null {
  if (!PRICE_ON_REQUEST_TRIP_IDS.has(tripId)) return null;
  return LABELS[(locale === "en" || locale === "es" ? locale : "pt") as keyof typeof LABELS];
}
