# RT-UX-001E - Basic Multilingual SEO Fix

Date: 2026-06-16
State: REVIEW
Type: minimal SEO implementation + validation

## Scope

Implemented the minimal multilingual SEO correction after RT-UX-001D:
- Add `alternates.languages` for public multilingual pages.
- Add `x-default`.
- Preserve locale-specific canonical URLs.
- Add sitemap alternate language links.
- Fix minimal public internal links that were using raw `next/link` and could lose locale.
- Document the decision to keep PT slugs in non-PT locales for this task.

## Restrictions Preserved

- No Home video removal.
- No typography or visual hierarchy changes.
- No hero, card, or footer design changes.
- No broad copy rewrite.
- No route architecture change.
- No package or lockfile change.
- No dependency install.
- No deploy.
- No AI Concierge work.
- No booking, payment, user, or admin behavior change.
- No new READY task.
- `.agents/` and `skills-lock.json` were not touched.

## Git Status Before Work

Command:

```powershell
git status --short --untracked-files=all
git rev-parse --short HEAD
git rev-parse --short origin/main
git status -sb
```

Result:

```text
HEAD: f42c707
origin/main: f42c707
branch: main...origin/main
untracked before work:
?? .agents/
?? skills-lock.json
```

Notes:
- Starting HEAD was exactly `f42c707`.
- `main` and `origin/main` were synchronized.
- Existing untracked `.agents/` and `skills-lock.json` were left untouched.

## Files Changed

```text
app/[locale]/(public)/contato/page.tsx
app/[locale]/(public)/page.tsx
app/[locale]/(public)/quem-somos/page.tsx
app/[locale]/(public)/tours/[id]/page.tsx
app/[locale]/(public)/tours/page.tsx
app/[locale]/register/page.tsx
app/sitemap.ts
components/about/cta-final.tsx
components/about/hero-section.tsx
components/auth-status.tsx
i18n/routing.ts
docs/validation/multilingual-seo-fix-001e.md
docs/ops/backlog.md
docs/ops/status.md
docs/ops/session-handoff.md
docs/ops/execution-log.md
```

## Implementation Summary

`i18n/routing.ts`:
- Added `localeCodes`, `defaultLocale`, and `SupportedLocale`.
- Added `getLocalePath()`.
- Added `getLanguageAlternates()` for page metadata.
- Added `getAbsoluteLanguageAlternates()` for sitemap entries.

Public metadata:
- Added `alternates.languages` to home, tours, tour detail, contato, and quem-somos.
- Added `x-default` through the shared alternates helper.
- Preserved per-locale canonical URLs.
- Added minimal metadata for `quem-somos` only to emit canonical, alternates, and route-specific `og:url`.

Sitemap:
- Added `alternates.languages` with absolute URLs for static and tour detail entries.
- Confirmed generated XML includes `xhtml:link rel="alternate"` for `en`, `pt`, `es`, `sv`, and `x-default`.

Locale-aware links:
- Replaced raw `next/link` with the existing `@/i18n/routing` `Link` in:
  - `app/[locale]/register/page.tsx`
  - `components/about/hero-section.tsx`
  - `components/about/cta-final.tsx`
  - `components/auth-status.tsx`

## Route Validation

Local server:
- Initial sandboxed dev-server start failed with `spawn EPERM`.
- Dev server was started with approval for local validation.
- URL: `http://127.0.0.1:3217`.

| Route | Expected | Actual |
|---|---:|---:|
| `/pt` | 200 | 200 |
| `/en` | 200 | 200 |
| `/es` | 200 | 200 |
| `/sv` | 200 | 200 |
| `/sitemap.xml` | 200 | 200 |
| `/robots.txt` | 200 | 200 |

Content types:

```text
/pt          200 text/html; charset=utf-8
/en          200 text/html; charset=utf-8
/es          200 text/html; charset=utf-8
/sv          200 text/html; charset=utf-8
/sitemap.xml 200 application/xml
/robots.txt 200 text/plain
```

## Rendered Metadata Validation

Rendered home routes:

| Route | Canonical | hreflang en | hreflang pt | hreflang es | hreflang sv | x-default |
|---|---|---:|---:|---:|---:|---:|
| `/pt` | `https://rick-travel.vercel.app/pt` | yes | yes | yes | yes | `https://rick-travel.vercel.app/pt` |
| `/en` | `https://rick-travel.vercel.app/en` | yes | yes | yes | yes | `https://rick-travel.vercel.app/pt` |
| `/es` | `https://rick-travel.vercel.app/es` | yes | yes | yes | yes | `https://rick-travel.vercel.app/pt` |
| `/sv` | `https://rick-travel.vercel.app/sv` | yes | yes | yes | yes | `https://rick-travel.vercel.app/pt` |

Example rendered HTML from `/pt`:

```html
<link rel="canonical" href="https://rick-travel.vercel.app/pt"/>
<link rel="alternate" hrefLang="en" href="https://rick-travel.vercel.app/en"/>
<link rel="alternate" hrefLang="pt" href="https://rick-travel.vercel.app/pt"/>
<link rel="alternate" hrefLang="es" href="https://rick-travel.vercel.app/es"/>
<link rel="alternate" hrefLang="sv" href="https://rick-travel.vercel.app/sv"/>
<link rel="alternate" hrefLang="x-default" href="https://rick-travel.vercel.app/pt"/>
```

Additional route check:

| Route | Canonical | x-default | og:url |
|---|---|---|---|
| `/pt/tours` | `https://rick-travel.vercel.app/pt/tours` | `https://rick-travel.vercel.app/pt/tours` | `https://rick-travel.vercel.app/pt/tours` |
| `/pt/quem-somos` | `https://rick-travel.vercel.app/pt/quem-somos` | `https://rick-travel.vercel.app/pt/quem-somos` | `https://rick-travel.vercel.app/pt/quem-somos` |

Note:
- React/Next renders the HTML attribute as `hrefLang` in captured source, mapping to the `hreflang` link relation attribute semantics.

## Sitemap Validation

Local `sitemap.xml` returns `200 application/xml`.

Confirmed generated alternates include absolute URLs:

```xml
<xhtml:link rel="alternate" hreflang="en" href="https://rick-travel.vercel.app/en" />
<xhtml:link rel="alternate" hreflang="pt" href="https://rick-travel.vercel.app/pt" />
<xhtml:link rel="alternate" hreflang="es" href="https://rick-travel.vercel.app/es" />
<xhtml:link rel="alternate" hreflang="sv" href="https://rick-travel.vercel.app/sv" />
<xhtml:link rel="alternate" hreflang="x-default" href="https://rick-travel.vercel.app/pt" />
```

## Robots Validation

Local `robots.txt` returns `200 text/plain`:

```text
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://rick-travel.vercel.app/sitemap.xml
```

## Internal Link Validation

Rendered `/en` internal href sample preserves the locale:

```text
/en
/en/contato
/en/quem-somos
/en/tours
/en/tours/{id}
```

Minimal source fixes changed only public/auth links that were directly related to locale preservation.

## PT Slugs in Non-PT Locales

Decision for this task:
- Keep existing slugs such as `/en/quem-somos` and `/en/contato`.
- Do not introduce localized pathnames in RT-UX-001E.

Reason:
- Localized slugs require a routing architecture decision and migration/redirect strategy.
- The task scope explicitly blocks route architecture changes.
- The current URLs are routable and now have canonical/hreflang/x-default metadata.

Remaining SEO limitation:
- Non-PT locale URL semantics are still weaker than fully localized slugs.
- A future task can evaluate localized pathnames and redirects separately.

## Validation Commands

```powershell
npm.cmd run lint
npm.cmd run typecheck
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/pt
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/en
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/es
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/sv
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/sitemap.xml
curl.exe --max-time 45 -L -s -o NUL -w '%{http_code} %{content_type}' http://127.0.0.1:3217/robots.txt
git diff --check
```

Results:
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- Local route checks: PASS.
- Local metadata inspection: PASS.
- Local sitemap alternates inspection: PASS.
- Local robots inspection: PASS.
- `git diff --check`: PASS, with known LF/CRLF warnings only.

## Scope Confirmation

Confirmed no diff in:
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `app/[locale]/layout.tsx`
- `components/hero-section.tsx`

No Home video, design, package, lockfile, deploy, AI Concierge, booking, payment, user, or admin changes were made.

## Recommendation

RT-UX-001E is ready for review.

Recommendation:
- Commit after reviewing the diff and validation evidence.
- Do not expand this task into localized slugs; handle that only through a separate route strategy task if desired.
