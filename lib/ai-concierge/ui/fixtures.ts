import { buildHandoffOffer } from "../runtime/handoff";
import { langFromLocale, type Lang } from "../runtime/lang";
import { degradedMessage, dynamicMessage, handoffMessage, recommendationMessage } from "../runtime/messages";
import { resolveTourCards } from "./tours";
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

const GROUNDED: Record<Lang, string> = {
  pt: "Que bom que você vem! Para uma primeira vez no Rio, vale começar pelos clássicos da cidade. Se quiser, posso sugerir alguns passeios publicados para você começar.",
  en: "How great that you're coming! For a first time in Rio, it's worth starting with the city's classics. If you like, I can suggest a few published tours to get you started.",
  es: "¡Qué bueno que vienes! Para una primera vez en Río, vale la pena empezar por los clásicos de la ciudad. Si quieres, puedo sugerirte algunos paseos publicados para empezar.",
};

const CRISTO = "cmlhxkpy9000028zq27rhytew";
const RECOMMENDED = [CRISTO, "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];

/** Same texts and builders as the runtime (deterministic recommendation, fixed handoff texts, contextual WhatsApp message). */
export function replyFor(id: ScenarioId, lang: Lang = "pt"): ConciergeReply {
  switch (id) {
    case "answer":
    case "slow":
      return { outcome: "ANSWER", answer: GROUNDED[lang], response_kind: "grounded" };
    case "recommendation":
      return { outcome: "ANSWER", answer: recommendationMessage(resolveTourCards(RECOMMENDED).map((tour) => tour.title), lang), response_kind: "grounded", tour_ids: RECOMMENDED };
    case "handoff_human":
      return { outcome: "HANDOFF", answer: handoffMessage("explicit_request", lang), response_kind: "handoff", handoff: buildHandoffOffer("H1", "explicit_request", { lang }) };
    case "price":
      return { outcome: "DYNAMIC_LOOKUP_REQUIRED", answer: dynamicMessage("price", lang), response_kind: "handoff", handoff: buildHandoffOffer("H9", "price", { lang, tourId: CRISTO }) };
    case "no_evidence":
      return { outcome: "INSUFFICIENT_EVIDENCE", answer: handoffMessage("insufficient_evidence", lang), response_kind: "handoff", handoff: buildHandoffOffer("H4", "insufficient_evidence", { lang }) };
    case "degraded":
      return { outcome: "UPSTREAM_ERROR", answer: degradedMessage("a1b2c3d4", lang), response_kind: "degraded", handoff: buildHandoffOffer("H5", "upstream_error", { lang }), reference_id: "a1b2c3d4" };
    case "rate_limited":
      return { outcome: "RATE_LIMITED", answer: handoffMessage("rate_limited", lang), response_kind: "degraded", handoff: buildHandoffOffer("H5", "rate_limited", { lang }), retry_after_seconds: 20 };
  }
}

export function createLabTransport(getScenario: () => ScenarioId): ConciergeTransport {
  return {
    async send({ locale }) {
      const id = getScenario();
      await new Promise((resolve) => setTimeout(resolve, id === "slow" ? 3_000 : 500));
      return replyFor(id, langFromLocale(locale) ?? "pt");
    },
  };
}
