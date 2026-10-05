# RT-73 — Concierge Analytics and Observability Contract

- Ticket: RT-73 (RT-RB-AI-07, split of RT-48). Status: **Owner-approved event categories and privacy boundary; implementation and retention remain open.** Final audit stays in RT-48 (Sprint 8).
- Principle: measure usage, quality and safety **without raw conversation content and without personal data**. Product analytics and operational metrics are separate systems with different audiences and retention.

## 1. Current state

Existing analytics: `trackClientEvent` → `POST /api/analytics` → Prisma `analyticsEvent`, whose `type` is a database enum of 5 commerce events; the route rejects other types and stores free-form `metadata`. No Concierge events exist.

Implications for RT-67: Concierge events need either (a) an enum extension plus migration, or (b) a separate Concierge event table. Either way the `metadata` for Concierge events must be an **allowlisted schema**, not free-form. The choice is made with RT-70 (`ENGINEERING_DECISION`, not Owner-facing).

## 2. Product analytics events

Anonymous session id only (existing client session id pattern); no user id by default. Properties below are the **complete allowed set**; anything else is dropped server-side.

| Event | When | Allowed properties |
| --- | --- | --- |
| `concierge_opened` | Concierge shell opened | minimal locale/surface metadata if needed |
| `message_sent` | user submits a message | event only or message-length bucket; never the message itself |
| `answer_returned` | answer shown | outcome kind, latency bucket, source count/IDs where useful |
| `knowledge_hit` | approved source retrieved | source IDs/version and retrieval outcome metadata only |
| `knowledge_miss` | no current verified source found | closed event/reason category only; no free-text topic |
| `fallback_triggered` | uncertainty/degraded fallback used | fixed fallback category only |
| `handoff_offered` | human channel offered | fixed handoff reason category only |
| `handoff_clicked` | visitor opens a human channel | channel type and fixed reason category only |
| `error` | unexpected error | closed error category and processing stage |
| `timeout` | processing timeout | stage and latency bucket |
| `rate_limited` | limit reached | limit dimension/category only |

The approved event vocabulary is exactly the eleven categories in this table. Do not emit raw user messages, raw assistant answers, names, e-mails, phones, document numbers, booking/payment IDs, IP addresses, raw user agents, prompts, or model outputs to product analytics. No unlisted product event categories are approved.

Metadata must be allowlisted and content-free. Source IDs and retrieval metadata may be recorded without copying complete source text. Do not sample or retain raw conversation content for analytics.

## 3. Operational metrics (separate)

Audience: engineering/operators. No user identifiers; aggregated.

| Metric | Type |
| --- | --- |
| `concierge_requests_total{outcome}` | counter (`ok`, `refusal`, `handoff`, `error`, `limited`, `disabled`) |
| `concierge_latency_ms{stage}` | histogram (`retrieve`, `generate`, `total`) |
| `concierge_llm_tokens{direction}` | counter (input/output) |
| `concierge_cost_estimate` | counter, per day |
| `concierge_rag_empty_total` | counter |
| `concierge_rag_stale_filtered_total` | counter (superseded/expired entries blocked, RT-69) |
| `concierge_ingestion_events_total{result}` | counter |
| `concierge_limiter_store_errors_total` | counter |
| `concierge_timeout_total{stage}` | counter |
| `concierge_flag_state` | gauge (enabled/disabled per environment) |

Operational logs carry correlation id, stage, outcome, error code, versions of knowledge used, and counts. **No message or answer content** and no PII (RT-90 SEC-20).

## 4. Alerts

- Error or timeout rate above threshold for a sustained window.
- RAG-empty rate spike (possible ingestion failure).
- Any use of superseded/expired content detected (should be zero; page-worthy).
- Configured cost-ceiling thresholds and limit reached (RT-72).
- Limiter store errors.
- Feature flag enabled in production without an approved RT-75 gate record (a configuration check).

## 5. Dashboards and review

- Product: opens → messages → grounded answers vs refusals/handoffs → handoff clicks; top closed-list topics with misses; language split.
- Operations: latency, error, cost, limiter.
- Quality review cadence and who reviews: `OWNER_DECISION_REQUIRED`.

## 6. Consent and privacy

Product analytics and operational observability are separate systems with separate audiences and access. Product analytics may use an anonymous session/conversation ID only when necessary. No raw message text or raw answer text by default. Source IDs/retrieval metadata are permitted; full source/user content is not. Privacy notice/consent requirements and retention periods remain legal decisions under RT-70; events must not be joinable to any stored raw conversation (none is retained by default).

## 7. Acceptance for implementation

1. A schema validator rejects any event property outside §2.
2. A test proves no content strings reach analytics or logs.
3. Event names and properties match this contract.
4. Operational metrics are emitted for each stage.
5. The `knowledge_miss` and `rag_stale_filtered` signals reach the owner dashboards.

## 8. Owner direction — 2026-10-04

Approved product event categories: `concierge_opened`, `message_sent`, `answer_returned`, `knowledge_hit`, `knowledge_miss`, `fallback_triggered`, `handoff_offered`, `handoff_clicked`, `error`, `timeout`, `rate_limited`. Keep product analytics separate from operational observability. Never send raw user/assistant messages by default; source IDs and retrieval metadata may be retained without full source or conversation text. RT-73 remains open pending schema implementation, privacy/retention decisions, and acceptance evidence.
