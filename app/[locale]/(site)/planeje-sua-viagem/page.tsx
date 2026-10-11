import type { Metadata } from "next";
import { defaultSocialImages } from "@/lib/seo/social-image";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { OnerWidget } from "@/components/site/oner/oner-widget";
import { TrackedAnchor, TrackedLink } from "@/components/site/travel-planner/tracked-link";
import { TRAVEL_PLANNER_CANONICAL, TRAVEL_PLANNER_PUBLIC_ACTIVE } from "@/lib/travel-planner/config";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

const TITLE = "Planeje sua viagem | Ricardo Tour";
const DESCRIPTION =
  "Encontre voos, hotéis, pacotes, carros e seguros para organizar sua viagem em um só lugar, com a assistência da Ricardo Tour.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "pt") return { title: TITLE, robots: { index: false, follow: false } };

  if (!TRAVEL_PLANNER_PUBLIC_ACTIVE) {
    return { title: TITLE, description: DESCRIPTION, robots: { index: false, follow: false } };
  }
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: TRAVEL_PLANNER_CANONICAL },
    openGraph: { title: TITLE, description: DESCRIPTION, url: TRAVEL_PLANNER_CANONICAL, siteName: "Ricardo Tour", images: defaultSocialImages("pt") },
    robots: { index: true, follow: true },
  };
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
const linkClass = `inline-flex min-h-11 items-center gap-2 rounded text-[15px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] transition-colors hover:text-[var(--site-gold-deep)] ${focus}`;

// Public travel-planning page (RT-91, Option C): Ricardo Tour shell -> Oner search widget (provider-owned UI) ->
// provider-hosted Ricardo Tour-branded commerce. PT only: the provider confirmed only language="pt-br".
// Travel commerce is complementary to the tours/experiences positioning, so the outer layout stays light and neutral.
export default async function TravelPlannerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "pt") notFound();

  return (
    <div className="bg-white text-[var(--site-ink)]">
      <section aria-labelledby="planner-heading" className="px-5 pb-10 pt-10 md:px-10 md:pb-14 md:pt-14 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <h1 id="planner-heading" className="site-display text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]">
            Planeje sua viagem
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-[var(--site-ink-muted)]">
            Encontre voos, hotéis, pacotes, carros e outros serviços para organizar sua viagem em um só lugar.
          </p>
          <div className="mt-8">
            <OnerWidget trackPageView="travel_planner_view" />
          </div>
        </div>
      </section>

      <section aria-labelledby="rio-heading" className="border-t border-[var(--site-rule-light)] px-5 py-12 md:px-10 lg:px-12">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="rio-heading" className="site-display text-[26px] font-medium md:text-[32px]">
              Vai para o Rio?
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">
              Complete sua viagem com experiências selecionadas pela Ricardo Tour.
            </p>
          </div>
          <TrackedLink event="rio_experiences_clicked" href="/tours" className={linkClass}>
            Ver passeios no Rio
          </TrackedLink>
        </div>
      </section>

      <section aria-labelledby="help-heading" className="border-t border-[var(--site-rule-light)] px-5 py-12 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <h2 id="help-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-deep)]">
            Prefere falar com a gente?
          </h2>
          <ul className="mt-3 space-y-1">
            <li>
              <TrackedAnchor
                event="travel_planner_handoff_clicked"
                detail="whatsapp"
                href={PUBLIC_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                WhatsApp {PUBLIC_CONTACT.whatsappDisplay}
              </TrackedAnchor>
            </li>
            <li>
              <TrackedAnchor event="travel_planner_handoff_clicked" detail="email" href={PUBLIC_CONTACT.mailto} className={linkClass}>
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {PUBLIC_CONTACT.email}
              </TrackedAnchor>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
