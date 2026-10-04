# RT-72 — Concierge Distributed Rate Limiting and Abuse Protection

- Ticket: RT-72 (RT-RB-AI-06). Status: **DRAFT.** Architecture only. **No vendor is selected.**
- Shared decision: Jira says to decide the limiter **once** with RT-RB-L-07 (RT-82) and reuse it. This document defines requirements both tickets must satisfy.
- Related: RT-90 SEC-60 to SEC-65.

## 1. Current state (audited)

`lib/security/rate-limit.ts` is a per-instance, in-memory sliding window. On serverless each instance counts separately and restarts reset counters; its own header calls it not distributed. The Concierge route **does not use it** (no limit at all today). It is unacceptable for an endpoint that will cost money per request.

## 2. Requirements for the shared limiter (vendor-neutral)

| # | Requirement |
| --- | --- |
| R1 | State shared across all instances/regions that serve the endpoint |
| R2 | Atomic check-and-increment (no race that lets bursts through) |
| R3 | Sliding or token-bucket semantics with per-key windows from seconds to a day |
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
| Anonymous visitor | hashed IP + hashed anonymous session id | baseline per-visitor use |
| Authenticated user | user id | higher allowance, still bounded |
| IP / device abuse | hashed IP, and coarse device signal if available | stop rotation of sessions from one source |
| Conversation | conversation id | cap messages and total input size per conversation |
| Burst | short window (seconds) | stop scripted bursts |
| Daily | 24h window per visitor/user | bound per-person daily cost |
| Global cost ceiling | single counter per hour/day | hard stop on total LLM spend |
| Unknown client | shared "unknown" bucket must be small and strict; never an unlimited fallback | missing/forged `x-forwarded-for` |

Numeric values are **not set here**. They are chosen at implementation from the expected cost per answer and the Owner's budget (`OWNER_DECISION_REQUIRED`: daily spend ceiling, anonymous vs authenticated allowance).

Inputs are also bounded independent of counters: message length (current 800 chars), history length, maximum output tokens, maximum retrieval chunks, request timeout.

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

Metrics (RT-73 operational): requests, limited by dimension, limiter store errors/latency, global-ceiling proximity (% of daily ceiling), estimated cost per day. Alerts: ceiling at 80% and 100%, limiter errors above a threshold, sudden growth in a single hashed key.

## 9. Acceptance for implementation

1. Limits enforced across at least two instances in a test (distributed proof).
2. Limiter outage triggers fail-closed behavior for the model path, verified by test.
3. Daily and global ceilings tested with a fake clock.
4. Responses localized and contain no internals.
5. The same limiter serves RT-82 without duplication.
