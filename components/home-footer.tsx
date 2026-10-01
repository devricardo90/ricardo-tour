import { SiteFooter } from "@/components/site/site-footer";

// Rebuilt Home footer (RT-35). Since RT-52 this is a thin wrapper over the shared SiteFooter (in-page section links).
export function HomeFooter({ locale, homeHref }: { locale: string; homeHref: string }) {
  return <SiteFooter locale={locale} anchorMode="page" homeHref={homeHref} />;
}
