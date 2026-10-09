import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { normalize } from "./gates";
import { INSUFFICIENT_MARKER } from "./policy";

export type PostCheck = { ok: true; answer: string } | { ok: false; reason: string; insufficient?: boolean };

// Patterns run on normalized (lowercase, accent-free) text.
const CHECKS: Array<[string, RegExp]> = [
  ["currency_amount", /(?:r\$|us\$|€|\$)\s*\d|\d[\d.,]*\s*(?:reais|real|dolares|euros)\b/],
  [
    "availability_claim",
    /\b(?:ha|tem|temos|existem?|restam?)\b.{0,25}\b(?:vagas?|lugares?|disponibilidade|ingressos? disponiveis)\b|\bdisponivel (?:para|em|hoje|amanha)\b|\bvagas? (?:garantidas?|confirmadas?)\b/,
  ],
  [
    "booking_confirmation",
    /\bsua reserva (?:esta|foi|ficou) (?:confirmad|garantid|feit)|\breserva (?:confirmada|realizada|criada|garantida)\b|\bja reservei\b|\breservei (?:para|o|seu)/,
  ],
  ["payment_confirmation", /\bseu pagamento (?:esta|foi|ja foi|ficou)\b|\bpagamento (?:aprovado|confirmado|recebido|compensado)\b/],
  ["provider_inventory", /\boner\b/],
  [
    "fake_handoff",
    /\b(?:ja )?(?:chamei|acionei|contatei|avisei)\b.{0,25}\b(?:atendente|equipe|pessoa|time)\b|\bestou (?:te )?transferindo\b|\bum atendente (?:vai|ira|entrara)\b|\bvou (?:te )?transferir\b/,
  ],
  [
    "internal_leak",
    /\b[a-f0-9]{32,}\b|\bvs_[a-z0-9]{6,}|\bfile-[a-z0-9]{6,}|<evidencias>|<trecho|mensagem_do_cliente|regras de seguranca|politica aprovada de recomendacao/,
  ],
];

const ALLOWED_PHONE = PUBLIC_CONTACT.whatsappDisplay.replace(/\D/g, "");

/** Fail closed on any unsupported factual or operational claim. The model cannot override deterministic gates. */
export function checkGeneratedAnswer(raw: string): PostCheck {
  const answer = raw.trim();
  if (!answer) return { ok: false, reason: "empty_answer" };
  if (answer.includes(INSUFFICIENT_MARKER)) return { ok: false, reason: "model_reported_insufficient", insufficient: true };
  const text = normalize(answer);
  for (const [reason, pattern] of CHECKS) if (pattern.test(text)) return { ok: false, reason };
  for (const phone of answer.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []) {
    if (phone.replace(/\D/g, "") !== ALLOWED_PHONE) return { ok: false, reason: "unapproved_phone" };
  }
  for (const email of answer.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []) {
    if (email.replace(/[.]+$/, "").toLowerCase() !== PUBLIC_CONTACT.email) return { ok: false, reason: "unapproved_email" };
  }
  for (const url of answer.match(/https?:\/\/[^\s)]+/g) ?? []) {
    if (!/^https?:\/\/(?:www\.)?ricardotour\.com(?:\/|$)/i.test(url) && !url.startsWith(PUBLIC_CONTACT.whatsappUrl)) {
      return { ok: false, reason: "unapproved_url" };
    }
  }
  return { ok: true, answer };
}
