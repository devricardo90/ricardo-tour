import { AboutPortrait } from "@/components/about-portrait";
import { Link } from "@/i18n/routing";

// Evidence-grounded copy only. Sources:
//  - paragraph 1: existing public "Nossa História" copy (messages AboutPage.story.paragraph1, /quem-somos).
//  - paragraph 2: approved institutional website text (docs/product/ai-concierge-approved-public-business-evidence-values.md, record 10).
//  - founder line: "Ricardo, fundador da Ricardo Tour" is already public (AboutPage.story.imageAlt).
// No years, client counts, awards, guide-credential or accreditation claims (guide credential is PENDING_OWNER_APPROVAL).
// Final copy polish is deferred to the Home polish pass; ES/EN are conservative translations of the PT source.
const copy = {
  pt: {
    eyebrow: "SOBRE A RICARDO TOUR",
    heading: "Por trás de cada experiência, uma pessoa.",
    paragraphs: [
      "A Ricardo Tour nasceu da paixão pelo Rio de Janeiro e do desejo de oferecer experiências autênticas aos visitantes.",
      "Somos uma agência focada em turismo local: conectamos viajantes a passeios guiados e experiências no Rio, unindo conhecimento prático do destino e atendimento humano.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador da Ricardo Tour",
    cta: "Conheça nossos passeios",
    imageAlt: "Ricardo, fundador da Ricardo Tour, em um mirante com a Baía de Guanabara e o Pão de Açúcar ao fundo.",
  },
  en: {
    eyebrow: "ABOUT RICARDO TOUR",
    heading: "Behind every experience, a person.",
    paragraphs: [
      "Ricardo Tour was born from a passion for Rio de Janeiro and the desire to offer authentic experiences to visitors.",
      "We are a travel agency focused on local tourism: we connect travelers with guided tours and experiences in Rio, combining practical knowledge of the destination with human service.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Founder of Ricardo Tour",
    cta: "Explore our experiences",
    imageAlt: "Ricardo, founder of Ricardo Tour, at a viewpoint with Guanabara Bay and Sugarloaf Mountain behind him.",
  },
  es: {
    eyebrow: "SOBRE RICARDO TOUR",
    heading: "Detrás de cada experiencia, una persona.",
    paragraphs: [
      "Ricardo Tour nació de la pasión por Río de Janeiro y del deseo de ofrecer experiencias auténticas a los visitantes.",
      "Somos una agencia enfocada en turismo local: conectamos a los viajeros con tours guiados y experiencias en Río, uniendo conocimiento práctico del destino y atención humana.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador de Ricardo Tour",
    cta: "Conoce nuestras experiencias",
    imageAlt: "Ricardo, fundador de Ricardo Tour, en un mirador con la Bahía de Guanabara y el Pan de Azúcar al fondo.",
  },
} as const;

export function AboutRickTravelSection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section
      id="about-rick-travel"
      aria-labelledby="about-rick-travel-heading"
      className="bg-[#FBF8F2] px-5 py-10 text-[#171A1E] md:px-10 md:py-12 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-5 md:grid-cols-12 md:gap-8 lg:gap-12">
        <div className="md:col-span-5">
          <AboutPortrait src="/images/about/ricardo-guia-home.webp" alt={t.imageAlt} />
        </div>

        <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#53565A] md:text-[13px]">{t.eyebrow}</p>
          <h2
            id="about-rick-travel-heading"
            className="mt-3 text-balance text-[28px] font-medium leading-[1.05] md:text-[36px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
          <div className="mt-4 max-w-[54ch] space-y-3 text-[15px] leading-[1.6] text-[#3F4247]">
            {t.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[#CFC7BA] pt-4">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-6 bg-[#8A6A2B]" />
              <p className="text-[14px] leading-[1.4]">
                <span className="font-semibold">{t.signatureName}</span>
                <span className="text-[#53565A]"> · {t.signatureRole}</span>
              </p>
            </div>
            <Link
              href="/tours"
              className="inline-block text-[14px] font-medium text-[#171A1E] underline decoration-[#8A6A2B] underline-offset-[6px] transition-colors hover:text-[#8A6A2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A6A2B]"
            >
              {t.cta} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
