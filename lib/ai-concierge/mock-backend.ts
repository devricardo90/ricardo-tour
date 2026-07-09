import type {
  AIConciergeRequest,
  AIConciergeResponse,
} from "@/lib/ai-concierge/contract";

const ANSWER_COPY = {
  pt: {
    answer:
      "Esta e uma resposta inicial simulada do AI Concierge. Posso ajudar voce a organizar duvidas sobre passeios e experiencias no Rio, mas precos, disponibilidade, pagamento e confirmacao final precisam ser tratados pela equipe Rick Travel.",
    next: [
      "Quais passeios combinam com meio dia no Rio?",
      "Quando devo falar com a equipe?",
    ],
  },
  en: {
    answer:
      "This is an initial mocked AI Concierge response. I can help organize questions about tours and experiences in Rio, but prices, availability, payment, and final confirmation must be handled by the Rick Travel team.",
    next: [
      "Which tours fit a half day in Rio?",
      "When should I talk to the team?",
    ],
  },
  es: {
    answer:
      "Esta es una respuesta inicial simulada del AI Concierge. Puedo ayudar a ordenar dudas sobre paseos y experiencias en Rio, pero precios, disponibilidad, pago y confirmacion final deben ser tratados por el equipo Rick Travel.",
    next: [
      "Que paseos funcionan para medio dia en Rio?",
      "Cuando debo hablar con el equipo?",
    ],
  },
  sv: {
    answer:
      "This is an initial mocked AI Concierge response. I can help organize questions about tours and experiences in Rio, but prices, availability, payment, and final confirmation must be handled by the Rick Travel team.",
    next: [
      "Which tours fit a half day in Rio?",
      "When should I talk to the team?",
    ],
  },
} as const;

function stableHash(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createMockAIConciergeResponse(
  request: AIConciergeRequest
): AIConciergeResponse {
  const copy = ANSWER_COPY[request.locale] ?? ANSWER_COPY.en;
  const id = `mock-${stableHash(`${request.locale}:${request.message}`)}`;

  return {
    id,
    locale: request.locale,
    answer: copy.answer,
    responseKind: "mock",
    handoffRequired: true,
    suggestedNextQuestions: [...copy.next],
    sourceRefs: [
      {
        id: "ai-concierge-ui-shell-mock-contract",
        label: "AI Concierge UI shell mock contract",
        kind: "mock_contract",
      },
    ],
    safetyFlags: [
      "mock_backend",
      "human_handoff_required",
      "no_price_confirmation",
      "no_availability_confirmation",
    ],
  };
}
