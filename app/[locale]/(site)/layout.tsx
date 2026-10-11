import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { resolveSiteChromeCopy } from "@/components/site/site-chrome-copy";
import { ConciergeMount } from "@/components/ai-concierge/concierge-mount";
import { isConciergeEnabled } from "@/lib/ai-concierge/launch";
import { siteBody, siteDisplay } from "./fonts";
import "./site-theme.css";

// Public-site route group (RT-52): scoped public fonts and tokens, SiteHeader, the main slot and SiteFooter.
// The legacy/mock AI widget is never mounted here; Daniela (the real AI Concierge) is mounted only behind the launch guard. It does not
// replace the (public) group yet: RT-53/54/56/57 move routes here one at a time.
export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = resolveSiteChromeCopy(locale);

  return (
    <div className={`site-theme ${siteDisplay.variable} ${siteBody.variable}`}>
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[60] -translate-y-[200%] rounded-md bg-[var(--site-cream-soft)] px-4 py-2 text-[14px] font-medium text-[var(--site-ink)] shadow-md transition-transform focus:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--site-focus)]"
      >
        {t.skip}
      </a>
      <SiteHeader locale={locale} anchorMode="home" />
      <main id="main-content">{children}</main>
      <SiteFooter locale={locale} anchorMode="home" />
      {/* Daniela V1 (AI Concierge): rendered only when the launch guard allows it; OFF by default and blocked in production until every mandatory criterion is met. */}
      {isConciergeEnabled() ? <ConciergeMount locale={locale} /> : null}
    </div>
  );
}
