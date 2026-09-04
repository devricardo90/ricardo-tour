# Current Home Inventory

## Baseline

- Branch: `main`
- HEAD: `db7eb01e20d2f18e1ac46fc4580e5d55aa1c6995`
- Origin main: `db7eb01e20d2f18e1ac46fc4580e5d55aa1c6995` (HEAD == origin/main, ahead 0, behind 0, worktree clean at start)
- Issue: RT-7
- Canonical code: RT-RB-S0-03
- Task: Inventariar assets, SEO, analytics, AI Concierge, navbar e footer
- Classification: AGENT (Jira labels `agent`, `rick-travel`, `sprint-0`, `visual-rebuild`)
- Sprint: Sprint 0 - Foundation & Audit (Jira sprint id 100, state ACTIVE, board 100)
- Jira Definition of Done: "Inventario completo e riscos de regressao registrados."
- Authoritative source: Google Doc "Rick Travel - Visual Rebuild Source of Truth" (Sprint 0 table, RT-RB-S0-03 row: mode AGENT, initial status BACKLOG, same DoD). No material conflict with Jira was found.
- Predecessor evidence: RT-RB-S0-02 / RT-6, REMOTE_DONE, artifact `docs/architecture/current-home-architecture-audit.md`, commit `db7eb01e20d2f18e1ac46fc4580e5d55aa1c6995`.

### Inventory scope

Repository-only. This inventory is built exclusively from files present in this repository at the HEAD above. It does not read production environment values, does not query the production database, does not run the application, and does not measure runtime behavior. Anything requiring those is recorded under Unknowns or Deferred Work rather than asserted.

## Inventory Method

- A repository reference (an import, a string literal path, a seed/data entry) is treated as evidence that an asset or module is used.
- The absence of a repository reference does **not** prove an asset is unused. It proves only that this repository, at this commit, does not name it.
- Asset paths can be supplied dynamically at runtime. `Trip.imageUrl` is a database column (`prisma/schema.prisma`), and trip images reach the UI through `components/trips/trip-card.tsx` -> `components/ui/optimized-image.tsx`. A production database row may therefore reference a `public/` file that no source file mentions.
- Prisma's default `imageUrl` (`prisma/schema.prisma:75` and migration `20260214184311_add_default_image_url`) points to `public/images/placeholder.svg`, and `scripts/import-real-trips.mjs:76` applies the same fallback. This is additional evidence that public assets may be selected through data/runtime paths, not only through component imports.
- Where an asset has zero references anywhere in the repository, it is classified `ASSET_UNREFERENCED_IN_REPO`. That label means exactly one thing: no repository reference was found.
- `ASSET_UNREFERENCED_IN_REPO` does not mean "unused", does not mean "orphan", and does not carry any deletion clearance. No asset in this document is cleared for deletion, because this task produced no evidence that could support such a clearance.
- Reference tiers used below:
  - `CODE` - referenced from `app/`, `components/`, or `lib/`.
  - `SEED_DATA` - referenced from `prisma/seed.ts` or `data/real-trips.json` (local seed material; the production database may differ).
  - `DOCS_ONLY` - referenced only from `docs/` (documentation or historical record, not a render path).
  - `NONE` - no reference found in `app/`, `components/`, `lib/`, `messages/`, `prisma/`, `data/`, `docs/`, `scripts/`, `e2e/`, `tests/`.
- Sizes are exact byte counts from disk at the baseline commit.
- Nothing in this task was created, deleted, moved, renamed, optimized, or modified except this document.

## Assets and Media

`public/` holds 35 files totalling **42,380,978 bytes (~40.4 MiB)** across 13 directories.

### Home render-path assets

| Item / Category | Repository Path | Type | Size | Repository References | Current Usage | Home / Shared / Global | Preservation Sensitivity | Rebuild Implication | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hero still image | `public/videos/imagem-rio-perfil.jpg` | JPEG | 589,790 | CODE (1) + DOCS (6) | Sole hero visual of the current Home | Home | MEDIUM - replaced by cinematic hero later | Hero is a REPLACE_CANDIDATE per RT-6; this file is its current media | `components/hero-section.tsx` (HeroMedia `next/image`) |
| Cadastur trust mark | `public/cadastro/cadastur.png` | PNG | 14,292 | CODE (1) + DOCS (5) | Rendered in footer trust block | Home only (footer is Home-mounted) | **HIGH - PRESERVE** | Cadastur must be preserved and not restated with invented claims | `components/footer.tsx:69` `src="/cadastro/cadastur.png"`, `:70` `alt="Cadastur"` |
| Image fallback | `public/images/placeholder.svg` | SVG | 571 | CODE (3) + PRISMA (2) + SCRIPT (1) + DOCS (1) + E2E (1) | Fallback for failed/absent trip images | Global shared UI | MEDIUM | Any new image component must keep a fallback path | `components/ui/optimized-image.tsx`, `lib/image-utils.ts`, `app/[locale]/admin/tours/new/page.tsx`, `prisma/schema.prisma:75`, `prisma/migrations/20260214184311_add_default_image_url/migration.sql:9`, `scripts/import-real-trips.mjs:76`, `e2e/global.setup.ts` |
| Trip photography (wired) | `public/images/trips/*` (8 of 14 files) | JPEG/JPEG2000 | see below | SEED_DATA and/or DOCS | Trip cards on Home via database rows | Home + tours routes | HIGH - product content | Card visual treatment is ADAPT per RT-6; the images themselves are product data | `prisma/seed.ts`, `data/real-trips.json`, rendered via `components/trips/trip-card.tsx` |

Trip images with a seed/data reference: `confeitaria-colombo-city-tour.jpeg` (4,912,694), `imagem-floresta-tijuca.jpg` (1,713,184), `imagem-buzios-praia.jpg` (888,256), `imagem-escadaria-selarao-brasil.jpg` (739,668), `imagem-helicoptero-cristo.jpg` (712,110), `imagem-igreja-centro-rio.jpg` (602,164), `imagem-tour-favela-rocinha.jpg` (488,515), `imagem-pao-de-acucar.jpg` (341,843).

### Non-Home code-referenced assets

| Item | Repository Path | Type | Size | References | Current Usage | Scope | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guide badge photo | `public/images/about/ricardo-guia-cracha.webp` | WebP | 2,174,935 | CODE (1) + DOCS (2) | About/our-story section | Non-Home public route | `components/about/our-story.tsx`, `docs/ops/backlog.md`, `docs/ops/status.md` |
| Plane graphic | `public/plane.svg` | SVG | 282 | CODE (1) | Plane animation component | Non-Home | `components/plane-animation.tsx` |

### ASSET_UNREFERENCED_IN_REPO

13 files, **11,716,599 bytes (~11.2 MiB)**, have no reference anywhere in the repository.

| Item | Repository Path | Type | Size | References | Classification | Rebuild Implication | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero video (alternate) | `public/videos/rio-de-janeiro-hero.mp4` | MP4 | 7,827,258 | NONE | `ASSET_UNREFERENCED_IN_REPO` | Largest single unreferenced file; candidate input or dead weight - not determined here | repo-wide search returned no match |
| Hero video (alternate) | `public/videos/video-site-hero.mp4` | MP4 | 1,675,960 | NONE | `ASSET_UNREFERENCED_IN_REPO` | Same as above | repo-wide search returned no match |
| Trip photo | `public/images/trips/imagem-vista-favela.jpg` | JPEG | 624,987 | NONE | `ASSET_UNREFERENCED_IN_REPO` | May be referenced by a production `Trip.imageUrl` row | repo-wide search returned no match |
| Trip photo | `public/images/trips/imagem-rio-carnaval.jpg` | JPEG | 612,516 | NONE | `ASSET_UNREFERENCED_IN_REPO` | May be referenced by a production `Trip.imageUrl` row | repo-wide search returned no match |
| Trip photo | `public/images/trips/imagem-casal-pao-de-acucar.jpg` | JPEG | 352,443 | NONE | `ASSET_UNREFERENCED_IN_REPO` | May be referenced by a production `Trip.imageUrl` row | repo-wide search returned no match |
| Trip photo | `public/images/trips/imagem-praia-ipanema.jpg` | JPEG | 328,433 | NONE | `ASSET_UNREFERENCED_IN_REPO` | May be referenced by a production `Trip.imageUrl` row | repo-wide search returned no match |
| Trip photo | `public/images/trips/imagem-confeitaria-colombo.jpg` | JPEG | 291,588 | NONE | `ASSET_UNREFERENCED_IN_REPO` | Near-duplicate name to the wired `confeitaria-colombo-city-tour.jpeg` (different file, 291,588 vs 4,912,694 bytes) | repo-wide search returned no match |
| Avatar placeholder x6 | `public/avatars/{camila,dany,julia,lucas,mariana,rafael}.jpg` | **SVG content with `.jpg` extension** | 569 each (3,414 total) | NONE | `ASSET_UNREFERENCED_IN_REPO` | Extension/content mismatch: `file` reports "SVG Scalable Vector Graphics image, ASCII text". All six have distinct md5 sums, so they are six distinct generated placeholders, not copies | `file public/avatars/camila.jpg`; `md5sum public/avatars/*.jpg` |

### Assets referenced only by documentation

9 files, **17,486,075 bytes (~16.7 MiB)**, are named only inside `docs/` and have no code or seed reference.

| Item | Repository Path | Size | References | Note |
| --- | --- | --- | --- | --- |
| Hero video (removed from Home) | `public/videos/newhero.mp4` | 7,936,616 | DOCS_ONLY | Referenced by `docs/validation/home-video-removal-001f.md`, which documents its removal from the Home, and `docs/ops/status.md:424`. The file remains on disk. |
| Testimonial photo | `public/images/testimonials/carlos-moura.webp` | 1,940,396 | DOCS_ONLY | `docs/ops/backlog.md` |
| Testimonial photo | `public/images/testimonials/danyela-viana.webp` | 1,866,540 | DOCS_ONLY | `docs/ops/backlog.md` |
| Testimonial photo | `public/images/testimonials/beyjamin-bonfim.webp` | 1,859,415 | DOCS_ONLY | `docs/ops/backlog.md` |
| About photo | `public/images/about/guide-ricardo.jpg` | 1,251,457 | DOCS_ONLY | `docs/app/locale/public/quem-somos/ASSETS_NEEDED.md`, `docs/ops/backlog.md` |
| Cadastur seal (second asset) | `public/images/seals/cadastur-official.png` | 1,186,157 | DOCS_ONLY | Named in 5 docs; **not** the file the footer renders. See Footer Inventory. |
| About photo | `public/images/about/founder-team.jpg` | 924,074 | DOCS_ONLY | `docs/app/locale/public/quem-somos/ASSETS_NEEDED.md`, `docs/ops/backlog.md` |
| Trip photo | `public/images/trips/imagem-morro-pao-de-acucar.jpg` | 507,864 | DOCS_ONLY | Named in 4 ops docs |
| Tourism logo | `public/logos/logo-turismo.webp` | 13,556 | DOCS_ONLY | `docs/ops/backlog.md:1249`, `docs/ops/backlog.md:1255`, `docs/ops/status.md:1034`; current `components/footer.tsx` renders `cadastur.png` only |

### Hero video material (17.4 MB group)

The Discussion Gate flagged approximately 17.4 MB of hero-video material. Exact evidence:

| File | Size (bytes) | Reference tier | Evidence |
| --- | --- | --- | --- |
| `public/videos/newhero.mp4` | 7,936,616 | DOCS_ONLY | `docs/validation/home-video-removal-001f.md`, `docs/ops/status.md:424` |
| `public/videos/rio-de-janeiro-hero.mp4` | 7,827,258 | NONE | `ASSET_UNREFERENCED_IN_REPO` |
| `public/videos/video-site-hero.mp4` | 1,675,960 | NONE | `ASSET_UNREFERENCED_IN_REPO` |
| **Total** | **17,439,834 (~16.6 MiB / 17.44 MB)** | | 41.2% of `public/` by size |

No video file is referenced by any component. The only media on the current Home hero path is the still image `public/videos/imagem-rio-perfil.jpg`, consistent with `docs/validation/home-video-removal-001f.md`. **No deletion, move, or optimization was performed, and none is recommended by this task** - the decision belongs to a later media sprint and requires Owner input.

### Empty asset directories

| Directory | File count | Note |
| --- | --- | --- |
| `public/icons/benefits` | 0 | Empty; `public/icons` itself contains no files, only these three subdirectories |
| `public/icons/trust` | 0 | Empty |
| `public/icons/values` | 0 | Empty |

Cross-reference: `docs/app/locale/public/quem-somos/ASSETS_NEEDED.md` records assets that were planned. The empty directories are consistent with planned-but-not-delivered icon sets, but this repository does not prove intent.

### Asset totals

| Measure | Bytes | Share of `public/` |
| --- | --- | --- |
| `public/` total (35 files) | 42,380,978 | 100% |
| `ASSET_UNREFERENCED_IN_REPO` (13 files) | 11,716,599 | 27.6% |
| Documentation-only reference (9 files) | 17,486,075 | 41.3% |
| No code or seed reference (22 files, sum of the two rows above) | 29,202,674 | 68.9% |
| Video files (3) | 17,439,834 | 41.2% |

## SEO Inventory

| Item | Repository Path | Current Behaviour | Scope | Preservation Sensitivity | Evidence |
| --- | --- | --- | --- | --- | --- |
| Sitemap | `app/sitemap.ts` | Prisma-backed. Static routes `""`, `/tours`, `/login`, `/register`, `/quem-somos`, `/contato` generated per locale, plus trip detail URLs; each entry carries `alternates.languages`; base URL from `PUBLIC_SITE_URL` | Global | **PRESERVE** (RT-6) | `app/sitemap.ts:1-25`, imports `getAbsoluteLanguageAlternates`, `routing`, `prisma` |
| Robots (App Router route) | `app/robots.ts` | `allow: "/"`, `disallow: ["/admin/", "/api/"]`, `sitemap: ${PUBLIC_SITE_URL}/sitemap.xml`. No `host` field | Global | PRESERVE | full file read |
| Robots (repository root) | `robots.ts` | `allow: "/"`, `disallow: ["/admin", "/login", "/register", "/reservas", "/api"]`, `sitemap: "https://ricktravel.com.br/sitemap.xml"`, `host: "https://ricktravel.com.br"`. Git-tracked (`git ls-files` matches) | Repository root, outside `app/` | **REGRESSION RISK** - see register | full file read; `git ls-files --error-unmatch robots.ts` succeeds |
| Site URL resolution | `lib/public-site-url.ts` | `PUBLIC_SITE_URL` env is used only if it is set, starts with `https://`, and does not contain `localhost`; otherwise falls back to `https://rick-travel.vercel.app` | Global | HIGH - drives sitemap, robots, canonical/OG URLs | full file read |
| Root metadata | `app/[locale]/layout.tsx` | Global `metadata` export built from `PUBLIC_SITE_URL`; preconnect to `https://api.ricktravel.com` | Global | PRESERVE | RT-6 audit, confirmed by grep |
| Home metadata | `app/[locale]/(public)/page.tsx` | `generateMetadata` from `HomePage.Metadata` translations, with language alternates | Home | PRESERVE | grep `generateMetadata` |
| Other route metadata | `contato/page.tsx`, `quem-somos/page.tsx`, `tours/page.tsx`, `tours/[id]/page.tsx` | Per-route `generateMetadata` | Non-Home public routes | PRESERVE | grep |
| OpenGraph / Twitter | same 6 files as metadata | `openGraph` and `twitter` keys present in all 6 metadata sources | Global + per route | PRESERVE | grep `openGraph|twitter` across `app`, `lib`, `components` |
| Locale / canonical handling | `i18n/routing.ts`, `proxy.ts` | Locales `en`, `pt`, `es`, `sv`; default `pt`; `getAbsoluteLanguageAlternates` supplies alternates to sitemap and metadata | Global | HIGH | RT-6 audit + `app/sitemap.ts` import |
| Structured data | - | **Absent.** No `application/ld+json` and no `schema.org` string anywhere in `app/`, `components/`, `lib/` | - | GAP | grep returned zero matches |
| Web manifest | - | **Absent.** No `app/manifest.ts` | - | GAP | `ls` reports no such file |

Total metadata sources: 6 files. Both robots implementations exist simultaneously; this document records that fact and does **not** decide which is correct or which domain is authoritative.

## Analytics Inventory

| Item | Repository Path | Role | Scope | Evidence |
| --- | --- | --- | --- | --- |
| Attribution middleware | `proxy.ts` | Runs on all non-API, non-`_next`, non-dotted paths. Builds attribution from URL params + referrer and writes the cookie with `httpOnly: false`, `sameSite: "lax"`, `secure` in production, `path: "/"`, `maxAge` 30 days | Global, includes Home | `proxy.ts` (full file) |
| Attribution cookie | `lib/analytics/attribution.ts` | `ANALYTICS_ATTRIBUTION_COOKIE = "ricktravel_analytics_attribution"`. Fields: `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`, `referrer`, `referrerDomain`, `landingPath`, `firstSeenAt`. Values truncated to 200 chars | Global | file head |
| Client emitter | `lib/analytics/client.ts` | `trackClientEvent`; session id in `sessionStorage` under `ricktravel-analytics-session-id`, generated with `crypto.randomUUID()` | Client | file head |
| Event catalogue | `lib/analytics/events.ts` | Exactly 5 event types: `TOUR_VIEWED`, `RESERVE_CLICKED`, `CHECKOUT_STARTED`, `PIX_GENERATED`, `PAYMENT_CONFIRMED` | Global | file head |
| Ingest route | `app/api/analytics/route.ts` | `POST`; validates the event type against the catalogue, resolves session via `auth.api.getSession`, reads the attribution cookie, delegates to `trackAnalyticsEvent` | Server | file head |
| Persistence service | `lib/services/analytics.service.ts` | Writes `AnalyticsEvent` rows | Server | import in route |
| Data model | `prisma/schema.prisma:154-166`, enum at `:257-263` | `AnalyticsEvent { id, type, userId, tripId, bookingId, paymentAttemptId, sessionId, path, metadata, createdAt }`; `enum AnalyticsEventType` mirrors the 5 names | Database | file read |

### Third-party analytics providers

Repository evidence shows **none**. A grep across `app/`, `components/`, `lib/` for `gtag`, `googletagmanager`, `@vercel/analytics`, `posthog`, `plausible`, and `next/script` returned zero matches.

| Provider | Present in repo | Evidence |
| --- | --- | --- |
| Google Tag Manager | NO | no `googletagmanager` match |
| gtag / GA | NO | no `gtag` match |
| Vercel Analytics | NO | no `@vercel/analytics` match |
| PostHog | NO | no `posthog` match |
| Plausible | NO | no `plausible` match |
| Any `next/script` tag loader | NO | no `next/script` match |

Analytics is entirely first-party: middleware cookie -> client emitter -> own API route -> own Postgres table.

### Home coverage gap

`trackClientEvent` is called from exactly two components, both on the tour-detail path:

- `components/trips/tour-actions.tsx:58`
- `components/trips/tour-detail-client.tsx:98`

No Home component emits an analytics event. The Home therefore contributes attribution-cookie data only. The 5 catalogued events are all booking/payment funnel events; there is no event for Home CTAs, hero search, Experiences, navbar, footer, or the AI Concierge. Recorded as a gap; adding events is out of scope here and is the subject of RT-RB-S6-05.

## AI Concierge Inventory

| Item | Repository Path | Role | Evidence |
| --- | --- | --- | --- |
| Widget | `components/ai-concierge/ai-concierge-widget.tsx` | Client component; floating entry button + `role="dialog"` panel; posts to `/api/ai-concierge`; uses `useLocale()` from `next-intl` | file head + grep |
| Mount point | `app/[locale]/(public)/layout.tsx:11,25` | `const aiConciergeEnabled = isAIConciergeEnabled();` then `{aiConciergeEnabled ? <AIConciergeWidget /> : null}` | full file read |
| API route | `app/api/ai-concierge/route.ts` | `POST`, `dynamic = "force-dynamic"`; returns 503 `FEATURE_DISABLED` when the flag is off; 400 on invalid JSON or contract failure; otherwise the mock response | full file read |
| Config / flag | `lib/ai-concierge/config.ts` | `isAIConciergeEnabled(env)` reads `AI_CONCIERGE_ENABLED ?? NEXT_PUBLIC_AI_CONCIERGE_ENABLED`; truthy set `{1,true,yes,on}`, falsy set `{0,false,no,off}` | full file read |
| Contract | `lib/ai-concierge/contract.ts` | `AI_CONCIERGE_MAX_MESSAGE_LENGTH = 800`; request `{locale, message, pageContext?}`; `pageContext.surface` in `public_site | tour_detail | contact | unknown`; response `{id, locale, answer, responseKind: "mock", handoffRequired, suggestedNextQuestions, sourceRefs, safetyFlags}`; error codes `FEATURE_DISABLED | INVALID_REQUEST | MOCK_BACKEND_ERROR` | file head |
| Mock backend | `lib/ai-concierge/mock-backend.ts` | `createMockAIConciergeResponse`; deterministic copy per locale | file head |

### Mount level, gating and boundaries

- **Mount level: LAYOUT.** The widget is mounted by `PublicLayout`, not by the Home page. It therefore appears on every route inside the `(public)` group, not only the Home.
- **The same flag gates both surfaces.** `isAIConciergeEnabled()` is called in `app/[locale]/(public)/layout.tsx` (mount) and again in `app/api/ai-concierge/route.ts` (API). UI and backend cannot drift apart via configuration.
- **Default is OFF in production.** With no flag set, `isAIConciergeEnabled` returns `false` when `VERCEL_ENV === "production"` or `NODE_ENV === "production"`, and `true` otherwise. On a production deployment with no flag configured, the widget is not mounted and the API returns 503.
- **Mock/real boundary:** `app/api/ai-concierge/route.ts` -> `createMockAIConciergeResponse`. The route contains no LLM call, no provider abstraction, no RAG, and no vector store. `responseKind` is the literal `"mock"` and `safetyFlags` includes `mock_backend`.
- **Human handoff (as evidenced):** the contract carries `handoffRequired: boolean` and the safety flags `human_handoff_required`, `no_price_confirmation`, `no_availability_confirmation`. The widget renders a handoff line per locale (`components/ai-concierge/ai-concierge-widget.tsx:42,57,72,87`), e.g. pt "Confirmacoes finais seguem com atendimento humano." The mock answers state that prices, availability, payment and final confirmation must be handled by the Rick Travel team. The widget itself contains no WhatsApp link; the WhatsApp handoff on the Home is a separate hero CTA built by `lib/whatsapp.ts` (`WHATSAPP_PHONE = "5521971168114"`, sources `home | tour_detail | bookings`).
- **Copy location:** widget UI copy and mock answers are hardcoded per-locale objects inside `ai-concierge-widget.tsx` and `mock-backend.ts`. They are **not** in `messages/*.json`, unlike the rest of the public site. In both `components/ai-concierge/ai-concierge-widget.tsx:74-87` and `lib/ai-concierge/mock-backend.ts:31-40`, the `sv` entry contains English text.
- **Environment key names only** (values not read, files not modified): `AI_CONCIERGE_ENABLED`, `NEXT_PUBLIC_AI_CONCIERGE_ENABLED`. Neither key appears in `.env.example`, which documents 10 keys: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY`, and four `E2E_*` keys. `PUBLIC_SITE_URL` is likewise absent from `.env.example`.

### Risk if the Home is replaced independently

Because the widget is mounted by the layout and not by the Home page, replacing the Home page alone keeps the Concierge. The inverse risk applies to a lab that defines its own layout: it would silently lose the Concierge mount. Recorded in the register.

## Navbar Inventory

| Item | Repository Path | Role | Client/Server | Mount level | Evidence |
| --- | --- | --- | --- | --- | --- |
| Header | `components/header.tsx` | `HeroHeader`, fixed header, scroll state via `useScroll` from `motion/react` | `"use client"` | **LAYOUT** - imported only by `app/[locale]/(public)/layout.tsx:2`, rendered at `:21` | file head + repo-wide grep |
| Mobile menu | `components/mobile-menu.tsx` | Bottom-sheet nav; animated with `gsap`; auth actions | `"use client"` | Dynamically imported inside `header.tsx` with `{ ssr: false }` | `components/header.tsx:15` |
| Language switcher | `components/LanguageSwitcher.tsx` | Locale switch | client | inside header | RT-6 audit |
| Theme toggle | `components/ThemeToggleButton.tsx` | Theme menu via `next-themes` | client | inside header | `components/header.tsx:9` |
| Auth status | `components/auth-status.tsx` | Session-aware desktop auth actions | client | inside header | `components/header.tsx:10` |
| Logo | `components/rick-travel-logo.tsx` | Inline SVG brand mark (no image asset) | server-compatible | header and footer | `components/header.tsx:4` |

### Navigation destinations

Defined once in `components/header.tsx:24-27`, using the localized `Link` from `@/i18n/routing`:

| Label key | Href |
| --- | --- |
| `Navigation.home` | `/` |
| `Navigation.about` | `/quem-somos` |
| `Navigation.tours` | `/tours` |
| `Navigation.contact` | `/contato` |

### Localization

`useTranslations('Navigation')`. Keys present in all four locale bundles (`messages/{en,pt,es,sv}.json`): `home`, `about`, `tours`, `contact`, `logoAria`, `openMenu`, `closeMenu`, and a `hints` object (`home`, `about`, `tours`, `contact`).

### Runtime dependencies

`motion/react` (scroll state), `gsap` (mobile menu only), `lucide-react` (icons), `next-intl`, `next/dynamic`, `better-auth` client plus `GET /api/auth/get-session` (through `auth-status.tsx` and `mobile-menu.tsx`), `next-themes` (through the theme toggle), Radix dropdown primitives.

### Shared-layout relationship

`HeroHeader` is rendered by `PublicLayout` and therefore appears on **all seven** `(public)` route pages: Home, `contato`, `quem-somos`, `tours`, `tours/[id]`, `reservas`, `reservas/[bookingId]`. A change to the header is a change to every public page, not to the Home alone.

## Footer Inventory

| Item | Repository Path | Role | Client/Server | Mount level | Evidence |
| --- | --- | --- | --- | --- | --- |
| Footer | `components/footer.tsx` | `FooterSection`; the only `<footer>` element in the codebase (`components/footer.tsx:33`) | `"use client"` | **HOME PAGE ONLY** | see below |

### Mount location - verified

`FooterSection` is imported in exactly one place in the entire application:

- `app/[locale]/(public)/page.tsx:13` - `const FooterSection = dynamic(() => import("@/components/footer"));`
- `app/[locale]/(public)/page.tsx:68` - `<FooterSection />`

A repository-wide grep for `components/footer` and `FooterSection` across `app/` and `components/` returns only these two lines plus the component's own definition. A grep for `<footer` returns a single match, `components/footer.tsx:33`.

**Consequence, stated as evidence:** of the seven `(public)` route pages, only the Home renders a footer. `contato`, `quem-somos`, `tours`, `tours/[id]`, `reservas`, and `reservas/[bookingId]` render no footer and therefore no Cadastur mark. This is an asymmetry with the header, which is layout-level. Recorded in the register; not changed by this task.

### Navigation destinations

Three columns, defined in `components/footer.tsx:12-30`, using the localized `Link`:

| Column (i18n key) | Links |
| --- | --- |
| `Footer.columns.company` | `Footer.links.home` -> `/`, `Footer.links.about` -> `/quem-somos` |
| `Footer.columns.services` | `Footer.links.tours` -> `/tours` |
| `Footer.columns.support` | `Footer.links.help` -> `/contato` |

### Contact and support

No direct contact channel is rendered in the footer: no phone number, no email address, no WhatsApp link. Support is a single link to `/contato`. The WhatsApp path exists elsewhere, on the Home hero CTA via `lib/whatsapp.ts`.

### Social links

**Absent.** No social network link or icon is present in `components/footer.tsx`.

### Localization

`useTranslations("Footer")`. Keys in all four bundles: `logoAria`, `description`, `columns.{company,services,support}`, `links.{home,pricing,help,about,tours}`, `cadasturLabel`, `copyright`. Note `links.pricing` exists in the message bundles but is not rendered by `components/footer.tsx` - an unused translation key.

### Cadastur presentation

| Aspect | Evidence |
| --- | --- |
| Asset actually rendered | `public/cadastro/cadastur.png` (14,292 bytes), via `components/footer.tsx:69` `src="/cadastro/cadastur.png"` |
| Alt text | `components/footer.tsx:70` `alt="Cadastur"` |
| Label | `components/footer.tsx:76` `{t("cadasturLabel")}` -> literal `"Cadastur"` in all four locales |
| Claim wording | The footer states the Cadastur label only. No certification number, guarantee, or additional claim is rendered. This is consistent with the Source of Truth requirement that Cadastur be preserved without invented certifications or claims. |
| Reachability | Home only, because the footer is Home-mounted |

### Second Cadastur / seal asset

`public/images/seals/cadastur-official.png` (1,186,157 bytes) exists and is named in five documents (`docs/app/locale/public/quem-somos/ASSETS_NEEDED.md`, `docs/ops/backlog.md`, `docs/ops/execution-log.md`, `docs/ops/session-handoff.md`, `docs/ops/status.md`) but is referenced by **no** component. Two Cadastur-related assets therefore exist; the one the site renders is the smaller `public/cadastro/cadastur.png`. Which asset is the intended official mark is not determined by this repository and is not decided here.

## Regression Risk Register

| # | Risk | Evidence | Potential Impact | Affected Surface | Later Owner / Task | Current Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Header is layout-level while footer is Home-level | `app/[locale]/(public)/layout.tsx:2,21` mounts `HeroHeader`; `app/[locale]/(public)/page.tsx:13,68` mounts `FooterSection` | A rebuild reasoning about "the Home" treats the two symmetrically and is wrong about one of them | Navbar, Footer | RT-8 (lab layout decision), RT-RB-S4-06 | DOCUMENT ONLY |
| 2 | AI Concierge is layout-level | `app/[locale]/(public)/layout.tsx:11,25` | A lab route with its own layout silently loses the Concierge mount; a lab reusing `PublicLayout` inherits it | AI Concierge | RT-8, RT-RB-S4-04 | DOCUMENT ONLY |
| 3 | Home-only replacement can remove the footer while keeping header and Concierge | Risks 1 and 2 combined; footer is imported by the Home page alone | Replacing `page.tsx` drops the footer, and with it the only Cadastur rendering on the site, while header and Concierge survive - so the loss is easy to miss in review | Footer, Cadastur | RT-8, RT-RB-S4-02, RT-RB-S4-06 | DOCUMENT ONLY |
| 4 | Footer, and therefore Cadastur, renders on the Home only | `FooterSection` imported at exactly one call site; single `<footer>` element in the codebase; 6 of 7 public pages render none | Cadastur is absent from `tours`, `contato`, `quem-somos`, and `reservas` today. Any judgement about "preserving Cadastur" that assumes site-wide presence is based on a false premise | Footer, Cadastur, trust | RT-RB-S4-02 / RT-RB-S4-06 | DOCUMENT ONLY |
| 5 | Two robots implementations with different domains and different disallow lists | `app/robots.ts` uses `PUBLIC_SITE_URL` (fallback `https://rick-travel.vercel.app`), disallow `["/admin/","/api/"]`; root `robots.ts` hardcodes `https://ricktravel.com.br` with `host`, disallow `["/admin","/login","/register","/reservas","/api"]`. Both are git-tracked | Crawl directives and the advertised sitemap domain may not match the live site; whichever file is inert represents stale guidance that a future edit could apply to the wrong one | SEO | RT-RB-S6-04 | DOCUMENT ONLY - no file removed, no domain chosen |
| 6 | Large media with no repository reference | 3 video files totalling 17,439,834 bytes; 2 of them with no reference anywhere, 1 named only in a removal-validation doc | Repository and deployment weight without demonstrated use; also a risk in the other direction, since deleting on repo evidence alone could destroy intended source material | Assets | Later media sprint (RT-RB-S3-04) + Owner | DOCUMENT ONLY |
| 7 | Database-driven asset references prevent proving repo-unreferenced assets are unused | `Trip.imageUrl` is a database column; trip images render through `components/trips/trip-card.tsx` -> `components/ui/optimized-image.tsx`; 5 of the 13 unreferenced files are trip photos in `public/images/trips/` | Acting on `ASSET_UNREFERENCED_IN_REPO` as if it meant "unused" could break live trip cards for production rows this repository cannot see | Assets | Later media sprint + Owner, requires production DB evidence | DOCUMENT ONLY |
| 8 | Two Cadastur assets, only one wired | `public/cadastro/cadastur.png` rendered by `components/footer.tsx:69`; `public/images/seals/cadastur-official.png` referenced only in docs | A rebuild could adopt the wrong seal or duplicate the trust mark; the official-looking filename is the one **not** in use | Footer, Cadastur, trust | RT-RB-S4-02 | DOCUMENT ONLY |
| 9 | Config keys absent from `.env.example` | `.env.example` documents 10 keys; `AI_CONCIERGE_ENABLED`, `NEXT_PUBLIC_AI_CONCIERGE_ENABLED` and `PUBLIC_SITE_URL` are not among them, yet all three change rendered output | An environment provisioned from `.env.example` alone silently disables the Concierge and falls back to the default site URL in metadata, sitemap and robots | AI Concierge, SEO | RT-8 (lab env) / RT-RB-S6-04 | DOCUMENT ONLY |
| 10 | AI Concierge defaults to disabled in production | `lib/ai-concierge/config.ts`: with no flag set, returns `false` when `VERCEL_ENV`/`NODE_ENV` is `production` | The Concierge may be absent from the production Home today. A rebuild comparing against production could conclude the feature does not exist | AI Concierge | RT-8 / RT-RB-S4-04 | DOCUMENT ONLY |
| 11 | No structured data and no web manifest | Zero `ld+json` / `schema.org` matches; no `app/manifest.ts` | Not a regression in itself, but a rebuild may assume these exist and later "preserve" nothing | SEO | RT-RB-S6-04 | DOCUMENT ONLY |
| 12 | Home emits no analytics events | `trackClientEvent` called only from `components/trips/tour-actions.tsx:58` and `components/trips/tour-detail-client.tsx:98`; catalogue is 5 booking/payment events | There is no Home behavioural baseline to compare a rebuilt Home against; "no regression in analytics" cannot be demonstrated for the Home | Analytics | RT-RB-S6-05 | DOCUMENT ONLY |
| 13 | AI Concierge copy lives outside the i18n bundles | Per-locale copy objects hardcoded in `ai-concierge-widget.tsx:42,57,72,87` and `mock-backend.ts`; both the widget `sv` UI block and the mock backend `sv` response block hold English text | Copy changes bypass the `messages/*.json` workflow; a locale audit over `messages/` reports the Concierge as fully translated when both the widget UI and mock response are not | AI Concierge, localization | RT-RB-S4-04 | DOCUMENT ONLY |
| 14 | Avatar assets are SVG content with `.jpg` extensions | `file public/avatars/camila.jpg` reports "SVG Scalable Vector Graphics image, ASCII text"; 569 bytes each; six distinct md5 sums | Any pipeline that trusts the extension (image optimization, `next/image`, an asset audit) will mis-handle them | Assets | Later media sprint | DOCUMENT ONLY |
| 15 | Unused translation key in the footer bundle | `Footer.links.pricing` present in all four `messages/*.json`; not rendered by `components/footer.tsx` | Minor. Suggests either a removed link or an unfinished one; a rebuild may resurrect a destination that was deliberately dropped | Footer, localization | RT-RB-S4-06 | DOCUMENT ONLY |
| 16 | Split motion stack persists on every public page | `motion/react` in `header.tsx`; `gsap` in `mobile-menu.tsx` (carried forward from RT-6) | Cinematic GSAP work in the lab adds a third usage pattern over two existing ones | Navbar, motion | RT-RB-S2-02 | DOCUMENT ONLY |
| 17 | Ops documentation and current footer diverge on trust marks | `docs/ops/backlog.md:1249`, `docs/ops/backlog.md:1255`, and `docs/ops/status.md:1034` record Cadastur plus `logo-turismo.webp` as added to the footer; current `components/footer.tsx:69` renders `cadastur.png` only, and repo search finds no current footer reference to `logo-turismo.webp` | A future rebuild consulting ops docs may reconstruct a two-seal footer that current code does not actually render | Footer, trust marks | RT-RB-S4-02 / RT-RB-S4-06 | DOCUMENT ONLY |
| 18 | Layout-level skip link is hardcoded in Portuguese | `app/[locale]/(public)/layout.tsx:19` renders `Pular para o conteúdo principal` outside the locale message bundles | The rebuild could preserve or duplicate a hardcoded Portuguese accessibility/navigation affordance across locales | Public layout, localization, accessibility | RT-RB-S4-06 / localization follow-up | DOCUMENT ONLY |

## Preservation / Sensitivity Summary

### PRESERVE_SENSITIVE

Confirmed by this inventory and consistent with RT-6 (no contradicting evidence found):

- **Footer + Cadastur** - `components/footer.tsx`, `public/cadastro/cadastur.png`, `Footer.cadasturLabel` in four locales. New detail: this rendering exists on the Home only (risk 4), and a second, unwired seal asset exists (risk 8).
- **AI Concierge** - widget, route, contract, config, mock backend. New detail: mounted at layout level and disabled by default in production (risks 2, 10).
- **SEO metadata** - 6 metadata sources, OpenGraph/Twitter across all of them, locale alternates, Prisma-backed sitemap.
- **Analytics attribution** - `proxy.ts` cookie pipeline and the first-party event chain through to `AnalyticsEvent`.
- **Global Tailwind tokens** - `app/globals.css` (unchanged from RT-6; not re-examined here).
- **Navigation destinations** - the four header routes and the three footer columns are live public routes.

### REBUILD_AFFECTED

- Hero still image `public/videos/imagem-rio-perfil.jpg` (hero is a REPLACE_CANDIDATE per RT-6).
- Footer and navbar visual treatment (RT-RB-S4-06), with structure preserved.
- Trip card visual treatment (ADAPT per RT-6); underlying trip images are product data.
- Header motion behaviour, once cinematic scroll work begins.

### NEEDS_OWNER_DECISION_LATER

- Disposition of the 17,439,834 bytes of video material.
- Which robots file and which domain are authoritative.
- Which Cadastur asset is the official mark.
- Whether the footer should become layout-level (a product decision about site-wide trust presence, not a refactor).
- Whether the 13 `ASSET_UNREFERENCED_IN_REPO` files are genuinely unused - requires production database evidence.

### NEEDS_FURTHER_AUDIT

- Production `Trip.imageUrl` values, to resolve the trip-photo subset of risk 7.
- Whether the root `robots.ts` is served (see Unknowns).
- Whether `public/icons/{benefits,trust,values}` were planned deliveries; `docs/.../ASSETS_NEEDED.md` is suggestive but not conclusive.
- RT-6 items still open and owned elsewhere: rebuild-lab isolation (RT-8), theme toggle behaviour, motion primitives.

RT-6 items closed by this inventory: **header navigation** (fully inventoried above) and **existing video/media assets** (inventoried with exact sizes and reference tiers).

## Deferred Work

### RT-RB-S0-04 / RT-8 - rebuild lab

- Decide the lab route and whether it reuses `PublicLayout` or defines its own. Inputs from this inventory: reusing it inherits header + Concierge but still not the footer; defining a new one loses both header and Concierge.
- Decide how the lab renders a footer, given the footer is currently Home-mounted.
- Decide lab environment flags, noting risk 9 (`AI_CONCIERGE_ENABLED`, `PUBLIC_SITE_URL` undocumented in `.env.example`).

### RT-RB-S0-05 / RT-9 - performance baseline

- Runtime measurement, Lighthouse / Core Web Vitals, screenshots, actual transfer sizes.
- Static inputs handed forward: 42,380,978 bytes in `public/`; hero path currently loads one still image; no video is on any render path.

### Later media / visual sprint (RT-RB-S3-04, RT-RB-S4-02)

- Video optimization or deletion decisions.
- Cadastur / seal representation decision.
- Avatar extension-mismatch cleanup.
- Empty `public/icons/*` directories.

### Later SEO QA (RT-RB-S6-04)

- Robots duplication and domain resolution.
- Structured data and web manifest decisions.

### Later Home implementation (RT-RB-S4-06)

- Visual redesign of navbar and footer.
- Footer mount-level decision.
- `Footer.links.pricing` unused key.

### Later analytics (RT-RB-S6-05)

- Home CTA, Experiences, Flights and AI Concierge events.

None of the above was executed in this task.

## Unknowns

Evidence-based only:

1. **Production database contents.** `Trip.imageUrl` rows may reference `public/` files this repository never names. The 13 `ASSET_UNREFERENCED_IN_REPO` entries cannot be resolved to "unused" without that evidence.
2. **Production `PUBLIC_SITE_URL`.** Not visible in the repository. The fallback is `https://rick-travel.vercel.app`, while the root `robots.ts` hardcodes `https://ricktravel.com.br`. Which domain is live is not established here.
3. **Whether the root `robots.ts` is served.** It is git-tracked and exports a valid `MetadataRoute.Robots` function, but it sits outside `app/`. Next.js App Router convention indicates only `app/robots.ts` produces `/robots.txt`; that is an **inference** from convention, not proof from this repository, and no runtime check was performed.
4. **Production environment values** for `AI_CONCIERGE_ENABLED`, `NEXT_PUBLIC_AI_CONCIERGE_ENABLED`, Better Auth keys and `DATABASE_URL`. Not read; only key names were inspected.
5. **Whether the AI Concierge is currently live in production**, which follows from unknown 4 and the production-default-off behaviour in `lib/ai-concierge/config.ts`.
6. **Figma wireframe 2.0** is not stored in this repository, so no comparison against the approved visual source was possible.
7. **Intent behind the unwired assets** - alternate hero videos, the `cadastur-official.png` seal, the docs-only `logo-turismo.webp`, the six avatar placeholders and the empty icon directories. Their presence is documented; why they exist is not established by repository evidence.
