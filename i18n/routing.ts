import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const localeCodes = ['en', 'pt', 'es', 'sv'] as const;
export const defaultLocale = 'pt';

export type SupportedLocale = (typeof localeCodes)[number];

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: localeCodes,

    // Used when no locale matches
    defaultLocale
});

export function getLocalePath(locale: SupportedLocale, path = "") {
    const normalizedPath = path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
    return `/${locale}${normalizedPath}`;
}

export function getLanguageAlternates(path = "") {
    const languages = Object.fromEntries(
        localeCodes.map((locale) => [locale, getLocalePath(locale, path)])
    ) as Record<SupportedLocale | "x-default", string>;

    languages["x-default"] = getLocalePath(defaultLocale, path);

    return languages;
}

export function getAbsoluteLanguageAlternates(path: string, baseUrl: string) {
    const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const languages = getLanguageAlternates(path);

    return Object.fromEntries(
        Object.entries(languages).map(([language, url]) => [language, `${normalizedBaseUrl}${url}`])
    ) as Record<SupportedLocale | "x-default", string>;
}

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
