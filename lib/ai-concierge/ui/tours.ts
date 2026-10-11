/**
 * Closed allow-list of the tours the Concierge panel may present as recommendation cards.
 * Every field is traceable to approved material: the id, title and public URL path come from the approved catalog snapshots
 * (`knowledge/concierge/versions/public-tour-catalog/<id>/…`); `summary` is a VERBATIM excerpt of the approved snapshot
 * description (a test enforces it); the photo is the image configured for the published trip in the repository's launch data
 * (`data/real-trips.json`, `/public/images/trips`). There is deliberately no price, duration, schedule or availability here:
 * those are dynamic data the Concierge never states (RT-67 gates). A summary is a clean, self-contained sentence of the approved
 * description, never a cut that changes its meaning; texts that need a better wording are Owner decisions.
 */
export type TourCardData = {
  id: string;
  title: string;
  summary: string;
  /** Site-relative path of the public tour page (PT): the link always stays on the host that serves the panel. */
  path: string;
  image: string;
  imageAlt: string;
};

export const APPROVED_TOUR_CARDS: readonly TourCardData[] = [
  {
    id: "cmlhxkpy9000028zq27rhytew",
    title: "Cristo Redentor + Pão de Açúcar",
    summary: "Visite os dois pontos turísticos mais famosos do Rio em um único passeio",
    path: "/pt/tours/cmlhxkpy9000028zq27rhytew",
    image: "/images/trips/imagem-pao-de-acucar.jpg",
    imageAlt: "Visitante no mirante do Pão de Açúcar, com a Baía de Guanabara ao fundo",
  },
  {
    id: "cmlibniq40000z4zqkbujnutt",
    title: "Confeitaria Colombo + City Tour Rio",
    summary: "Inclui transporte confortável e acompanhamento guiado",
    path: "/pt/tours/cmlibniq40000z4zqkbujnutt",
    image: "/images/trips/confeitaria-colombo-city-tour.jpeg",
    imageAlt: "Confeitaria Colombo, no centro histórico do Rio de Janeiro",
  },
  {
    id: "cmljo0s1u0000t0zqa0bpd23p",
    title: "Tour Privado Premium Rio de Janeiro",
    summary: "Experiência exclusiva e personalizada pelos principais pontos do Rio",
    path: "/pt/tours/cmljo0s1u0000t0zqa0bpd23p",
    image: "/images/trips/imagem-igreja-centro-rio.jpg",
    imageAlt: "Igreja histórica no centro do Rio de Janeiro",
  },
  {
    id: "cmli1a6im000034zqqzc9sppb",
    title: "Tour Favela Rocinha com Guia Local",
    summary: "Conheça a cultura local da maior favela do Brasil com guia especializado",
    path: "/pt/tours/cmli1a6im000034zqqzc9sppb",
    image: "/images/trips/imagem-tour-favela-rocinha.jpg",
    imageAlt: "Vista da Rocinha, no Rio de Janeiro",
  },
] as const;

const BY_ID = new Map(APPROVED_TOUR_CARDS.map((tour) => [tour.id, tour]));
export const MAX_TOUR_CARDS = 3;

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
