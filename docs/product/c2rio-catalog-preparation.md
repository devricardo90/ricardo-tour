# RT-101 — C2Rio catalog preparation (RT-RB-S9-05)

- Jira: RT-101. Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), sections 2 and 5.
- Date: 2026-10-12. Documentation only. **Nothing here is published, imported or entered into any database, seed or public page.**
- **This repository deliberately contains no C2Rio price, rate, margin, commission, availability or partner contact detail.** The reference tariff stays in the Owner's Drive; this document describes only its *structure* and what must be confirmed.
- Depends on RT-99 (`docs/architecture/rt-s9-03-own-partner-model.md`), whose model it feeds. Pending Owner approval of that model.

## 1. The reference document (status: UNCONFIRMED REFERENCE)

| Item | Fact (read from the document on 2026-10-12) |
|---|---|
| File | "Tarifário C2RIO - 2026.4 (7).pdf", in the Owner's Google Drive (uploaded 2026-05-20) |
| Issuer | C2Rio (tours & travel), described in the document as a company of a larger group |
| Validity stated | Rates valid from 18 May 2026 to 19 December 2026 |
| Languages | Product names/descriptions in PT, EN and ES |
| Nature stated by the document | "**NET and non-commissionable**" ("NET e não comissionável"); subject to change; existing bookings or bookings made within 7 days after receiving a new tariff are honored at the previous rate |
| Reservation channel stated | Through the partner's sales department (manual; contact details are in the document and are **not** copied here) |
| Status in this project | **Reference only, subject to confirmation and to the contract** (Owner directive, 12/10/2026). Not approved for publication. |

**Observations that affect the model (no numbers):**

1. The tariff presents itself as **NET and non-commissionable**. The Owner's wording is "margin or commission according to the contract". If the contract follows the tariff's wording, Ricardo Tour's remuneration would be a **markup over a net rate**, not a commission. This is a question for the Owner (§5, Q1), not an assumption. RT-99's `remunerationModel` supports both.
2. The tariff has **limited validity (to 19/12/2026) and can change**. A price copied from it would silently go stale. The model must store a **tariff reference and confirmation date** (RT-99 `tariffReference`, `tariffConfirmedAt`), never a bare number.
3. Prices are split by **adult/child with age bands** that differ per product. The current catalog has a single `priceCents` per tour and a per-person schedule price (RT-98 §1.2). Child pricing is not representable today; this is a gap to decide with the Owner, not to patch silently. The corresponding structural question (rate granularity by band and season) is recorded in RT-99 §3.3 and must be resolved before any net rate is stored.
4. Some products are **seasonal** (two rate periods) and some are marked "upon request" or "unavailable". "Unavailable" must never be shown as sellable; "upon request" cannot be a fixed price.
5. Booking is **manual** (request to the partner's sales team), so a partner-operated booking cannot be confirmed instantly (RT-102 D2/D7).
6. The document contains **links to external media folders** for each product. The rights to reuse that media are unknown (RT-79); the links must not be copied into public pages.
7. The tariff includes products outside Rio city (day trips to other towns/coasts), transfers and tickets "upon request". Launch scope today is Rio de Janeiro only (`LAUNCH_CITY`, `lib/catalog/public-trips.ts:29`); which products are in scope is an Owner decision.

### 1.1 Confirmation of the "NET / non-commissionable" statement (re-read 2026-10-12)

The reference tariff was re-read from the Owner's Drive on 2026-10-12. The closing note of the document states, in Portuguese, English and Spanish, that the tariff **is NET and non-commissionable** ("O tarifário é NET e não comissionável"), that it is subject to change, and that existing bookings or bookings made within 7 days after a new tariff is received are honored at the previous rate. The note also says reservations go through the partner's sales department.

**What this does and does not establish**
- It establishes how the *document* describes itself. It does **not** establish what the *contract* between Ricardo Tour and C2Rio says (that agreement is not in the repository or the Drive search results).
- **No authorization is presumed** for: applying a markup, treating any amount as a commission, deriving a public sale price from a tariff figure, or publishing any tariff-derived value. Each of these needs written confirmation from the Owner, and the commercial terms below need contractual confirmation.

**Contractual conditions that must be confirmed in writing before any partner price is used** (record answer, date and source for each):
1. Whether Ricardo Tour may resell at a price above the net rate (markup), and any limits on that (price parity, minimum/maximum sale price, public price publication rules).
2. Whether any commission exists in addition to or instead of a markup (the tariff says non-commissionable).
3. Which tariff version governs a sale, the tariff's validity window, and how changes are notified (the 7-day honoring rule).
4. Payment flow and settlement: who collects from the customer, when and how Ricardo Tour pays the partner, payment deadlines, currency.
5. Booking and confirmation process: channel, response time, what counts as confirmed, who communicates with the customer.
6. Cancellation, no-show, change and refund conditions, and who bears them.
7. Child/adult definitions and age-band rules, and how the partner wants them shown to customers.
8. Permission to use the partner's descriptions, product names and photos, and whether the partner's brand may be named publicly (and with what wording).
9. Exclusivity, non-circumvention and data-sharing terms (customer data passed to the partner; privacy implications, RT-80 gap G2).
10. Liability, insurance and incident handling for partner-operated tours; who is the seller of record toward the customer.

Until these are confirmed, partner records stay `UNCONFIRMED` (RT-99 `recordStatus`) and nothing derived from the tariff is published.

## 2. Ingestion template — one record per PARTNER tour

Each field has an **origin** and a **confirmation status**. Nothing may be published while a required field is `UNCONFIRMED`.

| # | Field | Required to publish | Origin | Maps to (RT-99 / existing) | Notes |
|---|---|---|---|---|---|
| 1 | Partner product name (as issued) | yes | C2Rio document | `Trip.title` (per locale) | PT/EN/ES names exist in the tariff; Ricardo Tour wording may differ — Owner approves final copy |
| 2 | Description / itinerary | yes | C2Rio **and/or** Ricardo Tour copy | `Trip.description` (today) → structured in Sprint 10 | The tariff has titles only; descriptions must come from the partner or be written and approved by the Owner |
| 3 | Inclusions / exclusions | yes | C2Rio confirmation | `description` blocks today (RT-98 §1.2) | Never inferred from the product name |
| 4 | Duration | yes | C2Rio confirmation | `description` "Duracao:" today | |
| 5 | Meeting point / pickup | yes | C2Rio confirmation | not modeled | Sprint 10 |
| 6 | Languages offered | yes | C2Rio confirmation | not modeled | |
| 7 | Minimum age / child policy | yes | C2Rio confirmation | `Trip.childrenAllowed` (boolean today) | Tariff has age bands |
| 8 | Operating days / schedule / seasonality | yes | C2Rio confirmation | `TripSchedule` | No availability is assumed |
| 9 | Cancellation / refund policy | yes | C2Rio **and** Owner decision | policy reference (Sprint 10) | Must match Terms (RT-81) |
| 10 | Net rate and currency | internal only | C2Rio document **+ contract confirmation** | `TripCommercial.costCents`, `.currency`, `.tariffReference`, `.tariffConfirmedAt` | **Private. Never on public surfaces.** Entered by the Owner/authorized user, not by this ticket |
| 11 | Ricardo Tour remuneration (markup or commission) | internal only | Contract | `TripCommercial.remunerationModel`, `.remunerationValue` | Value from the Owner/contract |
| 12 | Public sale price | yes | Owner decision | `Trip.priceCents` | Not derived by a formula in code |
| 13 | Availability authority and confirmation process | yes | C2Rio **and** Owner | Derived from `Trip.operationType = PARTNER` (RT-99 §5) | Manual confirmation by the partner |
| 14 | Photos and rights | yes | C2Rio **and** rights evidence | `Trip.imageUrl` + RT-79 | Rights must be recorded before any image is used |
| 15 | Partner display wording ("Operated by …") PT/EN/ES | optional | Owner | `Partner.publicLabel` | If absent, no label is shown |
| 16 | Status of this record | yes | Ricardo Tour | `TripCommercial.recordStatus` (RT-99 §3.3) | `UNCONFIRMED` (default; reference only) → `CONFIRMED` → `APPROVED_FOR_PUBLICATION` (Owner) |

## 3. Confirmation checklist with the Owner / C2Rio

Before any partner tour becomes a catalog record, record the answer and date for each:

- [ ] Is the 2026.4 tariff the **current** tariff for the sales period? Who confirms, and when does it expire?
- [ ] Contract form: **markup over net** or **commission**? (the tariff states "net, non-commissionable")
- [ ] Which products will Ricardo Tour sell (a deliberate, small subset), and are they within the Rio de Janeiro launch scope?
- [ ] Child/adult pricing: how will the site present child rates?
- [ ] Currency and settlement: does Ricardo Tour collect and pay the partner, or does the partner collect?
- [ ] Booking process and **response time** for partner confirmation; what the customer is told while waiting.
- [ ] Cancellation, refund, no-show and weather policies, per product.
- [ ] Permission and evidence to use the partner's descriptions and **photos**.
- [ ] Wording of how the partnership may be described publicly (no claim of exclusivity, official partnership, accreditation or guarantee unless the Owner confirms it is true and documented).
- [ ] Who is the legal seller toward the customer, and what the Terms must say (RT-81).

## 4. Rules for the future import (Sprint 10/11, not now)

1. **No bulk import from the PDF.** Each partner record is entered or approved individually after §3 is answered.
2. A price from the tariff is stored only as `TripCommercial` (private) with its `tariffReference` and a confirmation date; it never fills `Trip.priceCents` automatically.
3. Records start `UNCONFIRMED` (reference only) and unpublished; nothing is added to `LAUNCH_TRIP_IDS` (`lib/catalog/public-trips.ts:21-26`) without an explicit, reviewed Owner decision.
4. When the tariff version changes, affected records revert to `UNCONFIRMED` until re-confirmed (the tariff itself says it can change and has a 7-day honoring rule).
5. "Unavailable" and "upon request" items are never created as sellable catalog records.
6. No partner contact details, internal rates or media links are stored in the repository.

## 5. Questions for the Owner

1. The tariff says "NET, non-commissionable". What does the actual agreement with C2Rio say — markup over net, commission, or something else?
2. Which C2Rio products do you want to start with, and who classifies the 4 current public tours as OWN or PARTNER (RT-99 Q1)?
3. May the C2Rio descriptions and photos be used on the site, and in writing from whom?
4. Do you want child pricing shown? (not representable in the current model)

## 6. Acceptance (RT-101)

1. Template and checklist documented — §2, §3.
2. Tariff 2026.4 marked explicitly as unconfirmed; no value in code, seed or public content — §1, §4.
3. Each template field has an origin and confirmation status — §2.
4. The Owner-dependent inputs (contract terms, product selection, rights) are recorded as blockers for filling content; the structure itself does not depend on them.
