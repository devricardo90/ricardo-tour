import { Mail, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

/**
 * Owner 01/11/2026: temporary neutral state of a launch tour page whose approved content cannot be validated (content
 * tables missing, RT-119 load incomplete, approval fingerprint mismatch, a locale not confirmed). It never falls back to
 * the old catalog offer: no title, description, highlights, price or image from the database. Existing public tokens
 * and link styles only (no new design); WhatsApp and e-mail stay available.
 */
export const TOUR_UNAVAILABLE_COPY = {
  pt: {
    heading: "Passeio em atualização",
    body: "As informações deste passeio estão sendo atualizadas. Fale com a nossa equipe pelo WhatsApp para saber detalhes e disponibilidade.",
    whatsapp: "Falar pelo WhatsApp",
    whatsappAria: "Falar pelo WhatsApp (abre em nova aba)",
    emailFallback: "Ou escreva para",
    tours: "Ver os passeios",
  },
  en: {
    heading: "Tour being updated",
    body: "The details of this tour are being updated. Talk to our team on WhatsApp for details and availability.",
    whatsapp: "Message on WhatsApp",
    whatsappAria: "Message on WhatsApp (opens in a new tab)",
    emailFallback: "Or write to",
    tours: "See the tours",
  },
  es: {
    heading: "Tour en actualización",
    body: "La información de este tour se está actualizando. Habla con nuestro equipo por WhatsApp para conocer detalles y disponibilidad.",
    whatsapp: "Escribir por WhatsApp",
    whatsappAria: "Escribir por WhatsApp (se abre en una pestaña nueva)",
    emailFallback: "O escribe a",
    tours: "Ver los tours",
  },
} as const;

export const tourUnavailableCopy = (locale: string) => TOUR_UNAVAILABLE_COPY[locale === "en" || locale === "es" ? locale : "pt"];

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";

export function TourUnavailableNotice({ locale }: { locale: string }) {
  const t = tourUnavailableCopy(locale);
  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      <section aria-labelledby="tour-unavailable-heading" data-testid="tour-unavailable" className="px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 lg:px-12">
        <div className="mx-auto max-w-[640px] rounded-xl border border-[var(--site-rule-light)] bg-white p-6 md:p-8">
          <h1 id="tour-unavailable-heading" className="site-display text-balance text-[28px] font-medium leading-[1.1] md:text-[34px]">{t.heading}</h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.body}</p>
          <div className="mt-5 flex flex-col gap-3">
            <a
              href={PUBLIC_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.whatsappAria}
              data-testid="tour-unavailable-whatsapp"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--site-cream)] ${focus}`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t.whatsapp} · {PUBLIC_CONTACT.whatsappDisplay}
            </a>
            <p className="flex flex-wrap items-center justify-center gap-x-2 text-[14px] text-[var(--site-ink-muted)]">
              <span>{t.emailFallback}</span>
              <a href={PUBLIC_CONTACT.mailto} className={`inline-flex min-h-11 items-center gap-1.5 text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
                <Mail className="h-4 w-4" aria-hidden="true" />
                {PUBLIC_CONTACT.email}
              </a>
            </p>
          </div>
          <p className="mt-4 text-center text-[14px]">
            <Link href="/tours" className={`inline-flex min-h-11 items-center font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
              {t.tours} <span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
