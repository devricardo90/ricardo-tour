# RT-69 — Knowledge Ingestion and Update Process

- Ticket: RT-69 (RT-RB-AI-03). Status: **DRAFT.** Depends on RT-68 approval. Process definition only; no pipeline is built.
- Principle: **the Concierge never silently continues using superseded or expired operational information.**

## 1. Pipeline

```
source ─► validate ─► normalize ─► chunk/index ─► version ─► (review) ─► publish ─► monitor
                                                                │            │
                                                                └─ reject    └─ rollback
```

| Stage | What happens | Gate |
| --- | --- | --- |
| Source | A registered source (RT-68 §2) produces content: catalog read through the public gate, or an approved document | source must exist in the registry with an `approved_by` |
| Validate | schema check; Tier check; required metadata present; locale declared; no private data patterns (e-mails of customers, document numbers, tokens, payment data); no unapproved claim types; length limits | any failure → reject, nothing published |
| Normalize | single canonical text per (source, locale); strip markup; resolve units/currency; keep original wording of policies verbatim (no paraphrase of legal/operational rules) | — |
| Chunk / index | chunk by meaning (one tour, one policy clause, one FAQ item); commercial rules never mixed with descriptive text; every chunk inherits all metadata | deterministic chunk ids |
| Version | new immutable document version; previous version retained | — |
| Review | Tier 1 policy/price-relevant content requires approver sign-off before publish; catalog sync may auto-publish only fields already approved by the platform's own publish gate (Owner decision) | `approved_by`, `approved_at` |
| Publish | atomically switch the active index to the new version set | atomic: all chunks of a document version become active together |
| Monitor | freshness/expiry checks, miss and conflict reports (RT-73) | alerts |
| Rollback | re-activate the previous version set | see §5 |

## 2. Document record

| Field | Meaning |
| --- | --- |
| `source_id` | stable id from the registry |
| `document_id` + `version` | monotonically increasing per document |
| `locale` | `pt`, `en`, `es` (and `sv` only if approved) |
| `content_type` | `tour`, `price`, `business`, `rio_content`, `policy`, `faq`, `site_page`, `external_approved` |
| `tier` | 1 or 2 |
| `updated_at` | when this version's content changed |
| `approved_by` / `approved_at` | named approver and timestamp (never a generic account) |
| `valid_from` / `valid_to` | validity window; `valid_to` required for F-OPERATIONAL |
| `freshness_class` | F-LIVE / F-OPERATIONAL / F-EDITORIAL |
| `status` | `draft`, `approved`, `active`, `superseded`, `expired`, `withdrawn` |
| `superseded_by` | pointer to the replacing version (when superseded) |
| `checksum` | content hash to detect silent drift |
| `change_note` | why it changed |

## 3. Supersession and expiry rules

1. Publishing a new version marks the previous one `superseded` **in the same atomic switch**. Retrieval filters on `status = active` **and** `now` within `[valid_from, valid_to]`; superseded/expired/withdrawn content is never retrieved for answers.
2. A document whose `valid_to` has passed becomes `expired` automatically, with an alert to the owner. It is excluded from retrieval immediately, not at the next ingestion run.
3. If the only source for a topic is expired/superseded without replacement, the Concierge treats the topic as missing (hand off), per RT-68 §8.
4. Withdrawal (e.g., a tour unpublished, a policy repealed) removes the content from retrieval at the next publish and must complete within the refresh window.
5. Every answer records the document versions it used (`sourceRefs`, RT-68 §7), so an incorrect answer can be traced to a version.
6. A scheduled consistency check compares the active index with the platform catalog (tour exists, published, price unchanged) and flags mismatches; mismatching entries are suppressed until reconciled.

## 4. Catalog changes

Tour create/update/unpublish/delete and price changes in the platform generate an ingestion event. Until the new version is active, entries for a tour whose price changed are marked stale and price statements about that tour are withheld (hand off) rather than served from the old index. Refresh window: `OWNER_DECISION_REQUIRED`.

## 5. Rollback

- Each publish creates a version set; the previous set remains available.
- Rollback = switch the active set back; recorded as an audit event with actor and reason.
- Rollback never re-activates content that is expired or withdrawn.
- After rollback, an alert asks the owner to confirm the active set.

## 6. Audit and roles

- Audit events: ingest started/failed, validated, published, rolled back, expired, withdrawn; each with actor, source_id, versions, correlation id. Append-only (aligned with RT-90 SEC-22).
- Roles (proposed): **Content owner** (provides content), **Approver** (Owner or delegate named in the registry), **Operator** (runs/monitors ingestion; cannot approve their own content), **Reviewer** of the audit trail.
- Index content is public/approved only; the index never contains user, booking, payment or admin data.

## 7. Open decisions (Owner)

1. Who are the approvers and delegates.
2. Whether catalog changes auto-publish or require review.
3. Refresh window and review periods per freshness class.
4. Where the registry lives (a table in the platform database is the likely choice; decided at RT-67).
5. Embedding/search method (text search vs vectors) — not decided here; see the RAG strategy doc.
