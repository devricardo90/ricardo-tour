import type { Metadata } from "next";
import { getFlightsMetadata } from "@/lib/flights/metadata";
import { FlightPlanner } from "@/components/site/flights/flight-planner";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return getFlightsMetadata(locale);
}

// Flight Planner PROTOTYPE (RT-38), canonical route /{locale}/voos (Owner-approved, RT-37).
// MOCK ONLY: sample data behind lib/flights/source.ts, no provider/API calls, no payment, no order, no database, no Prisma.
// noindex while mock (lib/flights/metadata.ts) and not in the sitemap. Deliberately NOT linked from the Home, header,
// mobile menu, footer or tour pages: HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED, so the approved Home/shared chrome
// is untouched and this page is reached by direct URL during the isolated mock phase.
export default async function FlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <FlightPlanner locale={locale} />;
}
