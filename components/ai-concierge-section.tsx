import { AIConciergeShell } from "@/components/ai-concierge-shell";

// Future-capability copy only: describes intent, never an operational service (no availability,
// booking, payment or live search claims). The Home never calls /api/ai-concierge.
const copy = {
  pt: {
    heading: "Suas ideias para o Rio, organizadas.",
    body: "O AI Concierge vai ajudar você a descobrir experiências e organizar sua viagem de acordo com seus interesses.",
    shell: {
      status: "Em breve",
      examplesLabel: "Perguntas como",
      examples: ["O que fazer em um fim de semana no Rio?", "Quais experiências combinam comigo?", "Como organizar alguns dias no Rio?"],
      inputLabel: "Pergunta para o AI Concierge (em breve)",
      placeholder: "Pergunte sobre a sua viagem ao Rio",
      send: "Enviar pergunta (em breve)",
    },
  },
  en: {
    heading: "Your Rio ideas, organized.",
    body: "The AI Concierge will help you discover experiences and organize your trip around your interests.",
    shell: {
      status: "Coming soon",
      examplesLabel: "Questions like",
      examples: ["What to do on a weekend in Rio?", "Which experiences suit me?", "How to organize a few days in Rio?"],
      inputLabel: "Question for the AI Concierge (coming soon)",
      placeholder: "Ask about your Rio trip",
      send: "Send question (coming soon)",
    },
  },
  es: {
    heading: "Tus ideas para Río, organizadas.",
    body: "El AI Concierge te ayudará a descubrir experiencias y organizar tu viaje según tus intereses.",
    shell: {
      status: "Próximamente",
      examplesLabel: "Preguntas como",
      examples: ["¿Qué hacer un fin de semana en Río?", "¿Qué experiencias van conmigo?", "¿Cómo organizar unos días en Río?"],
      inputLabel: "Pregunta para el AI Concierge (próximamente)",
      placeholder: "Pregunta sobre tu viaje a Río",
      send: "Enviar pregunta (próximamente)",
    },
  },
} as const;

export function AIConciergeSection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section
      id="ai-concierge"
      aria-labelledby="ai-concierge-heading"
      className="bg-[#0B0E11] px-5 py-10 text-[#F4F0E8] md:px-10 md:py-12 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-6 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8A86B] md:text-[13px]">AI Concierge</p>
          <h2
            id="ai-concierge-heading"
            className="mt-3 text-balance text-[28px] font-medium leading-[1.05] md:text-[36px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
          <p className="mt-3 max-w-md text-[14px] leading-[1.6] text-[#CAC7BF]">{t.body}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <AIConciergeShell copy={t.shell} statusId="ai-concierge-status" />
        </div>
      </div>
    </section>
  );
}
