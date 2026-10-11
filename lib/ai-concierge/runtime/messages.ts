import { PUBLIC_CONTACT } from "@/lib/public-contact";
import type { DynamicReason, HandoffReason, RefusalReason } from "./types";

const CHANNELS = `Você pode falar diretamente com a equipe pelo WhatsApp ${PUBLIC_CONTACT.whatsappDisplay} ou pelo e-mail ${PUBLIC_CONTACT.email}.`;
export const PLANNER_URL = "https://www.ricardotour.com/pt/planeje-sua-viagem";
export const TOURS_URL = "https://www.ricardotour.com/pt/tours";
/** RT-74 §2 row 11: emergency wording has not been approved by the Owner yet (RT-75). The text below is PROPOSED and deliberately states no numbers or procedures. */
export const EMERGENCY_COPY_STATUS = "PROPOSED_PENDING_OWNER_APPROVAL" as const;

/** Deterministic customer-facing texts. No transfer, contact or confirmation is ever claimed. */
export const dynamicMessage = (reason: DynamicReason) => {
  switch (reason) {
    case "flight_inventory":
    case "hotel_inventory":
    case "oner_inventory":
      return `Voos, hotéis e pacotes mudam o tempo todo, então não consigo confirmar valores nem disponibilidade por aqui. Você pode pesquisar as opções atuais em Planeje sua viagem: ${PLANNER_URL}. ${CHANNELS}`;
    case "price":
      return `Eu não informo preços por aqui, porque eles podem mudar. O valor atual está na página do passeio ou pode ser confirmado com a equipe. ${CHANNELS}`;
    case "availability":
      return `Eu não consigo confirmar disponibilidade ou vagas em tempo real. Para uma data específica, consulte a página do passeio ou fale com a equipe. ${CHANNELS}`;
  }
};

/** Fixed answer to "who are you?": always explicit that Daniela is an AI, never a person or a team member. */
export const identityMessage = () =>
  `Sou a Daniela, a assistente de IA da Ricardo Tour: uma inteligência artificial, não uma pessoa nem uma integrante da equipe. Posso sugerir passeios e orientar os próximos passos. Se você prefere falar com uma pessoa, a equipe humana atende pelos canais oficiais. ${CHANNELS}`;

export const handoffMessage = (reason: HandoffReason) => {
  switch (reason) {
    case "booking_status":
      return `Não tenho acesso ao status de reservas e não posso confirmar uma reserva por aqui. Uma confirmação só vale quando vem da Ricardo Tour ou de um sistema autorizado. ${CHANNELS}`;
    case "payment_status":
      return `Não tenho acesso a pagamentos e não consigo confirmar se um pagamento foi aprovado. ${CHANNELS}`;
    case "refund_decision":
      return `Decisões sobre reembolso ou cancelamento dependem da análise da equipe, e eu não posso prometer nada nesse sentido. ${CHANNELS}`;
    case "operational_confirmation":
      return `Não consigo confirmar operação ou condições de um passeio em uma data específica, nem acompanhar um passeio em andamento. Se for urgente (atraso, ponto de encontro, alguém não chegou), fale agora com a equipe. ${CHANNELS}`;
    case "explicit_request":
      return `Claro! Eu não transfiro conversas nem aciono a equipe por você: você escolhe o canal abaixo e envia a sua mensagem. ${CHANNELS}`;
    case "unsupported_request":
      return `Pedidos personalizados, de grupo ou de orçamento específico precisam da análise da equipe da Ricardo Tour, e eu não consigo prometer valores ou condições. ${CHANNELS}`;
    case "complaint":
      return `Sinto muito pela situação. Ela precisa ser analisada pela equipe da Ricardo Tour; eu não consigo resolvê-la nem opinar sobre ela. ${CHANNELS}`;
    case "repeated_failure":
      return `Ainda não consegui ajudar com segurança. O melhor caminho agora é falar com a equipe. ${CHANNELS}`;
    case "insufficient_evidence":
      return `Não tenho informação confirmada suficiente para responder isso com segurança. Você pode ver os passeios publicados em ${TOURS_URL}. ${CHANNELS}`;
    case "booking_request":
      return `Eu não faço reservas, pagamentos nem cancelamentos por aqui e não peço dados de pagamento ou documentos no chat. Para reservar, use o processo da página do passeio ou fale com a equipe. ${CHANNELS}`;
    case "safety_sensitive":
      return `Não posso garantir a segurança de um local ou atividade e não tenho informação aprovada suficiente sobre isso. Para orientações atualizadas, fale com a equipe. ${CHANNELS}`;
    case "out_of_scope_advice":
      return `Eu não posso orientar sobre saúde, documentos, vistos ou questões jurídicas. Consulte as fontes oficiais e profissionais adequados. Para dúvidas sobre os serviços da Ricardo Tour: ${CHANNELS}`;
    case "emergency":
      return `Se você está em perigo ou precisa de ajuda médica urgente, procure imediatamente as autoridades locais de emergência. Sou a Daniela, uma assistente de IA, e não consigo prestar socorro. Depois, a equipe da Ricardo Tour pode ajudar. ${CHANNELS}`;
    case "rate_limited":
      // RT-72 §6: friendly, no counts and no window sizes (only Retry-After is exposed, by the caller).
      return `Você atingiu o limite de mensagens por agora. Tente novamente em alguns minutos ou fale com a equipe. ${CHANNELS}`;
    case "upstream_error":
      return `Não consegui responder agora. Tente novamente em instantes. ${CHANNELS}`;
  }
};

export const REFUSAL_MESSAGE =
  "Eu só posso ajudar com informações aprovadas da Ricardo Tour e não consigo seguir esse tipo de pedido. Posso te ajudar com passeios, experiências no Rio ou formas de falar com a equipe.";
export const refusalMessage = (reason: RefusalReason) => {
  switch (reason) {
    case "internal_information":
      return "Não posso compartilhar informações internas, de configuração ou de outros usuários. Posso ajudar com passeios, experiências no Rio ou formas de falar com a equipe.";
    case "abusive_content":
      return `Vou manter a conversa respeitosa. Se quiser, posso ajudar com passeios e experiências. ${CHANNELS}`;
    case "third_party_comparison":
      return "Eu não faço comparações nem comentários sobre outras empresas. Posso explicar os passeios e serviços da Ricardo Tour.";
    default:
      return REFUSAL_MESSAGE;
  }
};

/** True when a previous assistant turn was one of our fixed "could not help" texts (RT-71 H12 repeated failure). */
export function isFixedMissMessage(text: string) {
  const t = text.trim();
  return (
    t.startsWith("Não tenho informação confirmada suficiente") ||
    t.startsWith("Não consegui responder agora") ||
    t.startsWith("Ainda não consegui ajudar")
  );
}

/** Degraded response (RT-74 §1): fixed text plus a support reference that carries no request data. */
export const degradedMessage = (referenceId: string) => `${handoffMessage("upstream_error")} (ref. ${referenceId})`;

/** Appended when the visitor shared personal data, so the reminder never depends on the model. */
export const PERSONAL_DATA_REMINDER = "Por segurança, não envie dados pessoais ou sensíveis por aqui.";
export const UNSUPPORTED_LOCALE_MESSAGE =
  "O atendimento automático está disponível apenas em português por enquanto. " + CHANNELS;
export const INVALID_INPUT_MESSAGE = "Não consegui entender a mensagem. Escreva sua pergunta em até 800 caracteres.";
