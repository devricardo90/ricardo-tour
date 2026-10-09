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

## 9. Implementation status — 2026-10-09 (PT V1 backend runtime)

Implemented in `lib/ai-concierge/runtime/handoff.ts` and the runtime pipeline. **Not** changed: `app/api/ai-concierge`, the public widget/UI, the Home, production flags. Production stays disabled until RT-75.

### 9.1 Specification review (before implementation)

| Finding | Resolution |
| --- | --- |
| Dependency RT-RB-F-04 (RT-61) and the e-mail identity check (RT-62) | Both Concluído in Jira; `contato@ricardotour.com` is the confirmed canonical secondary channel. No blocker |
| H1, H3, H6, H12 and urgent operations (H8) had no trigger; no structured handoff object or prefill builder existed | Implemented (below) |
| §7 asks for a test per trigger "in each supported locale" while V1 is PT only | PT tests per trigger; EN/ES return `UNSUPPORTED_LOCALE` with an H3 handoff to the team |
| §3 channel list must not depend on the backend | Channels are static data built from `PUBLIC_CONTACT` and attached even to degraded and configuration-error results; `getHandoffChannels()` is exported for the always-visible entry |
| §4 prefill must be visitor-visible/editable and never carry chat text or PII | The prefill is a fixed sentence keyed only by the handoff code (12 closed topics, ≤160 characters). The builder accepts no free text and throws on unknown codes |
| `handoff_clicked` and "closed hours"/team-availability wording | `handoff_clicked` belongs to the UI and RT-73. No approved hours or response time exist (`OWNER_CONTENT_REQUIRED`), so none are shown and a post-check blocks any generated response-time or opening-hours claim |
| Found by tests: the personal-data reminder fired because the conversation history contained our own canonical phone number | Only visitor-typed text is considered now |

### 9.2 Behavior

- `RuntimeResult.handoff = { required, code (H1–H12), reason, channels [WhatsApp, e-mail], prefill }` is present for `HANDOFF`, `DYNAMIC_LOOKUP_REQUIRED`, `INSUFFICIENT_EVIDENCE`, `UPSTREAM_ERROR` and `UNSUPPORTED_LOCALE`; absent for answers, refusals and invalid input.
- Triggers (all deterministic, before retrieval/model unless noted): H1 explicit human/WhatsApp/phone request; H2 booking/payment actions and status; H3 custom/group/quote requests, out-of-scope advice, unsupported locale; H4 no verified evidence (after retrieval); H5 provider/configuration failure; H6 complaint (empathetic fixed text, no defense or policy interpretation); H7 refund/cancellation; H8 operational/urgent/emergency; H9 price/availability; H10 safety-sensitive without approved evidence; H11 flights/hotels/Oner; H12 a second consecutive miss, detected from the client-held history (no server state).
- Texts state that the Concierge does **not** transfer conversations or contact the team; the visitor chooses a channel and sends the message. The WhatsApp link opens `wa.me` with the fixed prefill, e-mail opens `mailto:` with a fixed subject and body. Nothing is sent automatically, no transcript is attached.
- Observability: the `handoff_offered` event carries the code only.

### 9.3 UI direction (design contract only, no UI built)

The Owner-approved concept is an expandable right-hand side panel on desktop and a near-full-screen responsive panel on mobile, with a premium, editorial, accessible Ricardo Tour look (not a generic robot-chat aesthetic). When the UI ticket is authorized after RT-75, it should render from `response_kind` and `handoff` as follows: offer card inside an answer (WhatsApp primary button, e-mail secondary, prefill visible), a persistent "Falar com a equipe" entry in the panel header fed by `getHandoffChannels()`, and a degraded state with input disabled and both channels. The history stays in component memory (RT-70). Existing Home design untouched.

### 9.4 Still open for RT-71 (why it is not closed)

1. UI rendering of the offer / persistent entry / degraded state (public UI out of scope until RT-75).
2. `handoff_clicked` event (UI + RT-73).
3. Owner-approved team availability/response-time wording and emergency wording (`OWNER_CONTENT_REQUIRED`); EN/ES copy (V1 is PT only).
4. Owner review at RT-75.
