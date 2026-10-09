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
const AVAILABILITY = /\b(?:tem|ha|existe\w*|sobrou|restam?|ainda tem)\b.{0,20}\b(?:vagas?|lugar(?:es)?|ingressos?|data livre|datas livres)\b|\b(?:vagas?|lotad\w*|esgotad\w*|disponibilidade|disponivel|disponiveis)\b/;

const BOOKING_STATUS = /\b(?:confirm\w*|status|situacao|andamento|aprovad\w*|efetivad\w*)\b.{0,30}\b(?:reserva|pedido|compra|ingressos?|solicitacao)\b|\b(?:reserva|pedido|compra|ingressos?)\b.{0,30}\b(?:confirmad\w*|aprovad\w*|efetivad\w*|garantid\w*|feit\w*|ok)\b|\bconfirme\b.{0,20}\breserva\b/;
const PAYMENT_STATUS = /\bpagamento\b.{0,30}\b(?:aprovad\w*|confirmad\w*|caiu|compensad\w*|processad\w*|recebid\w*|foi|esta|ja)\b|\b(?:paguei|pago|pix|boleto|cartao)\b.{0,30}\b(?:caiu|confirmad\w*|aprovad\w*|compensad\w*|recebid\w*|passou)\b|\bmeu pagamento\b|\bcobranca\b/;
const REFUND = /\b(?:reembols\w*|estorno|devolucao do (?:dinheiro|valor)|cancelar (?:minha|a) (?:reserva|compra))\b/;
const OPERATIONAL = /\b(?:vai|vao|pode|podem)\b.{0,15}\b(?:acontecer|sair|operar|ser cancelad\w*|ter)\b.{0,25}\b(?:hoje|amanha|nessa|nesta|neste|nesse)\b|\bpasseio (?:de|para) (?:hoje|amanha)\b|\b(?:vai|ira) chover\b|\bconfirm\w* (?:o )?(?:horario|ponto de encontro|pickup|saida)\b/;

// RT-74 §2 rows 11, 13, 17-21: deterministic gates beyond dynamic commercial data. Patterns run on normalized text.
const EMERGENCY = /\b(?:socorro|emergencia|estou (?:passando mal|em perigo|sendo (?:assaltad\w*|roubad\w*|seguid\w*|ameacad\w*))|fui (?:assaltad\w*|roubad\w*|agredid\w*)|me (?:assaltaram|roubaram|agrediram)|preciso de (?:um |uma )?(?:medico|ambulancia|policia|bombeiros?)|chame (?:a |uma |um )?(?:policia|ambulancia|medico)|infarto|desmaiou|afogando|overdose|acidente grave|risco de vida)\b/;
const ACTION_REQUEST = /\b(?:reserve|reservar para mim|faca (?:a |minha )?reserva|fazer (?:a |minha )?reserva para mim|quero (?:reservar|comprar|pagar|fechar)|vou (?:reservar|comprar|pagar|fechar)|pode (?:reservar|comprar|pagar|fechar)|me (?:manda|envia|mande|envie) (?:o )?(?:pix|link de pagamento|boleto)|(?:manda|envia|mande|envie) (?:o )?(?:pix|link de pagamento|boleto)|cancele|cancela (?:minha|a) |quero cancelar|pagar agora|finalizar (?:a )?compra)\b/;
const OUT_OF_SCOPE_ADVICE = /\b(?:(?:preciso|precisa|precisamos|exige|exigem|tirar|emitir|solicitar|requisitos? de|pedir) (?:de )?(?:um )?visto|visto (?:de turista|para entrar|americano|brasileiro|consular)|passaporte|imigracao|vacina\w*|medic\w*|remedio\w*|sintomas?|doenca\w*|advogad\w*|processo judicial|direitos do consumidor|procon|seguro saude|alergia\w*)\b/;
const SAFETY_SENSITIVE = /\b(?:seguro|segura|seguros|seguras|seguranca|perigos\w*|perigo|violen\w*|crime\w*|assalt\w*|roubo\w*|furto\w*|arrastao|arrastoes|favelas?|comunidades?|risco\w*|tiroteio\w*|balas? perdidas?|zona de risco)\b/;
const INTERNAL_INFO = /\b(?:api ?key|chave (?:da )?(?:api|openai)|token de acesso|senha do (?:sistema|servidor|admin)|variaveis? de ambiente|\.env|vector ?store|banco de dados|codigo[- ]fonte|ric studio|(?:qual|que) (?:modelo|versao|llm|ia) (?:voce )?(?:usa|e|esta usando)|(?:quais|que) fontes (?:voce )?(?:usa|tem)|lista de fontes|dados de (?:outros|outras) (?:usuarios|clientes|pessoas)|conversas? de (?:outros|outras))\b/;
const ABUSIVE = /\b(?:idiota|burro|imbecil|lixo|merda|porra|caralho|filho da puta|fdp|vai se f[\w*]+|vsf|otario|babaca|estupid\w*|inutil)\b/;
const COMPETITOR = /\b(?:concorrent\w*|cvc|decolar|viajanet|123milhas|maxmilhas|melhor que (?:a|o) \w+|comparar com (?:a|o|outras?|outros?))\b/;

export const detectEmergency = (message: string) => EMERGENCY.test(normalize(message));
export const detectInternalInfoRequest = (message: string) => INTERNAL_INFO.test(normalize(message));
export const detectAbuse = (message: string) => ABUSIVE.test(normalize(message));
export const detectCompetitorComparison = (message: string) => COMPETITOR.test(normalize(message));
/** Safety-sensitive tourism topics may be answered only with qualified, approved content; otherwise they become a handoff. */
export const isSafetySensitive = (message: string) => SAFETY_SENSITIVE.test(normalize(message));

export type GateDecision =
  | { kind: "dynamic"; reason: DynamicReason }
  | { kind: "handoff"; reason: HandoffReason }
  | { kind: "pass" };

// RT-71 triggers. H1 explicit human/WhatsApp request, H3 custom/group requests, H6 complaints, H8 urgent operations.
const EXPLICIT_REQUEST = /\b(?:(?:falar|conversar|atendimento|contato) (?:com )?(?:uma? )?(?:pessoa|humano|humana|atendente|alguem|gente de verdade|equipe|time|consultor\w*)|(?:quero|preciso de|gostaria de) (?:um |uma )?(?:atendente|atendimento humano|humano)|atendimento humano|atendente humano|(?:me )?(?:passa|passe|manda|mande|envia|envie|qual(?: e)?) (?:o |seu |o seu )?(?:whatsapp|zap|telefone|numero de contato)|chamar (?:no )?(?:whatsapp|zap)|falar no (?:whatsapp|zap))\b/;
const UNSUPPORTED_REQUEST = /\b(?:roteiro (?:personalizado|sob medida|exclusivo)|passeio (?:personalizado|sob medida|exclusivo|privativo)|pacote personalizado|cotacao|orcamento|grupo (?:de|com) \d+|grupo grande|excursao|evento corporativo|casamento|pedido especial|necessidade especial|negociar|negociacao|desconto para grupo)\b/;
const COMPLAINT = /\b(?:reclama\w*|insatisf\w*|pessim[oa]|horrivel|decepcion\w*|absurdo|inaceitavel|vou processar|acao judicial|enganad[oa]|golpe|fui lesad\w*)\b/;
const URGENT_OPERATION = /\b(?:(?:guia|motorista|van|transporte) (?:nao|ainda nao) (?:chegou|apareceu|veio)|estou (?:esperando|aguardando|perdid[oa]|atrasad[oa]|no local|no ponto)|(?:perdi|perdemos) (?:o|meu|nosso|a) (?:passeio|voo|guia|van|onibus|encontro)|vou (?:me )?atrasar|onde (?:esta|fica) (?:o )?(?:guia|ponto de encontro)|em cima da hora)\b/;

/** Out-of-scope professional advice and booking/payment actions are handoffs; evaluated with the other handoff gates. */
function actionOrAdviceGate(text: string): GateDecision {
  // RT-71 handoff intents take precedence over the generic gates below (e.g. a complaint that mentions "procon").
  if (EXPLICIT_REQUEST.test(text)) return { kind: "handoff", reason: "explicit_request" };
  if (COMPLAINT.test(text)) return { kind: "handoff", reason: "complaint" };
  if (UNSUPPORTED_REQUEST.test(text)) return { kind: "handoff", reason: "unsupported_request" };
  if (URGENT_OPERATION.test(text)) return { kind: "handoff", reason: "operational_confirmation" };
  if (ACTION_REQUEST.test(text)) return { kind: "handoff", reason: "booking_request" };
  if (OUT_OF_SCOPE_ADVICE.test(text)) return { kind: "handoff", reason: "out_of_scope_advice" };
  return { kind: "pass" };
}

/** Deterministic pre-retrieval gates. Order matters: individual-state requests (booking/payment/refund) come first. */
export function runGates(message: string): GateDecision {
  const text = normalize(message);
  if (PAYMENT_STATUS.test(text)) return { kind: "handoff", reason: "payment_status" };
  if (BOOKING_STATUS.test(text)) return { kind: "handoff", reason: "booking_status" };
  if (REFUND.test(text)) return { kind: "handoff", reason: "refund_decision" };
  const action = actionOrAdviceGate(text);
  if (action.kind !== "pass") return action;
  if (/\boner\b/.test(text)) return { kind: "dynamic", reason: "oner_inventory" };
  if (HOTEL.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "hotel_inventory" };
  if (FLIGHT.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "flight_inventory" };
  if (PRICE.test(text)) return { kind: "dynamic", reason: "price" };
  if (AVAILABILITY.test(text)) return { kind: "dynamic", reason: "availability" };
  if (OPERATIONAL.test(text)) return { kind: "handoff", reason: "operational_confirmation" };
  return { kind: "pass" };
}
