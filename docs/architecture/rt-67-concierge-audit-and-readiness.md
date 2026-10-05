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
| 9 | F1 production mock route disabled | Resolved in §5.1; no longer a backend-start blocker |
| 10 | Production domain not required for RT-67 itself; RT-71 e-mail identity depends on RT-61 | — |

RT-67 also must not run in parallel with the Flight integration without Owner authorization (ticket constraint); that is currently moot because Flight is externally blocked.

When all of 1–9 are satisfied, RT-67 can start with: replace `mock-backend` behind the unchanged request contract, keep the flag default off in production, and pass RT-75 before enabling.

## 5. Execution update — 2026-10-04

Scope: final F1 safety correction, RT-68 source inventory proposal, and readiness re-check. The real backend remains unstarted.

### 5.1 F1 production mock safety

- Prior live probe evidence in §1 established that the mock route returned HTTP 200 in Production. Static review also showed that `AI_CONCIERGE_ENABLED=true` could override the default-off behavior.
- `lib/ai-concierge/config.ts` now makes Production an unconditional deny before reading either enable flag. The public layout therefore does not mount the interactive mock widget in Production, and `POST /api/ai-concierge` returns the existing `503 FEATURE_DISABLED` envelope even if an enable flag is set.
- The Home `AIConciergeSection` remains a visual-only “Em breve / Coming soon / Próximamente” shell with a disabled input and no API transport. It makes no live RAG, booking, price, availability, or provider claims.
- A targeted contract/route test asserts that an explicit Production enable flag still yields HTTP 503. Commit `09b26f7fc023ce393f13ef3b3a3e9ada1a89db5f` reached Vercel Production deployment `dpl_H1psjVqjneLUXiLhibPws9cM39Ha` (`READY`, alias `www.ricardotour.com`). One live POST to the existing `/api/ai-concierge` returned HTTP 503 with `FEATURE_DISABLED`; the request was rejected before parsing or storing its body.
- A live GET of `https://www.ricardotour.com/pt` returned HTTP 200. The response contains the Concierge section and “Em breve”/disabled composer, and does not contain the interactive “Abrir AI Concierge” widget entry. The shell has no API transport. Neither live check sent e-mail or created a contact, booking, or Concierge record.

### 5.2 RT-68 initial source inventory

The exact proposed allowlist is recorded in RT-68 §4.1–4.2. Existing KB inventory and seed-scope documents were reused rather than duplicated. No content was ingested. In particular, the old evidence register contains stale approved contact records (`contact@travelrick.com` and `+55 21 96681-9928`); the proposed inventory excludes those values and uses only the current canonical `lib/public-contact.ts` values (`contato@ricardotour.com`, `+55 22 99846-1906`) pending RT-68 Owner approval. No standalone approved Rio destination guide, payment/cancellation policy, or approved FAQ was found.

### 5.3 RT-67 readiness — not ready

| Category | Remaining gate |
| --- | --- |
| `OWNER_DECISION` | Approve RT-68 exact inventory and exclusions; approve any price use, locales (especially `sv`), freshness periods, RT-69 approver/publish process, model/provider and spend ceiling, and shared limiter approach with RT-82; complete RT-75 only after implementation/evaluation. |
| `LEGAL_DECISION` | RT-70 needs decisions on conversation persistence, retention, consent/notice, deletion, and Privacy page alignment. |
| `SECURITY_DEPENDENCY` | F1 is resolved and live-verified in Production (§5.1). Select/provision the shared distributed limiter with RT-82; finalize RT-74 safety/fallback policy and RT-73 content-free telemetry. No Concierge limiter currently exists. |
| `CONTENT_DEPENDENCY` | Owner approval/registration of the proposed catalog, business, contact, and narrow request/handoff sources; source reconciliation for old contact evidence; approved Rio content, FAQ, and operational policies are absent. |
| `IMPLEMENTATION_READY` | The F1 safety fix is deployed and live-verified. Real backend, retrieval, persistence, telemetry, distributed limits, and production enablement are not ready. |

### 5.4 Sprint 7 issue state

At this pre-decision snapshot, RT-67 through RT-75 were in Jira `BACKLOG / READY`. The Owner direction and final readiness recheck are recorded in §6. RT-67 did not start, RT-75 remains an unpassed Owner gate, and no Flight work is started while RT-39 awaits the external Oner dependency.

> The readiness and inventory statements in §§5.2–5.4 are a pre-Owner-decision snapshot. The current Owner foundation gate below supersedes their open-decision lists. Keep the historical F1 evidence in §5.1.

## 6. Owner foundation gate — current state (2026-10-04)

Scope: documentation and Jira evidence only. No real backend or ingestion has started. RT-75 remains open; Flight work remains blocked by RT-39 / Oner and is not in scope.

### 6.1 Foundation ticket state

RT-68 through RT-74 have the Owner direction recorded in their architecture contracts. This approves policy boundaries and technical requirements, but does not satisfy implementation/content/legal acceptance criteria. Keep RT-67 through RT-75 open; no ticket is closed by this decision alone.

| Category | Current assessment |
| --- | --- |
| `CLOSED` | F1 production mock safety is corrected and production-verified (§5.1). Owner policy decisions for the RT-68 source boundary, RT-69 deterministic lifecycle, RT-70 ephemeral persistence, RT-71 handoff, RT-72 provider-independent limiter requirements, RT-73 event categories, and RT-74 safety behavior are documented. Their Jira tickets remain open where implementation or other acceptance criteria remain. |
| `OWNER_DECISION_REQUIRED` | Current public About/institutional source copy in `components/site/about/about-copy.ts` and `components/about-rick-travel-section.tsx` still identifies as Rick Travel. The older `docs/product/ai-concierge-approved-public-business-evidence-values.md` also carries Rick Travel and superseded contacts. These are explicitly ineligible. Owner must provide/approve canonical Ricardo Tour wording at the current public paths or defer business/About knowledge from V1. RT-74 emergency/fixed localized wording also needs an approved copy decision. |
| `LEGAL_DECISION_REQUIRED` | RT-70 needs legally approved active-session expiry and retention periods for any minimal metadata, analytics, and operational logs; Privacy-page disclosure and consent treatment must be settled before public production enablement. |
| `SECURITY_DECISION_REQUIRED` | Resolve the shared distributed limiter and abuse-protection interface with RT-82; specify hashed abuse signals, fail-closed behavior, access/retention controls, and the global emergency stop. The existing in-memory limiter is not a production implementation for Concierge. |
| `MODEL_PROVIDER_DECISION_REQUIRED` | Select model and embedding/retrieval provider, supported region/data-processing terms, operational limits, expected usage, and budget/cost ceiling. No provider or arbitrary production quota is selected here. |
| `IMPLEMENTATION_READY` | The mock safety correction is implemented and verified. The Owner-approved contracts provide a basis for future work, but the real Concierge backend, ingestion, retrieval, persistence/metadata, analytics, limiter, localized fixed copy, and evaluation are not implemented; RT-67 as a whole is not ready to start. |

### 6.2 Approved knowledge boundary

- Approved exact source paths and scopes are in RT-68 §4.1: the published public catalog via `lib/catalog/public-trips.ts` and the localized tour/Experiences renderers; canonical contact in `lib/public-contact.ts`; current localized request/handoff wording in `components/site/tour/tour-request-copy.ts` and `components/site/contact/contact-copy.ts`.
- The About/institutional source class is approved, but its current checked-in copy is excluded until the legacy Rick Travel identity is reconciled with Owner-approved Ricardo Tour content. Do not infer facts from the domain or sender identity.
- No ingestion has occurred. No Rio guide, safety fact set, operational commercial policy, or Owner-approved FAQ is currently in the V1 inventory.
- Excluded facts include RAG prices, changing availability/schedules, Flight mock or Oner inventory, unverified web results, stale Rick Travel/travelrick content, superseded contacts, and unapproved generated FAQ/Rio facts.

### 6.3 Owner-approved operating policies

- **Pricing:** Never quote a tour price from RAG. Direct the visitor to the current product page or approved booking flow that displays the live/current commercial value.
- **Locale:** PT, EN, ES only. Use current approved localized content; do not expand or invent facts where a locale version is absent.
- **Freshness:** RT-69 lifecycle is `CANONICAL SOURCE → VALIDATE → NORMALIZE → VERSION → CHUNK / INDEX → PUBLISH → RETIRE / ROLLBACK`. First-party content is source-change-driven; stale/superseded/unpublished versions stop being active. Provenance carries `source_id`, `source_type`, `source_path`, `locale`, `version`, `updated_at`, `approved_at`/`approved_by` when applicable, `status`, and `supersedes`. No LLM promotion.
- **Persistence:** ephemeral active-session state; no permanent raw transcript by default, no raw conversation text in product analytics, minimal operational metadata only if necessary. Retention remains a legal decision; no PII persistence unless a separate explicit user action requires it.
- **Handoff:** user-initiated WhatsApp first (`+55 22 99846-1906`), e-mail secondary (`contato@ricardotour.com`); no automatic message; minimum useful allowlisted context only.
- **Analytics:** approved event categories are `concierge_opened`, `message_sent`, `answer_returned`, `knowledge_hit`, `knowledge_miss`, `fallback_triggered`, `handoff_offered`, `handoff_clicked`, `error`, `timeout`, `rate_limited`. Product analytics and operational observability stay separate; no raw messages.
- **Safety/fallback:** verified information or clear uncertainty with human handoff; no confident fabrication; no prompt, secret, internal configuration or credential disclosure; no fabricated inventory/booking status; no availability claim without a future approved structured integration; safety-sensitive practical information only when appropriately qualified and backed by an approved source.
- **Rate limiting:** provider-independent shared interface with anonymous/session, future authenticated-user, IP/abuse, burst, configurable cost, conversation, global emergency, observability and graceful UX support. No arbitrary production quotas or store vendor selection before cost/RT-82 decisions.

### 6.4 Minimum gates before real backend coding

1. Resolve the About/institutional content mismatch by supplying canonical Owner-approved Ricardo Tour content or explicitly keeping it out of the first source set.
2. Complete RT-70 legal/privacy decisions for ephemeral state and any retained metadata, including published Privacy-page disclosure before public enablement.
3. Select model and embedding/retrieval provider and agree data-processing terms, expected usage and cost ceiling.
4. Agree the shared RT-82 security/rate-limit design and global fail-closed/emergency controls.
5. Finalize the required localized fixed fallback/handoff/emergency copy and the RT-67/RT-75 safety evaluation gate.
6. Make the remaining RT-69 implementation decisions (registry/event transport, deterministic chunk/index implementation, rollback operations and processing-latency target) without expanding the approved source boundary.

No real backend work starts until these gates are explicitly met. RT-75 remains the Owner acceptance gate before public Concierge enablement. Do not start RT-40, RT-41, RT-85–RT-89 or any Flight integration while RT-39 awaits Oner.
