# RT-96 — Daniela V1 technical audit (2026-10-12)

- **Ticket:** RT-96 [RT-RB-AI-AUDIT], Sprint 7 — AI Concierge.
- **Branch:** `daniela/rt-96-audit`, based on `origin/main` `40136a3`.
- **Authority:** Owner directive of 2026-10-12, which authorizes the audit and isolated V1 development. It does **not** approve RT-75, does not allow public enablement and does not allow production changes.
- **Method:** every statement below cites the code, a test or a run. If no evidence was found, the item says so.

## 1. Summary

Daniela V1 is a **stateless, deterministic-first assistant**. The model only words answers from approved evidence:
- The input is validated and session-bounded.
- Safety and catalog gates run before retrieval.
- Recommendations are picked deterministically from the 4 approved tours.
- Retrieval uses OpenAI's hosted vector store with provenance filtering.
- Generation uses the Responses API with `store:false`.
- A deny-list post-check runs after generation, and handoff to WhatsApp/e-mail is built from static data.
- Production stays blocked by a launch guard in code.

**Technical health:**
- The concierge and rate-limit suites pass: 532 passed, 6 skipped, run 7 times.
- One run of the 7 had a single intermittent failure (see G7).
- Source registry check: PASS.

**Overall:** no blocker that an agent can fix. Every launch blocker is an Owner, legal or infrastructure decision, which matches what RT-75 already lists.

## 2. Architecture and data flow (evidence)

| Stage | Where | What it does |
|---|---|---|
| Endpoint | `app/api/ai-concierge/route.ts` | Checks, in order: launch guard (503 `FEATURE_DISABLED`), same-origin (403), JSON content-type (415), 12 KB body cap (413). Responses are `no-store`. The client IP comes from platform headers; the body is never logged. On an internal error it reports and returns a 500 with no internals. |
| Events endpoint | `app/api/ai-concierge/events/route.ts` | A sendBeacon intake for product events. It returns 404 when the guard is off. It has per-instance limits only (60/min per client, 600/min global), not the shared limiter. Runtime and product events are written as content-free JSON to stdout, so they are kept as long as the platform's log retention keeps them. |
| Launch guard | `lib/ai-concierge/launch.ts` | OFF unless `AI_CONCIERGE_ENABLED`. Production (`VERCEL_ENV=production` **or** `NODE_ENV=production`) also requires: the RT-75 gate variable, `legal_review` APPROVED, emergency wording APPROVED, the shared limiter and valid quotas. A Vercel **Preview** build, and a local `next start`, run with `NODE_ENV=production`, so they are blocked too. Today's blockers there include `legal_review_pending`, `emergency_wording_not_approved` and `rt75_owner_gate_not_approved`, plus `shared_rate_limiter_not_configured` unless Upstash variables exist for that environment. |
| Config | `runtime/config.ts` | Server-only. Key, vector-store id and model are shape-validated; anything malformed fails closed. The model comes from configuration and is a dev choice, not the final one. |
| Limits | `runtime/limits.ts`, `lib/rate-limit/*` | Kill switch → IP burst 10/min → session 20/h → global 300/day (Owner-approved V1). Without configuration, or if the store fails, the model path is denied (fail closed). |
| Input / session | `runtime/input.ts` | Unknown keys are rejected. Message ≤ 800 chars. History ≤ 8 turns, ≤ 1,200 chars per turn, ≤ 4,000 total. Control characters are replaced by a space; tab, LF and CR are kept (`input.ts:13`). |
| Pipeline | `runtime/run.ts` | language → emergency (fixed text) → injection (current message and history) / internal info / abuse / competitor → identity (fixed text) → out-of-catalog (handoff) → deterministic gates (dynamic data, handoff) → deterministic recommendations → retrieval → provenance + injection filtering of retrieved chunks → score ≥ 0.3, top 4, ACTIVE only → generation → post-check → answer or handoff. One retry for timeout or 5xx, only while elapsed time is at most 20 s (`run.ts:350`). With a 30 s provider timeout, a timed-out call is in practice never retried; only a fast 5xx is. Worst-case latency (retrieval + generation, each up to 30 s, plus one retry) is about 60-90 s. The function `maxDuration` was not verified. |
| Model I/O | `runtime/openai.ts` | `vectorStores.search` (fixed `locale=pt` filter, top 5, no query rewrite); `responses.create` with `store:false`, 600 output tokens, 30 s timeout, `maxRetries: 0`. Provider errors are classified and their messages never forwarded. |

**Technologies — what is and is not in the code:**
- **Present:** `openai@7.30.0`.
- **Absent:** LangChain, LangGraph, the Vercel AI SDK and any agent framework (`package.json`, imports). The orchestration is hand-written TypeScript.
- **RAG:** implemented as OpenAI's **hosted** vector store. There is no local embedding or index.

## 3. Area findings

| Area | Status | Evidence |
|---|---|---|
| Knowledge sources | 9 registry entries, all ACTIVE and approved for RAG. Retrieved chunks are filtered by registry status and version (stale, retired, blocked and not-approved are dropped). A defensive invariant counts any superseded content that gets served. | `knowledge/concierge/manifest.json`, `runtime/provenance.ts`, `npm run check:concierge-sources` PASS |
| Four tours | Recommendations come from `approved-tour-cards.json`: 1–3 tours, picked deterministically, never by the model. The cards carry no price, duration, schedule or inclusions. **Gap G1** (now fixed): nothing tied this list to the site's `LAUNCH_TRIP_IDS`. | `ui/tours.ts`, `run.ts:298` |
| Out of catalog | A deterministic list of destinations and activities, plus a capitalised-place heuristic, leads to a limitation message and a WhatsApp handoff. No substitution, and the visitor's text is never echoed. | `runtime/catalog-scope.ts` |
| Hallucination guards | Pre-generation gates; evidence-only input; and a post-check deny-list (PT/EN/ES) covering prices, availability, booking or payment confirmation, safety assurances, emergency numbers, response-time claims, promises, schedules, human claims, fake handoffs, commercial terms and inclusions, custom-service claims, internal leaks, unapproved phone/e-mail/URL, and wrong language. **Gap G4:** there is no *semantic* grounding check (it does not verify that each claim appears in the evidence), and per-answer source traces are not logged (both already in RT-95 scope). | `runtime/postcheck.ts` |
| Session context | Client-held, in memory only. Nothing is stored server- or client-side (no localStorage, sessionStorage or cookie). The anonymous session id is random, in memory and rotated hourly. History is untrusted: injection in a past user turn, or a tampered assistant turn, fails closed. | `ui/state.ts`, `concierge-mount.tsx`, `run.ts:254-270` |
| Privacy | **Obvious identifiers only** are redacted before retrieval and generation: e-mail addresses, CPF numbers, Luhn-valid card numbers and any run of 10+ digits (`privacy.ts:61-70`). **Names, street addresses, alphanumeric passport/RG numbers and health details are not redacted and reach OpenAI** when a visitor types them. A deterministic reminder is added when a visitor shares redactable data. Events are content-free. The **retrieval query** (the current message, plus the previous user turn when the message is short, `run.ts:364-371`) is sent to `vectorStores.search`. `store:false` applies only to `responses.create`; the provider's retention of search queries is **not verified** (G8). The AI-disclosure and privacy notice exists in PT/EN/ES, but `legal_review: "PENDING"`. The notice refers to a Privacy Policy that is not published (draft only in the rebuild lab, noindex). The notice is also rendered as plain text with **no link** (`concierge-panel.tsx:487`) — **G5**. | `runtime/privacy.ts`, `run.ts:242` |
| WhatsApp handoff | Codes H1–H12. Links are built only from `PUBLIC_CONTACT`. The prefill comes from a closed set (code, language, approved tour), never from the conversation. The handoff still works when every backend is down. No "team contacted" claims (blocked by the post-check). | `runtime/handoff.ts` |
| Security | Same-origin check, body cap, strict input schema, fail-closed config, server-only secrets, provider messages never forwarded, injection defence on input, history and retrieved text. | route + runtime |
| Abuse / cost | **G2:** the session rule only runs when a valid `X-Concierge-Session` header is present (`limits.ts:75`); omitting or malforming it (or rotating it) skips the rule. Effective protection is IP burst (10/min) plus the global cap of 300 per **fixed UTC day** (`upstash-store.ts`, `floor(now/window)`). Every *well-formed* request counts against it, including deterministic or refused replies that never reach the model (`index.ts:73-76`). One IP can exhaust the daily cap in about 30 min (N IPs: about 30/N min), switching Daniela off for every visitor until 00:00 UTC. It fails gracefully (WhatsApp offered). The IP is the first `x-forwarded-for` hop, trustworthy only behind Vercel's proxy; a missing IP shares one "unknown" bucket. The quotas are Owner-approved numbers, so they are not changed here. | `runtime/limits.ts`, `lib/rate-limit/upstash-store.ts`, `route.ts` |
| Observability | Content-free events; per-stage timings, token usage and provider-call counts; alert rules (superseded content, limiter errors, error and timeout rates). **G3:** metrics and alert evaluation are **in memory per server instance** and reset on cold start, so on serverless the rate alerts (minimum 10 requests per instance) may never fire. Counters are cumulative since process start (not windowed), so once a rate has tripped the alert repeats every hour. `getAlertNotifier().check()` is awaited inside the request (`route.ts:45`), so e-mail latency adds to the response time; it is skipped on the 500 path. Alert e-mail delivery has not been tested (already recorded on RT-75). | `observability/metrics.ts`, `alerts.ts`, `notify.ts` |
| Tests / evaluation | Unit and contract suites; offline evaluation (no provider calls); live evaluations recorded on RT-75 (89/89 on two dev models, `store:false`). The evaluation set is `knowledge/concierge/evaluation/rt-75-evaluation-set-pt.json`. Despite the `-pt` in its name it is version `2026-10-11.3-v1` with **89 cases in pt, en and es, plus fr** for the unsupported-locale path. Results are in `docs/architecture/rt-75-evidence/`. | `tests/ai-concierge-*.test.ts`, `scripts/rt-75-evaluation.ts`, RT-75 comments |
| EN/ES retrieval | Retrieval always filters `locale=pt`, so EN/ES answers are worded by the model from Portuguese evidence and then checked for language. This works as designed; translation fidelity is not scored by the judge (G6, low). | `runtime/openai.ts:36` |

## 4. Gaps, classified

| # | Gap | Impact | Priority | Owner of the fix | Action |
|---|---|---|---|---|---|
| G1 | No test tied Daniela's catalog to the public launch catalog (drift would recommend unpublished tours and link to 404s) | Medium | High | Agent | **Fixed in RT-96:** `tests/ai-concierge-catalog-consistency.test.ts` checks ids = `LAUNCH_TRIP_IDS`, public paths and existing images. Mutation check: dropping one tour fails the test, and the file was restored clean. |
| G2 | Session limit is skipped without a valid header, or bypassed by rotating it. One IP (or N IPs) can exhaust the fixed UTC-day global cap in about 30 (30/N) min, a denial of service for all visitors until 00:00 UTC. Refused and deterministic replies also consume quota | High for launch | High | Owner (quota policy) + infra | Decision before RT-75, one or more of: a per-IP hourly/daily rule; requiring a server-issued signed session; counting only model-bound requests against the global cap; edge rate limiting (RT-82 WAF proposal). Not changed. |
| G3 | Metrics and alerts are per instance and in memory (counters cumulative, not windowed); rate alerts are unreliable on serverless; the alert check is awaited inside the request | Medium | Medium | Owner / infra (persistent sink, RT-73/RT-84); agent for the await | Tied to the log/alert destination decision. Moving the notifier off the response path is agent-fixable once the destination is chosen. Not changed now. |
| G4 | No semantic grounding verification; no per-answer source trace in logs | Medium | Medium (V2) | Agent, later | Already in RT-95 scope (post-V1). Not done now (V2 is excluded). |
| G5 | The privacy notice refers to a Privacy Policy that is not published, and the notice has no link to it. Free-text PII (names, addresses, document numbers with letters, health details) is not redacted and reaches the provider | Blocker for public launch | High | Owner / legal (RT-80, RT-70); agent adds the link once the page exists | Already a launch blocker; the guard enforces it (`legal_review`). The notice wording should state that free-text personal data typed by the visitor is sent to the provider. |
| G6 | EN/ES answers are worded from PT evidence. The evaluation set has EN/ES cases, but the judge checks rule compliance and language, not translation fidelity | Low | Low | Agent (evaluation) | When RT-75 re-runs the final model, add a fidelity check for EN/ES grounded answers (a sample reviewed against the PT source). |
| G8 | The provider's retention of `vectorStores.search` queries (which can include the previous user turn) is not verified; `store:false` covers only generation | Medium | Medium | Owner / legal (subprocessor review, RT-70) | Verify in OpenAI's data-usage terms before RT-75; record it in the privacy notice if needed. |
| G9 | The events endpoint uses per-instance limits only, and runtime/product events go to stdout (platform log retention) | Low | Low | Infra (RT-73/RT-84) | Covered by the persistent-sink decision. |
| G7 | `ai-concierge-launch.test.ts` "503 FEATURE_DISABLED" failed once in 7 grouped runs. It was not reproduced in 6 further runs (2 with a cold cache) and the error text was not captured. Likely a cold dynamic-import timeout; **not proven** | Low | Low | Agent | Watch; capture the error if it recurs. No speculative change. |

**Launch blockers, already known and unchanged** (Owner, legal or infrastructure — see RT-75 and `docs/architecture/daniela-v1-launch-readiness.md`):
- legal approval of the disclosure and privacy notice, plus the Privacy page (RT-80);
- emergency wording;
- production Upstash, environment and quotas (RT-72/RT-82);
- commercial hosting (Hobby is not approved);
- log/alert destination and delivery test (RT-73);
- final model choice and evaluation re-run;
- the RT-75 gate itself.

## 5. Independent review

A separate review agent fact-checked the audit against the code. Verdict: APPROVE WITH FIXES (2 major, 5 minor, 3 nit). It confirmed the test file is correct and not vacuous. All findings were verified against the code and applied:
- **Major:** the G2 abuse analysis was understated, and the privacy redaction claim was overstated.
- **Added:** retrieval-query retention (G8), the events endpoint (G9), the missing link in the notice, retry/timeout behaviour, alert details, the full list of Preview blockers, control-character handling and one line reference.
- **Corrected separately by the author:** the evaluation set is multilingual (89 cases, pt/en/es/fr), not PT-only.

## 6. Validation

- New test: 3 passed. The mutation check fails as expected.
- Concierge + rate-limit suites: 532 passed / 6 skipped (7 runs, one intermittent failure, G7).
- `check:concierge-sources`: PASS.
- `tsc --noEmit`: 0 errors. ESLint on the new test: 0.
- No live model call was made in this audit, so the cost is US$ 0.

## 7. Not done (scope)

- No change to the catalog, quotas, model, prompts, panel design, launch guard or production configuration.
- No V2 work (RT-95).
- RT-75 not approved.
