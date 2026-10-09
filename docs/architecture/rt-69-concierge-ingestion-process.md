# RT-69 — Knowledge Ingestion and Update Process

- Ticket: RT-69 (RT-RB-AI-03). Status: **Stage 2 hosted retrieval verified in an isolated PT vector store; production Concierge remains disconnected.** Depends on the RT-68 source boundary as extended by the later RT-93 Owner-approved PT editorial content.
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

Remaining after Stage 1: the registry/event transport for production, deterministic chunk execution, OpenAI hosted retrieval publication/retirement under the approved RT-67 Option A architecture, and the operational processing-latency target. None of these permits ingestion before per-version approval and live-source checks. No arbitrary production quota is chosen here.

## 8. Stage 1 local registry — 2026-10-07

RT-68 §4.1–4.3 records the initial inventory as of 2026-10-04. RT-93 subsequently supplied Owner-approved canonical PT business, contact, handoff, FAQ, Rio Guide, and a separate recommendation policy. Stage 1 extends the machine-readable candidate classes for the five factual files; it does not rewrite RT-68's historical decision. `knowledge/concierge/manifest.json` is the local registry. All nine registered versions are `DRAFT`, `approved_for_rag=false`: five factual editorial files and four current published PT catalog projections. The policy file is **RUNTIME / BEHAVIOR**, remains outside factual `sources`, and cannot become a retrieval document through this registry.

### Registration and immutable identity

- `scripts/rt-69-catalog-snapshot.ts` reads `getPublicTrips()` from the current public gate. On 2026-10-07 it yielded the four Owner-reviewed launch IDs. No seed file, legacy Rick Travel data, non-launch Trip, unpublished item or Oner data is a source. It writes one immutable JSON projection per public Trip/locale under `knowledge/concierge/versions/public-tour-catalog/<Trip.id>/<sha256>.json`. Existing snapshots are compared byte-for-byte and never overwritten. A separate mutable `catalog-current.json` points to the exact live-gate observation; registration and validation require its selected snapshot rather than guessing that the newest timestamp is authoritative. Stage 2 must refresh and recheck the gate at activation/use time.
- The catalog projection allowlist is exactly `source_id`, `source_class`, `locale`, `trip_id`, explicit PT `title`, published non-metadata prose `description`, `public_url`, and database `updatedAt` as `source_revision`. It never serializes `priceCents`, schedules, dates, capacity, inventory, booking/payment state or the full Prisma object. Literal price/provider/availability wording in projected text fails closed. Duration/inclusions are omitted until a separate exact field approval; apparent public price does not grant RAG price approval.
- `scripts/rt-69-registry.mjs register` reads each of the five exact RT-93 editorial paths. `source_sha256` hashes the committed Git blob bytes (stable across Windows checkout line endings); `source_revision` is the Git commit that supplied that path. The current worktree must normalize to the same content. Normalized content is placed in immutable local files under `knowledge/concierge/versions/editorial/<class>/<source_sha256>.md`; `normalized_sha256` hashes each snapshot. Catalog snapshot bytes supply both digests, and `versions/.gitattributes` prevents checkout line-ending conversion of snapshots. `version = sha256:<source_sha256>`; a repeated registration is idempotent. A changed source creates a new version and retires the prior manifest pointer; the prior snapshot remains immutable. Neither approval metadata nor source IDs are inferred from content.
- An approval label inside an editorial file or publication through the catalog gate is not an attributable per-version approval event. The exact `approved_at`, `approved_by`, and `last_reviewed` values have not been supplied for these versions and remain `null`; do not replace them with Git timestamps, Jira transition time, or the registrar operator. The registry records RT-93/RT-53 as contextual evidence, not a fabricated approval event. This is the current activation blocker.

### Normalization and local validation

Editorial normalization is deterministic: UTF-8, NFC, LF, strip only the initial editorial metadata/front matter, remove ChatGPT-export backslash escapes before Markdown punctuation, and preserve the remaining order and words. The raw approved files are unchanged. The FAQ normalizes into exactly 100 sequential `## N.` question blocks; a question and its answer remain one unit. The catalog projection uses only explicit PT values and excludes importer metadata blocks (`Duracao`, `Categoria`, `Inclusoes`, `Exclusoes`); it does not translate or use an LLM. `node scripts/rt-69-registry.mjs validate` checks Draft-07 schema, IDs, SHA-256s, snapshots, current editorial bytes, duplicate versions/active identities, PT-only active state, contact values, FAQ count, policy exclusion, stale Rick Travel text, and forbidden catalog fields/text. No OpenAI call occurs.

The eligibility predicate remains **`status == ACTIVE && approved_for_rag == true`**, in both directions. A `RETIRED`, `DRAFT`, or `BLOCKED` version is ineligible even if its immutable snapshot exists. Before a future activation, an Owner-named approver and exact approval/review timestamps must be recorded, source and normalized digests must still match, the catalog entry must pass the live public gate at that moment, the URL and PT text must still match, and any prior version must already be retired. No partial batch activation. Stage 1 intentionally activates zero sources because the per-version approval evidence is incomplete; no local status flip can make a hosted index authoritative.

### Retirement, rollback, and Stage 2 chunking contract

On a canonical file change, catalog update/unpublish, approval withdrawal, or conflict, mark the prior manifest version `RETIRED` with `approved_for_rag=false` before permitting a new version. Never alter old snapshot bytes or silently reactivate a retired version. Rollback is a fresh registration/approval operation against the exact current canonical bytes and live catalog gate, with an actor, reason, timestamp and audit event. If a prior payload is no longer canonical, rollback is denied and the Concierge must fall back/handoff.

Stage 2 must chunk only validated normalized snapshots after activation evidence is complete. Every chunk carries `source_id`, immutable `source_version`, `source_class`, `locale`, canonical `source_location`, `source_sha256`, `normalized_sha256`, and stable chunk ordinal/hash. Split Markdown at semantic headings; keep each FAQ question with its full answer; keep short sections whole. Target at most 2,000 UTF-8 characters per chunk and fail review rather than splitting a single FAQ answer or silently truncating overlong content. Never mix source IDs/locales or include editorial metadata, price, availability, policy instructions, or Oner/provider inventory in factual chunks. Stage 2 must implement atomic hosted-file publication/retirement, query-time active-manifest filtering, and revalidation before any customer answer. This stage creates no hosted resource and does not alter the Responses API runtime.

## 9. Stage 1.5 local approval binding — 2026-10-07

The Owner explicitly approved the five canonical PT factual editorial files in the RT-69 Stage 1.5 directive. Jira RT-69 comment `13290` records the exact five source SHA-256 digests and the policy exclusion. `approval-stage-1-5.json` pins that evidence to the nine exact registered versions. The project uses `Owner` as its role identity; no personal name was inferred. `2026-10-07T17:18:58Z` is the **time this approval was bound/recorded**, not a claim about the original RT-93 editorial review time. The five editorial manifest versions carry `approved_by=Owner`, this binding timestamp, and the Jira evidence reference.

The four catalog sources use the separate RT-53 Owner-reviewed public launch gate as their approval basis. `npm run snapshot:concierge-catalog` re-ran `getPublicTrips()` against the configured public catalog database: four of four expected published IDs passed the gate, and all four source digests matched Stage 1. The mutable pointer records the observation time; the immutable snapshots and source revisions did not change. An independent read-only check of `https://www.ricardotour.com/pt/tours` found all four IDs, and each `/pt/tours/<id>` route returned HTTP 200 with the registered PT title and full published description. The gate and exact live-page checks were repeated on 2026-10-08, again yielding four unchanged digests and four matching routes. The latest gate observation is `2026-10-08T14:45:44.838Z`; catalog `last_reviewed` records this refresh. This live page check corroborates the configured gate; Stage 2 must repeat the gate check before hosted publication and at retrieval use. The catalog manifest `approved_at` denotes the initial Stage 1.5 gate confirmation time, not an unrecorded original publish timestamp.

`node scripts/rt-69-activate-local.mjs` first validates the unchanged manifest and exact pinned versions, requires a recent catalog observation, and validates the entire prospective manifest before one atomic local file replacement. It activates five factual editorial and four catalog versions together. The resulting local registry has **9 ACTIVE, 0 DRAFT, 0 RETIRED, 0 BLOCKED source versions**; the separate institutional/About class remains BLOCKED. Every ACTIVE entry has `approved_for_rag=true`, and there is one current version per source ID. The Owner-approved recommendation policy remains **RUNTIME / BEHAVIOR** and is absent from the factual registry. Local ACTIVE status is only a prerequisite for Stage 2: no content has been uploaded, indexed, retrieved, or exposed in production. A changed/unpublished source must retire its old local version and pass fresh approval and validation before replacement; rollback cannot reuse an obsolete approval.

## 10. Stage 2 isolated hosted retrieval — 2026-10-09

**SDK.** The official OpenAI Node SDK is pinned to `openai@7.30.0` after `7.31.0` repeatedly installed without required package files on this machine. Node `v24.15.0` passed the import and client-construction smoke. `.env.local` holds the API key and is Git-ignored. No credential or provider ID is committed.

**Isolation and provider-ID policy.** One separate vector store (30-day inactivity expiry) holds the factual PT projection. Provider file IDs and the store ID live only in the Git-ignored `knowledge/concierge/.hosted-publication.local.json`; committed code defines and verifies the deterministic mapping. No production route reads the map or the store, `/api/ai-concierge` is not enabled, and the Concierge UI is not connected.

**Final verified state: 45 chunks from 9 sources.** 19 FAQ question/answer sections, 3 contact, 2 business-profile, 2 handoff, 4 catalog projections and 15 Rio guide sections. Each chunk is at most 2,000 UTF-8 bytes and carries `source_id, source_version, source_class, locale, source_sha256, normalized_sha256, chunk_id, chunk_ordinal, chunk_sha256` as hosted attributes. The recommendation policy (RUNTIME / BEHAVIOR) is not published.

**FAQ projection rationale.** The first Stage 2 pass used keyword suppression and published only 8 of 100 FAQ questions; review showed it also dropped safe explanatory answers merely containing words like "preço", "disponibilidade" or "reserva". The canonical FAQ is mostly written as Concierge behavior rules, so the correct unit is a reviewed whole section, not a keyword. `knowledge/concierge/faq-projection-review.json` is bound to the FAQ SHA-256 and lists the 19 sections published verbatim (1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 23, 33, 39, 40, 68, 79, 80, 89, 96); a changed FAQ digest makes the plan fail until re-reviewed. Published sections are linted for currency amounts, Oner and behavior wording. The other 81 are classified deterministically: **A 19 published, B 45 dynamic commercial/operational, C 29 Concierge runtime behavior, D 6 reviewed high-risk legal/safety (56, 90–94), E 1 other.** The FAQ source stays ACTIVE and approved as a whole; only its factual-safe projection is published. Explaining that prices are dynamic is published; no price value is.

**Publication, sync and indexing.** `publish` created the store once (34 chunks). `sync` is the only mutation path afterwards: it uploads only chunks missing from the map, indexes them in one batch and waits for completion, then deletes obsolete vector-store files and hosted files (404 tolerated), records them under `retired` in the local map, and finally updates the projection digests. The FAQ revision uploaded **17** new chunks, retired **6** and left **28** hosted files unchanged. The chunk ID includes the ordinal, so six FAQ chunk IDs changed when sections were inserted before them, **including #5 whose text is byte-identical**; those were replaced, not duplicated.

**Verification.** `verify` revalidates manifest, projection and store status, then runs 13 positive checks (one per source plus FAQ #7, #11, #12, #33 probes) and 13 negative checks: exact price/availability, Oner inventory, cancellation/booking queries, five excluded-FAQ probes (cancel, refund, visa, refund timing, Concierge pricing), EN and ES filters, blocked About, recommendation policy and a stale version. Every returned result must map by file ID to the immutable chunk, source version and all digests with locale `pt`; otherwise the check fails closed, as do returned currency amounts, Oner text and behavior rules. Result: **VERIFIED, 45 chunks, 13/13 positive, 13/13 negative.**

**Rollback / retirement.** `assertRollbackEligible` denies any version that is not the exact currently-approved one with matching digests. Obsolete hosted files are retired via `sync`, never silently reused. No Responses API call was used; any future one must set `store: false`.
