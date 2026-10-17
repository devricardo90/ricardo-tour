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
  TourAbout,
  TourFaq,
  TourIncludes,
  TourOptionalServices,
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
import { buildPublicWhatsAppUrl } from "@/lib/public-contact";

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
  video?: { title: Localized; src: string; mobileSrc?: string; poster: string; durationSeconds: number; caption: Localized; status: ReviewStatus } | null;
  titleByLocale?: Localized;
  pitchStatus?: ReviewStatus;
  benefitsStatus?: ReviewStatus;
  groupSize?: { value: Localized; status: ReviewStatus };
  minAge?: { value: Localized; status: ReviewStatus };
  whatsappMessage?: Localized;
  provisionalPricing?: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }>;
  contentStatus?: ReviewStatus;
  conditionsStatus?: ReviewStatus;
};

const CTA_TARGET = "#solicitar";

/**
 * Visual-review hardening: returns the offer WITHOUT the internal provisional prices, so they cannot reach the browser in
 * the no-price mode even if this component ever became a client component (props are serialized to the client).
 */
export function offerForReview<T extends { provisionalPricing?: unknown }>(offer: T, showProvisionalPrices: boolean): T {
  if (showProvisionalPrices) return offer;
  const { provisionalPricing: _omitted, ...rest } = offer;
  void _omitted;
  return rest as T;
}
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
/** `showProvisionalPrices=false` produces the visual-review version (no internal prices; only "Valores em validação"). */
export function TourDetailPrototype({ offer, content, locale, reviewMode, showProvisionalPrices = true }: { offer: PrototypeOfferView; content: TourContentView; locale: string; reviewMode: boolean; showProvisionalPrices?: boolean }) {
  const td = resolveTourDetailCopy(locale);
  const t = resolveTourContentCopy(locale);
  const s = (status: ReviewStatus) => (reviewMode ? status : undefined);
  const priceValue = offer.priceCents === null ? t.pricePending : formatPriceBRL(offer.priceCents);
  const priceStatus: ReviewStatus = offer.priceCents === null ? "PENDING" : "CONFIRMED";
  const languages = content.languages.map((code) => t.language[code] ?? code.toUpperCase()).join(" · ");
  // Review chips only (lab): mock stays MOCK; real content uses the offer's editorial status (Owner-approved texts can
  // show CONFIRMED while the record is still DRAFT). Publication is decided by the gate in lib/catalog/tour-content.ts
  // (status OWNER_APPROVED), never by these chips.
  const contentStatus: ReviewStatus = content.isMock ? "MOCK" : content.status === "OWNER_APPROVED" ? "CONFIRMED" : (offer.contentStatus ?? "PROVISIONAL");
  const conditionsStatus: ReviewStatus = content.isMock ? "MOCK" : (offer.conditionsStatus ?? contentStatus);
  const title = pickL(offer.titleByLocale, locale) || offer.title;
  const whatsappHref = offer.whatsappMessage ? buildPublicWhatsAppUrl(pickL(offer.whatsappMessage, locale)) : CTA_TARGET;
  const whatsappExternal = whatsappHref !== CTA_TARGET;

  const essentials: EssentialItem[] = [
    { key: "modality", icon: essentialIcons.Users, label: t.modality, value: pickL(offer.modality.value, locale), status: s(offer.modality.status) },
    // Real content shows the meeting point itself; mock content keeps the provisional pickup line.
    content.meetingPoint && !content.isMock
      ? { key: "meeting", icon: essentialIcons.MapPin, label: t.meetingPoint, value: content.meetingPoint, status: s(offer.pickup.status) }
      : { key: "pickup", icon: essentialIcons.Car, label: t.pickup, value: pickL(offer.pickup.value, locale), status: s(offer.pickup.status) },
    { key: "duration", icon: essentialIcons.Clock, label: t.duration, value: offer.duration.value ? pickL(offer.duration.value, locale) : t.pendingValue, status: s(offer.duration.status) },
    ...(offer.groupSize ? [{ key: "group", icon: essentialIcons.Users, label: t.participants, value: pickL(offer.groupSize.value, locale), status: s(offer.groupSize.status) }] : []),
    ...(offer.minAge ? [{ key: "age", icon: essentialIcons.UserCheck, label: t.minimumAge, value: pickL(offer.minAge.value, locale), status: s(offer.minAge.status) }] : []),
    ...(content.startTimeNote ? [{ key: "time", icon: essentialIcons.Timer, label: t.startTime, value: content.startTimeNote, status: s(contentStatus) }] : []),
    ...(languages ? [{ key: "languages", icon: essentialIcons.Languages, label: t.languages, value: languages, status: s(contentStatus) }] : []),
  ];

  return (
    <div className="bg-[var(--site-charcoal,#0B0E11)] pb-28 text-[var(--site-on-dark,#F4F0E8)] lg:pb-0" data-testid="tour-page-surface">
      {reviewMode ? (
        <div role="note" data-testid="mock-banner" className="border-b border-[var(--site-gold,#C8A86B)]/40 bg-[#3a2f12] px-5 py-3 text-[14px] text-[#f3d58a]">
          <p className="mx-auto max-w-[1280px] font-medium">{content.isMock ? t.mockBanner : showProvisionalPrices ? t.reviewBanner : t.reviewBannerNoPrices}</p>
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
                <h1 className="site-display mt-3 text-balance text-[38px] font-medium leading-[1.04] text-[var(--site-on-dark,#F4F0E8)] md:text-[48px]">{title}</h1>
                {reviewMode ? <p className="mt-2"><StatusBadge status={offer.titleStatus} locale={locale} /></p> : null}
                <p className="mt-4 text-[19px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]" data-testid="tour-pitch">
                  {pickL(offer.pitch, locale)}
                  {reviewMode ? <span className="ml-2 align-middle"><StatusBadge status={offer.pitchStatus ?? "MOCK"} locale={locale} /></span> : null}
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
                  <a href={whatsappHref} {...(whatsappExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${secondaryButtonClass} mt-3 w-full`} data-testid="tour-whatsapp">
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                    {t.ctaWhatsapp}
                  </a>
                  <p className="mt-3 text-[14px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.ctaNote}</p>
                  {reviewMode && showProvisionalPrices && offer.provisionalPricing ? (
                    <div className="mt-4 rounded-lg border border-[#e0a63c] bg-[#2e2108] p-3 text-[#f3cf86]" data-testid="tour-provisional-prices" role="note">
                      <p className="text-[12px] font-bold tracking-[0.08em]">{t.provisionalPricesTitle}</p>
                      <table className="mt-2 w-full text-[14px]">
                        <thead>
                          <tr className="text-left text-[12px] uppercase tracking-wide">
                            <th className="py-1 font-semibold">{t.participantsShort}</th>
                            <th className="py-1 font-semibold">{t.perPerson}</th>
                            <th className="py-1 font-semibold">{t.total}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offer.provisionalPricing.map((row) => (
                            <tr key={row.participants} className="border-t border-[#e0a63c]/30">
                              <td className="py-1">{row.participants}</td>
                              <td className="py-1">{formatPriceBRL(row.perPersonCents)}</td>
                              <td className="py-1">{formatPriceBRL(row.totalCents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-2 text-[12px] leading-[1.45]">{t.provisionalPricesNote}</p>
                    </div>
                  ) : null}
                </div>
              </header>
            </div>

            <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 lg:mt-16 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-12 lg:col-span-8">
                {offer.video ? (
                  <TourVideo
                    video={{ title: pickL(offer.video.title, locale), src: offer.video.src, mobileSrc: offer.video.mobileSrc, poster: offer.video.poster, durationSeconds: offer.video.durationSeconds, caption: pickL(offer.video.caption, locale) }}
                    locale={locale}
                    status={s(offer.video.status)}
                  />
                ) : null}
                <TourAbout content={content} locale={locale} status={s(contentStatus)} />
                <TourEssentials items={essentials} locale={locale} />
                <TourBenefits items={offer.benefits[(locale === "en" || locale === "es" ? locale : "pt") as "pt" | "en" | "es"]} locale={locale} status={s(offer.benefitsStatus ?? "MOCK")} />
                <TourItinerary content={content} locale={locale} status={s(contentStatus)} />
                <TourIncludes content={content} locale={locale} labels={{ included: td.included, notIncluded: td.notIncluded }} status={s(contentStatus)} />
                <TourOptionalServices content={content} locale={locale} status={s(contentStatus)} />
                <TourConditionsNotes content={content} locale={locale} status={s(conditionsStatus)} />
                <TourFaq content={content} locale={locale} status={s(conditionsStatus)} />
              </div>

              <aside className="hidden lg:col-span-4 lg:block">
                <div className={`${raisedCard} sticky top-24 p-5`} data-testid="tour-sticky-aside">
                  <p className="site-display text-[22px] font-medium leading-tight text-[var(--site-on-dark,#F4F0E8)]">{title}</p>
                  <p className="mt-3 text-[14px] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.price}</p>
                  <p className="text-[20px] font-semibold text-[var(--site-on-dark,#F4F0E8)]">{priceValue}</p>
                  <TourCtaButton href={CTA_TARGET} label={t.cta} className="mt-4 w-full" testId="tour-cta-aside" />
                </div>
              </aside>
            </div>

            <section id="solicitar" aria-labelledby="tour-request-heading" data-testid="tour-request" className={`${raisedCard} mt-16 border-[var(--site-gold,#C8A86B)]/30 px-6 py-10 md:px-10`}>
              <p className={sectionLabel}>{title}</p>
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
