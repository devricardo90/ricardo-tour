/**
 * RT-70 privacy primitives for the Concierge runtime.
 * - The server keeps NO conversation state: session context is held by the client and re-sent (bounded) per request.
 * - Data minimization: obvious identifiers are removed before text leaves our server for the model provider.
 * - Visitor-facing AI disclosure and privacy notice (PT V1). Texts are PROPOSED and require Owner/legal approval
 *   before public enablement (RT-75); `legal_review` is the machine-readable gate for that.
 */

export const PRIVACY_NOTICE_VERSION = "2026-10-09.1";

export const CONCIERGE_PRIVACY = {
  version: PRIVACY_NOTICE_VERSION,
  /** Must become "APPROVED" only through an explicit Owner/legal decision recorded in RT-70/RT-75. */
  legal_review: "PENDING" as "PENDING" | "APPROVED",
  /** Shown before the first message and kept visible while the Concierge is open. */
  ai_disclosure:
    "Você está conversando com um assistente de inteligência artificial da Ricardo Tour, não com uma pessoa. Ele pode errar e não confirma preços, disponibilidade, reservas ou pagamentos. Não envie dados pessoais ou sensíveis, como documentos, cartão ou senhas.",
  /** Short notice linking to the Privacy page. */
  privacy_notice:
    "Suas mensagens são enviadas à OpenAI, nossa fornecedora de IA, apenas para gerar a resposta. A Ricardo Tour não guarda a conversa: ela existe somente nesta sessão, no seu navegador. A fornecedora pode manter registros técnicos de segurança por até 30 dias. Saiba mais na Política de Privacidade.",
} as const;

/**
 * The same disclosure and notice in English and Spanish (V1). They are PROPOSED translations of the Portuguese texts and carry the
 * same `legal_review` flag: public enablement requires the Owner/legal approval of all three languages.
 */
export const CONCIERGE_PRIVACY_TEXTS = {
  pt: { ai_disclosure: CONCIERGE_PRIVACY.ai_disclosure, privacy_notice: CONCIERGE_PRIVACY.privacy_notice },
  en: {
    ai_disclosure:
      "You are chatting with an artificial intelligence assistant from Ricardo Tour, not with a person. It can make mistakes and doesn't confirm prices, availability, bookings or payments. Don't send personal or sensitive data, such as documents, cards or passwords.",
    privacy_notice:
      "Your messages are sent to OpenAI, our AI provider, only to generate the answer. Ricardo Tour does not store the conversation: it exists only in this session, in your browser. The provider may keep technical security records for up to 30 days. Learn more in the Privacy Policy.",
  },
  es: {
    ai_disclosure:
      "Estás conversando con un asistente de inteligencia artificial de Ricardo Tour, no con una persona. Puede equivocarse y no confirma precios, disponibilidad, reservas ni pagos. No envíes datos personales ni sensibles, como documentos, tarjetas o contraseñas.",
    privacy_notice:
      "Tus mensajes se envían a OpenAI, nuestra proveedora de IA, solo para generar la respuesta. Ricardo Tour no guarda la conversación: existe únicamente en esta sesión, en tu navegador. La proveedora puede conservar registros técnicos de seguridad por hasta 30 días. Más información en la Política de Privacidad.",
  },
} as const;

const REDACTION = "[dado removido]";

function luhnValid(digits: string) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Deterministic removal of e-mail addresses, CPF, payment-card numbers and phone numbers. */
export function redactPersonalData(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, REDACTION)
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, REDACTION)
    .replace(/\b(?:\d[ -]?){13,19}\b/g, (match) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 13 && digits.length <= 19 && luhnValid(digits) ? REDACTION : match;
    })
    // Any remaining run of 10+ digits (phones, document or account numbers) is removed whole, never partially.
    .replace(/\+?\d(?:[\s.()-]?\d){9,}/g, REDACTION);
}
