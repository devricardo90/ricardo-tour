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

export const APPROVED_TOUR_CARDS: readonly TourCardData[] = [
  {
    id: "cmlhxkpy9000028zq27rhytew",
    title: "Cristo Redentor + Pão de Açúcar",
    summary: "Visite os dois pontos turísticos mais famosos do Rio em um único passeio",
    summary_en: "Visit Rio's two most famous landmarks in a single tour",
    summary_es: "Visita los dos puntos turísticos más famosos de Río en un solo paseo",
    path: "/pt/tours/cmlhxkpy9000028zq27rhytew",
    image: "/images/trips/imagem-pao-de-acucar.jpg",
    imageAlt: "Visitante no mirante do Pão de Açúcar, com a Baía de Guanabara ao fundo",
    imageAlt_en: "Visitor at the Sugarloaf viewpoint, with Guanabara Bay in the background",
    imageAlt_es: "Visitante en el mirador del Pan de Azúcar, con la Bahía de Guanabara al fondo",
    keywords: ["cristo", "christ", "redentor", "redeemer", "corcovado", "pao de acucar", "sugarloaf", "sugar loaf", "pan de azucar"],
  },
  {
    id: "cmlibniq40000z4zqkbujnutt",
    title: "Confeitaria Colombo + City Tour Rio",
    summary: "passeio pelos pontos históricos do Rio de Janeiro",
    summary_en: "A tour of Rio de Janeiro's historic landmarks",
    summary_es: "Un paseo por los puntos históricos de Río de Janeiro",
    path: "/pt/tours/cmlibniq40000z4zqkbujnutt",
    image: "/images/trips/confeitaria-colombo-city-tour.jpeg",
    imageAlt: "Confeitaria Colombo, no centro histórico do Rio de Janeiro",
    imageAlt_en: "Confeitaria Colombo, in the historic center of Rio de Janeiro",
    imageAlt_es: "Confeitaria Colombo, en el centro histórico de Río de Janeiro",
    keywords: ["colombo", "confeitaria", "city tour", "citytour", "historico", "historicos", "historia", "history", "historic", "historical", "downtown", "cafe"],
  },
  {
    id: "cmljo0s1u0000t0zqa0bpd23p",
    title: "Tour Privado Premium Rio de Janeiro",
    summary: "Experiência exclusiva e personalizada pelos principais pontos do Rio",
    summary_en: "An exclusive, personalized experience through Rio's main sights",
    summary_es: "Una experiencia exclusiva y personalizada por los principales puntos de Río",
    path: "/pt/tours/cmljo0s1u0000t0zqa0bpd23p",
    image: "/images/trips/imagem-igreja-centro-rio.jpg",
    imageAlt: "Igreja histórica no centro do Rio de Janeiro",
    imageAlt_en: "Historic church in downtown Rio de Janeiro",
    imageAlt_es: "Iglesia histórica en el centro de Río de Janeiro",
    keywords: ["privado", "private", "privativo", "premium", "exclusivo", "exclusiva", "exclusive", "personalizado", "personalized", "vip", "familia", "family", "casal", "couple", "pareja"],
  },
  {
    id: "cmli1a6im000034zqqzc9sppb",
    title: "Tour Favela Rocinha com Guia Local",
    summary: "Conheça a cultura local da maior favela do Brasil com guia especializado",
    summary_en: "Discover the local culture of Brazil's largest favela with a specialized guide",
    summary_es: "Conoce la cultura local de la favela más grande de Brasil con un guía especializado",
    path: "/pt/tours/cmli1a6im000034zqqzc9sppb",
    image: "/images/trips/imagem-tour-favela-rocinha.jpg",
    imageAlt: "Vista da Rocinha, no Rio de Janeiro",
    imageAlt_en: "View of Rocinha, in Rio de Janeiro",
    imageAlt_es: "Vista de la Rocinha, en Río de Janeiro",
    keywords: ["rocinha", "favela", "comunidade", "community", "comunidad", "cultura local", "local culture"],
  },
] as const;

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
const SPECIFIC: Record<string, readonly string[]> = {
  cmlhxkpy9000028zq27rhytew: ["cristo", "christ", "redentor", "redeemer", "corcovado", "pao de acucar", "sugarloaf", "sugar loaf", "pan de azucar"],
  cmlibniq40000z4zqkbujnutt: ["colombo", "confeitaria", "city tour", "citytour"],
  cmljo0s1u0000t0zqa0bpd23p: ["tour privado", "private tour", "tour premium", "premium", "passeio privado", "paseo privado"],
  cmli1a6im000034zqqzc9sppb: ["rocinha"],
};

/** Returns the single approved tour clearly named in the text, or null when none or several tours are named. */
export function detectTourMention(text: string): string | null {
  const t = normalize(text);
  const found = Object.entries(SPECIFIC)
    .filter(([, words]) => words.some((word) => hasWord(t, word)))
    .map(([id]) => id);
  return found.length === 1 ? found[0] : null;
}

/** The default "classic" picks when nothing more specific is asked. Rocinha is only recommended when the visitor asks for it. */
const DEFAULT_RECOMMENDATIONS = ["cmlhxkpy9000028zq27rhytew", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"] as const;

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
