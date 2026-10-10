import { PUBLIC_CONTACT, buildPublicWhatsAppUrl } from "@/lib/public-contact";
import type { DynamicReason, HandoffReason } from "./types";

/**
 * RT-71 human / WhatsApp handoff (contract: rt-71-concierge-handoff-contract.md).
 * Handoff is user-initiated at the last step: the runtime only produces links. Nothing is sent, transferred,
 * booked or confirmed, and no team member is claimed to have been contacted.
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
  /** Short, fixed, visitor-visible and editable text. Never derived from the conversation. */
  prefill: string;
};

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
};

export const HANDOFF_CODE_BY_DYNAMIC: Record<DynamicReason, HandoffCode> = {
  price: "H9",
  availability: "H9",
  flight_inventory: "H11",
  hotel_inventory: "H11",
  oner_inventory: "H11",
};

/** Fixed, approved-category topics. The only text that can reach a prefill; no free text, ever. */
const TOPIC: Record<HandoffCode, string> = {
  H1: "falar com a equipe",
  H2: "uma reserva ou pagamento",
  H3: "um pedido personalizado ou de grupo",
  H4: "uma dúvida que o assistente não soube responder",
  H5: "um problema com o assistente do site",
  H6: "uma reclamação",
  H7: "reembolso ou cancelamento",
  H8: "um assunto urgente sobre um passeio",
  H9: "preço ou disponibilidade",
  H10: "a segurança de um passeio",
  H11: "voos, hotéis ou pacotes",
  H12: "uma dúvida que não consegui resolver pelo assistente",
};

export const HANDOFF_PREFILL_MAX_LENGTH = 160;

/** Prefill from a closed set keyed only by the handoff code. It cannot contain PII, ids, transcript or model text. */
export function buildHandoffPrefill(code: HandoffCode) {
  if (!Object.hasOwn(TOPIC, code)) throw new Error("Unknown handoff code");
  const text = `Olá! Vim pelo assistente do site da Ricardo Tour e gostaria de ajuda com ${TOPIC[code]}.`;
  return text.slice(0, HANDOFF_PREFILL_MAX_LENGTH);
}

/** Static channel list for the always-visible "Falar com a equipe" entry; it never depends on any backend. */
export function getHandoffChannels(prefill?: string): HandoffChannel[] {
  const subject = "Atendimento Ricardo Tour";
  const mailto = prefill
    ? `${PUBLIC_CONTACT.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(prefill)}`
    : PUBLIC_CONTACT.mailto;
  return [
    { type: "whatsapp", label: "WhatsApp", display: PUBLIC_CONTACT.whatsappDisplay, url: buildPublicWhatsAppUrl(prefill) },
    { type: "email", label: "E-mail", display: PUBLIC_CONTACT.email, url: mailto },
  ];
}

export function buildHandoffOffer(code: HandoffCode, reason: string): HandoffOffer {
  const prefill = buildHandoffPrefill(code);
  return { required: true, code, reason, channels: getHandoffChannels(prefill), prefill };
}
