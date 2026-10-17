import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";
import {
  ROCINHA_BENEFITS,
  ROCINHA_CONTENT,
  ROCINHA_DRAFT_SOURCE,
  ROCINHA_GROUP_SIZE,
  ROCINHA_ID,
  ROCINHA_MEETING_SHORT,
  ROCINHA_MIN_AGE,
  ROCINHA_PROVISIONAL_PRICING,
  ROCINHA_SUBTITLE,
  ROCINHA_TITLE,
  ROCINHA_WHATSAPP_MESSAGE,
} from "@/lib/catalog/drafts/rocinha.draft";

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
const CRISTO_DIR = "/media/tours/cristo-pao-selaron";
const CRISTO_RIGHTS = (driveFile: string, camera: string, people: boolean) =>
  `Owner, 17/10/2026: own photo ${camera} (editorially approved), identified by content (correlation 0.99+ against the Owner's visual index). File: Drive MIDIAS/01_CRISTO_PAO_DE_ACUCAR_SELARON/ORIGINAIS/${driveFile} (WebP 952×1269, no metadata; HEIC original not in the Drive).${people ? " Identifiable visitors: authorisation DECLARED by the Owner; written proof pending." : ""}`;
const THIRD_PARTY = (driveFile: string, photographer: string, url: string, work: string) =>
  `UNVERIFIED third-party photo. Owner candidate, photographer informed: ${photographer} (${url}). The Drive file ${driveFile} is a DIFFERENT photograph from the cited Pexels image (17/10/2026 comparison): real source unknown. Rights over ${work} need legal validation. No legal clearance.`;

const OWNER_GALLERY: Record<string, TourContentRecord["images"]> = {
  // RT-116 — Cristo Redentor + Pão de Açúcar + Escadaria Selarón (Owner editorial definition, 17/10/2026).
  // Own photos: 4 of the 5 approved (IMG_1162/1171/1163/1181), identified BY CONTENT against the Owner's visual index
  // (the Drive's 5th WebP is IMG_1180, not the approved IMG_1179: Owner decision pending, so it is not shown).
  // Third-party candidates (Cristo, Selarón): the Drive files do NOT match the cited Pexels photos -> UNVERIFIED, so the
  // public gate would hide them. ORDER AND COVER ARE A PROPOSAL for the Owner (coverStatus PROVISIONAL).
  cmlhxkpy9000028zq27rhytew: [
    {
      position: 0,
      src: `${CRISTO_DIR}/pao-01-IMG_1162-mirante.webp`,
      alt: {
        pt: "Dois visitantes no mirante com o Pão de Açúcar ao fundo, sob céu azul com nuvens",
        en: "Two visitors at a viewpoint with Sugarloaf Mountain behind them, under a blue sky with clouds",
        es: "Dos visitantes en el mirador con el Pan de Azúcar al fondo, bajo un cielo azul con nubes",
      },
      isCover: true,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: CRISTO_RIGHTS("img1-pao-de-acucar.webp", "IMG_1162", true),
      focalX: 0.45,
      focalY: 0.45,
    },
    {
      position: 1,
      src: `${CRISTO_DIR}/terceiros-cristo-redentor.jpg`,
      alt: {
        pt: "Estátua do Cristo Redentor de braços abertos, vista de baixo contra o céu azul",
        en: "The Christ the Redeemer statue with open arms, seen from below against a blue sky",
        es: "La estatua del Cristo Redentor con los brazos abiertos, vista desde abajo contra el cielo azul",
      },
      isCover: false,
      rightsStatus: "UNVERIFIED",
      rightsNote: THIRD_PARTY("img-cristo-redentor1.jpg", "Maxi Franzoi", "https://www.pexels.com/photo/christ-the-redeemer-in-rio-de-janeiro-9977483/", "the statue"),
      credit: { pt: "Foto de terceiros · origem em verificação", en: "Third-party photo · source being verified", es: "Foto de terceros · origen en verificación" },
      focalX: 0.5,
      focalY: 0.3,
    },
    {
      position: 2,
      src: `${CRISTO_DIR}/pao-02-IMG_1171-bondinho-cume.webp`,
      alt: {
        pt: "Cabos do bondinho chegando ao cume do Pão de Açúcar, com o mar ao fundo",
        en: "Cable car wires reaching the summit of Sugarloaf Mountain, with the sea behind",
        es: "Cables del teleférico llegando a la cima del Pan de Azúcar, con el mar al fondo",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: CRISTO_RIGHTS("img2-pao-de-acucar.webp", "IMG_1171", false),
      focalX: 0.5,
      focalY: 0.4,
    },
    {
      position: 3,
      src: `${CRISTO_DIR}/pao-03-IMG_1163-mirante-baia.webp`,
      alt: {
        pt: "Visitante apoiado no guarda-corpo do mirante, com a baía e os barcos ao fundo",
        en: "A visitor leaning on the viewpoint railing, with the bay and boats behind",
        es: "Visitante apoyado en la baranda del mirador, con la bahía y los barcos al fondo",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: CRISTO_RIGHTS("img3-pao-de-acucar.webp", "IMG_1163", true),
      focalX: 0.4,
      focalY: 0.55,
    },
    {
      position: 4,
      src: `${CRISTO_DIR}/pao-04-IMG_1181-visitante-deck.webp`,
      alt: {
        pt: "Visitante no deck do mirante, com montanhas e a cidade ao fundo",
        en: "A visitor on the viewpoint deck, with mountains and the city behind",
        es: "Visitante en la terraza del mirador, con montañas y la ciudad al fondo",
      },
      isCover: false,
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: CRISTO_RIGHTS("img4-pao-de-acucar.webp", "IMG_1181", true),
      focalX: 0.3,
      focalY: 0.5,
    },
    {
      position: 5,
      src: `${CRISTO_DIR}/terceiros-escadaria-selaron.jpg`,
      alt: {
        pt: "Escadaria Selarón com degraus de azulejos coloridos e um mural com a bandeira do Brasil no alto",
        en: "The Selarón Steps with colourful tiled steps and a Brazilian flag mural at the top",
        es: "La Escalera Selarón con escalones de azulejos de colores y un mural con la bandera de Brasil arriba",
      },
      isCover: false,
      rightsStatus: "UNVERIFIED",
      rightsNote: THIRD_PARTY("img-escadaria-selarao1.jpg", "Bruno Scramgnon", "https://www.pexels.com/photo/the-selaron-steps-in-rio-de-janeiro-brazil-13185516/", "the tiles (Jorge Selarón)"),
      credit: { pt: "Foto de terceiros · origem em verificação", en: "Third-party photo · source being verified", es: "Foto de terceros · origen en verificación" },
      focalX: 0.5,
      focalY: 0.55,
    },
  ],
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
      // Transcription of the inscription visible on the mural (17/10, crop of the original); artist identity NOT verified.
      credit: { pt: "Mural com a inscrição “@WARK ROCINHA...”", en: "Mural with the inscription “@WARK ROCINHA...”", es: "Mural con la inscripción “@WARK ROCINHA...”" },
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

/**
 * RT-115: tours whose REAL draft content exists replace the mock texts (still DRAFT: never public). Rocinha since
 * 17/10/2026 (Owner commercial closing). The other three keep the fictitious placeholders.
 */
function draftRecord(id: string): TourContentRecord | null {
  if (id !== ROCINHA_ID) return null;
  return { tripId: id, status: "DRAFT", source: ROCINHA_DRAFT_SOURCE, ...ROCINHA_CONTENT, images: OWNER_GALLERY[id] ?? [] };
}

export const MOCK_TOUR_CONTENT: Record<string, TourContentRecord> = Object.fromEntries(
  Object.keys(PUBLISHED_SNAPSHOT).map((id) => [id, draftRecord(id) ?? mockRecord(id)]),
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
  /** RT-115 (real content): localized commercial name, statuses of hero texts, extra essentials, WhatsApp prefill. */
  titleByLocale?: LocalizedText;
  pitchStatus: FactStatus;
  benefitsStatus: FactStatus;
  groupSize?: { value: LocalizedText; status: FactStatus };
  minAge?: { value: LocalizedText; status: FactStatus };
  whatsappMessage?: LocalizedText;
  /** Review chips for real content (record stays DRAFT): editorial status of the texts and of the FAQ/conditions. */
  contentStatus?: FactStatus;
  conditionsStatus?: FactStatus;
  /** INTERNAL provisional prices: shown only in the lab review mode as "NÃO PUBLICAR"; never on the public page. */
  provisionalPricing?: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }>;
};

export type PrototypeVideo = {
  title: LocalizedText;
  src: string;
  /** Lighter rendition for small screens (≈1 Mbps): served through <source media> (RT-116 slow-4G finding). */
  mobileSrc?: string;
  poster: string;
  durationSeconds: number;
  caption: LocalizedText;
  /** PROVISIONAL until the Owner approves the clip (Owner, 17/10: the video is reviewed before final approval). */
  status: FactStatus;
  rightsNote: string;
};

/** RT-116: Rocinha clip — IMG_1256.MOV 6.5–22 s (15.5 s), HDR→SDR, audio and metadata (incl. GPS) removed. */
const ROCINHA_VIDEO: PrototypeVideo = {
  title: { pt: "A Rocinha em movimento", en: "Rocinha in motion", es: "La Rocinha en movimiento" },
  src: `${ROCINHA_DIR}/rocinha-praca-movimento.mp4`,
  mobileSrc: `${ROCINHA_DIR}/rocinha-praca-movimento-mobile.mp4`,
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

/**
 * RT-116: Pão de Açúcar clip — web version of the Owner's version A window (IMG_1157.MOV 41–58 s, 17 s), poster = 51 s
 * frame. The edited file "versão A" is NOT in the Drive (only version B is): this is the web rendition made from the
 * original with the Rocinha pipeline (HDR→SDR, no audio, metadata incl. GPS removed). Not approved until the Owner
 * reviews playback.
 */
const PAO_VIDEO: PrototypeVideo = {
  title: { pt: "O Rio visto do Pão de Açúcar", en: "Rio seen from Sugarloaf Mountain", es: "Río visto desde el Pan de Azúcar" },
  src: `${CRISTO_DIR}/pao-bondinho-41-58.mp4`,
  mobileSrc: `${CRISTO_DIR}/pao-bondinho-41-58-mobile.mp4`,
  poster: `${CRISTO_DIR}/pao-bondinho-41-58-poster.jpg`,
  durationSeconds: 17,
  caption: {
    pt: "Do alto do Pão de Açúcar: a Baía de Botafogo, a cidade e o Cristo Redentor ao longe.",
    en: "From the top of Sugarloaf Mountain: Botafogo Bay, the city and Christ the Redeemer in the distance.",
    es: "Desde lo alto del Pan de Azúcar: la Bahía de Botafogo, la ciudad y el Cristo Redentor a lo lejos.",
  },
  status: "PROVISIONAL",
  rightsNote: "Owner, 17/10/2026: own video IMG_1157.MOV (Drive MIDIAS/01_CRISTO_PAO_DE_ACUCAR_SELARON/ORIGINAIS), window 41–58 s selected by the Owner; no people in the window; original audio not used.",
};

/** Tours whose cover/order the Owner confirmed (Rocinha, 17/10). Cristo + Pão + Selarón: order and cover are a proposal. */
const OWNER_CONFIRMED_COVER = new Set(["cmli1a6im000034zqqzc9sppb"]);

const PROTOTYPE_VIDEO: Record<string, PrototypeVideo> = {
  cmli1a6im000034zqqzc9sppb: ROCINHA_VIDEO,
  cmlhxkpy9000028zq27rhytew: PAO_VIDEO,
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
    coverStatus: OWNER_CONFIRMED_COVER.has(id) ? "CONFIRMED" : "PROVISIONAL",
    video: PROTOTYPE_VIDEO[id] ?? null,
    pitchStatus: "MOCK",
    benefitsStatus: "MOCK",
  };
}

/** RT-112/RT-115 — Rocinha offer from the Owner's commercial decisions (17/10/2026); content ready for Owner review. */
function rocinhaOffer(base: PrototypeOffer): PrototypeOffer {
  return {
    ...base,
    title: ROCINHA_TITLE.pt,
    titleByLocale: ROCINHA_TITLE,
    titleStatus: "CONFIRMED", // PT/EN/ES names approved by the Owner (17/10/2026)
    pitch: ROCINHA_SUBTITLE,
    pitchStatus: "CONFIRMED",
    pickup: { value: ROCINHA_MEETING_SHORT, status: "CONFIRMED" },
    duration: { value: ROCINHA_CONTENT.durationLabel ?? null, status: "CONFIRMED" },
    benefits: ROCINHA_BENEFITS,
    benefitsStatus: "PROVISIONAL", // benefit lines were not part of the Owner-approved list
    // Editorial corrections approved (17/10/2026); conditions and FAQ wording still depend on the RT-81 terms.
    contentStatus: "CONFIRMED",
    conditionsStatus: "PROVISIONAL",
    groupSize: { value: ROCINHA_GROUP_SIZE, status: "CONFIRMED" },
    minAge: { value: ROCINHA_MIN_AGE, status: "CONFIRMED" },
    whatsappMessage: ROCINHA_WHATSAPP_MESSAGE,
    provisionalPricing: ROCINHA_PROVISIONAL_PRICING,
  };
}

/** Prototype offers for the four existing tours (round 1). Pitches are editorial PROPOSALS marked as fictitious. */
export const PROTOTYPE_OFFER: Record<string, PrototypeOffer> = {
  cmlhxkpy9000028zq27rhytew: offer("cmlhxkpy9000028zq27rhytew", mock(
    "Conheça os cartões-postais mais famosos do Rio em uma experiência privativa, com guia dedicado",
    "Discover Rio's most famous landmarks on a private experience with a dedicated guide",
    "Conoce las postales más famosas de Río en una experiencia privada con guía dedicado",
  )),
  cmli1a6im000034zqqzc9sppb: rocinhaOffer(offer("cmli1a6im000034zqqzc9sppb", mock(
    "Uma visita privativa à Rocinha, guiada por quem conhece a comunidade",
    "A private visit to Rocinha, guided by people who know the community",
    "Una visita privada a la Rocinha, guiada por quien conoce la comunidad",
  ))),
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
