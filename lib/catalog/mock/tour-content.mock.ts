import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-114 prototype data — FOR THE REBUILD LAB ONLY (production-hidden). Two clearly separated parts:
 *  1. PUBLISHED_SNAPSHOT: facts already published on www.ricardotour.com, copied verbatim on 2026-10-16 and verified by
 *     scripts/rt-111-verify-matrix.mjs (RT-111). REFERENCE ONLY since round 1 (Owner review 16/10): old prices, durations
 *     and itineraries are not approved for the new private-experience catalog and are NOT displayed by the prototype.
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
const mockList = (items: Array<[string, string, string]>) => ({
  pt: items.map(([pt]) => `${pt} (exemplo fictício)`),
  en: items.map(([, en]) => `${en} (fictitious example)`),
  es: items.map(([, , es]) => `${es} (ejemplo ficticio)`),
});

const ROCINHA_DIR = "/media/tours/favela-rocinha";
const ROCINHA_RIGHTS = (file: string) =>
  `Owner, 17/10/2026: own photo; consent/authorisation of the people shown declared by the Owner. Original: Drive MIDIAS/02_FAVELA_ROCINHA/ORIGINAIS/${file} (SHA-256 in docs/product/rt-116-rocinha-originals.sha256). Web copy: sRGB, metadata (incl. GPS) removed.`;

/**
 * RT-116 — REAL photographs selected and ordered by the Owner (17/10/2026), per tour. Rights: OWNER_ATTESTED.
 * Alt texts describe what each photo shows (no fictitious marker: they are real descriptions, still to be reviewed with
 * RT-115). The record that holds them stays MOCK/DRAFT, so the public gate never shows it.
 */
const OWNER_GALLERY: Record<string, TourContentRecord["images"]> = {
  cmli1a6im000034zqqzc9sppb: [
    {
      position: 0,
      src: `${ROCINHA_DIR}/rocinha-01-panorama-bandeira.jpg`,
      alt: {
        pt: "Vista do alto da Rocinha até São Conrado e o mar, com a bandeira do Brasil em primeiro plano",
        en: "View from the top of Rocinha down to São Conrado and the sea, with the Brazilian flag in the foreground",
        es: "Vista desde lo alto de la Rocinha hasta São Conrado y el mar, con la bandera de Brasil en primer plano",
      },
      isCover: true,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: ROCINHA_RIGHTS("IMG_1243.HEIC"),
      focalX: 0.5,
      focalY: 0.62,
    },
    {
      position: 1,
      src: `${ROCINHA_DIR}/rocinha-02-beco.jpg`,
      alt: {
        pt: "Visitantes descem um beco estreito da Rocinha entre casas coloridas",
        en: "Visitors walk down a narrow Rocinha alley between colourful houses",
        es: "Visitantes bajan por un callejón estrecho de la Rocinha entre casas coloridas",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: ROCINHA_RIGHTS("IMG_1253.HEIC"),
      focalX: 0.5,
      focalY: 0.55,
    },
    {
      position: 2,
      src: `${ROCINHA_DIR}/rocinha-03-mural.jpg`,
      alt: {
        pt: "Visitantes descem uma escadaria ao lado de um mural colorido de flores na Rocinha",
        en: "Visitors go down a staircase beside a colourful flower mural in Rocinha",
        es: "Visitantes bajan una escalera junto a un mural colorido de flores en la Rocinha",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: ROCINHA_RIGHTS("IMG_1252.HEIC"),
      credit: { pt: "Mural de @wark rocinha", en: "Mural by @wark rocinha", es: "Mural de @wark rocinha" },
      focalX: 0.55,
      focalY: 0.45,
    },
    {
      position: 3,
      src: `${ROCINHA_DIR}/rocinha-04-mirante-deck.jpg`,
      alt: {
        pt: "Vista de um terraço de madeira sobre a Rocinha, com montanhas e o mar ao fundo",
        en: "View from a wooden terrace over Rocinha, with mountains and the sea behind",
        es: "Vista desde una terraza de madera sobre la Rocinha, con montañas y el mar al fondo",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: ROCINHA_RIGHTS("img-favela-deck.HEIC"),
      focalX: 0.5,
      focalY: 0.45,
    },
    {
      position: 4,
      src: `${ROCINHA_DIR}/rocinha-05-panorama.jpg`,
      alt: {
        pt: "Panorama da Rocinha descendo até o mar sob céu nublado",
        en: "Panorama of Rocinha sloping down to the sea under a cloudy sky",
        es: "Panorama de la Rocinha bajando hasta el mar bajo un cielo nublado",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: ROCINHA_RIGHTS("IMG_1247.HEIC"),
      focalX: 0.5,
      focalY: 0.65,
    },
  ],
};

function mockRecord(id: string): TourContentRecord {
  const snap = PUBLISHED_SNAPSHOT[id];
  return {
    tripId: id,
    status: "DRAFT",
    source: MOCK_SOURCE,
    meetingPoint: mock("Busca no hotel, a confirmar pelo Owner", "Hotel pickup, to be confirmed by the Owner", "Recogida en el hotel, a confirmar por el Owner"),
    startTimeNote: mock("Horário a definir pelo Owner", "Start time to be defined by the Owner", "Horario a definir por el Owner"),
    languages: ["pt", "en", "es"],
    // Round 1 (Owner review 16/10): old catalog items (van transport, old duration, old price) are NOT carried over.
    inclusions: mockList([
      ["Guia dedicado ao seu grupo", "Guide dedicated to your group", "Guía dedicado a tu grupo"],
      ["Transporte privativo", "Private transport", "Transporte privado"],
      ["Itens incluídos a definir no RT-112", "Included items to be defined in RT-112", "Elementos incluidos a definir en RT-112"],
    ]),
    exclusions: mockList([
      ["Itens não incluídos a definir no RT-112", "Excluded items to be defined in RT-112", "Elementos no incluidos a definir en RT-112"],
    ]),
    requirements: mock("Requisitos de participação a definir", "Participation requirements to be defined", "Requisitos de participación a definir"),
    accessibility: mock("Informações de acessibilidade a confirmar", "Accessibility information to be confirmed", "Información de accesibilidad a confirmar"),
    weatherPolicy: mock("Regra de clima a definir no RT-81", "Weather rule to be defined in RT-81", "Regla de clima a definir en RT-81"),
    itinerary: [
      { position: 0, title: mock("Busca no hotel", "Hotel pickup", "Recogida en el hotel"), description: mock("Texto de layout para validar o roteiro", "Layout text to validate the itinerary", "Texto de maqueta para validar el itinerario"), durationMinutes: null },
      { position: 1, title: mock("Parada de exemplo A", "Example stop A", "Parada de ejemplo A"), description: mock("Texto de layout", "Layout text", "Texto de maqueta"), durationMinutes: 90 },
      { position: 2, title: mock("Parada de exemplo B", "Example stop B", "Parada de ejemplo B"), description: null, durationMinutes: 60 },
      { position: 3, title: mock("Retorno ao hotel", "Return to the hotel", "Regreso al hotel"), description: null, durationMinutes: null },
    ],
    // Gallery: the tour's REAL Owner-approved set when it exists (RT-116); otherwise a layout-only arrangement using ONLY
    // photos whose rights are already recorded: the tour's published photo (RT-79) and the Rio Story photos (RT-32).
    images: OWNER_GALLERY[id] ?? [
      { position: 0, src: snap.cover, alt: mock(`Foto atual do passeio ${snap.title}`, `Current photo of ${snap.title}`, `Foto actual de ${snap.title}`), isCover: true, rightsStatus: "OWNER_ATTESTED", rightsNote: "Owner attestation, RT-79 (14/10/2026)" },
      { position: 1, src: "/media/rio-story/rio-story-sunset.jpg", alt: mock("Pôr do sol no Rio", "Sunset in Rio", "Atardecer en Río"), isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: "RT-32 OWNER ORIGINAL" },
      { position: 2, src: "/media/rio-story/rio-story-church.jpg", alt: mock("Interior de igreja histórica", "Historic church interior", "Interior de iglesia histórica"), isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: "RT-32 OWNER ORIGINAL" },
    ],
  };
}

export const MOCK_TOUR_CONTENT: Record<string, TourContentRecord> = Object.fromEntries(
  Object.keys(PUBLISHED_SNAPSHOT).map((id) => [id, mockRecord(id)]),
);

/** Review status of each fact shown in the prototype (round 1): what is decided, provisional, pending or fictitious. */
export type FactStatus = "CONFIRMED" | "PROVISIONAL" | "PENDING" | "MOCK";

export type PrototypeOffer = {
  id: string;
  /** Current product name; official naming is RT-112 decision A7. */
  title: string;
  titleStatus: FactStatus;
  /** Editorial proposal for the hero line — NOT approved copy (RT-115). */
  pitch: LocalizedText;
  modality: { value: LocalizedText; status: FactStatus; source: string };
  pickup: { value: LocalizedText; status: FactStatus };
  /** null = pending pricing. Old catalog prices are deliberately NOT carried over (Owner, 16/10). */
  priceCents: number | null;
  duration: { value: LocalizedText | null; status: FactStatus };
  benefits: { pt: string[]; en: string[]; es: string[] };
  /** The current cover is provisional until RT-116 supplies a rights-cleared photo that shows the attraction. */
  coverStatus: FactStatus;
  /** RT-116 short clip (prototype-only: the RT-113 model has no video yet — documented gap for Sprint 11). */
  video: PrototypeVideo | null;
};

export type PrototypeVideo = {
  src: string;
  poster: string;
  durationSeconds: number;
  caption: LocalizedText;
  /** PROVISIONAL until the Owner approves the clip (Owner, 17/10: the video is reviewed before final approval). */
  status: FactStatus;
  rightsNote: string;
};

/** RT-116: Rocinha clip — IMG_1256.MOV 6.5–22 s (15.5 s), HDR→SDR, audio and metadata (incl. GPS) removed. */
const ROCINHA_VIDEO: PrototypeVideo = {
  src: `${ROCINHA_DIR}/rocinha-praca-movimento.mp4`,
  poster: `${ROCINHA_DIR}/rocinha-praca-movimento-poster.jpg`,
  durationSeconds: 15.5,
  caption: {
    pt: "A praça principal da Rocinha vista do alto: mototáxis, comércio e o movimento do dia a dia.",
    en: "Rocinha's main square from above: motorcycle taxis, shops and everyday life.",
    es: "La plaza principal de la Rocinha desde lo alto: mototaxis, comercios y el movimiento del día a día.",
  },
  status: "PROVISIONAL",
  rightsNote: ROCINHA_RIGHTS("IMG_1256.MOV"),
};

const PRIVATE: LocalizedText = { pt: "Experiência privativa", en: "Private experience", es: "Experiencia privada" };
const PICKUP: LocalizedText = { pt: "Busca no hotel", en: "Hotel pickup", es: "Recogida en el hotel" };
const BENEFITS = mockList([
  ["Só o seu grupo, no seu ritmo", "Only your group, at your own pace", "Solo tu grupo, a tu ritmo"],
  ["Guia dedicado do início ao fim", "A dedicated guide from start to finish", "Guía dedicado de principio a fin"],
  ["Roteiro ajustado ao seu interesse", "Route adjusted to your interests", "Itinerario ajustado a tus intereses"],
]);

function offer(id: string, pitch: LocalizedText): PrototypeOffer {
  return {
    id,
    title: PUBLISHED_SNAPSHOT[id].title,
    titleStatus: "PROVISIONAL",
    pitch,
    modality: { value: PRIVATE, status: "CONFIRMED", source: "Owner, 16/10/2026: os quatro produtos próprios serão experiências privativas nesta fase" },
    pickup: { value: PICKUP, status: "PROVISIONAL" },
    priceCents: null,
    duration: { value: null, status: "PENDING" },
    benefits: BENEFITS as { pt: string[]; en: string[]; es: string[] },
    // RT-116: the Owner confirmed the Rocinha cover and gallery (17/10/2026); the other tours still wait for their photos.
    coverStatus: OWNER_GALLERY[id] ? "CONFIRMED" : "PROVISIONAL",
    video: id === "cmli1a6im000034zqqzc9sppb" ? ROCINHA_VIDEO : null,
  };
}

/** Prototype offers for the four existing tours (round 1). Pitches are editorial PROPOSALS marked as fictitious. */
export const PROTOTYPE_OFFER: Record<string, PrototypeOffer> = {
  cmlhxkpy9000028zq27rhytew: offer("cmlhxkpy9000028zq27rhytew", mock(
    "Conheça os cartões-postais mais famosos do Rio em uma experiência privativa, com guia dedicado",
    "Discover Rio's most famous landmarks on a private experience with a dedicated guide",
    "Conoce las postales más famosas de Río en una experiencia privada con guía dedicado",
  )),
  cmli1a6im000034zqqzc9sppb: offer("cmli1a6im000034zqqzc9sppb", mock(
    "Uma visita privativa à Rocinha, guiada por quem conhece a comunidade",
    "A private visit to Rocinha, guided by people who know the community",
    "Una visita privada a la Rocinha, guiada por quien conoce la comunidad",
  )),
  cmlibniq40000z4zqkbujnutt: offer("cmlibniq40000z4zqkbujnutt", mock(
    "O centro histórico do Rio e a Confeitaria Colombo em uma experiência privativa",
    "Rio's historic centre and Confeitaria Colombo on a private experience",
    "El centro histórico de Río y la Confeitaria Colombo en una experiencia privada",
  )),
  cmljo0s1u0000t0zqa0bpd23p: offer("cmljo0s1u0000t0zqa0bpd23p", mock(
    "Um dia inteiro no Rio, com roteiro desenhado para o seu grupo",
    "A full day in Rio with a route designed for your group",
    "Un día completo en Río con un itinerario diseñado para tu grupo",
  )),
};
