# RT-37 — Flight Planner UX Contract

- Jira: RT-37 (`RT-RB-S5-01`), Sprint 6 — Flight Commerce. Companion: RT-65 (`docs/architecture/rt-65-flight-commercial-architecture.md`).
- Status of this document: **APPROVED WITH CORRECTIONS by the Owner (2026-10-03)** — corrections applied; see §28 for the recorded decisions. Documentation only. No UI, no components, no routes, no API calls, no provider integration.
- Purpose: one agreed product/UX behavior so **RT-38** (mock UI) and later **RT-41** (integration) build against the same contract without further UX decisions.
- Source-of-Truth principles that bind this contract: Rio de Janeiro stays the protagonist; the flight engine is a tool of the journey; **no flight integration is presented as real until API/documentation and functional validation exist.**

Markers: `IF_PROVIDER_SUPPORTED` (capability may not exist; the UI must work without it), `EXTERNAL_DECISION_REQUIRED` (learned from RT-39, never assumed), `OWNER_DECISION_REQUIRED` (product/commercial choice). Items marked **PROPOSED** are recommendations for Owner approval, not facts.

## 0. Terminology (shared with RT-65)

Same meanings as RT-65 §0. One word per object — never interchange them in copy, code, Jira or analytics.

| Term | In the UI | Never called |
| --- | --- | --- |
| **Search** | The criteria the customer enters and submits. | "Booking", "reservation" |
| **Offer** | One result card: an itinerary with a price. | "Ticket", "booking", "fare" |
| **Fare** | The price breakdown + conditions (baggage, change/refund rules) *inside* an offer. | The thing being chosen |
| **Selected Offer** | The offer the customer clicked "select" on. Holds nothing; guarantees nothing. | "Reserved", "booked" |
| **Validated Offer** | A selected offer re-confirmed (price + availability) before moving on. | "Held", "confirmed" |
| **Order** | The purchase attempt record (appears to the customer as "your order"). **Never "booking"** — that word belongs to tours. | "Booking" |
| **PNR / Reservation** | Airline-side seat record. Not shown as a customer concept in v1 unless the provider requires it. | "Ticket" |
| **Payment** | The customer's payment. | "Issuance" |
| **Issuance / Ticket** | Producing the e-ticket. The customer sees "ticket" only after issuance. | "Confirmation" before issuance |

UI copy rule: until an order reaches the issued state (RT-65 §16), no screen may say "confirmed", "booked", "ticket issued" or equivalent.

## 1. Scope and non-goals

In scope: the customer-facing behavior of the Flight Planner from entry to the hand-off toward passenger data/payment, including all states, in PT/EN/ES.

Non-goals of this document and of RT-38 are in §25. Passenger-data and payment **screens** are not specified in detail here; only the hand-off is (§19). A follow-up UX ticket is recommended once RT-65's Owner decisions exist.

## 2. Baseline of the current public site (verified 2026-10-03)

| Fact | Consequence |
| --- | --- |
| Public routes live under `app/[locale]/(site)/`: Home, `tours`, `tours/[id]`, `contato`, `quem-somos`. Slugs are Portuguese in every locale (e.g. `/en/contato`). | Flight route follows the same convention (§3). |
| Locales: `pt`, `en`, `es` are public and indexed; `sv` exists but is not advertised/indexed. | Flights ship in pt/en/es only (§23). |
| `SiteHeader` navigation: Experiences, Rio, Concierge, About (Home hash anchors; `anchorMode: "page"` on subpages). | A Flights entry is added to the header/mobile menu (§3). |
| The approved public catalog is four Rio tours (`LAUNCH_TRIP_IDS`). | The "Experiences" tab reuses that catalog (§4). |
| Contact channels exist (`lib/public-contact.ts`: email, WhatsApp, Instagram). | Used for human fallback (§14). |
| Analytics events today are tour-specific. | Flight events are defined here, implemented in RT-66 (§24). |
| Hero/globe animation exists and honors motion preferences elsewhere. | Reduced-motion rules in §22. |
| No flight code exists. | Greenfield; mock only in RT-38. |

## 3. Where the Flight Planner appears

Owner-approved: the canonical route. Everything else in this table is **proposed or deferred** as marked.

| Entry point | Behavior |
| --- | --- |
| **Dedicated route** `/{locale}/voos` — **APPROVED** for PT / EN / ES locale routing | The Flight Planner page: search form + tabs (§4). Canonical home of the feature. **Not implemented in this step.** |
| **Header nav (desktop)** | `OWNER_DECISION_REQUIRED`. A "Flights" item (PT *Voos*, EN *Flights*, ES *Vuelos*) would alter the shared site chrome approved at the Owner visual gate (RT-36). Not part of RT-38; the route is reachable by direct URL only until the Owner decides. |
| **Mobile menu** | `OWNER_DECISION_REQUIRED` (same reason as the header). |
| **Home** — `HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED` | **NOT APPROVED.** The Home passed its Owner gate; any insertion or structural change needs a **separate Owner gate**. RT-38 builds and tests the Flight Planner as an **isolated public-route experience** without modifying the Home. *Concept retained for a future gate only:* a compact **entry bar**  (not the full form): "Plan your flight to Rio" with origin/destination/dates preview that deep-links to `/{locale}/voos` with prefilled query params. It must not create a second implementation of the form. No placement is decided here and nothing about the Home is implemented or tested in RT-38. |
| **Tour pages** | Optional contextual link "Need flights to Rio?" → `/{locale}/voos` with destination prefilled. It changes an approved page, so it is `OWNER_DECISION_REQUIRED` and **not** part of RT-38. |

Query-param deep link: criteria only (origin, destination, dates, passenger counts, trip type). **Never** passenger data, offer handles, prices or tokens in URLs.

The route is **noindex and excluded from the sitemap** while it uses mock data (§21).

## 4. Flights vs Experiences relationship

- The Flight Planner page has two tabs: **Flights** (default) and **Experiences** (the approved Rio catalog, same four tours, same cards as `/tours`; no new content, no new claims).
- Rio de Janeiro remains the protagonist: the destination field is **not locked** to Rio (the provider may serve other routes) but the page copy, suggestions and Experiences tab frame the journey around Rio. Whether non-Rio destinations are allowed at launch is `OWNER_DECISION_REQUIRED`; the contract works either way.
- **Flights and Experiences are two separate travel-product categories** (Owner-approved). A **FlightOrder is never an Experience booking**, and an Experience booking is never a flight order: separate terminology, separate lifecycles (RT-65 §5), separate prices, separate confirmations. UI copy must never describe a flight as an "experience" or a tour as a "flight".
- Flights and Experiences are **independent purchases** in v1. No bundling, no combined price, no cross-sell pricing. Cross-links only: after results, a non-intrusive "Add experiences in Rio" link to the Experiences tab; on a tour page, a link to Flights.
- Switching tabs preserves the flight criteria and (if present) results in the session; it does not re-run the search.
- The Experiences tab never shows flight data; the Flights tab never shows tour pricing.

## 5. Search form: origin and destination

Fields (in visual order, desktop one row, mobile stacked): **Origin**, **Destination**, **Trip type**, **Departure date**, **Return date** (round-trip only), **Passengers**, **Cabin** (conditional, §10), **Search** button.

Rules:

- Each location field is a single combobox that accepts a city or airport and resolves to an **IATA code** (airport or metropolitan area).
- Origin and destination **must differ**. Same airport/same metro area → inline error (§11).
- A **swap** control exchanges origin and destination (keyboard accessible, labeled).
- Pre-fill: destination may be pre-filled by deep link or tour context; origin is **never** pre-filled from geolocation or IP without consent (no hidden tracking). Remembering last search in the same browser session only (sessionStorage), never persisted server-side in v1.
- Displayed value: "City (CODE)" or "Airport name (CODE)"; the code is always visible to avoid ambiguity.

## 6. Airport/city autocomplete expectations

- **Trigger:** from 2 characters; debounced (~250 ms; value is a UI suggestion, adjustable in RT-38).
- **Matches** city name, airport name and IATA code, accent-insensitive (e.g. "sao paulo" matches "São Paulo"), case-insensitive; exact IATA code match ranks first.
- **Grouping:** a metropolitan option ("Rio de Janeiro — all airports", e.g. GIG/SDU) followed by individual airports, **only where the location data supports it** (`IF_PROVIDER_SUPPORTED` / data source below).
- **Ambiguous/partial input:** if the typed text matches several places and none is chosen, the field stays invalid with "Select a place from the list"; free-typed text is never submitted as a location.
- **No results:** "No airports found for '…'. Try the city name or the airport code."
- **Data source:** local curated airport/city dataset vs provider location API is `EXTERNAL_DECISION_REQUIRED`. RT-38 uses a **small static mock dataset** clearly limited (§21).
- **Localization:** names shown in the page locale where the data has them (`IF_PROVIDER_SUPPORTED`); otherwise the dataset's default name + IATA code.
- **Interaction:** standard ARIA combobox/listbox behavior (§22): arrow keys, Enter to select, Esc to close, selection announced; touch-friendly options (§20).
- **Recents/popular:** no personal history; an optional short static list of popular places (Rio, São Paulo, Lisbon, etc.) is `OWNER_DECISION_REQUIRED`; nothing implies availability.

## 7. Trip type: one-way / round-trip

- Control: two-option segmented toggle (radio semantics): **Round trip** (default) / **One way**.
- One way hides the return date and removes its validation.
- Multi-city is **out of scope** for v1 (not shown, not promised).
- Switching from round trip to one way keeps the departure date, discards the return date; switching back restores the previously entered return date if still valid.

## 8. Dates

- **Display:** localized via `Intl` (PT `dd/mm/aaaa`, EN per locale convention, ES `dd/mm/aaaa`); the underlying value is ISO `YYYY-MM-DD`; the picker shows weekday names and localized month names.
- **Input:** a date picker that is fully keyboard operable and also allows typed entry; on mobile use the platform-appropriate picker (§20).
- **Rules:** departure ≥ today (the customer's local date); return ≥ departure (same-day return allowed unless the provider disallows: `EXTERNAL_DECISION_REQUIRED`); maximum advance-sale horizon `IF_PROVIDER_SUPPORTED` (disable and explain dates beyond it; no number is promised here).
- **Flexible dates / calendar price grid:** not in v1.
- **Timezones:** dates are calendar dates at the origin; no time-of-day input in v1.

## 9. Passengers (adults / children / infants)

**Rick Travel defines no passenger age rules of its own.** Age bands, minimum/maximum ages, infant and child rules, accompanied-minor rules and passenger-count limits are **provider/airline rules** and are `IF_PROVIDER_SUPPORTED` / `EXTERNAL_DECISION_REQUIRED` until RT-39 confirms them (RT-65 §27 Q19). **No threshold (e.g. "12+", "2–11", "under 2") may be hard-coded as a provider-independent rule** in the UX, the mock, copy or validation.

- A **popover/sheet** groups passengers by **passenger type** as the provider defines them. The labels and the number of types come from a single configuration (the *passenger-type configuration*) that RT-38 fills with **explicit mock placeholder values** (visibly mock, §21) and that RT-41 later populates from provider rules.
- The control shows age-band help text **only when supplied by that configuration**; if no band text exists, it shows the type label with no age claim.
- Summary on the field: "2 adults, 1 child" (localized, pluralized) built from the configured type labels.
- **Defaults:** configurable; the mock default is 1 adult, 0 children, 0 infants (a UI default, not a rule).
- **Validation rules** (minimum adults, children/infants without an adult, infant-to-adult ratio, maximum passengers, per-child ages) are **driven by the configuration** and are `IF_PROVIDER_SUPPORTED`. The UI may only enforce a rule that exists in the active configuration; when a rule is unknown the UI does not block, and the server/provider validation result is shown through the standard error classes (§14).
- If the provider needs **exact ages** at search time, the sheet adds a per-passenger age selector and this contract is amended before RT-38/RT-41 use it.
- Violations show inline, plain-language messages (§11), and steppers disable at configured limits with explanatory help text.
- No personal data is collected at this stage.

## 10. Cabin class (conditional)

- The selector appears **only if the provider supports cabin selection** (`IF_PROVIDER_SUPPORTED`; `EXTERNAL_DECISION_REQUIRED`). Options come from the supported set; **no cabin value is promised** by this contract.
- If unsupported: the field is **not rendered**, the search does not send a cabin, and result cards show cabin text only if the offer data contains it.
- Default when supported: "Any" / provider default. In RT-38 (mock) the selector may be rendered to exercise the UI but must be flagged as mock behavior and removable by a single switch.
- Mixed-cabin itineraries: display per-segment cabin only if data exists.

## 11. Search action and validation

- **CTA label:** "Search flights" (PT *Buscar voos*, ES *Buscar vuelos*). One primary button; disabled only while a search is in flight (never silently disabled for invalid input; invalid input produces messages instead).
- **Validation timing:** on submit; per-field errors also clear on correction. No premature errors while the user is still typing in a field.
- **Error summary:** on submit with errors, an error summary appears above the form (focus moves to it, links to each field) and each field shows an inline message with `aria-describedby`.
- **Messages** (PT/EN/ES, plain language, no blame; copy owned by RT-78):
  - Origin/destination missing, not selected from list, identical.
  - Departure missing/past/beyond horizon; return before departure; return missing on round trip.
  - Passenger combination invalid (e.g. more infants than adults).
- **Submit:** sends **criteria only**; no credentials, tokens or provider identifiers from the browser (RT-65 §15). Duplicate submissions while in flight are ignored (idempotent).
- Search criteria are mirrored to the URL query so results are shareable/back-button friendly, **excluding** anything beyond the criteria in §3.

## 12. Loading state

- Immediate feedback on submit: the button shows a progress state and the results area shows **skeleton offer cards** (not a blocking spinner), with a polite live-region message "Searching flights…".
- After a delay threshold (value set in RT-38; **PROPOSED** ~8 s) the message becomes "Still searching — this can take a little longer." with a **Cancel** action that stops waiting and returns to the form with criteria intact.
- A hard timeout maps to `PROVIDER_TIMEOUT` (§14). The loading UI never shows fake progress percentages or fake counts ("searching 400 airlines" is forbidden).
- In mock mode the UI simulates latency only to exercise states and keeps the persistent "demo" labeling (§21).

## 13. Empty results

- Valid search with zero offers (`NO_RESULTS`): neutral, helpful state — "No flights found for these dates." with suggestions the data supports: change dates, try nearby airports (only if location data supports it), try one-way, or contact us.
- Not styled as an error (no alarming color/icon); not announced as an error role.
- Always offers: **Modify search** (focus returns to the form) and **Talk to us** (WhatsApp/email, §14 fallback).
- The criteria remain visible above the empty state.

## 14. Failures: provider, network, timeout, partial, ambiguous

Error classes map 1:1 to RT-65 §21. The browser only ever sees these classes, never provider codes or messages.

| Class | When | User-facing behavior |
| --- | --- | --- |
| `VALIDATION_ERROR` | Bad input | Inline + summary (§11). No request made. |
| `NETWORK_ERROR` | Browser can't reach Rick Travel | "You seem to be offline or the connection dropped." **Retry** button; criteria kept. |
| `PROVIDER_TIMEOUT` | Search exceeded budget | "The search is taking too long." **Try again** / **Change search** / **Talk to us**. |
| `PROVIDER_UNAVAILABLE` | Provider down/error | "Flight search is temporarily unavailable." Retry + human fallback; no technical details. |
| `PROVIDER_RATE_LIMITED` | Throttled | "Many people are searching right now. Please try again in a moment." Retry after a short delay (button disabled with visible reason during the cool-down). |
| `INTERNAL_ERROR` | Our bug | Generic message + short **reference id** the customer can quote to support. |
| `PARTIAL_RESULTS` | Some sources failed but offers exist (`IF_PROVIDER_SUPPORTED`) | Show offers with a non-blocking notice: "Some results may be missing." Offer **Retry** to refresh. Never silently present partial results as complete. |
| Ambiguous/partial **location** | Typed text unresolved or multiple matches | Handled at the field (§6); search blocked until a place is selected. |

Common rules:

- Inputs and the form state are **never lost** on an error.
- Errors are announced to assistive tech (`role="alert"` for blocking errors, polite live region for non-blocking notices).
- **Human fallback:** every blocking error offers WhatsApp/email using the verified public contact data. When live flight search/purchase is unavailable, the product **may expose a clearly labeled human-request fallback** (Owner-approved conceptually, 2026-10-03): the customer sends their itinerary request to Rick Travel staff, and the page states plainly that this is a request, not a purchase or a guaranteed fare. **Mock availability is never shown as live availability**, and mock/sample offers are never offered as a substitute for a real result. The exact request form and handling are not defined here; until built, the fallback is contact only.
- Copy never blames the customer, never promises recovery time, never exposes stack traces, provider names or codes.

## 15. Results hierarchy

Top to bottom:

1. **Search summary bar** (route, dates, passengers) with **Modify search** (sticky on scroll).
2. **Status line** (live region): "N flights found" — the number is shown only when real; in mock mode it reads as demo data (§21).
3. **Sort & filter row** (see below).
4. **Offer list** (cards, §16). The first card is not "featured" without a defined rule; ordering is explicit.
5. **Footer notes**: fare/price disclosure line (§16), "Experiences in Rio" cross-link (§4).

**Sort (PROPOSED):** Recommended (default, provider order or a documented rule), Lowest price, Shortest duration, Earliest departure. Sorting is stable and never hides offers.

**Filters (PROPOSED, only on data the offers actually contain; all `IF_PROVIDER_SUPPORTED`):** stops (direct / 1 / 2+), airline, departure/arrival time windows, baggage included. v1 may ship sort + stops only; the rest are deferred, and **no filter control appears for data that is not present**.

**Round trip presentation:** an offer represents the full round trip itinerary (outbound + return) with one total price, unless the provider returns separate legs (`EXTERNAL_DECISION_REQUIRED`); then the interaction becomes a two-step pick and this contract is amended before RT-41.

**Pagination:** progressive "Show more" rather than infinite scroll; count shown only if real.

## 16. Offer card content and price disclosure

An **offer card** shows (each field marked required `R` or conditional `C = IF_PROVIDER_SUPPORTED`):

| Block | Content | |
| --- | --- | --- |
| Itinerary (per direction) | Departure time + airport code, arrival time + airport code, **+1/+2 day** marker when arrival is on another day, total duration, stops count (direct / "1 stop") | R |
| Stops detail | Connection airport(s) and layover duration | C |
| Carrier | Operating/marketing carrier **name** (text). Logos only if rights are cleared (RT-79) | R (name) / C (logo) |
| Flight numbers, aircraft | | C |
| Cabin | | C |
| Baggage summary | Included baggage in one short line (§17) | R-if-known, else explicit "Check baggage details" |
| **Total price** | Total for **all passengers**, localized currency (§23) | R |
| Price breakdown | Per passenger type, taxes/fees included or separate | C |
| Fare conditions link | "Fare conditions" opens the disclosure (§17) | R |
| **Select** button | Primary action (§18) | R |

**Price disclosure rules (binding):**

- The price shown is **indicative until validated**. A permanent one-line note near the list: "Prices are confirmed on the next step and may change." (copy owned by RT-78/legal).
- State clearly **what the price covers**: total for N passengers; whether taxes and fees are included (`IF_PROVIDER_SUPPORTED` — if unknown, the card must not claim "all taxes included").
- Show **one** price per offer (total). Per-person price is shown only if data supports it, and labeled "per adult" etc.
- **Currency:** the provider/offer currency (`EXTERNAL_DECISION_REQUIRED`). No silent conversion; if conversion is ever added the converted value is labeled as approximate.
- Never display markup, commission, net fare or "savings"/"was" prices unless Owner-approved and provider-supported. No urgency tricks ("only 2 seats left", countdowns) unless the data is real and the Owner approves.
- A price that cannot be shown (missing) → the offer is not shown. No "consult us" cards inside the offers list.

## 17. Baggage and fare-rule disclosure

- **Before selection**, the customer can open **Fare conditions** (inline expansion on desktop, bottom sheet on mobile) from every card.
- **Baggage:** shown per direction/segment as provided: cabin bag, checked bags (count/weight), or "Not included". If the data is missing or unreliable, show "Baggage details are confirmed on the next step" — **never infer** from airline or fare name.
- **Fare rules** (change/cancel/refund, no-show, validity): displayed as structured data if the provider returns it; otherwise as provider-supplied text in its original language with an explicit "Provided by the fare supplier" label; **Rick Travel does not write or paraphrase fare rules** (no invented legal copy).
- A **non-dismissable acknowledgement** that conditions apply appears at the hand-off to passenger/payment (§19); detailed accept/consent mechanics belong to the later checkout UX and Terms (RT-81).
- Availability of each data point: `EXTERNAL_DECISION_REQUIRED` (RT-39 Q16, Q17).

## 18. Selection interaction, revalidation, price changes, stale/sold-out offers

1. The customer presses **Select** on an offer → the card enters a **Selected Offer** state (visually distinct, `aria-pressed`/focus managed). Nothing is held anywhere.
2. The UI immediately begins **revalidation** (RT-65 §12): a modal/inline panel "Confirming price and availability…" (polite live region); the rest of the page is inert but the customer can **Cancel**.
3. Outcomes:
   - **Valid** (`VALID`): panel shows the validated total and a **Continue** action (hand-off, §19).
   - **Price changed** (`PRICE_CHANGED`) — **Owner-approved rule:** any *material* fare/price change after validation requires **explicit customer acceptance before continuation**, and the updated amount is **never charged silently**. What counts as "material" is not defined here; until the Owner defines a threshold the contract treats **any** change as requiring acceptance. Show **old total → new total** and the difference; the customer must press an explicit **Accept new price** or **Back to results**. No auto-continue, no default-focused "accept". The change message uses neutral wording.
   - **Sold out / no longer available** (`OFFER_UNAVAILABLE`): "This offer is no longer available." Return to results with the card marked unavailable (not removed silently) and the criteria intact; propose adjacent options from the current list.
   - **Stale offer** (`OFFER_STALE`, validity elapsed before selection or between steps): same as above with wording "This fare has expired; prices change often." Offer **Search again** (re-runs with the same criteria).
   - **Revalidation failure/timeout:** retry or return; never proceed unvalidated.
4. If an offer validity countdown exists (`IF_PROVIDER_SUPPORTED`), it is shown as plain text ("Valid for N minutes") **only when real**; it must not trigger auto-redirects mid-interaction; at expiry the UI explains and offers re-search.
5. Deselecting (Back) restores the list scroll position and focus to the card.
6. Only **one** offer can be Selected at a time.

## 19. Continuation toward passenger data and payment

RT-37/RT-38 define the **hand-off only**:

- After a `VALID` validation (or accepted price change), the customer sees the **Validated Offer summary** (itinerary, total, baggage line, fare-conditions link) and a primary **Continue** action.
- In **RT-38 (mock)** *Continue* leads to a **terminal informational panel**: "The next steps (passenger details and payment) are not available yet. This is a preview." with a **Talk to us** action and **Back to results**. It must not collect any data, must not call any API, and must not imply a real purchase.
- In the real product (after RT-65 approval and later tickets) *Continue* proceeds to passenger data → payment/request, whose UX is **specified in a follow-up ticket** (not RT-37). The hand-off must carry only a validated-offer reference created by the server, never prices or itinerary data trusted from the client.
- The wording of the step after *Continue* depends on the commercial model (online purchase vs request-only; RT-65 §24) — **do not hard-code "Pay"**; the button stays "Continue".
- **Guest checkout must be supported** (Owner direction, 2026-10-03). An account is **not** required solely to purchase or request a flight unless a future legal or provider constraint requires it. Account creation may be offered as optional; the hand-off must work without a signed-in user.

## 20. Mobile behavior

- Single-column layout; fields stacked; the **search CTA is sticky** at the bottom of the viewport while the form is in view, clear of the browser chrome and safe areas.
- **Location, date and passenger pickers open as full-screen or bottom sheets** with a clear close/confirm; the keyboard does not obscure the options list (combobox scrolls into view).
- **Touch targets ≥ 44×44 px**; spacing prevents mis-taps on steppers and swap.
- Results: cards are compact (route + times + price + select), with fare conditions in a bottom sheet; the search summary bar is collapsible; sort/filter is a single sheet.
- No horizontal scrolling at 320 px width; text reflows at 200% zoom.
- Date selection: native pickers are acceptable if they satisfy §8 rules; a custom picker must meet §22.
- Entry from the header/mobile menu and from the Home is **not part of RT-38** (`OWNER_DECISION_REQUIRED`, §3); on mobile the Flight Planner is reached by direct URL.
- Dedicated mobile polish remains **deferred** (RT-76); this section is the *baseline* behavior RT-38 must meet, not a polish pass.

## 21. Mock-data contract and the Offer view model

### 21.1 Mock mode rules (binding for RT-38)

- **Visible labeling:** a persistent, non-dismissable banner on the Flights tab: "Demo preview — sample data, not real flights or prices." in all locales, and a "Sample" badge on every offer card.
- **No real brands:** fictional carriers only (e.g. "Sample Air"), no real airline names/logos, no real flight numbers, no prices modeled to look like real quotes.
- **No indexing:** the route is `noindex`, excluded from the sitemap and from the Concierge's knowledge; no structured data for flights.
- **No network:** no calls to any provider, PSP or third party; fixtures are local and deterministic.
- **Deterministic scenarios** selectable via a dev-only switch (not visible to customers): success, no results, slow, timeout, provider unavailable, rate limited, partial results, price changed on revalidation, offer unavailable, offer stale. These exist to exercise every state in §11–§18.
- **One switch to remove:** all mock data lives behind one adapter so replacing it with the real server route in RT-41 requires no UI changes.
- **No persistence/analytics:** mock sessions emit no analytics and store nothing server-side.

### 21.2 Offer view model (Rick Travel's browser-facing contract)

This is **Rick Travel's own** shape. The provider gateway (RT-65 §6) maps into it; provider field names never appear in UI code. Fields marked **C** exist only if the provider supplies them (`IF_PROVIDER_SUPPORTED`); the UI must render correctly when they are absent.

```
FlightSearchCriteria
  origin: { code, label }                    // IATA code + display label
  destination: { code, label }
  tripType: "ONE_WAY" | "ROUND_TRIP"
  departDate: "YYYY-MM-DD"
  returnDate?: "YYYY-MM-DD"                  // round trip only
  passengers: { adults, children, infants }
  cabin?: <supported value>                  // C

FlightOfferView
  offerRef: string                           // opaque, server-signed, short-lived handle (NOT a provider id)
  directions: [ {                            // 1 for one-way, 2 for round trip (if single-offer round trips)
      segments: [ {
          from: { code, name? }, to: { code, name? },
          departAt: ISO local datetime, arriveAt: ISO local datetime,
          carrierName: string, carrierLogoRef?: string,   // logo only if rights cleared (C)
          flightNumber?: string,                           // C
          aircraft?: string,                               // C
          cabin?: string                                   // C
      } ],
      durationMinutes: number,
      stops: number,
      layovers?: [ { airportCode, minutes } ]              // C
  } ]
  price: { currency: string, total: number, breakdown?: [ { passengerType, amount, taxesIncluded?: boolean } ] }   // breakdown C
  baggage?: { perDirection: [ { cabin?: string, checked?: string, note?: string } ], known: boolean }            // C
  fareConditions?: { structured?: [...], text?: string, language?: string, source: "provider" }                  // C
  validity?: { expiresAt?: ISO datetime }                                                                         // C
  isSample: boolean                                                                                               // true in mock mode

ValidationResultView
  status: "VALID" | "PRICE_CHANGED" | "UNAVAILABLE" | "STALE" | "FAILED"
  validatedOfferRef?: string
  previousTotal?: number, newTotal?: number, currency?: string
  reason?: safe message key

ErrorView
  class: "VALIDATION_ERROR" | "NETWORK_ERROR" | "PROVIDER_TIMEOUT" | "PROVIDER_UNAVAILABLE"
       | "PROVIDER_RATE_LIMITED" | "INTERNAL_ERROR" | "PARTIAL_RESULTS" | "OFFER_STALE" | "OFFER_UNAVAILABLE" | "PRICE_CHANGED"
  messageKey: string                         // localized by the UI, never provider text
  referenceId?: string                       // for INTERNAL_ERROR support reference
  retryable: boolean
```

Rules: times shown in the **local time of each airport**; no field carries commission/net fare/markup/credentials/raw provider payload (RT-65 §15); `offerRef` is the only way to refer to an offer after search.

## 22. Accessibility baseline and reduced motion

Target: **WCAG 2.2 AA** for the Flight Planner.

- **Structure:** the page has one `h1`; the form is a `form` with labeled controls; results are a list (`ul`/`li` or equivalent) with a labeled region.
- **Labels:** every field has a visible, programmatically associated label; placeholders are never the only label.
- **Combobox (location):** ARIA 1.2 combobox/listbox pattern, `aria-expanded`, `aria-activedescendant`, option announcements, Esc closes, selection by Enter; clear button labeled.
- **Date picker:** operable by keyboard (arrows/PageUp/PageDown/Home/End), announces date and weekday, typed entry supported, focus trapped in the dialog and returned to the trigger on close.
- **Steppers:** buttons with accessible names ("Add adult", "Remove adult"), current value announced, disabled state explained by text.
- **Errors:** inline messages tied via `aria-describedby`; error summary receives focus on failed submit; blocking errors use `role="alert"`; non-blocking notices use a polite live region.
- **Dynamic updates:** loading, result count, revalidation outcome and price change are announced via live regions; focus management on state changes (to the summary, to the first result, or to the price-change decision) is specified per state, never leaving focus on a removed element.
- **Not color alone:** selected/unavailable/price-change states carry text/icons; contrast ≥ 4.5:1 (text) and 3:1 (UI components).
- **Target size and focus:** visible focus indicator on all controls; targets ≥ 24×24 CSS px minimum (44 px recommended on touch, §20).
- **Time limits:** an offer validity countdown, if any, is informative and extendable via re-search; there is no auto-submit.
- **Zoom/reflow:** usable at 200% zoom and 320 px width without two-dimensional scroll.
- **Reduced motion:** honors `prefers-reduced-motion`. Skeleton shimmer, sheet transitions and any decorative globe/route animation are disabled or replaced by static states; **no information is conveyed only through motion**.
- **Screen-reader text:** itinerary is readable as a sentence ("Leaves São Paulo 08:10, arrives Rio de Janeiro 09:25, direct, 1 h 15").
- Verification belongs to RT-46 and RT-83; RT-38 must meet the baseline above at build time.

## 23. Locale rules (PT / EN / ES)

- **Supported:** `pt`, `en`, `es`. `sv` is not advertised or indexed; the Flights entry follows the same policy as other public pages (not offered in `sv`; a request to `/sv/voos` follows the site's existing fallback behavior).
- **Source language:** Portuguese is the source copy; EN/ES are translations. All UI strings live in the locale copy modules, not inline. Final copy review is RT-78.
- **Formatting:** dates, times, numbers, currency and plurals via `Intl` with the page locale; 24-hour times; currency displayed in the **offer's currency** with locale-correct symbol placement (e.g. R$ 1.234,56 in PT; EN/ES per their conventions).
- **Provider-supplied text** (fare rules, airline names, airport names): shown **as received**; where it is in another language, label it ("Provided by the fare supplier — original language"); **do not machine-translate** fare rules or conditions.
- **Locale switching** keeps criteria and results in the session and re-renders labels/formatting; it does not re-run the search; the URL locale prefix changes only.
- **Legal/disclosure copy** (price note, conditions acknowledgement, terms links): **not invented here**; supplied by the Owner/legal (RT-80/RT-81). Placeholders are marked `LEGAL_COPY_PENDING` and must not ship to production with invented text.
- **Slug:** `/{locale}/voos` for all locales (consistent with `contato`, `quem-somos`).

## 24. Analytics event points (definition only — implemented in RT-66)

Conceptual events; **none emitted by RT-38 or in mock mode**. Data-minimization rule: **no passenger PII, no document/contact data, no free-text input, no offer refs, no provider payloads**.

| Event | Fired when | Allowed properties |
| --- | --- | --- |
| `flight_planner_viewed` | Flights tab shown | locale, entry source (nav/home/tour) |
| `flight_search_submitted` | Valid submit | origin code, destination code, trip type, days-until-departure bucket, passenger **counts** (not names), cabin if used |
| `flight_results_viewed` | Results rendered | result-count bucket, latency bucket, partial flag |
| `flight_sort_changed` / `flight_filter_changed` | Control used | control name, value (from a fixed set) |
| `flight_offer_selected` | Select pressed | position bucket, price bucket (not exact), stops |
| `flight_revalidation_result` | Revalidation ends | status (VALID/PRICE_CHANGED/UNAVAILABLE/STALE/FAILED), change bucket |
| `flight_error_shown` | Blocking error | error class (from ErrorView), step |
| `flight_handoff_clicked` | Continue / Talk to us pressed | which action |
| `flight_tab_switched` | Flights ⇄ Experiences | from, to |

Respect existing consent/attribution handling; existing `AnalyticsEventType` is tour-specific and will be extended in RT-66, not reused for flight semantics. Final audit: RT-48.

## 25. Explicit non-goals for RT-38 (and for RT-37's document)

RT-38 **will not**:

- call any provider, PSP, geolocation or third-party API;
- use real airline names, logos, flight numbers or realistic-looking prices (§21);
- implement revalidation against anything real (only scripted mock outcomes);
- implement passenger data, payment, order, account, or confirmation screens (only the informational dead-end of §19);
- persist anything server-side or emit analytics (§24);
- create database models, API routes for flights, webhooks, or env variables;
- be indexed, in the sitemap, or exposed to the Concierge;
- implement filters that rely on data the mock does not model;
- ship final copy (RT-78), final mobile polish (RT-76), or legal text (RT-80/RT-81);
- **modify the Home, the header or the mobile menu in any way**; Home/header integration is `OWNER_DECISION_REQUIRED` and needs a separate Owner gate (`HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED`).

## 26. Provider-dependent items and open questions

Everything below is **not promised** by this contract until RT-39 answers it (numbers refer to RT-65 §27):

| Item | Appears here | RT-39 question |
| --- | --- | --- |
| Search criteria supported, flexible dates, multi-city | §5, §7, §8 | Q3 |
| Offer validity | §18 | Q4 |
| Revalidation and price change behavior | §18 | Q5 |
| Passenger age bands, limits, infant/child rules, child ages needed (`IF_PROVIDER_SUPPORTED`, `EXTERNAL_DECISION_REQUIRED`) | §9 | Q19 |
| Cabin classes | §10 | Q18 |
| Baggage data | §16, §17 | Q16 |
| Fare-rule data and language | §17 | Q17 |
| Round-trip as one offer vs separate legs | §15 | Q3 |
| Currency and tax-inclusion semantics | §16 | Q3, Q25 |
| Location data source (provider vs local) | §6 | Q3 |
| Rate limits / timeouts (drives loading thresholds) | §12, §14 | Q20, Q21 |
| Carrier logos rights | §16 | RT-79 |
| Maximum advance-sale horizon | §8 | Q3 |

Owner decisions still open: non-Rio destinations allowed? (§4), popular-places list (§6), tour-page flight link (§3), header/mobile-menu entry (§3), **Home entry integration (§3, `OWNER_DECISION_REQUIRED`)**. Decisions taken on 2026-10-03 are recorded in §28.

## 27. Consistency with RT-65 and acceptance mapping

- Terminology §0 is identical in meaning to RT-65 §0.
- Error classes §14 = RT-65 §21 taxonomy; revalidation wording §18 = RT-65 §12; hand-off §19 = RT-65 §4/§16; Offer view model §21 = the gateway's output contract (RT-65 §6); data never shown in the browser follows RT-65 §15.
- RT-37 acceptance (Jira) — mapping of required contract items to sections:

| Required item | Section |
| --- | --- |
| entry point, desktop/mobile entry points | §3, §20 |
| Flights vs Experiences | §4 |
| origin/destination, autocomplete, partial/ambiguous locations | §5, §6, §14 |
| one-way / round-trip, dates | §7, §8 |
| passengers, infant/child | §9 |
| cabin conditional | §10 |
| search CTA, validation | §11 |
| loading, empty, provider/network failures | §12, §13, §14 |
| results hierarchy, fare card, price/baggage/fare-rule disclosure | §15, §16, §17 |
| selection, price-change/revalidation, sold-out/stale | §18 |
| continuation to passenger/payment | §19 |
| mobile, accessibility, reduced motion | §20, §22 |
| PT/EN/ES | §23 |
| analytics event points | §24 |
| mock-data contract | §21 |
| non-goals for RT-38 | §25 |

## 28. Owner review record (2026-10-03)

**RT-37: APPROVED WITH CORRECTIONS.** Corrections applied in this revision (§3, §4, §9, §14, §18, §19, §20, §25, §26).

| # | Decision | Effect |
| --- | --- | --- |
| 1 | Canonical route `/{locale}/voos` approved for PT/EN/ES | §3. Not implemented in this step. |
| 2 | Flights and Experiences are separate product categories; a FlightOrder is not an Experience booking; terminology stays separate | §0, §4 |
| 3 | `HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED`. Home entry bar **not approved**. RT-38 may build/test the Flight Planner as an isolated public-route experience without modifying the Home. Any Home change needs a separate Owner gate. (By the same reasoning the header/mobile-menu entry is also deferred.) | §3, §20, §25 |
| 4 | Passenger age bands and rules are `IF_PROVIDER_SUPPORTED` / `EXTERNAL_DECISION_REQUIRED` until RT-39; no hard-coded thresholds | §9 |
| 5 | Commercial target: SEARCH → SELECT → PAY → ISSUE — a business target, **not** permission for payment-before-reservation; ordering depends on RT-39 | RT-65 §9, §30 |
| 6 | PSP remains `OWNER_DECISION_REQUIRED`; Mercado Pago not selected because legacy variables exist | RT-65 §7, §30 |
| 7 | Material price change after validation requires explicit customer acceptance; never silently charge the updated amount | §18 |
| 8 | Guest checkout must be supported; account not required solely to buy/request a flight | §19 |
| 9 | Provider-down: a clearly labeled human-request fallback is allowed; mock availability is never shown as live | §14 |
| 10 | Still unresolved pending RT-39/provider evidence: exact PSP; authorization vs capture; reservation/payment ordering; seller of record; issuance-failure liability; cancellation/refund responsibility; markup; currency/conversion; incident SLA; manual-review staffing/hours | RT-65 §24, §30 |
