# RT-68 — AI Concierge Knowledge Source Contract

- Ticket: RT-68 (RT-RB-AI-02). Status: **DRAFT — Owner approval of the inventory required.**
- Builds on `ai-concierge-rag-strategy.md`; does not implement anything.
- Rule: **no business information is invented here.** Where the content does not exist or has not been approved, the entry is marked `OWNER_CONTENT_REQUIRED`.
- Core rule: the Concierge may only state as fact what comes from an approved, current source. Everything else is "I don't have verified information for that" plus handoff (see RT-74).

## 1. Tiers

### Tier 1 — Owner approved / canonical (may be authoritative)

| Source class | Description | Owner of the source | Authority for |
| --- | --- | --- | --- |
| T1-TOURS | published tours from the platform catalog through the public gate (title, description, duration, city, highlights, inclusions/exclusions as stored) | Owner (via admin) | what a tour is and includes |
| T1-PRICES | prices **explicitly stored in the platform** for a published tour and currency | Owner (via admin) | indicative price statement, always labeled as indicative and subject to confirmation by the team; see §5 |
| T1-BUSINESS | official business information: legal/commercial name, what Ricardo Tour offers, `lib/public-contact.ts` (WhatsApp `+55 22 99846-1906`, `contato@ricardotour.com`, Instagram) | Owner | who we are, how to reach us |
| T1-RIO | approved Rio content (neighborhoods, attractions, curated text per language) | Owner | descriptive Rio guidance, non-safety |
| T1-POLICY | operational policies: pre-booking flow, payment, cancellation/refund, confirmation, handoff rules | Owner | how booking works |
| T1-FAQ | FAQ reviewed and approved by the team | Owner/team | answers to common questions |
| T1-SITE | approved summaries of public pages (Home, Tours, Quem Somos, Contato) | Owner | site content |

Tier 1 content is usable **only after** it is registered per RT-69 with an approver.

### Tier 2 — Controlled external (not enabled)

Allowed only after explicit Owner approval **per source**, recorded in the RT-69 registry. Candidates the Owner may later consider (none approved): official tourism-board pages, official attraction opening hours, weather/advisory feeds. Requirements before any Tier 2 source is enabled: named owner/URL, license/permission to reuse, freshness rule, locale, allowed claim types, and a failure mode. Tier 2 answers carry a visible provenance label and never override Tier 1.

### Tier 3 — Not allowed as authoritative

- Open web search results and the model's own world knowledge used as fact.
- Hallucinated or "remembered" travel information.
- Unverified prices, discounts or availability.
- Unverified safety claims (including "safe/unsafe" statements about areas).
- Flight, hotel or package inventory/prices not received through an approved provider integration (RT-39 is blocked; **no flight or hotel facts may be asserted**).
- Private data: user, booking, payment, admin data, logs, secrets, environment values.
- RIC Studio / Protocolo RIC content (internal; never a source for tourist answers).
- Competitor or third-party marketing content.

The model's general knowledge may be used only for language, tone and explaining how to ask or plan, never as a source of facts about tours, prices, availability, safety or policy.

## 2. Source ownership and registry fields

Each registered source has: `source_id`, `tier`, `class`, `owner` (a person/role), `approved_by`, `approved_at`, `locales`, `content_type`, `valid_from`, `valid_to` (nullable), `freshness_class`, `status` (draft/approved/superseded/withdrawn), `version`. Details and lifecycle: RT-69.

## 3. Freshness requirements

| Freshness class | Examples | Rule |
| --- | --- | --- |
| F-LIVE | tour catalog, stored prices | follows the platform; unpublishing or changing a tour/price updates or removes the knowledge entry within the refresh window defined in RT-69; a stale entry is not served |
| F-OPERATIONAL | policies, payment/cancellation rules, contact data | explicit `valid_to` or review date; when expired or superseded the Concierge stops using it and hands off |
| F-EDITORIAL | Rio descriptive content, FAQ | periodic review date; past the date it is served only with no time-sensitive claims, or withheld, per Owner choice |

Refresh window and review periods are **OWNER_DECISION_REQUIRED** (not invented here).

## 4. Inventory status (what exists vs. what is missing)

Verified in the repository during the audit: tours and prices live in the platform database (not read here); contact data in `lib/public-contact.ts`; page copy in the site components. **Not found and therefore `OWNER_CONTENT_REQUIRED`:**

- cancellation / refund / change policy text
- payment policy text (methods, deposit, when payment is due)
- pre-booking flow description approved for Concierge use
- approved Rio destination content per language (beyond what the site pages show)
- safety guidance wording the Owner is willing to stand behind
- reviewed FAQ
- business hours / response-time statement for the human team (needed for handoff wording, RT-71)
- language policy: whether `sv` is a supported answer language (the contract lists it; its UI copy is English)

## 5. Prices

- Only T1-PRICES may be quoted: the stored price for the tour, with currency, stated as indicative, with "final price and availability are confirmed by the team".
- No computation of totals, discounts, group prices, taxes or seasonality unless the platform stores those explicitly and the Owner approves quoting them.
- Question about a price not stored → "I don't have a verified price for that" + handoff.
- Availability is never asserted (no source exists in the Concierge scope).

## 6. Locale coverage

- Answers use the source text in the user's language when a source version exists in that locale. They are **not** machine-translated from another locale as if it were the approved text.
- If only another locale exists, the Concierge says so and offers that version labeled as such, or hands off. Owner may choose between those behaviors (**OWNER_DECISION_REQUIRED**).
- Supported answer languages = locales for which Tier 1 content is approved. Until the Owner approves `sv` content, `sv` users receive the English fallback with a clear note. This is a proposal.

## 7. Citation and provenance

Every substantive answer returns `sourceRefs` listing `source_id`, `version`, `label` and (for catalog sources) the tour id. The UI shows sources. An answer with no source reference is only allowed for: greetings, clarifying questions, refusals and handoff messages. `sourceRefs.kind` is extended beyond `mock_contract` at RT-67 (`catalog`, `policy`, `business`, `editorial`, `faq`, `external_approved`).

## 8. When information is missing, stale or conflicting

| Situation | Behavior |
| --- | --- |
| No relevant source | "I don't have verified information for that", offer handoff; record a `knowledge_miss` (RT-73) |
| Source expired/superseded/withdrawn | do not use; treat as missing; mark for Owner review |
| Two approved sources disagree | prefer the higher tier, then the newer approved version; if still ambiguous, do not answer the point, hand off, and flag a conflict for review |
| Source exists only in another locale | see §6 |
| Question needs private/booking data | refuse and hand off (RT-71) |

Full behavior matrix: RT-74.

## 9. Owner approvals required for RT-68

1. The Tier 1 class list (§1).
2. Whether any Tier 2 source is wanted now (default: none).
3. The price-quoting rule (§5).
4. Language policy (§6) and freshness periods (§3).
5. Content for each `OWNER_CONTENT_REQUIRED` item in §4, or an explicit decision to leave that topic as "hand off".
