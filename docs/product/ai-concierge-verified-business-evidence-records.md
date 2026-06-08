# Rick Travel AI Concierge - Verified Business Evidence Records

## 1. Purpose

This document defines how real Rick Travel business evidence must be recorded, reviewed, approved, blocked, and later used safely by the public website or the Rick Travel AI Concierge.

This is an evidence governance document. It does not publish real business data by default, does not create machine-readable KB data, does not create JSON, YAML, seed files, embeddings, RAG, API routes, chat UI, LangChain, LangGraph, code, deploy, or runtime ingestion.

No sensitive or private data may be treated as public, website-safe, or AI-safe unless a record has exact evidence, explicit owner approval, review date, and explicit usage permissions.

## 2. Relationship To Prior AI Concierge Documents

This document extends the blocking and approval rules from:

- `docs/product/ai-concierge-first-curated-kb-records.md`
- `docs/product/ai-concierge-first-kb-seed-scope.md`
- `docs/product/ai-concierge-knowledge-base-format.md`
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`

RT-AI-007 blocked real business evidence such as CNPJ, Cadastur, contact channels, policies, reviews, certifications, insurance, and safety claims until owner-approved evidence exists. RT-AI-008 defines the evidence record structure that must be satisfied before any such data can be promoted.

## 3. Evidence Record Format

Every future evidence record must include:

| Field | Requirement |
| --- | --- |
| `id` | Stable, unique evidence identifier. |
| `category` | Evidence category, such as `cnpj`, `cadastur`, `public_whatsapp`, or `payment_policy`. |
| `title` | Short editorial title. |
| `evidenceValue` | Exact proposed value or placeholder. Never infer this field. |
| `evidenceSource` | Verifiable source, document, owner-provided evidence reference, or `NONE_APPROVED`. |
| `sourceType` | Type of evidence source, such as `official_registry`, `owner_document`, `public_website`, `platform_profile`, `policy_document`, `public_catalog`, `asset_rights`, or `none`. |
| `sourceAuthority` | Authority level: `owner`, `official`, `primary_public`, `approved_public`, `conditional`, or `blocked`. |
| `owner` | Role responsible for approval and review. |
| `approvalStatus` | `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`. |
| `reviewedAt` | Date the evidence was reviewed. |
| `updatedAt` | Date the evidence record was last updated. |
| `publicAllowed` | Whether the value may be stated publicly. |
| `websiteAllowed` | Whether the value may be displayed on the website. |
| `aiAllowed` | Whether the AI Concierge may use the value in a response. |
| `handoffRequired` | Whether questions about the record require human support. |
| `riskLevel` | `low`, `medium`, `high`, or `critical`. |
| `notes` | Usage limits, missing evidence, blocked phrasing, and review instructions. |

No field may be implied from another source. `publicAllowed`, `websiteAllowed`, and `aiAllowed` must be explicit and must default to `false` until approved.

## 4. Approval Rules

- `APPROVED`: exact evidence exists, owner approval exists, `reviewedAt` is current, and allowed usage flags are explicit.
- `CONDITIONAL`: evidence may be usable only with limitation text or a specific condition.
- `PENDING_OWNER_APPROVAL`: evidence is missing, incomplete, unreviewed, or awaiting business decision; human handoff is required.
- `BLOCKED`: the value must not be stated, displayed, retrieved as a public fact, or used by AI except as a guardrail.

Default state:

- `approvalStatus`: `PENDING_OWNER_APPROVAL` or `BLOCKED`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`

## 5. Evidence Records

The records below are placeholders and blocking records. They are not approved business facts.

### Record 1 - CNPJ / Legal Entity / Trade Name

- `id`: `evidence-business-legal-identity-v1`
- `category`: `cnpj_legal_entity_trade_name`
- `title`: `CNPJ, legal entity, and trade name evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state CNPJ, razao social, nome fantasia, legal address, tax status, or legal entity claims until exact official evidence and owner approval are recorded.`

### Record 2 - Cadastur Company Record

- `id`: `evidence-business-cadastur-company-v1`
- `category`: `cadastur_company`
- `title`: `Cadastur company registration evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state Cadastur number, status, validity, activity class, or government registration claim without exact official source and approval.`

### Record 3 - Guide Credential

- `id`: `evidence-business-guide-credential-v1`
- `category`: `guide_credential`
- `title`: `Guide credential evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state guide credential numbers, accredited guide claims, named guide assignments, language coverage, or guide availability without approved evidence.`

### Record 4 - Public WhatsApp

- `id`: `evidence-contact-public-whatsapp-v1`
- `category`: `public_whatsapp`
- `title`: `Approved public WhatsApp evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Do not publish or repeat any WhatsApp number until the owner approves the exact public number, display format, consent to publish, and usage scope.`

### Record 5 - Public Email

- `id`: `evidence-contact-public-email-v1`
- `category`: `public_email`
- `title`: `Approved public email evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Do not publish or repeat any email address until the owner approves the exact public address, inbox purpose, and usage scope.`

### Record 6 - Official Social Media

- `id`: `evidence-contact-official-social-media-v1`
- `category`: `official_social_media`
- `title`: `Official social media evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Produto Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `notes`: `Do not link, display, or name social profiles until exact official URLs/handles and publication approval are recorded.`

### Record 7 - Service Hours

- `id`: `evidence-operations-service-hours-v1`
- `category`: `service_hours`
- `title`: `Service hours evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `notes`: `Do not state opening hours, response hours, support windows, response times, or response guarantees without approved policy evidence.`

### Record 8 - Booking Policy

- `id`: `evidence-policy-booking-v1`
- `category`: `booking_policy`
- `title`: `Booking policy evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `conditional`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Manual/assisted booking remains the safe boundary. Do not confirm availability, seats, pickup, guide, schedule, or booking status without separate approved policy and runtime authorization.`

### Record 9 - Payment Policy

- `id`: `evidence-policy-payment-v1`
- `category`: `payment_policy`
- `title`: `Payment policy evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state Pix, card, transfer, cash, PayPal, Mercado Pago, links, payment timing, deposits, installments, payment status, discounts, or special conditions without approved policy evidence.`

### Record 10 - Cancellation / Refund Policy

- `id`: `evidence-policy-cancellation-refund-v1`
- `category`: `cancellation_refund_policy`
- `title`: `Cancellation and refund policy evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state cancellation windows, refund eligibility, free rescheduling, weather rules, no-show rules, or case decisions without approved policy evidence.`

### Record 11 - Published Tours

- `id`: `evidence-catalog-published-tours-v1`
- `category`: `published_tours`
- `title`: `Published tour evidence source rule`
- `evidenceValue`: `PUBLIC_CATALOG_WITH_ISPUBLISHED_TRUE_REQUIRED`
- `evidenceSource`: `Public website tour catalog and public trip API filtered by isPublished=true`
- `sourceType`: `public_catalog`
- `sourceAuthority`: `primary_public`
- `owner`: `Owner / Produto Rick Travel`
- `approvalStatus`: `CONDITIONAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `notes`: `This record approves only the evidence rule, not a static list of tours. Future use must revalidate the current public catalog with isPublished=true. TripSchedule must not be treated as availability.`

### Record 12 - Official Photos

- `id`: `evidence-assets-official-photos-v1`
- `category`: `official_photos`
- `title`: `Official photo and usage-rights evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Produto Rick Travel`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Do not treat images as official or reusable unless source, ownership/license, subject suitability, tour alignment, and publication rights are approved.`

### Record 13 - Reviews / Testimonials

- `id`: `evidence-trust-reviews-testimonials-v1`
- `category`: `reviews_testimonials`
- `title`: `Reviews and testimonials evidence`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Produto Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Do not state ratings, review counts, testimonials, customer quotes, star averages, platform rankings, or satisfaction claims without verifiable source and approval.`

### Record 14 - Insurance, Certificates, Licenses, And Safety Claims

- `id`: `evidence-trust-insurance-certificates-safety-v1`
- `category`: `insurance_certificates_licenses_safety_claims`
- `title`: `Insurance, certificates, licenses, and safety-related claims`
- `evidenceValue`: `PLACEHOLDER_ONLY_NOT_APPROVED`
- `evidenceSource`: `NONE_APPROVED`
- `sourceType`: `none`
- `sourceAuthority`: `blocked`
- `owner`: `Owner / Operacao Rick Travel`
- `approvalStatus`: `BLOCKED`
- `reviewedAt`: `2026-06-08`
- `updatedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `websiteAllowed`: `false`
- `aiAllowed`: `false`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `Do not state insurance coverage, certification, licensing, safety guarantee, risk-free language, emergency support, accessibility guarantee, or legal compliance claims without exact evidence and owner approval.`

## 6. Category-Specific Blocking Rules

These categories must remain `PENDING_OWNER_APPROVAL` or `BLOCKED` unless exact evidence and explicit owner approval are recorded:

- CNPJ / legal entity / trade name;
- Cadastur company record;
- guide credentials;
- public WhatsApp;
- public email;
- official social media;
- service hours or response times;
- booking policy beyond assisted/manual confirmation boundaries;
- payment policy, payment methods, payment links, payment status, or discounts;
- cancellation, refund, rescheduling, weather, or no-show policy;
- official photo rights and commercial usage;
- reviews, testimonials, ratings, rankings, or customer claims;
- insurance, certificates, licenses, guide credentials, safety, accessibility, or legal compliance claims.

Published tours are conditional: a future implementation may use only the current public catalog filtered by `isPublished=true`, and must not treat `TripSchedule`, capacity, schedule status, or future dates as confirmed availability.

## 7. Website And AI Usage Rules

Website use:

- `websiteAllowed=true` is required before a value can be displayed on the website.
- Website copy must match the approved evidence wording and limitation notes.
- Expired, pending, blocked, or conflicting evidence must not be displayed.

AI Concierge use:

- `aiAllowed=true` is required before the AI Concierge can use a value as a public fact.
- `aiAllowed=false` records may be retrieved only as blocking or handoff guardrails in a future approved RAG design.
- Payment, cancellation, refund, safety, insurance, Cadastur, CNPJ, reviews, and certification claims require exact approved evidence and current review date.
- When evidence is missing, pending, blocked, expired, or conflicting, the AI must state the limitation and route to human support when relevant.

Public use:

- `publicAllowed=true` is required before any value can be repeated publicly in any channel.
- Public permission does not automatically grant website or AI permission.
- Website and AI usage require separate explicit flags.

## 8. Review And Expiration Rules

Minimum review triggers:

- owner changes a public contact channel;
- legal entity, Cadastur, credential, certificate, insurance, or license changes;
- booking, payment, cancellation, refund, or rescheduling policy changes;
- tour is published, unpublished, renamed, repriced, or materially edited;
- official image ownership or usage rights change;
- social profile changes;
- review platform data changes;
- any source conflict is found;
- any sensitive data risk is identified.

Recommended review cadence:

- critical risk records: before every use and whenever evidence changes;
- high risk records: at least quarterly or when evidence changes;
- medium risk records: at least twice per year or when evidence changes;
- low risk records: at least annually or when evidence changes.

Expired or stale records must be treated as `PENDING_OWNER_APPROVAL` until reviewed again.

## 9. Validation Before Future Technical Conversion

Before any future task converts evidence records to JSON, YAML, seed data, database records, embeddings, RAG, API routes, chat UI, LangChain, or LangGraph:

- a separate implementation task must be opened;
- this document must be reviewed by the owner;
- every record must have all required fields;
- every real value must have exact source/evidence;
- every real value must have owner approval and `reviewedAt`;
- `publicAllowed`, `websiteAllowed`, and `aiAllowed` must be explicit;
- sensitive records must not default to public;
- blocked and pending records must not be used as public facts;
- records must preserve blocking/handoff behavior;
- private data, credentials, secrets, admin data, bookings, payments, contact submissions, analytics, logs, `.env`, backups, and runtime operational data must remain out of scope.

## 10. Non-Goals

This document does not:

- publish real business data;
- approve any real CNPJ, Cadastur, guide credential, phone, email, social media, hours, policy, review, certificate, insurance, license, safety, or legal claim;
- create JSON;
- create YAML;
- create seed files;
- alter `data/`;
- alter `prisma/`;
- alter API, frontend, backend, schema, package, lockfile, deploy, or runtime behavior;
- create embeddings;
- implement RAG;
- install or configure LangChain;
- install or configure LangGraph;
- add chatbot;
- ingest real business data into runtime.
