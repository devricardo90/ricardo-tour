# RT-68 — AI Concierge Knowledge Source Contract

- Ticket: RT-68 (RT-RB-AI-02). Status: **Em andamento — Owner-approved source boundary; no source version is active or ingested. Current business-page copy needs canonical identity reconciliation before it is eligible.**
- Builds on `ai-concierge-rag-strategy.md`; does not implement anything.
- Rule: **no business information is invented here.** Where the content does not exist or has not been approved, the entry is marked `OWNER_CONTENT_REQUIRED`.
- Core rule: the Concierge may only state as fact what comes from an approved, current source. Everything else is "I don't have verified information for that" plus handoff (see RT-74).

## 1. Tiers

### Tier 1 — Owner approved / canonical (may be authoritative)

| Source class | Description | Owner of the source | Authority for |
| --- | --- | --- | --- |
| T1-CATALOG | Currently published customer-facing PT/EN/ES tour and Experiences content, read through the canonical public catalog gate. Only published localized titles and descriptions, plus other fields actually shown to customers and approved for the current page. | Owner (publication through the public gate) | description of the currently published tour |
| T1-BUSINESS | Current Owner-approved Ricardo Tour institutional facts and current public About / Quem Somos text, with an exact source path and locale for each item. | Owner | who Ricardo Tour is and what it offers, but only after the current checked-in legacy brand copy is reconciled |
| T1-CONTACT | Exact canonical public contact values in `lib/public-contact.ts`: WhatsApp `+55 22 99846-1906`, e-mail `contato@ricardotour.com`. | Owner (canonical public contact) | how to contact the team |
| T1-SERVICE | Current public request and handoff wording from the tour/contact flows. Architecture rules govern behavior but are not ingested as customer-facing facts. | Owner (current public wording) | what a request does and when the user must contact a person |

Tier 1 content is usable **only after** it is registered per RT-69 with an approver.

### Tier 2 — Controlled external (not enabled)

Allowed only after explicit Owner approval **per source**, recorded in the RT-69 registry. Candidates the Owner may later consider (none approved): official tourism-board pages, official attraction opening hours, weather/advisory feeds. Requirements before any Tier 2 source is enabled: named owner/URL, license/permission to reuse, freshness rule, locale, allowed claim types, and a failure mode. Tier 2 answers carry a visible provenance label and never override Tier 1.

### Tier 3 — Not allowed as authoritative

- Open web search results and the model's own world knowledge used as fact.
- Hallucinated or "remembered" travel information.
- All tour prices in RAG, including prices that happen to be visible on a product page; the user must be directed to the current tour page or approved booking flow for live commercial value (§5).
- Availability, changeable schedules, dates, inventory, capacity, discounts, or provider offers.
- Unverified safety claims (including "safe/unsafe" statements about areas).
- Oner flight, hotel or package inventory/prices, even though the separate public Planeje sua viagem commercial flow is operational. RT-39 remains open and RT-40 API access is not confirmed; **the Concierge has no authorized provider tool or flight/hotel source**. Do not assert provider facts from RAG.
- Private data: user, booking, payment, admin data, logs, secrets, environment values.
- RIC Studio / Protocolo RIC content (internal; never a source for tourist answers).
- Old Rick Travel / travelrick content, superseded contact information, drafts, screenshots, historical documentation, rebuild evidence, unpublished internal assumptions, and generated FAQ/Rio facts without Owner approval.
- Competitor or third-party marketing content.

The model's general knowledge may be used only for language, tone and explaining how to ask or plan, never as a source of facts about tours, prices, availability, safety or policy.

## 2. Source ownership and registry fields

Each knowledge item carries the RT-69 provenance fields: `source_id`, `source_type`, `source_path`, `locale`, immutable `version`, `updated_at`, `approved_at` / `approved_by` when applicable, `status`, and `supersedes`, plus an explicit `approved_for_rag` eligibility flag. `status = ACTIVE` and `approved_for_rag = true` are both required; an approved *source class* is not an active *source version*. Catalog publication state is checked against the live public gate; approval fields are never fabricated when the source does not supply an actor or approval event. Details and lifecycle: RT-69.

## 3. Freshness requirements

| Freshness class | Examples | Rule |
| --- | --- | --- |
| F-LIVE | published catalog text and current public-page content | source-change-driven refresh. A tour unpublish or a source change makes the previous version inactive before any replacement is published; a stale version is not served. Prices are excluded from RAG. |
| F-CONTACT | canonical contact values | update from the canonical source change; stop using a superseded value atomically with publication of its replacement. |
| F-OWNER-APPROVED | approved institutional text or customer-service wording | update on the approved source revision; no periodic recrawl. A changed, withdrawn, or conflicting source is withheld until validated. |

Arbitrary periodic recrawling is not used for first-party content. RT-69 specifies the deterministic source-change event and retirement behavior. A maximum processing latency is an implementation/SLO decision; do not serve an old version while a source change is pending.

## 4. Inventory status (what exists vs. what is missing)

The Owner approved the source classes and exclusions in this section on 2026-10-04. Approval of a class does not make stale or unpublished content eligible. The following is the exact source inventory for V1; **no content has been ingested**.

- cancellation / refund / change policy text
- payment policy text (methods, deposit, when payment is due)
- standalone approved Rio destination guide or safety wording
- reviewed FAQ
- business hours / response-time statement for the human team
- current Owner-approved Ricardo Tour institutional/About wording in the repository; the current page and older value register still say Rick Travel and are not eligible until reconciled

### 4.1 Owner-approved exact initial source inventory — 2026-10-04

This is the approved source allowlist and boundary for the first real Concierge version. It is an inventory only: **no records have been created or ingested**. Each item still needs RT-69 validation and provenance before it can be published to an index.

| Proposed source ID | Exact source and scope | Initial disposition |
| --- | --- | --- |
| `public-tour-catalog` | Current database `Trip` records read only through `lib/catalog/public-trips.ts` (`getPublicTrips` / `getPublicTripById`). That gate requires the Owner-reviewed `LAUNCH_TRIP_IDS`, `isPublished=true`, and passing integrity checks. Customer-facing renderers are `app/[locale]/(site)/tours/page.tsx`, `app/[locale]/(site)/tours/[id]/page.tsx`, and `components/experiences-in-rio-section.tsx`. Eligible fields: current PT/EN/ES localized title and description, only when present in that locale and currently rendered to customers. Experiences is the same source, not a second copy. | **APPROVED Tier 1.** Read live through the public gate. No drafts, `prisma/seed.ts`, historical screenshots/docs, rebuild evidence, or `data/real-trips.json`. Prices, schedule/date/capacity/availability fields are excluded. |
| `canonical-public-contact` | `lib/public-contact.ts`: `PUBLIC_CONTACT.email = contato@ricardotour.com`; `PUBLIC_CONTACT.whatsappDisplay = +55 22 99846-1906`; canonical link `https://wa.me/5522998461906`. | **APPROVED Tier 1.** These exact values only. Do not use the old business evidence records for contact values, Instagram, or other claims. |
| `current-about-and-institutional-content` | Intended first-party paths: `components/site/about/about-copy.ts` (public `/[locale]/quem-somos`) and `components/about-rick-travel-section.tsx` (Home summary). They are the concrete current public paths, but the checked-in copy calls the business “Rick Travel”; the older evidence register `docs/product/ai-concierge-approved-public-business-evidence-values.md` also contains Rick Travel and superseded contact values. | **APPROVED source class; current content BLOCKED.** Do not ingest those current file contents or any older register value until Owner-approved Ricardo Tour copy replaces/reconciles them. Do not infer new company description from the sender display name or domain. |
| `public-request-and-handoff-wording` | Current public UI copy: `components/site/tour/tour-request-copy.ts` and `components/site/contact/contact-copy.ts`. Use only current localized customer wording that says the visitor sends a request/message and the team follows up; do not turn this into a booking, availability, response-time, or commercial-policy claim. Handoff channels come only from `lib/public-contact.ts`. | **APPROVED Tier 1, narrow scope.** These strings may describe the supported request/handoff flow. User-initiated link handoff only; never send WhatsApp automatically. |
| `rio-destination-editorial` | No current reviewed canonical destination guide exists in the repository. `components/rio-story-section.tsx` is brand/editorial copy, not a destination guide. | **EXCLUDED.** No Rio destination facts or safety advice until a concrete canonical, Owner-approved source exists. |
| `operational-policy-text` | No current approved payment, cancellation/refund, or other commercial policy document was found. Draft AI architecture documents are controls, not customer-facing policy sources. | **EXCLUDED from factual retrieval.** Use only the approved handoff behavior in RT-71/RT-74 as system policy, not as a claim that a business policy exists. |
| `approved-faq` | No generated FAQ has passed Owner approval; no separate current approved FAQ file exists. | **EXCLUDED.** No generated FAQ content in V1. |

### 4.2 Explicitly excluded sources and claims for the initial set

- Random web results, external destination feeds, and model general knowledge.
- `Oner` inventory, Flight mock data, any flight/hotel/package inventory or pricing. The live Planeje sua viagem widget is a separate provider-hosted commercial flow, not a Concierge knowledge source or API integration; RT-39 remains open and RT-40 remains blocked by unconfirmed API access.
- All tour prices from RAG, `TripSchedule`, schedules/dates, availability, capacity, booking records, payment state, ContactSubmission data, and private/admin data.
- Old Rick Travel / travelrick business content, superseded email/phone/social values, `data/real-trips.json`, unpublished/seed-only catalog rows, old screenshots/historical docs/rebuild evidence, unreviewed `messages/*.json`, and bulk `docs/ops/*` ingestion.
- Generated FAQ content and generated Rio destination facts without an exact canonical source and Owner approval.
- Cancellation, refund, payment, safety, legal, credential, insurance, accessibility, or response-time assertions without exact current approved evidence.

### 4.3 Authoritative V1 source registry and eligibility state

The exact source paths and allowed fields in §4.1 are the **authoritative source-class allowlist** for V1. This section defines the registry eligibility contract for individual source versions. It is governance only: there is no `knowledge/concierge/` runtime registry, source manifest, indexed file, or `ACTIVE` record in the repository at this point. An Owner-approved class must not be treated as already indexed or answerable.

| Registry source class | Future stable `source_id` pattern (not minted yet) | Current eligibility |
| --- | --- | --- |
| `public-tour-catalog` | `public-tour-catalog:<Trip.id>:<locale>`; exact localized title/description from the current public gate in §4.1 | **No active versions.** Each tour/locale must independently pass the public gate and registration. Experiences reuses that item; it is not a second source. |
| `canonical-public-contact` | `canonical-public-contact:<locale>`; only the email, WhatsApp display number and canonical link in §4.1 | **No active versions.** The contact constants are approved as canonical, but a future retrieved version still requires validation and registration. The handoff UI may use the canonical constants directly under RT-71; that does not make an index version active. |
| `public-request-and-handoff-wording` | `public-request-and-handoff-wording:<canonical-path-and-key>:<locale>`; exact approved UI copy path/key in §4.1 | **No active versions.** Service wording may describe a request or contact step, never a booking, price, availability, policy, or response-time commitment. |
| `current-about-and-institutional-content` | `current-about-and-institutional-content:<canonical-path-and-key>:<locale>` after exact reconciled Ricardo Tour copy and explicit Owner approval | **BLOCKED.** The source class is allowed, but checked-in Rick Travel copy and the older evidence register are ineligible. |
| `rio-destination-editorial`, `operational-policy-text`, `approved-faq` | A new exact canonical source and Owner approval would be needed | **EXCLUDED.** No such V1 source exists or may be promoted by inference. |

For a future version to be eligible for retrieval and factual use, **all** of these conditions must hold at query time and again before returning an answer:

1. Its source class, exact canonical path/field, and locale match §4.1; the individual `source_id` is stable and the immutable `version` maps to that exact source revision. Every registry entry records the §2 provenance fields and the approval/publication evidence applicable to that source.
2. `status = ACTIVE` **and** `approved_for_rag = true`. Missing flags, pending validation, superseded/retired/rejected status, or a prior approval for a different version are ineligible. No entry in this document is currently `ACTIVE`.
3. A catalog item still passes `getPublicTrips` / `getPublicTripById`, including launch ID, `isPublished`, and integrity checks, and the requested locale has approved text. Source approval never overrides an unpublish or missing locale.
4. The exact content contains no price, availability, schedule/capacity, private data, Oner/provider result, unsupported safety fact, stale contact, unreconciled About copy, or inferred commercial claim. If a permitted page includes excluded fields, only the allowed fields can become a future version.
5. The active version is current under RT-69. A canonical source change, withdrawal, failed validation, or conflict makes the old version ineligible immediately; an asynchronous search-index deletion is not an eligibility signal. In a conflict that cannot be resolved by the approved precedence, withhold the claim and hand off.

The lifecycle remains the Owner-approved RT-69 contract: **CANONICAL → VALIDATE → NORMALIZE → VERSION → CHUNK/INDEX → PUBLISH → RETIRE/ROLLBACK**. RT-68 defines which sources may enter it; registry/event transport, atomic activation, index operations, and audit-trail implementation remain RT-69 work. No source is promoted by a model, and this document performs no ingestion.

## 5. Pricing policy — AI V1

- **The Concierge must not quote a tour price from RAG.** No price content is indexed for AI V1, even if a current price is visible in the public catalog.
- When asked for price, direct the visitor to the current tour/product page or approved booking flow that displays the live/current commercial value. Do not restate a cached value, calculate a quote, or invent a discount/total.
- Availability is never asserted. Schedules and dates may change and are not knowledge facts.
- This policy may be revisited only after an Owner-approved reliable structured pricing source and freshness contract exist.

## 6. Locale coverage

- V1 supported locales are **PT, EN, ES** only.
- Use the project's existing approved localized PT/EN/ES copy. Do not create factual differences between locale versions or translate missing facts as if approved.
- If a requested locale has no approved version of a fact, do not expand or infer it. Say verified information is unavailable in that locale and offer the current public page or human handoff.
- `sv` is not a V1 Concierge locale.

## 7. Citation and provenance

Every substantive answer returns `sourceRefs` listing `source_id`, `version`, `label` and (for catalog sources) the tour id. The UI shows sources. An answer with no source reference is only allowed for: greetings, clarifying questions, refusals and handoff messages. V1 source kinds are limited to `catalog`, `contact`, `service`, and `business` after an eligible version is registered; no policy, editorial, FAQ, or external source kind is enabled by this inventory.

## 8. When information is missing, stale or conflicting

| Situation | Behavior |
| --- | --- |
| No relevant source | "I don't have verified information for that", offer handoff; record a `knowledge_miss` (RT-73) |
| Source expired/superseded/withdrawn | do not use; treat as missing; mark for Owner review |
| Two approved sources disagree | prefer the higher tier, then the newer approved version; if still ambiguous, do not answer the point, hand off, and flag a conflict for review |
| Source exists only in another locale | see §6 |
| Question needs private/booking data | refuse and hand off (RT-71) |

Full behavior matrix: RT-74.

## 9. Owner decision record — 2026-10-04

1. Owner approved the Tier 1 source classes and exact boundaries in §1 and §4.1–4.2.
2. No Tier 2 sources are enabled for V1.
3. RAG pricing is prohibited; price questions link to the current product/booking page (§5).
4. V1 locales are PT/EN/ES (§6); no arbitrary periodic recrawl is allowed (§3).
5. Catalog and public customer-service text are included only from the live public paths named in §4.1.
6. The current repository About copy and older evidence register still contain Rick Travel content and are not eligible as facts until an Owner-approved Ricardo Tour version is present at the canonical paths.
7. No Rio guide, safety fact set, commercial policy text, or generated FAQ is authorized for ingestion without a new concrete source and approval.
