# Rick Travel AI Concierge - Approved Public Business Evidence Values

## 1. Purpose

This document is the approved-values register for real Rick Travel business evidence values that may later be used publicly, on the website, or by the Rick Travel AI Concierge.

This document is documentation-only. It does not create JSON, YAML, seed files, API routes, frontend, backend, database changes, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, package files, lockfiles, or runtime ingestion.

No real business value is public by default. A value may be used only when the owner explicitly approves the exact value, source, permitted usage, language, risk level, and limitation text.

## 2. Relationship To RT-AI-008

RT-AI-008 defines the evidence schema and governance layer in `docs/product/ai-concierge-verified-business-evidence-records.md`.

RT-AI-009 keeps the approved-values register separate from the governance schema to avoid mixing format rules with real business data. Every value in this document must follow RT-AI-008 approval and blocking rules.

## 3. Record Format

Every value record must include:

| Field | Requirement |
| --- | --- |
| `id` | Stable record identifier. |
| `label` | Human-readable label for the value. |
| `value` | Exact approved value, or `NO_APPROVED_VALUE_RECORDED` / `BLOCKED_SENSITIVE_VALUE` when not approved. |
| `source` | Evidence source, or `NONE_APPROVED` when no source is approved. |
| `sourceAuthority` | `owner`, `official`, `primary_public`, `approved_public`, `conditional`, or `blocked`. |
| `ownerApproval` | Explicit owner decision or `not_approved`. |
| `approvalStatus` | `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`. |
| `publicAllowed` | Whether the value may be repeated publicly. Defaults to `false`. |
| `websiteAllowed` | Whether the value may appear on the website. Defaults to `false`. |
| `aiAllowed` | Whether the AI Concierge may use the value as a public fact. Defaults to `false`. |
| `handoffRequired` | Whether questions about the value require human support. |
| `riskLevel` | `low`, `medium`, `high`, or `critical`. |
| `language` | Approved language or `all` for language-independent blocking rules. |
| `lastReviewedAt` | Last review date. |
| `notes` | Limitation text, missing evidence, and blocked usage. |

## 4. Approval Rules

- `publicAllowed`, `websiteAllowed`, and `aiAllowed` must be explicit and default to `false`.
- Screenshots alone are not sufficient for high-risk categories.
- Runtime use remains blocked until a future technical implementation task.
- Owner approval for website use does not automatically approve AI use.
- Owner approval in one language does not automatically approve another language.
- Values with missing, stale, conflicting, private, or sensitive evidence must remain `PENDING_OWNER_APPROVAL` or `BLOCKED`.

## 5. Approved For Public Website Use

No real Rick Travel business evidence value is approved for public website use in this document yet.

Future entries in this section must have:

- `approvalStatus`: `APPROVED`;
- `publicAllowed`: `true`;
- `websiteAllowed`: `true`;
- exact source and owner approval;
- limitation text that prevents broader claims than the evidence supports.

## 6. Approved For Future AI Concierge Use

No real Rick Travel business evidence value is approved for future AI Concierge factual use in this document yet.

Future entries in this section must have:

- `approvalStatus`: `APPROVED`;
- `publicAllowed`: `true`;
- `aiAllowed`: `true`;
- exact source and owner approval;
- language-specific approval;
- limitation text suitable for AI responses;
- separate future technical implementation before runtime use.

## 7. Approved Only For Internal Or Handoff Use

No real Rick Travel business evidence value is approved only for internal or handoff use in this document yet.

Future entries in this section may support support-team routing or owner review, but must not be repeated publicly unless `publicAllowed=true`.

## 8. Pending Owner Confirmation

The records below are placeholders for categories that may later receive exact owner-approved values. They are not approved facts.

### Pending Record 1 - CNPJ / Legal Entity / Trade Name

- `id`: `approved-values-pending-legal-identity-v1`
- `label`: `CNPJ / legal entity / trade name`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not publish CNPJ, legal entity, trade name, legal address, or registry status until exact official evidence and owner approval are recorded.`

### Pending Record 2 - Cadastur Company Record

- `id`: `approved-values-pending-cadastur-company-v1`
- `label`: `Cadastur company record`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state Cadastur number, status, validity, registration class, or government credential claim without exact official evidence and owner approval.`

### Pending Record 3 - Guide Credential

- `id`: `approved-values-pending-guide-credential-v1`
- `label`: `Guide credential`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state guide credential numbers, accredited guide claims, named guide assignment, language availability, or certification claims without exact evidence and approval.`

### Pending Record 4 - Public WhatsApp

- `id`: `approved-values-pending-public-whatsapp-v1`
- `label`: `Public WhatsApp`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not publish or repeat any WhatsApp number until the owner approves the exact public number, display format, and usage scope.`

### Pending Record 5 - Public Email

- `id`: `approved-values-pending-public-email-v1`
- `label`: `Public email`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not publish or repeat any email address until the owner approves the exact public address, inbox purpose, and usage scope.`

### Pending Record 6 - Official Social Media Links

- `id`: `approved-values-pending-social-media-v1`
- `label`: `Official social media links`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not link, display, or name social profiles until exact official URLs/handles and owner approval are recorded.`

### Pending Record 7 - Service Hours

- `id`: `approved-values-pending-service-hours-v1`
- `label`: `Service hours`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state opening hours, support hours, response times, or response guarantees without approved policy evidence.`

### Pending Record 8 - Booking Policy

- `id`: `approved-values-pending-booking-policy-v1`
- `label`: `Booking policy`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `conditional`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Manual assisted booking remains the safe boundary. Do not confirm availability, pickup, seats, guide, schedule, or booking status.`

### Pending Record 9 - Payment Policy

- `id`: `approved-values-pending-payment-policy-v1`
- `label`: `Payment policy`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state payment methods, payment links, Pix, bank details, deposits, installments, payment status, discounts, or provider details.`

### Pending Record 10 - Cancellation / Refund Policy

- `id`: `approved-values-pending-cancellation-refund-policy-v1`
- `label`: `Cancellation / refund policy`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state cancellation windows, refund eligibility, free rescheduling, weather rules, no-show rules, or case decisions without approved policy evidence.`

### Pending Record 11 - Published Tours

- `id`: `approved-values-pending-published-tours-v1`
- `label`: `Published tours`
- `value`: `NO_STATIC_APPROVED_VALUE_RECORDED`
- `source`: `Public catalog with isPublished=true required at review time`
- `sourceAuthority`: `primary_public`
- `ownerApproval`: `not_approved_for_static_register`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `This document does not snapshot tour names, prices, descriptions, or availability. Future use must revalidate the current public catalog with isPublished=true. TripSchedule is not availability.`

### Pending Record 12 - Official Photos

- `id`: `approved-values-pending-official-photos-v1`
- `label`: `Official photos`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not treat photos as official or reusable until ownership, license, usage rights, subject suitability, and tour alignment are approved.`

### Pending Record 13 - Reviews / Testimonials

- `id`: `approved-values-pending-reviews-testimonials-v1`
- `label`: `Reviews / testimonials`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state ratings, review counts, testimonials, customer quotes, star averages, rankings, or satisfaction claims without verifiable source, consent, attribution, date, and approval.`

### Pending Record 14 - Insurance, Certificates, Licenses, Or Safety-Related Claims

- `id`: `approved-values-pending-insurance-certificates-safety-v1`
- `label`: `Insurance, certificates, licenses, or safety-related claims`
- `value`: `NO_APPROVED_VALUE_RECORDED`
- `source`: `NONE_APPROVED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Do not state insurance, certificates, licenses, safety guarantees, accessibility guarantees, risk-free language, emergency support, or legal compliance claims without exact evidence and owner approval.`

## 9. Blocked / Sensitive Values

The following values are blocked and must not be published, displayed, repeated by AI, embedded, seeded, or ingested into runtime:

### Blocked Record 1 - Personal And Private Data

- `id`: `approved-values-blocked-private-personal-data-v1`
- `label`: `Private personal data`
- `value`: `BLOCKED_SENSITIVE_VALUE`
- `source`: `BLOCKED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_eligible_for_public_approval`
- `approvalStatus`: `BLOCKED`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `CPF, private phone numbers, private addresses, private emails, personal documents, signatures, QR codes, and document scans are blocked from public, website, and AI use.`

### Blocked Record 2 - Operational, Customer, Payment, And Admin Data

- `id`: `approved-values-blocked-operational-private-data-v1`
- `label`: `Operational, customer, payment, and admin data`
- `value`: `BLOCKED_SENSITIVE_VALUE`
- `source`: `BLOCKED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_eligible_for_public_approval`
- `approvalStatus`: `BLOCKED`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Payment data, login/admin data, customer data, booking data, contact submissions, analytics, logs, credentials, passwords, tokens, .env data, and payment keys are blocked.`

### Blocked Record 3 - Unsupported Public Claims

- `id`: `approved-values-blocked-unsupported-claims-v1`
- `label`: `Unsupported public claims`
- `value`: `BLOCKED_UNSUPPORTED_CLAIM`
- `source`: `BLOCKED`
- `sourceAuthority`: `blocked`
- `ownerApproval`: `not_approved`
- `approvalStatus`: `BLOCKED`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `language`: `all`
- `lastReviewedAt`: `2026-06-08`
- `notes`: `Unsupported claims, fake testimonials, unofficial prices, unverified tour availability, best/biggest/safest claims, and absolute safety language are blocked.`

## 10. Runtime And Technical Implementation Block

This register does not authorize runtime use.

Before any future technical use:

- a separate implementation task must be opened;
- values must be reviewed again for exactness and current approval;
- JSON/YAML/seed/database/API/RAG/chat implementation must be explicitly authorized;
- blocked and pending records must remain unavailable to public responses except as guardrails;
- AI responses must still follow the prompt contract, handoff rules, and no-invention rule.

## 11. Non-Goals

This document does not:

- add real approved business values;
- publish CNPJ, Cadastur, guide credentials, WhatsApp, email, social links, hours, policies, photos, reviews, insurance, certificates, licenses, or safety claims;
- create JSON;
- create YAML;
- create seed;
- alter API, frontend, backend, database, schema, package files, or lockfiles;
- create RAG, embeddings, LangChain, LangGraph, chatbot, or deploy;
- ingest data into runtime.
