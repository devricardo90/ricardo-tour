import { buildHandoffOffer } from "../runtime/handoff";
import { degradedMessage, dynamicMessage, handoffMessage } from "../runtime/messages";
import type { ConciergeReply, ConciergeTransport } from "./types";

/**
 * Deterministic scenarios for the rebuild-lab prototype. They reuse the REAL fixed customer texts and the REAL handoff
 * builder from the runtime, so what a reviewer sees is what the runtime would produce. The lab transport never calls
 * the API, a model or any network.
 */
export type ScenarioId = "answer" | "recommendation" | "handoff_human" | "price" | "no_evidence" | "degraded" | "rate_limited" | "slow";

export const SCENARIOS: Array<{ id: ScenarioId; label: string; description: string }> = [
  { id: "answer", label: "Resposta fundamentada", description: "Resposta curta baseada em fontes aprovadas" },
  { id: "recommendation", label: "Recomendação de passeios", description: "Sugestões do catálogo publicado, com links oficiais, sem preço nem disponibilidade" },
  { id: "handoff_human", label: "Pedido de atendimento humano (H1)", description: "Oferta de WhatsApp e e-mail, sem transferência" },
  { id: "price", label: "Preço (H9)", description: "Sem preço no chat; orienta a página do passeio ou a equipe" },
  { id: "no_evidence", label: "Sem informação confirmada (H4)", description: "Admite o limite e oferece a equipe" },
  { id: "degraded", label: "Indisponível (H5)", description: "Estado degradado: campo desativado, canais visíveis" },
  { id: "rate_limited", label: "Limite atingido (H5)", description: "Contagem regressiva e canais da equipe" },
  { id: "slow", label: "Resposta lenta (3 s)", description: "Mostra o estado de carregamento" },
];

const GROUNDED =
  "Que bom que você vem! Para uma primeira vez no Rio, vale começar pelos clássicos da cidade. Se quiser, posso sugerir alguns passeios publicados para você começar.";

// Illustrative recommendation in the shape the approved recommendation policy allows: published tours only (shown as cards from the
// closed allow-list), no price, no duration, no availability.
const RECOMMENDATION =
  "Para uma primeira viagem ao Rio, três passeios publicados costumam ser um bom começo: Cristo Redentor + Pão de Açúcar, Confeitaria Colombo + City Tour Rio e Tour Privado Premium Rio de Janeiro. Preços, datas e disponibilidade ficam na página de cada passeio ou com a nossa equipe.";

export function replyFor(id: ScenarioId): ConciergeReply {
  switch (id) {
    case "answer":
    case "slow":
      return { outcome: "ANSWER", answer: GROUNDED, response_kind: "grounded" };
    case "recommendation":
      return { outcome: "ANSWER", answer: RECOMMENDATION, response_kind: "grounded", tour_ids: ["cmlhxkpy9000028zq27rhytew", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"] };
    case "handoff_human":
      return { outcome: "HANDOFF", answer: handoffMessage("explicit_request"), response_kind: "handoff", handoff: buildHandoffOffer("H1", "explicit_request") };
    case "price":
      return { outcome: "DYNAMIC_LOOKUP_REQUIRED", answer: dynamicMessage("price"), response_kind: "handoff", handoff: buildHandoffOffer("H9", "price") };
    case "no_evidence":
      return { outcome: "INSUFFICIENT_EVIDENCE", answer: handoffMessage("insufficient_evidence"), response_kind: "handoff", handoff: buildHandoffOffer("H4", "insufficient_evidence") };
    case "degraded":
      return { outcome: "UPSTREAM_ERROR", answer: degradedMessage("a1b2c3d4"), response_kind: "degraded", handoff: buildHandoffOffer("H5", "upstream_error"), reference_id: "a1b2c3d4" };
    case "rate_limited":
      return { outcome: "RATE_LIMITED", answer: handoffMessage("rate_limited"), response_kind: "degraded", handoff: buildHandoffOffer("H5", "rate_limited"), retry_after_seconds: 20 };
  }
}

export function createLabTransport(getScenario: () => ScenarioId): ConciergeTransport {
  return {
    async send() {
      const id = getScenario();
      await new Promise((resolve) => setTimeout(resolve, id === "slow" ? 3_000 : 500));
      return replyFor(id);
    },
  };
}
