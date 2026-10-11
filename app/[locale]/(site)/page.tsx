import type { Metadata } from "next";
import { defaultSocialImages } from "@/lib/seo/social-image";
import GlobeJourney from "@/components/home/hero/globe-journey";
import { ExperiencesInRioSection } from "@/components/experiences-in-rio-section";
import { WhyRickTravelSection } from "@/components/why-rick-travel-section";
import { RioStorySection } from "@/components/rio-story-section";
import { AboutRickTravelSection } from "@/components/about-rick-travel-section";
import { HomeHashScroll } from "@/components/home/home-hash-scroll";
import { getLanguageAlternates } from "@/i18n/routing";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { buildOrganizationJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";

const HOME_META: Record<string, { title: string; description: string }> = {
  pt: {
    title: "Ricardo Tour | Passeios guiados no Rio de Janeiro",
    description: "Passeios guiados e experiências no Rio de Janeiro com a Ricardo Tour. Conheça os roteiros e fale direto com o Ricardo.",
  },
  en: {
    title: "Ricardo Tour | Guided tours in Rio de Janeiro",
    description: "Guided tours and experiences in Rio de Janeiro with Ricardo Tour. Explore the itineraries and talk directly with Ricardo.",
  },
  es: {
    title: "Ricardo Tour | Tours guiados en Río de Janeiro",
    description: "Tours guiados y experiencias en Río de Janeiro con Ricardo Tour. Conoce los itinerarios y habla directamente con Ricardo.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = HOME_META[locale] ?? HOME_META.pt;
  const path = `/${locale}`;
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: path, languages: getLanguageAlternates() },
    openGraph: { title: t.title, description: t.description, url: `${PUBLIC_SITE_URL}${path}`, siteName: "Ricardo Tour", type: "website", images: defaultSocialImages(locale) },
    twitter: { card: "summary_large_image", title: t.title, description: t.description, images: defaultSocialImages(locale).map((i) => i.url) },
  };
}

// Public Home (RT-57): the rebuilt Home promoted from the Rebuild Lab. Header and footer come from the (site) layout
// (exactly one SiteHeader/SiteFooter); this page only composes the sections in the approved order:
// Hero -> Plan your trip (inside the Hero module) -> Experiences -> Why Ricardo Tour -> Rio Story -> About.
// Owner decision 2026-10-11: no dedicated AI Concierge section; Daniela lives in the side panel (menu item opens it). Nothing here depends on REBUILD_LAB_ENABLED.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const description = (HOME_META[locale] ?? HOME_META.pt).description;
  return (
    <div id="top-of-home" className="[&_section[id]]:scroll-mt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildOrganizationJsonLd(PUBLIC_SITE_URL, description)) }} />
      <HomeHashScroll />
      <GlobeJourney locale={locale} />
      <ExperiencesInRioSection locale={locale} />
      <WhyRickTravelSection locale={locale} />
      <RioStorySection locale={locale} />
      <AboutRickTravelSection locale={locale} />
    </div>
  );
}
