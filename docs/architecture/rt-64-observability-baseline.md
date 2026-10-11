# RT-64 — Minimal observability baseline (errors and performance)

- Ticket: RT-64 `[RT-RB-F-07]` (Sprint 5, no dependencies). Acceptance: "Errors in public routes/forms/API surface somewhere reviewable; baseline documented." Scope out: no heavy vendor rollout; the final monitoring review is RT-RB-L-09 (Sprint 8).
- Owner constraints applied: preserve the RT-73 architecture, no purchases or migrations, privacy-preserving, no vendor.

## 1. Overlap analysis with RT-73 (live Jira, 2026-10-10)

| | RT-64 | RT-73 |
| --- | --- | --- |
| Scope | Whole site: server actions, API routes, rendering, browser errors, Core Web Vitals | AI Concierge only: usage, handoffs, refusals, errors and latency of the Concierge |
| Status | READY, no dependencies | Revisar (delivered, `lib/ai-concierge/observability`) |
| Data | Error class + sanitized message + route; vitals + path | 11 approved product events, runtime metrics, cost estimate, alert evaluators |

**Verdict: independent, no duplicated functionality.** RT-73 never covered generic errors or web vitals; RT-64 does not touch Concierge events, metrics, alerts or cost logic. The only shared piece is the PII redactor (`redactPersonalData`), which RT-64 imports instead of reimplementing. The Concierge keeps its own structured events (`ai_concierge_runtime`); RT-64 adds two site-wide event types (`site_error`, `web_vital`) in the same one-JSON-line-per-event style. RT-48 (final audit, Sprint 8) and RT-RB-L-09 remain the places to review and, if approved, to add a persistent sink.

## 2. What was built

| Piece | File | Behaviour |
| --- | --- | --- |
| Sanitizer | `lib/observability/sanitize.ts` | Truncates input to 2,000 characters before any regex runs, redacts e-mail/CPF/cards/Brazilian and international phones, Bearer/Basic and `key=value` credentials, base64-like tokens, removes query strings, withholds all `Prisma*` error messages (they echo call arguments), bounds output (300), keeps only a path (ids collapse to `:id`), allows only safe error names/digests |
| Reporter | `lib/observability/report.ts` | `reportServerError`, `reportWebVital`: one JSON line to stdout/stderr; never throws; no stack, headers, cookies or bodies; release = commit SHA (12), env = `VERCEL_ENV` |
| Uncaught server errors | `instrumentation.ts` (`onRequestError`) | Covers render, route handlers, server actions and the proxy: route pattern + type + sanitized message + digest |
| Handled errors | forms (`contact-message`, `tour-request`), `api/analytics`, `api/bookings` (+ `[id]`), `api/trips` (+ `[id]`), sitemap, e-mail/notification services | Former `console.error` calls now go through the reporter with a stable `where` label |
| Browser errors | `app/[locale]/error.tsx`, `app/global-error.tsx`, `ErrorFallback` | Friendly PT/EN/ES page with retry and the canonical WhatsApp link; no technical detail shown; reports once |
| Web vitals + uncaught browser errors | `WebVitalsReporter` (mounted in the locale layout, invisible) | CLS, FCP, INP, LCP, TTFB for 20% of page loads, path only; `window` `error` / `unhandledrejection` outside React boundaries (max 5 per page) as `client_runtime` |
| Intake | `POST /api/observability/client` | Same-origin only (`Sec-Fetch-Site`/`Origin` vs host; 403 otherwise), JSON content type (415), declared and actual size cap 2 KB (413), strict zod schema (400), 60 reports/minute per IP and 600/minute in total, both **per server instance** (429); replies 204 on success. Per-instance limiters, so no commands are spent from the shared Upstash Free quota |

For errors thrown in server components, the server and browser records share the Next.js `digest`, so they can be correlated; client-only errors have no digest.

## 3. Where the data can be reviewed, and the limits (stated plainly)

- Reviewable in the hosting platform's runtime logs (filter by `"event":"site_error"` or `"event":"web_vital"`). On **Vercel Hobby, runtime log retention is short (about one hour)**, so this baseline is a *live-reviewable* surface, not a history. A persistent sink (log drain, database table or vendor) is a Launch Readiness decision, together with the commercial hosting plan (`docs/ops/launch-readiness-infrastructure-dependencies.md`). The reporter is the single place to add it.
- The framework's own error output (including raw stack traces) still appears in the platform logs next to our sanitized record; the sanitized record is the one meant for review and sharing.
- Vitals are field data from a 20% sample with no user identifier; they are directional, not a Lighthouse substitute (RT-RB-S6-02).
- No alert rules exist yet; those need a destination (Launch Readiness).

- **Known limit:** free-text personal names cannot be detected deterministically; they are only kept out of logs for database errors (details withheld). Messages from other sources should not embed user input.
- **Out of scope here:** `app/actions/admin.ts` (authenticated admin surface) and the unused `app/actions/contact.ts` still use raw `console.error`; the Owner's criterion is public routes, forms and API. Candidates for RT-48's final audit.
- Hobby log retention: the "about one hour" figure is Vercel's published number as recalled at writing time and was not re-verified against the Vercel docs in this session.

## 4. Independent review (2026-10-11)

A separate agent reviewed the code adversarially: verdict **APPROVE WITH FIXES**. Findings and resolution: (1) sanitizer quadratic on huge messages → input truncated first, regression test; (2) PII/secret formats missed (phone separators, Bearer, base64, Prisma-echoed arguments) → fixed and tested, names documented as a limit; (3) web vitals could register twice on re-render → handler moved to module scope; (4) cross-site/non-JSON writes and body read before size check → origin, content-type, declared-size checks and a global ceiling; (5) error-page locale hydration mismatch → locale from route params; (6) uncaught browser errors not captured → listeners added; (7) wrong `PUT` label, imprecise doc claims → corrected. Log-injection, edge-safety of `instrumentation.ts`, the unchanged control flow of every edited catch block and the typing were checked and found sound.

## 5. Verification (2026-10-10/11)

- `tests/observability-baseline.test.ts` (14): sanitizing, never-throw, instrumentation hook without headers/cookies, intake accept/reject/limit, strict schema, wiring (no raw `console.error` left in the covered files), no vendor SDK or browser storage, no technical detail in the fallback UI.
- Real dev server and headless browser: a deliberately throwing page (temporary, removed) produced a `site_error` render record with the e-mail in the message redacted, a second `client_boundary` record from the browser with the same digest, and the friendly fallback page; a vital POST returned 204 and logged a `web_vital` line.
- Not verified: production-build behaviour on Vercel (log retention and `release` value), real INP/LCP values in a production browser, screen-reader behaviour of the fallback page.
