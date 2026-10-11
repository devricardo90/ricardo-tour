import { PUBLIC_CONTACT, buildPublicWhatsAppUrl } from "@/lib/public-contact";
import { APPROVED_TOUR_CARDS } from "../ui/tours";
import type { Lang } from "./lang";
import type { DynamicReason, HandoffReason } from "./types";

/**
 * RT-71 human / WhatsApp handoff (contract: rt-71-concierge-handoff-contract.md).
 * Handoff is user-initiated at the last step: the runtime only produces links. Nothing is sent, transferred,
 * booked or confirmed, and no team member is claimed to have been contacted.
 *
 * V1: the WhatsApp message can be CONTEXTUAL (language + the approved tour the visitor is interested in), but it is still built
 * from a closed set: a handoff code, a language and an allow-listed tour id. It never contains the conversation, free text,
 * ids or personal data.
 */
export type HandoffCode = "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7" | "H8" | "H9" | "H10" | "H11" | "H12";

export type HandoffChannel = {
  type: "whatsapp" | "email";
  label: string;
  /** Human-readable canonical value (number or address). */
  display: string;
  url: string;
};

export type HandoffOffer = {
  required: true;
  code: HandoffCode;
  /** Internal reason string, for tests and content-free events only. */
  reason: string;
  /** WhatsApp first, e-mail second. Only PUBLIC_CONTACT values are ever used. */
  channels: HandoffChannel[];
  /** Short, fixed, visitor-visible and editable text. Built only from (code, language, approved tour); never from the conversation. */
  prefill: string;
  /** Language of the visitor (closed set). Present so the UI can rebuild the same prefill from closed data. */
  lang?: Lang;
  /** Allow-listed approved tour the visitor is interested in, when known. */
  tour_id?: string;
};

export type HandoffContext = { lang?: Lang; tourId?: string | null };

export const HANDOFF_CODE_BY_REASON: Record<HandoffReason, HandoffCode> = {
  explicit_request: "H1",
  booking_status: "H2",
  payment_status: "H2",
  booking_request: "H2",
  unsupported_request: "H3",
  out_of_scope_advice: "H3",
  insufficient_evidence: "H4",
  upstream_error: "H5",
  rate_limited: "H5",
  complaint: "H6",
  refund_decision: "H7",
  operational_confirmation: "H8",
  emergency: "H8",
  safety_sensitive: "H10",
  repeated_failure: "H12",
  commercial_terms: "H9",
  not_in_catalog: "H4",
};

export const HANDOFF_CODE_BY_DYNAMIC: Record<DynamicReason, HandoffCode> = {
  price: "H9",
  availability: "H9",
  flight_inventory: "H11",
  hotel_inventory: "H11",
  oner_inventory: "H11",
};

/** Fixed, approved-category topics. The only free-form-looking text that can reach a prefill; no user input, ever. */
const TOPIC: Record<Lang, Record<HandoffCode, string>> = {
  pt: {
    H1: "falar com a equipe",
    H2: "uma reserva ou pagamento",
    H3: "um pedido personalizado ou de grupo",
    H4: "uma dúvida que o assistente não soube responder",
    H5: "um problema com o assistente do site",
    H6: "uma reclamação",
    H7: "reembolso ou cancelamento",
    H8: "um assunto urgente sobre um passeio",
    H9: "preço, disponibilidade ou condições",
    H10: "a segurança de um passeio",
    H11: "voos, hotéis ou pacotes",
    H12: "uma dúvida que não consegui resolver pelo assistente",
  },
  en: {
    H1: "talking to the team",
    H2: "a booking or payment",
    H3: "a custom or group request",
    H4: "a question the assistant couldn't answer",
    H5: "a problem with the website assistant",
    H6: "a complaint",
    H7: "a refund or cancellation",
    H8: "an urgent matter about a tour",
    H9: "price, availability or conditions",
    H10: "the safety of a tour",
    H11: "flights, hotels or packages",
    H12: "a question I couldn't solve with the assistant",
  },
  es: {
    H1: "hablar con el equipo",
    H2: "una reserva o un pago",
    H3: "un pedido personalizado o de grupo",
    H4: "una duda que el asistente no supo responder",
    H5: "un problema con el asistente del sitio",
    H6: "una queja",
    H7: "un reembolso o una cancelación",
    H8: "un asunto urgente sobre un paseo",
    H9: "precio, disponibilidad o condiciones",
    H10: "la seguridad de un paseo",
    H11: "vuelos, hoteles o paquetes",
    H12: "una duda que no pude resolver con el asistente",
  },
};

/** Codes for which naming the tour of interest makes the message more useful to the team. */
const TOUR_AWARE: ReadonlySet<HandoffCode> = new Set(["H1", "H2", "H3", "H4", "H9", "H12"]);

const GREETING: Record<Lang, string> = {
  pt: "Olá! Vim pelo assistente do site da Ricardo Tour e gostaria de ajuda com",
  en: "Hello! I came from the Ricardo Tour website assistant and I'd like help with",
  es: "¡Hola! Vine por el asistente del sitio de Ricardo Tour y me gustaría ayuda con",
};

const TOUR_PHRASE: Record<Lang, (title: string, code: HandoffCode) => string> = {
  pt: (title, code) => (code === "H9" ? `preço, disponibilidade ou condições do passeio "${title}"` : code === "H2" ? `uma reserva do passeio "${title}"` : `o passeio "${title}"`),
  en: (title, code) => (code === "H9" ? `the price, availability or conditions of the "${title}" tour` : code === "H2" ? `a booking for the "${title}" tour` : `the "${title}" tour`),
  es: (title, code) => (code === "H9" ? `el precio, la disponibilidad o las condiciones del paseo "${title}"` : code === "H2" ? `una reserva del paseo "${title}"` : `el paseo "${title}"`),
};

export const HANDOFF_PREFILL_MAX_LENGTH = 200;

/** Resolves an allow-listed approved tour title; anything else (unknown id, free text) is ignored. */
export function approvedTourTitle(tourId: string | null | undefined) {
  return APPROVED_TOUR_CARDS.find((tour) => tour.id === tourId)?.title ?? null;
}

/** Prefill from a closed set keyed only by the handoff code, the language and an approved tour. It cannot contain PII, transcript or model text. */
export function buildHandoffPrefill(code: HandoffCode, context: HandoffContext = {}) {
  if (!Object.hasOwn(TOPIC.pt, code)) throw new Error("Unknown handoff code");
  const lang: Lang = context.lang && Object.hasOwn(TOPIC, context.lang) ? context.lang : "pt";
  const title = TOUR_AWARE.has(code) ? approvedTourTitle(context.tourId) : null;
  const subject = title ? TOUR_PHRASE[lang](title, code) : TOPIC[lang][code];
  const text = `${GREETING[lang]} ${subject}.`;
  // Defensive: an over-long message falls back to the tour-less topic rather than being cut mid-word.
  return text.length <= HANDOFF_PREFILL_MAX_LENGTH ? text : `${GREETING[lang]} ${TOPIC[lang][code]}.`.slice(0, HANDOFF_PREFILL_MAX_LENGTH);
}

const EMAIL_SUBJECT: Record<Lang, string> = { pt: "Atendimento Ricardo Tour", en: "Ricardo Tour support", es: "Atención Ricardo Tour" };

/** Static channel list for the always-visible team entry; it never depends on any backend. */
export function getHandoffChannels(prefill?: string, lang: Lang = "pt"): HandoffChannel[] {
  const mailto = prefill
    ? `${PUBLIC_CONTACT.mailto}?subject=${encodeURIComponent(EMAIL_SUBJECT[lang])}&body=${encodeURIComponent(prefill)}`
    : PUBLIC_CONTACT.mailto;
  return [
    { type: "whatsapp", label: "WhatsApp", display: PUBLIC_CONTACT.whatsappDisplay, url: buildPublicWhatsAppUrl(prefill) },
    { type: "email", label: lang === "pt" ? "E-mail" : lang === "es" ? "Correo" : "E-mail", display: PUBLIC_CONTACT.email, url: mailto },
  ];
}

export function buildHandoffOffer(code: HandoffCode, reason: string, context: HandoffContext = {}): HandoffOffer {
  const lang: Lang = context.lang && Object.hasOwn(TOPIC, context.lang) ? context.lang : "pt";
  const tourId = TOUR_AWARE.has(code) && approvedTourTitle(context.tourId) ? (context.tourId as string) : undefined;
  const prefill = buildHandoffPrefill(code, { lang, tourId });
  return { required: true, code, reason, channels: getHandoffChannels(prefill, lang), prefill, ...(context.lang ? { lang } : {}), ...(tourId ? { tour_id: tourId } : {}) };
}
