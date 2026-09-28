// Canonical approved Home copy; claims map to docs/product/ai-concierge-approved-public-business-evidence-values.md.
// Institutional marks are owner-authorized for display only: no partner/endorsement/certification wording,
// and Cadastur carries no number/status/validity (not approved for website use).
const copy = {
  pt: {
    eyebrow: "POR QUE A RICK TRAVEL",
    heading: "Turismo local, com orientação humana.",
    intro: "Passeios guiados, orientação personalizada e atendimento em português, espanhol e inglês.",
    pillars: [
      { title: "Orientação personalizada", body: "Apoio para planejar passeios e experiências de turismo local no Rio de Janeiro." },
      { title: "Turismo local no Rio", body: "Passeios guiados e experiências turísticas com foco no Rio de Janeiro." },
      { title: "Atendimento em três idiomas", body: "Português, espanhol e inglês." },
    ],
    institutional: "Referências institucionais",
  },
  en: {
    eyebrow: "WHY RICK TRAVEL",
    heading: "Local tourism, with human guidance.",
    intro: "Guided tours, personalized travel orientation, and service in Portuguese, Spanish, and English.",
    pillars: [
      { title: "Personalized orientation", body: "Support for planning local tours and tourism experiences in Rio de Janeiro." },
      { title: "Local tourism in Rio", body: "Guided tours and tourism experiences focused on Rio de Janeiro." },
      { title: "Service in three languages", body: "Portuguese, Spanish, and English." },
    ],
    institutional: "Institutional references",
  },
  es: {
    eyebrow: "POR QUÉ RICK TRAVEL",
    heading: "Turismo local, con orientación humana.",
    intro: "Tours guiados, orientación personalizada y atención en portugués, español e inglés.",
    pillars: [
      { title: "Orientación personalizada", body: "Apoyo para planificar paseos y experiencias de turismo local en Río de Janeiro." },
      { title: "Turismo local en Río", body: "Tours guiados y experiencias turísticas centradas en Río de Janeiro." },
      { title: "Atención en tres idiomas", body: "Portugués, español e inglés." },
    ],
    institutional: "Referencias institucionales",
  },
} as const;

// viewBoxes frame each mark inside the unmodified composite (same framing as the approved RT-12/13 preview);
// Cadastur is uniformly enlarged because its frame is short, which made its wordmark the smallest.
const MARKS_SRC = "/logos/logo-turismo.webp";
const marks = [
  { name: "Cadastur", box: [0, 30, 255, 62], boost: 1.3 },
  { name: "ABAV", box: [325, 8, 168, 107], boost: 1 },
  { name: "TripAdvisor", box: [565, 11, 145, 100], boost: 1 },
  { name: "Visit Rio", box: [779, 10, 297, 101], boost: 1 },
  { name: "Visit Brasil", box: [1149, 0, 175, 122], boost: 1 },
] as const;

export function WhyRickTravelSection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section
      aria-labelledby="why-rick-travel-heading"
      className="bg-[#F3EFE6] px-5 py-16 text-[#171A1E] md:px-10 md:py-20 lg:px-12"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
          <div className="lg:col-span-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#53565A] md:text-[13px]">{t.eyebrow}</p>
            <h2
              id="why-rick-travel-heading"
              className="mt-4 text-balance text-[32px] font-medium leading-[1.05] md:text-[44px]"
              style={{ fontFamily: "var(--journey-display), serif" }}
            >
              {t.heading}
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-[1.6] text-[#53565A] lg:col-span-5 lg:col-start-8">{t.intro}</p>
        </div>

        <ol className="mt-10 grid border-t border-[#CFC7BA] md:mt-12 md:grid-cols-3">
          {t.pillars.map((pillar, i) => (
            <li
              key={pillar.title}
              className="grid grid-cols-[2rem_1fr] gap-x-3 py-5 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[#CFC7BA] md:py-6 md:pr-8 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-8 md:[&:not(:last-child)]:border-b-0"
            >
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

        <div className="flex flex-col gap-5 border-t border-[#CFC7BA] pt-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <p id="why-rick-travel-references" className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-[#53565A]">
            {t.institutional}
          </p>
          <ul
            aria-labelledby="why-rick-travel-references"
            className="flex flex-wrap items-center gap-x-8 gap-y-5 [--mark-scale:0.4] md:gap-x-10 md:[--mark-scale:0.44]"
          >
            {marks.map(({ name, box: [x, y, w, h], boost }) => (
              <li key={name}>
                <svg
                  role="img"
                  aria-label={name}
                  viewBox={`${x} ${y} ${w} ${h}`}
                  className="block"
                  style={{ width: `calc(${w * boost}px * var(--mark-scale))`, height: `calc(${h * boost}px * var(--mark-scale))` }}
                >
                  <title>{name}</title>
                  <image href={MARKS_SRC} width={1324} height={122} />
                </svg>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
