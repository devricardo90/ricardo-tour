import Image from "next/image";
import { Instagram } from "lucide-react";
import { Link } from "@/i18n/routing";
import { RickTravelLogo } from "@/components/rick-travel-logo";
import { INSTAGRAM_URL, navAnchors, resolveChromeCopy } from "@/components/home-chrome-copy";

// Rebuilt Home footer (RT-35): charcoal closing band after the light About section.
// Shows only verified destinations: in-page anchors that exist, the existing /contato route and the approved
// Instagram profile. No phone or e-mail (conflicting sources, see home-chrome-copy.ts) and no legal links (no real
// Privacy/Terms routes exist). Cadastur appears once, as the individual approved mark, without number or status.
const linkClass =
  "inline-flex min-h-8 items-center rounded text-[14px] text-[#CAC7BF] transition-colors hover:text-[#E8C780] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8C780]";
const headingClass = "text-[12px] font-medium uppercase tracking-[0.16em] text-[#C8A86B]";

export function HomeFooter({ locale, homeHref }: { locale: string; homeHref: string }) {
  const t = resolveChromeCopy(locale);
  const f = t.footer;
  const links = [
    { label: t.nav.experiences, href: navAnchors.experiences },
    { label: f.plan, href: navAnchors.plan },
    { label: t.nav.concierge, href: navAnchors.concierge },
    { label: t.nav.rio, href: navAnchors.rio },
    { label: t.nav.about, href: navAnchors.about },
  ];

  return (
    <footer role="contentinfo" className="border-t border-[#C8A86B]/25 bg-[#0B0E11] px-5 pb-5 pt-8 text-[#F4F0E8] md:px-10 md:pt-10 lg:px-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <a
              href={homeHref}
              aria-label={t.logoAria}
              className="inline-block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E8C780]"
            >
              <RickTravelLogo variant="full" size="sm" className="h-10" />
            </a>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-[1.6] text-[#CAC7BF]">{f.description}</p>
          </div>

          <nav aria-labelledby="home-footer-nav-title" className="md:col-span-4 lg:col-span-3 lg:col-start-7">
            <h2 id="home-footer-nav-title" className={headingClass}>{f.navTitle}</h2>
            <ul className="mt-3 grid grid-cols-2 md:flex md:flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3 lg:col-span-3">
            <h2 className={headingClass}>{f.contactTitle}</h2>
            <ul className="mt-3 flex flex-col">
              <li>
                <Link href="/contato" className={linkClass}>{f.contactForm}</Link>
              </li>
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={f.instagramAria} className={`${linkClass} gap-2`}>
                  <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {f.instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <p id="home-footer-institutional" className="text-[12px] uppercase tracking-[0.14em] text-[#9DA3A5]">{f.institutionalTitle}</p>
            <Image
              src="/cadastro/cadastur.png"
              alt="Cadastur"
              width={490}
              height={110}
              loading="lazy"
              className="h-7 w-auto shrink-0"
            />
          </div>
          <p className="text-[13px] text-[#9DA3A5]">
            &copy; {new Date().getFullYear()} Rick Travel · {f.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
