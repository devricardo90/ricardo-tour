import type { Metadata } from "next";
import localFont from "next/font/local";
import ConciergePanelLab from "./lab";

const display = localFont({
  src: "../../../../docs/baseline/rt-home-design-approved/preview/rt-11-typography-proposal/assets/fonts/cormorant-garamond/latin.woff2",
  variable: "--journey-display",
  weight: "300 700",
  display: "swap",
});
const body = localFont({
  src: "../../../../docs/baseline/rt-home-design-approved/preview/rt-11-typography-proposal/assets/fonts/inter/latin.woff2",
  variable: "--journey-body",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RT-71/RT-74 · Concierge Panel Lab — Ricardo Tour",
  robots: { index: false, follow: false },
};

/** Rebuild-lab prototype (production-hidden by the lab layout). Uses a deterministic fake transport: no API, no model. */
export default async function ConciergePanelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <ConciergePanelLab locale={locale} />
    </div>
  );
}
