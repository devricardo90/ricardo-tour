# Current Home Architecture Audit

## Baseline

- Branch: `main`
- HEAD: `8457de62f768eb00f98d70f2590586842e94d67a`
- Origin main: `8457de62f768eb00f98d70f2590586842e94d67a`
- Audit date/context: 2026-09-03, RT-RB-S0-02 / RT-6, Sprint 0 - Foundation & Audit.
- Task classification: AGENT.
- Jira acceptance criterion: "Mapa manter/adaptar/substituir/remover com evidencia no repo."
- Source of Truth alignment: The Google Doc "Rick Travel - Visual Rebuild Source of Truth" identifies RT-RB-S0-02 as "Auditar Home atual: rotas, componentes e dependencias", mode AGENT, initial status BACKLOG, and Definition of Done "Mapa manter/adaptar/substituir/remover com evidencia no repo." Jira currently tracks the same task in `Em andamento`.

## Public Home Entry

The public Home is the localized public route at `/{locale}`, implemented by `app/[locale]/(public)/page.tsx`. The route group `(public)` does not appear in the URL. Locale handling is supplied by `next-intl` through `proxy.ts`, `i18n/routing.ts`, and `i18n/request.ts`.

Entry files:

- `app/[locale]/(public)/page.tsx`: Home page component and route-level metadata.
- `app/[locale]/(public)/layout.tsx`: public layout wrapping public routes with skip link, fixed header, `main`, and optional AI Concierge widget.
- `app/[locale]/layout.tsx`: locale root layout, global CSS import, metadata defaults, `NextIntlClientProvider`, `ThemeProvider`, and toaster.
- `proxy.ts`: locale routing, protected route redirect checks, and analytics attribution cookie.

There is no repository evidence of a non-localized `app/page.tsx`; public access depends on the locale middleware/proxy resolving requests into the `[locale]` segment.

## Render Tree

```text
[locale] RootLayout
├─ html/body
│  └─ NextIntlClientProvider
│     └─ ThemeProvider
│        ├─ Toaster
│        └─ PublicLayout
│           ├─ skip link
│           ├─ HeroHeader
│           │  ├─ RickTravelLogo
│           │  ├─ desktop nav links
│           │  ├─ AuthStatus
│           │  ├─ ThemeToggleButton
│           │  ├─ LanguageSwitcher
│           │  └─ MobileMenu dynamic import
│           ├─ main#main-content
│           │  └─ Home
│           │     ├─ HeroSection
│           │     │  ├─ HeroContent
│           │     │  │  ├─ translated headline/description
│           │     │  │  ├─ HeroSearch
│           │     │  │  ├─ tours CTA
│           │     │  │  └─ WhatsApp quote CTA
│           │     │  └─ HeroMedia
│           │     │     └─ next/image using /videos/imagem-rio-perfil.jpg
│           │     └─ dark Home shell
│           │        ├─ ReservationsSection
│           │        │  └─ ReservationHeaders
│           │        │     └─ TripList
│           │        │        └─ TripGrid
│           │        │           └─ TripCard[]
│           │        ├─ FadeInSection
│           │        │  └─ TravelerSupport dynamic import
│           │        │     └─ SupportCard[]
│           │        └─ FooterSection dynamic import
│           │           ├─ RickTravelLogo
│           │           ├─ footer navigation links
│           │           └─ Cadastur image
│           └─ AIConciergeWidget when enabled
│              ├─ floating entry button
│              └─ chat panel
```

## Route and Layout Dependencies

- `proxy.ts` runs on non-API, non-asset routes. It delegates i18n routing to `next-intl/middleware`, redirects unauthenticated users away from protected `admin` and `reservas` paths, and sets `ricktravel_analytics_attribution` when URL/referrer attribution exists.
- `i18n/routing.ts` defines locales `en`, `pt`, `es`, `sv`, with default locale `pt`, and exports localized `Link`, `redirect`, `usePathname`, and `useRouter`.
- `i18n/request.ts` loads `messages/{locale}.json` dynamically for request locale.
- `app/[locale]/layout.tsx` sets global metadata from `PUBLIC_SITE_URL`, imports `app/globals.css`, and preconnects to `https://api.ricktravel.com`.
- `app/[locale]/(public)/layout.tsx` is shared by the Home and other public pages in the group, so changes to header, skip link, main semantics, or AI Concierge affect more than Home.
- `app/[locale]/(public)/page.tsx` generates Home metadata from `HomePage.Metadata` translations and language alternates.

## Component Inventory

| Component | Path | Responsibility | Server/Client | Shared? | Key Dependencies |
| --- | --- | --- | --- | --- | --- |
| `Home` | `app/[locale]/(public)/page.tsx` | Public Home composition and dark page shell | Server component | Home-specific | `next/dynamic`, `next-intl/server`, `HeroSection`, `ReservationsSection`, `FadeInSection` |
| `PublicLayout` | `app/[locale]/(public)/layout.tsx` | Public route wrapper, skip link, header, AI Concierge mount | Server component | Shared public routes | `HeroHeader`, `AIConciergeWidget`, `isAIConciergeEnabled` |
| `RootLayout` | `app/[locale]/layout.tsx` | Locale root, global providers, global metadata | Server component | Shared all localized routes | `globals.css`, `NextIntlClientProvider`, `ThemeProvider`, `Toaster`/`sonner`, `PUBLIC_SITE_URL` |
| `HeroHeader` | `components/header.tsx` | Fixed desktop/mobile navigation and auth/language/theme controls | Client component | Shared public layout | `motion/react`, `lucide-react`, `next-intl`, `MobileMenu`, `AuthStatus`, `ThemeToggleButton`, `LanguageSwitcher` |
| `MobileMenu` | `components/mobile-menu.tsx` | Mobile bottom-sheet navigation and auth CTAs | Client component | Shared public layout | `gsap`, `lucide-react`, `better-auth` client, `/api/auth/get-session`, `next-intl` |
| `AuthStatus` | `components/auth-status.tsx` | Desktop session-aware auth actions | Client component | Shared header | `better-auth` client, `/api/auth/get-session`, `next-intl` |
| `ThemeToggleButton` | `components/ThemeToggleButton.tsx` | Theme menu | Client component | Shared | `next-themes`, Radix dropdown, `lucide-react`, `next-intl` |
| `LanguageSwitcher` | `components/LanguageSwitcher.tsx` | Locale switcher | Client component | Shared | `next-intl`, `i18n/routing`, Radix dropdown |
| `RickTravelLogo` | `components/rick-travel-logo.tsx` | Inline SVG brand mark | Server-compatible component | Shared | `cn` utility |
| `HeroSection` | `components/hero-section.tsx` | Current Home hero with search and CTAs | Client component | Home-specific | `next/image`, `HeroSearch`, `Button`, `lucide-react`, `next-intl`, `buildWhatsAppQuoteUrl` |
| `HeroSearch` | `components/hero-search.tsx` | Client search suggestions and navigation to tours | Client component | Home-specific by placement, reusable by shape | `/api/trips`, `next-intl`, `i18n/routing`, `Skeleton`, `lucide-react`, `getLocalizedField` |
| `ReservationsSection` | `components/reservations-section.tsx` | Home tours section wrapper | Server component | Home-specific | `TripList`, `ReservationHeaders` |
| `ReservationHeaders` | `components/reservation-headers.tsx` | Translated Home section heading for trips | Client component | Home-specific | `next-intl` |
| `TripList` | `components/trip-list.tsx` | Server-side published trip query, filtering, serialization | Server component, force dynamic | Shared-ish catalog rendering | `prisma`, `TripGrid`, `next-intl/server`, localized helpers |
| `TripGrid` | `components/trip-grid.tsx` | Responsive trip-card grid and reveal animation | Client component | Shared-ish trip display | `motion/react`, `TripCard`, `next-intl` |
| `TripCard` | `components/trips/trip-card.tsx` | Individual trip card, image, metadata, CTA | Client component | Shared trip display | `OptimizedImage`, `date-fns`, `lucide-react`, `Button`, `TourMediaBadges`, `motion/react`, `next-intl` |
| `TourMediaBadges` | `components/trips/tour-media-badges.tsx` | Favorite heart overlay state | Client component | Shared trip media | `lucide-react`, React state |
| `OptimizedImage` | `components/ui/optimized-image.tsx` | `next/image` wrapper with loading/fallback behavior | Client component | Shared UI | `next/image`, `cn`, `/images/placeholder.svg` |
| `FadeInSection` | `components/ui/fade-in-section.tsx` | Scroll reveal wrapper | Client component | Shared UI | `motion/react` |
| `TravelerSupportSection` | `components/testimonials.tsx` | Current support/trust cards under trips | Client component | Home-specific by placement | `Card`, `next-intl` |
| `FooterSection` | `components/footer.tsx` | Footer navigation, logo, Cadastur material | Client component | Shared-like but currently rendered by Home | `next/image`, `RickTravelLogo`, `i18n/routing`, `next-intl` |
| `AIConciergeWidget` | `components/ai-concierge/ai-concierge-widget.tsx` | Floating conversational UI | Client component | Shared public layout | `/api/ai-concierge`, `lucide-react`, `Textarea`, `Button`, `next-intl`, AI Concierge contract types |

## Data/API Dependencies

- Static translations: `messages/{en,pt,es,sv}.json` provide `HomePage`, `Navigation`, `Footer`, `TripCard`, `ThemeToggle`, `LanguageSwitcher`, `MobileMenu`, and auth strings used by the Home path.
- Server data: `TripList` calls `prisma.trip.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } })`. Home rendering therefore requires a valid `DATABASE_URL` and reachable PostgreSQL for this section.
- Client API data: `HeroSearch` calls `GET /api/trips`, which also uses Prisma and returns published trip id/title/description/city/location.
- Auth/session data: `AuthStatus` and `MobileMenu` call `GET /api/auth/get-session`; `MobileMenu` also uses `authClient.signOut`.
- AI Concierge data: `AIConciergeWidget` posts to `POST /api/ai-concierge`, which validates the request and currently returns `createMockAIConciergeResponse`.
- Environment variables required or relevant to Home render:
  - `DATABASE_URL`: required by `lib/prisma.ts`.
  - `PUBLIC_SITE_URL`: optional; falls back to `https://rick-travel.vercel.app` for metadata.
  - `AI_CONCIERGE_ENABLED` or `NEXT_PUBLIC_AI_CONCIERGE_ENABLED`: optional flag; defaults enabled outside production and disabled in production when unset.
  - Better Auth variables are needed for session/auth behavior (`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` in `.env.example`), though anonymous Home rendering can proceed without a logged-in user.
- Third-party/service assumptions:
  - WhatsApp quote links are generated by `lib/whatsapp.ts` from Hero CTA usage.
  - `proxy.ts` writes analytics attribution cookies based on URL/referrer data before route handling returns.

## Styling and Design-System Dependencies

- Tailwind CSS v4 is imported in `app/globals.css` via `@import "tailwindcss"`.
- Global CSS tokens define background, foreground, card, primary, muted, border, ring, shadows, radius, navy/gold/teal/green colors, and font variables.
- Global typography uses system fonts: `--font-sans: "Segoe UI", Arial, sans-serif`; root body applies `letter-spacing: -0.01em`.
- Shared component classes include `.section-spacing`, `.section-spacing-sm`, `.surface-dark`, `.surface-dark-solid`, `.surface-light`, `.btn-primary`, `.btn-ghost-dark`, `.chip-dark`, `.chip-light`, `.button-press`, `.fade-in`, and level badge classes.
- Responsive strategy is mostly Tailwind breakpoints (`sm`, `md`, `lg`) and fixed max-width containers (`max-w-7xl`, `max-w-6xl`, `max-w-5xl`).
- Motion strategy currently mixes `motion/react` for header scroll state, grid reveal, card interaction, and fade-in, plus GSAP for mobile menu animations.
- `@media (prefers-reduced-motion: reduce)` globally reduces animation and transition duration.
- Theme handling uses `next-themes` through `ThemeProvider`; public Home styling is largely dark and uses explicit hex/arbitrary classes, but global theme tokens still affect shared UI controls and AI Concierge.

## Runtime/Package Dependencies

| Dependency | Evidence | Classification | Notes |
| --- | --- | --- | --- |
| `next` / App Router | `app/[locale]/(public)/page.tsx`, `app/[locale]/layout.tsx`, `next.config.ts` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY | Home route, metadata, image, dynamic imports, API routes. |
| `react`, `react-dom` | package baseline and all components | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY | Core rendering. |
| `next-intl` | layouts, Home metadata, components, messages | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Locale route and all visible copy depend on it. |
| `tailwindcss`, `@tailwindcss/postcss` | `app/globals.css`, `postcss.config.mjs` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Most Home styling is Tailwind utility based. |
| `next-themes` | `ThemeProvider`, `ThemeToggleButton`, `Toaster` | SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Public layout and shared UI theme behavior. |
| `lucide-react` | Hero, header, search, trip cards, AI Concierge | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY | Icon system used across Home-rendered surfaces. |
| `motion` | `header.tsx`, `trip-grid.tsx`, `trip-card.tsx`, `fade-in-section.tsx` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Current reveal/interaction dependency. Source of Truth says GSAP + ScrollTrigger is initial future prototype option. |
| `gsap` | `mobile-menu.tsx` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Not used in Home hero today, but active in public Home header mobile menu. |
| `@prisma/client`, `@prisma/adapter-pg`, `pg` | `lib/prisma.ts`, `trip-list.tsx`, `/api/trips` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Home tours/search need database access. |
| `date-fns` | `TripCard` | REQUIRED_CURRENTLY | Visible trip-card date formatting. |
| `better-auth` | `AuthStatus`, `MobileMenu`, auth API | SHARED_PLATFORM_DEPENDENCY, POSSIBLE_REBUILD_CONSTRAINT | Header/session behavior on Home. |
| Radix packages | `Button` via slot, dropdown menu controls | SHARED_PLATFORM_DEPENDENCY | Header theme/language menus and shared UI. |
| `class-variance-authority`, `clsx`, `tailwind-merge` | `Button`, `cn` | SHARED_PLATFORM_DEPENDENCY | Shared UI class composition. |
| `zod` | AI Concierge contract and wider app schemas | SHARED_PLATFORM_DEPENDENCY | AI Concierge route validates contract through app code. |
| `sonner` | `app/[locale]/layout.tsx` renders `Toaster`; `components/ui/toaster.tsx` imports `Toaster as Sonner` | REQUIRED_CURRENTLY, SHARED_PLATFORM_DEPENDENCY | Global toaster is on the localized Home render path through the root layout. |
| `sharp` | package dependency, image optimization tooling | APPARENTLY_UNUSED_IN_HOME | No direct Home import found; likely build/tooling image dependency. |
| `resend`, `react-hook-form`, `use-debounce`, `@hookform/resolvers` | package dependency and non-Home features | APPARENTLY_UNUSED_IN_HOME | No evidence in current Home render path. |

## Shared Global Dependencies

- `app/[locale]/(public)/layout.tsx` makes `HeroHeader` and `AIConciergeWidget` shared public-route dependencies, not Home-only code.
- `app/[locale]/layout.tsx` makes `NextIntlClientProvider`, `ThemeProvider`, `Toaster`, global metadata, and `globals.css` shared across localized routes; `Toaster` depends on `sonner` through `components/ui/toaster.tsx`.
- `proxy.ts` applies i18n routing and attribution cookies to public Home requests and other non-API/non-asset routes.
- `messages/*.json` are global locale bundles loaded for the locale, not Home-only chunks.
- `components/ui/*` primitives are shared across Home, public pages, auth, and admin surfaces.

## Coupling and Rebuild Risks

| Risk | Evidence | Impact | Recommendation for later rebuild work |
| --- | --- | --- | --- |
| Public header is shared across public pages | `PublicLayout` wraps all `(public)` children with `HeroHeader` | A Home rebuild that changes header behavior could alter tours/contact/about pages. | Decide in RT-RB-S0-03/04 whether the rebuild lab should reuse or isolate header/footer before visual changes. |
| AI Concierge is layout-level, not Home-only | `PublicLayout` conditionally renders `AIConciergeWidget` for public routes | Home rebuild can unintentionally remove or duplicate strategic AI Concierge if only page tree is inspected. | Preserve the layout-level mount or explicitly define a replacement mount in the lab. |
| Home tours depend on live database | `TripList` and `/api/trips` call Prisma with `DATABASE_URL` | Home render and search can fail if DB is unavailable; rebuild prototypes need a data strategy. | Use real service boundary or documented fixture fallback only in an isolated lab; do not silently fake production data. |
| Search uses separate client API from server trip list | `HeroSearch` fetches `/api/trips`; `TripList` queries Prisma directly | Search and displayed cards can drift in selected fields, cache behavior, and failure modes. | Inventory this again in RT-RB-S0-03 before replacing search/Flight Planner UX. |
| Motion stack is split | `motion/react` in header/grid/fade/card; `gsap` in mobile menu | New cinematic work may add a second GSAP-heavy path over existing motion code. | In the rebuild lab, explicitly choose which motion layer owns each interaction. |
| Global CSS tokens and utility classes are shared | `globals.css` defines tokens and component classes used by Home and shared UI | Changing tokens for the Home can regress admin/auth/public pages. | Add rebuild-specific scope or route-level styling before changing global tokens. |
| Footer is dynamically rendered inside Home, while header is layout-level | `FooterSection` is imported by `Home`; `HeroHeader` by `PublicLayout` | Rebuild could isolate footer differently from header and alter Cadastur preservation. | Treat footer/Cadastur as a preservation item and inventory in RT-RB-S0-03. |
| Metadata is split between root and Home | `RootLayout.metadata` plus `generateMetadata` in Home | Rebuild route/lab could lose canonical/language alternates or Open Graph data. | Keep SEO metadata in the lab plan and compare against current Home. |
| Protected route redirect logic runs in proxy | `proxy.ts` matches `admin` and `reservas` paths | Navigation links in header/footer depend on locale-aware route generation plus auth redirects. | Preserve localized links and verify auth routes when header/footer are touched. |
| Cadastur claim must stay accurate | Source of Truth says Cadastur must be preserved without invented claims; `footer.tsx` renders `/cadastro/cadastur.png` | Rebuild copy/media could overstate trust material or omit required evidence. | Move Cadastur into explicit preservation checklist in RT-RB-S0-03. |

## Preservation Matrix

Vocabulary:

- `PRESERVE` = manter.
- `ADAPT` = adaptar.
- `REPLACE_CANDIDATE` = substituir.
- `REMOVE` = remover.
- `NEEDS_FURTHER_AUDIT` = unresolved/research status outside the four Jira DoD disposition categories.

| Item | Current implementation | Preserve / Adapt / Replace candidate / Further audit / Remove | Reason |
| --- | --- | --- | --- |
| Localized public Home route | `app/[locale]/(public)/page.tsx`, `i18n/routing.ts`, `proxy.ts` | PRESERVE | Locale routing and language alternates are production behavior. |
| Existing app foundation | Next App Router, public layout, providers, Prisma, auth | PRESERVE | Source of Truth says not to rebuild backend/reservations/data/integrations just to replace UI. |
| Home rebuild isolation | Not present yet in repo; Source of Truth requires lab/preview before production replacement | NEEDS_FURTHER_AUDIT | RT-RB-S0-04 owns isolated rebuild lab definition. |
| Hero visual implementation | `components/hero-section.tsx` static image hero, search, CTAs | REPLACE_CANDIDATE | Source of Truth approves future cinematic hero; current implementation is not the target cinematic flow. |
| Hero search for tours | `HeroSearch` fetches `/api/trips` and navigates to tours | PRESERVE | Current Home search is real tour discovery and uses production data; future Flight Planner must not falsely present real flight integration. |
| Trip/tour catalog section | `ReservationsSection` -> `TripList` -> `TripGrid` -> `TripCard` | PRESERVE | Existing published tours and reservation path are functional product data. |
| Trip card visual style | `TripCard` dark cards with image, metadata, favorite state, CTA | ADAPT | Visual treatment may change, but data fields and CTA behavior should remain unless separately approved. |
| Published trips query | `TripList` Prisma query with `isPublished: true` | PRESERVE | Production data behavior; changing it risks exposing unpublished data or hiding tours. |
| `/api/trips` suggestions endpoint | `app/api/trips/route.ts` | PRESERVE | Used by current hero search; also a reusable boundary for future discovery UI. |
| Traveler support cards | `components/testimonials.tsx` using `HomePage.TravelerSupport` copy | ADAPT | Same semantics as the trip card row: the support content is product behavior that stays (`HomePage.TravelerSupport` keys `orientation`, `languages`, `handoff` in `messages/*.json`, matching the Source of Truth emphasis on human/local support and AI handoff), while the dark `Card` presentation in `components/testimonials.tsx` is visual treatment that may change in the rebuild. Not replaced and not removed, so the disposition is adaptar rather than manter. |
| Header navigation | `components/header.tsx`, `components/mobile-menu.tsx` | NEEDS_FURTHER_AUDIT | Header is shared public infrastructure; RT-RB-S0-03 explicitly includes navbar inventory. |
| Footer navigation and Cadastur | `components/footer.tsx`, `/cadastro/cadastur.png` | PRESERVE | Source of Truth explicitly requires Cadastur preservation and accurate claims. |
| AI Concierge widget | `PublicLayout` plus `components/ai-concierge/ai-concierge-widget.tsx` | PRESERVE | Source of Truth says AI Concierge remains strategic part of Home. |
| AI Concierge current mock backend | `app/api/ai-concierge/route.ts`, `mock-backend.ts` | NEEDS_FURTHER_AUDIT | Current UI is mocked/safe; future integration depth is outside RT-6. |
| Theme toggle | `ThemeProvider`, `ThemeToggleButton` | NEEDS_FURTHER_AUDIT | Shared layout behavior; current Home is mostly hard-coded dark, but controls affect shared UI. |
| Global Tailwind tokens/classes | `app/globals.css` | PRESERVE | Shared design-system surface; do not alter without scoped plan. |
| Motion primitives | `motion/react`, `gsap` mobile menu | NEEDS_FURTHER_AUDIT | Existing motion must be considered before GSAP/ScrollTrigger prototype. |
| Existing video/media assets | `public/videos/*`, `public/images/*`, `docs/assets/*` | NEEDS_FURTHER_AUDIT | RT-RB-S0-03 owns asset inventory; Source of Truth says final media needs optimized derivatives. |
| Current Home dark shell/background gradients | `app/[locale]/(public)/page.tsx` inline styles/classes | REPLACE_CANDIDATE | Visual wrapper is likely superseded by rebuild lab but currently contains no business logic. |
| SEO metadata | `generateMetadata`, `RootLayout.metadata`, sitemap/robots helpers | PRESERVE | Language alternates and social metadata are production behavior. |
| Analytics attribution cookie | `proxy.ts`, `lib/analytics/attribution.ts` | PRESERVE | Current tracking infrastructure is global and should not be broken by visual rebuild. |
| REMOVE / REMOVER | No candidates identified in RT-RB-S0-02 based on current evidence | REMOVE: none identified | The repository and Source of Truth evidence reviewed for this audit do not justify removing any current Home functionality at this stage. |

### Disposition Coverage

Each Jira Definition of Done category is listed separately so it can be audited on its own. Counts refer to item rows in the matrix above.

- `PRESERVE` / `MANTER` (11 rows): Localized public Home route; Existing app foundation; Hero search for tours; Trip/tour catalog section; Published trips query; `/api/trips` suggestions endpoint; Footer navigation and Cadastur; AI Concierge widget; Global Tailwind tokens/classes; SEO metadata; Analytics attribution cookie.
- `ADAPT` / `ADAPTAR` (2 rows): Trip card visual style; Traveler support cards. Both keep their underlying data/content and behavior while their visual treatment sits inside the rebuild's visual scope.
- `REPLACE_CANDIDATE` / `SUBSTITUIR` (2 rows): Hero visual implementation; Current Home dark shell/background gradients.
- `REMOVE` / `REMOVER` (0 rows): no candidates identified, as recorded in the explicit matrix row above.
- `NEEDS_FURTHER_AUDIT` (6 rows, research status outside the four Jira DoD dispositions): Home rebuild isolation; Header navigation; AI Concierge current mock backend; Theme toggle; Motion primitives; Existing video/media assets. These are unresolved in RT-RB-S0-02 and are owned by RT-RB-S0-03/04/05; they are not a fifth disposition.

## Unknowns

- The repository does not contain the approved Figma wireframe 2.0, so this audit cannot compare current Home implementation against the visual source.
- The current repo does not show the future rebuild lab route; RT-RB-S0-04 must decide its exact route and isolation boundaries.
- Current production/staging values for `DATABASE_URL`, `PUBLIC_SITE_URL`, Better Auth, and AI Concierge flags are not visible in repo.
- The final Flight Planner external API/credential contract is not present; Source of Truth says no real flight integration should be presented until documentation/API validation exists.
- Asset ownership/optimization status for all Home media is not fully audited here; RT-RB-S0-03 owns that broader asset inventory.

## Sprint 0 Implications

### RT-RB-S0-03

Focus the inventory on assets, SEO, analytics, AI Concierge, navbar, and footer because all are already reachable from the current Home path. Important starting points: `public/videos`, `public/images`, `public/cadastro/cadastur.png`, `app/[locale]/(public)/page.tsx`, `app/[locale]/layout.tsx`, `proxy.ts`, `app/sitemap.ts`, `app/robots.ts`, `components/header.tsx`, `components/footer.tsx`, and `components/ai-concierge/ai-concierge-widget.tsx`.

### RT-RB-S0-04

The rebuild lab should avoid mutating `app/[locale]/(public)/page.tsx` until a preview/lab route is defined. It also needs an explicit decision on whether to reuse `PublicLayout` with its shared header and AI Concierge or create a lab-specific route group/layout to prevent public-route regressions.

### RT-RB-S0-05

Baseline screenshots/performance should target the localized Home route, preferably `/{defaultLocale}` (`/pt`) and any middleware-resolved root behavior. Measurements should capture database-backed trip rendering, hero search API behavior, header/mobile menu, AI Concierge flag state, and current dark Home shell so later comparisons distinguish visual changes from data/API failures.
