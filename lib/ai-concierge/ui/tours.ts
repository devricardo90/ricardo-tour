import cardsData from "@/knowledge/concierge/catalog/approved-tour-cards.json";

/**
 * Closed allow-list of the tours the Concierge may present as recommendation cards and name in a WhatsApp message.
 * Every field is traceable to approved material: the id, title and public URL path come from the approved catalog snapshots
 * (`knowledge/concierge/versions/public-tour-catalog/<id>/…`); the Portuguese `summary` is a VERBATIM, self-contained excerpt
 * of the approved snapshot description (a test enforces it); the English and Spanish summaries are faithful translations of that
 * same excerpt (the product names stay as published); the photo is the image configured for the published trip in the
 * repository's launch data (`data/real-trips.json`, `/public/images/trips`). There is deliberately no price, duration,
 * schedule, inclusion or availability here: those are commercial/dynamic data the Concierge never states.
 */
export type TourCardData = {
  id: string;
  title: string;
  /** Verbatim approved excerpt (Portuguese). */
  summary: string;
  summary_en: string;
  summary_es: string;
  /** Site-relative path of the public tour page (PT). The page path for other languages swaps the locale segment. */
  path: string;
  image: string;
  imageAlt: string;
  imageAlt_en: string;
  imageAlt_es: string;
  /** Normalized (lowercase, accent-free) words that point at this tour in pt/en/es. */
  keywords: readonly string[];
};

/**
 * The data lives in `knowledge/concierge/catalog/approved-tour-cards.json` (single place to update when a tour is published).
 * Updating it never touches the AI architecture: add the entry, refresh the catalog snapshot, run the consistency test.
 */
export const APPROVED_TOUR_CARDS: readonly TourCardData[] = cardsData.tours.map((tour) => { const { specific, ...card } = tour; void specific; return card as TourCardData; });

const BY_ID = new Map(APPROVED_TOUR_CARDS.map((tour) => [tour.id, tour]));
export const MAX_TOUR_CARDS = 3;

export const altFor = (tour: TourCardData, lang: "pt" | "en" | "es") => (lang === "en" ? tour.imageAlt_en : lang === "es" ? tour.imageAlt_es : tour.imageAlt);

/** Display text only (the stored Portuguese summary stays verbatim); the first letter is capitalized for presentation. */
export const summaryFor = (tour: TourCardData, lang: "pt" | "en" | "es") => {
  const text = lang === "en" ? tour.summary_en : lang === "es" ? tour.summary_es : tour.summary;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Resolves ids to approved cards; unknown ids are dropped, duplicates removed, at most three, original order kept. */
export function resolveTourCards(ids: readonly string[] | undefined): TourCardData[] {
  const seen = new Set<string>();
  const cards: TourCardData[] = [];
  for (const id of ids ?? []) {
    const tour = BY_ID.get(id);
    if (!tour || seen.has(id)) continue;
    seen.add(id);
    cards.push(tour);
    if (cards.length === MAX_TOUR_CARDS) break;
  }
  return cards;
}

/** Catalog source ids look like `public-tour-catalog:<tripId>:pt`. Returns the trip ids found, in order (server-side use). */
export function tourIdsFromSourceIds(sourceIds: readonly string[] | undefined): string[] {
  const ids: string[] = [];
  for (const sourceId of sourceIds ?? []) {
    const match = /^public-tour-catalog:([a-z0-9]+):pt$/.exec(sourceId);
    if (match) ids.push(match[1]);
  }
  return ids;
}

const normalize = (text: string) => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
const hasWord = (text: string, keyword: string) => new RegExp(`(?:^|[^a-z0-9])${keyword.replace(/ /g, "\\s+")}(?:[^a-z0-9]|$)`).test(text);

/** Strong, unambiguous mention of ONE specific tour (its name or place). Used to give the WhatsApp message a tour context. */
const SPECIFIC: Record<string, readonly string[]> = Object.fromEntries(cardsData.tours.map((tour) => [tour.id, tour.specific ?? []]));

/** Returns the single approved tour clearly named in the text, or null when none or several tours are named. */
export function detectTourMention(text: string): string | null {
  const t = normalize(text);
  const found = Object.entries(SPECIFIC)
    .filter(([, words]) => words.some((word) => hasWord(t, word)))
    .map(([id]) => id);
  return found.length === 1 ? found[0] : null;
}

/** The default "classic" picks when nothing more specific is asked. Rocinha is only recommended when the visitor asks for it. */
const DEFAULT_RECOMMENDATIONS: readonly string[] = cardsData.default_recommendations;

/**
 * Deterministic selection of 1 to 3 approved tours for a recommendation request. Tours whose keywords appear in the request
 * come first (in catalog order); when nothing matches, the default classics are offered. Never invents or reorders by price.
 */
export function selectRecommendations(text: string): TourCardData[] {
  const t = normalize(text);
  const matched = APPROVED_TOUR_CARDS.filter((tour) => tour.keywords.some((keyword) => hasWord(t, keyword)));
  if (matched.length > 0) return matched.slice(0, MAX_TOUR_CARDS);
  return resolveTourCards(DEFAULT_RECOMMENDATIONS);
}
