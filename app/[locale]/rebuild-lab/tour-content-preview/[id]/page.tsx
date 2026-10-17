import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { toTourContentView } from "@/lib/catalog/tour-content";
import { TourDetailPrototype } from "@/components/site/tour/content/tour-detail-prototype";
import { siteBody, siteDisplay } from "@/app/[locale]/(site)/fonts";
import "@/app/[locale]/(site)/site-theme.css";

export const metadata: Metadata = { title: "RT-114 · Tour page PROTOTYPE (mock) — Ricardo Tour", robots: { index: false, follow: false } };

/** RT-114 visual prototype, round 1 (rebuild lab: 404 in production unless REBUILD_LAB_ENABLED, noindex, not linked).
 *  Uses MOCK structured content + the prototype offer (statuses per fact); never reads or writes any database and never
 *  shows old catalog prices/durations/routes. */
export default async function TourContentPreviewPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const offer = PROTOTYPE_OFFER[id];
  const record = MOCK_TOUR_CONTENT[id];
  if (!offer || !record) notFound();
  const content = toTourContentView(record, locale, "preview");
  if (!content) notFound();
  return (
    <div className={`site-theme ${siteDisplay.variable} ${siteBody.variable}`} data-testid="tour-content-preview">
      <TourDetailPrototype offer={offer} content={content} locale={locale} reviewMode />
    </div>
  );
}
