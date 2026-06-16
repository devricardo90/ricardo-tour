# RT-UX-001D - Multilingual Routes and SEO Audit

Date: 2026-06-16
State: REVIEW
Type: documentation-only audit

## Scope

Audited public multilingual routing and SEO structure for Rick Travel before any typography, hierarchy, visual, metadata, or route fix work.

Routes and artifacts checked:
- `/pt`
- `/en`
- `/es`
- `/sv`
- `/sitemap.xml`
- `/robots.txt`
- route locale structure
- locale middleware/proxy config
- message files
- metadata, canonical URLs, hreflang/alternates
- internal locale links

## Restrictions Preserved

- No design changes.
- No typography changes.
- No hero, card, footer, or visual hierarchy changes.
- No copy polish.
- No route fix.
- No metadata fix.
- No package, lockfile, or dependency changes.
- No deploy.
- No READY task opened.
- No commit.

## Git Status Before Work

Command:

```powershell
git status --short
```

Result:

```text
?? .agents/
?? skills-lock.json
warning: unable to access 'C:\Users\ricardodev/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\ricardodev/.config/git/ignore': Permission denied
```

Interpretation:
- Working tree already had unrelated untracked `.agents/` and `skills-lock.json`.
- Those files were not touched by this audit.

## Current Locale Route Structure

Relevant files found:

```text
app/[locale]/layout.tsx
app/[locale]/(public)/page.tsx
app/[locale]/(public)/tours/page.tsx
app/[locale]/(public)/tours/[id]/page.tsx
app/[locale]/(public)/quem-somos/page.tsx
app/[locale]/(public)/contato/page.tsx
app/[locale]/(public)/reservas/page.tsx
app/[locale]/(public)/reservas/[bookingId]/page.tsx
app/[locale]/login/page.tsx
app/[locale]/register/page.tsx
app/[locale]/admin/**
app/sitemap.ts
app/robots.ts
proxy.ts
i18n/routing.ts
i18n/request.ts
messages/en.json
messages/pt.json
messages/es.json
messages/sv.json
```

Locale config:

```ts
locales: ['en', 'pt', 'es', 'sv']
defaultLocale: 'pt'
```

Routing/proxy:
- No `middleware.ts` file was found.
- `proxy.ts` exists and calls `createMiddleware(routing)` from `next-intl/middleware`.
- `proxy.ts` excludes `/api`, `/_next`, and paths containing a dot.
- `/` redirects to `/pt` locally and in production.
- Unknown unprefixed paths such as `/foo` redirect to `/pt/foo`.

Messages:
- `messages/en.json`, `messages/pt.json`, `messages/es.json`, and `messages/sv.json` exist.

## Local Route Checks

Local dev server:

```powershell
npm.cmd run dev -- -p 3217
```

Note:
- The local start attempt wrote `spawn EPERM` to the temporary dev error log after the route checks.
- Local route checks still returned HTTP responses from `127.0.0.1:3217` while the port was available.
- No process was left listening on port `3217` at cleanup.

Home route status checks:

| Route | Expected | Local actual |
|---|---:|---:|
| `/pt` | 200 | 200 |
| `/en` | 200 | 200 |
| `/es` | 200 | 200 |
| `/sv` | 200 | 200 |
| `/sitemap.xml` | 200 | 200 |
| `/robots.txt` | 200 | 200 |

Static route sample from sitemap:

| Route group | Local actual |
|---|---|
| `/pt`, `/pt/tours`, `/pt/quem-somos`, `/pt/contato`, `/pt/login`, `/pt/register` | 200 |
| `/en`, `/en/tours`, `/en/quem-somos`, `/en/contato`, `/en/login`, `/en/register` | 200 |
| `/es`, `/es/tours`, `/es/quem-somos`, `/es/contato`, `/es/login`, `/es/register` | 200 |
| `/sv`, `/sv/tours`, `/sv/quem-somos`, `/sv/contato`, `/sv/login`, `/sv/register` | 200 |

Root behavior:

| URL | Local actual |
|---|---|
| `http://127.0.0.1:3217` | 307 to `/pt` |
| `http://127.0.0.1:3217/` | 307 to `/pt` |
| `http://127.0.0.1:3217/foo` | 307 to `/pt/foo` |

## Production Route Checks

Initial production checks with `Invoke-WebRequest` were not usable:
- first attempt failed with remote connection errors inside the sandbox;
- escalated attempt returned a PowerShell internal object-reference error;
- `curl.exe` was used for final HTTP evidence.

Production host:

```text
https://rick-travel.vercel.app
```

Home route status checks:

| Route | Expected | Production actual |
|---|---:|---:|
| `/pt` | 200 | 200 |
| `/en` | 200 | 200 |
| `/es` | 200 | 200 |
| `/sv` | 200 | 200 |
| `/sitemap.xml` | 200 | 200 |
| `/robots.txt` | 200 | 200 |

Direct route checks without following redirects:

| URL | Production actual |
|---|---|
| `https://rick-travel.vercel.app/pt` | 200, no redirect |
| `https://rick-travel.vercel.app/en` | 200, no redirect |
| `https://rick-travel.vercel.app/es` | 200, no redirect |
| `https://rick-travel.vercel.app/sv` | 200, no redirect |

Static route sample from sitemap:

| Route group | Production actual |
|---|---|
| `/pt`, `/pt/tours`, `/pt/quem-somos`, `/pt/contato`, `/pt/login`, `/pt/register` | 200 |
| `/en`, `/en/tours`, `/en/quem-somos`, `/en/contato`, `/en/login`, `/en/register` | 200 |
| `/es`, `/es/tours`, `/es/quem-somos`, `/es/contato`, `/es/login`, `/es/register` | 200 |
| `/sv`, `/sv/tours`, `/sv/quem-somos`, `/sv/contato`, `/sv/login`, `/sv/register` | 200 |

Root behavior:

| URL | Production actual |
|---|---|
| `https://rick-travel.vercel.app` | 307 to `/pt` |
| `https://rick-travel.vercel.app/` | 307 to `/pt` |
| `https://rick-travel.vercel.app/foo` | 307 to `/pt/foo` |

## Sitemap and Robots

Production `robots.txt`:

```text
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://rick-travel.vercel.app/sitemap.xml
```

Production `sitemap.xml`:
- Returns `200 application/xml`.
- Includes static URLs for all four locales.
- Includes tour detail URLs for all four locales.
- Uses canonical production host `https://rick-travel.vercel.app`.

Static sitemap examples:

```text
https://rick-travel.vercel.app/en
https://rick-travel.vercel.app/en/tours
https://rick-travel.vercel.app/en/login
https://rick-travel.vercel.app/en/register
https://rick-travel.vercel.app/en/quem-somos
https://rick-travel.vercel.app/en/contato
https://rick-travel.vercel.app/pt
https://rick-travel.vercel.app/es
https://rick-travel.vercel.app/sv
```

Observation:
- The sitemap uses Portuguese slugs for non-Portuguese locales (`/en/quem-somos`, `/en/contato`, etc.).
- This is routable and currently returns 200, but it is not localized URL semantics.

## Metadata, Canonical, Hreflang, Alternates

Production HTML excerpts confirmed for the four home routes:

| Route | html lang | title present | description present | canonical | og:url | hreflang |
|---|---|---|---|---|---|---|
| `/pt` | `pt` | yes | yes | `https://rick-travel.vercel.app/pt` | `https://rick-travel.vercel.app/pt` | missing |
| `/en` | `en` | yes | yes | `https://rick-travel.vercel.app/en` | `https://rick-travel.vercel.app/en` | missing |
| `/es` | `es` | yes | yes | `https://rick-travel.vercel.app/es` | `https://rick-travel.vercel.app/es` | missing |
| `/sv` | `sv` | yes | yes | `https://rick-travel.vercel.app/sv` | `https://rick-travel.vercel.app/sv` | missing |

Metadata implementation findings:
- `app/[locale]/layout.tsx` defines global metadata, `metadataBase`, default title/description, Open Graph, Twitter, and robots.
- `app/[locale]/(public)/page.tsx` defines localized home metadata and canonical.
- `app/[locale]/(public)/tours/page.tsx` defines localized tours metadata and canonical.
- `app/[locale]/(public)/tours/[id]/page.tsx` defines tour detail metadata and canonical.
- `app/[locale]/(public)/contato/page.tsx` defines contact metadata and canonical.
- `app/[locale]/(public)/quem-somos/page.tsx` does not define page-level metadata.
- No audited page emits `alternates.languages`, so no `hreflang` or `x-default` links are present.

Canonical implementation:
- Canonicals are present for audited home routes.
- Canonicals are locale-specific and absolute in rendered production HTML because `metadataBase` is configured.
- Canonicals do not establish cross-locale alternates.

## Internal Locale Links

Production-rendered home hrefs preserve locale prefix:

| Source route | Rendered internal locale hrefs observed |
|---|---|
| `/pt` | `/pt`, `/pt/tours`, `/pt/quem-somos`, `/pt/contato`, `/pt/tours/{id}` |
| `/en` | `/en`, `/en/tours`, `/en/quem-somos`, `/en/contato`, `/en/tours/{id}` |
| `/es` | `/es`, `/es/tours`, `/es/quem-somos`, `/es/contato`, `/es/tours/{id}` |
| `/sv` | `/sv`, `/sv/tours`, `/sv/quem-somos`, `/sv/contato`, `/sv/tours/{id}` |

Code-level risk:
- Main `header.tsx`, `footer.tsx`, `LanguageSwitcher.tsx`, hero and trip components mostly use wrappers from `@/i18n/routing`.
- Some public/about components use `next/link` directly with unprefixed hrefs, for example:
  - `components/about/hero-section.tsx`
  - `components/about/cta-final.tsx`
  - `components/faqs-2.tsx`
- `app/[locale]/register/page.tsx` imports `next/link` and uses `href="/login"` without locale wrapper.
- These did not break the rendered home href audit, but they are a consistency risk for client-side navigation from pages that render those components.

## Diagnosis for Reported `/en` 404

Current evidence does not reproduce the reported `/en` 404.

What is identifiable:
- Local `/en` returns 200.
- Production `/en` returns 200.
- Production `/en` returns 200 without redirect.
- `i18n/routing.ts` includes `en`.
- `messages/en.json` exists.
- `app/[locale]` structure supports `en`.
- `proxy.ts` runs `next-intl` routing for public non-asset paths.
- `sitemap.xml` includes `/en` and `/en/*` URLs.

Most likely explanations, based on current evidence:
- The reported 404 came from an earlier/stale production deployment or a transient edge/cache state before the current production alias was serving the latest routing.
- The reported smoke may have hit a different URL, branch, preview deployment, or path variant not captured in the current report.
- The current codebase does not show a direct, reproducible cause for `/en` home 404.

What remains a real routing/SEO issue even though `/en` is currently 200:
- Missing `hreflang`/`alternates.languages`.
- No `x-default`.
- Non-localized slugs in non-PT locales.
- Incomplete page-level metadata, especially `/[locale]/quem-somos`.
- Mixed usage of locale-aware `Link` wrappers and raw `next/link` in public components/pages.

## Findings

| Severity | Finding | Evidence | Impact |
|---|---|---|---|
| P1 | Reported `/en` 404 is not reproducible now | Local and production `/en` both return 200 | Cannot justify route fix without fresh failing evidence |
| P1 | `hreflang` alternates are missing | No `rel="alternate"` links found in production HTML | Search engines cannot reliably map language equivalents |
| P2 | `x-default` is missing | No alternates emitted | Default locale behavior is implicit only via redirect |
| P2 | Sitemap includes all locales but no alternate language annotations | `app/sitemap.ts` returns plain URL entries | Sitemap does not compensate for missing page-level hreflang |
| P2 | Non-PT locales use Portuguese slugs | `/en/quem-somos`, `/en/contato`, etc. | Routable but weaker multilingual SEO semantics |
| P2 | Some public links still use raw `next/link` | about/register components and pages | Risk of locale loss or inconsistent client navigation |
| P3 | `/quem-somos` lacks page-level metadata | no `generateMetadata` in that page | Falls back to layout metadata |
| P3 | Contact metadata is Portuguese-only | `contato/page.tsx` has fixed PT title/description/OG locale | Non-PT pages can render PT metadata |

## Recommendation for Next Task

Do not open the next task from this audit.

Recommended next task when authorized:
- Fix multilingual SEO and locale-link consistency.

Suggested scope for that future task:
- Add a shared helper for locale alternates/canonicals.
- Add `alternates.languages` and `x-default` for static public pages.
- Decide whether to keep Portuguese slugs across all locales or introduce localized pathnames through `next-intl` routing config.
- Add page-level metadata for `/[locale]/quem-somos`.
- Localize contact metadata.
- Replace raw public `next/link` usages that should preserve locale with the locale-aware `Link` wrapper.
- Validate `/pt`, `/en`, `/es`, `/sv`, sitemap, robots, canonical, hreflang, and internal links locally and in production after deployment.

## Final State

RT-UX-001D is in REVIEW.

No route, metadata, code, copy, design, dependency, deployment, database, or commit action was performed.
