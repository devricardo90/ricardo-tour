import type { Metadata } from "next";
import { resolveFlightsCopy } from "@/components/site/flights/flights-copy";

// Flight Planner prototype metadata (RT-38). While the page uses mock data it must NOT be indexed (RT-37 §21.1):
// robots noindex/nofollow, no canonical, no hreflang alternates, no Open Graph, and it is not listed in app/sitemap.ts.
// When a real source replaces the mock (RT-41) and the Owner approves indexing, this is the single place to change.
export function getFlightsMetadata(locale: string): Metadata {
  const t = resolveFlightsCopy(locale);
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}
