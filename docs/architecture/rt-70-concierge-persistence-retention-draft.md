# RT-70 — Concierge Persistence and Retention (DRAFT)

- Ticket: RT-70 (RT-RB-AI-04). Status: **DRAFT ONLY.** The ticket requires Owner/legal policy decisions; this document structures them and proposes defaults. **No retention duration is chosen here.** Every duration is `OWNER_LEGAL_DECISION_REQUIRED`.
- Today: nothing is stored (audited). The widget keeps messages in browser memory only. A "do not persist at all" option remains fully valid (§6, Option 0).
- Aligns with: Privacy page (RT-RB-L-05), RT-90 SEC-10 to SEC-16 and §3 retention boundaries, RT-73.

## 1. Identifiers

| Id | Rule |
| --- | --- |
| `conversation_id` | random, unguessable (≥128 bits), not derived from IP, session, user or time; generated server-side |
| `anonymous_session_id` | opaque random id kept client-side for the session; no linkage to identity |
| `user_id` | present only for authenticated users, and only if the Owner decides signed-in users' conversations are linked to accounts (default proposal: **not linked**) |
| `turn_index` | integer per conversation |

## 2. Anonymous vs authenticated

| | Anonymous | Authenticated |
| --- | --- | --- |
| Identity | none | account |
| Default storage (proposal) | **no message storage**; only counters/limits and closed-list analytics (RT-73) | same as anonymous unless the Owner opts into account-linked history |
| History across devices | none | only if account-linked history is approved |
| Limits | RT-72 anonymous allowance | RT-72 authenticated allowance |

## 3. Data model (if storage is approved)

Separation by class (RT-90 data classes):

| Store | Contents | Notes |
| --- | --- | --- |
| `concierge_conversation` | `conversation_id`, created_at, locale, surface, status, optional `user_id` | **minimal metadata**; no content |
| `concierge_message` | conversation_id, turn_index, role, **content (C2-class)**, source versions used, answer_kind, created_at | content encrypted at rest (SEC-13); access role-restricted and audited (SEC-14) |
| `concierge_pii_findings` (optional) | counts/flags that a message looked like PII, no values | helps redaction and alerts |
| Analytics events (RT-73) | closed-list properties only | **separate store; no join key to messages** (no `conversation_id` in analytics) |
| Operational logs | correlation id, stage, outcome | no content |

Rules:

1. **PII separation:** message content is stored apart from identity (no name/e-mail/phone fields in the schema). Users are warned not to share personal data (RT-74 #22). Detected obvious PII patterns (document numbers, card numbers, e-mails, phone numbers) are masked before storage if storage is on.
2. **Minimal metadata:** no IP address, no raw user agent, no precise location, no fingerprint. Rate-limit keys are hashed and live only in the limiter store with short TTLs.
3. **Analytics separation:** analytics never reads message content; message storage never writes analytics properties beyond the allowed closed lists.
4. **No training/learning on conversations by default.** The earlier "learning" architecture document is not authorized; any reuse of conversations to improve the knowledge base requires explicit Owner/legal approval and anonymization first.
5. **No cross-user memory** and no use of stored conversations as a Concierge source (they are Tier 3).
6. **Operator access** to stored messages: only named roles, every view audited, masked by default (SEC-14, SEC-43).

## 4. Deletion

- A deletion path exists for any stored conversation: by `conversation_id` (guest token style link, if the visitor kept it) and, for authenticated users, by account.
- Account deletion deletes or anonymizes linked conversations.
- Deletion applies to backups within a stated delay (SEC §3 of RT-90).
- Deletion requests and executions are recorded as audit events that contain no message content.
- Automatic deletion at the end of the retention period (§5) runs as a scheduled job with an audit trail.

## 5. Retention — decisions required (none chosen)

| Data | Decision needed | Value |
| --- | --- | --- |
| Message content (if stored) | retention period | `OWNER_LEGAL_DECISION_REQUIRED` |
| Conversation metadata | retention period | `OWNER_LEGAL_DECISION_REQUIRED` |
| Conversations flagged for review/incident | retention period and who may review | `OWNER_LEGAL_DECISION_REQUIRED` |
| Anonymized aggregates | whether kept, how long | `OWNER_LEGAL_DECISION_REQUIRED` |
| Analytics events (RT-73) | retention period | `OWNER_LEGAL_DECISION_REQUIRED` |
| Operational logs | retention period | `OWNER_LEGAL_DECISION_REQUIRED` |
| Rate-limit counters | short TTL equal to the longest window (technical, not a legal retention) | technical |
| Authenticated users' history | whether to keep history linked to accounts | `OWNER_DECISION_REQUIRED` |

## 6. Options for the Owner

| Option | Description | Trade-off |
| --- | --- | --- |
| **0 — No persistence** | conversations exist only for the session; only closed-list analytics and operational metrics | lowest privacy/legal exposure; no review of real questions; no handoff transcript |
| 1 — Short-lived storage for quality/safety review | store masked messages for a limited period, deleted automatically | enables quality review and incident investigation; requires notice, retention value, access controls |
| 2 — Account-linked history | authenticated users see their history | convenience; highest data-protection obligations |

This document recommends deciding between 0 and 1 first; Option 2 only after account features justify it. **No option is selected.**

## 7. Consent and notice (to settle with the Privacy page)

- Whether a notice is shown in the widget before first message (proposal: yes, short, linking to the Privacy page).
- Whether consent (opt-in) is required for storage under applicable law (`OWNER_LEGAL_DECISION_REQUIRED`).
- Whether messages are processed by a third-party model provider and under what data-processing terms (also a RT-67 provider-decision input).
- Language of the notice per locale.

## 8. Acceptance for the final RT-70 (after decisions)

1. The Owner records the chosen option and each retention value.
2. The Privacy page text is aligned.
3. Schema, deletion job and masking rules are specified.
4. RT-90-style review confirms access controls for stored content.

Until then RT-70 stays open and **blocks RT-67**.
