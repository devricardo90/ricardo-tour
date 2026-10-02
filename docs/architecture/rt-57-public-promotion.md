# RT-57 — Rebuilt Home promoted to the public route

Last block of the Public Routes Migration (RT-PRM-06). The rebuilt Home now serves `/pt`, `/en` and `/es` inside the `(site)` shell.
RT-36 (Owner Home Gate) is **not** closed by this ticket: `RT36_STATUS: BLOCKED_PENDING_OWNER_REVIEW`.

## What changed

| Area | Decision |
|---|---|
| Home | `app/[locale]/(site)/page.tsx` composes Hero → Plan your trip (inside the Hero module) → Experiences → Why Rick Travel → Rio Story → AI Concierge placeholder → About. Header and footer come only from `(site)/layout.tsx` (one `SiteHeader`, one `SiteFooter`). |
| Hero module | Moved out of the lab to `components/home/hero/` (git history kept). Only the lab scaffolding was removed: the Rebuild Lab review bar (preview label + PT/EN/ES lab links) and its CSS. Stage, timing, media, scroll and fallbacks are untouched. The accessible name of the Hero region keeps its text (`regionLabel`). |
| Legacy Home | `(public)/page.tsx` deleted. `(public)/layout.tsx` (HeroHeader + AI widget) stays only for `reservas`. |
| Lab | `/rebuild-lab/cinematic-3d-poc` is gone (404). The remaining lab routes are dev-only: `lib/rebuild-lab/config.ts` returns 404 in production unless `REBUILD_LAB_ENABLED` is set, they are `noindex`, not linked, not in robots allow/sitemap. Nothing public imports from the lab or reads the flag. |
| Anchors | `SiteAnchor`/`SiteHomeLink` render in-page hashes on the Home and `/{locale}#hash` links elsewhere. `HomeHashScroll` fixes cross-route landing (Next scrolled before the Hero's pinned stage existed and the Hero refresh reset the scroll to 0). |
| SEO | Per-locale title/description/canonical/OG on the Home; hreflang only for pt/en/es (+ x-default pt); `sv` is noindex and not advertised; sitemap = 4 public routes × 3 locales + the approved catalog trips (via `getPublicTrips`), no login/register; robots disallow admin/api/auth/reservas/lab. Missing `/og-image.jpg` and the stale `api.ricktravel.com` preconnect were removed. |
| `/api/trips` | `API_TRIPS_GATE: GATED` — uses `getPublicTrips()` (RT-53 catalog). Only former consumer (legacy Home search) is retired; Admin does not read it. |
| Legacy cleanup | Deleted (unreferenced after the Home retired): footer, hero-section, hero-search, reservations-section, testimonials, tours-header, contact-form, faqs-2, section-titles, plane-animation, logo, trip-grid/list, reservation-headers, `components/about/*`, `trips/{tour-actions,tour-detail-client,tour-filters,tour-media-badges,trip-card,trip-card-skeleton}`, home-header/home-footer wrappers, `ui/fade-in-section`. Kept for `reservas`/auth: `header`, `mobile-menu`, `auth-status`, `LanguageSwitcher`, `ThemeToggleButton`, `ai-concierge-widget`, `my-bookings`, `booking-confirmation`. |

## Production domain

`PRODUCTION_DOMAIN_VERIFIED: NO`. Evidence (2026-10-01): `ricardotour.com` is delegated to HostGator name servers that answer `SERVFAIL`
(`ns00080/ns00081.hostgator.com.br`); `ricktravel.com.br` returns `NXDOMAIN`; `rick-travel.vercel.app` serves (307 → `/pt`).
The canonical host therefore stays `PUBLIC_SITE_URL` (validated https, never localhost) with the Vercel default. Set `PUBLIC_SITE_URL`
when the domain resolves and is attached to the Vercel project.

## Launch debt recorded here (not fixed by RT-57)

1. **Remote content sync — BLOCKED.** Reading the remote database from this session was not permitted, so the environment could not be identified safely and no write was attempted. The two records (`cmlibniq40000z4zqkbujnutt`, `cmli1a6im000034zqqzc9sppb`) must receive the commit `024d705` wording through a guarded, targeted update by the Owner/maintainer (see `.tmp`-style cleanup pattern: refuse non-intended hosts, record before values, update only those two rows' description text).
2. **Email sender not verifiable.** `reservas@ricktravel.com.br` sits on a domain that does not exist in DNS, so it cannot be verified in Resend. No test email was sent. Persistence is unaffected (the submission is stored first; the notification is best-effort). Decide the sending domain, verify it in Resend, then change the sender.
3. **Durable rate limit** stays per-instance (`NOT_YET`); no Redis/CAPTCHA added.
4. **Hero media** still `PROTOTYPE_ONLY` / `RIGHTS_NOT_VERIFIED` (RT-24/27); there is also no verified Open Graph image, so `og:image` is omitted instead of pointing to a missing file.
5. **Privacy / Terms** pages do not exist; no legal links were added and no legal copy was invented.
6. Unreferenced generic UI primitives and barrels (`components/index.ts`, `ui/accordion|avatar|select|slider|switch|skeleton|infinite-slider|progressive-blur`, `components/logos/*`) remain for a later cleanup.
7. Home body text now renders in the public Inter font (previously the lab's system font), consistent with `/tours`, `/contato`, `/quem-somos`.

## Remote content sync — values for the later targeted update (REMOTE_CONTENT_SYNC: BLOCKED_NOT_VERIFIED)

Canonical tracked source (`data/real-trips.json`, commit `024d705`) and the local database are correct. The remote database was
**not** read or written. When the remote environment can be identified explicitly and safely, update only these two `Trip` rows,
only the `description` JSON (every locale key whose text contains the old string), recording before values first.
Do not run `scripts/import-real-trips.mjs` (matches by title and upserts every trip).

| Trip id | Title | Field | Old text (remove) | Canonical text |
|---|---|---|---|---|
| `cmlibniq40000z4zqkbujnutt` | Confeitaria Colombo + City Tour Rio | `description` | `Inclui transporte confortável e guia credenciado.` | `Inclui transporte confortável e acompanhamento guiado.` |
| `cmlibniq40000z4zqkbujnutt` | Confeitaria Colombo + City Tour Rio | `description` (included-services line, if present as text) | `Guia turístico credenciado` | `Guia turístico` |
| `cmli1a6im000034zqqzc9sppb` | Tour Favela Rocinha com Guia Local | `description` | `com guia especializado e experiência segura.` | `com guia especializado e experiência guiada na Rocinha.` |

Verification after the update: no `credenciad` / `experiência segura` match in any `Trip.description` row, and `/pt|en|es/tours/{id}` for both ids shows the canonical wording.
