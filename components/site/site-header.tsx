import { RickTravelLogo } from "@/components/rick-travel-logo";
import { SiteLanguageNav, SiteMobileMenu } from "@/components/site/site-header-controls";
import { SiteAnchor, SiteHomeLink } from "@/components/site/site-anchor";
import { navHashes, PLAN_HASH, resolveSiteChromeCopy, type AnchorMode } from "@/components/site/site-chrome-copy";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--site-focus,#E8C780)]";

// Public-site header (RT-52, generalized from the RT-35 Home header): compact sticky charcoal bar, server-rendered;
// only the mobile disclosure and the language links are client islands. Four primary destinations, the "Plan your
// trip" CTA and PT/EN/ES links. No account entry, no Contato link, no SV control.
//  - anchorMode "page": always in-page hashes (logo goes to `homeHref`, default #top-of-home).
//  - anchorMode "home": the default used by the (site) layout (RT-57): links resolve per route at render time, so on
//    the Home they are in-page hashes and on any other route locale-aware links to `/{locale}#section`.
export function SiteHeader({ locale, anchorMode = "home", homeHref = "#top-of-home" }: { locale: string; anchorMode?: AnchorMode; homeHref?: string }) {
  const t = resolveSiteChromeCopy(locale);
  const items = [
    { label: t.nav.experiences, hash: navHashes.experiences },
    { label: t.nav.rio, hash: navHashes.rio },
    { label: t.nav.concierge, hash: navHashes.concierge },
    { label: t.nav.about, hash: navHashes.about },
  ] as const;
  const logoClass = `flex shrink-0 items-center rounded ${focusRing} focus-visible:outline-offset-4`;

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-[var(--site-gold,#C8A86B)]/25 bg-[var(--site-charcoal,#0B0E11)] text-[var(--site-on-dark,#F4F0E8)]">
      <div className="px-5 md:px-10 lg:px-12">
        <div className="relative mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 md:h-16">
          <SiteHomeLink mode={anchorMode} homeHref={homeHref} aria-label={t.logoAria} className={logoClass}>
            <RickTravelLogo variant="full" size="sm" className="h-8 md:h-9" />
          </SiteHomeLink>

          <nav aria-label={t.nav.label} className="hidden lg:block">
            <ul className="flex items-center gap-8 text-[14px]">
              {items.map((item) => (
                <li key={item.hash}>
                  <SiteAnchor
                    hash={item.hash}
                    mode={anchorMode}
                    className={`rounded py-2 text-[var(--site-on-dark-muted,#CAC7BF)] transition-colors hover:text-[var(--site-on-dark,#F4F0E8)] ${focusRing} focus-visible:outline-offset-4`}
                  >
                    {item.label}
                  </SiteAnchor>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <SiteLanguageNav locale={locale} label={t.language.label} className="hidden lg:flex" />
            <SiteAnchor
              hash={PLAN_HASH}
              mode={anchorMode}
              className={`inline-flex h-10 items-center whitespace-nowrap rounded-md border border-[var(--site-gold,#C8A86B)] px-3 text-[13px] font-medium text-[var(--site-gold-bright,#E8C780)] transition-colors hover:bg-[var(--site-gold,#C8A86B)]/10 ${focusRing} focus-visible:outline-offset-2 md:px-4 md:text-[14px]`}
            >
              {t.cta}
            </SiteAnchor>
            <SiteMobileMenu
              items={items}
              anchorMode={anchorMode}
              navLabel={t.nav.label}
              openLabel={t.menu.open}
              closeLabel={t.menu.close}
              locale={locale}
              languageLabel={t.language.label}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
