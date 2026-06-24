# AI Concierge Structured Knowledge Record Format

State: REVIEW

Related task: RT-AI-021A

This document defines the conceptual structured format for future Rick Travel AI knowledge records. It is a human-readable product specification only. It does not create real JSON/YAML records, database rows, schema files, migrations, seeds, validation scripts, tests, backend logic, API routes, RAG pipelines, embeddings, vector stores, LangChain, LangGraph, chatbot behavior, frontend changes, package changes, lockfile changes, deployment changes, or runtime behavior.

Future structured records require a separate approved task before any machine-readable data file, database model, validator, or runtime ingestion is created.

## 1. Purpose and Scope

The purpose of this format is to define how future AI knowledge records should be shaped when Rick Travel later migrates from Markdown examples to structured records.

The format must support:

- Source-governed answers.
- Explicit permissions for website, AI, RAG, evaluation, internal use, and handoff behavior.
- Human review and approval tracking.
- Risk classification for commercial, safety, accessibility, payment, booking, trust, and volatile facts.
- Locale-specific records and reviewed translations.
- Future validation without implementing validation logic here.
- Future migration to JSON/YAML files, database records, and automated validators only after separate approval.

This format is intentionally conservative. It describes what future records should contain, not how a system should execute them.

## 2. Relationship to Existing AI Knowledge Governance

This document depends on the existing governance documents:

- `docs/product/ai-concierge-approved-knowledge-records-contract.md`
- `docs/product/ai-concierge-first-approved-knowledge-record-examples.md`
- `docs/product/ai-concierge-knowledge-record-validation-rules.md`

The approved knowledge records contract defines what an approved AI knowledge record means and which permissions, risk levels, source authority rules, and handoff rules control AI use.

The first approved examples show safe human-readable Markdown examples before any structured data exists.

The validation rules define PASS/FAIL expectations for required fields, approval status, risk level, permission combinations, volatile facts, unknown answers, and future validators.

This document translates those governance layers into a conceptual field format. It does not override them. If this format conflicts with the contract or validation rules, the stricter rule should apply until a future owner-approved update resolves the conflict.

## 3. Conceptual Field Schema

A future structured knowledge record should have these conceptual groups:

| Group | Purpose |
| --- | --- |
| identity | Stable record identity and classification. |
| content | Human-readable knowledge content and answer behavior. |
| sources | Source references that support the record. |
| locale | Locale, source language, and translation metadata. |
| permissions | Explicit usage permissions and blocking flags. |
| approval | Review and approval state. |
| risk | Risk level, volatile fact category, and risk notes. |
| freshness | Review cadence, expiry, and staleness rules. |
| migration | Future migration metadata for JSON/YAML, database records, validators, RAG, and evals. |

No exact JSON schema, TypeScript type, Prisma model, API contract, or database table is created by this document.

## 4. Required Fields

Every future structured record should include these required fields before it can be reviewed:

| Field | Type | Requirement |
| --- | --- | --- |
| recordId | string | Stable unique identifier. Must not be reused after retirement. |
| slug | string | Human-readable stable identifier. |
| title | string | Short internal title. |
| summary | string | Short summary of what the record governs. |
| locale | enum string | Locale for this record. |
| category | enum string | Primary category for review and retrieval scope. |
| sourceAuthority | enum string | Authority class that supports the record. |
| sourceRefs | array | Source reference objects or a documented reason sourceRefs are not applicable. |
| approvalStatus | enum string | Current approval state. |
| approvedByRole | enum string or null | Role that approved the record, or null when not approved. |
| reviewedAt | date string or null | Last human review date, or null when not reviewed. |
| reviewCadence | enum string | Expected review cadence. |
| riskLevel | enum string | Risk classification. |
| websiteAllowed | boolean | Whether the content may appear on the website in its intended context. |
| aiAllowed | boolean | Whether the AI Concierge may use the record for answers. |
| ragAllowed | boolean | Whether future RAG may retrieve, chunk, embed, or index the record. |
| evalAllowed | boolean | Whether future evaluation examples may use the record. |
| handoffRequired | boolean | Whether the answer must route to human support. |
| sourceRequired | boolean | Whether AI answers must be source-grounded. |
| ownerReviewRequired | boolean | Whether owner or authorized reviewer approval is required before AI use. |
| internalOnly | boolean | Whether content is only for internal process and not user-facing. |
| allowedAnswerBehavior | string | What the AI may say or do when using the record. |
| blockedAnswerBehavior | string | What the AI must not say or do. |
| handoffBehavior | string | How human handoff should be handled when required. |
| freshnessPolicy | string | Human-readable freshness and re-review expectations. |
| migrationNotes | string | Notes for future structured conversion and runtime restrictions. |

## 5. Optional Fields

Optional fields may be added when relevant:

| Field | Type | Use |
| --- | --- | --- |
| version | string | Record version for future change tracking. |
| canonicalRecordId | string or null | Source record when this record is a translation or derived record. |
| sourceLocale | enum string or null | Original source language. |
| translationStatus | enum string or null | Translation review state. |
| localeNotes | string or null | Locale-specific wording or legal constraints. |
| secondaryCategories | array of enum strings | Additional categories. |
| tags | array of strings | Search and review tags. |
| volatileFactType | enum string or null | Specific volatile fact category. |
| riskNotes | string or null | Extra risk explanation. |
| effectiveFrom | date string or null | Date when record becomes valid. |
| expiresAt | date string or null | Date when record should stop being used. |
| reviewDueAt | date string or null | Next review due date. |
| retiredAt | date string or null | Retirement date when no longer valid. |
| supersedesRecordId | string or null | Prior record replaced by this one. |
| supersededByRecordId | string or null | Future record that replaces this one. |
| migrationState | enum string | Migration readiness state. |
| candidateJsonPath | string or null | Future planned JSON/YAML location, not a current file. |
| candidateDatabaseEntity | string or null | Future planned database entity, not a current schema. |
| validatorNotes | string or null | Notes for future validators, not validation logic. |

Optional fields must not be used to bypass required permissions, approval, source, or risk rules.

## 6. Field Types

Future structured records should use simple field types:

| Type | Meaning |
| --- | --- |
| string | Human-readable text. |
| enum string | String restricted to an allowed value. |
| boolean | `true` or `false`. |
| date string | ISO-style date such as `2026-06-24`; future implementation may choose exact date-time rules. |
| array | Ordered or unordered list of values. |
| object | Structured group of named fields. |
| null | Explicit absence of a value where allowed. |

Dates in this document are conceptual. A future implementation must define exact date/time format, timezone behavior, and validation rules.

## 7. Allowed Enum Values

### locale

Allowed initial locale values:

- pt
- en
- es
- sv

Future locales require separate approval and translation review rules.

### category

Allowed initial category values:

- company_about
- tour_overview
- itinerary
- pricing
- availability
- schedule
- booking_process
- payment
- cancellation
- accessibility
- safety
- private_tour
- pickup_and_logistics
- language_support
- whatsapp_handoff
- business_credibility
- policy
- unsupported_request
- blocked_claim

### sourceAuthority

Allowed source authority values:

- owner_approved
- product_system
- policy_document
- tour_page
- operational_note
- external_source

### approvalStatus

Allowed approval status values:

- draft
- pending_owner_review
- approved
- approved_with_handoff
- blocked
- retired
- conflict

### approvedByRole

Allowed initial reviewer role values:

- owner
- authorized_reviewer
- product_manager
- operations_lead
- ai_governance_reviewer
- none

`none` should be used only when the record is not approved.

### reviewCadence

Allowed review cadence values:

- on_change
- monthly
- quarterly
- semiannual
- annual
- live_only
- never_ai_allowed

### riskLevel

Allowed risk level values:

- low
- medium
- high
- blocked

### volatileFactType

Allowed volatile fact type values:

- none
- price
- availability
- schedule
- capacity
- payment
- refund
- booking_confirmation
- cancellation
- guarantee
- discount
- credential
- insurance
- review_or_rating
- safety
- accessibility
- private_tour
- weather
- legal_or_tax

### translationStatus

Allowed translation status values:

- not_applicable
- draft
- reviewed
- approved
- blocked
- needs_owner_review

### migrationState

Allowed migration state values:

- markdown_only
- candidate_for_json_yaml
- candidate_for_database
- candidate_for_validator
- blocked_from_runtime
- retired_from_migration

## 8. Source Reference Structure

Each source reference should be a structured object in future records.

Conceptual source reference fields:

| Field | Type | Requirement |
| --- | --- | --- |
| sourceRefId | string | Stable source reference identifier within the record. |
| sourceType | enum string | Type of source. |
| title | string | Human-readable source title. |
| pathOrUrl | string or null | Internal path or approved public URL, if safe to record. |
| sourceLocale | enum string or null | Source language. |
| sourceAuthority | enum string | Authority class for this source. |
| reviewedAt | date string or null | Review date for this source reference. |
| approvalStatus | enum string | Approval status of the source reference. |
| notes | string or null | Limits, caveats, or source-specific constraints. |

Allowed sourceType values:

- product_doc
- architecture_doc
- ops_doc
- public_website_page
- owner_approval
- product_system_record
- policy_document
- external_source
- unsupported_gap

Rules:

- High-risk records require sourceRefs unless the record is explicitly blocked or unsupported.
- External sources must not override owner-approved or product-system authority.
- Source references must not expose secrets, private customer data, private operational links, credentials, or payment data.
- A future AI system must not cite a source it did not use.

## 9. Locale and Translation Fields

Locale fields should prevent one approved language from being treated as approval for every language.

Required locale fields:

- `locale`
- `sourceLocale`
- `translationStatus`

Optional locale fields:

- `canonicalRecordId`
- `localeNotes`
- `translatedFromRecordId`
- `translationReviewedAt`
- `translationReviewedByRole`

Rules:

- A record approved in Portuguese is not automatically approved in English, Spanish, or Swedish.
- Commercial, safety, accessibility, payment, cancellation, credential, and legal/trust wording requires reviewed translation before AI use.
- If an approved locale record is missing, the AI should answer with a limitation or route to human support rather than machine-translating a commitment.

## 10. Permission Fields

Future records must declare every permission explicitly.

| Field | Meaning |
| --- | --- |
| websiteAllowed | Content may appear on the Rick Travel website or public documentation in its intended context. |
| aiAllowed | AI Concierge may use the record for answers under declared constraints. |
| ragAllowed | Future RAG may retrieve, chunk, embed, index, or ground answers with this record. |
| evalAllowed | Future evaluation examples may use the record. |
| handoffRequired | AI must route to WhatsApp or human support when the record applies. |
| sourceRequired | AI answers must be grounded in sourceRefs. |
| ownerReviewRequired | Owner or authorized reviewer approval is required before AI use. |
| internalOnly | Content may guide internal process but must not be user-facing. |

Rules:

- `ragAllowed: true` requires `aiAllowed: true`.
- `aiAllowed: true` requires `approvalStatus: approved` or `approvalStatus: approved_with_handoff`.
- `riskLevel: blocked` requires `aiAllowed: false` and `ragAllowed: false`.
- `internalOnly: true` must not become a user-facing answer.
- `websiteAllowed: true` does not imply `aiAllowed: true`.
- `evalAllowed: true` must not include unnecessary personal data.

## 11. Approval Fields

Future records should preserve review accountability.

| Field | Type | Meaning |
| --- | --- | --- |
| approvalStatus | enum string | Current approval state. |
| approvedByRole | enum string or null | Role that approved the record. |
| reviewedAt | date string or null | Last human review date. |
| reviewCadence | enum string | Required review rhythm or trigger. |

Rules:

- `approvedByRole` must be `none` or null when approvalStatus is draft, pending_owner_review, blocked, retired, or conflict.
- High-risk records should require owner or authorized reviewer approval.
- `reviewCadence: live_only` means static AI records must not confirm the fact; a future live authority or human handoff is required.
- Retired and conflict records must not be AI or RAG sources.

## 12. Risk Fields

Risk fields explain why a record can or cannot be used.

| Field | Type | Meaning |
| --- | --- | --- |
| riskLevel | enum string | Overall risk classification. |
| volatileFactType | enum string or null | Specific volatile fact category. |
| riskNotes | string or null | Human-readable explanation of risk and restrictions. |

Rules:

- Price, availability, schedule, payment, refund, booking confirmation, guarantees, discounts, credentials, insurance, reviews, ratings, accessibility, and safety should generally be medium or high risk.
- Current price, current availability, live schedule, booking status, payment status, and refund decisions should be treated as live-only or handoff-required unless a future authorized product-system integration exists.
- `riskLevel: blocked` must block AI and RAG use.

## 13. Answer Behavior Fields

Answer behavior fields constrain future AI behavior.

| Field | Type | Meaning |
| --- | --- | --- |
| allowedAnswerBehavior | string | What the AI may say or do. |
| blockedAnswerBehavior | string | What the AI must not say or do. |
| handoffBehavior | string | What the AI should do when human support is required. |

Rules:

- Allowed behavior should be narrow and source-bound.
- Blocked behavior should explicitly prohibit invented prices, live availability, booking confirmation, payment confirmation, refunds, guarantees, unsupported credentials, reviews, ratings, safety claims, and legal claims when relevant.
- Handoff behavior should distinguish "the team can confirm" from "this is confirmed."
- Unknown or unsupported requests should not be answered with generic travel advice as if it were Rick Travel policy.

## 14. Freshness Fields

Freshness fields prevent stale records from becoming active AI sources.

Required freshness field:

- `freshnessPolicy`

Optional freshness fields:

- `effectiveFrom`
- `expiresAt`
- `reviewDueAt`
- `lastSourceCheckedAt`
- `stalenessBehavior`

Allowed stalenessBehavior values:

- block_answer
- handoff_only
- answer_with_limitation
- require_source_refresh

Rules:

- High-risk records should have explicit review due dates or live-only handling.
- Expired records must not be used for AI or RAG unless a future validator explicitly permits negative evaluation use.
- Missing freshness information should fail review for medium and high-risk records.

## 15. Migration Fields

Migration fields should prepare future implementation without creating it.

| Field | Type | Meaning |
| --- | --- | --- |
| migrationState | enum string | Current migration readiness state. |
| migrationNotes | string | Human notes for future conversion. |
| candidateJsonPath | string or null | Planned future path only; not a current file. |
| candidateDatabaseEntity | string or null | Planned future entity only; not a current schema. |
| validatorNotes | string or null | Notes for future validation rules; not executable logic. |

Rules:

- Migration fields are planning metadata only.
- A candidate path must not be treated as permission to create a file.
- A candidate database entity must not be treated as permission to create a schema.
- Validator notes must not be treated as implemented validation logic.

## 16. Example Pseudo-Records in Markdown Documentation Only

The examples below are pseudo-records inside this Markdown document. They are not JSON, YAML, database rows, API payloads, seed data, embeddings, vector-store content, or chatbot behavior.

### Pseudo-Record A - Stable Company Description

| Field | Pseudo-value |
| --- | --- |
| recordId | ai-kr-company-about-001 |
| slug | company-about-general |
| title | Rick Travel general company description |
| locale | en |
| category | company_about |
| sourceAuthority | owner_approved |
| approvalStatus | approved |
| approvedByRole | owner |
| reviewedAt | 2026-06-24 |
| reviewCadence | quarterly |
| riskLevel | low |
| volatileFactType | none |
| websiteAllowed | true |
| aiAllowed | true |
| ragAllowed | true |
| evalAllowed | true |
| handoffRequired | false |
| sourceRequired | true |
| ownerReviewRequired | true |
| internalOnly | false |
| allowedAnswerBehavior | May describe Rick Travel with approved general positioning only. |
| blockedAnswerBehavior | Must not add credentials, ratings, awards, guarantees, insurance, or legal claims. |
| handoffBehavior | Route credential or legal-detail questions to human support. |
| freshnessPolicy | Review quarterly or whenever public positioning changes. |
| migrationState | candidate_for_json_yaml |
| migrationNotes | Candidate for future low-risk structured record after separate approval. |

### Pseudo-Record B - Live Price and Availability Block

| Field | Pseudo-value |
| --- | --- |
| recordId | ai-kr-block-live-price-availability-001 |
| slug | blocked-live-price-availability |
| title | Block static answers for live price and availability |
| locale | en |
| category | pricing |
| sourceAuthority | product_system |
| approvalStatus | blocked |
| approvedByRole | none |
| reviewedAt | null |
| reviewCadence | live_only |
| riskLevel | blocked |
| volatileFactType | price |
| websiteAllowed | false |
| aiAllowed | false |
| ragAllowed | false |
| evalAllowed | true |
| handoffRequired | true |
| sourceRequired | true |
| ownerReviewRequired | true |
| internalOnly | false |
| allowedAnswerBehavior | May say current price and availability require the booking flow or Rick Travel team confirmation. |
| blockedAnswerBehavior | Must not invent, reuse, infer, or confirm current price, seats, dates, capacity, or booking status from static records. |
| handoffBehavior | Offer WhatsApp or booking-flow confirmation. |
| freshnessPolicy | Always live-only or human-confirmed. |
| migrationState | blocked_from_runtime |
| migrationNotes | Candidate only for future negative evaluation or blocking behavior, not RAG. |

### Pseudo-Record C - Unsupported Request Behavior

| Field | Pseudo-value |
| --- | --- |
| recordId | ai-kr-unsupported-request-001 |
| slug | unsupported-request-general |
| title | Unsupported Rick Travel-specific request |
| locale | en |
| category | unsupported_request |
| sourceAuthority | policy_document |
| approvalStatus | approved_with_handoff |
| approvedByRole | ai_governance_reviewer |
| reviewedAt | 2026-06-24 |
| reviewCadence | on_change |
| riskLevel | medium |
| volatileFactType | none |
| websiteAllowed | false |
| aiAllowed | true |
| ragAllowed | true |
| evalAllowed | true |
| handoffRequired | true |
| sourceRequired | false |
| ownerReviewRequired | false |
| internalOnly | false |
| allowedAnswerBehavior | May state that approved Rick Travel sources do not confirm the requested information. |
| blockedAnswerBehavior | Must not guess, improvise Rick Travel policy, or provide generic advice as confirmed company information. |
| handoffBehavior | Route commercial, personal, urgent, safety, accessibility, payment, booking, or custom requests to human support. |
| freshnessPolicy | Review when new approved sources are added. |
| migrationState | candidate_for_validator |
| migrationNotes | Candidate for future missing-source and handoff evaluation cases. |

## 17. Documentation vs Real Data Files

This document is not a data file. Its pseudo-records are examples embedded in Markdown for human review.

This document must not be loaded by a runtime system as a production knowledge base. It must not be chunked, embedded, indexed, or treated as approved RAG content unless a future approved task explicitly defines that behavior.

Creating this Markdown file does not authorize:

- JSON files.
- YAML files.
- Database rows.
- Prisma models.
- API payloads.
- Seed data.
- Validation scripts.
- Tests.
- Embeddings.
- Vector indexes.
- Chatbot prompts.
- Runtime behavior.

## 18. Future Migration Path Toward JSON/YAML Records

A future JSON/YAML migration should happen only after a separate approved task.

Recommended path:

1. Review this format against the contract, examples, and validation rules.
2. Choose a small approved record set for conversion.
3. Define the exact JSON/YAML file naming, folder location, and ownership rules.
4. Convert only selected approved records.
5. Add review evidence proving no blocked or draft records were converted.
6. Keep JSON/YAML records out of runtime until validation and ingestion are separately approved.

No JSON/YAML migration is performed here.

## 19. Future Migration Path Toward Database Records

A future database migration should happen only after backend and database scope are approved.

Recommended path:

1. Decide whether structured records belong in a separate AI Database as described by RT-AI-017.
2. Define conceptual entities from this format.
3. Review privacy, retention, ownership, and source reference constraints.
4. Create a schema only in a separate approved database task.
5. Migrate only approved structured records after validation rules exist.
6. Keep runtime access read-limited by permissions, approval status, and risk level.

No database schema, migration, seed, or database row is created here.

## 20. Future Migration Path Toward Validation Scripts

Future validation scripts should be created only after structured records exist and a separate validator task is approved.

Recommended path:

1. Convert the RT-AI-020A validation rules into a non-runtime checklist.
2. Confirm exact field names and enum values.
3. Add fixtures only when real structured files are approved.
4. Implement checks for required fields, enum values, permission combinations, blocked records, freshness, source references, and volatile fact rules.
5. Keep automated validators separate from answer-generation logic.
6. Require review before validators gate RAG indexing, eval creation, database ingestion, or chatbot responses.

No validation script, test, schema, package dependency, or runtime enforcement is created here.

## 21. Non-Implementation Statement

RT-AI-021A creates a documentation-only format specification. It does not create real structured records, JSON files, YAML files, database schema, migrations, seeds, backend logic, API routes, validation scripts, tests, dependencies, package changes, lockfile changes, LangChain, LangGraph, embeddings, vector stores, RAG pipelines, frontend changes, app changes, component changes, message changes, chatbot behavior, runtime behavior, deployment changes, or production data ingestion.

Any future structured record, machine-readable data file, database model, validator, RAG ingestion, evaluation dataset, or chatbot use must be opened as a separate approved task with its own allowed files, blocked scope, validation, and review evidence.
