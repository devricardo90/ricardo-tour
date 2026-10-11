import { ChevronLeft, Clock, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { normalizeTripImage } from "@/lib/image-utils";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedList, asLocalizedText } from "@/lib/types";
import { displayLocation, formatPriceBRL, formatTripDuration, parseTripDescription } from "@/lib/catalog/trip-presentation";
import { TourConversionSlot } from "@/components/site/tour/tour-conversion-slot";
import { TourViewTracker } from "@/components/site/tour/tour-view-tracker";
import { formatScheduleWindow, resolveTourDetailCopy } from "@/components/site/tour/tour-detail-copy";

type DetailTrip = {
  id: string;
  title: unknown;
  description?: unknown;
  highlights?: unknown;
  city: string;
  location?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  maxGuests?: number | null;
  schedules: Array<{ id: string; startAt: Date; endAt: Date | null }>;
};

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";

// Public tour detail (RT-54): editorial, image-led, light surfaces. The description is rendered from the shared
// parser so raw metadata (Duracao/Categoria/Inclusoes/Exclusoes) never appears in prose; those values are shown as
// structured facts and lists. No cancellation-policy wording, no accreditation/certification claims, no login-gated
// primary action. The conversion area is the RT-55 slot.
export function TourDetailView({ trip, locale }: { trip: DetailTrip; locale: string }) {
  const t = resolveTourDetailCopy(locale);
  const title = getLocalizedField<string>(asLocalizedText(trip.title), locale).trim();
  const parsed = parseTripDescription(getLocalizedField<string>(asLocalizedText(trip.description), locale) ?? "");
  const extraPlace = displayLocation(trip.location, trip.city);
  const place = extraPlace ?? trip.city;
  const durationLabel = formatTripDuration(parsed.duration, locale);
  const highlights = (getLocalizedField<string[]>(asLocalizedList(trip.highlights), locale) ?? []).filter(Boolean);
  // Past and non-open schedules are already excluded by getPublicTripById.
  const upcoming = trip.schedules;

  const facts: Array<{ label: string; value: string }> = [];
  if (durationLabel) facts.push({ label: t.duration, value: durationLabel });
  if (parsed.category) facts.push({ label: t.category, value: parsed.category });
  if (trip.maxGuests && trip.maxGuests > 0) facts.push({ label: t.group, value: t.groupValue(trip.maxGuests) });

  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      <TourViewTracker tripId={trip.id} locale={locale} city={trip.city} hasSchedules={upcoming.length > 0} />
      <div className="px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-8 lg:px-12">
       <div className="mx-auto max-w-[1280px]">
        <Link
          href="/tours"
          className={`inline-flex min-h-11 items-center gap-1 rounded text-[14px] font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focusRing}`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.back}
        </Link>

        <article className="mt-4">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--site-cream-soft)] md:aspect-[16/10]">
                <OptimizedImage
                  src={normalizeTripImage(trip.imageUrl)}
                  alt={t.imageAlt(title, place)}
                  fill
                  priority
                  sizes="(max-width: 1023px) 92vw, 56vw"
                  className="object-cover"
                />
              </div>
            </div>

            <header className="lg:col-span-5">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{t.eyebrow}</p>
              <h1 className="site-display mt-3 text-balance text-[34px] font-medium leading-[1.05] md:text-[44px]">{title}</h1>
              <p className="mt-3 flex items-center gap-1.5 text-[14px] text-[var(--site-ink-muted)]">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{place}</span>
              </p>

              <div className="mt-6 flex items-end justify-between gap-4 border-y border-[var(--site-rule-light)] py-5">
                <div>
                  <p className="text-[12px] text-[var(--site-ink-muted)]">{t.pricePerPerson}</p>
                  <p className="mt-1 text-[30px] font-semibold leading-[1.05]">{formatPriceBRL(trip.priceCents)}</p>
                </div>
                <a
                  href="#tour-contact"
                  className={`inline-flex min-h-11 items-center rounded-md border border-[var(--site-ink)] px-4 text-[14px] font-medium text-[var(--site-ink)] transition-colors hover:bg-white ${focusRing}`}
                >
                  {t.jumpToContact}
                </a>
              </div>

              {facts.length > 0 ? (
                <section aria-labelledby="tour-facts-heading" className="mt-6">
                  <h2 id="tour-facts-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-text,#856629)]">
                    {t.facts}
                  </h2>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px]">
                    {facts.map((fact) => (
                      <div key={fact.label} className="contents">
                        <dt className="flex items-center gap-1.5 text-[var(--site-ink-muted)]">
                          {fact.label === t.duration ? <Clock className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                          {fact.label}
                        </dt>
                        <dd className="font-medium">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}
            </header>
          </div>

          <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-10 lg:col-span-7">
              {parsed.paragraphs.length > 0 ? (
                <section aria-labelledby="tour-about-heading">
                  <h2 id="tour-about-heading" className="site-display text-[30px] font-medium leading-[1.1] md:text-[34px]">
                    {t.about}
                  </h2>
                  <div className="mt-4 max-w-[62ch] space-y-4 text-[16px] leading-[1.7] text-[var(--site-ink-muted)]">
                    {parsed.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ) : null}

              {highlights.length > 0 ? (
                <section aria-labelledby="tour-highlights-heading">
                  <h2 id="tour-highlights-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-text,#856629)]">
                    {t.highlights}
                  </h2>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
                    {highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-gold-deep)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {parsed.includes.length > 0 || parsed.excludes.length > 0 ? (
                <div className="grid gap-8 sm:grid-cols-2">
                  {parsed.includes.length > 0 ? (
                    <section aria-labelledby="tour-included-heading">
                      <h2 id="tour-included-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-text,#856629)]">
                        {t.included}
                      </h2>
                      <ul className="mt-3 space-y-2 text-[15px]">
                        {parsed.includes.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-gold-deep)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {parsed.excludes.length > 0 ? (
                    <section aria-labelledby="tour-excluded-heading">
                      <h2 id="tour-excluded-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-ink-muted)]">
                        {t.notIncluded}
                      </h2>
                      <ul className="mt-3 space-y-2 text-[15px] text-[var(--site-ink-muted)]">
                        {parsed.excludes.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-rule-light)]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}

              <section aria-labelledby="tour-schedule-heading">
                <h2 id="tour-schedule-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-text,#856629)]">
                  {t.schedule}
                </h2>
                {upcoming.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-[15px]">
                    {upcoming.map((schedule) => (
                      <li key={schedule.id}>{formatScheduleWindow(schedule.startAt, schedule.endAt, locale)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-[var(--site-ink-muted)]">{t.noSchedule}</p>
                )}
              </section>
            </div>

            <aside className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <TourConversionSlot tripId={trip.id} title={title} locale={locale} />
              </div>
            </aside>
          </div>
        </article>
       </div>
      </div>
    </div>
  );
}
