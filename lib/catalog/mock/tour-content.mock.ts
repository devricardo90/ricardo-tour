import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";
import { CENTRO_ID, CENTRO_TITLE } from "@/lib/catalog/drafts/centro-historico-media";
import { CENTRO_APPROVED_PRICING, CENTRO_COMMERCIAL_DRAFT, CENTRO_ROUTE_OPTIONS } from "@/lib/catalog/drafts/centro-historico-commercial";
import {
  CRISTO_BENEFITS,
  CRISTO_CHILDREN,
  CRISTO_CONTENT,
  CRISTO_DRAFT_SOURCE,
  CRISTO_GROUP_SIZE,
  CRISTO_ID,
  CRISTO_PICKUP_SHORT,
  CRISTO_APPROVED_PRICING,
  CRISTO_PRICE_CONDITION,
  CRISTO_PRICE_LABEL,
  CRISTO_PRICE_SUMMARY,
  CRISTO_PRICING_NOTE,
  CRISTO_SUBTITLE,
  CRISTO_TITLE,
  CRISTO_WHATSAPP_MESSAGE,
} from "@/lib/catalog/drafts/cristo-pao.draft";
import {
  ROCINHA_BENEFITS,
  ROCINHA_CONTENT,
  ROCINHA_DRAFT_SOURCE,
  ROCINHA_GROUP_SIZE,
  ROCINHA_ID,
  ROCINHA_MEETING_SHORT,
  ROCINHA_MIN_AGE,
  ROCINHA_APPROVED_PRICING,
  ROCINHA_PRICING_NOTE,
  ROCINHA_PRICE_SUMMARY,
  ROCINHA_PRICE_CONDITION,
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
/**
 * RT-116 rights (Owner decision 28/10/2026, replaces the 17/10/2026 rule "a declaration is not proof"): the Owner
 * declared that Ricardo Tour's OWN photos and videos are authorised for commercial use, including the authorisation of
 * the people shown. That declaration is recorded once (RT-116, Manual Mestre) and is not requested again: own media is
 * OWNER_ATTESTED. Material whose authorship or rights remain uncertain (third-party photos, artworks shown) stays
 * UNVERIFIED and is never public.
 */
export const OWNER_OWN_MEDIA_DECLARATION =
  "Owner, 28/10/2026: own photo/video of Ricardo Tour, authorised for commercial use, people shown included (declaration recorded in RT-116).";
const ROCINHA_ORIGINAL = (file: string) =>
  `Original: Drive MIDIAS/02_FAVELA_ROCINHA/ORIGINAIS/${file} (SHA-256 in docs/product/rt-116-rocinha-originals.sha256). Web copy: sRGB, metadata (incl. GPS) removed.`;
const ROCINHA_RIGHTS = (file: string) => `${OWNER_OWN_MEDIA_DECLARATION} ${ROCINHA_ORIGINAL(file)}`;

/**
 * RT-116 — REAL photographs selected and ordered by the Owner (17/10/2026), per tour. Rights: own media OWNER_ATTESTED
 * (Owner declaration 28/10/2026); the Rocinha mural photo stays UNVERIFIED (artwork rights uncertain).
 * Alt texts describe what each photo shows (no fictitious marker: they are real descriptions, still to be reviewed with
 * RT-115). The record that holds them stays MOCK/DRAFT, so the public gate never shows it.
 */
const CRISTO_DIR = "/media/tours/cristo-pao-selaron";
// Own photos: OWNER_ATTESTED by the Owner's declaration of 28/10/2026 (see OWNER_OWN_MEDIA_DECLARATION).
const CRISTO_RIGHTS = (driveFile: string, camera: string, people: boolean) =>
  `${OWNER_OWN_MEDIA_DECLARATION} Own photo ${camera}, editorially approved by the Owner (17/10/2026), identified by content (correlation 0.99+ against the Owner's visual index). File: Drive MIDIAS/01_CRISTO_PAO_DE_ACUCAR_SELARON/ORIGINAIS/${driveFile} (WebP 952×1269, no metadata; HEIC original not in the Drive).${people ? " Identifiable visitors: covered by the Owner's declaration." : ""}`;

const OWNER_GALLERY: Record<string, TourContentRecord["images"]> = {
  // RT-116 — Cristo Redentor + Pão de Açúcar + Escadaria Selarón (Owner editorial definition, 17/10/2026).
  // Own photos: 4 of the 5 approved (IMG_1162/1171/1163/1181), identified BY CONTENT against the Owner's visual index
  // (the Drive's 5th WebP is IMG_1180, not the approved IMG_1179: pending, so it is not shown). Rights: OWNER_ATTESTED (28/10).
  // The two third-party candidates (Cristo, Selarón) were REMOVED on 18/10/2026: their real source is unknown (the Drive
  // files are not the cited Pexels photos) and Manual Mestre §10.17 says "não usar". ORDER AND COVER ARE A PROPOSAL.
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
      position: 2,
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
      position: 3,
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
      rightsStatus: "UNVERIFIED",
      // The photo is own media, but the mural it shows is a third-party artwork whose authorship and rights are uncertain:
      // blocked (UNVERIFIED) until legal confirmation (e.g. Lei 9.610/1998 art. 48, works permanently in public places).
      rightsNote: `PENDING rights verification: the mural artwork shown (artist authorship and rights NOT verified) — the photo itself is covered by the Owner's declaration of 28/10/2026. ${ROCINHA_ORIGINAL("IMG_1252.HEIC")}`,
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
 * RT-115/RT-116: real draft content replaces mock texts (still DRAFT: never public). Rocinha has Owner-reviewed copy;
 * Cristo + Pão de Açúcar has copy written from the Owner's Ficha Comercial v1.0 (pending Owner review); Centro's approved
 * commercial facts are available only in its local DRAFT review record. Premium keeps the fictitious placeholders.
 */
function draftRecord(id: string): TourContentRecord | null {
  if (id === CENTRO_ID) return CENTRO_COMMERCIAL_DRAFT;
  if (id === CRISTO_ID) return { tripId: id, status: "DRAFT", source: CRISTO_DRAFT_SOURCE, ...CRISTO_CONTENT, images: OWNER_GALLERY[id] ?? [] };
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
  modality: { value: LocalizedText; status: FactStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>; source: string };
  pickup: { value: LocalizedText; status: FactStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>> };
  /** null = pending pricing. Old catalog prices are deliberately NOT carried over (Owner, 16/10). */
  priceCents: number | null;
  duration: { value: LocalizedText | null; status: FactStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>> };
  benefits: { pt: string[]; en: string[]; es: string[] };
  /** The current cover is provisional until RT-116 supplies a rights-cleared photo that shows the attraction. */
  coverStatus: FactStatus;
  /** RT-116 short clip (prototype-only: the RT-113 model has no video yet — documented gap for Sprint 11). */
  video: PrototypeVideo | null;
  /** RT-115 (real content): localized commercial name, statuses of hero texts, extra essentials, WhatsApp prefill. */
  titleByLocale?: LocalizedText;
  titleStatusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>;
  pitchStatus: FactStatus;
  pitchStatusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>;
  benefitsStatus: FactStatus;
  benefitsStatusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>;
  groupSize?: { value: LocalizedText; status: FactStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>> };
  minAge?: { value: LocalizedText; status: FactStatus };
  whatsappMessage?: LocalizedText;
  hideWhatsAppCta?: boolean;
  /** Review chips for real content (record stays DRAFT): editorial status of the texts and of the FAQ/conditions. */
  contentStatus?: FactStatus;
  contentStatusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>;
  conditionsStatus?: FactStatus;
  /** INTERNAL provisional prices: shown only in the lab review mode as "NÃO PUBLICAR"; never on the public page. */
  provisionalPricing?: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }>;
  /** Local quote-on-request label while the stored catalog price is not authorized for display. */
  priceLabel?: LocalizedText;
  hotelPickup?: boolean;
  children?: { value: LocalizedText; status: FactStatus };
  transport?: { value: LocalizedText; status: FactStatus };
  requestViaWhatsapp?: boolean;
  /** Owner-approved price table, exposed only in the local review lab. */
  approvedPricing?: {
    durations: ReadonlyArray<{ hours: number; label: LocalizedText; prices: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }> }>;
    additionalHourPerGroupCents?: number;
    /** Always false until the Owner authorizes price publication (PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS). */
    publishable: false;
  };
  /** Tour-specific note under the approved table (TOUR-01/02); TOUR-03 uses the shared note with its extra-hour price. */
  pricingNote?: LocalizedText;
  /** Both Owner-approved route options for the Centro draft. */
  routeOptions?: typeof CENTRO_ROUTE_OPTIONS;
  translationStatusNotice?: LocalizedText;
  priceSummary?: LocalizedText;
  priceCondition?: LocalizedText;
  mobilePriceLines?: { lead: LocalizedText; value: LocalizedText };
  priceStatusByLocale?: Partial<Record<"pt" | "en" | "es", FactStatus>>;
  reviewBannerNotice?: LocalizedText;
  requestFlowNotice?: LocalizedText;
  /** Localized-only rendering for this draft: never fill missing EN/ES fields with Portuguese copy. */
  noPortugueseFallback?: boolean;
  /** Optional local review CTA flow; this is an inquiry link, never a booking or payment. */
  requestFlowMode?: "whatsapp";
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
  // Owner, 23/10/2026: clip approved for the visual use of the approved TOUR-02 design. Editorial approval only: the
  // public page still shows it only when its media row passes the rights/publication gate (RT-113/RT-119).
  status: "CONFIRMED",
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
  rightsNote: "Owner, 28/10/2026: own video, authorised for commercial use (declaration recorded in RT-116). Owner, 17/10/2026: own video IMG_1157.MOV (Drive MIDIAS/01_CRISTO_PAO_DE_ACUCAR_SELARON/ORIGINAIS), window 41–58 s selected by the Owner; no people in the window; original audio not used.",
};

/** Tours whose cover/order the Owner confirmed (Rocinha, 17/10). Cristo + Pão + Selarón: order and cover are a proposal. */
const OWNER_CONFIRMED_COVER = new Set(["cmli1a6im000034zqqzc9sppb"]);

const PROTOTYPE_VIDEO: Record<string, PrototypeVideo> = {
  cmli1a6im000034zqqzc9sppb: ROCINHA_VIDEO,
  cmlhxkpy9000028zq27rhytew: PAO_VIDEO,
};

const PRIVATE: LocalizedText = { pt: "Experiência privativa", en: "Private experience", es: "Experiencia privada" };
const PICKUP: LocalizedText = { pt: "Busca no hotel", en: "Hotel pickup", es: "Recogida en el hotel" };
const QUOTE_ON_REQUEST: LocalizedText = { pt: "Orçamento sob consulta", en: "Quote on request", es: "Presupuesto a consultar" };
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
    priceLabel: QUOTE_ON_REQUEST,
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
    // RT-121 table approved 28/10/2026 (registry TOUR-02); lab only until the Owner authorizes price publication.
    approvedPricing: ROCINHA_APPROVED_PRICING,
    pricingNote: ROCINHA_PRICING_NOTE,
    priceSummary: ROCINHA_PRICE_SUMMARY,
    priceCondition: ROCINHA_PRICE_CONDITION,
    // Values approved; the summary wording follows the TOUR-03 pattern and waits for the Owner's text review.
    priceStatusByLocale: { pt: "PROVISIONAL", en: "PROVISIONAL", es: "PROVISIONAL" },
    mobilePriceLines: {
      // Mobile bar: the per-person value always next to its condition (group of 4 adults).
      lead: { pt: "Grupo de 4 adultos", en: "Group of 4 adults", es: "Grupo de 4 adultos" },
      value: { pt: "R$ 195/pessoa", en: "R$ 195/person", es: "R$ 195/persona" },
    },
  };
}

/**
 * RT-112/RT-115 — TOUR-01 offer from the Owner's Ficha Comercial v1.0 and the T1 transport decision (18/10/2026).
 * Facts are Owner decisions; the texts are agent drafts pending Owner review (PROVISIONAL). Group table approved by the
 * Owner on 28/10/2026 (RT-121): shown only in the lab review mode; the public page keeps "Orçamento sob consulta".
 */
function cristoOffer(base: PrototypeOffer): PrototypeOffer {
  return {
    ...base,
    title: CRISTO_TITLE.pt,
    titleByLocale: CRISTO_TITLE,
    // PT title and pitch approved verbatim by the Owner (editorial decision, 23/10/2026); EN/ES approved in the Owner gate of
    // 30/10/2026 and confirmed by the Owner on 01/11/2026.
    titleStatus: "CONFIRMED",
    titleStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    pitch: CRISTO_SUBTITLE,
    pitchStatus: "CONFIRMED",
    pitchStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    pickup: { value: CRISTO_PICKUP_SHORT, status: "CONFIRMED" }, // CR-08/CR-16
    hotelPickup: true,
    duration: { value: CRISTO_CONTENT.durationLabel ?? null, status: "CONFIRMED" }, // ~8 h reference (Ficha §4.1)
    benefits: CRISTO_BENEFITS,
    benefitsStatus: "PROVISIONAL",
    contentStatus: "PROVISIONAL",
    conditionsStatus: "PROVISIONAL", // cancellation/weather depend on RT-81/RT-118
    groupSize: { value: CRISTO_GROUP_SIZE, status: "CONFIRMED" },
    children: { value: CRISTO_CHILDREN, status: "CONFIRMED" }, // CR-09/CR-13/CR-14
    // T1 (Owner, 18/10/2026): own vehicle driven by the guide; documentary regularization pending (Manual §10.6.1).
    transport: {
      value: { pt: "Veículo próprio, conduzido pelo guia", en: "Private vehicle driven by your guide", es: "Vehículo propio conducido por el guía" },
      status: "PENDING",
    },
    whatsappMessage: CRISTO_WHATSAPP_MESSAGE,
    priceLabel: CRISTO_PRICE_LABEL,
    // RT-121 table approved 28/10/2026 (registry TOUR-01); lab only until the Owner authorizes price publication.
    approvedPricing: CRISTO_APPROVED_PRICING,
    pricingNote: CRISTO_PRICING_NOTE,
    priceSummary: CRISTO_PRICE_SUMMARY,
    priceCondition: CRISTO_PRICE_CONDITION,
    priceStatusByLocale: { pt: "PROVISIONAL", en: "PROVISIONAL", es: "PROVISIONAL" },
    mobilePriceLines: {
      lead: { pt: "Grupo de 4 adultos", en: "Group of 4 adults", es: "Grupo de 4 adultos" },
      value: { pt: "R$ 650/pessoa", en: "R$ 650/person", es: "R$ 650/persona" },
    },
    requestViaWhatsapp: true,
  };
}

function centroOffer(base: PrototypeOffer): PrototypeOffer {
  return {
    ...base,
    title: CENTRO_TITLE.pt ?? base.title,
    titleByLocale: {
      pt: "Centro Histórico e Cultural do Rio",
      en: "Rio Historic and Cultural Center",
      es: "Centro Histórico y Cultural de Río",
    },
    noPortugueseFallback: true,
    requestFlowMode: "whatsapp",
    titleStatus: "CONFIRMED",
    titleStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    pitch: {
      pt: "Descubra a história, a arquitetura e o patrimônio cultural do Centro do Rio em uma experiência privativa, acompanhada por um guia especializado.",
      en: "A privately guided walk through downtown Rio’s history, architecture and culture.",
      es: "Un paseo privado con guía por la historia, la arquitectura y la cultura del centro de Río.",
    },
    modality: { value: { pt: "Experiência exclusivamente privativa", en: "Private experience only", es: "Experiencia exclusivamente privada" }, status: "CONFIRMED", statusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" }, source: "Owner-approved TOUR-03 Ficha v1.0, 18/10/2026" },
    pickup: { value: { pt: "Busca e retorno ao endereço combinado; confirme a logística", en: "Pickup and return at the agreed address; logistics confirmation required", es: "Recogida y regreso en la dirección acordada; requiere confirmación logística" }, status: "CONFIRMED", statusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" } },
    duration: { value: { pt: "Roteiros de 4 ou 6 horas", en: "4-hour or 6-hour itineraries", es: "Recorridos de 4 o 6 horas" }, status: "CONFIRMED", statusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" } },
    hideWhatsAppCta: true,
    benefits: {
      pt: ["Grupo privativo de 1 a 4 turistas", "Horário e roteiro combinados com a equipe", "Acompanhamento de guia durante a caminhada"],
      en: ["Private group of 1 to 4 guests", "Start time and itinerary agreed with the team", "Guide accompanying the walking tour"],
      es: ["Grupo privado de 1 a 4 turistas", "Horario e itinerario acordados con el equipo", "Guía durante el recorrido a pie"],
    },
    // PT pitch approved verbatim by the Owner (editorial decision, 21/10/2026); EN/ES approved in the Owner gate of
    // 30/10/2026 and confirmed by the Owner on 01/11/2026 (every EN/ES status mirrors PT).
    pitchStatus: "CONFIRMED",
    pitchStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    // Benefit lines: real copy derived from approved facts but not in the Owner-approved texts (Ficha v1.0 / Manual §12 /
    // PT/EN/ES review document): PROVISIONAL in every locale (EN/ES mirror PT, Owner 01/11/2026). Never MOCK.
    benefitsStatus: "PROVISIONAL",
    benefitsStatusByLocale: { pt: "PROVISIONAL", en: "PROVISIONAL", es: "PROVISIONAL" },
    coverStatus: "CONFIRMED",
    contentStatus: "CONFIRMED",
    contentStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    conditionsStatus: "PENDING",
    groupSize: { value: { pt: "1 a 4 turistas da mesma reserva", en: "1 to 4 guests on the same booking", es: "De 1 a 4 turistas en la misma reserva" }, status: "CONFIRMED", statusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" } },
    approvedPricing: CENTRO_APPROVED_PRICING,
    routeOptions: CENTRO_ROUTE_OPTIONS,
    // Owner commercial decision (21/10/2026): lead with the lowest approved per-person fare (4 guests, 4 hours; Manual
    // §12.11). The full table moves to the "Valores e opções do passeio" section. PT/EN/ES approved (Owner 30/10 and 01/11/2026).
    priceSummary: {
      pt: "A partir de R$ 260 por pessoa",
      en: "From R$ 260 per person",
      es: "Desde R$ 260 por persona",
    },
    priceCondition: {
      // Owner 30/10/2026: R$ 260 is the per-person price of a group of four adults on the 4-hour tour (total R$ 1.040).
      pt: "Valor por pessoa para um grupo de 4 adultos no passeio privativo de 4 horas (total do grupo: R$ 1.040).",
      en: "Price per person for a group of 4 adults on the 4-hour private tour (group total: R$ 1,040).",
      es: "Valor por persona para un grupo de 4 adultos en el paseo privado de 4 horas (total del grupo: R$ 1.040).",
    },
    priceStatusByLocale: { pt: "CONFIRMED", en: "CONFIRMED", es: "CONFIRMED" },
    // Mobile sticky bar (Owner, 21/10/2026): two lines so the amount and "per person" are never cut.
    mobilePriceLines: {
      lead: { pt: "A partir de", en: "From", es: "Desde" },
      value: { pt: "R$ 260/pessoa", en: "R$ 260/person", es: "R$ 260/persona" },
    },
    reviewBannerNotice: {
      pt: "PRÉVIA INTERNA DE REVISÃO. O conteúdo não está publicado. A tabela comercial aprovada pelo Owner aparece somente para conferência local e não autoriza publicação.",
      en: "INTERNAL REVIEW PREVIEW. The content is unpublished. The Owner-approved commercial table is shown for local review only and does not authorize publication.",
      es: "VISTA PREVIA INTERNA DE REVISIÓN. El contenido no está publicado. La tabla comercial aprobada por el Owner se muestra solo para revisión local y no autoriza su publicación.",
    },
    requestFlowNotice: {
      pt: "Na prévia local, o botão abre uma mensagem de consulta de disponibilidade para o WhatsApp comercial. A mensagem não confirma data, reserva ou pagamento; a equipe verifica a operação e responde com uma proposta.",
      en: "In this local preview, the button opens an availability inquiry in the business WhatsApp account. The message does not confirm a date, booking or payment; the team checks the operation and replies with a proposal.",
      es: "En esta vista previa local, el botón abre una consulta de disponibilidad en el WhatsApp comercial. El mensaje no confirma una fecha, reserva ni pago; el equipo verifica la operación y responde con una propuesta.",
    },
    whatsappMessage: {
      pt: "Olá! Gostaria de consultar disponibilidade para o passeio Centro Histórico e Cultural do Rio. Ainda vou informar a data e a composição do grupo. Entendo que esta mensagem não confirma reserva nem pagamento.",
      en: "Hello! I would like to ask about availability for the Rio Historic and Cultural Center tour. I will share my preferred date and group details. I understand this message does not confirm a booking or payment.",
      es: "¡Hola! Quisiera consultar la disponibilidad para el paseo Centro Histórico y Cultural de Río. Compartiré la fecha y los datos del grupo. Entiendo que este mensaje no confirma una reserva ni un pago.",
    },
  };
}

/** Prototype offers for the four existing tours (round 1). Pitches are editorial PROPOSALS marked as fictitious. */
export const PROTOTYPE_OFFER: Record<string, PrototypeOffer> = {
  cmlhxkpy9000028zq27rhytew: cristoOffer(offer("cmlhxkpy9000028zq27rhytew", {})),
  cmli1a6im000034zqqzc9sppb: rocinhaOffer(offer("cmli1a6im000034zqqzc9sppb", mock(
    "Uma visita privativa à Rocinha, guiada por quem conhece a comunidade",
    "A private visit to Rocinha, guided by people who know the community",
    "Una visita privada a la Rocinha, guiada por quien conoce la comunidad",
  ))),
  cmlibniq40000z4zqkbujnutt: centroOffer(offer("cmlibniq40000z4zqkbujnutt", {})),
  cmljo0s1u0000t0zqa0bpd23p: offer("cmljo0s1u0000t0zqa0bpd23p", mock(
    "Um dia inteiro no Rio, com roteiro desenhado para o seu grupo",
    "A full day in Rio with a route designed for your group",
    "Un día completo en Río con un itinerario diseñado para tu grupo",
  )),
};
