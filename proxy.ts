import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
    ANALYTICS_ATTRIBUTION_COOKIE,
    buildAttributionFromUrl,
    parseAttributionCookie,
    serializeAttributionCookie,
} from "@/lib/analytics/attribution";
import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Rebuild lab (internal review surface): when disabled it must not render at all. The layout's notFound() alone is
    // not enough: the App Router streams the page segment in parallel, so a 404 response still carried the lab page
    // (statuses, internal prices) in its RSC payload. Refusing here returns a bare 404 before any rendering.
    if (/^\/(?:[a-z]{2}\/)?rebuild-lab(?:\/|$)/.test(pathname) && !isRebuildLabEnabled()) {
        return new NextResponse("Not Found", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
        });
    }

    const isProtectedPath = pathname.match(/^\/(?:[a-z]{2}\/)?(?:admin|reservas)(?:\/|$)/);

    if (isProtectedPath) {
        const sessionToken =
            req.cookies.get("better-auth.session_token")?.value ??
            req.cookies.get("__Secure-better-auth.session_token")?.value;

        if (!sessionToken) {
            const locale = pathname.match(/^\/([a-z]{2})/)?.[1] || routing.defaultLocale;
            const loginUrl = new URL(`/${locale}/login`, req.url);
            // Back to the protected page after sign-in (the login page accepts same-site paths only).
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    const response = handleI18nRouting(req);
    const attribution = buildAttributionFromUrl({
        pathname,
        searchParams: req.nextUrl.searchParams,
        referrer: req.headers.get("referer"),
        existing: parseAttributionCookie(req.cookies.get(ANALYTICS_ATTRIBUTION_COOKIE)?.value),
    });

    if (attribution) {
        response.cookies.set(ANALYTICS_ATTRIBUTION_COOKIE, serializeAttributionCookie(attribution), {
            httpOnly: false,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
        });
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api|_next|.*\\..*).*)",
    ],
};
