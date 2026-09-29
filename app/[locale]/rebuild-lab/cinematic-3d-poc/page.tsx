import type { Metadata } from "next";
import localFont from "next/font/local";
import GlobeJourney from "./globe-journey";
import { ExperiencesInRioSection } from "@/components/experiences-in-rio-section";
import { WhyRickTravelSection } from "@/components/why-rick-travel-section";
import { RioStorySection } from "@/components/rio-story-section";

const display = localFont({
  src: "../../../../docs/baseline/rt-home-design-approved/preview/rt-11-typography-proposal/assets/fonts/cormorant-garamond/latin.woff2",
  variable: "--journey-display", weight: "300 700", display: "swap",
});
const body = localFont({
  src: "../../../../docs/baseline/rt-home-design-approved/preview/rt-11-typography-proposal/assets/fonts/inter/latin.woff2",
  variable: "--journey-body", weight: "100 900", display: "swap",
});

export const metadata: Metadata = {
  title: "RT-17 · 3D POC — Rick Travel",
  robots: { index: false, follow: false },
};

export default async function GlobePocPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <GlobeJourney locale={locale} />
      <ExperiencesInRioSection locale={locale} />
      <WhyRickTravelSection locale={locale} />
      <RioStorySection locale={locale} />
    </div>
  );
}
