import { Clock, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { normalizeTripImage } from "@/lib/image-utils";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedText } from "@/lib/types";
import { displayLocation, formatPriceBRL, formatTripDuration, parseTripDescription } from "@/lib/catalog/trip-presentation";
import type { ToursCopy } from "@/components/site/tours/tours-copy";

type CardTrip = {
  id: string;
  title: unknown;
  description?: unknown;
  city: string;
  location?: string | null;
  priceCents: number;
  imageUrl?: string | null;
};

// Public listing card (RT-53): image-led, light surface. Related to the Home Experiences cards but built for browsing:
// image, title, optional place, concise summary, duration, price and one detail action. No favorites or account
// affordances, no schema-default badges and no raw metadata. The whole card is the detail link (stretched link).
export function PublicTourCard({ trip, locale, t }: { trip: CardTrip; locale: string; t: ToursCopy }) {
  const title = getLocalizedField<string>(asLocalizedText(trip.title), locale).trim();
  const { summary, duration } = parseTripDescription(getLocalizedField<string>(asLocalizedText(trip.description), locale) ?? "");
  const place = displayLocation(trip.location, trip.city);
  const durationLabel = formatTripDuration(duration, locale);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--site-rule-light)] bg-white transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(23,26,30,0.12)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--site-gold-deep)]">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-[var(--site-cream)]">
        <OptimizedImage
          src={normalizeTripImage(trip.imageUrl)}
          alt={`${title} — ${place ?? trip.city}`}
          fill
          sizes="(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 23vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-[20px] font-semibold leading-[1.15] text-[var(--site-ink)]">{title}</h2>
          {place ? (
            <p className="mt-1.5 flex items-center gap-1 text-[13px] text-[var(--site-ink-muted)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{place}</span>
            </p>
          ) : null}
        </div>

        {summary ? <p className="line-clamp-3 text-[14px] leading-[1.55] text-[var(--site-ink-muted)]">{summary}</p> : null}

        {durationLabel ? (
          <p className="flex items-center gap-1.5 text-[13px] text-[var(--site-ink-muted)]">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{durationLabel}</span>
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--site-rule-light)] pt-4">
          <div>
            <p className="text-[12px] text-[var(--site-ink-muted)]">{t.pricePerPerson}</p>
            <p className="mt-0.5 text-[20px] font-semibold leading-[1.1] text-[var(--site-ink)]">{formatPriceBRL(trip.priceCents)}</p>
          </div>
          <Link
            href={`/tours/${trip.id}`}
            aria-label={`${t.viewDetails} — ${title}`}
            className="inline-flex min-h-11 items-center text-[14px] font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--site-gold-deep)] focus-visible:outline-none"
          >
            {t.viewDetails} <span aria-hidden="true" className="ml-1">→</span>
          </Link>
        </div>
      </div>
    </li>
  );
}
