import { MetadataRoute } from "next";
import { getAbsoluteLanguageAlternates, publicLocaleCodes } from "@/i18n/routing";
import { getPublicTrips } from "@/lib/catalog/public-trips";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { TRAVEL_PLANNER_CANONICAL, TRAVEL_PLANNER_PUBLIC_ACTIVE } from "@/lib/travel-planner/config";
import { reportServerError } from "@/lib/observability/report";
import { LEGAL_PATHS, legalPagesPublished } from "@/lib/legal/publication";

// Public sitemap (RT-57): only the launched locales (pt/en/es) and only public routes. Login/register are not listed,
// Swedish is not advertised, and trips come from the same catalog gate as /tours and the Home (RT-53), never from
// a raw `isPublished` query.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = PUBLIC_SITE_URL;
  // RT-80/RT-81: the legal pages are listed only once published (a draft is never advertised).
  const staticRoutes = ["", "/tours", "/quem-somos", "/contato", ...(legalPagesPublished() ? [LEGAL_PATHS.terms, LEGAL_PATHS.privacy] : [])];

  const routes = publicLocaleCodes.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
      priority: route === "" ? 1 : 0.8,
      alternates: {
        languages: getAbsoluteLanguageAlternates(route, baseUrl),
      },
    }))
  );

  let trips: { id: string }[] = [];

  try {
    trips = await getPublicTrips();
  } catch (error) {
    reportServerError({ source: "route_handler", where: "sitemap:trips", error });
  }

  const tripRoutes = publicLocaleCodes.flatMap((locale) =>
    trips.map((trip) => ({
      url: `${baseUrl}/${locale}/tours/${trip.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: getAbsoluteLanguageAlternates(`/tours/${trip.id}`, baseUrl),
      },
    }))
  );

  // PT-only: the widget provider confirmed only pt-br, so no EN/ES equivalents or hreflang alternates.
  const travelPlannerRoutes = TRAVEL_PLANNER_PUBLIC_ACTIVE
    ? [{ url: TRAVEL_PLANNER_CANONICAL, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 }]
    : [];

  return [...routes, ...travelPlannerRoutes, ...tripRoutes];
}
