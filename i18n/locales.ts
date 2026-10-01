// Pure locale constants and hreflang helpers (no next-intl imports, so they are unit-testable). Re-exported by i18n/routing.ts.
export const localeCodes = ['en', 'pt', 'es', 'sv'] as const;
export const defaultLocale = 'pt';

export type SupportedLocale = (typeof localeCodes)[number];

// Locales launched publicly (RT-57). Swedish stays a technical locale only: it is routable but is not advertised in
// hreflang or the sitemap, and its pages are noindex.
export const publicLocaleCodes = ['pt', 'en', 'es'] as const;
export type PublicLocale = (typeof publicLocaleCodes)[number];

export function isPublicLocale(locale: string): locale is PublicLocale {
    return (publicLocaleCodes as readonly string[]).includes(locale);
}

export function getLocalePath(locale: SupportedLocale, path = "") {
    const normalizedPath = path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
    return `/${locale}${normalizedPath}`;
}

export function getLanguageAlternates(path = "") {
    const languages = Object.fromEntries(
        publicLocaleCodes.map((locale) => [locale, getLocalePath(locale, path)])
    ) as Record<PublicLocale | "x-default", string>;

    languages["x-default"] = getLocalePath(defaultLocale, path);

    return languages;
}

export function getAbsoluteLanguageAlternates(path: string, baseUrl: string) {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const languages = getLanguageAlternates(path);

    return Object.fromEntries(
        Object.entries(languages).map(([language, url]) => [language, `${normalizedBaseUrl}${url}`])
    ) as Record<PublicLocale | "x-default", string>;
}
