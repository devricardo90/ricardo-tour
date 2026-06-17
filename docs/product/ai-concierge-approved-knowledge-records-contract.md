# AI Concierge Approved Knowledge Records Contract

State: REVIEW

Related task: RT-AI-018A

This document defines the product contract for approved Rick Travel AI knowledge records. It is not a runtime implementation. It does not create backend code, API routes, database schema, migrations, seeds, JSON/YAML data files, embeddings, vector stores, LangChain, LangGraph, frontend changes, package changes, lockfile changes, or deploy configuration.

## Purpose

Approved AI knowledge records are the future source-governed content units that the Rick Travel AI Concierge may use for answers, retrieval, source grounding, evaluation, and human handoff decisions.

The contract exists to prevent the AI Concierge from treating all website content, notes, drafts, logs, or product data as automatically safe for AI use. A record must be explicitly reviewed, scoped, and permissioned before it can guide AI answers or retrieval.

Approved AI knowledge records should support:

- Factual answers grounded in reviewed Rick Travel sources.
- Clear separation between content shown on the website and content allowed for AI responses.
- Source traceability for future RAG and evaluations.
- Human review before volatile or commercial claims are used.
- Handoff rules for low confidence, commercial confirmation, safety-sensitive requests, and unsupported questions.
- Future migration into structured records without changing the governance rules.

## WebsiteAllowed vs AIAllowed

Website display permission is not the same as AI usage permission.

| Permission | Meaning | Example |
| --- | --- | --- |
| websiteAllowed | Content may be displayed on the Rick Travel website or internal docs in its intended context. | A tour page may display marketing copy or a general itinerary. |
| aiAllowed | The AI Concierge may use the record to answer user questions. | A reviewed policy answer may be used to explain cancellation expectations. |
| ragAllowed | The record may be chunked, embedded, indexed, retrieved, and used as grounding context in a future RAG system. | A stable approved FAQ can be used for retrieval. |

Rules:

- `websiteAllowed: true` must never imply `aiAllowed: true`.
- `aiAllowed: true` requires source authority, approval status, risk level, and usage permission review.
- `ragAllowed: true` requires `aiAllowed: true` and should be limited to stable, source-grounded content.
- Marketing copy, incomplete drafts, testimonials, unverified claims, and operational notes may be websiteAllowed while still blocked from AI use.

## Source Authority Rules

Every approved AI knowledge record must identify the authority behind the content.

Source authority should classify who or what can approve the fact:

| Source authority | Use |
| --- | --- |
| owner_approved | Business owner or authorized Rick Travel reviewer approved the content. |
| product_system | Fact must come from the product system, such as current tour status or schedule. |
| policy_document | Content comes from an approved policy document. |
| tour_page | Content comes from a published tour page, with review constraints. |
| operational_note | Internal note that may guide handoff but should not automatically be user-facing. |
| external_source | External source requiring explicit verification and citation rules. |

Authority rules:

- Commercial commitments require owner approval or product-system confirmation.
- Current price, availability, schedule, booking status, and payment state must not be treated as static AI facts unless the future backend verifies them from the appropriate source.
- External sources must not override Rick Travel owner-approved or product-system facts.
- Source authority must include a review date or freshness expectation.
- Unsupported or conflicting sources must force clarification or handoff.

## Record Identity Fields

Every future record should define these identity fields conceptually:

| Field | Purpose |
| --- | --- |
| recordId | Stable identifier for the knowledge record. |
| slug | Human-readable stable identifier. |
| title | Short internal title. |
| summary | One or two sentence summary of what the record governs. |
| sourceRefs | Traceable references used to justify the record. |
| sourceAuthority | Authority class for the record. |
| owner | Person or role responsible for review. |
| createdAt | Creation date. |
| updatedAt | Last edit date. |
| lastReviewedAt | Last human review date. |
| reviewDueAt | Date or rule for next review. |
| version | Version label for change tracking. |

No real IDs, schemas, JSON, YAML, or database rows are created by this contract.

## Locale and Language Handling

Every record must declare its language and translation behavior.

Conceptual fields:

- `locale`: the language/locale the record is written for.
- `sourceLocale`: the original source language.
- `translationStatus`: draft, reviewed, approved, blocked, or needs_owner_review.
- `canonicalRecordId`: optional link to the source record when this is a translation.
- `localeNotes`: language-specific constraints, such as tone, legal wording, or unsupported terms.

Rules:

- A record approved in one language is not automatically approved in another.
- Translations must preserve meaning, restrictions, prices, dates, handoff rules, and uncertainty language.
- If a locale-specific approved record does not exist, the AI Concierge should either answer with clear limitation or route to human support.
- For commercial or safety-sensitive topics, machine translation alone is not enough for approval.

## Topic and Category Classification

Every record must have a topic/category so future retrieval and evaluation can be scoped.

Recommended categories:

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

Rules:

- A record may have one primary category and multiple secondary tags.
- Pricing, availability, schedules, guarantees, payments, safety, cancellation, accessibility, and private tours are higher-risk categories.
- Higher-risk categories require stricter review, source grounding, and handoff behavior.

## Approval Status

Every record must have an approval status.

| Status | Meaning | AI use |
| --- | --- | --- |
| draft | Being written or reviewed. | Blocked. |
| pending_owner_review | Needs owner or authorized reviewer approval. | Blocked except for internal review. |
| approved | Approved for the specified permissions and locale. | Allowed only within declared permissions. |
| approved_with_handoff | Approved, but user-facing answer must route to human support for confirmation. | Limited answer plus handoff. |
| blocked | Not allowed for AI use. | Blocked. |
| retired | Previously approved but no longer valid. | Blocked. |
| conflict | Conflicts with another source or unresolved business decision. | Blocked and handoff. |

Rules:

- Only approved records can be used for direct AI answers.
- Approved_with_handoff records may explain general context but must not finalize a commercial commitment.
- Conflict records must never be resolved by the model.
- Retired records must not be used for retrieval or evaluation except as negative examples.

## Risk Level

Risk level determines how strict the usage and review rules must be.

| Risk level | Description | Examples |
| --- | --- | --- |
| low | Stable, non-commercial, low consequence information. | General destination description. |
| medium | Product or policy information that can affect expectations. | Itinerary details, pickup guidance, cancellation overview. |
| high | Commercial, safety, accessibility, payment, or booking-impacting information. | Price, availability, private tour request, safety constraint. |
| blocked | Content should not be used by AI. | Credentials, private data, unverified guarantees. |

Rules:

- High-risk records require sourceRequired and ownerReviewRequired unless the future product system is the live authority.
- High-risk answers should usually include handoffRequired when the user asks for confirmation or a commitment.
- Blocked records must not be used as RAG context except in test suites as examples of what not to answer.

## Usage Permissions

Every record must declare explicit permissions.

| Permission | Required meaning |
| --- | --- |
| websiteAllowed | May be displayed on the website in its intended context. |
| aiAllowed | May be used by the AI Concierge to answer. |
| ragAllowed | May be used in future retrieval/chunking/embedding. |
| evalAllowed | May be used to create evaluation examples. |
| sourceRequired | AI answer must include or reference the source. |
| handoffRequired | AI must route to WhatsApp or human support. |
| ownerReviewRequired | Owner or authorized reviewer must approve before AI use. |
| internalOnly | May guide internal process but must not be user-facing. |

Rules:

- `ragAllowed` must not be true unless `aiAllowed` is true.
- `sourceRequired` should be true for medium and high-risk records.
- `handoffRequired` should be true for commercial commitments, conflicts, low confidence, special requests, and explicit human requests.
- `internalOnly` content must not be exposed to users.
- Evaluation usage should preserve privacy and remove unnecessary personal data.

## Blocked Content Rules

The following content must be blocked from AI use:

- Credentials, tokens, admin links, private URLs, secrets, or internal system details.
- Personal documents, private customer data, payment data, or unnecessary sensitive data.
- Unverified prices, schedules, availability, guarantees, certifications, ratings, reviews, insurance claims, or legal claims.
- Draft business claims not approved by the owner.
- Internal prompts, hidden instructions, evaluation notes, or source-ranking logic.
- Conflicting commercial rules without owner resolution.
- Any answer that would confirm a booking, payment, refund, exception, or private tour without authorized confirmation.
- Unsupported medical, legal, immigration, safety-critical, or emergency advice.
- Content from logs that has not been reviewed and promoted into an approved record or evaluation example.

Blocked content may be used as a negative example in a future evaluation dataset only after review and privacy cleanup.

## Human Handoff Rules

The AI Concierge must require human handoff when:

- The user asks to confirm, change, cancel, or guarantee a booking.
- The user asks for current availability, live schedule, final price, payment confirmation, refund decision, or exception.
- The user asks for a private tour, custom itinerary, group negotiation, special pickup, or commercial discount.
- The answer depends on safety, accessibility, medical constraints, mobility limitations, children, elderly travelers, or weather risk.
- Sources conflict or the record status is pending_owner_review, conflict, blocked, or retired.
- Confidence is low or the user explicitly asks for a person.
- The approved record has `handoffRequired: true`.

Handoff output should be clear: the AI may summarize what is known, explain what must be confirmed, and direct the traveler to WhatsApp. It must not pretend that the handoff decision is a confirmed business outcome.

## Source Grounding Requirements

Every AI-allowed record must support traceability.

Source grounding rules:

- User-facing factual answers should be based on approved sourceRefs.
- High-risk answers require sourceRequired unless routed fully to handoff.
- Source references should identify the source type, title, owner, locale, review date, and approval status.
- The AI must not cite a source it did not use.
- If the future retrieval system returns weak or conflicting sources, the answer should be limited or handed off.
- Source grounding is required for evaluation: future eval examples should identify the expected source references or expected blocked behavior.

## Volatile Facts

Volatile facts are facts that can change or create commercial risk. They need stricter handling than stable descriptive content.

### Prices

- Do not invent or infer prices.
- Static price text must be owner-approved and reviewed for freshness.
- Current/final price should come from the product system or human confirmation.
- If price is missing, outdated, conflicting, or special-case, route to WhatsApp.

### Availability

- Do not claim availability from memory, marketing copy, or old logs.
- Availability must come from the product system or human confirmation.
- If the user asks "is this available today/tomorrow/next week", the answer should verify through the future product authority or hand off.

### Schedules

- Do not invent dates, times, pickup windows, or capacity.
- Published schedules can be described only when sourced and current.
- Custom schedule requests require handoff.

### Guarantees

- Do not invent guarantees about access, weather, wait times, guide identity, views, transport, refunds, or outcomes.
- Guarantee language requires owner approval and sourceRequired.
- If a traveler asks for a guarantee not in approved records, answer that the team must confirm.

### Payments

- Do not create payment links, confirm payment, or collect card/bank details.
- Payment terms must come from approved policy or product flow.
- Payment exceptions and refunds require handoff.

### Commercial Promises

- Do not promise discounts, upgrades, private arrangements, special access, credentials, insurance, or certifications unless approved and sourced.
- Commercial promises require ownerReviewRequired and usually handoffRequired.
- When uncertain, route to WhatsApp rather than improvising.

## Unknown or Unsupported Answers

When the AI Concierge does not have an approved record or adequate source grounding, it must not improvise.

Required behavior:

- Say that the information is not confirmed in the available Rick Travel sources.
- Ask a clarifying question only if it can reduce ambiguity safely.
- Offer WhatsApp handoff when the request is commercial, urgent, personal, or high-risk.
- Avoid generic travel advice when the user asked for a Rick Travel-specific answer.
- Log the gap for future review as a candidate knowledge record or evaluation example.

Unsupported answers should be categorized for later review:

- missing_source
- source_conflict
- needs_owner_review
- volatile_fact
- high_risk_request
- out_of_scope
- human_requested

## Migration Path to Future Structured Records

This contract is the governance layer. Future implementation should migrate it in phases:

1. Keep the contract as Markdown until the record shape is stable.
2. Create a small set of owner-reviewed example records in documentation, not runtime data.
3. Convert approved examples into structured JSON/YAML only after a separate task explicitly authorizes data files.
4. Add validation rules for required fields and permission consistency.
5. Move structured records into the future AI Database only after backend and database tasks are approved.
6. Add retrieval/chunking/embedding only after RAG scope and vector store governance are approved.
7. Promote selected records into evaluation examples with expected answers, expected sources, and blocked-answer cases.

No migration step is implemented by this task.

## Future Readiness

The contract is designed to support the architecture from RT-AI-017:

- Future AI Backend can enforce permissions before answer generation.
- Future AI Database can store record identity, approval, source, and risk metadata.
- Future RAG can retrieve only ragAllowed records.
- Future evaluation datasets can use evalAllowed records and rejected/blocked examples.
- Future human review can approve, reject, retire, or mark records as handoffRequired.
- Future LangChain or LangGraph workflows can use these flags for retrieval, validation, blocking, and WhatsApp handoff.

## Non-Implementation Statement

RT-AI-018A creates a product contract only. It does not implement runtime AI behavior, backend services, API routes, database schema, migrations, seeds, JSON/YAML records, dependencies, LangChain, LangGraph, embeddings, vector store, frontend changes, package changes, lockfile changes, deployment, or production data ingestion.

Any future implementation must be opened as a separate approved task with its own allowed files, blocked scope, validation, and review evidence.
