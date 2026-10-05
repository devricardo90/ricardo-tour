import Image from "next/image";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { RickTravelLogo } from "@/components/rick-travel-logo";
import { SiteAnchor, SiteHomeLink } from "@/components/site/site-anchor";
import { navHashes, resolveSiteChromeCopy, type AnchorMode } from "@/components/site/site-chrome-copy";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

// Public-site footer (RT-52, generalized from the RT-35 Home footer): charcoal closing band.
// Verified destinations only: Home section links, the /contato route, the canonical email and WhatsApp from
// lib/public-contact.ts, the approved Instagram profile and the individual Cadastur mark (no number/status).
// No legal links (no real Privacy/Terms routes yet) and no account links.
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-focus,#E8C780)]";
const linkClass = `inline-flex min-h-8 items-center rounded text-[14px] text-[var(--site-on-dark-muted,#CAC7BF)] transition-colors hover:text-[var(--site-gold-bright,#E8C780)] ${focusRing}`;
const headingClass = "text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold,#C8A86B)]";

export function SiteFooter({ locale, anchorMode = "home", homeHref = "#top-of-home" }: { locale: string; anchorMode?: AnchorMode; homeHref?: string }) {
  const t = resolveSiteChromeCopy(locale);
  const f = t.footer;
  const links: { label: string; hash: string; href?: string | null }[] = [
    { label: t.nav.experiences, hash: navHashes.experiences },
    { label: f.plan, hash: navHashes.plan, href: t.planPath },
    { label: t.nav.concierge, hash: navHashes.concierge },
    { label: t.nav.rio, hash: navHashes.rio },
    { label: t.nav.about, hash: navHashes.about },
  ];
  const logoClass = `inline-block rounded ${focusRing} focus-visible:outline-offset-4`;

  return (
    <footer role="contentinfo" className="border-t border-[var(--site-gold,#C8A86B)]/25 bg-[var(--site-charcoal,#0B0E11)] px-5 pb-5 pt-8 text-[var(--site-on-dark,#F4F0E8)] md:px-10 md:pt-10 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-5 md:grid-cols-12 md:gap-8 lg:gap-10">
          <div className="md:col-span-4 lg:col-span-5">
            <SiteHomeLink mode={anchorMode} homeHref={homeHref} aria-label={t.logoAria} className={logoClass}>
              <RickTravelLogo variant="full" size="sm" className="h-10" />
            </SiteHomeLink>
            <p className="mt-3 max-w-[34ch] text-[14px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{f.description}</p>
          </div>

          <nav aria-labelledby="site-footer-nav-title" className="md:col-span-3 lg:col-start-6">
            <h2 id="site-footer-nav-title" className={headingClass}>{f.navTitle}</h2>
            <ul className="mt-2 grid grid-cols-2 md:mt-3 md:flex md:flex-col">
              {links.map((link) => (
                <li key={link.hash}>
                  {link.href ? (
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  ) : (
                    <SiteAnchor hash={link.hash} mode={anchorMode} className={linkClass}>{link.label}</SiteAnchor>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-5 lg:col-span-4">
            <h2 className={headingClass}>{f.contactTitle}</h2>
            <ul className="mt-2 grid grid-cols-1 min-[420px]:grid-cols-2 md:mt-3 md:flex md:flex-col">
              <li>
                <Link href="/contato" className={linkClass}>{f.contactForm}</Link>
              </li>
              <li>
                <a href={PUBLIC_CONTACT.mailto} aria-label={f.emailAria} className={`${linkClass} gap-2`}>
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {PUBLIC_CONTACT.email}
                </a>
              </li>
              <li>
                <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={f.whatsappAria} className={`${linkClass} gap-2`}>
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {f.whatsappLabel} {PUBLIC_CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={PUBLIC_CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={f.instagramAria} className={`${linkClass} gap-2`}>
                  <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {f.instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="flex items-center gap-4">
            <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--site-on-dark-subtle,#9DA3A5)]">{f.institutionalTitle}</p>
            <Image src="/cadastro/cadastur.png" alt="Cadastur" width={490} height={110} loading="lazy" className="h-7 w-auto shrink-0" />
          </div>
          <p className="text-[13px] text-[var(--site-on-dark-subtle,#9DA3A5)]">
            &copy; {new Date().getFullYear()} Rick Travel · {f.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
