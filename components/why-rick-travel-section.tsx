import Image from "next/image";

// Canonical approved Home copy; claims map to docs/product/ai-concierge-approved-public-business-evidence-values.md.
// Cadastur shows mark and name only: number/status/validity are not approved for website use.
const copy = {
  pt: {
    eyebrow: "POR QUE A RICK TRAVEL",
    heading: "Turismo local, com orientação humana.",
    pillars: [
      { title: "Orientação personalizada", body: "Apoio para planejar passeios e experiências de turismo local no Rio de Janeiro." },
      { title: "Turismo local no Rio", body: "Passeios guiados e experiências turísticas com foco no Rio de Janeiro." },
      { title: "Atendimento em três idiomas", body: "Português, espanhol e inglês." },
    ],
    institutional: "Referência institucional",
  },
  en: {
    eyebrow: "WHY RICK TRAVEL",
    heading: "Local tourism, with human guidance.",
    pillars: [
      { title: "Personalized orientation", body: "Support for planning local tours and tourism experiences in Rio de Janeiro." },
      { title: "Local tourism in Rio", body: "Guided tours and tourism experiences focused on Rio de Janeiro." },
      { title: "Service in three languages", body: "Portuguese, Spanish, and English." },
    ],
    institutional: "Institutional reference",
  },
  es: {
    eyebrow: "POR QUÉ RICK TRAVEL",
    heading: "Turismo local, con orientación humana.",
    pillars: [
      { title: "Orientación personalizada", body: "Apoyo para planificar paseos y experiencias de turismo local en Río de Janeiro." },
      { title: "Turismo local en Río", body: "Tours guiados y experiencias turísticas centradas en Río de Janeiro." },
      { title: "Atención en tres idiomas", body: "Portugués, español e inglés." },
    ],
    institutional: "Referencia institucional",
  },
} as const;

export function WhyRickTravelSection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section
      aria-labelledby="why-rick-travel-heading"
      className="bg-[#F3EFE6] px-5 py-20 text-[#171A1E] md:px-10 md:py-28 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-0">
        <div className="lg:col-span-5">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#53565A] md:text-[13px]">{t.eyebrow}</p>
          <h2
            id="why-rick-travel-heading"
            className="mt-4 max-w-md text-[32px] font-medium leading-[1.05] md:text-[44px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
        </div>

        <ol className="border-b border-[#CFC7BA] lg:col-span-6 lg:col-start-7 lg:row-span-2">
          {t.pillars.map((pillar, i) => (
            <li key={pillar.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-[#CFC7BA] py-6 md:py-7">
              <span aria-hidden="true" className="pt-0.5 text-[13px] font-medium tabular-nums text-[#8A6A2B]">
                0{i + 1}
              </span>
              <div>
                <h3 className="text-[16px] font-semibold leading-[1.3]">{pillar.title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-[#53565A]">{pillar.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <figure className="lg:col-span-5 lg:self-end">
          <div className="inline-flex rounded-xl bg-[#15191D] px-5 py-4">
            <Image src="/cadastro/cadastur.png" alt="Cadastur" width={490} height={110} className="h-9 w-auto md:h-10" />
          </div>
          <figcaption className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-[#53565A]">
            {t.institutional} · Cadastur
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
