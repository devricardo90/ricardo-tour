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
type ApprovedPricingForReview = {
  durations: ReadonlyArray<{ hours: number; label: Localized; prices: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }> }>;
  additionalHourPerGroupCents: number;
};
type ApprovedRouteForReview = {
  id: string;
  title: Localized;
  durationLabel: Localized;
  durationMinutes: number;
  stops: ReadonlyArray<{ position: number; title: Localized; durationMinutes: number }>;
};
export type PrototypeOfferView = {
  title: string;
  titleStatus: ReviewStatus;
  pitch: Localized;
  modality: { value: Localized; status: ReviewStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>> };
  pickup: { value: Localized; status: ReviewStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>> };
  priceCents: number | null;
  duration: { value: Localized | null; status: ReviewStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>> };
  benefits: { pt: string[]; en: string[]; es: string[] };
  coverStatus: ReviewStatus;
  video?: { title: Localized; src: string; mobileSrc?: string; poster: string; durationSeconds: number; caption: Localized; status: ReviewStatus } | null;
  titleByLocale?: Localized;
  titleStatusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>>;
  pitchStatus?: ReviewStatus;
  benefitsStatus?: ReviewStatus;
  groupSize?: { value: Localized; status: ReviewStatus; statusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>> };
  minAge?: { value: Localized; status: ReviewStatus };
  whatsappMessage?: Localized;
  hideWhatsAppCta?: boolean;
  provisionalPricing?: ReadonlyArray<{ participants: number; perPersonCents: number; totalCents: number }>;
  contentStatus?: ReviewStatus;
  contentStatusByLocale?: Partial<Record<"pt" | "en" | "es", ReviewStatus>>;
  conditionsStatus?: ReviewStatus;
  /** Shown instead of "Valores em validação" while no price is approved (e.g. "Orçamento sob consulta"). */
  priceLabel?: Localized;
  /** The meeting text is a hotel pickup rule, not a fixed meeting point. */
  hotelPickup?: boolean;
  children?: { value: Localized; status: ReviewStatus };
  transport?: { value: Localized; status: ReviewStatus };
  /** Sprint 10 channel: the final request section also offers the prefilled WhatsApp message. */
  requestViaWhatsapp?: boolean;
  approvedPricing?: ApprovedPricingForReview;
  routeOptions?: ReadonlyArray<ApprovedRouteForReview>;
  translationStatusNotice?: Localized;
  priceSummary?: Localized;
  reviewBannerNotice?: Localized;
  requestFlowNotice?: Localized;
  /** Keeps the TOUR-03 local draft from falling back to Portuguese for missing EN/ES copy. */
  noPortugueseFallback?: boolean;
  /** Local review CTA mode; WhatsApp opens an inquiry only, never a booking or payment. */
  requestFlowMode?: "whatsapp";
};

const CTA_TARGET = "#solicitar";

/**
 * Visual-review hardening: returns the offer WITHOUT the internal provisional prices, so they cannot reach the browser in
 * the no-price mode even if this component ever became a client component (props are serialized to the client).
 */
export function offerForReview<T extends { provisionalPricing?: unknown; approvedPricing?: unknown }>(offer: T, showProvisionalPrices: boolean): T {
  if (showProvisionalPrices) return offer;
  const { provisionalPricing: _provisionalPrices, approvedPricing: _approvedPrices, ...rest } = offer;
  void _provisionalPrices;
  void _approvedPrices;
  return rest as T;
}
const pickL = (v: Localized | null | undefined, locale: string, allowPortugueseFallback = true) =>
  (v ? (v[locale as keyof Localized] ?? (allowPortugueseFallback ? v.pt : undefined) ?? "") : "");
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
  const localize = (value: Localized | null | undefined) => pickL(value, locale, !offer.noPortugueseFallback);
  const s = (status: ReviewStatus) => (reviewMode ? status : undefined);
  const hasVisibleApprovedPricing = Boolean(reviewMode && showProvisionalPrices && offer.approvedPricing);
  const priceValue = hasVisibleApprovedPricing ? localize(offer.priceSummary) || (offer.noPortugueseFallback ? "" : "Consulte a tabela por duração e tamanho do grupo") : offer.priceCents === null ? localize(offer.priceLabel) || t.pricePending : formatPriceBRL(offer.priceCents);
  const priceStatus: ReviewStatus = hasVisibleApprovedPricing ? "CONFIRMED" : offer.priceCents === null ? "PENDING" : "CONFIRMED";
  const languages = content.languages.map((code) => t.language[code] ?? code.toUpperCase()).join(" · ");
  // Review chips only (lab): mock stays MOCK; real content uses the offer's editorial status (Owner-approved texts can
  // show CONFIRMED while the record is still DRAFT). Publication is decided by the gate in lib/catalog/tour-content.ts
  // (status OWNER_APPROVED), never by these chips.
  const localeKey = (locale === "en" || locale === "es" ? locale : "pt") as "pt" | "en" | "es";
  const contentStatus: ReviewStatus = content.isMock ? "MOCK" : content.approvalValid ? "CONFIRMED" : (offer.contentStatusByLocale?.[localeKey] ?? offer.contentStatus ?? "PROVISIONAL");
  const conditionsStatus: ReviewStatus = content.isMock ? "MOCK" : (offer.conditionsStatus ?? contentStatus);
  const title = localize(offer.titleByLocale) || (offer.noPortugueseFallback ? "" : offer.title);
  const whatsappHref = offer.whatsappMessage ? buildPublicWhatsAppUrl(localize(offer.whatsappMessage)) : CTA_TARGET;
  const whatsappExternal = whatsappHref !== CTA_TARGET;
  const ctaHref = reviewMode && offer.requestFlowMode === "whatsapp" ? whatsappHref : CTA_TARGET;

  const essentials: EssentialItem[] = [];
  if (localize(offer.modality.value)) essentials.push({ key: "modality", icon: essentialIcons.Users, label: t.modality, value: localize(offer.modality.value), status: s(offer.modality.statusByLocale?.[localeKey] ?? offer.modality.status) });
  if (content.meetingPoint && !content.isMock) essentials.push({ key: "meeting", icon: offer.hotelPickup ? essentialIcons.Car : essentialIcons.MapPin, label: offer.hotelPickup ? t.hotelPickup : t.meetingPoint, value: content.meetingPoint, status: s(offer.pickup.statusByLocale?.[localeKey] ?? offer.pickup.status) });
  else if (localize(offer.pickup.value)) essentials.push({ key: "pickup", icon: essentialIcons.Car, label: t.pickup, value: localize(offer.pickup.value), status: s(offer.pickup.statusByLocale?.[localeKey] ?? offer.pickup.status) });
  essentials.push({ key: "duration", icon: essentialIcons.Clock, label: t.duration, value: offer.duration.value ? localize(offer.duration.value) : t.pendingValue, status: s(offer.duration.statusByLocale?.[localeKey] ?? offer.duration.status) });
  if (offer.groupSize) essentials.push({ key: "group", icon: essentialIcons.Users, label: t.participants, value: localize(offer.groupSize.value), status: s(offer.groupSize.statusByLocale?.[localeKey] ?? offer.groupSize.status) });
  if (offer.minAge) essentials.push({ key: "age", icon: essentialIcons.UserCheck, label: t.minimumAge, value: localize(offer.minAge.value), status: s(offer.minAge.status) });
  if (offer.children) essentials.push({ key: "children", icon: essentialIcons.UserCheck, label: t.children, value: localize(offer.children.value), status: s(offer.children.status) });
  if (offer.transport) essentials.push({ key: "transport", icon: essentialIcons.Car, label: t.transport, value: localize(offer.transport.value), status: s(offer.transport.status) });
  if (content.startTimeNote) essentials.push({ key: "time", icon: essentialIcons.Timer, label: t.startTime, value: content.startTimeNote, status: s(contentStatus) });
  if (languages) essentials.push({ key: "languages", icon: essentialIcons.Languages, label: t.languages, value: languages, status: s(contentStatus) });

  return (
    <div className="bg-[var(--site-charcoal,#0B0E11)] pb-28 text-[var(--site-on-dark,#F4F0E8)] lg:pb-0" data-testid="tour-page-surface">
      {reviewMode ? (
        <div role="note" data-testid="mock-banner" className="border-b border-[var(--site-gold,#C8A86B)]/40 bg-[#3a2f12] px-5 py-3 text-[14px] text-[#f3d58a]">
          <p className="mx-auto max-w-[1280px] font-medium">{content.isMock ? t.mockBanner : offer.reviewBannerNotice && showProvisionalPrices ? localize(offer.reviewBannerNotice) : showProvisionalPrices ? t.reviewBanner : t.reviewBannerNoPrices}</p>
          <p className="mx-auto mt-1.5 flex max-w-[1280px] flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold">{t.reviewLegend}:</span>
            {(["CONFIRMED", "PROVISIONAL", "PENDING", "MOCK"] as const).map((st) => (
              <StatusBadge key={st} status={st} locale={locale} />
            ))}
          </p>
          {offer.translationStatusNotice ? <p className="mx-auto mt-2 max-w-[1280px] text-[13px] leading-[1.45]">{localize(offer.translationStatusNotice)}</p> : null}
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
                {reviewMode ? <p className="mt-2"><StatusBadge status={offer.titleStatusByLocale?.[localeKey] ?? offer.titleStatus} locale={locale} /></p> : null}
                {localize(offer.pitch) ? <p className="mt-4 text-[19px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]" data-testid="tour-pitch">
                  {localize(offer.pitch)}
                  {reviewMode ? <span className="ml-2 align-middle"><StatusBadge status={offer.pitchStatus ?? "MOCK"} locale={locale} /></span> : null}
                </p> : null}
                  {localize(offer.modality.value) || localize(offer.pickup.value) ? <ul className="mt-4 flex flex-wrap gap-2 text-[14px] font-medium">
                  {localize(offer.modality.value) ? <li className="inline-flex items-center rounded-full border border-[var(--site-gold,#C8A86B)]/40 bg-[var(--site-gold,#C8A86B)]/10 px-3 py-1.5 text-[var(--site-gold-bright,#E8C780)]">{localize(offer.modality.value)}</li> : null}
                  {localize(offer.pickup.value) ? <li className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-[var(--site-on-dark,#F4F0E8)]">{localize(offer.pickup.value)}</li> : null}
                </ul> : null}

                <div className={`${raisedCard} mt-6 p-5`} data-testid="tour-booking-card">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-[var(--site-on-dark-muted,#CAC7BF)]">
                    {t.price}
                    {reviewMode ? <StatusBadge status={priceStatus} locale={locale} /> : null}
                  </p>
                  <p className="mt-1 text-[26px] font-semibold leading-tight text-[var(--site-on-dark,#F4F0E8)]" data-testid="tour-price">{priceValue}</p>
                  <TourCtaButton href={ctaHref} label={t.cta} className="mt-4 w-full" />
                  {!offer.hideWhatsAppCta ? <a href={whatsappHref} {...(whatsappExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${secondaryButtonClass} mt-3 w-full`} data-testid="tour-whatsapp">
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                    {t.ctaWhatsapp}
                  </a> : null}
                  <p className="mt-3 text-[14px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.ctaNote}</p>
                  {reviewMode && showProvisionalPrices && offer.approvedPricing ? (
                    <div className="mt-4 rounded-lg border border-[var(--site-gold,#C8A86B)]/50 bg-[var(--site-gold,#C8A86B)]/10 p-3" data-testid="tour-approved-prices" role="note">
                      <p className="text-[12px] font-bold tracking-[0.04em]">{t.approvedTablePreview}</p>
                      {offer.approvedPricing.durations.map((duration) => (
                        <div key={duration.hours} className="mt-3 overflow-x-auto">
                          <p className="mb-1 text-[13px] font-semibold">{localize(duration.label) || (offer.noPortugueseFallback ? "" : duration.label.pt)}</p>
                          <table className="w-full text-[13px]">
                            <thead><tr className="text-left text-[11px] uppercase tracking-wide"><th scope="col" className="py-1">{t.participantsShort}</th><th scope="col" className="py-1">{t.perPerson}</th><th scope="col" className="py-1">{t.total}</th></tr></thead>
                            <tbody>{duration.prices.map((row) => <tr key={row.participants} className="border-t border-white/10"><th scope="row" className="py-1 text-left font-normal">{row.participants}</th><td className="py-1">{formatPriceBRL(row.perPersonCents)}</td><td className="py-1">{formatPriceBRL(row.totalCents)}</td></tr>)}</tbody>
                          </table>
                        </div>
                      ))}
                      <p className="mt-3 text-[12px] leading-[1.45]">{t.approvedPricingNote.replace("{price}", formatPriceBRL(offer.approvedPricing.additionalHourPerGroupCents))}</p>
                      <p className="mt-2 text-[11px] leading-[1.4]">{t.publicationGateNote}</p>
                    </div>
                  ) : null}
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
                {reviewMode && offer.routeOptions ? (
                  <section aria-labelledby="centro-route-options-heading" data-testid="centro-route-options">
    <h2 id="centro-route-options-heading" className="site-display flex flex-wrap items-center gap-3 text-[30px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[34px]">{t.routeOptionsTitle} <StatusBadge status={localeKey === "pt" ? "CONFIRMED" : "PENDING"} locale={locale} /></h2>
                    <div className="mt-5 grid gap-5">
                      {offer.routeOptions.map((route) => (
                        <article key={route.id} className={`${raisedCard} p-5`}>
                          <h3 className="text-[19px] font-semibold">{localize(route.title) || (offer.noPortugueseFallback ? "" : route.title.pt)}</h3>
                          <p className="mt-1 text-[14px] text-[var(--site-gold-bright,#E8C780)]">{localize(route.durationLabel) || (offer.noPortugueseFallback ? "" : route.durationLabel.pt)}</p>
                          <ol className="mt-4 space-y-3">
                            {route.stops.map((stop, index) => <li key={stop.position} className="flex gap-3 text-[15px]"><span className="shrink-0 font-semibold text-[var(--site-gold,#C8A86B)]" aria-hidden="true">{index + 1}.</span><span>{localize(stop.title) || (offer.noPortugueseFallback ? "" : stop.title.pt)}<span className="ml-2 text-[13px] text-[var(--site-on-dark-muted,#CAC7BF)]">{stop.durationMinutes} min</span></span></li>)}
                          </ol>
                        </article>
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] leading-[1.5] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.routeValidationNote}</p>
                  </section>
                ) : <TourItinerary content={content} locale={locale} status={s(contentStatus)} />}
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
                  <TourCtaButton href={ctaHref} label={t.cta} className="mt-4 w-full" testId="tour-cta-aside" />
                </div>
              </aside>
            </div>

            <section id="solicitar" aria-labelledby="tour-request-heading" data-testid="tour-request" className={`${raisedCard} mt-16 border-[var(--site-gold,#C8A86B)]/30 px-6 py-10 md:px-10`}>
              <p className={sectionLabel}>{title}</p>
              <h2 id="tour-request-heading" className="site-display mt-2 text-[32px] font-medium leading-[1.1] text-[var(--site-on-dark,#F4F0E8)] md:text-[38px]">{t.contactTitle}</h2>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.ctaNote}</p>
              {offer.requestViaWhatsapp && whatsappExternal ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={`${secondaryButtonClass} mt-6 w-full sm:w-auto`} data-testid="tour-request-whatsapp">
                  <MessageCircle className="h-[18px] w-[18px]" aria-hidden="true" />
                  {t.requestWhatsapp}
                </a>
              ) : null}
              {reviewMode && !offer.requestViaWhatsapp ? <p className="mt-3 max-w-[60ch] text-[14px] text-[var(--site-on-dark-subtle,#9DA3A5)]">{localize(offer.requestFlowNotice) || t.contactBody}</p> : null}
            </section>
          </article>
        </div>
      </div>

      <TourMobileCtaBar href={ctaHref} label={t.cta} priceLabel={t.price} priceValue={priceValue} />
    </div>
  );
}
