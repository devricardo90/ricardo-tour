import { SiteHeader } from "@/components/site/site-header";

// Rebuilt Home header (RT-35). Since RT-52 this is a thin wrapper over the shared SiteHeader: the Home is the one
// page where section links are in-page hashes (anchorMode "page"), so behavior and markup are unchanged.
export function HomeHeader({ locale, homeHref }: { locale: string; homeHref: string }) {
  return <SiteHeader locale={locale} anchorMode="page" homeHref={homeHref} />;
}
