import { Mail, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PUBLIC_CONTACT, buildPublicWhatsAppUrl } from "@/lib/public-contact";
import type { TourDetailCopy } from "@/components/site/tour/tour-detail-copy";

// INTEGRATION SLOT for RT-55 (guest pre-booking / contact conversion). Until RT-55 lands, this is a safe, non-deceptive
// contact area: the contact form route and the canonical WhatsApp/email only. It does not claim availability, a
// reservation, online booking or payment, and it never sends the visitor to a login. RT-55 replaces the body of this
// component with the guest request form + prefilled WhatsApp block (the id and data attribute stay as anchors).
export function TourConversionSlot({ t, title }: { t: TourDetailCopy; title: string }) {
  const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
  return (
    <section id="tour-contact" data-conversion-slot="rt-55" aria-labelledby="tour-contact-heading" className="rounded-xl border border-[var(--site-rule-light)] bg-white p-6">
      <h2 id="tour-contact-heading" className="site-display text-[28px] font-medium leading-[1.1]">
        {t.slotTitle}
      </h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--site-ink-muted)]">{t.slotBody}</p>

      <div className="mt-5 flex flex-col gap-3">
        <Link
          href="/contato"
          className={`inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-charcoal-raised)] ${focus}`}
        >
          {t.slotCta}
        </Link>
        <a
          href={buildPublicWhatsAppUrl(t.whatsappMessage(title))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.whatsappAria}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--site-cream)] ${focus}`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {t.whatsapp} {PUBLIC_CONTACT.whatsappDisplay}
        </a>
        <a href={PUBLIC_CONTACT.mailto} className={`inline-flex min-h-11 items-center justify-center gap-2 text-[14px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          {PUBLIC_CONTACT.email}
        </a>
      </div>
    </section>
  );
}
