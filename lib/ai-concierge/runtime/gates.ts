import { EXTRA, union } from "./gate-terms";
import type { DynamicReason, HandoffReason } from "./types";

/** Lowercase, strip diacritics, collapse whitespace so patterns are accent/case-insensitive. */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const INJECTION: RegExp[] = [
  ...EXTRA.INJECTION,
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

const FLIGHT_PT = /\b(?:voos?|passagens?|aereo|aerea|aereas|companhia aerea)\b/;
const FLIGHT = union(FLIGHT_PT, EXTRA.FLIGHT);
const HOTEL_PT = /\b(?:hoteis|hotel|hospedagem|pousadas?|diarias?|quartos?)\b/;
const HOTEL = union(HOTEL_PT, EXTRA.HOTEL);
const DYNAMIC_CUE_PT = /\b(?:hoje|amanha|semana|mes|data|datas|disponiv\w*|barat\w*|horarios?|cotacao|pesquis\w*|encontr\w*|comprar|reservar|quero|tem)\b/;
const DYNAMIC_CUE = union(DYNAMIC_CUE_PT, EXTRA.DYNAMIC_CUE);

const PRICE_PT = /\b(?:preco\w*|precos|quanto (?:custa|custam|e|fica|sai|saem|cobra\w*|pago|paga)|custa|custam|valor(?:es)?|tarifas?|orcamento|desconto\w*|promocao|promocoes|taxas?)\b|r\$|\bbarato\b/;
const PRICE = union(PRICE_PT, EXTRA.PRICE);
const AVAILABILITY_PT = /\b(?:tem|ha|existe\w*|sobrou|restam?|ainda tem)\b.{0,20}\b(?:vagas?|lugar(?:es)?|ingressos?|data livre|datas livres)\b|\b(?:vagas?|lotad\w*|esgotad\w*|disponibilidade|disponivel|disponiveis)\b/;
const AVAILABILITY = union(AVAILABILITY_PT, EXTRA.AVAILABILITY);

const BOOKING_STATUS_PT = /\b(?:confirm\w*|status|situacao|andamento|aprovad\w*|efetivad\w*)\b.{0,30}\b(?:reserva|pedido|compra|ingressos?|solicitacao)\b|\b(?:reserva|pedido|compra|ingressos?)\b.{0,30}\b(?:confirmad\w*|aprovad\w*|efetivad\w*|garantid\w*|feit\w*|ok)\b|\bconfirme\b.{0,20}\breserva\b/;
const BOOKING_STATUS = union(BOOKING_STATUS_PT, EXTRA.BOOKING_STATUS);
const PAYMENT_STATUS_PT = /\bpagamento\b.{0,30}\b(?:aprovad\w*|confirmad\w*|caiu|compensad\w*|processad\w*|recebid\w*|foi|esta|ja)\b|\b(?:paguei|pago|pix|boleto|cartao)\b.{0,30}\b(?:caiu|confirmad\w*|aprovad\w*|compensad\w*|recebid\w*|passou)\b|\bmeu pagamento\b|\bcobranca\b/;
const PAYMENT_STATUS = union(PAYMENT_STATUS_PT, EXTRA.PAYMENT_STATUS);
const REFUND_PT = /\b(?:reembols\w*|estorno|devolucao do (?:dinheiro|valor)|cancelar (?:minha|a) (?:reserva|compra))\b/;
const REFUND = union(REFUND_PT, EXTRA.REFUND);
const OPERATIONAL_PT = /\b(?:vai|vao|pode|podem)\b.{0,15}\b(?:acontecer|sair|operar|ser cancelad\w*|ter)\b.{0,25}\b(?:hoje|amanha|nessa|nesta|neste|nesse)\b|\bpasseio (?:de|para) (?:hoje|amanha)\b|\b(?:vai|ira) chover\b|\bconfirm\w* (?:o )?(?:horario|ponto de encontro|pickup|saida)\b/;
const OPERATIONAL = union(OPERATIONAL_PT, EXTRA.OPERATIONAL);

// RT-74 §2 rows 11, 13, 17-21: deterministic gates beyond dynamic commercial data. Patterns run on normalized text.
const EMERGENCY_PT = /\b(?:socorro|emergencia|estou (?:passando mal|em perigo|sendo (?:assaltad\w*|roubad\w*|seguid\w*|ameacad\w*))|fui (?:assaltad\w*|roubad\w*|agredid\w*)|me (?:assaltaram|roubaram|agrediram)|preciso de (?:um |uma )?(?:medico|ambulancia|policia|bombeiros?)|chame (?:a |uma |um )?(?:policia|ambulancia|medico)|infarto|desmaiou|afogando|overdose|acidente grave|risco de vida)\b/;
const EMERGENCY = union(EMERGENCY_PT, ...EXTRA.EMERGENCY);
const ACTION_REQUEST_PT = /\b(?:reserve|reservar para mim|faca (?:a |minha )?reserva|fazer (?:a |minha )?reserva para mim|quero (?:reservar|comprar|pagar|fechar)|vou (?:reservar|comprar|pagar|fechar)|pode (?:reservar|comprar|pagar|fechar)|me (?:manda|envia|mande|envie) (?:o )?(?:pix|link de pagamento|boleto)|(?:manda|envia|mande|envie) (?:o )?(?:pix|link de pagamento|boleto)|cancele|cancela (?:minha|a) |quero cancelar|pagar agora|finalizar (?:a )?compra)\b/;
const ACTION_REQUEST = union(ACTION_REQUEST_PT, EXTRA.ACTION_REQUEST);
const OUT_OF_SCOPE_ADVICE_PT = /\b(?:(?:preciso|precisa|precisamos|exige|exigem|tirar|emitir|solicitar|requisitos? de|pedir) (?:de )?(?:um )?visto|visto (?:de turista|para entrar|americano|brasileiro|consular)|passaporte|imigracao|vacina\w*|medic\w*|remedio\w*|sintomas?|doenca\w*|advogad\w*|processo judicial|direitos do consumidor|procon|seguro saude|alergia\w*)\b/;
const OUT_OF_SCOPE_ADVICE = union(OUT_OF_SCOPE_ADVICE_PT, EXTRA.OUT_OF_SCOPE_ADVICE);
const SAFETY_SENSITIVE_PT = /\b(?:seguro|segura|seguros|seguras|seguranca|perigos\w*|perigo|violen\w*|crime\w*|assalt\w*|roubo\w*|furto\w*|arrastao|arrastoes|favelas?|comunidades?|risco\w*|tiroteio\w*|balas? perdidas?|zona de risco)\b/;
const SAFETY_SENSITIVE = union(SAFETY_SENSITIVE_PT, EXTRA.SAFETY_SENSITIVE);
const INTERNAL_INFO_PT = /\b(?:api ?key|chave (?:da )?(?:api|openai)|token de acesso|senha do (?:sistema|servidor|admin)|variaveis? de ambiente|\.env|vector ?store|banco de dados|codigo[- ]fonte|ric studio|(?:qual|que) (?:modelo|versao|llm|ia) (?:voce )?(?:usa|e|esta usando)|(?:quais|que) fontes (?:voce )?(?:usa|tem)|lista de fontes|dados de (?:outros|outras) (?:usuarios|clientes|pessoas)|conversas? de (?:outros|outras))\b/;
const INTERNAL_INFO = union(INTERNAL_INFO_PT, EXTRA.INTERNAL_INFO);
const ABUSIVE_PT = /\b(?:idiota|burro|imbecil|lixo|merda|porra|caralho|filho da puta|fdp|vai se f[\w*]+|vsf|otario|babaca|estupid\w*|inutil)\b/;
const ABUSIVE = union(ABUSIVE_PT, EXTRA.ABUSIVE);
const COMPETITOR_PT = /\b(?:concorrent\w*|cvc|decolar|viajanet|123milhas|maxmilhas|melhor que (?:a|o) \w+|comparar com (?:a|o|outras?|outros?))\b/;
const COMPETITOR = union(COMPETITOR_PT, EXTRA.COMPETITOR);

export const detectEmergency = (message: string) => EMERGENCY.test(normalize(message));
export const detectInternalInfoRequest = (message: string) => INTERNAL_INFO.test(normalize(message));
export const detectAbuse = (message: string) => ABUSIVE.test(normalize(message));
/**
 * Questions about WHO is answering ("você é uma pessoa?", "qual é o seu nome?"). They get a fixed, honest answer (Daniela is an AI),
 * never a model-generated one: the persona's transparency must not depend on retrieval or on the model.
 */
const IDENTITY_PT = /\b(?:voce|vc) (?:e|eh|era) (?:uma? )?(?:pessoa|humana|humano|robo|bot|ia|inteligencia artificial|real|de verdade|gente|maquina)\b|\b(?:estou|to|tou|estamos) falando com (?:um |uma )?(?:pessoa|humano|humana|robo|bot|ia|maquina|alguem de verdade|atendente|inteligencia artificial)\b|\bvoce (?:e|eh) (?:da|uma da|funcionaria da|integrante da) equipe\b|\bvoce trabalha (?:na|para a|pra) ricardo tour\b|\b(?:qual|como) (?:e )?(?:o )?seu nome\b|\bcomo (?:voce|vc|a voce) se chama\b|\bcomo (?:e )?que (?:voce|vc) se chama\b|\bquem (?:e|eh) (?:voce|vc)\b|\bcomo (?:posso )?te chamar\b|\b(?:tem|ha) alguem (?:ai|real|de verdade)\b|\b(?:isso|isto|aqui|ai) (?:e|eh) (?:um |uma )?(?:robo|bot)\b|\bsera que (?:e|eh) (?:um |uma )?(?:robo|bot)\b/;
const IDENTITY = union(IDENTITY_PT, EXTRA.IDENTITY);
export const detectIdentityQuestion = (message: string) => IDENTITY.test(normalize(message));

/** A request for recommendations ("o que fazer", "first time in Rio", "qué paseos recomiendan"). Answered by the deterministic catalog recommendation. */
const RECOMMEND = union(...EXTRA.RECOMMEND);
const DETAIL_QUESTION = EXTRA.DETAIL_QUESTION;
export const detectRecommendationIntent = (message: string) => {
  const text = normalize(message);
  return RECOMMEND.test(text) && !DETAIL_QUESTION.test(text);
};

/** Inclusions, payment methods, fees, cancellation: commercial terms only the team may confirm. */
const COMMERCIAL_TERMS = union(...EXTRA.COMMERCIAL_TERMS);
export const detectCompetitorComparison = (message: string) => COMPETITOR.test(normalize(message));
/** Safety-sensitive tourism topics may be answered only with qualified, approved content; otherwise they become a handoff. */
export const isSafetySensitive = (message: string) => SAFETY_SENSITIVE.test(normalize(message));

/** Narrow safety words (no "favela"/"comunidade": those are also part of a published tour name). */
const SAFETY_QUESTION = union(
  /\b(?:seguro|segura|seguros|seguras|seguranca|perigos[oa]s?|perigo|violen\w*|crime\w*|assalt\w*|roubo\w*|furto\w*|arrastao|arrastoes|risco\w*|tiroteio\w*|balas? perdidas?|zona de risco)\b/,
  EXTRA.SAFETY_SENSITIVE,
);

export type GateDecision =
  | { kind: "dynamic"; reason: DynamicReason }
  | { kind: "handoff"; reason: HandoffReason }
  | { kind: "pass" };

// RT-71 triggers. H1 explicit human/WhatsApp request, H3 custom/group requests, H6 complaints, H8 urgent operations.
const EXPLICIT_REQUEST_PT = /\b(?:(?:falar|conversar|atendimento|contato) (?:com )?(?:uma? )?(?:pessoa|humano|humana|atendente|alguem|gente de verdade|equipe|time|consultor\w*)|(?:quero|preciso de|gostaria de) (?:um |uma )?(?:atendente|atendimento humano|humano)|atendimento humano|atendente humano|(?:me )?(?:passa|passe|manda|mande|envia|envie|qual(?: e)?) (?:o |seu |o seu )?(?:whatsapp|zap|telefone|numero de contato)|chamar (?:no )?(?:whatsapp|zap)|falar no (?:whatsapp|zap))\b/;
const EXPLICIT_REQUEST = union(EXPLICIT_REQUEST_PT, EXTRA.EXPLICIT_REQUEST);
const UNSUPPORTED_REQUEST_PT = /\b(?:roteiro (?:personalizado|sob medida|exclusivo)|passeio (?:personalizado|sob medida|exclusivo|privativo)|pacote personalizado|cotacao|orcamento|grupo (?:de|com) \d+|grupo grande|excursao|evento corporativo|casamento|pedido especial|necessidade especial|negociar|negociacao|desconto para grupo)\b/;
const UNSUPPORTED_REQUEST = union(UNSUPPORTED_REQUEST_PT, EXTRA.UNSUPPORTED_REQUEST);
const COMPLAINT_PT = /\b(?:reclama\w*|insatisf\w*|pessim[oa]|horrivel|decepcion\w*|absurdo|inaceitavel|vou processar|acao judicial|enganad[oa]|golpe|fui lesad\w*)\b/;
const COMPLAINT = union(COMPLAINT_PT, EXTRA.COMPLAINT);
const URGENT_OPERATION_PT = /\b(?:(?:guia|motorista|van|transporte) (?:nao|ainda nao) (?:chegou|apareceu|veio)|estou (?:esperando|aguardando|perdid[oa]|atrasad[oa]|no local|no ponto)|(?:perdi|perdemos) (?:o|meu|nosso|a) (?:passeio|voo|guia|van|onibus|encontro)|vou (?:me )?atrasar|onde (?:esta|fica) (?:o )?(?:guia|ponto de encontro)|em cima da hora)\b/;
const URGENT_OPERATION = union(URGENT_OPERATION_PT, EXTRA.URGENT_OPERATION);

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
  // V1: any safety question (is it safe, dangerous, risk...) goes to the team: no approved source supports an answer, and the model must not improvise one.
  if (SAFETY_QUESTION.test(text)) return { kind: "handoff", reason: "safety_sensitive" };
  if (/\boner\b/.test(text)) return { kind: "dynamic", reason: "oner_inventory" };
  if (HOTEL.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "hotel_inventory" };
  if (FLIGHT.test(text) && DYNAMIC_CUE.test(text)) return { kind: "dynamic", reason: "flight_inventory" };
  if (PRICE.test(text)) return { kind: "dynamic", reason: "price" };
  if (AVAILABILITY.test(text)) return { kind: "dynamic", reason: "availability" };
  if (COMMERCIAL_TERMS.test(text)) return { kind: "handoff", reason: "commercial_terms" };
  if (OPERATIONAL.test(text)) return { kind: "handoff", reason: "operational_confirmation" };
  return { kind: "pass" };
}
