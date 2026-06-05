# Rick Travel AI Concierge - First Knowledge Base Seed Scope

## 1. Purpose

This document defines the scope of the first approved knowledge base seed for the Rick Travel AI Concierge.

The first seed is an editorial scope, not a data implementation. It defines which content groups may be prepared for future curated records, which sources may support them, which topics remain blocked or conditional, and which validation checks must pass before any technical implementation starts.

This task does not create knowledge base records, JSON, YAML, seed files, embeddings, vector search, RAG runtime, LangChain, LangGraph, API routes, chat UI, or any product runtime.

## 2. Relationship To Prior AI Concierge Documents

This scope depends on:

- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`
- `docs/product/ai-concierge-knowledge-base-format.md`

If this document conflicts with those documents, the stricter safety, source, handoff, and anti-hallucination rule wins.

## 3. Included Knowledge Categories

The first KB seed may define future records for these categories only:

| Category | Future record types | Initial status |
| --- | --- | --- |
| Company identity | `faq_answer`, `commercial_rule`, `blocked_claim` | Conditional until owner-approved wording exists. |
| Contact channels | `faq_answer`, `handoff_rule`, `commercial_rule` | Allowed only from approved public contact copy. |
| Trust and credibility | `blocked_claim`, `faq_answer` | Mostly conditional or blocked until evidence is approved. |
| Cadastur/CNPJ references | `blocked_claim`, `faq_answer` | Conditional until exact evidence and owner approval exist. |
| Tour catalog basics | `tour`, `faq_answer` | Allowed only for public tours with `isPublished=true`. |
| Booking rules | `commercial_rule`, `handoff_rule`, `faq_answer` | Allowed only for pre-booking/manual-confirmation boundaries. |
| Payment rules | `commercial_rule`, `handoff_rule`, `blocked_claim` | Pending owner approval except "no payment is handled by the AI". |
| Cancellation/refund boundaries | `commercial_rule`, `handoff_rule`, `blocked_claim` | Pending owner approval; direct policy claims blocked. |
| Customer support escalation | `handoff_rule`, `faq_answer` | Allowed as guardrail behavior. |
| Language support | `faq_answer`, `handoff_rule` | Conditional by approved locale and content availability. |

## 4. Excluded Categories

The first KB seed must not include:

- private user data;
- authentication, account, or session data;
- booking records or booking status details;
- payment attempts, payment status, provider IDs, checkout URLs, or financial metadata;
- contact submissions or private customer messages;
- admin data, analytics, logs, emails, or operational traces;
- `.env`, secrets, credentials, backups, or deployment data;
- unpublished tours, drafts, fixtures, or tours with `isPublished=false`;
- `TripSchedule` as proof of availability;
- `data/real-trips.json` while it remains legacy/divergent;
- full ingestion of `docs/ops/*`;
- full ingestion of `messages/*.json`;
- general model knowledge used to decide price, availability, payment, cancellation, refund, safety, or credibility claims;
- RIC Studio or Protocolo RIC as public-facing concierge content.

## 5. Approved Source Hierarchy

Future KB seed records must use this source hierarchy:

1. Current explicit owner approval.
2. AI Concierge safety, scope, prompt, and guardrail documents.
3. Approved commercial policy documents, if created and versioned.
4. Public tour catalog records with `isPublished=true`.
5. Approved public site sections.
6. Curated future records with `approvalStatus=APPROVED` for the same `locale`.
7. Conditional sources only under their explicit documented rule.
8. If unresolved, the AI Concierge must state the limit and redirect to WhatsApp or human support.

Blocked sources never participate in factual answers.

## 6. Required Fields For Future KB Records

Every future KB record created from this scope must include:

| Field | Requirement |
| --- | --- |
| `id` | Stable, unique, readable identifier. |
| `type` | One of the allowed canonical record types. |
| `locale` | Approved language for the record. |
| `title` | Short editorial title. |
| `content` | Approved customer-safe content or rule text. |
| `source` | Verifiable source path or owner-approved source reference. |
| `sourceAuthority` | `owner`, `governance`, `primary_public`, `approved_public`, `conditional`, or `blocked`. |
| `approvalStatus` | `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`. |
| `owner` | Person or role responsible for approval and review. |
| `updatedAt` | Last update date. |
| `reviewedAt` | Last review date, if different from update. |
| `publicAllowed` | Whether the content may support public-facing answers. |
| `ragAllowed` | Whether the content may be retrieved by a future RAG implementation. |
| `handoffRequired` | Whether the answer must redirect to human support. |

Recommended optional fields:

- `tourId`
- `relatedTourIds`
- `city`
- `neighborhood`
- `tags`
- `riskLevel`
- `expiresAt`
- `notes`

Optional fields must not contain private data, payment data, booking data, admin data, credentials, secrets, or operationally sensitive information.

## 7. Initial Content Groups

### 7.1 Company Identity

The first seed may include a conservative description of Rick Travel as a public tourism business focused on guided experiences in Rio de Janeiro.

Allowed:

- brand name;
- public-facing role;
- Rio de Janeiro focus;
- human-assisted service model;
- public pages where users can learn more.

Conditional:

- legal entity wording;
- company registration claims;
- years of experience;
- official credentials;
- staff or guide names.

Blocked until approved:

- unverifiable superlatives;
- exact registration numbers without source review;
- "best agency", "fully certified", or equivalent unsupported claims.

### 7.2 Contact Channels

The first seed may include approved public contact paths:

- Contact page;
- WhatsApp handoff when source and number are approved;
- human support escalation;
- quote or itinerary request flow.

The AI Concierge may guide users to contact channels, but it must not invent phone numbers, emails, service hours, response times, or support guarantees.

### 7.3 Trust And Credibility

Trust content must be conservative.

Allowed when approved:

- human support before confirmation;
- local operation wording;
- manual confirmation before payment;
- customer-safe explanation of why human review is needed.

Blocked until evidence is approved:

- guest rating numbers;
- review counts;
- "500+ tours";
- response within minutes;
- insurance coverage;
- absolute safety language;
- unverifiable "licensed" or "certified" claims.

### 7.4 Cadastur And CNPJ References

Cadastur and CNPJ references may enter the first seed only as conditional or blocked claims until the owner approves exact public evidence.

The first seed must not invent:

- Cadastur number;
- CNPJ number;
- active registration status;
- guide credential number;
- government certification status.

If approved evidence exists later, records must cite the exact source, owner approval, review date, and permitted public wording.

### 7.5 Tour Catalog Basics

Tour catalog basics are the primary factual content group for the first seed.

Allowed only from public tours with `isPublished=true`:

- tour ID;
- public title;
- public description;
- city;
- location;
- base display price;
- public highlights;
- public duration field;
- physical level;
- children allowed flag;
- maximum guests when public.

Not allowed:

- unpublished tours;
- draft tours;
- seed-only tours that diverge from the public catalog;
- `TripSchedule` as availability;
- capacity as open seats;
- final group price;
- pickup confirmation;
- guide language confirmation;
- accessibility verdict;
- safety guarantee.

### 7.6 Booking Rules

The first seed may describe booking as a pre-booking or assisted flow when supported by approved public copy.

Allowed:

- the AI can explain that booking confirmation depends on the Rick Travel team;
- the AI can ask for low-risk context such as date of interest, group size, language, and general interests;
- the AI can redirect to WhatsApp or human support for confirmation.

Not allowed:

- confirmed reservation status;
- guaranteed availability;
- seat confirmation;
- schedule confirmation;
- booking changes, cancellations, or rebooking decisions.

### 7.7 Payment Rules

Payment content remains tightly restricted.

Allowed:

- the AI may say that it cannot process payment;
- the AI may redirect payment questions to human support;
- the AI may say that payment details must be confirmed by the Rick Travel team if that matches approved public copy.

Blocked:

- Pix keys;
- payment links;
- accepted payment method lists without owner-approved policy;
- payment approval, pending, failure, refund, or cancellation status;
- Mercado Pago or provider-specific claims for customers;
- discounts, upgrades, promotions, or special conditions.

### 7.8 Cancellation And Refund Boundaries

Cancellation, refund, and rescheduling policies remain `PENDING_OWNER_APPROVAL` unless a final policy is approved and versioned.

The first seed may include only handoff rules for these topics.

Blocked:

- 24-hour or 48-hour cancellation window claims;
- guaranteed refunds;
- free rescheduling;
- weather-based automatic cancellation;
- refund eligibility decisions;
- case-by-case promises.

### 7.9 Customer Support Escalation

The first seed must include handoff rules.

The AI Concierge must redirect to WhatsApp or human support when:

- the user explicitly asks for a person;
- the user asks for availability, confirmation, or reservation;
- the user asks for payment, refund, cancellation, rescheduling, or receipt details;
- the user asks for final price, discount, private group, or special condition;
- the user asks about accessibility, children, older adults, pregnancy, mobility, health restrictions, or special needs;
- the user asks about safety-sensitive areas, favela/community visits, night travel, severe weather, or emergencies;
- sources conflict;
- approved source coverage is missing;
- the answer would require private data, admin data, booking data, payment data, or operational judgment.

### 7.10 Language Support

Initial language scope:

- Portuguese;
- English;
- Spanish.

Swedish may be included only if the specific content has owner-approved wording for Swedish.

Rules:

- approval is per locale;
- translation does not approve claims;
- if approved content is missing for the user's language, the AI must explain the limitation and redirect to human support when relevant;
- guardrails remain identical across languages.

## 8. What The AI Concierge May Answer

The AI Concierge may answer:

- what Rick Travel offers at a high level;
- how to browse public tours;
- basic facts about public tours with `isPublished=true`;
- general differences between public tour profiles;
- whether a user should contact the team for confirmation;
- how to request help through approved public contact channels;
- that booking, payment, availability, special needs, and sensitive safety questions require human support;
- low-risk preference questions that help route the user to the right support path.

All answers must be short, clear, customer-safe, and limited to approved sources.

## 9. What The AI Concierge Must Not Answer

The AI Concierge must not:

- confirm booking, availability, seat count, schedule, payment, refund, cancellation, or rescheduling;
- give final price for a group or special condition;
- promise discounts, upgrades, private guide assignment, pickup, accessibility, or specific guide language;
- state payment methods unless a final policy is approved;
- share payment links, Pix keys, provider details, or internal payment status;
- invent tours, policies, credentials, contact details, ratings, review counts, insurance, Cadastur, CNPJ, or safety claims;
- use `TripSchedule` as available inventory;
- use private data or operational data;
- mention RIC Studio or Protocolo RIC in the public customer flow;
- behave as an open-domain chatbot.

## 10. WhatsApp And Human Support Redirect Rules

The AI Concierge must redirect to WhatsApp or human support when:

- confirmation is needed;
- operational judgment is needed;
- commercial judgment is needed;
- safety judgment is needed;
- source confidence is low;
- the topic is blocked or pending owner approval;
- the user requests human support;
- the answer would require private, booking, payment, admin, analytics, log, or contact-submission data.

The redirect must not promise that the team will approve, confirm, refund, discount, or solve the request.

## 11. Validation Criteria Before Implementation

Before any implementation task creates actual KB records, JSON/YAML, seed files, embeddings, RAG, API routes, chat UI, LangChain, or LangGraph, all criteria below must pass:

- this scope is reviewed and accepted by the owner;
- every future record has a source, owner, locale, approval status, and review date;
- every tour record is tied to `isPublished=true`;
- `TripSchedule` is not treated as availability;
- payment, cancellation, refund, and final-price claims remain blocked or pending until policy approval;
- Cadastur, CNPJ, insurance, guide credentials, ratings, review counts, response-time, and safety claims have explicit evidence before use;
- `messages/*.json` keys are reviewed individually before use;
- `docs/ops/*` is not ingested as a corpus;
- `data/real-trips.json` remains blocked unless a dedicated future task reclassifies it;
- no private data source is included;
- the handoff rules are represented before any customer-facing experience launches;
- no technical implementation starts until a separate implementation task is opened.

## 12. Non-Goals

This document does not:

- create the first KB records;
- define a JSON or YAML schema file;
- create seed data;
- change `data/`;
- change `prisma/seed.ts`;
- change `messages/*.json`;
- change frontend, backend, API, schema, database, admin, booking, payment, user, contact, analytics, log, environment, package, lockfile, or deployment behavior;
- install or configure LangChain, LangGraph, embeddings, vector search, RAG, or chat UI.
