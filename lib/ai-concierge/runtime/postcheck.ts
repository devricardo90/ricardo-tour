import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { normalize } from "./gates";
import { detectLanguage, type Lang } from "./lang";
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
  // V1 (pt/en/es): the same unsupported claims in English and Spanish.
  ["availability_claim", /\b(?:there (?:are|is)|we have|still have|plenty of)\b.{0,25}\b(?:spots?|seats?|places?|availability|tickets? available)\b|\bavailable (?:for|on|today|tomorrow|this)\b|\bspots? (?:are )?(?:guaranteed|confirmed)\b|\b(?:hay|tenemos|quedan)\b.{0,25}\b(?:cupos?|plazas?|lugares?|disponibilidad|entradas disponibles)\b|\bdisponible (?:para|el|hoy|manana)\b/],
  ["booking_confirmation", /\byour (?:booking|reservation) (?:is|has been|was) (?:confirmed|guaranteed|made)|\b(?:booking|reservation) (?:confirmed|completed|made)\b|\bi(?:'ve| have) (?:booked|reserved)\b|\btu reserva (?:esta|fue|ha sido) (?:confirmad|garantizad|hech)|\breserva (?:confirmada|realizada|garantizada)\b|\bya reserve\b/],
  ["payment_confirmation", /\byour payment (?:is|was|has been|went)\b|\bpayment (?:approved|confirmed|received|successful)\b|\btu pago (?:esta|fue|ha sido)\b|\bpago (?:aprobado|confirmado|recibido)\b/],
  ["safety_assurance", /\b(?:is|are|will be)\s+(?:totally |completely |very |100% |absolutely |perfectly )?safe\b|\bno risk\b|\brisk[- ]free\b|\bzero risk\b|\bnothing to worry\b|\bdon'?t worry\b|\b(?:es|son|esta|estan)\s+(?:totalmente |completamente |muy |100% |absolutamente )?(?:seguros?|seguras?)\b|\bsin (?:ningun )?riesgo\b|\briesgo cero\b|\bno hay (?:peligro|riesgo)\b|\bno te preocupes\b/],
  ["promise", /\b(?:i guarantee|we guarantee|i promise|we promise|full refund|guaranteed refund|free cancell?ation|discount of|garantizo|garantizamos|prometo|prometemos|reembolso (?:total|completo|garantizado)|cancelacion gratuita|descuento de)\b/],
  ["response_time_claim", /\b(?:we(?:'ll| will) (?:reply|respond|answer|get back)|reply within|respond within|answer within|within \d+ ?(?:minutes?|hours?)|24\/7|24 hours|business hours|opening hours|respondemos en|responderemos en|en menos de \d+ ?(?:minutos?|horas?)|atencion 24|horario de atencion)\b/],
  ["fake_handoff", /\bi(?:'ve| have)? (?:already )?(?:contacted|notified|called|alerted) (?:the )?(?:team|agent|someone|staff)\b|\bi(?:'m| am) (?:now )?(?:transferring|connecting) you\b|\ban? (?:agent|team member|person) (?:will|is going to) (?:contact|call|message|join)\b|\bya (?:avise|contacte|llame) (?:al )?(?:equipo|agente|alguien)\b|\bte estoy transfiriendo\b|\bun (?:agente|asesor) (?:te )?(?:contactara|llamara|se unira)\b/],
  ["human_claim", /\bi(?:'m| am) (?:a )?(?:real |human )?(?:person|human|agent|consultant|team member)\b|\bi(?:'m| am) (?:typing|online now|live)\b|\bi work (?:for|at) (?:the )?ricardo tour\b|(?<!\bno )\bsoy (?:una )?(?:persona|humana|agente|asesora|consultora)\b|\bsoy (?:del|parte del) equipo\b|\bestoy (?:escribiendo|en linea ahora|en vivo)\b/],
  // V1 (Owner): never invent commercial conditions: what is included (tickets, entrances, meals...), payment methods, fees, cancellation.
  [
    "commercial_terms",
    /\b(?:ingressos?|entradas?|tickets?|admission)\b.{0,25}\b(?:inclus\w*|inclu[ií]d\w*|included|incluidos?|incluidas?)\b|\b(?:inclui|incluem|inclusos?|incluso|includes?|including|incluye|incluyen)\b.{0,25}\b(?:ingressos?|entradas?|tickets?|admission|almoco|lunch|almuerzo|refeicoes?|meals?|comidas?|seguro|insurance)\b|\btudo incluido\b|\ball[- ]inclusive\b|\btodo incluido\b|\b(?:forma|formas|metodos?|methods?)\s+(?:de )?(?:pagamento|payment|pago)\b|\bparcel\w*|\binstallments?\b|\bcuotas\b|\bpolitica de (?:cancelamento|cancelacion)\b|\bcancell?ation policy\b|\b(?:sem|no|sin) (?:taxas?|fees?|cargos)\b|\bhidden fees?\b|\b(?:aceitamos|aceitam|we accept|accepted payments?|aceptamos|aceptan) (?:cartao|cartoes|pix|cards?|credit|cash|tarjetas?|efectivo|dinheiro)\b/,
  ],
  // Review fix: the approved source itself says "com transporte, guia e ingressos inclusos" and the model can restate it without the word
  // "included" ("comes with ... tickets", "entrance fees are covered"). Any mention of tickets/entrances in a generated answer is blocked.
  ["commercial_terms", /\b(?:ingressos?|entradas?|tickets?|admission|entrance fees?|taxas? de entrada)\b/],
  // Review fix (EN/ES parity with the Portuguese checks).
  ["currency_amount", /\b\d[\d.,]*\s*(?:dollars?|usd|eur|euros?|brl|reais|pesos?)\b|\b(?:usd|eur|brl)\s*\d|\b(?:costs?|costa|cuesta|cuestan|price is|precio es|priced at)\b.{0,15}\d/],
  ["human_claim", /\bi(?:'m| am) (?:a )?(?:part|member) of (?:the )?(?:ricardo tour )?(?:team|staff)\b|\bsoy (?:miembro|parte) del equipo\b/],
  ["schedule_claim", /\b(?:departs?|leaves?|starts?|begins?|pickup|pick-up|meeting time|meet(?:ing)? at)\b.{0,25}\b(?:at )?\d{1,2}(?::\d{2})? ?(?:am|pm|h|o'clock)\b|\b(?:sale|salen|parte|parten|empieza|comienza|recogida|encuentro)\b.{0,25}\b(?:a las|desde las|\d{1,2}(?::\d{2})? ?(?:h|am|pm|horas))/],
  ["safety_assurance", /\b(?:safe|dangerous|peligroso|peligrosa|seguro|segura|seguros|seguras)\b/],
  ["payment_methods", /\b(?:pay (?:by|with|in|using)|accepts?|payments? (?:by|via|through))\b.{0,20}\b(?:card|cards|cash|pix|credit|debit|paypal|transfer)\b|\bpag(?:ar|as|a) (?:con|en|por)\b.{0,20}\b(?:tarjeta|efectivo|pix|credito|debito|transferencia)\b/],
  ["availability_claim", /\b(?:openings?|room for you|still room|space (?:available|left)|hay (?:espacio|lugar))\b/],
  ["booking_confirmation", /\b(?:all set|you(?:'re| are) (?:all )?(?:booked|set|confirmed)|booked for you)\b|\b(?:esta|queda) (?:todo )?(?:listo|reservado)\b/],
  ["fake_handoff", /\b(?:our|the) (?:guide|team|agent|staff) will (?:call|contact|message|reach)\b|\b(?:nuestro|el) (?:guia|equipo|agente) (?:te )?(?:llamara|contactara)\b/],
  // V1 (Owner): what a tour includes is a commercial condition. Any claim that something is/are included is blocked in a generated answer.
  [
    "commercial_terms",
    /\b(?:inclui|incluem|incluir|inclusos?|inclusas?|incluid[oa]s?|includes?|included|incluye|incluyen|incluido|incluida|incluidos|incluidas)\b/,
  ],
  // V1: the model must not suggest custom/tailor-made services that no approved source confirms (the team decides that).
  [
    "custom_service_claim",
    /\b(?:experiencia|passeio|roteiro|tour|paseo|itinerario|experience)\s+(?:personalizad[oa]s?|sob medida|customi[sz]ed|personali[sz]ed|tailor[- ]made|a medida)\b|\b(?:personali[sz]ed|customi[sz]ed|tailor[- ]made|custom)\s+(?:experiences?|tours?|itinerar(?:y|ies)|trips?|packages?|services?)\b/,
  ],
  [
    "internal_leak",
    /\b[a-f0-9]{32,}\b|\bvs_[a-z0-9]{6,}|\bfile-[a-z0-9]{6,}|<evidencias>|<trecho|mensagem_do_cliente|regras de seguranca|politica aprovada de recomendacao/,
  ],
];

const ALLOWED_PHONE = PUBLIC_CONTACT.whatsappDisplay.replace(/\D/g, "");

/** Fail closed on any unsupported factual or operational claim. The model cannot override deterministic gates. */
export function checkGeneratedAnswer(raw: string, options: { lang?: Lang; checkLanguage?: boolean } = {}): PostCheck {
  const answer = raw.trim();
  if (!answer) return { ok: false, reason: "empty_answer" };
  if (answer.includes(INSUFFICIENT_MARKER)) return { ok: false, reason: "model_reported_insufficient", insufficient: true };
  const text = normalize(answer);
  for (const [reason, pattern] of CHECKS) if (pattern.test(text)) return { ok: false, reason };
  // V1 (pt/en/es): a FRESH answer must be in the visitor's language. Fixed texts and earlier assistant turns are exempt.
  const lang = options.lang ?? "pt";
  if (options.checkLanguage !== false && detectLanguage(answer, lang) !== lang) return { ok: false, reason: "wrong_language" };
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
