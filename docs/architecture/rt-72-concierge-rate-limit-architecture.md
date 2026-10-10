# RT-72 — Concierge Distributed Rate Limiting and Abuse Protection

- Ticket: RT-72 (RT-RB-AI-06). Status: **Owner-approved provider-independent requirements; implementation and shared limiter decision remain open.** No vendor is selected.
- Shared decision: Jira says to decide the limiter **once** with RT-RB-L-07 (RT-82) and reuse it. This document defines requirements both tickets must satisfy.
- Related: RT-90 SEC-60 to SEC-65.

## 1. Current state (audited)

`lib/security/rate-limit.ts` is a per-instance, in-memory sliding window. On serverless each instance counts separately and restarts reset counters; its own header calls it not distributed. The Concierge route **does not use it** (no limit at all today). It is unacceptable for an endpoint that will cost money per request.

## 2. Requirements for the shared limiter (vendor-neutral)

| # | Requirement |
| --- | --- |
| R1 | State shared across all instances/regions that serve the endpoint |
| R2 | Atomic check-and-increment (no race that lets bursts through) |
| R3 | Configurable sliding-window or token-bucket semantics for burst through longer-term protection; exact production windows are undecided |
| R4 | Low added latency (budget: a small fraction of the endpoint's time, decided at implementation) |
| R5 | Works in Development/Preview/Production with separate namespaces (no cross-environment counters) |
| R6 | Cost and operational simplicity acceptable to the Owner; data stored is limited to hashed keys and counters |
| R7 | Observable: hit/limited counts and store errors are emitted as metrics (RT-73) |
| R8 | Testable locally with a fake store |

Candidate classes (for the shared decision, **not chosen**): a managed key-value/Redis service from the Vercel Marketplace, the platform's own firewall/rate-limit rules for coarse IP limits, or a table in the existing database. Each must be compared against R1–R8 and cost. The Owner decides; this ticket does not select.

Layering: platform/edge rules for coarse IP flood protection **plus** application-level limits for identity/conversation/cost (below). Neither alone is enough.

## 3. Limit dimensions

| Dimension | Key (stored hashed) | Purpose |
| --- | --- | --- |
| Anonymous/session | anonymous session identifier, with privacy-reviewed abuse signals as needed | baseline session protection |
| Authenticated user (if accounts are introduced) | authenticated account identifier | bounded per-user protection |
| IP / abuse protection | privacy-reviewed, preferably hashed IP signal | resist abuse and session rotation |
| Conversation | ephemeral conversation identifier | cap messages and total input per active conversation |
| Burst | configurable short window | stop scripted bursts |
| Cost cap | configurable per-user/session and global emergency ceiling | bound spend after model cost is known |
| Global emergency protection | global disable/ceiling path | stop all model calls during cost or safety incidents |
| Unknown client | strict bounded fallback; never unlimited | handle missing/untrusted client signals safely |

Production quotas are **not set here**. Do not choose arbitrary limits before expected usage and model cost are known. Vendor-specific and model-specific values remain open; this contract approves the provider-independent interface and graceful limit UX.

Inputs are also bounded independently of counters: message/history length, output tokens, retrieval chunks, and request timeout must be configurable and set as part of cost/security implementation; this contract does not set production numbers.

## 4. Order of checks (cheapest first)

1. Feature flag.
2. Request validation and size limits.
3. Platform/IP burst limit.
4. Visitor / user / conversation limits.
5. Global cost ceiling.
6. Retrieval and model call.

Counters are incremented before the expensive call; a failed model call still counts (prevents retry-based cost amplification).

## 5. Fail-open vs fail-closed

| Situation | Behavior |
| --- | --- |
| Limiter store unavailable | **Fail closed for the model/retrieval path**: do not call the LLM; return the degraded response with handoff channels (RT-74/RT-71). Cost safety outranks availability. |
| Limiter store unavailable, request is a static handoff/contact action | allowed (no cost) |
| Limit exceeded | graceful `RATE_LIMITED` response (HTTP 429, `Retry-After`), localized friendly message, and handoff offer |
| Global ceiling reached | same degraded response; alert the Owner/operators |
| Flag disabled | `FEATURE_DISABLED` (503), no counters touched |

There is no fail-open path to the model.

## 6. Responses

- Friendly localized text: "You've reached the limit for now. Please try again later or contact the team", with channels. No internals, no counts, no exact windows revealed to attackers beyond `Retry-After`.
- Same shape for unknown and limited identities where possible (no enumeration).
- The UI disables sending and shows the countdown or contact options.

## 7. Abuse protection beyond counters

- Bot/abuse screening on the endpoint (platform bot protection or a challenge on suspicious traffic); decision shared with RT-82/RT-90 SEC-63.
- Reject empty/duplicate-flood messages (identical message repeated).
- Cap total tokens per conversation; require a new conversation after the cap.
- Block requests without a same-origin context (CSRF/origin check, SEC-50), noting this endpoint will be called only by the site's own widget.
- Prompt-injection and exfiltration attempts follow RT-74 and count toward a stricter "abusive content" bucket.

## 8. Monitoring

Metrics (RT-73 operational): requests, limited by dimension, limiter store errors/latency, global-ceiling proximity, and estimated cost. Alert thresholds are set only after the provider, expected usage, and Owner budget are known; do not hard-code arbitrary quotas here.

## 9. Acceptance for implementation

1. Limits enforced across at least two instances in a test (distributed proof).
2. Limiter outage triggers fail-closed behavior for the model path, verified by test.
3. Daily and global ceilings tested with a fake clock.
4. Responses localized and contain no internals.
5. The same limiter serves RT-82 without duplication.

## 10. Owner direction — 2026-10-04

The interface must support anonymous/session limits, authenticated-user limits if accounts are later introduced, IP/abuse protection, burst protection, configurable cost caps, conversation-level protection, global emergency protection, observability, and graceful rate-limit UX. Keep the architecture provider-independent and decide the shared store with RT-82. Do not select a distributed-store vendor solely to close RT-72 or hard-code production quotas before model cost and expected usage are known. RT-72 remains open pending the shared security/implementation decisions and acceptance evidence.

## 11. Implementation status — 2026-10-10

Owner decision recorded (Upstash Redis **Free plan only, USD 0/month**, no paid upgrade): see `rt-72-82-shared-limiter-decision-report.md`. Implemented: the provider-independent `RateLimitStore`, the Upstash REST adapter (one atomic EVAL per check, TTL, HMAC keys), the closed/degrade limiter with local deny-cache and circuit breaker, the Concierge policy (kill switch, IP burst, session, global ceiling; limits from `AI_CONCIERGE_RATE_LIMITS`, none invented) and the `RATE_LIMITED` outcome. §9 acceptance: items 2–4 are covered by deterministic and emulator tests; **item 1 (distributed proof) is emulator-verified only — real Upstash verification is pending** until the Owner authorizes creating the database. Production quotas are still undefined on purpose.

### 11.1 Live validation update — 2026-10-10

Acceptance §9 item 1 (distributed proof) is now verified against a **real Upstash Redis database** (development/test instant database, not production): exactly `limit` requests admitted under 60 simultaneous checks across two independent limiter instances, real TTL expiry, opaque keys only. Real cost measured: 3 billable commands for a check that creates a key, 2 otherwise. Still open: the production database and variables (Owner actions, report §10), behaviour at real quota exhaustion (deliberately not triggered), latency from the production Function region (`iad1`, verified), the RT-70 subprocessor review and approved production quotas (proposal in the report §8). Details: `rt-72-82-shared-limiter-decision-report.md`.
