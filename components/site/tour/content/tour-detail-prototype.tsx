import { MapPin } from "lucide-react";
import type { TourContentView } from "@/lib/catalog/tour-content";
import { formatPriceBRL, formatTripDuration } from "@/lib/catalog/trip-presentation";
import { resolveTourDetailCopy } from "@/components/site/tour/tour-detail-copy";
import { resolveTourContentCopy } from "@/components/site/tour/content/tour-content-copy";
import { TourConditionsNotes, TourGallery, TourItinerary, TourPracticalFacts } from "@/components/site/tour/content/tour-content-sections";

export type PrototypePublishedFacts = {
  title: string;
  priceCents: number;
  duration: string;
  category: string;
  summary: string;
  highlights: string[];
  included: string[];
  notIncluded: string[];
};

const sectionLabel = "text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-deep)]";
const publishedTag = "ml-2 rounded border border-[var(--site-rule-light)] px-1.5 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wider text-[var(--site-ink-muted)]";

/**
 * RT-114 visual prototype of the enriched tour page (rebuild lab only). Published facts come from the verified snapshot
 * and are labelled "published today"; the structured sections come from TripContent (mock in the lab). The price shown is
 * the published one — this component never changes it. The production page adopts these sections only after the
 * Owner's visual approval.
 */
export function TourDetailPrototype({ facts, content, locale, showMockBanner }: { facts: PrototypePublishedFacts; content: TourContentView; locale: string; showMockBanner: boolean }) {
  const td = resolveTourDetailCopy(locale);
  const tc = resolveTourContentCopy(locale);
  const enriched: TourContentView = { ...content, durationLabel: content.durationLabel ?? formatTripDuration(facts.duration, locale) };

  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      {showMockBanner ? (
        <p role="note" data-testid="mock-banner" className="border-b border-[#c9a227] bg-[#fff3cd] px-5 py-3 text-center text-[13px] font-medium text-[#5c4300]">
          {tc.mockBanner}
        </p>
      ) : null}
      <div className="px-5 pb-16 pt-8 md:px-10 md:pb-20 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <article>
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <TourGallery content={enriched} locale={locale} priority />
              </div>
              <header className="lg:col-span-5">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{td.eyebrow}</p>
                <h1 className="site-display mt-3 text-balance text-[34px] font-medium leading-[1.05] md:text-[44px]">
                  {facts.title}
                  <span className={publishedTag}>{tc.published}</span>
                </h1>
                <p className="mt-3 flex items-center gap-1.5 text-[14px] text-[var(--site-ink-muted)]">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Rio de Janeiro · {facts.category}</span>
                </p>
                <div className="mt-6 border-y border-[var(--site-rule-light)] py-5">
                  <p className="text-[12px] text-[var(--site-ink-muted)]">
                    {td.pricePerPerson}
                    <span className={publishedTag}>{tc.published}</span>
                  </p>
                  <p className="mt-1 text-[30px] font-semibold leading-[1.05]" data-testid="published-price">{formatPriceBRL(facts.priceCents)}</p>
                </div>
                <div className="mt-6">
                  <TourPracticalFacts content={enriched} locale={locale} />
                </div>
              </header>
            </div>

            <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
              <div className="space-y-10 lg:col-span-7">
                <section aria-labelledby="proto-about-heading">
                  <h2 id="proto-about-heading" className="site-display text-[30px] font-medium leading-[1.1] md:text-[34px]">
                    {td.about}
                    <span className={publishedTag}>{tc.published}</span>
                  </h2>
                  <p className="mt-4 max-w-[62ch] text-[16px] leading-[1.7] text-[var(--site-ink-muted)]">{facts.summary}</p>
                </section>

                <TourItinerary content={enriched} locale={locale} />

                <section aria-labelledby="proto-highlights-heading">
                  <h2 id="proto-highlights-heading" className={sectionLabel}>
                    {td.highlights}
                    <span className={publishedTag}>{tc.published}</span>
                  </h2>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 text-[15px] sm:grid-cols-2">
                    {facts.highlights.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-gold-deep)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="grid gap-8 sm:grid-cols-2">
                  <section aria-labelledby="proto-included-heading">
                    <h2 id="proto-included-heading" className={sectionLabel}>{td.included}</h2>
                    <ul className="mt-3 space-y-2 text-[15px]">
                      {facts.included.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-gold-deep)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-labelledby="proto-excluded-heading">
                    <h2 id="proto-excluded-heading" className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--site-ink-muted)]">{td.notIncluded}</h2>
                    <ul className="mt-3 space-y-2 text-[15px] text-[var(--site-ink-muted)]">
                      {facts.notIncluded.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-[var(--site-rule-light)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <TourConditionsNotes content={enriched} locale={locale} />
              </div>

              <aside className="lg:col-span-5">
                <div className="rounded-xl border border-dashed border-[var(--site-rule-light)] p-6 text-[14px] text-[var(--site-ink-muted)] lg:sticky lg:top-24">
                  <p className={sectionLabel}>{td.slotTitle}</p>
                  <p className="mt-2">{td.slotBody}</p>
                </div>
              </aside>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
