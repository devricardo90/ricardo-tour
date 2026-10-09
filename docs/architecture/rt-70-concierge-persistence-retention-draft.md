# RT-70 — Concierge Persistence and Retention (DRAFT)

- Ticket: RT-70 (RT-RB-AI-04). Status: **superseded in part by `rt-70-concierge-privacy-architecture.md` (technical architecture implemented 2026-10-09); legal retention/disclosure approval still open.** No retention duration is chosen here. Every duration is `LEGAL_DECISION_REQUIRED`.
- Owner direction (2026-10-04): keep conversation/session state ephemeral by default; do not persist full raw transcripts; do not put raw conversation text in product analytics. Only minimal operational metadata may be retained if necessary. A Privacy-page disclosure is required before public production enablement.
- Today: nothing is stored (audited). The widget keeps messages in browser memory only.
- Aligns with: Privacy page (RT-RB-L-05), RT-90 SEC-10 to SEC-16 and §3 retention boundaries, RT-73.

## 1. Identifiers

| Id | Rule |
| --- | --- |
| `conversation_id` | random, unguessable (≥128 bits), not derived from IP, session, user or time; generated server-side |
| `anonymous_session_id` | opaque random id kept client-side for the session; no linkage to identity |
| `user_id` | not part of V1 conversation state; account-linked history requires a separate future Owner decision |
| `turn_index` | integer per conversation |

## 2. Anonymous vs authenticated

| | Anonymous | Authenticated |
| --- | --- | --- |
| Identity | none | account |
| Default state | ephemeral turns for the active session; no permanent raw transcript; only minimal operational metadata if necessary | same as anonymous; no account-linked history in V1 |
| History across devices | none | none in V1 |
| Limits | RT-72 anonymous allowance | RT-72 authenticated allowance |

## 3. Data model and V1 boundary

Separation by class (RT-90 data classes):

| Store | Contents | Notes |
| --- | --- | --- |
| Active session state | only the short-lived turns needed to maintain the current conversation | ephemeral; discarded when the session ends/expires; no permanent raw transcript by default |
| Operational metadata (only if necessary) | anonymous conversation/session id, timestamps, locale, event type, latency, fallback/handoff state, knowledge source IDs, error category, rate-limit state | minimal allowlist; retention duration remains `LEGAL_DECISION_REQUIRED`; never store raw user/assistant text |
| Explicit human contact/handoff action | only the data the visitor deliberately enters into the chosen external channel | separate user action; do not automatically attach or persist the Concierge transcript or PII |
| Product analytics (RT-73) | approved event names and minimal allowlisted metadata | separate from operational observability; no raw text and no join key to transcript content |
| Operational logs | correlation id, stage, outcome, source IDs/versions where useful, counts | no message/answer content and no PII |

Rules:

1. **No raw transcript persistence by default:** raw user and assistant messages may exist only in ephemeral active-session state. Do not persist them for analytics, quality sampling, or model training.
2. **Minimal metadata:** no IP address, no raw user agent, no precise location, no fingerprint. Rate-limit keys are hashed and live only in the limiter store with short TTLs.
3. **Analytics separation:** analytics never reads message content; message storage never writes analytics properties beyond the allowed closed lists.
4. **No training/learning on conversations.** Any future proposal to reuse conversations requires a separate Owner/legal decision and is outside this V1 direction.
5. **No cross-user memory** and no use of stored conversations as a Concierge source (they are Tier 3).
6. Any operational metadata store requires access controls and an approved retention/deletion design before implementation; it contains no conversation content.

## 4. Deletion and expiry

- Ephemeral conversation content is discarded at session end/expiry and is not recoverable from a permanent transcript store.
- If minimal operational metadata is retained, deletion/expiry, backup handling, and audit requirements must be specified with the applicable retention period before implementation.
- Deletion requests and executions are recorded only as content-free audit events where required.

## 5. Retention — decisions required (none chosen)

| Data | Decision needed | Value |
| --- | --- | --- |
| Ephemeral active-session state | maximum session lifetime / expiry behavior | `LEGAL_DECISION_REQUIRED` before public production enablement |
| Minimal operational metadata, if retained | retention period | `LEGAL_DECISION_REQUIRED` |
| Analytics events (RT-73) | retention period | `LEGAL_DECISION_REQUIRED` |
| Operational logs | retention period | `LEGAL_DECISION_REQUIRED` |
| Rate-limit counters | short TTL equal to the longest window (technical, not a legal retention) | technical |
| Authenticated users' history | not part of V1; any later account-linked history requires a new Owner decision | deferred |

## 6. Owner-approved V1 persistence direction

| Option | Description | Trade-off |
| --- | --- | --- |
| Ephemeral conversation | active-session state only; no permanent raw transcript by default | maintains the current exchange while avoiding transcript retention |
| Minimal operational metadata (optional) | only fields listed in §3, only if necessary | no raw conversation text; duration requires legal/Owner approval |
| Account-linked history | excluded from V1 | requires a separate Owner decision |

The Owner selected the ephemeral/no-raw-transcript direction for V1. This does not authorize any metadata retention period.

## 7. Consent and notice (to settle with the Privacy page)

- Privacy-page disclosure is required before public production enablement. Legal must determine exact disclosure/consent language and whether any operational metadata requires additional notice.
- Whether messages are processed by a third-party model provider and under what data-processing terms (also a RT-67 provider-decision input).
- Language of the notice per locale.

## 8. Acceptance for the final RT-70 (after decisions)

1. Legal/Owner decisions specify session expiry and retention for any operational metadata, analytics, and logs.
2. Required Privacy-page disclosure and any consent language are published before public production enablement.
3. Any metadata schema is allowlisted, content-free, and has expiry/deletion behavior.
4. Security review covers access and retention of metadata; no raw transcript store is introduced by default.

## 9. Owner decision record — 2026-10-04

- No full Concierge transcript is persisted by default.
- Active conversation state is ephemeral and limited to what is needed for the current session.
- Do not send raw user or assistant messages to product analytics.
- Retain only minimal operational metadata if needed; no retention duration is approved.
- No PII is persisted unless required by a separate explicit user action such as a human handoff/request.
- Privacy-page disclosure is required before public production enablement.

RT-70 remains open and blocks public enablement/RT-67 until legal retention and Privacy-page requirements are settled.
