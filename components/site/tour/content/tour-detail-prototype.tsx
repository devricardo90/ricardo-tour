import { MessageCircle } from "lucide-react";
import type { TourContentView } from "@/lib/catalog/tour-content";
import { resolveTourDetailCopy } from "@/components/site/tour/tour-detail-copy";
import { resolveTourContentCopy } from "@/components/site/tour/content/tour-content-copy";
import {
  StatusBadge,
  TourBenefits,
  TourConditionsNotes,
  TourCtaButton,
  TourEssentials,
  TourGallery,
  TourIncludes,
  TourItinerary,
  TourMobileCtaBar,
  TourVideo,
  essentialIcons,
  secondaryButtonClass,
  sectionLabel,
  type EssentialItem,
  type ReviewStatus,
} from "@/components/site/tour/content/tour-content-sections";
import { formatPriceBRL } from "@/lib/catalog/trip-presentation";

type Localized = { pt?: string; en?: string; es?: string };
export type PrototypeOfferView = {
  title: string;
  titleStatus: ReviewStatus;
  pitch: Localized;
  modality: { value: Localized; status: ReviewStatus };
  pickup: { value: Localized; status: ReviewStatus };
  priceCents: number | null;
  duration: { value: Localized | null; status: ReviewStatus };
  benefits: { pt: string[]; en: string[]; es: string[] };
  coverStatus: ReviewStatus;
  video?: { src: string; poster: string; durationSeconds: number; caption: Localized; status: ReviewStatus } | null;
};

const CTA_TARGET = "#solicitar";
const pickL = (v: Localized | null | undefined, locale: string) => (v ? (v[locale as keyof Localized] ?? v.pt ?? "") : "");
const raisedCard = "rounded-xl border border-white/10 bg-[var(--site-charcoal-raised,#15191D)]";

/**
 * RT-114 prototype — round 1 + Owner addendum (16/10/2026, changes requested).
 * Design System: the dark surface the Home uses to present tours ("Experiences": charcoal page, raised cards, matte gold,
 * solid-gold primary CTA, gold-outline secondary) instead of a dominant beige. Commercial hierarchy: hero with pitch and
 * "Solicitar disponibilidade", gallery that never crops the main photo, essentials, private-experience benefits,
 * itinerary, inclusions, practical conditions, final request; sticky CTA (desktop aside, mobile bottom bar).
 * Review mode shows a status chip on every fact. Old catalog prices/durations/routes are not shown. Booking unchanged:
 * the CTA points to the existing request form; no automatic confirmation.
 */
export function TourDetailPrototype({ offer, content, locale, reviewMode }: { offer: PrototypeOfferView; content: TourContentView; locale: string; reviewMode: boolean }) {
  const td = resolveTourDetailCopy(locale);
  const t = resolveTourContentCopy(locale);
  const s = (status: ReviewStatus) => (reviewMode ? status : undefined);
  const priceValue = offer.priceCents === null ? t.pricePending : formatPriceBRL(offer.priceCents);
  const priceStatus: ReviewStatus = offer.priceCents === null ? "PENDING" : "CONFIRMED";
  const languages = content.languages.map((code) => t.language[code] ?? code.toUpperCase()).join(" · ");
  const contentStatus: ReviewStatus = content.isMock ? "MOCK" : "CONFIRMED";

  const essentials: EssentialItem[] = [
    { key: "modality", icon: essentialIcons.Users, label: t.modality, value: pickL(offer.modality.value, locale), status: s(offer.modality.status) },
    { key: "pickup", icon: essentialIcons.Car, label: t.pickup, value: pickL(offer.pickup.value, locale), status: s(offer.pickup.status) },
    { key: "duration", icon: essentialIcons.Clock, label: t.duration, value: offer.duration.value ? pickL(offer.duration.value, locale) : t.pricePending, status: s(offer.duration.status) },
    ...(content.startTimeNote ? [{ key: "time", icon: essentialIcons.Timer, label: t.startTime, value: content.startTimeNote, status: s(contentStatus) }] : []),
    ...(languages ? [{ key: "languages", icon: essentialIcons.Languages, label: t.languages, value: languages, status: s(contentStatus) }] : []),
  ];

  return (
    <div className="bg-[var(--site-charcoal,#0B0E11)] pb-28 text-[var(--site-on-dark,#F4F0E8)] lg:pb-0" data-testid="tour-page-surface">
      {reviewMode ? (
        <div role="note" data-testid="mock-banner" className="border-b border-[var(--site-gold,#C8A86B)]/40 bg-[#3a2f12] px-5 py-3 text-[14px] text-[#f3d58a]">
          <p className="mx-auto max-w-[1280px] font-medium">{t.mockBanner}</p>
          <p className="mx-auto mt-1.5 flex max-w-[1280px] flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold">{t.reviewLegend}:</span>
            {(["CONFIRMED", "PROVISIONAL", "PENDING", "MOCK"] as const).map((st) => (
              <StatusBadge key={st} status={st} locale={locale} />
            ))}
          </p>
        </div>
      ) : null}

      <div className="px-5 pb-16 pt-8 md:px-10 md:pb-20 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <article>
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="relative min-w-0 lg:col-span-7">
                <TourGallery content={content} locale={locale} priority />
                {reviewMode && offer.coverStatus !== "CONFIRMED" ? (
                  <p className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-[var(--site-charcoal,#0B0E11)]/85 px-2.5 py-1.5 text-[12px] font-medium text-[var(--site-on-dark,#F4F0E8)] backdrop-blur">
                    <StatusBadge status={offer.coverStatus} locale={locale} />
                    {t.coverProvisional}
                  </p>
                ) : null}
              </div>

              <header className="lg:col-span-5" data-testid="tour-hero">
                <p className={sectionLabel}>{td.eyebrow}</p>
                <h1 className="site-display mt-3 text-balance text-[38px] font-medium leading-[1.04] text-[var(--site-on-dark,#F4F0E8)] md:text-[48px]">{offer.title}</h1>
                {reviewMode ? <p className="mt-2"><StatusBadge status={offer.titleStatus} locale={locale} /></p> : null}
                <p className="mt-4 text-[19px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]" data-testid="tour-pitch">
                  {pickL(offer.pitch, locale)}
                  {reviewMode ? <span className="ml-2 align-middle"><StatusBadge status="MOCK" locale={locale} /></span> : null}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2 text-[14px] font-medium">
                  <li className="inline-flex items-center rounded-full border border-[var(--site-gold,#C8A86B)]/40 bg-[var(--site-gold,#C8A86B)]/10 px-3 py-1.5 text-[var(--site-gold-bright,#E8C780)]">{pickL(offer.modality.value, locale)}</li>
                  <li className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-[var(--site-on-dark,#F4F0E8)]">{pickL(offer.pickup.value, locale)}</li>
                </ul>

                <div className={`${raisedCard} mt-6 p-5`} data-testid="tour-booking-card">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--site-on-dark-muted,#CAC7BF)]">
                    {t.price}
                    {reviewMode ? <StatusBadge status={priceStatus} locale={locale} /> : null}
                  </p>
                  <p className="mt-1 text-[26px] font-semibold leading-tight text-[var(--site-on-dark,#F4F0E8)]" data-testid="tour-price">{priceValue}</p>
                  <TourCtaButton href={CTA_TARGET} label={t.cta} className="mt-4 w-full" />
                  <a href={CTA_TARGET} className={`${secondaryButtonClass} mt-3 w-full`}>
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                    {t.ctaWhatsapp}
                  </a>
                  <p className="mt-3 text-[14px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.ctaNote}</p>
                </div>
              </header>
            </div>

            <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 lg:mt-16 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-12 lg:col-span-8">
                {offer.video ? (
                  <TourVideo
                    video={{ src: offer.video.src, poster: offer.video.poster, durationSeconds: offer.video.durationSeconds, caption: pickL(offer.video.caption, locale) }}
                    locale={locale}
                    status={s(offer.video.status)}
                  />
                ) : null}
                <TourEssentials items={essentials} locale={locale} />
                <TourBenefits items={offer.benefits[(locale === "en" || locale === "es" ? locale : "pt") as "pt" | "en" | "es"]} locale={locale} status={s("MOCK")} />
                <TourItinerary content={content} locale={locale} status={s(contentStatus)} />
                <TourIncludes content={content} locale={locale} labels={{ included: td.included, notIncluded: td.notIncluded }} status={s(contentStatus)} />
                <TourConditionsNotes content={content} locale={locale} status={s(contentStatus)} />
              </div>

              <aside className="hidden lg:col-span-4 lg:block">
                <div className={`${raisedCard} sticky top-24 p-5`} data-testid="tour-sticky-aside">
                  <p className="site-display text-[22px] font-medium leading-tight text-[var(--site-on-dark,#F4F0E8)]">{offer.title}</p>
                  <p className="mt-3 text-[14px] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.price}</p>
                  <p className="text-[20px] font-semibold text-[var(--site-on-dark,#F4F0E8)]">{priceValue}</p>
                  <TourCtaButton href={CTA_TARGET} label={t.cta} className="mt-4 w-full" testId="tour-cta-aside" />
                </div>
              </aside>
            </div>

            <section id="solicitar" aria-labelledby="tour-request-heading" data-testid="tour-request" className={`${raisedCard} mt-16 border-[var(--site-gold,#C8A86B)]/30 px-6 py-10 md:px-10`}>
              <p className={sectionLabel}>{offer.title}</p>
              <h2 id="tour-request-heading" className="site-display mt-2 text-[32px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[38px]">{t.contactTitle}</h2>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.ctaNote}</p>
              {reviewMode ? <p className="mt-3 max-w-[60ch] text-[14px] text-[var(--site-on-dark-subtle,#9DA3A5)]">{t.contactBody}</p> : null}
            </section>
          </article>
        </div>
      </div>

      <TourMobileCtaBar href={CTA_TARGET} label={t.cta} priceLabel={t.price} priceValue={priceValue} />
    </div>
  );
}
