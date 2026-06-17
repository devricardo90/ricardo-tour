# AI Concierge Knowledge Record Validation Rules

State: REVIEW

Related task: RT-AI-020A

This document defines documentation-only validation rules for future Rick Travel AI knowledge records. It describes how records should be reviewed before AI usage, retrieval, evaluation, or human handoff behavior.

This is not a runtime implementation. It does not create validation scripts, tests, JSON/YAML records, database schemas, migrations, seeds, backend services, API routes, dependencies, embeddings, vector stores, LangChain, LangGraph, frontend changes, chatbot behavior, or deployment configuration.

## 1. Purpose and Scope

The purpose of these validation rules is to prevent unsafe or ambiguous future AI knowledge records from becoming approved AI sources.

The rules apply to any future record that may be used for:

- AI answers.
- Retrieval or future RAG.
- Evaluation examples.
- Human handoff decisions.
- Source grounding.
- Blocking or refusal behavior.

The rules are intentionally conservative because Rick Travel AI answers may affect commercial expectations, booking decisions, traveler safety, accessibility needs, payments, refunds, and trust.

These rules are human governance rules first. A future task may translate them into automated validators, but no validator is implemented here.

## 2. Required Fields

Every future AI knowledge record must include these fields before it can be reviewed:

| Field | Requirement |
| --- | --- |
| recordId | Stable identifier. Must be unique and not reused after retirement. |
| title | Short human-readable title. |
| locale | Language/locale for the record. |
| topic/category | Primary category for retrieval and review. |
| sourceAuthority | Authority class that supports the record. |
| approvalStatus | Current approval state. Must use an allowed value. |
| riskLevel | Risk classification. Must use an allowed value. |
| websiteAllowed | Whether the content can appear on the website. |
| aiAllowed | Whether the AI Concierge may use the record for answers. |
| ragAllowed | Whether the record may be retrieved, chunked, embedded, or indexed in future RAG. |
| handoffRequired | Whether the answer must route to human support. |
| sourceRequired | Whether the AI answer must be grounded in a source reference. |
| ownerReviewRequired | Whether owner or authorized reviewer approval is required. |
| allowedAnswerBehavior | What the AI may say or do when using the record. |
| blockedAnswerBehavior | What the AI must not say or do. |
| freshness/review expectation | Review cadence or trigger for re-review. |
| notes for future migration to structured data | Human notes for later structured conversion. |

Required supporting metadata:

- sourceRefs or an explicit reason why sourceRefs are not applicable.
- created or reviewed date in future structured form.
- owner or reviewer role in future structured form.

FAIL if any required field is missing, ambiguous, or replaced by free-form assumptions.

## 3. Allowed Values for approvalStatus

Allowed values:

| approvalStatus | Meaning | AI usage |
| --- | --- | --- |
| draft | Being written or reviewed. | Not allowed. |
| pending_owner_review | Needs owner or authorized reviewer approval. | Not allowed. |
| approved | Approved for declared permissions. | Allowed within permissions. |
| approved_with_handoff | Approved, but human confirmation is required for final action or commitment. | Limited answer plus handoff. |
| blocked | Not allowed for AI use. | Not allowed. |
| retired | Previously valid but no longer current. | Not allowed. |
| conflict | Conflicts with another source or unresolved business decision. | Not allowed except as a handoff/blocking signal. |

Rules:

- AI answer usage requires `approvalStatus: approved` or `approvalStatus: approved_with_handoff`.
- RAG usage requires `approvalStatus: approved` or `approvalStatus: approved_with_handoff`.
- Blocked, retired, conflict, draft, and pending_owner_review records must not become answer or RAG sources.
- Conflict records should route to handoff rather than model judgment.

## 4. Allowed Values for riskLevel

Allowed values:

| riskLevel | Meaning | Typical handling |
| --- | --- | --- |
| low | Stable, non-commercial, low consequence information. | AI use may be allowed with source grounding. |
| medium | Product or policy information that affects expectations. | Source required; handoff may be required. |
| high | Commercial, safety, accessibility, payment, booking, or trust-sensitive information. | Source required and owner review required; handoff often required. |
| blocked | Content must not be used for AI answers or RAG. | Blocked, retired, or negative-example use only. |

Rules:

- High-risk records must have `sourceRequired: true`.
- High-risk records must usually have `ownerReviewRequired: true`.
- Blocked risk records must have `aiAllowed: false` and `ragAllowed: false`.
- Risk must be raised when the content touches volatile facts, payments, refunds, booking confirmation, guarantees, credentials, insurance, reviews, ratings, accessibility, or safety.

## 5. Allowed Permission Combinations

Allowed combinations:

| Scenario | websiteAllowed | aiAllowed | ragAllowed | handoffRequired | sourceRequired |
| --- | --- | --- | --- | --- | --- |
| Website-only marketing content | true | false | false | false | optional |
| Stable AI answer record | true or false | true | true or false | false | true |
| Approved handoff guidance | true or false | true | true or false | true | optional or true |
| Evaluation-only negative example | false | false | false | true or false | true or false |
| Blocked internal note | false | false | false | true or false | false |

Rules:

- `ragAllowed: true` is valid only when `aiAllowed: true`.
- `aiAllowed: true` requires approved or approved_with_handoff status.
- `sourceRequired: true` is expected for medium and high-risk records.
- `handoffRequired: true` is expected when the answer requires commercial or human confirmation.
- Website display permission does not grant AI usage permission.

## 6. Forbidden Permission Combinations

The following combinations must fail validation:

| Invalid combination | Reason |
| --- | --- |
| `ragAllowed: true` while `aiAllowed: false` | RAG retrieval is AI usage. |
| `aiAllowed: true` while `approvalStatus: blocked` | Blocked records cannot be AI sources. |
| `aiAllowed: true` while `approvalStatus: draft` | Draft records are not approved. |
| `aiAllowed: true` while `approvalStatus: pending_owner_review` | Owner review is incomplete. |
| `aiAllowed: true` while `approvalStatus: retired` | Retired records are no longer valid. |
| `aiAllowed: true` while `approvalStatus: conflict` | The model must not resolve source conflicts. |
| `riskLevel: blocked` with `aiAllowed: true` | Blocked risk cannot be used for answers. |
| `riskLevel: blocked` with `ragAllowed: true` | Blocked content cannot be retrieval content. |
| High-risk commercial record with `sourceRequired: false` | Commercial claims need grounding. |
| High-risk commercial record with `ownerReviewRequired: false` | Commercial claims need review unless live product-system authority applies. |
| Live price/availability record without product-system authority or handoff | Static AI records must not confirm live commercial facts. |
| `internalOnly: true` content exposed to users | Internal notes must not become user-facing answers. |

## 7. websiteAllowed vs aiAllowed

Rules:

- `websiteAllowed: true` means the content can appear on the website in its intended context.
- `aiAllowed: true` means the AI Concierge may use the content under declared constraints.
- `websiteAllowed: true` must not automatically imply `aiAllowed: true`.
- A website page may contain marketing language that is safe for display but unsafe for AI generalization.
- AI usage requires source authority, approval status, risk classification, and permission review.

FAIL examples:

- A tour card tagline is websiteAllowed and then treated as a source for guarantees.
- A general marketing sentence is used to answer a safety, accessibility, or payment question.
- A public page mentions a tour and the AI infers live availability.

PASS examples:

- Website copy remains websiteAllowed only.
- A separate owner-reviewed record restates a stable fact with `aiAllowed: true`.
- A tour overview is AI-allowed only for general summary, with price and availability excluded.

## 8. ragAllowed Requires aiAllowed

Rules:

- `ragAllowed: true` requires `aiAllowed: true`.
- RAG content must be approved for AI use before chunking, embedding, indexing, or retrieval.
- A blocked record may be used as a negative evaluation example only if a future eval task explicitly allows it; it must not become RAG context.
- Draft, retired, pending, conflict, or blocked records must not be embedded or indexed.

Invalid:

- `ragAllowed: true`, `aiAllowed: false`.
- `ragAllowed: true`, `approvalStatus: blocked`.
- `ragAllowed: true`, `riskLevel: blocked`.
- `ragAllowed: true` for old logs that were not human-reviewed and promoted.

## 9. handoffRequired Rules

`handoffRequired: true` must be used when:

- The user asks for booking confirmation, booking changes, cancellation, refund, payment confirmation, discount, private arrangement, or exception.
- The record contains volatile commercial facts.
- The record has `approvalStatus: approved_with_handoff`.
- Sources conflict.
- Confidence would be low or the approved source does not answer the user request.
- The user explicitly asks for a human.
- The topic involves safety, accessibility, medical constraints, children, elderly travelers, weather risk, mobility limitations, or special assistance.

Rules:

- Handoff does not mean the AI confirms the outcome.
- The AI may summarize what is known, then route to WhatsApp or human support.
- Handoff records should avoid private contact details unless the public support path is approved.

## 10. sourceRequired Rules

`sourceRequired: true` must be used when:

- `riskLevel` is medium or high.
- The record supports product, policy, commercial, safety, accessibility, payment, refund, booking, credential, insurance, review, rating, or guarantee claims.
- The record may be used for RAG.
- The answer could affect traveler expectations or purchase decisions.

Rules:

- A source reference must be traceable to an approved authority.
- The AI must not cite a source it did not use.
- If sources are missing, stale, or conflicting, the answer must be limited or handed off.

## 11. ownerReviewRequired Rules

`ownerReviewRequired: true` must be used when:

- The record is high risk.
- The record includes commercial claims, pricing, availability, schedules, payments, refunds, booking confirmation, guarantees, discounts, credentials, insurance, reviews, ratings, accessibility, safety, or private tours.
- The record changes public promises or support expectations.
- The record resolves a conflict between sources.

Rules:

- Owner review must happen before `approvalStatus` becomes approved or approved_with_handoff.
- Owner review cannot be replaced by AI judgment.
- Product-system authority can provide live facts only in future runtime architecture; this document does not implement that authority.

## 12. Blocked Records

Blocked records must follow these rules:

- `approvalStatus: blocked`.
- `riskLevel: blocked`.
- `aiAllowed: false`.
- `ragAllowed: false`.
- `websiteAllowed: false` unless there is a separate reason the content is public but blocked from AI use.
- Must include blockedAnswerBehavior explaining what must not be answered.
- May include allowedAnswerBehavior only for limitation, refusal, or handoff behavior.

Blocked records must not:

- Become answer sources.
- Become RAG content.
- Be embedded or indexed.
- Be used to infer safe answers.
- Be converted into structured runtime data without explicit future review.

## 13. Volatile Fact Rules

Volatile facts are facts that can change, create commercial risk, or require human/product-system confirmation.

### Price

Rules:

- Do not invent prices.
- Do not infer prices from old examples, logs, messages, or marketing text.
- Static records must not confirm final/live prices.
- Price records require sourceRequired, ownerReviewRequired, and usually handoffRequired unless a future live product-system authority is implemented.

FAIL: AI answers a current tour price from a Markdown example.

PASS: AI says current pricing must be confirmed through the booking flow or WhatsApp.

### Availability

Rules:

- Do not invent availability or seat count.
- Static records cannot confirm current availability.
- Availability requires product-system authority or human handoff.

FAIL: AI says a tour is available tomorrow from memory.

PASS: AI routes availability questions to the booking flow or WhatsApp.

### Schedule

Rules:

- Do not invent dates, times, pickup windows, or capacity.
- Published schedule content requires sourceRequired and freshness review.
- Custom schedule requests require handoff.

### Payment

Rules:

- Do not create payment links.
- Do not confirm payment.
- Do not collect card, bank, or sensitive payment details.
- Payment policy records require sourceRequired and ownerReviewRequired.

### Refund

Rules:

- Do not promise refunds or exceptions.
- Refund questions require approved policy source and often handoff.
- Any exception requires human confirmation.

### Booking Confirmation

Rules:

- The AI must not confirm a booking.
- Booking status must come from the product system or human support.
- The AI may explain the booking process only if sourced and approved.

### Guarantees

Rules:

- Do not invent guarantees about access, weather, views, guide identity, transport, wait time, refunds, safety, or outcomes.
- Guarantee language requires sourceRequired and ownerReviewRequired.
- Unsupported guarantee requests require handoff.

### Discounts

Rules:

- Do not promise discounts, upgrades, or special pricing.
- Discounts require owner approval and handoff.
- The AI may say the team can review the request.

### Credentials

Rules:

- Do not invent credentials, licenses, certifications, permits, or official registrations.
- Credential claims require explicit approved source authority.
- Private credential details must not be exposed unless approved for public display.

### Insurance

Rules:

- Do not invent insurance coverage.
- Insurance claims require approved policy or owner-approved source.
- Ambiguous insurance questions require handoff.

### Reviews and Ratings

Rules:

- Do not invent ratings, testimonials, review counts, awards, rankings, or customer quotes.
- Reviews or ratings require approved source and permission for public/AI use.
- The AI must not summarize nonexistent review sentiment.

## 14. Unknown or Unsupported Answers

Rules:

- If no approved record supports the answer, the AI must not guess.
- The answer should clearly state that approved Rick Travel sources do not confirm the requested information.
- The AI may ask one clarifying question when that can safely reduce ambiguity.
- Commercial, urgent, personal, safety-sensitive, accessibility-related, payment-related, or booking-related unknowns require handoff.
- Unsupported requests should be logged in a future system as candidates for review, not automatically converted into knowledge.

PASS: "I do not have an approved Rick Travel source confirming that. The team can confirm it by WhatsApp."

FAIL: "I am not sure, but it is probably available."

## 15. PASS / FAIL Examples

| Case | Result | Reason |
| --- | --- | --- |
| `approvalStatus: approved`, `riskLevel: low`, `aiAllowed: true`, `ragAllowed: true`, `sourceRequired: true` | PASS | Stable sourced AI/RAG record. |
| `websiteAllowed: true`, `aiAllowed: false`, `ragAllowed: false` | PASS | Website-only content is allowed. |
| `approvalStatus: approved_with_handoff`, `riskLevel: high`, `aiAllowed: true`, `handoffRequired: true`, `sourceRequired: true` | PASS | High-risk answer is limited and handed off. |
| `ragAllowed: true`, `aiAllowed: false` | FAIL | RAG is AI usage. |
| `aiAllowed: true`, `approvalStatus: blocked` | FAIL | Blocked records cannot be AI sources. |
| `riskLevel: high`, `sourceRequired: false` | FAIL | High-risk content requires grounding. |
| Live price record with static source only and `handoffRequired: false` | FAIL | Live pricing requires product authority or human confirmation. |
| Availability claim sourced from an old conversation log | FAIL | Logs are not approved facts. |
| `internalOnly: true` and user-facing answer allowed | FAIL | Internal-only content cannot be exposed. |
| Unknown booking question routed to WhatsApp | PASS | Unsupported commercial request is handed off. |

## 16. Future Migration Path Toward Automated Validators

Future migration should happen in phases:

1. Keep these rules as human-readable governance.
2. Review the rules against real Markdown examples.
3. Add more PASS/FAIL documentation examples if needed.
4. In a separate approved task, define a structured record format.
5. In a separate approved task, define a non-runtime validation checklist.
6. In a separate approved task, create automated validation scripts or tests only after structured records exist.
7. In a separate approved task, connect validation to the future AI Backend and AI Database.
8. In a separate approved task, enforce RAG indexing only for records that pass validation.

No automated validator, test, schema, JSON/YAML record, database migration, backend logic, RAG pipeline, embedding job, vector store, LangChain workflow, LangGraph workflow, or chatbot behavior is implemented by this document.

## Non-Implementation Statement

RT-AI-020A creates validation rules only. It does not implement backend behavior, API routes, database schema, migrations, seeds, JSON/YAML records, validation scripts, automated tests, dependencies, LangChain, LangGraph, embeddings, vector store, frontend changes, chatbot behavior, runtime behavior, deploy configuration, or production data ingestion.
