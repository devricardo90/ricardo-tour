# Oner widget — production integration evidence

Status: integration code live (commit 7148a62). Production render confirmed by the Owner; search/new-tab/checkout/mobile validation still PENDING (see §6). Jira: RT-91 (implementation), RT-39 (evidence), RT-40 (blocked). Classification: PROVIDER_CONFIRMED / OBSERVED / INFERRED / UNKNOWN.

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
- New-tab destination, results location, checkout and payment ownership, branding, EN/ES: **UNKNOWN** — not observed.

## 6. Production evidence

PROVIDER_CONFIRMED
- Widget configured for Ricardo Tour; installation authorized; official CSS/script/custom element (§1).
- Widget works only on the domain registered in the Oner form.

OWNER_OBSERVED
- `https://ricardotour.com/pt/oner-lab`: `WIDGET_RENDER = PASS`.
- Visible products: Voos, Hotéis, Pacotes (Voo + Hotel), Carros, Exclusivos, Seguros.
- Search UI shows trip type, passengers, origin, destination, departure date, return date, search CTA.
- `https://rick-travel.vercel.app/pt/oner-lab`: provider shows "Não autorizado! Infelizmente o conteúdo não pode ser exibido." → `DOMAIN_RESTRICTION = CONFIRMED BY OBSERVATION`. Expected provider behavior, not a defect; no bypass is attempted (no widget on vercel.app/localhost).

Still UNKNOWN (not observed by anyone yet): CONSOLE_ERRORS, NETWORK_ORIGINS beyond static.onertravel.com, search execution, new-tab behavior and destination domain, results location, checkout/payment/issuance ownership, branding, state on return, mobile status, style isolation, EN/ES.

`API_INTEGRATION = NOT_CONFIRMED`. The visible products are widget UI, not API capability.

## 7. Commercial V1 — preliminary analysis (no option promoted)

The live widget already exposes six product categories (flights, hotels, packages, cars, exclusives, insurance). Rebuilding that breadth in RT-38 would need an API we do not have (RT-40 blocked), plus the order/payment architecture of RT-65. That favors A or C in the near term and leaves B as a future target once API access exists. The decision needs the §6 UNKNOWNs closed first, in particular checkout/payment ownership and what new-tab opens.

## 8. `/pt/voos` promotion proposal (NOT implemented)

Proposal only, pending Owner gate: `/pt/voos` = Ricardo Tour branded header/intro → `OnerWidget` (existing adapter, PT only) → Ricardo Tour assistance/handoff section (WhatsApp/e-mail, reusing `OnerWidgetFallback` contact block). RT-38 code and history stay in the repo (`FlightPlanner`, `lib/flights/*`), reachable e.g. under a lab route. `/en/voos` and `/es/voos` unchanged until Oner confirms languages. Indexing, Home entry and sitemap are separate Owner decisions. Needed before promotion: closed §6 UNKNOWNs, mobile validation, Owner approval.
