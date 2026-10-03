import { Check } from "lucide-react";
import type { FlightDirectionView, FlightOfferView } from "@/lib/flights/types";
import { dayOffset, formatClock, formatDuration, formatMoney } from "@/lib/flights/format";
import { fill, totalForLabel, type FlightsCopy } from "@/components/site/flights/flights-copy";
import { focusRing, primaryButton } from "@/components/site/flights/styles";

// One Offer (RT-37 §16, §17). Terminology: this is an Offer, not a "ticket" or "booking". The price is the TOTAL for all
// passengers and is indicative until validated. Baggage / fare conditions are provider-dependent: when the data is
// missing the card says so instead of inferring (RT-37 §17). Sample offers carry a visible "Sample" badge.

type Props = {
  offer: FlightOfferView;
  locale: string;
  t: FlightsCopy;
  passengerCount: number;
  selected: boolean;
  unavailable: boolean;
  onSelect: (offer: FlightOfferView) => void;
};

function DirectionRow({ direction, label, t }: { direction: FlightDirectionView; label?: string; t: FlightsCopy }) {
  const first = direction.segments[0];
  const last = direction.segments[direction.segments.length - 1];
  const plusDays = dayOffset(first.departAt, last.arriveAt);
  const stopsLabel = direction.stops === 0 ? t.results.direct : direction.stops === 1 ? t.results.oneStop : fill(t.results.stopsMany, { n: direction.stops });
  const layover = direction.layovers?.[0];
  const duration = formatDuration(direction.durationMinutes, t.results.units);

  return (
    <div className="py-2">
      {label ? <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--site-gold-deep)]">{label}</p> : null}
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[20px] font-medium tabular-nums text-[var(--site-ink)]">
        <span>{formatClock(first.departAt)}</span>
        <span className="text-[13px] font-normal text-[var(--site-ink-muted)]">{first.from.code}</span>
        <span aria-hidden="true" className="text-[var(--site-ink-muted)]">→</span>
        <span>{formatClock(last.arriveAt)}</span>
        {plusDays > 0 ? <sup className="text-[12px] font-normal text-[var(--site-ink-muted)]">{fill(t.results.nextDay, { n: plusDays })}</sup> : null}
        <span className="text-[13px] font-normal text-[var(--site-ink-muted)]">{last.to.code}</span>
      </p>
      <p className="mt-0.5 text-[13px] text-[var(--site-ink-muted)]">
        {duration} · {stopsLabel}
        {layover ? ` · ${fill(t.results.layover, { airport: layover.airportCode, duration: formatDuration(layover.minutes, t.results.units) })}` : ""}
      </p>
    </div>
  );
}

export function OfferCard({ offer, locale, t, passengerCount, selected, unavailable, onSelect }: Props) {
  const carrier = offer.directions[0]?.segments[0]?.carrierName ?? "";
  const price = formatMoney(locale, offer.price.currency, offer.price.total);
  const bothWays = offer.directions.length > 1;
  const baggage = offer.baggage;
  const baggageLine =
    baggage?.known && baggage.perDirection[0]?.checked ? fill(t.results.baggageKnown, { value: baggage.perDirection[0].checked ?? "" }) : t.results.baggageUnknown;

  return (
    <li
      data-testid="offer-card"
      data-offer-ref={offer.offerRef}
      className={`rounded-xl border bg-white p-4 md:p-5 ${selected ? "border-[var(--site-gold-deep)] shadow-[0_0_0_1px_var(--site-gold-deep)]" : "border-[var(--site-rule-light)]"} ${unavailable ? "opacity-70" : ""}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-medium text-[var(--site-ink)]">{carrier}</p>
            {offer.isSample ? (
              <span className="rounded-full border border-[var(--site-gold-deep)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--site-gold-deep)]">
                {t.demo.sampleBadge}
              </span>
            ) : null}
          </div>
          <div className="mt-1 divide-y divide-[var(--site-rule-light)]">
            {offer.directions.map((direction, i) => (
              <DirectionRow key={i} direction={direction} label={bothWays ? (i === 0 ? t.results.outbound : t.results.inbound) : undefined} t={t} />
            ))}
          </div>
          <p className="mt-2 text-[13px] text-[var(--site-ink-muted)]">{baggageLine}</p>
          <details className="mt-1">
            <summary className={`inline-flex min-h-11 cursor-pointer items-center text-[13px] font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[5px] ${focusRing}`}>
              {t.results.fareConditions}
            </summary>
            <div className="mt-2 rounded-md bg-[var(--fp-soft)] p-3 text-[13px] leading-[1.55] text-[var(--site-ink-muted)]">
              <p>{t.results.fareConditionsPlaceholder}</p>
              <p className="mt-2">{t.results.baggagePlaceholder}</p>
            </div>
          </details>
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:w-[210px] md:items-end">
          <div className="md:text-right">
            <p className="text-[24px] font-medium leading-none tabular-nums text-[var(--site-ink)]">{price}</p>
            <p className="mt-1 text-[12px] text-[var(--site-ink-muted)]">{totalForLabel(t, passengerCount)}</p>
          </div>
          <button
            type="button"
            disabled={unavailable}
            aria-label={fill(t.results.selectAria, { carrier, price })}
            onClick={() => onSelect(offer)}
            className={`${primaryButton} w-full md:w-auto md:min-w-[170px]`}
          >
            {unavailable ? (
              t.results.noLongerAvailable
            ) : selected ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                {t.results.selected}
              </>
            ) : (
              t.results.select
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
