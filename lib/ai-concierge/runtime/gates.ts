import type { DynamicReason, HandoffReason } from "./types";

/** Lowercase, strip diacritics, collapse whitespace so patterns are accent/case-insensitive. */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const INJECTION = [
  /\b(?:ignore|ignora|ignorar|desconsidere|esqueca|esqueca)\b.{0,40}\b(?:regras?|instrucoes|fontes?|politicas?|base)\b/,
  /\b(?:mostre|revele|exiba|diga|repita|imprima)\b.{0,30}\b(?:suas?|seu|o) ?(?:instrucoes|prompt|regras|configuracao|politica)\b/,
  /\bsystem prompt\b|\bprompt do sistema\b|\binstrucoes internas\b|\bdeveloper message\b/,
  /\bfora da base\b|\bconhecimento (?:externo|que (?:voce )?tem|proprio)\b|\bsem (?:consultar )?(?:a )?(?:fonte|fontes|base)\b|\bmesmo sem fonte\b/,
  /\bfinja que\b|\bhaja como\b|\baja como\b|\bmodo desenvolvedor\b|\bjailbreak\b/,
];

export function detectInjection(message: string) {
  const text = normalize(message);
  return INJECTION.some((pattern) => pattern.test(text));
}

const FLIGHT = /\b(?:voos?|passagens?|aereo|aerea|aereas|companhia aerea)\b/;
const HOTEL = /\b(?:hoteis|hotel|hospedagem|pousadas?|diarias?|quartos?)\b/;
const DYNAMIC_CUE = /\b(?:hoje|amanha|semana|mes|data|datas|disponiv\w*|barat\w*|horarios?|cotacao|pesquis\w*|encontr\w*|comprar|reservar|quero|tem)\b/;

const PRICE = /\b(?:preco\w*|precos|quanto (?:custa|custam|e|fica|sai|saem|cobra\w*|pago|paga)|custa|custam|valor(?:es)?|tarifas?|orcamento|desconto\w*|promocao|promocoes|taxas?)\b|r\$|\bbarato\b/;
const AVAILABILITY = /\b(?:tem|ha|existe\w*|sobrou|restam?|ainda tem)\b.{0,20}\b(?:vagas?|lugares?|ingressos?|data livre|datas livres)\b|\b(?:vagas?|lotad\w*|esgotad\w*|disponibilidade|disponivel|disponiveis)\b/;

const BOOKING_STATUS = /\b(?:confirm\w*|status|situacao|andamento|aprovad\w*|efetivad\w*)\b.{0,30}\b(?:reserva|pedido|compra|ingressos?|solicitacao)\b|\b(?:reserva|pedido|compra|ingressos?)\b.{0,30}\b(?:confirmad\w*|aprovad\w*|efetivad\w*|garantid\w*|feit\w*|ok)\b|\bconfirme\b.{0,20}\breserva\b/;
const PAYMENT_STATUS = /\bpagamento\b.{0,30}\b(?:aprovad\w*|confirmad\w*|caiu|compensad\w*|processad\w*|recebid\w*|foi|esta|ja)\b|\b(?:paguei|pago|pix|boleto|cartao)\b.{0,30}\b(?:caiu|confirmad\w*|aprovad\w*|compensad\w*|recebid\w*|passou)\b|\bmeu pagamento\b|\bcobranca\b/;
const REFUND = /\b(?:reembols\w*|estorno|devolucao do (?:dinheiro|valor)|cancelar (?:minha|a) (?:reserva|compra))\b/;
const OPERATIONAL = /\b(?:vai|vao|pode|podem)\b.{0,15}\b(?:acontecer|sair|operar|ser cancelad\w*|ter)\b.{0,25}\b(?:hoje|amanha|nessa|nesta|neste|nesse)\b|\bpasseio (?:de|para) (?:hoje|amanha)\b|\b(?:vai|ira) chover\b|\bconfirm\w* (?:o )?(?:horario|ponto de encontro|pickup|saida)\b/;

export type GateDecision =
  | { kind: "dynamic"; reason: DynamicReason }
  | { kind: "handoff"; reason: HandoffReason }
  | { kind: "pass" };

/** Deterministic pre-retrieval gates. Order matters: individual-state requests (booking/payment/refund) come first. */
export function runGates(message: string): GateDecision {
  const text = normalize(message);
  if (PAYMENT_STATUS.test(text)) return { kind: "handoff", reason: "payment_status" };
  if (BOOKING_STATUS.test(text)) return { kind: "handoff", reason: "booking_status" };
  if (REFUND.test(text)) return { kind: "handoff", reason: "refund_decision" };
  if (/\boner\b/.test(text)) return { kind: "dynamic", reason: "oner_inventory" };
  if (HOTEL.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "hotel_inventory" };
  if (FLIGHT.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "flight_inventory" };
  if (PRICE.test(text)) return { kind: "dynamic", reason: "price" };
  if (AVAILABILITY.test(text)) return { kind: "dynamic", reason: "availability" };
  if (OPERATIONAL.test(text)) return { kind: "handoff", reason: "operational_confirmation" };
  return { kind: "pass" };
}
