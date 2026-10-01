import { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";

// The host and sitemap URL come from PUBLIC_SITE_URL (validated https, never localhost) via lib/public-site-url.ts.
// Lab routes are not listed here: they are 404 in production and noindex in development (rebuild-lab layout).
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/api/", "/*/admin/", "/*/reservas", "/*/login", "/*/register", "/*/rebuild-lab"],
        },
        sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
    };
}
