import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLanguageAlternates } from "@/i18n/routing";
import { getPublicTripById } from "@/lib/catalog/public-trips";
import { parseTripDescription } from "@/lib/catalog/trip-presentation";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedText } from "@/lib/types";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { buildTouristTripJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { TourDetailView } from "@/components/site/tour/tour-detail-view";
import { publicOfferPriceCents } from "@/lib/catalog/price-on-request";

// Same request-time catalog read as the Home and the listing.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

// Public tour detail (RT-54), rendered inside the (site) layout (SiteHeader/SiteFooter, public fonts and tokens).
// The URL is unchanged: /{locale}/tours/[id]. Visibility is decided by the shared public catalog gate: any id outside
// the approved launch catalog (drafts, artifacts, other destinations) is a 404, never a rendered page.
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id, locale } = await props.params;
  const trip = await getPublicTripById(id);

  if (!trip) {
    return { title: "Tour not found | Ricardo Tour", robots: { index: false, follow: false } };
  }

  const title = getLocalizedField<string>(asLocalizedText(trip.title), locale).trim();
  // The parsed summary, never the raw description (which carries Duracao/Categoria/... metadata blocks).
  const summary = parseTripDescription(getLocalizedField<string>(asLocalizedText(trip.description), locale) ?? "").summary ?? undefined;
  const path = `/${locale}/tours/${id}`;
  const images = trip.imageUrl ? [trip.imageUrl] : [];

  return {
    title: `${title} | Ricardo Tour`,
    description: summary,
    alternates: { canonical: path, languages: getLanguageAlternates(`/tours/${id}`) },
    openGraph: { title, description: summary, url: path, images },
    twitter: { title, description: summary, images },
  };
}

export default async function TourDetailsPage(props: PageProps) {
  const { id, locale } = await props.params;
  const trip = await getPublicTripById(id);

  if (!trip) {
    notFound();
  }

  const name = getLocalizedField<string>(asLocalizedText(trip.title), locale).trim();
  const summary = parseTripDescription(getLocalizedField<string>(asLocalizedText(trip.description), locale) ?? "").summary ?? undefined;
  const jsonLd = buildTouristTripJsonLd({ siteUrl: PUBLIC_SITE_URL, url: `${PUBLIC_SITE_URL}/${locale}/tours/${id}`, name, description: summary, image: trip.imageUrl, priceCents: publicOfferPriceCents(id, trip.priceCents) ?? 0 }); // 0 = no Offer (obsolete published price)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <TourDetailView trip={trip} locale={locale} />
    </>
  );
}
