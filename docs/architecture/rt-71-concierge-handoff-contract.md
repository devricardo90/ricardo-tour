# RT-71 — Human / WhatsApp Handoff Contract

- Ticket: RT-71 (RT-RB-AI-05). Status: **Owner-approved architecture direction; implementation and localized final copy remain open.** No WhatsApp automation, bot or API integration is built or proposed. Handoff is a link the visitor chooses to open.
- Canonical contact (`lib/public-contact.ts`, Owner-confirmed RT-52):
  - WhatsApp: **+55 22 99846-1906** (`https://wa.me/5522998461906`)
  - E-mail: **contato@ricardotour.com** (canonical secondary channel; delivery identity was validated under RT-62)
- Superseded contacts must not be used (`SUPERSEDED_CONTACT_PATTERNS`).

## 1. Principle

Handoff is the default safe exit. The Concierge hands off instead of guessing (RT-74). Handoff is **user-initiated at the last step**: the Concierge offers a button/link; nothing is sent to the team without the visitor's action.

## 2. Triggers

| Code | Trigger | Mode |
| --- | --- | --- |
| H1 `explicit_request` | user asks for a human, agent, phone, WhatsApp | immediate offer |
| H2 `booking_payment_issue` | booking or payment request outside supported Concierge capability | immediate offer; no Concierge transaction or collection |
| H3 `unsupported_request` | outside scope (custom itinerary pricing, group quotes, special requests) | offer |
| H4 `low_confidence` | no verified source or retrieval below threshold | offer with "I don't have verified information" |
| H5 `provider_unavailable` | model/retrieval/provider unavailable or rate-limit service failure (RT-74) | degraded UI with contact options |
| H6 `complaint` | complaint, dissatisfaction, legal threat | immediate offer; no defensive or policy-interpretive reply |
| H7 `refund_cancellation` | refund, cancellation, change question | policy facts only if approved source exists; otherwise offer; any case-specific request → human |
| H8 `urgent_operational` | trip today/tomorrow, meeting point, delay, lost, stranded, emergency | immediate offer; for emergencies also say to contact local emergency services first (wording approved by the Owner) |
| H9 `price_availability_commitment` | wants confirmed price/date availability | offer; never confirm |
| H10 `safety_sensitive` | safety of areas, activities, health | no verified claims; offer (RT-74) |
| H11 `flight_hotel` | flights/hotels/packages | no source; offer (provider not integrated) |
| H12 `repeated_failure` | two consecutive misses/errors in one conversation | offer |

Owner-approved triggers also explicitly include operational questions that require staff confirmation. Route those through H4 (missing verified information) or H8 (urgent operational matter) as applicable; do not invent operational facts.

Triggers are evaluated on the server (RT-67); the client never decides to hide a required offer.

## 3. Handoff response

```
handoff: {
  required: boolean,
  reason: H1..H12,
  channels: [ { type: "whatsapp", url }, { type: "email", url } ],
  prefill: string | null      // optional minimal, visitor-visible context, see §4
}
```

UI: both channels shown, WhatsApp first. Opening a channel records `handoff_clicked` (RT-73) with channel and reason only. The team's response time/hours are shown only if the Owner supplies an approved statement (`OWNER_CONTENT_REQUIRED`).

## 4. Context passed to the human

The visitor opens `wa.me` or `mailto:` with an optional **prefilled text**. The prefill is visible to the visitor and editable by them before sending.

| May be included only when useful and explicitly visible/editable to the visitor | Must NOT be included |
| --- | --- |
| locale | name, e-mail, phone, or other PII automatically copied from chat |
| public page/tour identifier or title the visitor was viewing | booking id, payment id, Pix data, card info |
| handoff reason from a fixed approved category | raw conversation transcript or raw user message |
| a short neutral topic from a fixed approved category | model-generated summary of the conversation |
| opaque, non-personal reference code if one is implemented | internal system information, prompts, credentials, source text, rate-limit or error details |

Rationale: URLs are logged by browsers, proxies and messaging apps. Use a user-initiated WhatsApp link first, with e-mail as the secondary option. Do not automatically send WhatsApp messages. Do not attach or persist a transcript; the user composes and sends any additional context themselves.

Maximum prefill length is bounded (message text must stay short; value decided at implementation).

## 5. Handoff UI states

- **Offer** inside an answer (reasons H1–H4, H7, H9–H12).
- **Persistent entry** in the widget header: "Talk to the team" always visible.
- **Degraded** (H5): the input is disabled with a clear message and both channels.
- **Closed hours** (only if current public wording supplies approved hours): show the e-mail option and approved reply wording. No invented hours.

All copy per V1 locale (PT/EN/ES). No promise of a response time unless current public wording supplies an approved value.

## 6. Dependencies and gaps

- Primary human handoff: WhatsApp `+55 22 99846-1906`; secondary: `contato@ricardotour.com`. These are the canonical public contacts. Do not claim a response time or opening hours without approved public wording.
- Team availability statement and emergency wording: `OWNER_CONTENT_REQUIRED`.
- Transcript sharing and any CRM/inbox: excluded from V1. RT-70 permits no raw transcript persistence by default.
- Any WhatsApp Business API/automation: out of scope; would need a separate ticket and Owner approval.

## 7. Acceptance for implementation (RT-67)

1. Each trigger H1–H12 has a test with an example input in each supported locale.
2. The prefill never contains items in the "Must NOT" column (unit test over prefill builder).
3. Only `PUBLIC_CONTACT` values are used for channels.
4. Handoff is available when the model, retrieval or rate-limit backend is down.
5. `handoff_offered` and `handoff_clicked` events are emitted without message content.

## 8. Owner decision record — 2026-10-04

- Primary handoff is user-initiated WhatsApp at `+55 22 99846-1906`; secondary is `contato@ricardotour.com`.
- Trigger set includes explicit human request; unsupported booking/payment; refund/cancellation; missing or low-confidence verified knowledge; model/retrieval failure; complaint; unavailable provider; and operational questions requiring staff confirmation.
- No automatic WhatsApp send. Pass only minimum useful allowlisted context, visible and editable by the visitor. Never include raw conversation text or unnecessary PII.
- Final localized copy and implementation acceptance remain open; RT-71 is not closed.
