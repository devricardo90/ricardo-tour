import Image from "next/image";
import { Link } from "@/i18n/routing";

// Evidence-grounded copy only. Sources:
//  - paragraph 1: existing public "Nossa História" copy (messages AboutPage.story.paragraph1, /quem-somos).
//  - paragraph 2: approved institutional website text (docs/product/ai-concierge-approved-public-business-evidence-values.md, record 10).
//  - founder line: "Ricardo, fundador da Rick Travel" is already public (AboutPage.story.imageAlt).
// No years, client counts, awards, guide-credential or accreditation claims (guide credential is PENDING_OWNER_APPROVAL).
// Final copy polish is deferred to the Home polish pass; ES/EN are conservative translations of the PT source.
const copy = {
  pt: {
    eyebrow: "SOBRE A RICK TRAVEL",
    heading: "Por trás de cada experiência, uma pessoa.",
    paragraphs: [
      "A Rick Travel nasceu da paixão pelo Rio de Janeiro e do desejo de oferecer experiências autênticas aos visitantes.",
      "Somos uma agência focada em turismo local: conectamos viajantes a passeios guiados e experiências no Rio, unindo conhecimento prático do destino e atendimento humano.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador da Rick Travel",
    cta: "Conheça nossos passeios",
    imageAlt: "Ricardo, fundador da Rick Travel, em um mirante com a Baía de Guanabara e o Pão de Açúcar ao fundo.",
  },
  en: {
    eyebrow: "ABOUT RICK TRAVEL",
    heading: "Behind every experience, a person.",
    paragraphs: [
      "Rick Travel was born from a passion for Rio de Janeiro and the desire to offer authentic experiences to visitors.",
      "We are a travel agency focused on local tourism: we connect travelers with guided tours and experiences in Rio, combining practical knowledge of the destination with human service.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Founder of Rick Travel",
    cta: "Explore our experiences",
    imageAlt: "Ricardo, founder of Rick Travel, at a viewpoint with Guanabara Bay and Sugarloaf Mountain behind him.",
  },
  es: {
    eyebrow: "SOBRE RICK TRAVEL",
    heading: "Detrás de cada experiencia, una persona.",
    paragraphs: [
      "Rick Travel nació de la pasión por Río de Janeiro y del deseo de ofrecer experiencias auténticas a los visitantes.",
      "Somos una agencia enfocada en turismo local: conectamos a los viajeros con tours guiados y experiencias en Río, uniendo conocimiento práctico del destino y atención humana.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador de Rick Travel",
    cta: "Conoce nuestras experiencias",
    imageAlt: "Ricardo, fundador de Rick Travel, en un mirador con la Bahía de Guanabara y el Pan de Azúcar al fondo.",
  },
} as const;

export function AboutRickTravelSection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section
      aria-labelledby="about-rick-travel-heading"
      className="bg-[#FBF8F2] px-5 py-16 text-[#171A1E] md:px-10 md:py-24 lg:px-12"
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
        <div className="mx-auto w-full max-w-[420px] md:col-span-5 md:max-w-none">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#E6DFD2]">
            <Image
              src="/images/about/ricardo-guia-home.webp"
              alt={t.imageAlt}
              fill
              loading="lazy"
              sizes="(min-width: 1280px) 500px, (min-width: 768px) 40vw, 420px"
              className="object-cover object-[50%_20%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
            />
          </div>
        </div>

        <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#53565A] md:text-[13px]">{t.eyebrow}</p>
          <h2
            id="about-rick-travel-heading"
            className="mt-4 text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
          <div className="mt-6 max-w-[52ch] space-y-4 text-[16px] leading-[1.7] text-[#3F4247]">
            {t.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4 border-t border-[#CFC7BA] pt-5">
            <span aria-hidden="true" className="h-px w-8 bg-[#8A6A2B]" />
            <p className="text-[14px] leading-[1.4]">
              <span className="font-semibold">{t.signatureName}</span>
              <span className="text-[#53565A]"> · {t.signatureRole}</span>
            </p>
          </div>

          <Link
            href="/tours"
            className="mt-6 inline-block text-[14px] font-medium text-[#171A1E] underline decoration-[#8A6A2B] underline-offset-[6px] transition-colors hover:text-[#8A6A2B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8A6A2B]"
          >
            {t.cta} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
