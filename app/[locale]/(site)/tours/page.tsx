import type { Metadata } from "next";
import { getLanguageAlternates } from "@/i18n/routing";
import { filterPublicTrips, getPublicTrips } from "@/lib/catalog/public-trips";
import { resolveToursCopy } from "@/components/site/tours/tours-copy";
import { PublicTourCard } from "@/components/site/tours/public-tour-card";
import { ToursSearch } from "@/components/site/tours/tours-search";

// Always read the catalog at request time (same as the Home Experiences section).
export const dynamic = "force-dynamic";

function getToursMetadataCopy(locale: string) {
  switch (locale) {
    case "en":
      return {
        title: "Tours in Rio de Janeiro | Rick Travel",
        description: "Compare guided tours, schedules and premium experiences in Rio de Janeiro.",
      };
    case "es":
      return {
        title: "Tours en Rio de Janeiro | Rick Travel",
        description: "Compara tours guiados, fechas y experiencias premium en Rio de Janeiro.",
      };
    case "sv":
      return {
        title: "Turer i Rio de Janeiro | Rick Travel",
        description: "Jamfor guidade turer, datum och premiumupplevelser i Rio de Janeiro.",
      };
    default:
      return {
        title: "Tours e experiencias no Rio | Rick Travel",
        description: "Compare passeios guiados, datas e experiencias premium no Rio de Janeiro.",
      };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getToursMetadataCopy(locale);
  const path = `/${locale}/tours`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: path,
      languages: getLanguageAlternates("/tours"),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: path,
    },
  };
}

type ParamValue = string | string[] | undefined;
const first = (value: ParamValue) => (Array.isArray(value) ? value[0] : value);

interface ToursPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, ParamValue>>;
}

// Public tours listing (RT-53). Rendered inside the (site) layout, so it inherits the shared SiteHeader/SiteFooter, the
// public fonts and tokens. The URL is unchanged: /{locale}/tours. Only the Owner-approved public catalog is listed
// (lib/catalog/public-trips), the same source the Home Experiences section uses.
export default async function ToursPage({ params, searchParams }: ToursPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const t = resolveToursCopy(locale);
  const search = (first(query.search) ?? "").trim();

  const catalog = await getPublicTrips();
  const trips = filterPublicTrips(
    catalog,
    {
      search,
      minPrice: first(query.minPrice),
      maxPrice: first(query.maxPrice),
      duration: first(query.duration),
      level: first(query.level),
      children: first(query.children),
    },
    locale,
  );

  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      <section aria-labelledby="tours-heading" className="px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14 lg:px-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{t.eyebrow}</p>
              <h1 id="tours-heading" className="site-display mt-3 text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]">
                {t.heading}
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.intro}</p>
            </div>
            <ToursSearch t={t} value={search} />
          </div>

          <p className="mt-8 text-[13px] text-[var(--site-ink-muted)]" aria-live="polite">
            {trips.length} {trips.length === 1 ? t.countOne : t.countMany}
          </p>

          {trips.length === 0 ? (
            <p className="mt-6 rounded-xl border border-[var(--site-rule-light)] bg-white px-6 py-10 text-center text-[15px] text-[var(--site-ink-muted)]">
              {t.empty}
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {trips.map((trip) => (
                <PublicTourCard key={trip.id} trip={trip} locale={locale} t={t} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
