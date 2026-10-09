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

export const handoffMessage = (reason: HandoffReason) => {
  switch (reason) {
    case "booking_status":
      return `Não tenho acesso ao status de reservas e não posso confirmar uma reserva por aqui. Uma confirmação só vale quando vem da Ricardo Tour ou de um sistema autorizado. ${CHANNELS}`;
    case "payment_status":
      return `Não tenho acesso a pagamentos e não consigo confirmar se um pagamento foi aprovado. ${CHANNELS}`;
    case "refund_decision":
      return `Decisões sobre reembolso ou cancelamento dependem da análise da equipe, e eu não posso prometer nada nesse sentido. ${CHANNELS}`;
    case "operational_confirmation":
      return `Não consigo confirmar operação ou condições de um passeio em uma data específica. ${CHANNELS}`;
    case "insufficient_evidence":
      return `Não tenho informação confirmada suficiente para responder isso com segurança. Você pode ver os passeios publicados em ${TOURS_URL}. ${CHANNELS}`;
    case "booking_request":
      return `Eu não faço reservas, pagamentos nem cancelamentos por aqui e não peço dados de pagamento ou documentos no chat. Para reservar, use o processo da página do passeio ou fale com a equipe. ${CHANNELS}`;
    case "safety_sensitive":
      return `Não posso garantir a segurança de um local ou atividade e não tenho informação aprovada suficiente sobre isso. Para orientações atualizadas, fale com a equipe. ${CHANNELS}`;
    case "out_of_scope_advice":
      return `Eu não posso orientar sobre saúde, documentos, vistos ou questões jurídicas. Consulte as fontes oficiais e profissionais adequados. Para dúvidas sobre os serviços da Ricardo Tour: ${CHANNELS}`;
    case "emergency":
      return `Se você está em perigo ou precisa de ajuda médica urgente, procure imediatamente as autoridades locais de emergência. Sou um assistente virtual e não consigo prestar socorro. Depois, a equipe da Ricardo Tour pode ajudar. ${CHANNELS}`;
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

/** Degraded response (RT-74 §1): fixed text plus a support reference that carries no request data. */
export const degradedMessage = (referenceId: string) => `${handoffMessage("upstream_error")} (ref. ${referenceId})`;

/** Appended when the visitor shared personal data, so the reminder never depends on the model. */
export const PERSONAL_DATA_REMINDER = "Por segurança, não envie dados pessoais ou sensíveis por aqui.";
export const UNSUPPORTED_LOCALE_MESSAGE =
  "O atendimento automático está disponível apenas em português por enquanto. " + CHANNELS;
export const INVALID_INPUT_MESSAGE = "Não consegui entender a mensagem. Escreva sua pergunta em até 800 caracteres.";
