import type { Metadata } from "next";
import { defaultSocialImages } from "@/lib/seo/social-image";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Link, getLanguageAlternates } from "@/i18n/routing";
import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { resolveContactCopy } from "@/components/site/contact/contact-copy";
import { ContactMessageForm } from "@/components/site/contact/contact-message-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = resolveContactCopy(locale);
  const path = `/${locale}/contato`;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: path, languages: getLanguageAlternates("/contato") },
    openGraph: { title: t.metaTitle, description: t.metaDescription, url: `${PUBLIC_SITE_URL}${path}`, siteName: "Ricardo Tour", images: defaultSocialImages(locale) },
  };
}

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
const linkClass = `inline-flex min-h-11 items-center gap-2 rounded text-[15px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] transition-colors hover:text-[var(--site-gold-text,#856629)] ${focus}`;

// Public contact page (RT-56), rendered inside the (site) layout (SiteHeader/SiteFooter, public fonts and tokens).
// URL unchanged: /{locale}/contato. Contact details come only from lib/public-contact.ts. No reply-time promise,
// business hours or address (not in the approved evidence), and no "secure contact"/credential wording.
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = resolveContactCopy(locale);

  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      <section aria-labelledby="contact-heading" className="px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 lg:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{t.eyebrow}</p>
            <h1 id="contact-heading" className="site-display mt-3 text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]">
              {t.heading}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.intro}</p>

            <section aria-labelledby="contact-channels" className="mt-8">
              <h2 id="contact-channels" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-text,#856629)]">
                {t.channels}
              </h2>
              <ul className="mt-3 space-y-1">
                <li className="flex flex-wrap items-center gap-x-3">
                  <span className="w-24 text-[13px] text-[var(--site-ink-muted)]">{t.email}</span>
                  <a href={PUBLIC_CONTACT.mailto} className={linkClass}>
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {PUBLIC_CONTACT.email}
                  </a>
                </li>
                <li className="flex flex-wrap items-center gap-x-3">
                  <span className="w-24 text-[13px] text-[var(--site-ink-muted)]">{t.whatsapp}</span>
                  <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={t.whatsappAria} className={linkClass}>
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {PUBLIC_CONTACT.whatsappDisplay}
                  </a>
                </li>
                <li className="flex flex-wrap items-center gap-x-3">
                  <span className="w-24 text-[13px] text-[var(--site-ink-muted)]">{t.instagram}</span>
                  <a href={PUBLIC_CONTACT.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={t.instagramAria} className={linkClass}>
                    <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {PUBLIC_CONTACT.instagramHandle}
                  </a>
                </li>
              </ul>
            </section>

            <p className="mt-8 text-[14px] text-[var(--site-ink-muted)]">
              {t.toursPrompt}{" "}
              <Link href="/tours" className={`inline-flex min-h-11 items-center font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
                {t.toursLink} <span aria-hidden="true" className="ml-1">→</span>
              </Link>
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[var(--site-rule-light)] bg-white p-6 md:p-8">
              <ContactMessageForm locale={locale} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
