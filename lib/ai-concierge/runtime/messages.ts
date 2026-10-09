import { PUBLIC_CONTACT } from "@/lib/public-contact";
import type { DynamicReason, HandoffReason } from "./types";

const CHANNELS = `Você pode falar diretamente com a equipe pelo WhatsApp ${PUBLIC_CONTACT.whatsappDisplay} ou pelo e-mail ${PUBLIC_CONTACT.email}.`;
export const PLANNER_URL = "https://www.ricardotour.com/pt/planeje-sua-viagem";

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
      return `Não tenho informação confirmada suficiente para responder isso com segurança. ${CHANNELS}`;
    case "upstream_error":
      return `Não consegui responder agora. Tente novamente em instantes. ${CHANNELS}`;
  }
};

export const REFUSAL_MESSAGE =
  "Eu só posso ajudar com informações aprovadas da Ricardo Tour e não consigo seguir esse tipo de pedido. Posso te ajudar com passeios, experiências no Rio ou formas de falar com a equipe.";
export const UNSUPPORTED_LOCALE_MESSAGE =
  "O atendimento automático está disponível apenas em português por enquanto. " + CHANNELS;
export const INVALID_INPUT_MESSAGE = "Não consegui entender a mensagem. Escreva sua pergunta em até 800 caracteres.";
