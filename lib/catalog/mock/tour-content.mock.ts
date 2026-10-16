import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-114 prototype data — FOR THE REBUILD LAB ONLY (production-hidden). Two clearly separated parts:
 *  1. PUBLISHED_SNAPSHOT: facts already published on www.ricardotour.com, copied verbatim on 2026-10-16 and verified by
 *     scripts/rt-111-verify-matrix.mjs (RT-111). Prices are the published ones and are NOT changed here.
 *  2. MOCK_TOUR_CONTENT: FICTITIOUS placeholders for the fields that do not exist yet (meeting point, itinerary, rules).
 *     Every record has source "MOCK …" and status DRAFT, so the publication gate can never show it (validateTourContent
 *     rejects approving a MOCK record). The texts say "exemplo fictício" so nobody can mistake them for real information.
 * A test forbids importing this module from public routes (tests/rt-113-tour-content.test.ts).
 */

export const MOCK_SOURCE = "MOCK — dados fictícios para o protótipo visual do RT-114 (16/10/2026). Não é informação comercial.";

export type PublishedSnapshot = {
  id: string;
  title: string;
  priceCents: number;
  duration: string;
  category: string;
  summary: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  cover: string;
};

/** Verbatim copy of the published Portuguese content (RT-111 matrix §3). */
export const PUBLISHED_SNAPSHOT: Record<string, PublishedSnapshot> = {
  cmlhxkpy9000028zq27rhytew: {
    id: "cmlhxkpy9000028zq27rhytew",
    title: "Cristo Redentor + Pão de Açúcar",
    priceCents: 38500,
    duration: "5 a 6 horas",
    category: "Passeio Clássico",
    summary: "Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos.",
    highlights: ["Cristo Redentor", "Bondinho do Pão de Açúcar", "Vista da Baía de Guanabara"],
    included: ["Transporte em van", "Guia turístico", "Ingresso Cristo Redentor", "Ingresso Pão de Açúcar"],
    notIncluded: ["Alimentação"],
    cover: "/images/trips/imagem-pao-de-acucar.jpg",
  },
  cmli1a6im000034zqqzc9sppb: {
    id: "cmli1a6im000034zqqzc9sppb",
    title: "Tour Favela Rocinha com Guia Local",
    priceCents: 12000,
    duration: "3 a 4 horas",
    category: "Experiência Cultural",
    summary: "Conheça a cultura local da maior favela do Brasil com guia especializado e experiência guiada na Rocinha.",
    highlights: ["Vista panorâmica da Rocinha", "Interação com comunidade local", "Cultura e história"],
    included: ["Guia local", "Transporte", "Passeio guiado"],
    notIncluded: ["Alimentação"],
    cover: "/images/trips/imagem-tour-favela-rocinha.jpg",
  },
  cmlibniq40000z4zqkbujnutt: {
    id: "cmlibniq40000z4zqkbujnutt",
    title: "Confeitaria Colombo + City Tour Rio",
    priceCents: 24500,
    duration: "5 horas",
    category: "City Tour",
    summary:
      "Explore o principal cartão-postal do Brasil com visita a confeitaria colombo r e passeio pelos pontos históricos do Rio de Janeiro. Inclui transporte confortável e acompanhamento guiado.",
    highlights: ["Cristo Redentor", "Vista panorâmica da cidade", "Centro histórico", "Guia bilíngue"],
    included: ["Transporte ida e volta", "Guia turístico", "Paradas para fotos"],
    notIncluded: ["Alimentação", "Ingresso opcional trem ou van"],
    cover: "/images/trips/confeitaria-colombo-city-tour.jpeg",
  },
  cmljo0s1u0000t0zqa0bpd23p: {
    id: "cmljo0s1u0000t0zqa0bpd23p",
    title: "Tour Privado Premium Rio de Janeiro",
    priceCents: 90000,
    duration: "8 horas",
    category: "Premium",
    summary: "Experiência exclusiva e personalizada pelos principais pontos do Rio com guia privado e veículo confortável.",
    highlights: ["Roteiro personalizado", "Cristo Redentor", "Pão de Açúcar", "Santa Teresa", "Escadaria Selarón"],
    included: ["Guia privado", "Transporte executivo", "Flexibilidade total de roteiro"],
    notIncluded: ["Ingressos", "Alimentação"],
    cover: "/images/trips/imagem-igreja-centro-rio.jpg",
  },
};

const mock = (pt: string, en: string, es: string): LocalizedText => ({ pt: `${pt} (exemplo fictício)`, en: `${en} (fictitious example)`, es: `${es} (ejemplo ficticio)` });

function mockRecord(id: string): TourContentRecord {
  const snap = PUBLISHED_SNAPSHOT[id];
  return {
    tripId: id,
    status: "DRAFT",
    source: MOCK_SOURCE,
    meetingPoint: mock("Ponto de encontro a definir pelo Owner", "Meeting point to be defined by the Owner", "Punto de encuentro a definir por el Owner"),
    startTimeNote: mock("Horário a definir pelo Owner", "Start time to be defined by the Owner", "Horario a definir por el Owner"),
    languages: ["pt", "en", "es"],
    requirements: mock("Requisitos de participação a definir", "Participation requirements to be defined", "Requisitos de participación a definir"),
    accessibility: mock("Informações de acessibilidade a confirmar", "Accessibility information to be confirmed", "Información de accesibilidad a confirmar"),
    weatherPolicy: mock("Regra de clima a definir no RT-81", "Weather rule to be defined in RT-81", "Regla de clima a definir en RT-81"),
    itinerary: [
      { position: 0, title: mock("Parada de exemplo A", "Example stop A", "Parada de ejemplo A"), description: mock("Texto de layout para validar o roteiro", "Layout text to validate the itinerary", "Texto de maqueta para validar el itinerario"), durationMinutes: 60 },
      { position: 1, title: mock("Parada de exemplo B", "Example stop B", "Parada de ejemplo B"), description: null, durationMinutes: 90 },
      { position: 2, title: mock("Parada de exemplo C", "Example stop C", "Parada de ejemplo C"), description: mock("Texto de layout", "Layout text", "Texto de maqueta"), durationMinutes: null },
    ],
    // Gallery arrangement for layout only, using ONLY photos whose rights are already recorded: the tour's own published
    // photo (authorship declared by the Owner, RT-79) and the Rio Story photos (RT-32 "OWNER ORIGINAL").
    images: [
      { position: 0, src: snap.cover, alt: mock(`Foto publicada do passeio ${snap.title}`, `Published photo of ${snap.title}`, `Foto publicada de ${snap.title}`), isCover: true, rightsStatus: "OWNER_ATTESTED", rightsNote: "Owner attestation, RT-79 (14/10/2026)" },
      { position: 1, src: "/media/rio-story/rio-story-sunset.jpg", alt: mock("Pôr do sol no Rio", "Sunset in Rio", "Atardecer en Río"), isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: "RT-32 OWNER ORIGINAL" },
      { position: 2, src: "/media/rio-story/rio-story-church.jpg", alt: mock("Interior de igreja histórica", "Historic church interior", "Interior de iglesia histórica"), isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: "RT-32 OWNER ORIGINAL" },
    ],
  };
}

export const MOCK_TOUR_CONTENT: Record<string, TourContentRecord> = Object.fromEntries(
  Object.keys(PUBLISHED_SNAPSHOT).map((id) => [id, mockRecord(id)]),
);
