# Rick Travel AI Concierge - Public Credibility Evidence Approval Scope

## 1. Purpose

This document defines how Rick Travel may safely approve, publish, block, or route public credibility evidence before any website use or future AI Concierge use.

Credibility evidence is higher risk than general brand, service-region, language, or public-contact information because it can create legal, tax, registration, safety, insurance, certification, or trust expectations. These claims need separate approval so the business does not publish unsupported facts, expose private data, or let the future AI Concierge overstate credentials.

This document is documentation-only. It does not add any real credential value, public registry value, testimonial, price, availability, guarantee, runtime behavior, ingestion path, or technical implementation.

## 2. Relationship To Existing Evidence Documents

`docs/product/ai-concierge-approved-public-business-evidence-values.md` remains the approved-values register for exact Rick Travel values that the owner has explicitly approved for public, website, or future AI Concierge use. This document does not add new approved values to that register.

`docs/product/ai-concierge-verified-business-evidence-records.md` remains the evidence governance layer for how business evidence must be recorded, reviewed, approved, blocked, and permissioned. This document narrows the rules for credibility evidence categories that need extra caution.

`docs/product/ai-concierge-prompt-contract.md` remains the future AI Concierge behavior contract. The handoff and no-invention rules in that contract apply to every credibility category here.

`docs/product/ai-concierge-answer-matrix.md` remains the scenario matrix for safe responses and handoff behavior. Questions that touch legal, credential, safety, payment, price, availability, accessibility, or operational confirmation must follow the matrix and route to humans when required.

## 3. Credibility Evidence Categories

The credibility evidence categories covered by this document are:

- CNPJ / legal entity reference.
- Cadastur company registration.
- Guide credentials.
- Official public business identity.
- Trust badges.
- Testimonials / social proof.
- Verified / certified / licensed / registered / insured claims.

Each category must be reviewed as a separate risk item. Approval for one category does not approve another category.

## 4. Default Status

The default status for credibility evidence is `PENDING_OWNER_APPROVAL` or `BLOCKED`.

The following categories are not public facts by default:

- CNPJ / legal entity reference.
- Cadastur company registration.
- Guide credentials.
- Trust badges.
- Testimonials and social proof.
- Legal claims.
- Insurance claims.
- Safety claims.
- Certification claims.
- Verified, licensed, registered, official, safe, or guaranteed claims.

These categories must not be displayed, repeated, summarized, translated as claims, or used by AI unless exact evidence, owner approval, source authority, approved wording, review date, and explicit usage permissions exist.

## 5. Website Approval Rules

Before any credibility evidence may appear on the website, all of the following must be true:

- Owner approval is recorded.
- Exact value is confirmed.
- Source authority is confirmed.
- Last reviewed date is recorded.
- Approved wording is recorded.
- Risk level is assigned.
- `websiteAllowed` is explicitly `true`.

Website approval must use the exact approved wording and limitation notes. Expired, stale, disputed, pending, blocked, private, or ambiguous evidence must not be displayed.

Approval to display one value on the website does not approve related claims, badges, translations, summaries, rankings, guarantees, or future AI Concierge use.

## 6. Future AI Concierge Approval Rules

Future AI Concierge use is stricter than website display.

Rules:

- Website approval does not automatically imply AI approval.
- `aiAllowed` must be explicit.
- The AI must not improvise, infer, translate beyond approved meaning, or summarize credentials beyond approved wording.
- The AI must not answer with legal, tax, registration, credential, certification, insurance, safety, guarantee, review, rating, price, payment, or availability claims unless exact approved wording permits it.
- The AI must hand off if evidence is missing, stale, disputed, pending, blocked, conflicting, private, or ambiguous.

Records with `aiAllowed=false` may be used only as blocking or handoff guardrails in a separately approved future design.

## 7. CNPJ Handling

CNPJ is verification-first by default.

This task does not approve public display of CNPJ and does not include any actual CNPJ value.

Before any future CNPJ display or AI use, Rick Travel must record exact official evidence, source authority, owner approval, approved wording, review date, risk level, and explicit usage flags. Until that happens, CNPJ-related questions must remain blocked or routed to human support.

CNPJ approval must be separate from Cadastur approval, trade-name approval, legal-address approval, tax-status approval, and any verified or official claim.

## 8. Cadastur Handling

Cadastur remains pending until official evidence, owner approval, exact wording, and review date are recorded.

This task does not include any actual Cadastur number.

Before any future Cadastur display or AI use, Rick Travel must record the source authority, validity/status evidence when relevant, approved wording, risk level, and explicit `publicAllowed`, `websiteAllowed`, and `aiAllowed` decisions.

Questions about Cadastur status, number, validity, class, government registration, or disputes require human handoff unless an exact approved response exists.

## 9. Guide Credential Handling

Guide credentials must be handled separately from company credentials.

Guide credentials may involve personal identity, credential validity, language coverage, guide assignment, operating location, schedule, availability, privacy, and current work status. These facts can change and may identify a person, so they require separate evidence and separate owner approval.

The AI Concierge must hand off named guide certification questions. It must not confirm that a named guide is certified, assigned, available, licensed, insured, or authorized unless exact approved wording and explicit `aiAllowed=true` exist.

## 10. Trust Badge And Claim Rules

The following claims are blocked unless exact source, wording, approval, and usage flags are recorded:

- verified.
- certified.
- licensed.
- registered.
- insured.
- official.
- safe.
- guaranteed.

Trust badges must not be created from assumptions, informal owner statements, screenshots alone for high-risk claims, social profile appearance, customer comments, or general market knowledge.

Every trust badge or claim needs source authority, owner approval, `publicAllowed`, `websiteAllowed`, `aiAllowed`, `riskLevel`, approved wording, blocked wording, and review date.

## 11. Testimonials And Social Proof Rules

Testimonials, ratings, review counts, rankings, satisfaction claims, and customer quotes are blocked until all of the following are recorded:

- Verifiable source.
- Consent or reuse authority.
- Attribution rule.
- Date reviewed.
- Approved excerpt.
- Approved language.
- Risk level.
- Explicit `publicAllowed`, `websiteAllowed`, and `aiAllowed` decisions.

The AI Concierge must not invent, paraphrase, translate, summarize, aggregate, or imply testimonials, review scores, rankings, customer counts, or satisfaction claims without exact approval.

## 12. Human Handoff Rules

Always hand off:

- Legal/tax verification requests.
- Requests for document copies.
- Requests for credential numbers.
- Cadastur/CNPJ disputes.
- Stale evidence.
- Conflicting evidence.
- Named guide certification questions.
- Safety/legal/insurance claims.
- Anything pending or blocked.

The safe response is to acknowledge the limitation, avoid unsupported claims, and route the person to human Rick Travel support.

## 13. Required Record Fields

Every future credibility evidence record must include:

| Field | Requirement |
| --- | --- |
| `id` | Stable record identifier. |
| `category` | Credibility category. |
| `label` | Human-readable label. |
| `valueStatus` | `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`. |
| `publicValue` | Exact approved public value, `NO_APPROVED_VALUE_RECORDED`, or `BLOCKED_SENSITIVE_VALUE`. |
| `source` | Evidence source or `NONE_APPROVED`. |
| `sourceAuthority` | `owner`, `official`, `primary_public`, `approved_public`, `conditional`, or `blocked`. |
| `ownerApproval` | Explicit owner decision or `not_approved`. |
| `publicAllowed` | Whether the value may be repeated publicly. Defaults to `false`. |
| `websiteAllowed` | Whether the value may appear on the website. Defaults to `false`. |
| `aiAllowed` | Whether the AI Concierge may use the value as a public fact. Defaults to `false`. |
| `handoffRequired` | Whether questions about the value require human support. |
| `riskLevel` | `low`, `medium`, `high`, or `critical`. |
| `language` | Approved language or `all`. |
| `lastReviewedAt` | Last review date. |
| `approvedWording` | Exact wording allowed for public, website, or AI use. |
| `blockedWording` | Claims or phrases that must not be used. |
| `notes` | Limitation text, missing evidence, review instructions, and handoff requirements. |

No field may be inferred from another field. `publicAllowed`, `websiteAllowed`, and `aiAllowed` must remain separate explicit decisions.

## 14. Non-Goals

This document does not:

- add real credentials;
- add CNPJ;
- add a Cadastur number;
- add guide credential numbers;
- add testimonials;
- add prices;
- add availability;
- add guarantees;
- add customer data;
- add payment data;
- add personal documents;
- add private addresses;
- create runtime behavior;
- create chatbot behavior;
- define schema;
- create JSON;
- create YAML;
- create API, frontend, backend, or database changes;
- create RAG, embeddings, LangChain, or LangGraph changes;
- deploy anything.
