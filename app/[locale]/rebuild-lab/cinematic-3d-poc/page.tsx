import type { Metadata } from "next";
import localFont from "next/font/local";
import GlobeJourney from "./globe-journey";
import { ExperiencesInRioSection } from "@/components/experiences-in-rio-section";
import { WhyRickTravelSection } from "@/components/why-rick-travel-section";
import { RioStorySection } from "@/components/rio-story-section";
import { AIConciergeSection } from "@/components/ai-concierge-section";
import { AboutRickTravelSection } from "@/components/about-rick-travel-section";
import { HomeHeader } from "@/components/home-header";
import { HomeFooter } from "@/components/home-footer";

const display = localFont({
  src: "../../../fonts/cormorant-garamond/latin.woff2",
  variable: "--journey-display", weight: "300 700", display: "swap",
});
const body = localFont({
  src: "../../../fonts/inter/latin.woff2",
  variable: "--journey-body", weight: "100 900", display: "swap",
});

export const metadata: Metadata = {
  title: "RT-17 · 3D POC — Rick Travel",
  robots: { index: false, follow: false },
};

// Logo/home link target: the top of the rebuilt Home until it replaces the public Home.
const HOME_HREF = "#top-of-home";

export default async function GlobePocPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div id="top-of-home" className={`${display.variable} ${body.variable} [&_section[id]]:scroll-mt-16`}>
      <HomeHeader locale={locale} homeHref={HOME_HREF} />
      <GlobeJourney locale={locale} />
      <ExperiencesInRioSection locale={locale} />
      <WhyRickTravelSection locale={locale} />
      <RioStorySection locale={locale} />
      <AIConciergeSection locale={locale} />
      <AboutRickTravelSection locale={locale} />
      <HomeFooter locale={locale} homeHref={HOME_HREF} />
    </div>
  );
}
