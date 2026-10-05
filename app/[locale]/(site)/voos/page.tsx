import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { TrackedLink } from "@/components/site/travel-planner/tracked-link";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

// /{locale}/voos after RT-91. PT never reaches this page (308 to /pt/planeje-sua-viagem in next.config.ts).
// EN/ES used to render the RT-38 Flight Planner prototype, which runs on MOCK data and must not look like live
// inventory. Until Oner confirms EN/ES widget localization, they show a notice that points to the PT travel planner.
// RT-38 code (components/site/flights/*, lib/flights/*) is preserved in the repo but intentionally not rendered here.
// noindex, not in the sitemap, no Oner language codes invented.
const copy = {
  en: {
    title: "Plan your trip | Ricardo Tour",
    heading: "Plan your trip",
    body: "Our live travel search, with flights, hotels, packages, cars and more, is currently available in Portuguese only.",
    cta: "Open the travel planner (Portuguese)",
    help: "Prefer to talk to us? We can help you in English:",
  },
  es: {
    title: "Planifica tu viaje | Ricardo Tour",
    heading: "Planifica tu viaje",
    body: "Nuestro buscador de viajes en vivo, con vuelos, hoteles, paquetes, autos y más, está disponible por ahora solo en portugués.",
    cta: "Abrir el planificador de viajes (portugués)",
    help: "¿Prefieres hablar con nosotros? Te ayudamos en español:",
  },
} as const;

function resolve(locale: string) {
  return locale === "es" ? copy.es : copy.en;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: resolve(locale).title, robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
const linkClass = `inline-flex min-h-11 items-center gap-2 rounded text-[15px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] transition-colors hover:text-[var(--site-gold-deep)] ${focus}`;

export default async function FlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = resolve(locale);

  return (
    <div className="bg-white text-[var(--site-ink)]">
      <section aria-labelledby="voos-notice-heading" className="px-5 pb-16 pt-10 md:px-10 md:pb-24 md:pt-14 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <h1 id="voos-notice-heading" className="site-display text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]">
            {t.heading}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-[var(--site-ink-muted)]">{t.body}</p>
          <div className="mt-6">
            <TrackedLink event="travel_planner_handoff_clicked" detail="locale-notice-to-pt" href="/planeje-sua-viagem" locale="pt" className={linkClass}>
              {t.cta}
            </TrackedLink>
          </div>
          <p className="mt-10 text-[15px] text-[var(--site-ink-muted)]">{t.help}</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                WhatsApp {PUBLIC_CONTACT.whatsappDisplay}
              </a>
            </li>
            <li>
              <a href={PUBLIC_CONTACT.mailto} className={linkClass}>
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {PUBLIC_CONTACT.email}
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
