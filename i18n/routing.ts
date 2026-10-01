import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { localeCodes, defaultLocale } from './locales';

export * from './locales';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: localeCodes,

    // Used when no locale matches
    defaultLocale
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
