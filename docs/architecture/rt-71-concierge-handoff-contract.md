# RT-71 — Human / WhatsApp Handoff Contract

- Ticket: RT-71 (RT-RB-AI-05). Status: **DRAFT.** Design only. **No WhatsApp automation, bot or API integration is built or proposed.** Handoff is a link the visitor chooses to open.
- Canonical contact (`lib/public-contact.ts`, Owner-confirmed RT-52):
  - WhatsApp: **+55 22 99846-1906** (`https://wa.me/5522998461906`)
  - E-mail: **contato@ricardotour.com** (mailbox availability depends on the domain/e-mail work, RT-58/RT-61; see §6)
- Superseded contacts must not be used (`SUPERSEDED_CONTACT_PATTERNS`).

## 1. Principle

Handoff is the default safe exit. The Concierge hands off instead of guessing (RT-74). Handoff is **user-initiated at the last step**: the Concierge offers a button/link; nothing is sent to the team without the visitor's action.

## 2. Triggers

| Code | Trigger | Mode |
| --- | --- | --- |
| H1 `explicit_request` | user asks for a human, agent, phone, WhatsApp | immediate offer |
| H2 `booking_payment_issue` | problem with an existing booking, payment, Pix, confirmation | immediate offer; no Concierge troubleshooting |
| H3 `unsupported_request` | outside scope (custom itinerary pricing, group quotes, special requests) | offer |
| H4 `low_confidence` | no verified source or retrieval below threshold | offer with "I don't have verified information" |
| H5 `provider_unavailable` | model/retrieval/limits down (RT-74) | degraded UI with contact options |
| H6 `complaint` | complaint, dissatisfaction, legal threat | immediate offer; no defensive or policy-interpretive reply |
| H7 `refund_cancellation` | refund, cancellation, change question | policy facts only if approved source exists; otherwise offer; any case-specific request → human |
| H8 `urgent_operational` | trip today/tomorrow, meeting point, delay, lost, stranded, emergency | immediate offer; for emergencies also say to contact local emergency services first (wording approved by the Owner) |
| H9 `price_availability_commitment` | wants confirmed price/date availability | offer; never confirm |
| H10 `safety_sensitive` | safety of areas, activities, health | no verified claims; offer (RT-74) |
| H11 `flight_hotel` | flights/hotels/packages | no source; offer (provider not integrated) |
| H12 `repeated_failure` | two consecutive misses/errors in one conversation | offer |

Triggers are evaluated on the server (RT-67); the client never decides to hide a required offer.

## 3. Handoff response

```
handoff: {
  required: boolean,
  reason: H1..H12,
  channels: [ { type: "whatsapp", url }, { type: "email", url } ],
  prefill: string | null      // safe prefill, see §4
}
```

UI: both channels shown, WhatsApp first. Opening a channel records `handoff_clicked` (RT-73) with channel and reason only. The team's response time/hours are shown only if the Owner supplies an approved statement (`OWNER_CONTENT_REQUIRED`).

## 4. Context passed to the human

The visitor opens `wa.me` or `mailto:` with an optional **prefilled text**. The prefill is visible to the visitor and editable by them before sending.

| May be included (prefill) | Must NOT be included |
| --- | --- |
| locale | name, e-mail, phone, document numbers (the visitor can type them themselves) |
| page/tour the visitor was on (tour title) | booking id, payment id, Pix data, card info |
| handoff reason in plain words | raw conversation transcript |
| a short neutral topic line written from approved categories (e.g. "Question about the Pão de Açúcar tour") | model-generated summary of what the user said verbatim; free text from the user is not copied into the URL automatically |
| a Concierge reference code (opaque, non-personal) | internal system information, prompts, source ids, rate-limit or error details |

Rationale: URLs are logged by browsers, proxies and messaging apps; PII must not be put there on the visitor's behalf. A transcript is shared only if the visitor explicitly chooses "send conversation to the team" (a future opt-in, see §7), never by default.

Maximum prefill length is bounded (message text must stay short; value decided at implementation).

## 5. Handoff UI states

- **Offer** inside an answer (reasons H1–H4, H7, H9–H12).
- **Persistent entry** in the widget header: "Talk to the team" always visible.
- **Degraded** (H5): the input is disabled with a clear message and both channels.
- **Closed hours** (if the Owner provides hours): show the e-mail option prominently and the expected reply wording the Owner approves. No invented hours.

All copy per language (pt/en/es; `sv` per RT-68 policy). No promise of a response time unless the Owner approves one.

## 6. Dependencies and gaps

- E-mail: `contato@ricardotour.com` is the canonical address; whether its mailbox works depends on the domain's current mail setup, which is unknown (RT-58 §6). Until confirmed, WhatsApp is the primary channel and the e-mail link is shown only after the Owner confirms the mailbox.
- Team availability statement and emergency wording: `OWNER_CONTENT_REQUIRED`.
- Opt-in transcript sharing and any CRM/inbox: not designed here; requires RT-70 decisions.
- Any WhatsApp Business API/automation: out of scope; would need a separate ticket and Owner approval.

## 7. Acceptance for implementation (RT-67)

1. Each trigger H1–H12 has a test with an example input in each supported locale.
2. The prefill never contains items in the "Must NOT" column (unit test over prefill builder).
3. Only `PUBLIC_CONTACT` values are used for channels.
4. Handoff is available when the model, retrieval or rate-limit backend is down.
5. `handoff_requested` and `handoff_clicked` events are emitted without message content.
