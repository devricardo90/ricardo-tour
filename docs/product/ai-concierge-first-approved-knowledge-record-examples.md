# AI Concierge First Approved Knowledge Record Examples

State: REVIEW

Related task: RT-AI-019A

This document provides the first small set of human-readable approved AI knowledge record examples for Rick Travel. These examples demonstrate how the contract in `docs/product/ai-concierge-approved-knowledge-records-contract.md` should be interpreted before any runtime implementation exists.

These are Markdown examples only. They are not production data, not JSON/YAML records, not database rows, not embeddings, not vector-store content, not chatbot behavior, and not API input.

## Scope

This first set includes exactly five safe examples:

1. Stable company/about record.
2. Tour overview record.
3. WhatsApp human handoff record.
4. Blocked volatile price/availability example.
5. Unknown or unsupported answer example.

The examples use conservative language and avoid inventing real prices, live availability, booking guarantees, credentials, ratings, reviews, insurance claims, or legal claims.

## Example 1 - Stable Company/About Record

| Field | Example value |
| --- | --- |
| recordId | ai-kr-example-company-about-001 |
| title | Rick Travel general company description |
| locale | en |
| topic/category | company_about |
| sourceAuthority | owner_approved |
| approvalStatus | approved |
| riskLevel | low |
| websiteAllowed | true |
| aiAllowed | true |
| ragAllowed | true |
| handoffRequired | false |
| sourceRequired | true |
| allowedAnswerBehavior | The AI Concierge may state that Rick Travel offers guided travel experiences and human support for travelers, using only owner-approved public positioning. It should keep the answer general and avoid adding credentials, guarantees, ratings, insurance claims, or legal claims. |
| blockedAnswerBehavior | Do not claim specific licenses, certifications, years in business, awards, review scores, insurance coverage, or official partnerships unless a separate approved source explicitly supports those claims. |
| freshness/review expectation | Review every 90 days or whenever the public company positioning changes. |
| notes for future migration to structured data | Can become a low-risk RAG record after owner review. Keep sourceRefs tied to approved public company/about copy. |

Safe answer pattern:

Rick Travel can be described as a travel service focused on guided experiences and human support. If the traveler asks for official credentials, certifications, insurance, or legal details, the AI should avoid guessing and route the question to the Rick Travel team.

## Example 2 - Tour Overview Record

| Field | Example value |
| --- | --- |
| recordId | ai-kr-example-tour-overview-001 |
| title | General tour overview behavior |
| locale | en |
| topic/category | tour_overview |
| sourceAuthority | tour_page |
| approvalStatus | approved_with_handoff |
| riskLevel | medium |
| websiteAllowed | true |
| aiAllowed | true |
| ragAllowed | true |
| handoffRequired | false for general overview; true for booking, price, availability, schedule, or custom requests |
| sourceRequired | true |
| allowedAnswerBehavior | The AI Concierge may summarize stable tour overview information from an approved tour page, such as general theme, destination, and broad experience type. It must use non-committal language and point to the approved source. |
| blockedAnswerBehavior | Do not invent exact duration, pickup location, live schedule, available seats, final price, private arrangements, weather outcome, access guarantee, guide identity, or booking confirmation. |
| freshness/review expectation | Review whenever the tour page changes and at least every 60 days during active sales periods. |
| notes for future migration to structured data | Can become a medium-risk RAG record. Future structured data should separate stable overview text from volatile schedule, price, capacity, and booking fields. |

Safe answer pattern:

The AI may provide a high-level summary of a tour when the approved tour page supports it. For current price, schedule, availability, booking confirmation, private requests, or special conditions, it should route the traveler to the live booking flow or WhatsApp support.

## Example 3 - WhatsApp Human Handoff Record

| Field | Example value |
| --- | --- |
| recordId | ai-kr-example-whatsapp-handoff-001 |
| title | Human handoff for commercial confirmation |
| locale | en |
| topic/category | whatsapp_handoff |
| sourceAuthority | owner_approved |
| approvalStatus | approved |
| riskLevel | medium |
| websiteAllowed | true |
| aiAllowed | true |
| ragAllowed | true |
| handoffRequired | true |
| sourceRequired | false for generic handoff wording; true when summarizing a source-specific issue |
| allowedAnswerBehavior | The AI Concierge may explain that the Rick Travel team can confirm details by WhatsApp when the request involves booking, price, availability, custom arrangements, accessibility, safety-sensitive needs, or unresolved source conflicts. |
| blockedAnswerBehavior | Do not imply that WhatsApp handoff confirms a booking, payment, refund, discount, private tour, or exception before a human confirms it. Do not expose private phone numbers unless the approved website/support source authorizes the displayed contact path. |
| freshness/review expectation | Review whenever public support channels or handoff wording change. |
| notes for future migration to structured data | Can become a reusable handoff behavior record. Future backend should use it to generate CTA metadata, not to bypass commercial review. |

Safe answer pattern:

The AI may say that a human from Rick Travel should confirm the requested detail and offer a WhatsApp handoff. It should distinguish between "the team can help confirm this" and "this is confirmed."

## Example 4 - Blocked Volatile Price/Availability Example

| Field | Example value |
| --- | --- |
| recordId | ai-kr-example-blocked-price-availability-001 |
| title | Blocked live price and availability claim |
| locale | en |
| topic/category | pricing_availability |
| sourceAuthority | product_system |
| approvalStatus | blocked |
| riskLevel | blocked |
| websiteAllowed | false |
| aiAllowed | false |
| ragAllowed | false |
| handoffRequired | true |
| sourceRequired | true |
| allowedAnswerBehavior | The AI Concierge may explain that price and availability must be checked through the current product flow or confirmed by the Rick Travel team. It may route to WhatsApp or the appropriate booking flow. |
| blockedAnswerBehavior | Do not invent or reuse a price. Do not claim seats are available. Do not claim a schedule is open. Do not confirm a booking. Do not infer availability from old logs, examples, memory, marketing copy, or static documentation. |
| freshness/review expectation | Always live or human-confirmed. Static examples are not valid sources for current price or availability. |
| notes for future migration to structured data | This should remain a blocked example or negative evaluation case unless a future backend can query an authorized live product source. It should not become RAG content. |

Safe answer pattern:

The AI should say that it cannot confirm current price or availability from static knowledge records. It should direct the traveler to the booking flow or WhatsApp support for confirmation.

## Example 5 - Unknown or Unsupported Answer Example

| Field | Example value |
| --- | --- |
| recordId | ai-kr-example-unknown-unsupported-001 |
| title | Unsupported or unknown Rick Travel-specific request |
| locale | en |
| topic/category | unsupported_request |
| sourceAuthority | policy_document |
| approvalStatus | approved |
| riskLevel | medium |
| websiteAllowed | false |
| aiAllowed | true |
| ragAllowed | true |
| handoffRequired | true when the request is commercial, personal, urgent, safety-sensitive, or explicitly asks for a human |
| sourceRequired | false for limitation wording; true if the answer references a specific policy or source |
| allowedAnswerBehavior | The AI Concierge may say that the available approved Rick Travel sources do not confirm the requested information. It may ask one clarifying question if safe, or route to WhatsApp when a human answer is needed. |
| blockedAnswerBehavior | Do not provide generic travel advice as if it were Rick Travel policy. Do not invent product facts, contact details, legal terms, accessibility guarantees, medical guidance, or operational commitments. |
| freshness/review expectation | Review whenever new approved sources are added that could answer previously unsupported questions. |
| notes for future migration to structured data | Can become an evaluation example for missing-source and unsupported-answer behavior. Future records should track whether the unsupported request later becomes answerable. |

Safe answer pattern:

The AI should clearly state that the answer is not confirmed in approved Rick Travel sources. If the topic matters for booking, safety, accessibility, payment, or a custom request, it should route the traveler to WhatsApp support instead of guessing.

## Future Structured Data Notes

These Markdown examples should remain human-readable until a future task explicitly authorizes structured records. A later migration may convert approved examples into JSON, YAML, or database records only after:

- Required fields are finalized.
- Review and approval ownership are confirmed.
- Privacy and source-reference rules are validated.
- Runtime usage rules are approved.
- Evaluation cases are defined for allowed, blocked, handoff, and unknown-answer behavior.

No structured data is created by RT-AI-019A.

## Non-Implementation Statement

RT-AI-019A creates Markdown examples only. It does not implement backend behavior, API routes, database schema, migrations, seeds, JSON/YAML records, dependencies, LangChain, LangGraph, embeddings, vector store, frontend changes, chatbot behavior, runtime behavior, deploy configuration, or production data ingestion.
