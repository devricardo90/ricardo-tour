# Sprint 7 — AI Concierge: current-state audit and RT-67 readiness

- Date: 2026-10-04. Scope: audit and readiness only. No product code, env or Jira-closing action.
- Foundation documents: RT-68 `rt-68-concierge-knowledge-source-contract.md`, RT-69 `rt-69-concierge-ingestion-process.md`, RT-70 `rt-70-concierge-persistence-retention-draft.md`, RT-71 `rt-71-concierge-handoff-contract.md`, RT-72 `rt-72-concierge-rate-limit-architecture.md`, RT-73 `rt-73-concierge-observability-contract.md`, RT-74 `rt-74-concierge-safety-failure-contract.md`.
- Prior documents (kept, not superseded): `ai-concierge-rag-strategy.md`, `ai-concierge-robust-backend-learning-architecture.md`.

## 1. Audit result (read-only)

| Item | Finding | Evidence |
| --- | --- | --- |
| API route | `POST /api/ai-concierge` (`app/api/ai-concierge/route.ts`): checks flag, parses JSON, validates with `parseAIConciergeRequest`, returns `createMockAIConciergeResponse`. `force-dynamic`. | file read |
| Mock backend | `lib/ai-concierge/mock-backend.ts`: fixed canned answer per locale, `responseKind: "mock"`, `handoffRequired: true`, no retrieval, no model, no persistence. Hash id `mock-<fnv>`. | file read |
| Contract | `lib/ai-concierge/contract.ts`: max message 800 chars; locales `en, pt, es, sv`; `pageContext` (path ≤200, surface); response has `sourceRefs` (kind only `mock_contract`), `safetyFlags`, `suggestedNextQuestions`. Error codes: `FEATURE_DISABLED`, `INVALID_REQUEST`, `MOCK_BACKEND_ERROR`. | file read |
| Feature flag | `lib/ai-concierge/config.ts`: `AI_CONCIERGE_ENABLED` ?? `NEXT_PUBLIC_AI_CONCIERGE_ENABLED`; truthy/falsy strings; **if unset: disabled in production, enabled elsewhere.** | file read |
| Production flag value | Both variables exist in Vercel for Preview and Production as `Config` (value not displayed by the CLI). | `vercel env ls` |
| **Live endpoint state** | **`POST https://rick-travel.vercel.app/api/ai-concierge` returned HTTP 200 with the mock response** on 2026-10-04. The mock route is reachable in production. | one benign probe request `{"locale":"en","message":"hi"}` |
| Widget | `components/ai-concierge/ai-concierge-widget.tsx` (floating chat, calls the API with locale, message, pageContext). Mounted only in `app/[locale]/(public)/layout.tsx` when the flag is on. The `(site)` layout deliberately does not mount it. Live check: the label "Abrir AI Concierge" does not appear on `/pt`, `/pt/tours`, `/pt/contato`. | file read; curl |
| Home shell | `components/ai-concierge-section.tsx` + `ai-concierge-shell.tsx`: "coming soon" visual shell; comment states Home never calls the API. | file read |
| Prompts / system instructions | **None exist.** No model, no prompt, no provider SDK in `package.json`; no AI-related env keys in `.env.example`. | grep |
| RAG documentation | `ai-concierge-rag-strategy.md` (documentary: allowed sources, collections, chunking, conservative retrieval, guardrails) and `ai-concierge-robust-backend-learning-architecture.md` (topology, stack, conceptual DB, API, safety, phases). Neither is implemented. | file read |
| Analytics hooks | `lib/analytics/client.ts` → `POST /api/analytics` → Prisma `analyticsEvent`. Event type is a **Prisma enum with 5 values** (`TOUR_VIEWED`, `RESERVE_CLICKED`, `CHECKOUT_STARTED`, `PIX_GENERATED`, `PAYMENT_CONFIRMED`); the route rejects unknown types and stores free-form `metadata`. No Concierge events exist. | file read |
| Rate limiter | `lib/security/rate-limit.ts`: per-instance in-memory sliding window; file header states it is not distributed. **The Concierge route does not call it at all** (usage is the tour-request and contact actions). Client key from `x-forwarded-for`. | file read; grep |
| Persistence | None. No Concierge/conversation model in `prisma/schema.prisma`. The mock stores nothing; the widget keeps messages in component state only. | grep |
| WhatsApp / contact | `lib/public-contact.ts` is the canonical source: WhatsApp `+55 22 99846-1906` (`wa.me/5522998461906`), `contato@ricardotour.com`. `buildPublicWhatsAppUrl(message?)` exists. The widget copy says "Final confirmations stay with human support" but has **no actual handoff link/button**. | file read |
| Content used by Concierge | None (mock is canned). | file read |
| Tests | `tests/ai-concierge-contract.test.ts`, `e2e/ai-concierge.spec.ts` (opens widget, sends message, expects the mocked answer). | file list |
| Locale coverage | Contract and widget cover `pt, en, es, sv`; `sv` copy is English text. | file read |

## 2. Findings that need attention

1. **F1 (high): the mock route is publicly reachable in production**, despite the standing rule that the mock endpoint must stay disabled (RT-67 constraint; project decision to never expose it). The widget is not rendered on the main site pages, but anyone can call the API. The mock is harmless in content (canned text, no data) but it violates the gate. **Not changed in this execution** because it requires a production environment change. Owner decision: set `AI_CONCIERGE_ENABLED=false` (and `NEXT_PUBLIC_AI_CONCIERGE_ENABLED=false`) in Production, or approve the agent to do so, then redeploy.
2. **F2:** the Concierge endpoint has no rate limit of any kind; a real backend would expose model cost to unauthenticated traffic (RT-72).
3. **F3:** the analytics enum and route cannot carry Concierge events without a schema change and a metadata allowlist (RT-73).
4. **F4:** `sv` locale is offered with English copy; the Owner has not stated the language policy (RT-68).
5. **F5:** no handoff UI exists although the mock always sets `handoffRequired: true` (RT-71).

## 3. Ticket state after this execution

| Ticket | Deliverable | Status |
| --- | --- | --- |
| RT-68 | knowledge source contract | drafted; **Owner approval of the source inventory required** |
| RT-69 | ingestion/update process | drafted; depends on RT-68 approval |
| RT-70 | persistence/retention | **draft only**; retention durations `OWNER_LEGAL_DECISION_REQUIRED` |
| RT-71 | handoff contract | drafted; email identity depends on RT-61 |
| RT-72 | rate-limit architecture | drafted; vendor not selected; shared with RT-82 decision |
| RT-73 | observability contract | drafted; needs schema decision when implemented |
| RT-74 | safety/failure contract | drafted; needs Owner review of refusal/handoff wording |
| RT-75 | Owner gate | open; not started |
| RT-67 | real backend | **not started; not ready** (§4) |

No ticket is marked complete: each acceptance criterion involves Owner approval or implementation that does not yet exist.

## 4. RT-67 readiness

**RT-67 is NOT ready.** Jira dependencies are RT-68, RT-69, RT-70, RT-74. Blockers, in order:

| # | Blocker | Owner of the action |
| --- | --- | --- |
| 1 | RT-68 source inventory approved by the Owner (Tier 1 list, language policy, which price data may be quoted) | Owner |
| 2 | Tier 1 content actually exists and is approved: policies (cancellation, payment, pre-booking), official business info, approved Rio content. None of this was invented here; see RT-68 §4 for the gaps | Owner |
| 3 | RT-69 process approved, including who may approve and publish | Owner |
| 4 | RT-70: Owner/legal decisions on whether conversations are stored, retention durations, consent/notice, deletion; Privacy page alignment (RT-RB-L-05) | Owner + legal |
| 5 | RT-74 reviewed by the Owner; refusal and handoff wording approved per language | Owner |
| 6 | RT-72: shared-limiter decision (with RT-82) and a store available in all environments | Owner decision, then implementation |
| 7 | RT-73: decision to extend the analytics enum or create a separate Concierge event store | engineering, after RT-70 |
| 8 | Model/provider decision (not in scope of any foundation ticket): which LLM/embedding service, cost ceiling, data-processing terms | Owner |
| 9 | F1 resolved: production mock route disabled | Owner approval |
| 10 | Production domain not required for RT-67 itself; RT-71 e-mail identity depends on RT-61 | — |

RT-67 also must not run in parallel with the Flight integration without Owner authorization (ticket constraint); that is currently moot because Flight is externally blocked.

When all of 1–9 are satisfied, RT-67 can start with: replace `mock-backend` behind the unchanged request contract, keep the flag default off in production, and pass RT-75 before enabling.
