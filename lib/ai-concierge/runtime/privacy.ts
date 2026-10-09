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
