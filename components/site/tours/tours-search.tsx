import { Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { ToursCopy } from "@/components/site/tours/tours-copy";

// Compact, server-rendered search (GET form), the only filter exposed at launch. The other legacy URL parameters
// (price, duration, level, children) are still honored by filterPublicTrips, but their controls would expose a single
// meaningless option across the four-trip launch catalog (all one-day, light-level), so they are not shown.
export function ToursSearch({ t, value }: { t: ToursCopy; value: string }) {
  return (
    <form role="search" method="get" className="flex w-full max-w-md items-stretch gap-2">
      <label htmlFor="tours-search" className="sr-only">
        {t.searchLabel}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--site-ink-muted)]" aria-hidden="true" />
        <input
          id="tours-search"
          type="search"
          name="search"
          defaultValue={value}
          placeholder={t.searchPlaceholder}
          autoComplete="off"
          className="h-11 w-full rounded-md border border-[var(--site-rule-light)] bg-white pl-10 pr-3 text-[14px] text-[var(--site-ink)] placeholder:text-[var(--site-ink-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]"
        />
      </div>
      <button
        type="submit"
        className="h-11 shrink-0 rounded-md border border-[var(--site-ink)] bg-[var(--site-ink)] px-4 text-[14px] font-medium text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-charcoal-raised)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]"
      >
        {t.searchButton}
      </button>
      {value ? (
        <Link
          href="/tours"
          className="inline-flex h-11 shrink-0 items-center px-1 text-[14px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]"
        >
          {t.clear}
        </Link>
      ) : null}
    </form>
  );
}
