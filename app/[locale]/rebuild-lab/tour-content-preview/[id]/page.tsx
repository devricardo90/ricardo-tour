import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { toTourContentView } from "@/lib/catalog/tour-content";
import { TourDetailPrototype, offerForReview } from "@/components/site/tour/content/tour-detail-prototype";
import { TourBookingRequestForm } from "@/components/site/tour/content/tour-booking-request-form";
import { PUBLIC_REQUEST_SLOTS, publicRequestTable } from "@/lib/booking/public-request";
import { siteBody, siteDisplay } from "@/app/[locale]/(site)/fonts";
import "@/app/[locale]/(site)/site-theme.css";

/** Lab-only metadata (noindex): the localized commercial name when real content exists, otherwise the prototype label. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const offer = PROTOTYPE_OFFER[id];
  const name = offer?.titleByLocale?.[locale as "pt" | "en" | "es"];
  const suffix = { pt: "prévia de revisão", en: "review preview", es: "vista previa de revisión" }[locale as "pt" | "en" | "es"] ?? "prévia de revisão";
  return { title: name ? `${name} · ${suffix} — Ricardo Tour` : "RT-114 · Tour page PROTOTYPE (mock) — Ricardo Tour", robots: { index: false, follow: false } };
}

/** RT-114 visual prototype, round 1 (rebuild lab: 404 in production unless REBUILD_LAB_ENABLED, noindex, not linked).
 *  Uses MOCK structured content + the prototype offer (statuses per fact); never reads or writes any database and never
 *  shows old catalog prices/durations/routes. */
/** `?precos=ocultos` renders the visual-review version for the Owner: internal provisional prices are not rendered.
 *  Media with rights still UNVERIFIED (e.g. the Rocinha mural, pending legal opinion) are left out, so the review shows
 *  only what could be published; `?direitos=pendentes` shows them for the rights review. */
export default async function TourContentPreviewPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ precos?: string; direitos?: string }> }) {
  const { locale, id } = await params;
  const { precos, direitos } = await searchParams;
  const offer = PROTOTYPE_OFFER[id];
  const record = MOCK_TOUR_CONTENT[id];
  if (!offer || !record) notFound();
  const view = toTourContentView(record, locale, "preview");
  if (!view) notFound();
  const content = direitos === "pendentes" ? view : { ...view, gallery: view.gallery.filter((img) => img.rightsStatus !== "UNVERIFIED"), videos: view.videos.filter((v) => v.rightsStatus !== "UNVERIFIED") };
  const showPrices = precos !== "ocultos";
  // RT-124 local review: the booking request with the approved table (lab only; creates a PENDING booking, no charge).
  const requestTable = showPrices ? publicRequestTable(id, "lab") : null;
  return (
    <div className={`site-theme ${siteDisplay.variable} ${siteBody.variable}`} data-testid="tour-content-preview">
      <TourDetailPrototype offer={offerForReview(offer, showPrices)} content={content} locale={locale} reviewMode showProvisionalPrices={showPrices} bookingRequest={requestTable ? <TourBookingRequestForm tripId={id} locale={locale} mode="lab" groupTotalCents={requestTable.groupTotalCents} adultsOnly={PUBLIC_REQUEST_SLOTS[id]?.adultsOnly} meetingPoint={PUBLIC_REQUEST_SLOTS[id]?.meetingPoint} infantHalfFare={requestTable.childPolicy === "INFANT_HALF_FARE_0_2"} optionNote={PUBLIC_REQUEST_SLOTS[id]?.optionNote?.[locale as "pt" | "en" | "es"]} /> : null} />
    </div>
  );
}
