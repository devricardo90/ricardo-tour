import { PUBLIC_CONTACT } from "@/lib/public-contact";
import type { Lang } from "./lang";
import type { DynamicReason, HandoffReason, RefusalReason } from "./types";

/**
 * Deterministic customer-facing texts, in Portuguese, English and Spanish (V1). Daniela speaks in the first person as an AI.
 * No transfer, contact or confirmation is ever claimed. Every function defaults to Portuguese so existing callers keep working.
 */
const CHANNELS_BY_LANG: Record<Lang, string> = {
  pt: `Você pode falar diretamente com a equipe pelo WhatsApp ${PUBLIC_CONTACT.whatsappDisplay} ou pelo e-mail ${PUBLIC_CONTACT.email}.`,
  en: `You can talk to the team directly on WhatsApp ${PUBLIC_CONTACT.whatsappDisplay} or by e-mail at ${PUBLIC_CONTACT.email}.`,
  es: `Puedes hablar directamente con el equipo por WhatsApp ${PUBLIC_CONTACT.whatsappDisplay} o por correo en ${PUBLIC_CONTACT.email}.`,
};
const CHANNELS = CHANNELS_BY_LANG.pt;
export const channelsText = (lang: Lang = "pt") => CHANNELS_BY_LANG[lang];

export const PLANNER_URL = "https://www.ricardotour.com/pt/planeje-sua-viagem";
export const TOURS_URL = "https://www.ricardotour.com/pt/tours";
export const plannerUrl = (lang: Lang = "pt") => `https://www.ricardotour.com/${lang}/planeje-sua-viagem`;
export const toursUrl = (lang: Lang = "pt") => `https://www.ricardotour.com/${lang}/tours`;

/** RT-74 §2 row 11: emergency wording has not been approved by the Owner yet (RT-75). The text below is PROPOSED and deliberately states no numbers or procedures. */
export const EMERGENCY_COPY_STATUS: "PROPOSED_PENDING_OWNER_APPROVAL" | "APPROVED" = "PROPOSED_PENDING_OWNER_APPROVAL";

export const dynamicMessage = (reason: DynamicReason, lang: Lang = "pt") => {
  const channels = channelsText(lang);
  switch (reason) {
    case "flight_inventory":
    case "hotel_inventory":
    case "oner_inventory":
      return {
        pt: `Voos, hotéis e pacotes mudam o tempo todo, então não consigo confirmar valores nem disponibilidade por aqui. Você pode pesquisar as opções atuais em Planeje sua viagem: ${plannerUrl("pt")}. ${channels}`,
        en: `Flights, hotels and packages change all the time, so I can't confirm prices or availability here. You can search the current options in Plan your trip: ${plannerUrl("en")}. ${channels}`,
        es: `Los vuelos, hoteles y paquetes cambian todo el tiempo, así que no puedo confirmar precios ni disponibilidad por aquí. Puedes buscar las opciones actuales en Planea tu viaje: ${plannerUrl("es")}. ${channels}`,
      }[lang];
    case "price":
      return {
        pt: `Eu não informo preços por aqui, porque eles podem mudar. O valor atual está na página do passeio ou pode ser confirmado com a equipe. ${channels}`,
        en: `I don't share prices here because they can change. The current price is on the tour page or can be confirmed by the team. ${channels}`,
        es: `No doy precios por aquí porque pueden cambiar. El valor actual está en la página del paseo o lo puede confirmar el equipo. ${channels}`,
      }[lang];
    case "availability":
      return {
        pt: `Eu não consigo confirmar disponibilidade ou vagas em tempo real. Para uma data específica, consulte a página do passeio ou fale com a equipe. ${channels}`,
        en: `I can't confirm availability or spots in real time. For a specific date, check the tour page or talk to the team. ${channels}`,
        es: `No puedo confirmar disponibilidad ni cupos en tiempo real. Para una fecha específica, consulta la página del paseo o habla con el equipo. ${channels}`,
      }[lang];
  }
};

/** Fixed answer to "who are you?": always explicit that Daniela is an AI, never a person or a team member. */
export const identityMessage = (lang: Lang = "pt") => {
  const channels = channelsText(lang);
  return {
    pt: `Sou a Daniela, a assistente de IA da Ricardo Tour: uma inteligência artificial, não uma pessoa nem uma integrante da equipe. Posso sugerir passeios e orientar os próximos passos. Se você prefere falar com uma pessoa, a equipe humana atende pelos canais oficiais. ${channels}`,
    en: `I'm Daniela, Ricardo Tour's AI assistant: an artificial intelligence, not a person or a member of the team. I can suggest tours and guide your next steps. If you'd rather talk to a person, the human team is available through the official channels. ${channels}`,
    es: `Soy Daniela, la asistente de IA de Ricardo Tour: una inteligencia artificial, no una persona ni una integrante del equipo. Puedo sugerir paseos y orientar los próximos pasos. Si prefieres hablar con una persona, el equipo humano atiende por los canales oficiales. ${channels}`,
  }[lang];
};

export const handoffMessage = (reason: HandoffReason, lang: Lang = "pt") => {
  const channels = channelsText(lang);
  const t = (pt: string, en: string, es: string) => ({ pt, en, es })[lang];
  switch (reason) {
    case "booking_status":
      return t(
        `Não tenho acesso ao status de reservas e não posso confirmar uma reserva por aqui. Uma confirmação só vale quando vem da Ricardo Tour ou de um sistema autorizado. ${channels}`,
        `I don't have access to booking status and I can't confirm a booking here. A confirmation is only valid when it comes from Ricardo Tour or an authorized system. ${channels}`,
        `No tengo acceso al estado de las reservas y no puedo confirmar una reserva por aquí. Una confirmación solo vale cuando viene de Ricardo Tour o de un sistema autorizado. ${channels}`,
      );
    case "payment_status":
      return t(
        `Não tenho acesso a pagamentos e não consigo confirmar se um pagamento foi aprovado. ${channels}`,
        `I don't have access to payments and I can't confirm whether a payment was approved. ${channels}`,
        `No tengo acceso a los pagos y no puedo confirmar si un pago fue aprobado. ${channels}`,
      );
    case "refund_decision":
      return t(
        `Decisões sobre reembolso ou cancelamento dependem da análise da equipe, e eu não posso prometer nada nesse sentido. ${channels}`,
        `Refund or cancellation decisions depend on the team's review, and I can't promise anything about them. ${channels}`,
        `Las decisiones sobre reembolsos o cancelaciones dependen del análisis del equipo, y no puedo prometer nada al respecto. ${channels}`,
      );
    case "operational_confirmation":
      return t(
        `Não consigo confirmar operação ou condições de um passeio em uma data específica, nem acompanhar um passeio em andamento. Se for urgente (atraso, ponto de encontro, alguém não chegou), fale agora com a equipe. ${channels}`,
        `I can't confirm operation or conditions of a tour on a specific date, or follow a tour in progress. If it's urgent (a delay, the meeting point, someone hasn't arrived), talk to the team now. ${channels}`,
        `No puedo confirmar la operación ni las condiciones de un paseo en una fecha específica, ni acompañar un paseo en curso. Si es urgente (retraso, punto de encuentro, alguien no llegó), habla ahora con el equipo. ${channels}`,
      );
    case "explicit_request":
      return t(
        `Claro! Eu não transfiro conversas nem aciono a equipe por você: você escolhe o canal abaixo e envia a sua mensagem. ${channels}`,
        `Of course! I don't transfer conversations or contact the team for you: you choose the channel below and send your own message. ${channels}`,
        `¡Claro! No transfiero conversaciones ni aviso al equipo por ti: tú eliges el canal de abajo y envías tu mensaje. ${channels}`,
      );
    case "unsupported_request":
      return t(
        `Pedidos personalizados, de grupo ou de orçamento específico precisam da análise da equipe da Ricardo Tour, e eu não consigo prometer valores ou condições. ${channels}`,
        `Custom, group or specific-quote requests need the Ricardo Tour team's review, and I can't promise prices or conditions. ${channels}`,
        `Los pedidos personalizados, de grupo o de presupuesto específico necesitan el análisis del equipo de Ricardo Tour, y no puedo prometer valores ni condiciones. ${channels}`,
      );
    case "complaint":
      return t(
        `Sinto muito pela situação. Ela precisa ser analisada pela equipe da Ricardo Tour; eu não consigo resolvê-la nem opinar sobre ela. ${channels}`,
        `I'm sorry about the situation. It needs to be reviewed by the Ricardo Tour team; I can't resolve it or comment on it. ${channels}`,
        `Lamento la situación. Debe ser analizada por el equipo de Ricardo Tour; no puedo resolverla ni opinar sobre ella. ${channels}`,
      );
    case "repeated_failure":
      return t(
        `Ainda não consegui ajudar com segurança. O melhor caminho agora é falar com a equipe. ${channels}`,
        `I still couldn't help safely. The best way forward now is to talk to the team. ${channels}`,
        `Todavía no he podido ayudar con seguridad. Lo mejor ahora es hablar con el equipo. ${channels}`,
      );
    case "insufficient_evidence":
      return t(
        `Não tenho informação confirmada suficiente para responder isso com segurança. Você pode ver os passeios publicados em ${toursUrl("pt")}. ${channels}`,
        `I don't have enough confirmed information to answer that safely. You can see the published tours at ${toursUrl("en")}. ${channels}`,
        `No tengo información confirmada suficiente para responder eso con seguridad. Puedes ver los paseos publicados en ${toursUrl("es")}. ${channels}`,
      );
    case "booking_request":
      return t(
        `Eu não faço reservas, pagamentos nem cancelamentos por aqui e não peço dados de pagamento ou documentos no chat. Para reservar, use o processo da página do passeio ou fale com a equipe. ${channels}`,
        `I don't make bookings, payments or cancellations here, and I never ask for payment details or documents in the chat. To book, use the process on the tour page or talk to the team. ${channels}`,
        `No hago reservas, pagos ni cancelaciones por aquí y no pido datos de pago ni documentos en el chat. Para reservar, usa el proceso de la página del paseo o habla con el equipo. ${channels}`,
      );
    case "safety_sensitive":
      return t(
        `Não posso garantir a segurança de um local ou atividade e não tenho informação aprovada suficiente sobre isso. Para orientações atualizadas, fale com a equipe. ${channels}`,
        `I can't guarantee the safety of a place or activity and I don't have enough approved information about it. For up-to-date guidance, talk to the team. ${channels}`,
        `No puedo garantizar la seguridad de un lugar o actividad y no tengo información aprobada suficiente al respecto. Para orientación actualizada, habla con el equipo. ${channels}`,
      );
    case "out_of_scope_advice":
      return t(
        `Eu não posso orientar sobre saúde, documentos, vistos ou questões jurídicas. Consulte as fontes oficiais e profissionais adequados. Para dúvidas sobre os serviços da Ricardo Tour: ${channels}`,
        `I can't advise on health, documents, visas or legal matters. Please check official sources and the right professionals. For questions about Ricardo Tour's services: ${channels}`,
        `No puedo orientar sobre salud, documentos, visas o asuntos legales. Consulta las fuentes oficiales y a los profesionales adecuados. Para dudas sobre los servicios de Ricardo Tour: ${channels}`,
      );
    case "commercial_terms":
      return t(
        `O que está incluído, as formas de pagamento, taxas e a política de cancelamento são condições comerciais que só a equipe da Ricardo Tour pode confirmar com segurança. ${channels}`,
        `What is included, payment methods, fees and the cancellation policy are commercial terms that only the Ricardo Tour team can confirm safely. ${channels}`,
        `Lo que está incluido, las formas de pago, las tarifas y la política de cancelación son condiciones comerciales que solo el equipo de Ricardo Tour puede confirmar con seguridad. ${channels}`,
      );
    case "emergency":
      return t(
        `Se você está em perigo ou precisa de ajuda médica urgente, procure imediatamente as autoridades locais de emergência. Sou a Daniela, uma assistente de IA, e não consigo prestar socorro. Depois, a equipe da Ricardo Tour pode ajudar. ${channels}`,
        `If you are in danger or need urgent medical help, contact the local emergency authorities immediately. I'm Daniela, an AI assistant, and I can't provide emergency help. Afterwards, the Ricardo Tour team can help. ${channels}`,
        `Si estás en peligro o necesitas ayuda médica urgente, contacta de inmediato a las autoridades locales de emergencia. Soy Daniela, una asistente de IA, y no puedo prestar auxilio. Después, el equipo de Ricardo Tour puede ayudar. ${channels}`,
      );
    case "rate_limited":
      // RT-72 §6: friendly, no counts and no window sizes (only Retry-After is exposed, by the caller).
      return t(
        `Você atingiu o limite de mensagens por agora. Tente novamente em alguns minutos ou fale com a equipe. ${channels}`,
        `You've reached the message limit for now. Try again in a few minutes or talk to the team. ${channels}`,
        `Has alcanzado el límite de mensajes por ahora. Inténtalo de nuevo en unos minutos o habla con el equipo. ${channels}`,
      );
    case "upstream_error":
      return t(
        `Não consegui responder agora. Tente novamente em instantes. ${channels}`,
        `I couldn't answer right now. Please try again in a moment. ${channels}`,
        `No pude responder ahora. Inténtalo de nuevo en unos instantes. ${channels}`,
      );
  }
};

/** Fixed recommendation text; the cards (from the approved catalog) carry the details. No price, duration or availability. */
export const recommendationMessage = (titles: string[], lang: Lang = "pt") => {
  const list = titles.join(" · ");
  return {
    pt: `Com base no catálogo de passeios publicados da Ricardo Tour, estas opções podem combinar com você: ${list}. Preços, datas e disponibilidade ficam na página de cada passeio ou com a equipe pelo WhatsApp.`,
    en: `Based on Ricardo Tour's published tour catalog, these options may suit you: ${list}. Prices, dates and availability are on each tour's page or with the team on WhatsApp.`,
    es: `Según el catálogo de paseos publicados de Ricardo Tour, estas opciones pueden irte bien: ${list}. Los precios, fechas y disponibilidad están en la página de cada paseo o con el equipo por WhatsApp.`,
  }[lang];
};

export const REFUSAL_MESSAGE =
  "Eu só posso ajudar com informações aprovadas da Ricardo Tour e não consigo seguir esse tipo de pedido. Posso te ajudar com passeios, experiências no Rio ou formas de falar com a equipe.";
export const refusalMessage = (reason: RefusalReason, lang: Lang = "pt") => {
  const channels = channelsText(lang);
  const t = (pt: string, en: string, es: string) => ({ pt, en, es })[lang];
  switch (reason) {
    case "internal_information":
      return t(
        "Não posso compartilhar informações internas, de configuração ou de outros usuários. Posso ajudar com passeios, experiências no Rio ou formas de falar com a equipe.",
        "I can't share internal, configuration or other users' information. I can help with tours, experiences in Rio or ways to talk to the team.",
        "No puedo compartir información interna, de configuración o de otros usuarios. Puedo ayudar con paseos, experiencias en Río o formas de hablar con el equipo.",
      );
    case "abusive_content":
      return t(
        `Vou manter a conversa respeitosa. Se quiser, posso ajudar com passeios e experiências. ${channels}`,
        `I'll keep the conversation respectful. If you like, I can help with tours and experiences. ${channels}`,
        `Voy a mantener la conversación respetuosa. Si quieres, puedo ayudar con paseos y experiencias. ${channels}`,
      );
    case "third_party_comparison":
      return t(
        "Eu não faço comparações nem comentários sobre outras empresas. Posso explicar os passeios e serviços da Ricardo Tour.",
        "I don't compare or comment on other companies. I can explain Ricardo Tour's tours and services.",
        "No hago comparaciones ni comentarios sobre otras empresas. Puedo explicar los paseos y servicios de Ricardo Tour.",
      );
    default:
      return t(
        REFUSAL_MESSAGE,
        "I can only help with approved Ricardo Tour information and I can't follow that kind of request. I can help with tours, experiences in Rio or ways to talk to the team.",
        "Solo puedo ayudar con información aprobada de Ricardo Tour y no puedo seguir ese tipo de petición. Puedo ayudar con paseos, experiencias en Río o formas de hablar con el equipo.",
      );
  }
};

const ALL_HANDOFF_REASONS: HandoffReason[] = [
  "explicit_request", "unsupported_request", "complaint", "repeated_failure", "booking_status", "payment_status", "refund_decision",
  "operational_confirmation", "booking_request", "safety_sensitive", "out_of_scope_advice", "emergency", "insufficient_evidence",
  "upstream_error", "rate_limited", "commercial_terms",
];
const ALL_DYNAMIC_REASONS: DynamicReason[] = ["price", "availability", "flight_inventory", "hotel_inventory", "oner_inventory"];
const ALL_REFUSAL_REASONS: RefusalReason[] = ["prompt_injection", "prompt_injection_history", "internal_information", "abusive_content", "third_party_comparison"];
const LANGS: Lang[] = ["pt", "en", "es"];

let fixedTexts: Set<string> | undefined;
/**
 * True when `text` is EXACTLY one of the runtime's own fixed customer texts (optionally followed by the support reference and/or the
 * personal-data reminder). The history check uses it so that the panel sending Daniela's own fixed answers back as context (for example
 * the commercial-terms handoff, which legitimately talks about payment methods) is never mistaken for a forged unsafe assistant turn.
 * Anything that is not byte-for-byte one of these texts still goes through the full post-generation check.
 */
export function isFixedRuntimeText(text: string) {
  fixedTexts ??= new Set(
    LANGS.flatMap((lang) => [
      identityMessage(lang),
      invalidInputMessage(lang),
      ...ALL_HANDOFF_REASONS.map((reason) => handoffMessage(reason, lang)),
      ...ALL_DYNAMIC_REASONS.map((reason) => dynamicMessage(reason, lang)),
      ...ALL_REFUSAL_REASONS.map((reason) => refusalMessage(reason, lang)),
    ]).concat([UNSUPPORTED_LOCALE_MESSAGE]),
  );
  let t = text.trim();
  for (const lang of LANGS) {
    const reminder = personalDataReminder(lang);
    if (t.endsWith(` ${reminder}`)) t = t.slice(0, -reminder.length - 1);
  }
  t = t.replace(/ \(ref\. [A-Za-z0-9-]{1,16}\)$/, "");
  return fixedTexts.has(t);
}

/** True when a previous assistant turn was one of our fixed "could not help" texts (RT-71 H12 repeated failure), in any V1 language. */
export function isFixedMissMessage(text: string) {
  const t = text.trim();
  return [
    "Não tenho informação confirmada suficiente",
    "Não consegui responder agora",
    "Ainda não consegui ajudar",
    "I don't have enough confirmed information",
    "I couldn't answer right now",
    "I still couldn't help safely",
    "No tengo información confirmada suficiente",
    "No pude responder ahora",
    "Todavía no he podido ayudar",
  ].some((prefix) => t.startsWith(prefix));
}

/** Degraded response (RT-74 §1): fixed text plus a support reference that carries no request data. */
export const degradedMessage = (referenceId: string, lang: Lang = "pt") => `${handoffMessage("upstream_error", lang)} (ref. ${referenceId})`;

/** Appended when the visitor shared personal data, so the reminder never depends on the model. */
export const PERSONAL_DATA_REMINDER = "Por segurança, não envie dados pessoais ou sensíveis por aqui.";
export const personalDataReminder = (lang: Lang = "pt") =>
  ({
    pt: PERSONAL_DATA_REMINDER,
    en: "For your safety, please don't send personal or sensitive data here.",
    es: "Por seguridad, no envíes datos personales ni sensibles por aquí.",
  })[lang];

/** Locale outside pt/en/es: one trilingual text, since the visitor's language cannot be assumed. */
export const UNSUPPORTED_LOCALE_MESSAGE =
  `O atendimento automático está disponível em português, inglês e espanhol. / The automatic assistant is available in Portuguese, English and Spanish. / El asistente automático está disponible en portugués, inglés y español. ${CHANNELS}`;

export const invalidInputMessage = (lang: Lang = "pt") =>
  ({
    pt: "Não consegui entender a mensagem. Escreva sua pergunta em até 800 caracteres.",
    en: "I couldn't understand the message. Please write your question in up to 800 characters.",
    es: "No pude entender el mensaje. Escribe tu pregunta en hasta 800 caracteres.",
  })[lang];
export const INVALID_INPUT_MESSAGE = invalidInputMessage("pt");
