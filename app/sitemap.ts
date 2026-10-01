import { MetadataRoute } from "next";
import { getAbsoluteLanguageAlternates, publicLocaleCodes } from "@/i18n/routing";
import { getPublicTrips } from "@/lib/catalog/public-trips";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";

// Public sitemap (RT-57): only the launched locales (pt/en/es) and only public routes. Login/register are not listed,
// Swedish is not advertised, and trips come from the same catalog gate as /tours and the Home (RT-53), never from
// a raw `isPublished` query.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = PUBLIC_SITE_URL;
  const staticRoutes = ["", "/tours", "/quem-somos", "/contato"];

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
    console.error("Error fetching trips for sitemap:", error);
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

  return [...routes, ...tripRoutes];
}
