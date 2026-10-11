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
  // RT-74 §3.3: no safety assurances, promises (refund/discount/booking) or current-schedule claims.
  [
    "safety_assurance",
    /\b(?:e|eh|sao|fica|esta|estao|ficam)\s+(?:totalmente |completamente |muito |100% |absolutamente |bem )?(?:seguros?|seguras?)\b|\bsem (?:nenhum )?risco|\brisco zero|\bzero risco|\bnao (?:ha|existe|existem) (?:perigo|risco)|\bpode ir tranquil[oa]|\bnao precisa se preocupar|\b(?:totalmente|completamente) seguro/,
  ],
  // RT-74 §2 row 11: emergency wording/numbers are not Owner-approved; the model must never supply them from memory.
  ["emergency_number", /\b(?:190|191|192|193|197|199|188|180|112|911|samu|bombeiros?|policia militar|ambulancia)\b/],
  // RT-71: no response-time or opening-hours claims unless the Owner supplies an approved public statement.
  [
    "response_time_claim",
    /\b(?:responderemos|retornaremos|respondemos|respondem|responde) (?:em|ate|rapid\w*|imediat\w*)|\bem ate \d+ ?(?:minutos?|horas?)|\batendimento (?:24|vinte e quatro)|\bhorario de atendimento\b|\bresposta (?:imediata|em minutos)/,
  ],
  ["promise",/\b(?:garanto|garantimos|prometo|prometemos|reembolso (?:integral|garantido|total)|cancelamento gratuito|desconto de|sem custo adicional garantido)\b/],
  [
    "schedule_claim",
    /\b(?:sai|saem|parte|partem|saida|comeca|comecam|inicia|iniciam|encontro|pickup)\b.{0,20}\b(?:as|a partir das|por volta das) \d{1,2}(?:h|:\d{2}|\s?horas)/,
  ],
  // Persona (Daniela): she is an AI. She never claims to be a person, an attendant or a team member, or to be typing live.
  [
    "human_claim",
    /(?<!\bnao )(?<!\bnunca )\bsou (?:uma |a )?(?:pessoa|humana|humano|atendente|consultora|consultor|vendedora|guia)\b|(?<!\bnao )\bsou (?:da|parte da|membro da|integrante da|funcionaria da|colaboradora da) (?:equipe|ricardo tour)\b|\b(?:estou|to) (?:digitando|online agora|ao vivo|te atendendo agora)\b|\bsou (?:uma )?(?:pessoa|humana) de verdade\b/,
  ],
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
  // PT V1: an answer that drifted into English is not an approved fixed-language response.
  const english = (text.match(/\b(?:the|and|you|your|with|this|that|for|are|is|of|to)\b/g) ?? []).length;
  const portuguese = (text.match(/\b(?:o|a|os|as|de|do|da|em|para|com|que|um|uma|voce|e)\b/g) ?? []).length;
  if (english >= 4 && english > portuguese) return { ok: false, reason: "wrong_language" };
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
