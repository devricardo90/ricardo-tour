import { RickTravelLogo } from "@/components/rick-travel-logo";
import { HomeLanguageNav, HomeMobileMenu } from "@/components/home-header-controls";
import { navAnchors, PLAN_ANCHOR, resolveChromeCopy } from "@/components/home-chrome-copy";

// Rebuilt Home header (RT-35): compact charcoal bar, server-rendered; only the mobile disclosure and the
// language links are client islands. It is sticky (not fixed) so it never overlaps the Hero's own top area
// while at rest, and it covers the Hero's pinned top strip only while the Hero is scrolling.
// Every link is an in-page anchor that exists on the rebuilt Home; the CTA scrolls to Plan your trip.
export function HomeHeader({ locale, homeHref }: { locale: string; homeHref: string }) {
  const t = resolveChromeCopy(locale);
  const items = [
    { label: t.nav.experiences, href: navAnchors.experiences },
    { label: t.nav.rio, href: navAnchors.rio },
    { label: t.nav.concierge, href: navAnchors.concierge },
    { label: t.nav.about, href: navAnchors.about },
  ] as const;

  return (
    <header role="banner" className="sticky top-0 z-50 border-b border-[#C8A86B]/25 bg-[#0B0E11] text-[#F4F0E8]">
      <div className="px-5 md:px-10 lg:px-12">
        <div className="relative mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 md:h-16">
          <a
            href={homeHref}
            aria-label={t.logoAria}
            className="flex shrink-0 items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8C780]"
          >
            <RickTravelLogo variant="full" size="sm" className="h-8 md:h-9" />
          </a>
  
          <nav aria-label={t.nav.label} className="hidden lg:block">
            <ul className="flex items-center gap-8 text-[14px]">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="rounded py-2 text-[#CAC7BF] transition-colors hover:text-[#F4F0E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8C780]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
  
          <div className="flex items-center gap-2 md:gap-3">
            <HomeLanguageNav locale={locale} label={t.language.label} className="hidden lg:flex" />
            <a
              href={PLAN_ANCHOR}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-md border border-[#C8A86B] px-3 text-[13px] font-medium text-[#E8C780] transition-colors hover:bg-[#C8A86B]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8C780] md:px-4 md:text-[14px]"
            >
              {t.cta}
            </a>
            <HomeMobileMenu
              items={items}
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
