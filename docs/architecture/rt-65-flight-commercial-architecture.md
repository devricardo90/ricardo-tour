# RT-65 — Flight Commercial Architecture

- Jira: RT-65 (`RT-RB-C-01`), Sprint 6 — Flight Commerce. Companion: RT-37 (`docs/architecture/rt-37-flight-planner-ux-contract.md`).
- Status of this document: **APPROVED by the Owner (2026-10-03)** — architecture is authoritative; decisions recorded in §30. Documentation only. No code, no Prisma models, no provider calls, no credentials, no payment implementation.
- Governing rule: **no Flytour/MaisFly (or any provider) behavior is invented here.** Anything that depends on provider documentation or a commercial/legal agreement is marked `EXTERNAL_DECISION_REQUIRED` and listed in §27 for RT-39. Anything only the Owner can decide is marked `OWNER_DECISION_REQUIRED` (§24). Legal questions are in §25.

Markers used throughout:

| Marker | Meaning |
| --- | --- |
| `EXTERNAL_DECISION_REQUIRED` | Depends on provider/PSP documentation or contract. Must be learned, not assumed. |
| `OWNER_DECISION_REQUIRED` | Commercial or product policy for the Owner. |
| `LEGAL_REVIEW_REQUIRED` | Needs legal/compliance input. |
| `IF_PROVIDER_SUPPORTED` | Capability may not exist; design must work without it. |

## 0. Terminology (shared with RT-37)

The two documents use these words with exactly one meaning each. Do not use them interchangeably in code, UI copy, Jira or analytics.

| Term | Meaning | Not to be confused with |
| --- | --- | --- |
| **Search** | A set of criteria (origin, destination, dates, passengers, cabin if supported) and the act of submitting it. | An offer, a result list. |
| **Offer** | One purchasable itinerary-plus-price returned by a search, as normalized by Rick Travel. It has an identity and a **validity window that is not assumed** (`EXTERNAL_DECISION_REQUIRED`). Price inside an offer is indicative until validated. | A fare rule, a ticket, a booking. |
| **Fare** | The pricing/conditions component *inside* an offer (price breakdown, baggage allowance, change/refund rules). Never used as a synonym for an offer. | The product the customer buys. |
| **Selected Offer** | The offer the customer chose in the UI. Selection is a client intent; it holds nothing on the provider side and guarantees nothing. | A reservation. |
| **Validated Offer** | A selected offer re-confirmed with the provider immediately before commitment (availability + price). Only a validated offer may proceed to passenger data/payment. | A hold. |
| **Order** | Rick Travel's own record of one customer purchase attempt for flights. It owns the state machine in §16. The word **"Booking" is reserved for the existing tour domain** and must not be used for flights. | The existing `Booking` model. |
| **PNR / Reservation** | The provider/airline-side record that holds seats for named passengers (possibly time-limited). | A paid or issued ticket. |
| **Payment** | The customer's money movement via the payment provider (PSP). | Issuance. |
| **Issuance** | The act (by the issuing entity) of producing e-tickets for a reservation. | Reservation, payment. |
| **Ticket** | The issued e-ticket (ticket number(s)) proving the right to travel. | Itinerary confirmation email. |
| **Confirmation** | Rick Travel's communication to the customer that the order reached ISSUED. | Payment receipt. |

## 1. Scope and non-goals

In scope: the commercial and technical boundary of selling flights through a consolidator (Flytour/MaisFly is the intended provider — **not yet confirmed**), from Search to Confirmation, plus failure, cancellation and refund branches.

Non-goals:

- Any implementation: no code, no Prisma models, no migrations, no API routes, no provider SDKs.
- Any claim about what Flytour/MaisFly's API can do.
- Choosing commercial policy (refund policy, who bears issuance risk, markup) — recorded as `OWNER_DECISION_REQUIRED`.
- UX detail (RT-37) and analytics event implementation (RT-66).
- Domain/DNS, Resend, Vercel configuration (Sprint 5). The consolidator is **not assumed** to require the custom production domain; whether it does is question Q29 in §27.

## 2. Current repository baseline (verified 2026-10-03)

| Fact | Evidence | Consequence |
| --- | --- | --- |
| `Booking` requires `tripId` (and optionally `scheduleId`), carries `guestCount` and `totalPriceCents`, statuses `PENDING/CONFIRMED/CANCELED`, `paymentStatus` `UNPAID/PAID/REFUNDED/PARTIAL`. | `prisma/schema.prisma` | Modeled for a scheduled tour; no concept of offer, passenger documents, PNR, ticket number, issuance. |
| `Booking.trip` and `Booking.user` use `onDelete: Cascade`. | `prisma/schema.prisma` | Deleting a trip or a user would delete the booking and its payment attempts. Unacceptable for flight orders, whose financial/audit records must outlive user deletion (see §13/§22). |
| `PaymentAttempt` is a child of `Booking` (`bookingId` FK, cascade), has `provider`, `providerPaymentId`, `providerEventId`, `amountCents`, `currency` (default BRL), `status`, `checkoutUrl`, `metadata`. | `prisma/schema.prisma` | Useful *shape* reference, but structurally tied to tour bookings. |
| There is no active payment service and no webhook route. The only payment artifact is an abandoned `lib/services/.payment.service.ts.bak`. | repo tree | No approved payment architecture exists. |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` appear in `.env.example`; analytics enum includes `PIX_GENERATED` and `PAYMENT_CONFIRMED`. | `.env.example`, schema | Artifacts of an earlier intent; **they do not constitute an approved payment architecture** and are not evidence that Mercado Pago will be used. |
| Public forms use a request model (`ContactSubmission`, tour request), not payment. | `app/actions/*` | A "request" path already exists as a pattern. |
| Rate limiting is in-memory per instance. | `lib/security/rate-limit.ts` | Not acceptable for search/order endpoints (RT-82). |
| Email via Resend; sender domain unverified. | RT-58/61/62 | Confirmation email depends on Sprint 5 work. |
| Analytics events are tour-specific; client payload carries `bookingId`/`paymentAttemptId`. | `lib/analytics/*` | Flight events need their own definitions (RT-66). |
| No flight code exists beyond decorative globe animation. | grep | Greenfield. |

## 3. Actors and responsibilities

| Actor | Responsibility (proposed; provider/legal items unresolved) |
| --- | --- |
| **Customer** | Chooses offer, supplies passenger data, pays, receives tickets. Accepts fare conditions and price changes explicitly. |
| **Rick Travel (platform)** | Presents offers, validates before commitment, owns the Order and its state machine, collects passenger data, orchestrates payment and provider calls, communicates with the customer, keeps audit trail, runs reconciliation and manual-review operations. **Whether Rick Travel is the seller of record or an agent is `LEGAL_REVIEW_REQUIRED`.** |
| **Rick Travel operator** | Resolves `MANUAL_REVIEW` orders, authorizes refunds/cancellations, contacts customers. |
| **Consolidator (Flytour/MaisFly)** | Intended source of offers, reservation and (possibly) issuance. **Exact role `EXTERNAL_DECISION_REQUIRED`**: search only? reserve? issue? who is the issuing agency/IATA entity? |
| **Airline** | Operates the flight; fare rules; ultimate ticket validity. |
| **Payment provider (PSP)** | Collects money, owns card/Pix data, notifies of payment status, performs refunds. **Which PSP, and whether it sits between Rick Travel and issuance, is `OWNER_DECISION_REQUIRED` + `EXTERNAL_DECISION_REQUIRED`.** |
| **Legal/finance** | Defines seller-of-record, refund/cancellation terms, settlement flow. `LEGAL_REVIEW_REQUIRED`. |

## 4. End-to-end commercial sequence

```
Customer          Rick Travel (server)                Provider (consolidator)        PSP
   │  Search criteria ─►│ validate, rate-limit                │                         │
   │                    │── search ─────────────────────────►│                         │
   │◄── Offers (normalized view) ──│◄── offers ──────────────│                         │
   │  Select offer ────►│ (Selected Offer; nothing committed) │                         │
   │                    │── revalidate (availability+price) ─►│                         │
   │◄── Validated / PRICE_CHANGED / UNAVAILABLE ──────────────│                         │
   │  Passenger data ──►│ create Order (idempotency key)      │                         │
   │                    │── create payment ──────────────────────────────────────────►│
   │◄── hosted payment (redirect/embedded; no card data to us) ───────────────────────►│
   │                    │◄── payment webhook (signed) ────────────────────────────────│
   │                    │── create reservation (PNR) ───────►│   (order of these two steps
   │                    │── issue ticket ───────────────────►│    is §9 / OWNER + EXTERNAL)
   │                    │◄── ticket numbers / async event ───│
   │◄── Confirmation (email + page) ──│                       │                         │
```

The order of **Payment / Reservation / Issuance** is *not fixed* by this document; three candidate orderings are analyzed in §9 and the choice depends on provider capabilities (`EXTERNAL_DECISION_REQUIRED`) and risk policy (`OWNER_DECISION_REQUIRED`). The state machine in §16 supports all three.

## 5. Flight-domain boundaries (the architectural decision)

### Decision: **Option A — Flight is its own domain aggregate; only shared infrastructure is reused.**

Option B (extend the current `Booking` domain) is **not selected**.

Reasons (all concrete, from the repository):

1. `Booking` is structurally a tour booking: required `tripId`, optional tour `scheduleId`, `guestCount`. A flight has no trip and no schedule. Making these nullable would weaken invariants for the working tour flow.
2. A flight order needs concepts `Booking` lacks: offer identity/expiry, named passengers with identity documents, PNR, ticket numbers, issuance state, price-change consent, provider references, cancellation/void windows.
3. `Booking` cascades on `Trip` and `User` deletion. Flight orders carry payment and fiscal/audit obligations that must survive user deletion (LEGAL_REVIEW_REQUIRED on retention). Reusing it would import a destructive delete behavior.
4. `PaymentAttempt` is bound to `Booking`; binding flights to it couples two unrelated lifecycles and would force tour changes to be re-tested against flight risk.
5. The state machines differ (flights have reserve/issue/void/refund and manual-review states; tours have PENDING/CONFIRMED/CANCELED).
6. Risk isolation: a defect in flight issuance must not be able to corrupt tour bookings, and vice versa.

**What is shared (infrastructure only, no shared aggregate):** authentication/session, Resend email delivery, analytics ingestion pipeline (with new flight event types, RT-66), the distributed rate limiter (RT-82), logging/observability (RT-64), env/secret management, and — *if the Owner chooses the same PSP* — a PSP adapter module. Shared pieces expose interfaces; neither aggregate reads the other's tables.

Conceptual aggregate map (names are conceptual, not a schema):

```
FlightSearch ──► FlightOffer ──► FlightOrder ──► Payment
                                      │
                                      ├──► ProviderReservation (PNR)
                                      ├──► TicketIssuance ──► Ticket(s)
                                      ├──► OrderEvent (append-only audit)
                                      └──► Passenger(s) (PII, segregated)
```

- `FlightSearch`/`FlightOffer` are **ephemeral** (server cache with TTL; not long-term records except minimal, PII-free analytics).
- `FlightOrder` is the **only durable root** and owns everything below it.
- The `Order` references provider objects by opaque reference; it never embeds provider raw payloads in browser-reachable fields.

## 6. Provider boundary

A single server-side **provider gateway** (anti-corruption layer) is the only code allowed to talk to the consolidator. Conceptual operations (each `IF_PROVIDER_SUPPORTED` / `EXTERNAL_DECISION_REQUIRED` as to whether it exists):

| Operation | Purpose |
| --- | --- |
| search | criteria → raw offers |
| revalidate | confirm availability and price for one offer |
| createReservation | create PNR for named passengers |
| issue | request ticket issuance |
| getOrderStatus | poll reservation/issuance state (fallback when no events) |
| cancel / void | cancel reservation or void ticket within window |
| refund (or request refund) | refund path if the provider performs it |
| report | settlement/reconciliation data |

Rules:

- The gateway **normalizes** provider data into Rick Travel's own `Offer view model` (see RT-37 §21) and error taxonomy (§21). Provider field names, codes and raw responses never cross into UI code.
- Capability flags per operation let the platform degrade (e.g. no revalidate → mandatory re-search/price warning; no hold → different payment ordering).
- Credentials are server-only (§15). Outbound calls have explicit timeouts (§21) and carry a correlation id.
- Provider-specific retries/idempotency behavior is encapsulated in the gateway (§17, §19).
- A **fake gateway** (in-process fixtures) is the *only* implementation allowed before RT-39; it must be visibly non-live in the UI (RT-37 §21).

## 7. Payment boundary

- Payment is performed by a PSP; **Rick Travel never receives, stores, logs or transmits card data** (§14).
- The PSP's confirmation arrives **server-to-server (signed webhook)**. The browser redirect/return page is **never** treated as proof of payment (§18).
- Rick Travel stores only PSP references (payment id, status, amount, currency, timestamps, event ids).
- Currency, amount and passenger count on the payment must equal those of the **Validated Offer**; mismatch → `MANUAL_REVIEW`.
- `OWNER_DECISION_REQUIRED`: which PSP; whether Mercado Pago is used; payment methods (card/Pix/other); installments; capture mode.
- `EXTERNAL_DECISION_REQUIRED` (PSP): authorize-then-capture availability, void-of-authorization, refund mechanics per method (notably Pix), webhook signature scheme, settlement timing.
- The existing Mercado Pago artifacts are **not** evidence of an approved architecture. The `.bak` payment service should not be revived without this document's approval.

## 8. Reservation / PNR boundary

- A reservation is created only from a **Validated Offer** and **complete passenger data** that satisfies the provider's validation rules (`EXTERNAL_DECISION_REQUIRED`: required fields, name rules, document rules, infant linkage).
- Reservation may be time-limited (ticketing deadline / hold expiry): existence and duration `EXTERNAL_DECISION_REQUIRED`. Whenever a hold exists, the Order stores its expiry and a timer drives `RESERVATION_EXPIRED` handling (§16, §21).
- Creating a reservation is **not safely retryable by blind repetition** (risk of duplicate PNR). Before any retry, the platform queries the provider for an existing reservation for this order (§17). If the provider offers no lookup/idempotency, retries after an ambiguous failure are **forbidden** and the order goes to `MANUAL_REVIEW` (`EXTERNAL_DECISION_REQUIRED`).
- Who creates the PNR: **unresolved** (Rick Travel through provider API, or the consolidator staff after a request). `EXTERNAL_DECISION_REQUIRED` + `OWNER_DECISION_REQUIRED`.

## 9. Ticket issuance boundary and payment ordering

Who issues: **`EXTERNAL_DECISION_REQUIRED` + `LEGAL_REVIEW_REQUIRED`** (consolidator as issuing agency? Rick Travel under its own accreditation? the airline?). Rick Travel's code must not state or imply an issuer in UI copy until resolved.

Synchronous vs asynchronous issuance: `EXTERNAL_DECISION_REQUIRED`. The design **must assume asynchronous is possible**: `ISSUANCE_PENDING` is a real, durable state; confirmation is sent only on `ISSUED`.

Candidate orderings (the chosen one is an Owner decision constrained by provider capability):

| Ordering | Flow | Strength | Risk |
| --- | --- | --- | --- |
| **O1 Reserve → Pay → Issue** | PNR held, customer pays within hold, then issue | Smallest "paid but nothing exists" window; price/availability locked before charge | Requires provider **hold** + known ticketing deadline; hold can expire during payment |
| **O2 Pay → Reserve+Issue** | Charge first, then create PNR and issue | Works with providers lacking hold | **Largest** exposure: money captured before availability is secured → refund-heavy failure mode |
| **O3 Request only** | Customer submits a request; staff/consolidator quotes, reserves, issues, collects payment out-of-band or via payment link | Lowest integration and liability risk; fits current "request" pattern | Not instant commerce; manual operations |

**Owner commercial target (2026-10-03):** the business target is SEARCH → SELECT → PAY → ISSUE. This is a *target*, **not permission to implement payment-before-reservation**; the exact reservation/payment/issuance ordering remains dependent on RT-39 provider capabilities (§30).

Technical (non-binding) observation: O1 minimizes the payment-success/issuance-failure case (§19) and is preferred **if** the provider supports holds. O3 is the safe fallback if provider documentation is unavailable or legal structure is unresolved. The commercial choice is `OWNER_DECISION_REQUIRED`.

## 10. Confirmation boundary

- Confirmation to the customer is sent **only** when the order is `ISSUED` and ticket references are stored. Payment success alone yields a "payment received, issuing your ticket" message, never "confirmed".
- Confirmation content (ticket numbers, itinerary, fare conditions, support contact) is derived from stored order data, not re-queried live.
- Delivery uses Resend (blocked on Sprint 5 email work); delivery failure must not block order state — failures are logged and retried; an on-site order page is the system of record.
- Idempotent: re-sending confirmation never re-triggers issuance.

## 11. Cancellation / void / refund boundary

All specifics `EXTERNAL_DECISION_REQUIRED` + `OWNER_DECISION_REQUIRED` + `LEGAL_REVIEW_REQUIRED`:

- **Voluntary cancellation by customer**: allowed when? penalty source (fare rules from provider).
- **Void**: provider/airline-defined same-day/time-window cancellation of an issued ticket without penalty — existence and window unknown.
- **Provider/airline-driven** cancellation or schedule change after issuance: how notified (event/report/manual), who contacts the customer.
- **Refund**: who executes (PSP refund by Rick Travel vs consolidator refund then pass-through), timing, partial refunds, fee retention, refund-to-original-method constraints (notably Pix).
- Rick Travel's rule (design): **no refund is executed without a corresponding order event and an authorized actor**; automated refund triggers exist only for pre-defined, Owner-approved cases (e.g. payment confirmed + issuance definitively failed + reservation released).
- The state machine contains `CANCEL_PENDING → CANCELLED → REFUND_PENDING → REFUNDED` and `MANUAL_REVIEW` escape hatches (§16).
- Customer-facing refund/cancellation terms belong in Terms (RT-81) and must match this policy once decided.

## 12. Fare validation and repricing behavior

- Prices in search results are **indicative**. Before any passenger data or payment, the platform **revalidates** the selected offer (`revalidate` capability `EXTERNAL_DECISION_REQUIRED`).
- Outcomes: `VALID` (continue), `PRICE_CHANGED` (new total differs), `UNAVAILABLE` (offer no longer purchasable), `REVALIDATION_FAILED` (timeout/provider error).
- **PRICE_CHANGED**: the customer must see old vs new total and **explicitly accept** before proceeding. No implicit acceptance, no auto-proceed. **Owner-approved (2026-10-03):** any *material* fare/price change after validation requires explicit customer acceptance before continuation; the updated amount is **never charged silently**. No auto-accept tolerance is defined; until the Owner defines what "material" means, **every** price change requires acceptance.
- A second revalidation occurs **immediately before payment creation** if the previous validation is older than a threshold derived from the offer validity window (`EXTERNAL_DECISION_REQUIRED`) so payment amount equals a freshly validated amount.
- If the provider cannot revalidate: the UI must say the price is not guaranteed and the order must not capture payment before a price-bearing reservation exists (forces O1 or O3).
- Currency changes are never silent. Display-currency conversion is out of scope unless the Owner decides otherwise.

## 13. Passenger data / PII boundary

- Passenger data (full names as on document, date of birth, nationality, document type/number/expiry, contact data, possibly gender, loyalty numbers) is **sensitive PII**.
- **Minimization:** collect only what the provider requires for reservation/issuance (`EXTERNAL_DECISION_REQUIRED` list). Nothing "for later".
- **Separation:** passenger documents are stored apart from general order data, encrypted at rest (field-level or equivalent), accessible only to the order service and authorized operators; access is logged.
- **Never in:** URLs, query strings, client logs, analytics payloads, browser storage, error messages, third-party scripts, the AI Concierge, or non-redacted server logs.
- **In browser:** data entered by the customer lives only in the form until submitted over HTTPS; after submission the UI shows masked values (e.g. last 3 characters of a document).
- **Retention/deletion:** conflicts between deletion rights (LGPD) and fiscal/financial/airline retention obligations are `LEGAL_REVIEW_REQUIRED`. The order record must not cascade-delete with a user (§5).
- **Minors/infants:** guardian and document rules per provider (`EXTERNAL_DECISION_REQUIRED`); legal consent for minors' data `LEGAL_REVIEW_REQUIRED`.
- Privacy page (RT-80) must reflect this before launch.

## 14. PCI / payment-data boundary

- Target: **no cardholder data ever touches Rick Travel infrastructure** — hosted payment page, redirect, or PSP-provided fields (iframe/tokenization). This keeps Rick Travel in the lowest PCI scope (self-assessment for fully outsourced card entry); the exact SAQ type is `LEGAL_REVIEW_REQUIRED` with the chosen PSP.
- Pix or other non-card methods carry no PAN but still carry payer identity data from the PSP: treat as PII.
- Stored: PSP payment id, status, amount, currency, method category, timestamps, event ids. **Not stored:** PAN, CVV, full card tokens beyond what the PSP documents as safe to keep, raw PSP payloads containing payer PII (store a redacted subset).
- Logs and error reports are scrubbed of payment payloads.
- Webhook endpoints are public: authenticated by PSP signature (§18), never by obscurity.

## 15. Credential / security boundary

- All provider and PSP credentials are **server-only** environment secrets (Vercel env), separate per environment (sandbox vs production), never prefixed for client exposure, never in repo, logs, analytics, error messages or the browser bundle.
- Only the provider gateway module and the PSP adapter read these secrets.
- Rotation procedure and ownership documented before production use.
- Browser-facing API surface for flights is **our own**: search, select/validate, create order, order status. It exposes no provider ids beyond opaque, signed, short-lived offer handles and no commission/net-fare/markup data.
- Rate limiting (distributed, RT-82) and bot protection on search and order creation; abusive search volume can incur provider cost or throttling (`EXTERNAL_DECISION_REQUIRED`: provider rate limits/costs).
- Authorization: an order is accessible only to its owner (account) or to a signed guest token — **guest checkout must be supported** (Owner direction, §30), so the guest-token path is required, not optional — never by guessable id.

**Never reaches the browser:** provider credentials/tokens; raw provider responses; commissions, net fares, markup logic; internal provider/PNR secrets beyond what the customer needs; other customers' data; full passenger documents after submission; PSP secrets; webhook secrets.

## 16. State machine

Conceptual states of a **FlightOrder** (names adjustable):

| State | Meaning |
| --- | --- |
| `SEARCHED` | (pre-order) criteria submitted; offers shown. Ephemeral; no durable order yet. |
| `OFFER_SELECTED` | Customer selected an offer. Nothing committed anywhere. |
| `REVALIDATING` | Provider revalidation in progress. |
| `PRICE_CHANGED` | Revalidation returned a different price; awaiting explicit customer decision. |
| `PASSENGER_DATA_PENDING` | Validated offer; collecting/validating passenger data. Order record created here. |
| `PAYMENT_PENDING` | Payment created at PSP; awaiting confirmation. |
| `PAYMENT_CONFIRMED` | PSP confirmed funds (per capture mode). |
| `RESERVATION_PENDING` | PNR creation requested. |
| `RESERVED` | PNR exists (hold expiry stored if any). |
| `ISSUANCE_PENDING` | Issuance requested (may be asynchronous). |
| `ISSUED` | Ticket(s) issued and stored. Terminal-success. |
| `ISSUANCE_FAILED` | Issuance definitively failed or timed out beyond policy. |
| `CANCEL_PENDING` | Cancellation/void requested. |
| `CANCELLED` | Reservation/ticket cancelled/voided. |
| `REFUND_PENDING` | Refund initiated. |
| `REFUNDED` | Refund completed. Terminal. |
| `MANUAL_REVIEW` | Ambiguous or unsafe state needing a human (any state can enter). |
| `EXPIRED` / `ABANDONED` | Offer, hold or payment window elapsed without completion (added: required by holds and abandoned checkouts). |
| `UNAVAILABLE` | Revalidation or reservation found the offer no longer purchasable (added). |
| `RESERVATION_EXPIRED` | Hold lapsed before payment/issuance (added; relevant to O1). |

Allowed transitions (summary; every transition appends an `OrderEvent`):

```
SEARCHED → OFFER_SELECTED → REVALIDATING → { PASSENGER_DATA_PENDING | PRICE_CHANGED | UNAVAILABLE | MANUAL_REVIEW }
PRICE_CHANGED → { PASSENGER_DATA_PENDING (explicit accept) | ABANDONED }
PASSENGER_DATA_PENDING → { PAYMENT_PENDING (O2/O3-link) | RESERVATION_PENDING (O1) | ABANDONED }
-- O1 (Reserve→Pay→Issue):
RESERVATION_PENDING → RESERVED → PAYMENT_PENDING → PAYMENT_CONFIRMED → ISSUANCE_PENDING → ISSUED
RESERVED → RESERVATION_EXPIRED
-- O2 (Pay→Reserve+Issue):
PAYMENT_PENDING → PAYMENT_CONFIRMED → RESERVATION_PENDING → RESERVED → ISSUANCE_PENDING → ISSUED
-- failures:
PAYMENT_PENDING → { PAYMENT_CONFIRMED | ABANDONED | MANUAL_REVIEW }
RESERVATION_PENDING → { RESERVED | UNAVAILABLE | MANUAL_REVIEW }
ISSUANCE_PENDING → { ISSUED | ISSUANCE_FAILED | MANUAL_REVIEW }
ISSUANCE_FAILED → { ISSUANCE_PENDING (safe retry) | MANUAL_REVIEW | REFUND_PENDING | CANCEL_PENDING }
ISSUED → CANCEL_PENDING → CANCELLED → REFUND_PENDING → REFUNDED
any state with ambiguity → MANUAL_REVIEW → (operator) → any legal state with an audited reason
```

Invariants:

1. `ISSUED` ⇒ a stored payment in a confirmed state (or an approved off-platform payment record, O3) **and** stored ticket references.
2. No transition without an appended `OrderEvent` (who/what/when/why, correlation id).
3. A state may be entered at most once per idempotency key (§17).
4. `PAYMENT_CONFIRMED` without `ISSUED` older than the policy window is always visible on an operator queue (§22).
5. States are monotonic except the explicit retry/manual transitions above.

## 17. Idempotency strategy

| Step | Key | Rule |
| --- | --- | --- |
| Create order | client-generated order-attempt id (uuid) per checkout attempt | Resubmission returns the same order, never a second. |
| Revalidate | `offer handle + order id` | Safe to repeat (read-like); result timestamped. |
| Create payment | `order id + payment attempt number` | One active payment per order; PSP idempotency key passed if the PSP supports it (`EXTERNAL_DECISION_REQUIRED`). |
| Webhook events | PSP `eventId` (+ payment id) | Stored; reprocessing is a no-op. |
| Create reservation | `order id` | **Query-before-retry**: look up existing PNR for this order before any re-attempt. If the provider has no lookup and no idempotency key, ambiguous failures go to `MANUAL_REVIEW`, not retry. |
| Issue | `order id + reservation ref` | Same rule; double issuance is a financial loss. |
| Confirmation email | `order id + template + version` | One logical send; re-send explicit. |
| Cancel/void/refund | `order id + action id` | Refund is never retried blindly; check PSP/provider status first. |

Every outbound provider/PSP call stores the request fingerprint and outcome in the order's event log so ambiguity can be resolved by inspection.

## 18. Webhook / event strategy

- **PSP webhook**: public endpoint; verify signature with a server-only secret; reject on failure; check timestamp/replay window; deduplicate on event id; **acknowledge quickly** and process asynchronously (queue/worker or equivalent) to avoid PSP retry storms; unknown/out-of-order events are stored and reconciled, not applied blindly.
- **Never** treat a redirect/return URL, a client call or a front-end "success" as payment proof.
- **Provider events**: whether Flytour/MaisFly can push events (reservation/issuance/cancellation/schedule change) is `EXTERNAL_DECISION_REQUIRED`. If not, the platform **polls** `getOrderStatus` for orders in `RESERVATION_PENDING`, `ISSUANCE_PENDING`, `CANCEL_PENDING` on a bounded schedule with backoff, and reconciliation (§20) is the safety net.
- Event handlers are state-machine aware: an event that does not match an allowed transition is recorded and sent to `MANUAL_REVIEW` if it indicates divergence (e.g. payment refunded at PSP for an ISSUED order).
- Webhook payloads are stored redacted (§14) and linked to the order via correlation ids.

## 19. Retry strategy

| Operation | Safe to retry? | Policy |
| --- | --- | --- |
| Search | Yes (read) | Bounded retries with jitter, then user-visible error. |
| Revalidate | Yes (read-like) | Bounded; stale results discarded. |
| Create payment | Only with idempotency key / existing attempt check | Never create a second live payment for the same order. |
| Webhook processing | Yes (idempotent by event id) | Retry until applied or dead-lettered to `MANUAL_REVIEW`. |
| Create reservation | **No blind retry** | Query-before-retry (§17); otherwise `MANUAL_REVIEW`. |
| Issue | **No blind retry** | Same; bounded automatic retry only where the provider documents idempotent issuance (`EXTERNAL_DECISION_REQUIRED`). |
| Cancel/void | Conditional | Check current state first. |
| Refund | **No blind retry** | Check PSP status; single in-flight refund per order. |
| Confirmation email | Yes | Backoff; failure does not change order state. |

Retry budgets, backoff curves and windows are set after provider SLAs are known (`EXTERNAL_DECISION_REQUIRED`); this document fixes the **rules**, not the numbers.

## 20. Reconciliation strategy

- A scheduled reconciliation job compares three sources per order: **PSP payment status**, **provider reservation/ticket status**, **Rick Travel order state**.
- Discrepancy classes (each creates an operator task and an `OrderEvent`): (a) paid, no reservation; (b) paid, reserved, not issued; (c) issued, payment not confirmed or refunded; (d) reservation exists with no order/payment (orphan PNR → possible cost/penalty); (e) duplicate PNR/ticket for one order; (f) refund at PSP without order cancellation; (g) provider-side cancellation/schedule change not reflected.
- Inputs: PSP reports/APIs and provider reports/APIs (`EXTERNAL_DECISION_REQUIRED`: availability, format, latency, settlement reports).
- Cadence: frequent for open/pending orders; periodic end-to-end for closed ones; a **daily summary** reviewed by an operator until trust is established.
- Reconciliation never auto-repairs money movements; it raises tasks. Auto-repair is allowed only for Owner-approved, reversible cases.
- Orphan reservations and expiring holds are tracked to avoid unintended airline penalties/debit memos (`EXTERNAL_DECISION_REQUIRED` on exposure).

## 21. Timeout and failure behavior

Error taxonomy (shared with RT-37 UX states; browser sees only these, never provider codes):

| Class | Meaning |
| --- | --- |
| `VALIDATION_ERROR` | Customer input invalid (caught before provider call where possible). |
| `NO_RESULTS` | Valid search, no offers. Not an error. |
| `PROVIDER_TIMEOUT` | Provider did not answer within budget. |
| `PROVIDER_UNAVAILABLE` | Provider error/5xx/maintenance. |
| `PROVIDER_RATE_LIMITED` | Throttled. |
| `PROVIDER_REJECTED` | Provider refused the request (e.g. invalid passenger data) — mapped to a safe message. |
| `OFFER_STALE` / `OFFER_UNAVAILABLE` | Validity elapsed or sold out. |
| `PRICE_CHANGED` | See §12. |
| `PAYMENT_FAILED` / `PAYMENT_ABANDONED` | PSP-side failure/abandon. |
| `NETWORK_ERROR` | Client could not reach Rick Travel. |
| `INTERNAL_ERROR` | Our fault; logged with correlation id. |

Rules:

- Every outbound call has a **timeout budget** shorter than the platform function limit, with values set from provider SLAs (`EXTERNAL_DECISION_REQUIRED`); no unbounded waits.
- **Timeout after a state-changing call is ambiguous** (the provider may have acted). It is never treated as failure: the order stays in its pending state, a status query runs, and unresolved ambiguity → `MANUAL_REVIEW`.
- Search/revalidate timeouts are recoverable by the customer (retry, change criteria); the UI must say so.
- Degraded mode: if the provider is down, the Flight Planner shows a clear unavailable state with a human/WhatsApp **request fallback** (existing contact channels). A clearly labeled human-request fallback is **approved conceptually** (§30); it must never present mock or stale data as live availability.
- The customer is never shown "success" for an unconfirmed step; pending states use neutral language.
- Customer-visible errors never expose provider codes, stack traces or secrets.

## 22. Observability and audit trail

- **Append-only `OrderEvent` log** per order: timestamp, actor (customer/system/operator), from→to state, reason, correlation id, redacted request/response fingerprint, provider/PSP references. No updates, no deletes; survives user deletion (retention `LEGAL_REVIEW_REQUIRED`).
- **Correlation id** generated at search, carried through order, PSP, provider calls and logs.
- **Metrics:** search latency/error rate per provider, revalidation outcomes (valid/changed/unavailable), conversion funnel by state, payment-to-issuance time, issuance failure rate, `MANUAL_REVIEW` count and age, orders in pending states beyond SLA, webhook failures/duplicates, reconciliation discrepancies by class.
- **Alerts:** any `PAYMENT_CONFIRMED` order not `ISSUED` beyond the policy window; `ISSUANCE_FAILED`; reconciliation discrepancy; webhook signature failures spike; provider error-rate threshold; refund pending too long.
- **Operator queue:** a defined view of `MANUAL_REVIEW`, stuck-pending and discrepancy tasks, with who/when for each action (audit).
- Logs are PII- and payment-scrubbed (§13/§14). Dashboards tie into RT-64 (baseline) and RT-84 (final review); flight analytics events are RT-66.

## 23. Special failure case — payment succeeds, ticket issuance fails

| Aspect | Analysis |
| --- | --- |
| **System state** | Order is `PAYMENT_CONFIRMED` (or `RESERVED`) then `ISSUANCE_PENDING` → `ISSUANCE_FAILED` (definitive) or remains pending beyond policy → `MANUAL_REVIEW`. The customer has paid and holds no ticket. This is a **P1 operational incident class**. |
| **First action** | Classify: *definitive failure* (provider explicitly refused/unavailable, known error class) vs *ambiguous* (timeout, no answer). Ambiguous ⇒ query status first; never re-issue blindly (duplicate-ticket risk). |
| **Retry behavior** | Automatic bounded retry **only** where the provider documents idempotent issuance or a reliable status lookup (`EXTERNAL_DECISION_REQUIRED`). Otherwise no automatic re-issue; go to `MANUAL_REVIEW`. |
| **Reservation hold** | If a PNR exists, its expiry bounds the time to resolve; the order stores it and alerts before expiry. If the hold lapses, the order moves to `RESERVATION_EXPIRED` and re-pricing/availability may differ (price-change consent required again). |
| **Reconciliation** | Class (b) in §20 ("paid, reserved, not issued"): detected within the reconciliation cadence even if events/alerts failed. |
| **Funds** | Whether funds remain captured depends on PSP capture mode and method: authorize-then-capture allows voiding an authorization before capture; immediate capture (and Pix) requires a refund. `EXTERNAL_DECISION_REQUIRED` (PSP) + `OWNER_DECISION_REQUIRED` (capture policy). **Default safe rule:** funds are not released or re-captured automatically; any refund requires an order event and an authorized trigger. |
| **Manual intervention** | An operator reviews the order, the provider status and the PSP status; chooses: (1) retry issuance, (2) re-reserve on an alternative offer with customer consent, (3) cancel and refund. Each choice is an audited `OrderEvent` with reason. |
| **Customer communication** | Prompt, neutral, honest messages: (a) "payment received, issuing your ticket" (pending), (b) "we could not issue yet, we are working on it" with a human contact and a stated next-update time (time to be set by Owner), (c) outcome: issued, alternative offered, or refund initiated with expected timeline from PSP/provider. Never imply issuance before `ISSUED`. Wording is Owner/legal-approved. |
| **Refund / void path** | `ISSUANCE_FAILED → REFUND_PENDING → REFUNDED` (or void of authorization). Refund timing and fees: `OWNER_DECISION_REQUIRED` + PSP/provider rules. If a PNR exists it must be cancelled/released first to avoid airline penalties. |
| **Audit requirements** | Full `OrderEvent` trail from payment confirmation to resolution, actor and reason on every manual action, retained under the legal retention rule; incident recorded for post-mortem. |
| **Provider responsibility** | `EXTERNAL_DECISION_REQUIRED`: does the consolidator guarantee issuance after a confirmed reservation? what compensation/obligations apply for provider-side failure? SLA and escalation contacts. |
| **Rick Travel responsibility** | Orchestration, customer communication, refund initiation per policy, monitoring and reconciliation, avoiding duplicate issuance, protecting the customer from silent loss. Legal liability allocation `LEGAL_REVIEW_REQUIRED`. |
| **Prevention** | Prefer ordering O1 if the provider supports holds (§9); revalidate immediately before payment; do not capture payment if the provider cannot confirm availability. |

No commercial policy is chosen here; the choices above that need approval are in §24.

## 24. OWNER_DECISION_REQUIRED items

Status after the Owner review of 2026-10-03 (details in §30):

| # | Item | Status |
| --- | --- | --- |
| 1 | Commercial model: online purchase (O1/O2) vs request-only (O3) | **Partly decided:** business target SEARCH → SELECT → PAY → ISSUE; exact ordering depends on RT-39. Request-only remains the fallback path. |
| 2 | Payment provider, methods, installments, capture mode | **OPEN.** PSP remains `OWNER_DECISION_REQUIRED`; Mercado Pago is **not** selected because legacy variables exist. |
| 3 | Payment-before-issuance exposure the business accepts | **OPEN** (depends on RT-39 provider capability). |
| 4 | Refund and cancellation policy, who absorbs issuance-failure costs | **OPEN** (pending RT-39/provider evidence and legal). |
| 5 | Price-change tolerance | **DECIDED:** any material change requires explicit customer acceptance; never silently charged. Definition of "material" open; interim rule: any change. |
| 6 | Guest checkout vs mandatory account | **DECIDED (direction):** guest checkout must be supported; no account required solely to buy/request a flight unless a future legal/provider constraint requires it. |
| 7 | Seller-of-record presentation | **OPEN.** |
| 8 | Request-only fallback when the provider is unavailable | **DECIDED conceptually:** a clearly labeled human-request fallback is allowed; mock availability is never shown as live. |
| 9 | Customer-communication SLAs for incidents | **OPEN.** |
| 10 | Markup/commission display policy and currency policy | **OPEN** (markup, currency/conversion). |
| 11 | Operations ownership: manual-review staffing and hours | **OPEN.** |

## 25. Legal / compliance questions (`LEGAL_REVIEW_REQUIRED`)

- Rick Travel's legal status for selling air tickets (agency accreditation, partnership structure with the consolidator, seller of record, issuing entity).
- Consumer-protection obligations (right of withdrawal/regret rules for air tickets, mandatory disclosures, price transparency, change/cancel/refund rules) and what must appear before purchase.
- LGPD: lawful basis, notices, retention vs fiscal/airline retention, international transfer of passenger data to the provider/airlines, minors' data.
- PCI scope confirmation with the chosen PSP.
- Fiscal documents/invoicing for ticket sales and commissions.
- Liability allocation between Rick Travel, consolidator, airline and PSP for failed issuance, schedule changes and refunds.
- Terms and Privacy content (RT-80/RT-81) derived from these answers.

## 26. Failure matrix

| # | Step | Failure | Detection | System action | Customer sees | Recovery / owner |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Search | Provider timeout/5xx | gateway timeout | bounded retry, then `PROVIDER_TIMEOUT/UNAVAILABLE` | "couldn't search now" + retry + contact fallback | automatic/customer |
| 2 | Search | Rate limited | provider 429 equivalent | backoff; throttle ours | retry later | ops tune limits |
| 3 | Select | Offer stale | handle expired | `OFFER_STALE` | "this fare is no longer available", criteria preserved | customer re-searches |
| 4 | Revalidate | Price changed | revalidate result | `PRICE_CHANGED`, require consent | old vs new total, accept/decline | customer |
| 5 | Revalidate | Unavailable | revalidate result | `UNAVAILABLE` | message + similar results | customer |
| 6 | Revalidate | Timeout | gateway | no commitment; retry/stop | retry or contact | customer |
| 7 | Passenger data | Provider rejects data | provider validation error | stay `PASSENGER_DATA_PENDING`, mapped message | field-level guidance | customer |
| 8 | Payment | PSP declines | webhook/status | `PAYMENT_FAILED`; order stays pending/abandons | retry or change method | customer |
| 9 | Payment | Customer abandons | timer | `ABANDONED`; release hold if any | none/notice | automatic |
| 10 | Payment | Webhook lost/delayed | reconciliation + status poll at PSP | converge via poll/reconcile | "confirming your payment" | automatic |
| 11 | Payment | Duplicate webhook | event id seen | no-op | none | automatic |
| 12 | Payment | Amount/currency mismatch | compare to validated offer | `MANUAL_REVIEW`; do not reserve/issue | "we are verifying your payment" | operator |
| 13 | Reservation | Unavailable after payment (O2) | provider | `UNAVAILABLE` → refund path | apology + refund timeline | operator + policy |
| 14 | Reservation | Timeout (ambiguous) | gateway | status query; else `MANUAL_REVIEW`; **no blind retry** | pending message | operator |
| 15 | Reservation | Hold expires (O1) | timer | `RESERVATION_EXPIRED`; re-offer/refund | "hold expired, reprice?" | customer/operator |
| 16 | Issuance | Definitive failure | provider response | `ISSUANCE_FAILED` (§23) | honest status + contact | operator |
| 17 | Issuance | Timeout (ambiguous) | gateway | status query; else `MANUAL_REVIEW` | pending message | operator |
| 18 | Issuance | Duplicate ticket detected | reconciliation | `MANUAL_REVIEW`; void duplicate | none/notice | operator |
| 19 | Confirmation | Email fails | Resend status | retry; order page is truth | order page shows tickets | automatic |
| 20 | Cancel/void | Provider refuses | provider response | stay state; `MANUAL_REVIEW` | explanation + contact | operator |
| 21 | Refund | PSP refund fails | PSP status | `MANUAL_REVIEW`; retry only after status check | refund delayed notice | operator/finance |
| 22 | Post-issue | Airline schedule change/cancel | event/report/manual | audited event; notify | proactive message | operator |
| 23 | Any | Our server error | exception | log with correlation id; state unchanged or `MANUAL_REVIEW` | generic error + reference id | engineering |
| 24 | Any | Provider credentials invalid/expired | auth error | alert; disable purchase path; show unavailable | degraded/fallback | engineering |

## 27. RT-39 provider question list (Flytour/MaisFly)

Provider-facing technical and commercial checklist. Each answer is recorded in RT-39 with date and source document; unanswered items remain `EXTERNAL_DECISION_REQUIRED`.

1. **Authentication method** (API key, OAuth, mutual TLS, IP allowlist?); credential issuance and rotation process.
2. **Environments/sandbox**: separate sandbox? test data, test credentials, parity with production, availability windows.
3. **Search endpoint**: criteria supported (one-way, round-trip, multi-city, flexible dates, direct-only), response size, pagination, language of text.
4. **Offer identifiers and validity**: offer id format, validity duration, whether re-search is required after expiry.
5. **Fare revalidation / repricing**: dedicated endpoint? price-change semantics and tolerances.
6. **Booking / PNR creation**: endpoint, required passenger fields, name/document rules, infant linkage, seat/ancillary options (out of scope for v1?).
7. **Issuance**: separate call or automatic; who is the issuing entity; ticketing time limit.
8. **Asynchronous issuance**: possible? status values, typical latency, maximum duration.
9. **Webhook/event support**: which events (reservation, issuance, cancellation, schedule change)? delivery guarantees, retry behavior.
10. **Signature verification**: scheme for events, replay protection.
11. **Idempotency support**: idempotency keys for create/issue? lookup of existing reservation by our reference?
12. **Cancellation**: rules, windows, penalty source, API.
13. **Void**: availability, window, API.
14. **Refunds**: who executes, API or manual, timelines, partial refunds, fees; flow of funds.
15. **Ticketing deadlines**: hold duration per fare, consequences of lapse (penalties/debit memos).
16. **Baggage data**: structure and reliability of included allowance per segment/passenger.
17. **Fare-rule data**: structured change/refund conditions or free text; language.
18. **Cabin classes**: supported values and mapping; mixed-cabin itineraries.
19. **Passenger/infant rules**: age bands, max passengers per search/order, infant/child rules, unaccompanied minors.
20. **Rate limits**: per second/day, per credential; cost per search; look-to-book expectations.
21. **Timeout expectations**: typical and maximum latency per operation; recommended client timeouts.
22. **Retry guidance**: which calls are safe to retry; duplicate-protection behavior.
23. **Provider error codes**: catalog, retryability flags, mapping guidance.
24. **Reconciliation/reporting**: reports/APIs for reservations, tickets, voids, refunds, settlements; format and cadence.
25. **Settlement/payment relationship**: how Rick Travel pays the consolidator (prepaid balance, invoice, per-transaction), timing, currency, commissions/markup model.
26. **Legal issuing entity**: who is on the ticket as issuer; accreditation requirements for Rick Travel.
27. **PCI responsibilities**: does the provider ever require card data from Rick Travel? (target: never); payment-form-of-payment on issuance.
28. **Whether Mercado Pago or another PSP can sit between Rick Travel and issuance**: is the customer's payment to Rick Travel (PSP) independent of how Rick Travel pays the consolidator?
29. **Whether production domain approval is required** (allowlisted domains/IPs/callback URLs, contractual domain verification). Not assumed.
30. **SLAs/support**: escalation contacts for issuance incidents, uptime commitments, maintenance windows.
31. **Data handling**: passenger data retention/transfer on the provider side, data-processing terms.
32. **Production onboarding**: certification/test scenarios required before go-live, commercial agreement prerequisites.

### 27a. Product-family questions (added 2026-10-03, Owner correction — RT-37 §29)

Distribution family is Flights / Hotels / Flight + Hotel. These extend 1–32 and are likewise `EXTERNAL_DECISION_REQUIRED` until answered with date and source. **Do not assume API access merely because a widget exists.**

33. Does the provider offer **Flights**?
34. Does the provider offer **Hotels**?
35. Does the provider offer **Flight + Hotel packages**?
36. For each of the three: available through **widget only, API only, or both**?
37. Is the **same API** used for all three products?
38. Does **checkout remain inside the provider platform**, or can Rick Travel own the UI?
39. Can Rick Travel **control the search/results UI**?
40. Can Rick Travel **control the checkout UI**?
41. **Who handles payment**?
42. **Who creates the reservation**?
43. **Who issues flight tickets**?
44. **Who confirms hotel bookings**?
45. Are package transactions **atomic**, or composed from separate flight and hotel reservations?
46. Does the provider support **white-label branding**?
47. Are **redirect / iframe / script / widget** integrations required?
48. Are **production domain approval and certification** required? (Complements Q29 and Q32.)

## 28. Explicit dependencies

**RT-40 (map API and secure integration layer) may start only when:**

1. This document is **approved by the Owner**.
2. RT-39 delivered provider documentation and sandbox credentials (`EXTERNAL_DECISION_REQUIRED` answers for at least Q1–Q11, Q21–Q23).
3. OWNER decisions 1–3 (§24) taken: commercial model, PSP direction, payment ordering.
4. Environment contract for secrets exists (RT-60) at least for non-production environments.

**RT-41 (integrate search, results, loading, errors) may start only when:**

1. RT-40 is complete (gateway, error taxonomy, timeouts, secrets handling reviewed).
2. RT-37 UX contract and RT-38 mock UI are approved/complete.
3. Distributed rate limiting for search exists or is explicitly accepted as a launch-blocking item for production exposure (RT-82; in-memory limiter is not acceptable for real provider traffic).
4. Search and revalidation scope is confirmed; order/payment/issuance work is **not** part of RT-41 and needs separate tickets after decisions 1–4 (§24) — see recommendation below.

**Recommended new tickets (not created here):** Flight order domain & state machine implementation; PSP adapter + webhook; reservation/issuance orchestration; reconciliation & operator tooling; passenger-data and payment UX (follows RT-37). They are sequenced after the Owner decisions above and are outside RT-40/RT-41.

**No dependency on domain/DNS** unless RT-39 Q29 shows the provider requires it.

## 29. Consistency with RT-37

- Terminology: §0 is mirrored in RT-37 §0; RT-37 uses *Offer*, *Selected Offer*, *Validated Offer*, *Order* and never *booking* for flights.
- RT-37 error and timeout states map 1:1 to the taxonomy in §21.
- RT-37's price/fare disclosure and selection/revalidation wording follow §12.
- Provider-dependent fields appear in RT-37 only as `IF_PROVIDER_SUPPORTED` and are resolved by RT-39 answers.
- The browser-facing `Offer view model` (RT-37 §21) is Rick Travel's contract; the provider gateway (§6) maps into it.

## 30. Owner approval and decisions (2026-10-03)

**RT-65: APPROVED.** The architecture in this document is authoritative.

### 30.1 Approved architecture (unchanged by review)

- **Flight is a separate commercial/domain aggregate.** The existing tour `Booking` model is **not** extended. FlightOrder and its reservation/issuance/payment lifecycle are independent from tour Booking.
- Shared infrastructure may be reused where appropriate: authentication, email, analytics, observability, distributed rate limiting, optional PSP adapter infrastructure.
- Retained decisions: server-only provider gateway; signed PSP webhook as payment authority; no card-data handling by Rick Travel; no blind retry of reservation/issuance; explicit `MANUAL_REVIEW` state; reconciliation and audit trail; the payment-success / issuance-failure treatment (§23); no automatic refund without an authorized policy.

### 30.2 Product decisions recorded

| Id | Decision |
| --- | --- |
| A | **Commercial target:** SEARCH → SELECT → PAY → ISSUE. A business target, **not** permission to implement payment-before-reservation. Reservation/payment/issuance ordering depends on RT-39 provider capabilities. |
| B | **PSP:** `OWNER_DECISION_REQUIRED`. Do not select Mercado Pago because legacy environment variables exist. |
| C | **Price change:** any material fare/price change after validation requires explicit customer acceptance before continuation. Never silently charge the updated amount. |
| D | **Checkout account:** guest checkout must be supported. Account creation must not be required solely to purchase/request a flight unless a future legal/provider constraint requires it. |
| E | **Provider-down fallback:** approved conceptually — a clearly labeled human-request fallback may be exposed when live search/purchase is unavailable. Mock availability is never displayed as live. |
| F | **Still open, pending RT-39/provider evidence:** exact PSP; authorization vs capture strategy; reservation/payment ordering; seller-of-record presentation; issuance-failure liability; cancellation/refund responsibility; markup policy; currency/conversion policy; incident communication SLA; manual-review staffing and operating hours. |

### 30.3 Consequences recorded in the architecture

- Guest checkout makes the signed guest-token access path (§15) mandatory.
- The passenger/PII boundary (§13) applies equally to guest orders; guest orders still require retention, access and deletion rules (`LEGAL_REVIEW_REQUIRED`).
- Payment-before-reservation (O2) is **not authorized**; O1/O2/O3 remain analysis only until RT-39.
- Follow-up backlog derived from this document (Jira, Sprint 6, **backlog only — not started**):
  - `RT-RB-C-03` / RT-85 — Flight Order domain model + state machine
  - `RT-RB-C-04` / RT-86 — PSP adapter + payment webhook contract (provider-neutral; no PSP chosen)
  - `RT-RB-C-05` / RT-87 — Provider reservation + issuance orchestration (**blocked by RT-39**)
  - `RT-RB-C-06` / RT-88 — Reconciliation + operator / manual-review tooling
  - `RT-RB-C-07` / RT-89 — Passenger + checkout UX (guest checkout supported)
