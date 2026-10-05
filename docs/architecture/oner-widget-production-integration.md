# Oner widget — production integration evidence

Status: integration code pushed (commit 7148a62). **Production validation PENDING** (see §6). Classification: PROVIDER_CONFIRMED / OBSERVED / INFERRED / UNKNOWN.

## 1. Provider evidence (PROVIDER_CONFIRMED)

- Oner e-mail (relayed by the Owner): widget configured for the store; proceed with installation (step 3).
- Authorized domain: `https://www.ricardotour.com`. The widget does not render in local, edit or development environments.
- `WIDGET_INTEGRATION = PROVIDER_CONFIRMED`, `DOMAIN_AUTHORIZATION = PROVIDER_CONFIRMED`, `API_INTEGRATION = NOT CONFIRMED` (nothing about API is inferred).

Official code: stylesheet `https://static.onertravel.com/widget/search/production/styles.css`; element `<befly-widget language="pt-br" new-tab="true">` inside `<div id="wrapper">`; script `https://static.onertravel.com/widget/search/production/widget-befly.js`.

## 2. Adapter architecture

`components/site/oner/`
- `oner-widget-loader.ts` — only file that knows provider URLs. Injects the CSS `<link>` and the async `<script>` once (id-guarded), module-level singleton promise, 15 s timeout, failed load removes the script so retry works. The script is never copied into the repo.
- `oner-widget.tsx` — client component. States loading / ready / error. The `<befly-widget>` is rendered only after the script loads (no provider DOM in SSR/hydration). Attributes exactly `language="pt-br" new-tab="true"`. Typed JSX declaration for the custom element (one scoped eslint exception for the required namespace).
- `oner-widget-fallback.tsx` — Ricardo Tour fallback ("Não foi possível carregar o motor de busca agora.") with WhatsApp +55 22 99846-1906 and contato@ricardotour.com from `lib/public-contact.ts`. No provider inventory, no RT-38 mock.
- `oner-widget-events.ts` — `oner_widget_page_view|load_started|loaded|load_failed` as a window `CustomEvent` (`ricardotour:oner-event`). Not persisted: `AnalyticsEventType` is a Prisma enum (tour domain). No `handoff_clicked` is emitted: clicks inside the provider widget are not observable without scraping its DOM.

Route: `app/[locale]/(site)/oner-lab/page.tsx` → `/pt/oner-lab`. noindex/nofollow, not in `app/sitemap.ts`, no link from Home/header/footer, other locales return 404 (EN/ES codes unknown). `/pt/voos` and RT-38 untouched.

Loader chosen over `next/script` because it gives retry-after-failure and guaranteed single CSS+script injection across remounts.

## 3. Security / CSP

Audit: no CSP header exists (no `headers()` in `next.config.ts`, no `vercel.json`, nothing in `proxy.ts`). Nothing needed allowlisting; no policy was added or weakened. If a CSP is introduced later, start with `https://static.onertravel.com` only and add further origins only after observing production network calls (UNKNOWN today).

## 4. Local validation (OBSERVED)

`tsc --noEmit` clean; eslint clean on new files; `next build` passes; `next start`: `/pt/oner-lab` 200 with `<meta name="robots" content="noindex, nofollow">`, loading state in SSR, no `befly-widget` in SSR HTML, `/en/oner-lab` 404, not in sitemap, no link from `/pt`; `git diff --check` clean. Provider CSS (200, 93 KB) and JS (200, 1.8 MB) are reachable from the provider origin.

## 5. Known limitations / open points

- `id="wrapper"` is kept per provider snippet; it is a generic id (no site CSS targets it today).
- Whether the widget registers `befly-widget` lazily, uses shadow DOM or iframes: UNKNOWN until observed in production.
- Products (flights / hotels / flight+hotel), new-tab destination, checkout and payment ownership, branding, EN/ES: **UNKNOWN** — not observed.

## 6. Production validation — NOT DONE

At the time of writing `https://www.ricardotour.com/pt/oner-lab` returned 404 (deployment of 7148a62 not yet live or not auto-deployed from `main`) and the Chrome extension was not connected, so no live observation was possible. All fields below are UNKNOWN: WIDGET_RENDER, CSS_LOAD, SCRIPT_LOAD, CONSOLE_ERRORS, NETWORK_ORIGINS, DESKTOP_STATUS, MOBILE_STATUS, PRODUCTS_OBSERVED, search/new-tab/checkout/payment behavior, style isolation.

## 7. Commercial V1 recommendation

None yet — it must be based on production evidence. Options A (widget as `/pt/voos`), B (RT-38 awaiting API), C (hybrid shell → provider flow) remain open; C is the lowest-risk candidate only if the widget renders and hands off as expected.
