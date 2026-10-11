# Sprint 8 — Launch Readiness: independent preparation (2026-10-11)

Authority: Owner directive of 2026-10-11 (prepare Sprint 8 independently; keep production gates). Governance check: the Source of Truth (§5 state 8, "do not auto-start the next sprint while an Owner gate is pending") and Jira contain no explicit prohibition on preparatory work; the sprint itself was NOT opened or transitioned. Nothing was published, purchased or provisioned.

## RT-44 — Playwright critical flows (Revisar candidate)
- `playwright.public.config.ts` + `e2e/public/public-critical-flows.spec.ts` (`npm run test:e2e:public`): read-only, no DB setup, no persisted submissions. Desktop + Pixel 7.
- Covers Home, Tours, Tour detail, About, Contact (empty submit blocked), nav, language, 404, OG/JSON-LD, and "concierge API closed" (opt-in `E2E_EXPECT_CONCIERGE_OFF=1`, run against a default-flag build).
- Result: 34/34 passed on a local production build (`NEXT_DIST_DIR=.next-prod`, port 3200). Finding: `/quem-somos` has no link in the Home header.

## RT-45 — Lighthouse (baseline, local prod build, mobile emulation, machine under load)
| Page | Perf | A11y | BP | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| /pt | 35 | 96 | 100 | 92 | 5.6 s | 6.8 s |
| /en | 37 | 96 | 100 | 92 | 8.0 s | 8.5 s |
| /pt/tours | 61 | 100 | 100 | 92 | 4.6 s | 0.9 s |
| /pt/contato | 60 | 96 | 100 | 92 | 3.8 s | 2.0 s |
| /pt/quem-somos | 48 | 100 | 100 | 92 | 6.2 s | 2.3 s |
SEO 92 = `canonical` points at the fallback host locally (PUBLIC_SITE_URL unset); verify on production host. Home TBT/JS bootup (chunk 3794, ~46 KiB unused JS) is the main bottleneck — needs a quiet-machine re-measure and a Home-level decision. Applied: first two tour cards load eagerly (LCP not lazy). Not applied: logo served at w=3840 (515 KiB savings), about-portrait lazy LCP.

## RT-46 — Accessibility (non-final baseline)
Applied: footer link accessible names now contain their visible text (WCAG 2.5.3, PT/EN/ES). Open, Owner decision (identity colour): `#8A6A2B` on `#F3EFE6` at 13 px = 4.38:1 (needs 4.5:1); contact `h2` gold also fails. Remaining label mismatches on contact/about WhatsApp buttons. Final validation still depends on unfinished Home/Flight work.

## RT-47 — SEO
Added: default OG image route `/{locale}/og` (brand artwork only, no photos → no RT-79 rights question), wired into Home, Tours, Contact, About, Planner; `TravelAgency` JSON-LD on Home and `TouristTrip` on tour detail (no Cadastur/rating/guarantee claims); unit tests. Open: validate with Google Rich Results / social debuggers on the production host (needs RT-63 host live); tour OG images use catalog photos (rights: RT-79).

## Not touched (blocked / out of scope)
RT-50 (needs hosting decision), RT-82/RT-72 (production Upstash), RT-84 (needs RT-64 persistence decision), RT-48 (depends on RT-66, RT-73, RT-66 not started), RT-83 (HYBRID, real devices by Owner).
