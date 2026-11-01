import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLanguageAlternates } from "@/i18n/routing";
import { getPublicTripById } from "@/lib/catalog/public-trips";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { buildTouristTripJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { TourUnavailableNotice, tourUnavailableCopy } from "@/components/site/tour/tour-unavailable-notice";
import { publicOfferPriceCents } from "@/lib/catalog/price-on-request";
import { getPublicTourPresentation } from "@/lib/catalog/public-tour-presentation";
import { TourDetailPrototype } from "@/components/site/tour/content/tour-detail-prototype";
import { TourBookingRequestForm } from "@/components/site/tour/content/tour-booking-request-form";
import { PUBLIC_REQUEST_SLOTS, publicRequestTable } from "@/lib/booking/public-request";

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

  // Sprint 10: the Owner-approved design's title and summary describe the page. Owner 01/11/2026: when its approved
  // content cannot be validated, the page is a neutral temporary state (not indexed) and never takes the old catalog
  // title, description or image from the database.
  const presentation = await getPublicTourPresentation(id, locale);
  const path = `/${locale}/tours/${id}`;
  if (!presentation) {
    return { title: `${tourUnavailableCopy(locale).heading} | Ricardo Tour`, robots: { index: false, follow: true }, alternates: { canonical: path } };
  }
  const title = presentation.offer.title;
  const summary = presentation.content.summary ?? undefined;
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

  const presentation = await getPublicTourPresentation(id, locale);
  // Owner 01/11/2026: no approved content, no old offer. Neutral temporary state with WhatsApp, no structured data.
  if (!presentation) return <TourUnavailableNotice locale={locale} />;
  const name = presentation.offer.title;
  const summary = presentation.content.summary ?? undefined;
  // RT-124: the booking request appears only where the price is approved AND its publication is authorized.
  const requestTable = publicRequestTable(id, "public");
  const jsonLd = buildTouristTripJsonLd({ siteUrl: PUBLIC_SITE_URL, url: `${PUBLIC_SITE_URL}/${locale}/tours/${id}`, name, description: summary, image: trip.imageUrl, priceCents: publicOfferPriceCents(id, trip.priceCents) ?? 0 }); // 0 = no Offer (obsolete published price)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      {/* Approved design, public mode: no review chips or lab notices; prices only if publication is authorized. */}
      <TourDetailPrototype
        offer={presentation.offer}
        content={presentation.content}
        locale={locale}
        reviewMode={false}
        showProvisionalPrices={false}
        bookingRequest={requestTable ? <TourBookingRequestForm tripId={id} locale={locale} mode="public" groupTotalCents={requestTable.groupTotalCents} adultsOnly={PUBLIC_REQUEST_SLOTS[id]?.adultsOnly} meetingPoint={PUBLIC_REQUEST_SLOTS[id]?.meetingPoint} infantHalfFare={requestTable.childPolicy === "INFANT_HALF_FARE_0_2"} optionNote={PUBLIC_REQUEST_SLOTS[id]?.optionNote?.[locale as "pt" | "en" | "es"]} /> : null}
      />
    </>
  );
}
