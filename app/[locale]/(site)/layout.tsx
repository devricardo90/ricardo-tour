import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { resolveSiteChromeCopy } from "@/components/site/site-chrome-copy";
import { siteBody, siteDisplay } from "./fonts";
import "./site-theme.css";

// Public-site route group (RT-52): scoped public fonts and tokens, SiteHeader, the main slot and SiteFooter.
// It deliberately does NOT mount the legacy/mock AI widget (the real AI Concierge is separate work), and it does not
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
    </div>
  );
}
