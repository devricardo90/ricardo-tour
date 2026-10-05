# RT-69 — Knowledge Ingestion and Update Process

- Ticket: RT-69 (RT-RB-AI-03). Status: **Owner-approved deterministic process contract; implementation remains open.** Depends on the RT-68 source allowlist. No pipeline is built.
- Principle: **the Concierge never silently continues using superseded or expired operational information.**

## 1. Pipeline

```
CANONICAL SOURCE
      → VALIDATE
      → NORMALIZE
      → VERSION
      → CHUNK / INDEX
      → PUBLISH
      → RETIRE / ROLLBACK
```

| Stage | What happens | Gate |
| --- | --- | --- |
| Source | A registered source emits a change event. V1 sources are only those in RT-68 §4.1: the live public catalog, eligible public service copy, canonical contact constants, and later a reconciled Owner-approved Ricardo Tour page revision. | exact `source_id`, `source_type`, `source_path`, locale, and source revision are allowlisted; no open-web crawl |
| Validate | confirm source remains allowed/current; catalog item remains in the public gate and published; locale is PT/EN/ES; required provenance exists; content contains no excluded price, schedule, availability, private data, or unsupported claim. | any failure → reject; if old version was superseded/unpublished, retire it and serve no stale replacement |
| Normalize | deterministic markup/whitespace normalization; preserve approved meaning and public wording; do not translate missing facts, summarize with an LLM, infer claims, or recalculate commercial values. | same input revision always yields the same normalized content |
| Version | create an immutable version using the canonical source revision and normalized-content checksum. | deterministic version ID; record `supersedes` |
| Chunk / index | split by deterministic boundaries within one source item and locale; never mix sources/locales or create new facts. | chunk IDs derive from `source_id`, version, locale, and stable chunk position/content hash |
| Publish | atomically activate all validated chunks for the version. | audit the actor/event; no partial active version |
| Retire | mark the previous version `superseded` or `retired` in the same atomic publish. On unpublish/withdraw/change, remove the old version from active retrieval before processing a replacement. | old version cannot remain active while the source is no longer current |
| Rollback | reactivate a prior version only if that exact source version is still current, published, approved, and eligible under RT-68. | audit actor, reason, version, and time; never restore withdrawn or unpublished content |

## 2. Document record

| Field | Meaning |
| --- | --- |
| `source_id` | stable id from the registry |
| `source_type` | `published_catalog`, `public_service_copy`, `canonical_contact`, or `owner_approved_business` |
| `source_path` | exact repository path + field/key, or catalog record ID + canonical public-gate path |
| `locale` | `pt`, `en`, or `es`; only a source version present in that locale may be published |
| `version` | immutable deterministic source revision + normalized-content hash |
| `updated_at` | canonical source `updatedAt`, or source commit timestamp for versioned public copy |
| `approved_at` / `approved_by` | required for content requiring explicit Owner approval; catalog uses its public publish event/gate and captures actor/time when supplied; never synthesize missing values |
| `status` | `pending_validation`, `active`, `superseded`, `retired`, or `rejected` |
| `supersedes` | exact prior version ID this version replaces; null only for the first version |
| `content_hash` | checksum of the normalized content, used for deterministic change detection |
| `source_event_id` | immutable ID for the catalog publish/unpublish event or source revision event |
| `change_note` | concise source-change or retirement reason; no user content |

## 3. Supersession and expiry rules

1. A source-change event immediately marks the previous source revision non-current. It must stop being active before a replacement is published.
2. Publish atomically activates the new complete version and records the previous version in `supersedes`; retrieval accepts only `status = active` and a source that still passes the canonical allowlist/publication gate.
3. Unpublish, withdrawal, or a disallowed source change retires active knowledge immediately. The Concierge treats the topic as missing and hands off rather than serving a cached version.
4. A rejected replacement never causes the superseded version to become active again.
5. Every factual answer carries the exact source ID/version used (`sourceRefs`, RT-68 §7). Analytics may keep source IDs/retrieval metadata, not full source text.
6. A source reconciliation check is event-driven and runs before publication/use; arbitrary periodic recrawling is not the V1 freshness mechanism.

## 4. Catalog changes

Tour create/update/publish/unpublish/delete events trigger revalidation for the affected tour only. Only currently published customer-facing PT/EN/ES text is eligible. Price changes do not add price knowledge; RT-68 excludes prices from RAG. When a tour is unpublished or its content changes, its prior version is retired before any replacement is indexed. There is no arbitrary full-catalog recrawl.

## 5. Rollback

- Each publish creates a version set; prior versions remain in the audit history, not active retrieval.
- Rollback is an explicit audited operation with actor, reason, source event, and version.
- Rollback cannot reactivate a version if its source is unpublished, changed, superseded, withdrawn, or no longer on the RT-68 allowlist.
- A failed or rejected replacement stays retired; it does not silently expose old content.

## 6. Audit and roles

- Audit events: ingest started/failed, validated, published, rolled back, expired, withdrawn; each with actor, source_id, versions, correlation id. Append-only (aligned with RT-90 SEC-22).
- Roles: **Owner or Owner-named approver** approves explicit business/page content; public catalog publication is the approval gate for catalog text. **Operator** runs/monitors ingestion but cannot promote content or approve their own source. **Reviewer** reads the append-only audit trail.
- No LLM, model, or retrieval component may decide that content is approved, canonical, or ready to publish.
- Index content is public/approved only; the index never contains user, booking, payment or admin data.

## 7. Owner direction and remaining implementation decisions

Owner-approved direction: use the source-change-driven pipeline in §1; current publication state gates catalog content; no LLM promotion; old source versions become inactive atomically; rollback is audited and revalidates source eligibility.

Remaining before implementation: choose the registry/event transport, deterministic chunk boundary implementation, index/search technology, and operational processing-latency target. These are engineering/model-provider decisions, not permission to ingest unapproved content. No arbitrary production quotas or model/provider-specific choice is made here.
