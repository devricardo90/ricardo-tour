import type { Metadata } from "next";
import { Link, getLanguageAlternates } from "@/i18n/routing";
import { PUBLIC_CONTACT, buildPublicWhatsAppUrl } from "@/lib/public-contact";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { AboutPortrait } from "@/components/about-portrait";
import { resolveAboutCopy } from "@/components/site/about/about-copy";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = resolveAboutCopy(locale);
  const path = `/${locale}/quem-somos`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: path, languages: getLanguageAlternates("/quem-somos") },
    openGraph: { title: t.metaTitle, description: t.metaDescription, url: `${PUBLIC_SITE_URL}${path}`, siteName: "Rick Travel" },
  };
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";

// Public About page (RT-56): a concise editorial page built on the approved Home About direction (RT-34). Every statement
// comes from the approved evidence register or the approved Home copy. The old mission/vision/values grids, the
// security section and any credential claims are intentionally not restored. The founder photo reuses the optimized
// derivative and the proximity-loaded portrait (never the 2.1 MB original).
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = resolveAboutCopy(locale);

  return (
    <div className="bg-[var(--site-cream-soft)] text-[var(--site-ink)]">
      <div className="px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <header className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{t.eyebrow}</p>
            <h1 className="site-display mt-3 text-balance text-[34px] font-medium leading-[1.05] md:text-[52px]">{t.heading}</h1>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--site-ink-muted)]">{t.intro}</p>
          </header>

          <section aria-labelledby="about-story-heading" className="mt-12 grid items-center gap-8 md:grid-cols-12 md:gap-10 lg:mt-16 lg:gap-14">
            <div className="md:col-span-5">
              <AboutPortrait src="/images/about/ricardo-guia-home.webp" alt={t.imageAlt} />
            </div>
            <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">
              <h2 id="about-story-heading" className="site-display text-balance text-[30px] font-medium leading-[1.1] md:text-[38px]">
                {t.storyHeading}
              </h2>
              <div className="mt-5 max-w-[54ch] space-y-4 text-[16px] leading-[1.7] text-[var(--site-ink-muted)]">
                {t.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--site-rule-light)] pt-4">
                <span aria-hidden="true" className="h-px w-6 bg-[var(--site-gold-deep)]" />
                <p className="text-[14px] leading-[1.4]">
                  <span className="font-semibold">{t.signatureName}</span>
                  <span className="text-[var(--site-ink-muted)]"> · {t.signatureRole}</span>
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="about-services-heading" className="mt-14 border-t border-[var(--site-rule-light)] pt-10 lg:mt-20">
            <h2 id="about-services-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-deep)]">
              {t.servicesHeading}
            </h2>
            <ul className="mt-4 grid gap-x-10 gap-y-2.5 text-[16px] sm:grid-cols-2">
              {t.services.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.7em] h-px w-5 shrink-0 bg-[var(--site-gold-deep)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[15px] text-[var(--site-ink-muted)]">{t.languages}</p>
          </section>

          <nav aria-label={t.ctaContact} className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/tours" className={`inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--site-ink)] px-6 text-[15px] font-medium text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-charcoal-raised)] ${focus}`}>
              {t.ctaTours}
            </Link>
            <Link href="/contato" className={`inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--site-ink)] px-6 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-white ${focus}`}>
              {t.ctaContact}
            </Link>
            <a
              href={buildPublicWhatsAppUrl(t.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.ctaWhatsAppAria}
              className={`inline-flex min-h-12 items-center justify-center gap-2 px-2 text-[15px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}
            >
              {t.ctaWhatsApp} · {PUBLIC_CONTACT.whatsappDisplay}
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
