# RT-73 — Concierge Analytics and Observability Contract

- Ticket: RT-73 (RT-RB-AI-07, split of RT-48). Status: **DRAFT.** Final audit stays in RT-48 (Sprint 8).
- Principle: measure usage, quality and safety **without raw conversation content and without personal data**. Product analytics and operational metrics are separate systems with different audiences and retention.

## 1. Current state

Existing analytics: `trackClientEvent` → `POST /api/analytics` → Prisma `analyticsEvent`, whose `type` is a database enum of 5 commerce events; the route rejects other types and stores free-form `metadata`. No Concierge events exist.

Implications for RT-67: Concierge events need either (a) an enum extension plus migration, or (b) a separate Concierge event table. Either way the `metadata` for Concierge events must be an **allowlisted schema**, not free-form. The choice is made with RT-70 (`ENGINEERING_DECISION`, not Owner-facing).

## 2. Product analytics events

Anonymous session id only (existing client session id pattern); no user id by default. Properties below are the **complete allowed set**; anything else is dropped server-side.

| Event | When | Allowed properties |
| --- | --- | --- |
| `concierge_opened` | widget opened | locale, surface (`public_site`/`tour_detail`/`contact`/`unknown`), page path (no query string) |
| `message_sent` | user submits | locale, surface, `message_length_bucket` (e.g. 1–50, 51–200, 201–800), `turn_index`, `intent_category` (classifier output, not text) |
| `answer_returned` | answer shown | locale, `answer_kind` (`grounded`, `clarify`, `refusal`, `handoff`), `source_count`, `source_classes[]`, `latency_bucket`, `handoff_required` |
| `fallback_triggered` | degraded/fallback path | `fallback_reason` (`rag_failure`, `llm_timeout`, `llm_error`, `provider_unavailable`, `stale_source`, `unsupported_language`, `rate_limited`) |
| `handoff_requested` | server decides to offer handoff | `handoff_reason` (H1–H12) |
| `handoff_clicked` | user opens a channel | `channel` (`whatsapp`/`email`), `handoff_reason` |
| `knowledge_miss` | no verified source | `intent_category`, `topic_category` (closed list), locale |
| `error` | unexpected error | `error_code` (closed list), stage (`validate`, `retrieve`, `generate`, `post`) |
| `rate_limited` | limit hit | `dimension` (`burst`, `visitor`, `conversation`, `daily`, `global`) |
| `feedback_given` (optional) | thumbs up/down | `value`, `answer_kind` |

Never in analytics: message text, answer text, names, e-mails, phones, document numbers, booking/payment ids, IP addresses, raw user agents, prompts, model outputs.

`intent_category` and `topic_category` come from closed lists defined at RT-67; free-text topics are not recorded. Counting "top unanswered topics" uses the closed topic list plus an Owner-reviewed sampling process if the Owner later allows review of content (that requires RT-70 consent decisions; not enabled by default).

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
- Cost at 80%/100% of daily ceiling (RT-72).
- Limiter store errors.
- Feature flag enabled in production without an approved RT-75 gate record (a configuration check).

## 5. Dashboards and review

- Product: opens → messages → grounded answers vs refusals/handoffs → handoff clicks; top closed-list topics with misses; language split.
- Operations: latency, error, cost, limiter.
- Quality review cadence and who reviews: `OWNER_DECISION_REQUIRED`.

## 6. Consent and privacy

Events use an anonymous session id and no personal data; whether a consent notice is required for this analytics is a Privacy page (RT-RB-L-05) / legal question (`OWNER_LEGAL_DECISION_REQUIRED`). Retention of events: RT-70 decision. Analytics must not be joinable to stored conversations (RT-70 §3).

## 7. Acceptance for implementation

1. A schema validator rejects any event property outside §2.
2. A test proves no content strings reach analytics or logs.
3. Event names and properties match this contract.
4. Operational metrics are emitted for each stage.
5. The `knowledge_miss` and `rag_stale_filtered` signals reach the owner dashboards.
