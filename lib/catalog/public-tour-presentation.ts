import { PROTOTYPE_OFFER, type FactStatus, type PrototypeOffer } from "@/lib/catalog/mock/tour-content.mock";
import { getTourContent, type LocalizedText, type TourContentView } from "@/lib/catalog/tour-content";
import { legalPagesPublished } from "@/lib/legal/publication";
import type { PrototypeOfferView } from "@/components/site/tour/content/tour-detail-prototype";

/**
 * Public integration of the Owner-approved tour design (Sprint 10). The approved page (TourDetailPrototype) is rendered
 * on the public route ONLY when BOTH gates pass for the requested locale:
 *  1. Content gate (lib/catalog/tour-content.ts, audience "public"): DB content OWNER_APPROVED with a matching approval
 *     fingerprint; media only when rights are verified and authorized by the same approval act. Never mock data.
 *  2. Presentation gate (this file): the hero title and pitch are CONFIRMED for the locale. Every other presentation
 *     fact is published only when CONFIRMED for the locale; PROVISIONAL, PENDING and MOCK facts are dropped, as are the
 *     internal provisional prices and all review-lab notices.
 * Otherwise the caller keeps the current public page. Nothing here changes a status, a text or a price.
 */

type Locale = "pt" | "en" | "es";

/** The three own tours whose approved design may go public (TOUR-04 Premium stays out: placeholders only). */
export const PUBLIC_DESIGN_TRIP_IDS: ReadonlySet<string> = new Set([
  "cmlhxkpy9000028zq27rhytew", // TOUR-01 Cristo Redentor + Pão de Açúcar
  "cmli1a6im000034zqqzc9sppb", // TOUR-02 Favela Rocinha
  "cmlibniq40000z4zqkbujnutt", // TOUR-03 Centro Histórico e Cultural do Rio
]);

/**
 * Tours whose Owner-approved fare table may be shown publicly. EMPTY on purpose: commercial approval of a table is not a
 * publication authorization (RT-120). Until the Owner authorizes it, the public price reads "Orçamento sob consulta".
 */
export const PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS: ReadonlySet<string> = new Set([]);

/** Answers that list payment methods (RT-121: PIX, card terminal, cash) in PT/EN/ES. */
export const PAYMENT_METHOD_TEXT = /\bPIX\b|maquininha|card terminal|terminal de pago|dinheiro|\bcash\b|efectivo/i;

const toLocale = (locale: string): Locale => (locale === "en" || locale === "es" ? locale : "pt");
const statusIn = (locale: Locale, status: FactStatus, byLocale?: Partial<Record<Locale, FactStatus>>) => byLocale?.[locale] ?? status;
const only = (value: LocalizedText | null | undefined, locale: Locale): LocalizedText => {
  const text = value?.[locale]?.trim();
  return text ? { [locale]: text } : {};
};
const has = (value: LocalizedText | null | undefined, locale: Locale) => Boolean(value?.[locale]?.trim());

function confirmedFact<T extends { value: LocalizedText | null; status: FactStatus; statusByLocale?: Partial<Record<Locale, FactStatus>> }>(fact: T | undefined, locale: Locale) {
  if (!fact || !fact.value || statusIn(locale, fact.status, fact.statusByLocale) !== "CONFIRMED" || !has(fact.value, locale)) return undefined;
  return { value: only(fact.value, locale), status: "CONFIRMED" as const };
}

/** Pure presentation gate: the public offer for one locale, or null when the hero is not confirmed for that locale. */
export function buildPublicOffer(source: PrototypeOffer, locale: string, content: TourContentView, options: { pricePublicationAuthorized: boolean }): PrototypeOfferView | null {
  const l = toLocale(locale);
  const title = source.titleByLocale ?? { pt: source.title };
  if (statusIn(l, source.titleStatus, source.titleStatusByLocale) !== "CONFIRMED" || !has(title, l)) return null;
  if (statusIn(l, source.pitchStatus, source.pitchStatusByLocale) !== "CONFIRMED" || !has(source.pitch, l)) return null;

  const benefitsConfirmed = statusIn(l, source.benefitsStatus, source.benefitsStatusByLocale) === "CONFIRMED";
  const benefits = { pt: [] as string[], en: [] as string[], es: [] as string[] };
  if (benefitsConfirmed) benefits[l] = [...source.benefits[l]];

  // Video: only a clip the Owner CONFIRMED that also passed the content gate (rights + publication act).
  const gatedVideo = source.video ? content.videos.find((v) => v.src === source.video?.src) : undefined;
  const video = source.video && source.video.status === "CONFIRMED" && gatedVideo && has(source.video.title, l) && has(source.video.caption, l)
    ? { title: only(source.video.title, l), src: gatedVideo.src, mobileSrc: gatedVideo.mobileSrc ?? undefined, poster: gatedVideo.poster, durationSeconds: gatedVideo.durationSeconds ?? source.video.durationSeconds, caption: only(source.video.caption, l), status: "CONFIRMED" as const }
    : null;

  const pricePublic = Boolean(options.pricePublicationAuthorized && source.approvedPricing && source.priceStatusByLocale?.[l] === "CONFIRMED" && has(source.priceSummary, l));

  return {
    title: (title[l] ?? "").trim(),
    titleByLocale: only(title, l),
    titleStatus: "CONFIRMED",
    pitch: only(source.pitch, l),
    pitchStatus: "CONFIRMED",
    modality: confirmedFact(source.modality, l) ?? { value: {}, status: "PENDING" },
    pickup: confirmedFact(source.pickup, l) ?? { value: {}, status: "PENDING" },
    duration: confirmedFact(source.duration, l) ?? { value: null, status: "PENDING" },
    groupSize: confirmedFact(source.groupSize, l),
    minAge: confirmedFact(source.minAge, l),
    children: confirmedFact(source.children, l),
    transport: confirmedFact(source.transport, l),
    benefits,
    benefitsStatus: benefitsConfirmed ? "CONFIRMED" : "PENDING",
    priceCents: null,
    priceLabel: only(source.priceLabel, l),
    coverStatus: "CONFIRMED",
    video,
    contentStatus: "CONFIRMED",
    hotelPickup: source.hotelPickup,
    whatsappMessage: has(source.whatsappMessage, l) ? only(source.whatsappMessage, l) : undefined,
    // Public pages have no review notes: the request section ("Solicitar disponibilidade" target) must always offer the
    // approved WhatsApp request button (TOUR-01 pattern) whenever the tour has a WhatsApp message, never a dead end.
    requestViaWhatsapp: source.requestViaWhatsapp ?? has(source.whatsappMessage, l),
    hideWhatsAppCta: source.hideWhatsAppCta,
    requestFlowMode: source.requestFlowMode,
    noPortugueseFallback: true,
    ...(pricePublic
      ? { approvedPricing: source.approvedPricing, approvedPricingPublic: true, pricingNote: source.pricingNote ? only(source.pricingNote, l) : undefined, priceSummary: only(source.priceSummary, l), priceCondition: only(source.priceCondition, l), priceStatusByLocale: { [l]: "CONFIRMED" as const }, mobilePriceLines: source.mobilePriceLines && has(source.mobilePriceLines.value, l) ? { lead: only(source.mobilePriceLines.lead, l), value: only(source.mobilePriceLines.value, l) } : undefined }
      : {}),
  };
}

export type PublicTourPresentation = { offer: PrototypeOfferView; content: TourContentView };

/**
 * Approved design for a public tour page, or null to keep the current page. Callers must have resolved the trip through
 * the public catalog gate (getPublicTripById) first.
 */
export async function getPublicTourPresentation(tripId: string, locale: string): Promise<PublicTourPresentation | null> {
  if (!PUBLIC_DESIGN_TRIP_IDS.has(tripId)) return null;
  const source = PROTOTYPE_OFFER[tripId];
  if (!source) return null;
  let content: TourContentView | null;
  try {
    content = await getTourContent(tripId, locale, "public");
  } catch (error) {
    // Fail closed to the current page (e.g. the RT-113 tables are not migrated yet); never a 500 on the catalog.
    console.error("[public-tour-presentation] content gate unavailable, keeping the current page", { tripId, reason: error instanceof Error ? error.message : String(error) });
    return null;
  }
  if (!content || content.isMock || !content.approvalValid) return null;
  // Owner 31/10/2026: until paid bookings open (separate PIX sprint), the informative catalog names no payment method.
  // The approved FAQ text is kept as is; only the answers that list methods are left out of the public page.
  const bookingsOpen = PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(tripId) && legalPagesPublished();
  if (!bookingsOpen) content = { ...content, faq: content.faq.filter((item) => !PAYMENT_METHOD_TEXT.test(item.answer)) };
  const offer = buildPublicOffer(source, locale, content, { pricePublicationAuthorized: PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(tripId) });
  return offer ? { offer, content } : null;
}
