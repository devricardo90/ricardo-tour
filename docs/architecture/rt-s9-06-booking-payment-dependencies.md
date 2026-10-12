# RT-102 — Future booking and payment dependencies for the commercial catalog (RT-RB-S9-06)

- Jira: RT-102. Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), section 5 (Sprints 9, 11 and 13).
- Date: 2026-10-12. Documentation only: no payment code, no provider choice, no contract, no integration.
- Inputs: `docs/architecture/rt-s9-02-catalog-audit.md` (RT-98), `docs/architecture/rt-s9-03-own-partner-model.md` (RT-99), `docs/architecture/rt-65-flight-commercial-architecture.md` (Owner-approved 2026-10-03).
- No price, margin, commission, tariff or availability value appears here.

## 1. Correction to a planning assumption (read first)

Volume II, Sprint 13 says Payment Readiness reuses "RT-85 (order model and state machine), RT-86 (neutral PSP adapter), RT-89 (checkout) and RT-90 (security review) … adapted to tours". Checked against the Jira tickets and the approved RT-65:

| Ticket | Scope as written | Reusable for tours? |
|---|---|---|
| RT-85 | **Flight** Order aggregate, "independent from tour `Booking`", "do not extend `Booking`" (Jira RT-85 text; RT-65 §5, §30.1 say the tour `Booking` model "is not extended") | **No.** It is the flight domain. Only its *patterns* (append-only event log, idempotency keys, no cascade deletion of financial records) apply. |
| RT-86 | Provider-neutral PSP adapter + signed webhook contract; "works for any PSP that meets the stated requirements" | **Yes, as shared infrastructure** (RT-65 §5: "if the Owner chooses the same PSP — a PSP adapter module"). |
| RT-89 | Passenger + checkout UX for **flights** | **No** as written; a tour checkout contract is a new, separate piece of work. |
| RT-90 | Flight security architecture review (blocks RT-86/RT-87 production use) | **Partly**: its control list (webhook signature/replay, idempotency, PII, log redaction, secrets) must be extended to cover the tour payment path. |

Consequence: Sprint 13 needs its own tour-payment tickets. The Owner confirmed this correction on 2026-10-12, and it is recorded in the Jira goal of Sprint 13 (sprint id 175), which supersedes the reuse sentence in Volume II section 5 for planning purposes. Nothing in Sprint 9 depends on it.

## 2. What exists today for tours (RT-98, verified)

- `Booking` is tour-bound: required `tripId`, optional `scheduleId`, `guestCount`, `totalPriceCents` (snapshotted server-side at creation, `lib/services/booking.service.ts:247, 286, 295`); `status` `PENDING | CONFIRMED | CANCELED`; `paymentStatus` `UNPAID | PAID | REFUNDED | PARTIAL` (`prisma/schema.prisma:109-131, 224-240`).
- `PaymentAttempt` is a child of `Booking` (cascade), with free-string `provider`, `amountCents`, `currency` default `BRL` (`schema.prisma:133-152`). No active payment service or webhook route exists (RT-65 §2).
- Public conversion is a **manual pre-booking / contact request**, not online payment (`app/actions/tour-request.ts`; `docs/ops/status.md`, RT-FINAL-04B).
- `Booking.trip` and `Booking.user` cascade on delete (RT-65 §2). For tours this is acceptable today only because no payment is collected; it becomes a problem the moment real payments exist.

## 3. Dependency map

Each row: what the **Sprint 9 catalog model must reserve now**, which sprint implements the dependent work, and the Owner decision needed. "Reserve" means leave room in the design (a nullable field, a separate table, an enum that can grow) — not implement.

| # | Dependency | Sprint 9 model must reserve | Implemented in | Owner decision / external input |
|---|---|---|---|---|
| D1 | **Operation type per booking** (OWN vs PARTNER) | `Trip.operationType` (nullable) so a booking can derive it from its trip; do not copy it onto `Booking` yet | S11 | none for the field; classification of the 4 public tours (RT-99 Q1) |
| D2 | **Partner confirmation state** (a partner-operated booking is not confirmed until the partner confirms) | Nothing in `Booking` yet. Record the need; the current enum cannot express "awaiting partner" | S11 (additive enum value or separate field, decided there) | Who confirms and through which channel (RT-99 Q5) |
| D3 | **Price snapshot at booking** | Already done (`totalPriceCents`). Reserve a place for the **price source** and **tariff reference version** next to the commercial data (RT-99 `TripCommercial`) | S11/S13 | none |
| D4 | **Cost / remuneration snapshot** (what the business owes/earns on this booking) | A `TripCommercial` table, kept out of every public read (RT-98 F3). A booking-level snapshot is a Sprint 11/13 decision; do not add columns to `Booking` now | S11 (reporting) / S13 | Margin vs commission model and values come from the contract — not assumed |
| D5 | **Currency** | `TripCommercial.currency` required whenever an amount is stored (tariff currency is unknown) | S9 (field) | Currency of the C2Rio tariff and of partner settlement |
| D6 | **Cancellation / refund policy per type** | Reserve a policy reference on the catalog item (content, Sprint 10); no behavior | S10 (content), S13 (money movement) | Policy text and refund responsibility (OWN vs PARTNER) — Terms (RT-81) must be consistent |
| D7 | **Availability authority** | For PARTNER, availability is the partner's; `TripSchedule.capacity` must not be presented as a guarantee. The availability source is **derived from `operationType`** (RT-99 §3.3, §5), not stored separately | S11 | How partner availability is obtained (manual vs system) |
| D8 | **Payment provider and flow** | Nothing. No provider selected, no `PaymentAttempt` changes | S13 | PSP choice; capture strategy; installments/Pix; seller-of-record presentation (RT-65 §30.2 B, F) |
| D9 | **Payment to partners (settlement/payout)** | Nothing; record as an open question | later / S13+ | Whether Ricardo Tour collects and pays the partner, or the partner collects; fiscal regime |
| D10 | **Delete behavior** | Note the cascade risk (RT-65 §2): financial/audit records must not cascade-delete once payments exist | S13 (before any real payment) | Retention rules (LEGAL_REVIEW_REQUIRED, RT-65 §25) |
| D11 | **Webhook, idempotency, audit, PII, secrets, rate limit** | None in the catalog; they come from shared infrastructure: RT-86 (webhook contract), RT-82 (distributed rate limit, in Review), RT-64 (observability baseline, in Review), RT-90 (security review, extended to tours) | S13 | RT-90 sign-off and residual-risk acknowledgement |
| D12 | **Legal copy** (Terms, Privacy) must match the commercial reality (who sells, who operates, refunds) | None | S9 (RT-80, RT-81, Owner-supplied text) | Legal text from the Owner/legal — not invented |
| D13 | **Email confirmation** | None; confirmation templates exist (`email.service`), sender domain work is Sprint 5 | S11 | Wording differs for PARTNER (confirmation may be pending) |
| D14 | **Analytics** | None now | S11/S12 | Event names for OWN vs PARTNER (avoid collecting cost data) |

## 4. Open questions for the Owner (no recommendation is binding)

1. Does Ricardo Tour **collect the customer's payment** for PARTNER tours and settle with the partner, or does the partner collect? (D8, D9)
2. For PARTNER tours, **who is the seller of record** in the customer's eyes, and how must that be worded? (RT-65 §30.2 F)
3. **Cancellation and refund responsibility** per type. (D6)
4. **Currency** of partner tariffs and of settlement. (D5)
5. Which **PSP**, and is a single PSP shared with the flight domain? (D8; RT-65 §30.2 B)
6. Should RT-90's security review be explicitly **extended to the tour payment path**? (D11)

## 5. Cross-references (no ticket duplicated)

- RT-65 (approved flight architecture): source of the aggregate-isolation decision (§5), PSP boundary (§7, §14, §18), idempotency (§17), reconciliation (§20).
- RT-85, RT-86, RT-87, RT-88, RT-89, RT-90 (Sprint 6): flight scope; see section 1 for what is and is not reusable.
- RT-99: catalog model; RT-100: its implementation; RT-80/RT-81: legal pages.
- RT-82 (distributed rate limit) and RT-64 (observability baseline): in Review; payment endpoints must not ship before both are done.

## 6. What this document does **not** do

It does not choose a PSP, define a tour order state machine, write any migration, assume any fee, or modify the flight tickets. Sprint 13 tickets for tours are to be created only after the Owner answers section 4 and approves the Sprint 13 scope.
