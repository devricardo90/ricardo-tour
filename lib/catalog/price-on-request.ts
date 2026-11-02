import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";

/**
 * Owner, 01/11/2026: public display of the approved group fares of the three launch tours is expressly authorized
 * (RT-121 tables of 28/10/2026, texts approved in the Owner gate of 30/10/2026). The fares come only from the approved
 * tables in code (PROTOTYPE_OFFER.approvedPricing), never from Trip.priceCents. This does NOT open bookings or payments:
 * the public request form also needs the legal documents published (lib/booking/public-request.ts) and the legacy booking
 * API stays blocked (BOOKING_PRICE_NOT_APPROVED_TRIP_IDS).
 * LOCAL ONLY: reaching production requires the Owner's release authorization (main auto-deploys production).
 */
export const PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS: ReadonlySet<string> = new Set([
  "cmlhxkpy9000028zq27rhytew", // TOUR-01 Cristo Redentor + Selarón + Pão de Açúcar
  "cmli1a6im000034zqqzc9sppb", // TOUR-02 Rocinha
  "cmlibniq40000z4zqkbujnutt", // TOUR-03 Centro Histórico e Cultural
]);

/**
 * The legacy Trip.priceCents value is not authorized for public display for any of the four own-catalog tours: no card,
 * detail, price filter or JSON-LD Offer ever uses it. The three launch tours show their approved fare instead
 * (approvedPublicPrice); a tour without one shows a quote-on-request label. This does not modify Trip rows.
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

type Lang = keyof typeof LABELS;
const toLang = (locale: string): Lang => (locale === "en" || locale === "es" ? locale : "pt");

/**
 * The approved fare line for a card (the Owner-approved compact lines, e.g. "Grupo de 4 adultos" / "R$ 650/pessoa"), or
 * null when the tour's public price is not authorized or not confirmed in that language. Source: code tables only.
 */
export function approvedPublicPrice(tripId: string, locale: string): { label: string; value: string } | null {
  if (!PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(tripId)) return null;
  const offer = PROTOTYPE_OFFER[tripId];
  const l = toLang(locale);
  const label = offer?.mobilePriceLines?.lead[l]?.trim();
  const value = offer?.mobilePriceLines?.value[l]?.trim();
  if (!offer?.approvedPricing || offer.priceStatusByLocale?.[l] !== "CONFIRMED" || !label || !value) return null;
  return { label, value };
}

/**
 * Price texts for a public card or the legacy detail: the approved fare when authorized; otherwise the quote-on-request
 * texts for a tour whose stored price must not be shown; null only when the stored price applies (no own tour).
 */
export function priceOnRequest(tripId: string, locale: string): { label: string; value: string } | null {
  const approved = approvedPublicPrice(tripId, locale);
  if (approved) return approved;
  if (!PRICE_ON_REQUEST_TRIP_IDS.has(tripId)) return null;
  return LABELS[toLang(locale)];
}
