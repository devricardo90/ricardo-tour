# Oner widget — production integration evidence

Status: LIVE. Public route /pt/planeje-sua-viagem (RT-91), commercial V1 = Option C (hybrid). See §6–§9. Jira: RT-91, RT-39 (open), RT-40 (blocked).

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
- Payment, issuance and refund ownership, mobile behavior, EN/ES: **UNKNOWN** — not observed (see §7).

## 6. Production evidence

PROVIDER_CONFIRMED
- Widget configured for Ricardo Tour; installation authorized; official CSS/script/custom element (§1).
- Widget works only on the domain registered in the Oner form.

OWNER_OBSERVED
- `https://ricardotour.com/pt/oner-lab`: `WIDGET_RENDER = PASS`.
- Visible products: Voos, Hotéis, Pacotes (Voo + Hotel), Carros, Exclusivos, Seguros.
- Search UI shows trip type, passengers, origin, destination, departure date, return date, search CTA.
- `https://rick-travel.vercel.app/pt/oner-lab`: provider shows "Não autorizado! Infelizmente o conteúdo não pode ser exibido." → `DOMAIN_RESTRICTION = CONFIRMED BY OBSERVATION`. Expected provider behavior, not a defect; no bypass is attempted (no widget on vercel.app/localhost).

Search execution, destination and branding are now OWNER_OBSERVED (§7). Still UNKNOWN: CONSOLE_ERRORS, NETWORK_ORIGINS beyond static.onertravel.com and compraviagem.com.br, state on return, mobile status, style isolation, payment/issuance/refund ownership, EN/ES.

`API_INTEGRATION = NOT_CONFIRMED`. The visible products are widget UI, not API capability.

## 7. Owner-observed commercial flow (production)

Classification: PROVIDER_CONFIRMED / OWNER_OBSERVED / OWNER_DECISION / INFERRED / UNKNOWN.

OWNER_OBSERVED
- Flow: Ricardo Tour production site → Oner widget → search criteria → BUSCAR → `compraviagem.com.br/ricardotour/...` (example route pattern `/ricardotour/flight-list?...`).
- Destination is **not** a Ricardo Tour DNS subdomain: it is a Ricardo Tour-branded tenant/path inside the Comprar Viagem domain (Comprar Viagem / Oner ecosystem).
- The downstream page shows the Ricardo Tour identity/logo area; the environment is provider-hosted but Ricardo Tour-branded.
- Real inventory: results with airlines, departure/arrival, duration, connections, baggage/filter options, prices, price details, Select CTA, commercial filters; hundreds of options for the example search. `REAL_INVENTORY_DISPLAY = CONFIRMED_BY_OBSERVATION`. This is not API access (`API_INTEGRATION = NOT_CONFIRMED`).

Observed boundary (OWNER_OBSERVED / appears)
- Ricardo Tour owns: public site, brand positioning, Rio experiences/tours, discovery, customer relationship, search entry, human support handoff, marketing.
- Oner / Comprar Viagem owns or appears to own: live inventory, result rendering, filtering, commercial selection flow, provider-hosted downstream commerce.

Responsibility classification
| Item | Status |
| --- | --- |
| Results rendering/ownership | OWNER_OBSERVED (provider-hosted) |
| Checkout ownership | INFERRED (provider-hosted flow; checkout step not observed) |
| Payment ownership | UNKNOWN |
| Reservation / issuance ownership | UNKNOWN |
| Refund / cancellation ownership | UNKNOWN |
| Agency commission on sale | Owner statement; contractual terms not provider-confirmed in this repo |
| Mobile behavior | UNKNOWN (not yet tested) |
| EN/ES localization | UNKNOWN (PROVIDER_CONFIRMATION_REQUIRED) |

The Owner's view that the Ricardo Tour-branded provider flow supports customer trust is **OWNER_DECISION / product reasoning**, not a provider endorsement.

## 8. Product positioning and commercial V1 (OWNER_DECISION)

- Primary positioning remains **tours, experiences and Rio services**. Flights/hotels/packages are complementary services and must not become the dominant visual identity. The search engine is a journey tool.
- **Option C (hybrid) is approved for V1**: Ricardo Tour shell → Oner widget → provider-hosted Ricardo Tour-branded commerce. Revisit only if API access later gives a strong reason to migrate.
- RT-38 is preserved as historical UX work and a possible future custom/API-based planner. Not deleted.
- Routes unchanged. Open product question: the widget covers Flights, Hotels, Flight + Hotel, Cars, Exclusives and Insurance, so `/pt/voos` may be semantically too narrow. Candidate future route: `/pt/planeje-sua-viagem` (or another Owner-approved route). No rename now.

## 9. Public activation (Owner validated desktop + mobile on https://www.ricardotour.com/pt/planeje-sua-viagem)

OWNER_OBSERVED: DESKTOP = PASS, MOBILE = PASS, ONER_WIDGET = PASS, LAYOUT and BRAND_INTEGRATION approved. END_TO_END_BRAND_CONTINUITY = PASS.

OWNER_DECISION / implemented
- Public route `/pt/planeje-sua-viagem` (PT only; EN/ES equivalents wait for provider localization). `TRAVEL_PLANNER_PUBLIC_ACTIVE = true` in `lib/travel-planner/config.ts`: indexable, canonical `https://www.ricardotour.com/pt/planeje-sua-viagem`, listed in `app/sitemap.ts`.
- `/pt/voos` → `/pt/planeje-sua-viagem` permanent redirect (HTTP 308) in `next.config.ts`. `/en/voos` and `/es/voos` unchanged.
- `/pt/oner-lab` retired (route removed → 404). Its source remains in Git history (commit 7148a62). The shared `OnerWidget` adapter is kept and used by the public page.
- RT-38 (`FlightPlanner`, `lib/flights/*`, `/en|/es/voos`) preserved as historical UX work and future custom/API planner foundation.

Still UNKNOWN / not claimed: payment, issuance and refund responsibility; API access (`API_INTEGRATION = NOT_CONFIRMED`); provider languages beyond pt-br. Analytics events are Ricardo Tour-owned only and not persisted (see §2).
