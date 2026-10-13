# RT-99 — OWN / PARTNER commercial model (RT-RB-S9-03)

- Jira: RT-99. Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), sections 2, 3 and 5.
- Date: 2026-10-12. **Status: PROPOSAL — pending Owner approval (Owner Gate).** RT-100 (implementation) must not start until the Owner approves this document.
- Documentation only. **No price, cost, margin, commission, tariff or availability value appears or is assumed.** Every monetary field below is "value to be supplied by the Owner / contract".
- Inputs: `docs/architecture/rt-s9-02-catalog-audit.md` (RT-98), `docs/architecture/rt-s9-06-booking-payment-dependencies.md` (RT-102).

## 1. Decisions already made by the Owner (Volume II, 12/10/2026)

- The catalog has two kinds of tours: **Ricardo Tour OWN** (operated directly by Ricardo Tour) and **Ricardo Tour PARTNER** (operated by a partner, initially C2Rio).
- Ricardo Tour may sell partner tours and earn a margin or commission according to the contract.
- The C2Rio 2026.4 tariff is a reference subject to confirmation. Percentages and prices are **not** assumed.
- The approved visual design is preserved; payments come last.

## 2. Design principles

1. **Additive only.** New nullable columns/tables; nothing existing is renamed, dropped or re-typed.
2. **Unclassified by default.** A record is neither OWN nor PARTNER until the Owner classifies it. A default of `OWN` would assert an operator relationship that is not confirmed.
3. **Commercial financials never live in `Trip`.** RT-98 finding F3: the public gate reads whole `Trip` rows, so any column added to `Trip` is exposed to every server reader and to any future client prop. Cost, margin and commission therefore live in a separate table that no public reader selects.
4. **Public facts and private facts are different tables.** What a visitor may see (who operates the tour) is on `Trip`/`Partner`; what only the business may see (cost, remuneration, tariff reference) is in `TripCommercial`.
5. **No invented claims.** "Operated by …" wording is shown only where the Owner has approved it, and never implies an official partnership, certification or guarantee that is not documented.

## 3. Proposed data model (conceptual — names may change in RT-100)

### 3.1 `Trip` — two additive, public-safe fields

| Field | Type | Default | Meaning |
|---|---|---|---|
| `operationType` | enum `OWN \| PARTNER`, **nullable** | `null` (unclassified) | Who operates the tour |
| `partnerId` | FK → `Partner`, nullable | `null` | Required when `operationType = PARTNER`; must be `null` for `OWN` |

Invariant: `operationType = PARTNER ⇔ partnerId IS NOT NULL`. Prisma cannot express a CHECK constraint, so RT-100 must either add it as a **raw-SQL CHECK in the migration** (preferred) or explicitly accept an application-only guarantee (service validation + test). The choice is recorded in RT-100.

Relations: `Trip.partnerId → Partner` is **`onDelete: Restrict`** (a partner with tours cannot be deleted; `SetNull` would silently break the invariant above). `Trip` also gets back-relation fields to `Partner` and `TripCommercial`; relation fields are not part of a plain `findMany` result, so they do not leak by themselves.

### 3.2 `Partner` — new table (public-safe identity only)

| Field | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `name` | string | Display name (e.g. as the Owner approves it) |
| `slug` | string, unique | |
| `status` | enum `ACTIVE \| INACTIVE` | Inactive partners hide their tours from the public gate |
| `publicLabel` | JSON per locale, nullable | Approved "Operated by …" wording, PT/EN/ES; `null` ⇒ no label shown |
| `createdAt`, `updatedAt` | datetime | |

No contact data, contract data or financial data on this table.

### 3.3 `TripCommercial` — new table, **private**

One row per `Trip` (`tripId` unique). Not selectable by any public reader.

| Field | Type | Notes |
|---|---|---|
| `tripId` | FK → `Trip`, unique | |
| `priceSource` | enum `OWNER_SET \| PARTNER_TARIFF \| CONTRACT`, nullable | Where the public price comes from |
| `tariffReference` | string, nullable | e.g. the tariff document and version; free text, **no number is implied** |
| `tariffConfirmedAt` / `tariffConfirmedBy` | datetime / string, nullable | Reference stays "unconfirmed" while null |
| `currency` | string (ISO 4217), nullable | **Required whenever any amount is stored**; tariff currency is unknown |
| `costCents` | int, nullable | Value from the Owner/contract |
| `remunerationModel` | enum `MARKUP \| COMMISSION`, nullable | Which arrangement applies |
| `remunerationValue` | int, nullable | Meaning depends on the model (basis points or cents); defined in RT-100 once the Owner confirms the contract form |
| `recordStatus` | enum `UNCONFIRMED \| CONFIRMED \| APPROVED_FOR_PUBLICATION`, default `UNCONFIRMED` | Review state of the commercial data (used by RT-101); anything other than `APPROVED_FOR_PUBLICATION` blocks publication of a PARTNER tour |
| `notes` | text, nullable | Internal only |
| `createdAt`, `updatedAt` | datetime | |

`availabilitySource` is **not** a stored field: it is **derived from `operationType`** (OWN → internal, PARTNER → partner confirmation; unclassified → undefined), which avoids contradictory combinations (see §5).

**Open structural question — rate granularity (must be resolved by RT-100 before any cost is stored).** The reference tariff (RT-101 §1) has adult and child rates with age bands and, for at least one product, two seasonal rate periods. A single `costCents` / `remunerationValue` per trip cannot hold that, and `TripSchedule.pricePerPersonCents` is a public per-person price with different granularity. Reserved option: a child table `TripCommercialRate` keyed by (`tripCommercialId`, passenger band, season/validity window) holding the net rate and currency, with `TripCommercial` keeping only partner-level data. Until the Owner decides how child pricing is presented (RT-101 Q4), **no cost is entered** and the single-value columns above are placeholders.

Every column is nullable except `recordStatus` (which has a default); a `TripCommercial` row may otherwise be entirely empty. `remunerationValue`'s unit depends on `remunerationModel`; RT-100 may replace it with two separately typed fields once the Owner confirms the contract form. The public price stays `Trip.priceCents` (and `TripSchedule.pricePerPersonCents`) exactly as today — this model does **not** change how prices are shown or computed.

### 3.4 Not in this ticket (reserved for later sprints)

- Structured inclusions/exclusions/itinerary/meeting point (Sprint 10, content); today they are text blocks inside `description` (RT-98 §1.2).
- A partner-confirmation state on `Booking` (Sprint 11; RT-102 D2).
- Booking-level cost/remuneration snapshot and any payment field (Sprint 11/13).

## 4. Public display rules

| Situation | What the visitor sees |
|---|---|
| `operationType` is `null` | Exactly what they see today. No label. |
| `OWN` | No special label required (default experience). The Owner may later approve a label. |
| `PARTNER` with an approved `publicLabel` | The label, e.g. "Operated by {partner name}", in the visitor's locale. |
| `PARTNER` without `publicLabel` | No label (never an auto-generated claim). |
| Any type | **Never** cost, margin, commission, tariff reference, price source or internal notes — in HTML, props, JSON-LD or any API. |

Structured data (`TouristTrip`) keeps today's content; no `provider`/`seller` claim is added until the Owner approves the wording.

## 5. Availability and confirmation by type

| | OWN | PARTNER |
|---|---|---|
| Availability authority | Ricardo Tour (`TripSchedule.capacity` and status) | The partner. Internal capacity must not be presented as a guarantee. |
| Booking confirmation | Existing flow (manual confirmation by admin) | Booking is not truly confirmed until the partner confirms (state to be designed in Sprint 11) |
| Availability source (derived from `operationType`, not stored) | internal | partner confirmation |

How partner availability is obtained (manual message, spreadsheet, system) is an Owner/partner question; this ticket assumes nothing.

## 6. Migration strategy and rollback

1. One additive Prisma migration: create `Partner`, `TripCommercial`, the two enums; add `Trip.operationType` and `Trip.partnerId` (both nullable). No data backfill.
2. All existing rows remain `operationType = NULL` until the Owner classifies them (via a reviewed script or admin action in a later sprint).
3. Rollback: drop the two new tables and the two new columns/enums (no existing data depends on them). Documented in RT-100.
4. Validation only against the **local** database; **no migration is applied to the hosted database in Sprint 9.**
5. Public gate: `getPublicTrips`/`getPublicTripById` gain an explicit `select`/`include` (or a typed projection) that excludes `TripCommercial`, plus an automated test that fails if a commercial field appears in any public response or rendered page. `Partner` with `status = INACTIVE` hides its tours: the gate (`getPublicTrips`, `getPublicTripById`) must include the partner status in its query (a `where`/join), `GateTrip` is extended with the partner status, and `ExclusionReason` gains `PARTNER_INACTIVE`. Every other reader (`/api/trips`, sitemap, home section, any structured-data or concierge source) already goes through the gate (RT-98 §2) and must keep doing so; a reader that bypasses the gate is a defect.
6. The seed stays developer data (RT-98 F1). Test fixtures for PARTNER are fictitious, clearly marked as test data, carry no real partner prices, and are **not** added to `LAUNCH_TRIP_IDS`.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Commercial values leak to the browser | Separate table; explicit projections; leak test (RT-100 acceptance criterion 3) |
| Wrong default classification | `null` = unclassified |
| Whole-row reads in the gate | Add projection before adding any field that is not public-safe |
| Cascade deletion of commercial or financial data | `TripCommercial → Trip` and `Trip → Partner` use `onDelete: Restrict`. **Consequence:** a `Trip` that has a `TripCommercial` row can no longer be deleted by the admin/service/seed paths that delete trips today (`Booking` and `TripSchedule` cascade from `Trip`); such trips must be unpublished, not deleted, and RT-100 must handle the error path. Revisit with RT-102 D10 before payments. |
| Scope creep into checkout | Out of scope; Sprint 13 |

## 8. Questions for the Owner (needed for approval and for RT-100/RT-101)

1. **Classification:** of the 4 public tours, which are operated by Ricardo Tour and which by a partner?
2. **Partner identity and wording:** the exact partner name and the approved "Operated by …" wording in PT/EN/ES.
3. **Contract form:** is remuneration a margin (markup) over a net tariff, or a commission on a retail price? The C2Rio 2026.4 reference tariff describes itself as "NET and non-commissionable" (see `docs/product/c2rio-catalog-preparation.md` §1), which may not match the Owner wording "margin or commission". This decides the meaning of `remunerationValue`.
4. **Currency** of the C2Rio tariff and of settlement.
5. **Confirmation:** who confirms a partner booking and through which channel?
6. **Seed:** confirm it stays developer data only, with the hosted database as the single source of public truth.

## 8A. Decision brief — OWN vs PARTNER at a glance (added 2026-10-13)

No monetary value appears here; "open" means the Owner/contract decides.

| Dimension | OWN (Ricardo Tour operates) | PARTNER (C2Rio operates, initially) |
|---|---|---|
| Who delivers the tour | Ricardo Tour (guide/team) | The partner |
| Tour content (text, itinerary, photos) | Ricardo Tour writes it and owns the rights (to be evidenced, RT-79) | Partner-supplied or Ricardo Tour-written **with the partner's permission** to use names/photos (RT-101 §1.1 item 8) |
| Where the **public price** comes from | Owner sets it | Owner sets it, **informed by** the partner's net tariff; the tariff itself is never shown or copied automatically |
| Where the **cost** lives | Internal cost, if the Owner wants to track it (private `TripCommercial`) | Partner net rate, private `TripCommercial`, tied to a tariff version and a confirmation date |
| Ricardo Tour's remuneration | Not applicable (sale revenue) | Markup over net **or** commission — **open (Q3)**; the tariff says "NET, non-commissionable" |
| Availability authority | Ricardo Tour (`TripSchedule`) | The partner; the site must not promise capacity it does not control |
| Booking confirmation | Existing manual flow by the admin | **Manual confirmation by the partner** before the booking is truly confirmed (Sprint 11 state) — channel and response time **open (Q5)** |
| What the visitor sees | Today's experience | Today's experience **plus** an approved "Operated by …" label only if the Owner approves wording (Q2); otherwise nothing extra |
| Cancellation / refund | Ricardo Tour's policy (to be decided, RT-81 T3) | Depends on the partner's conditions and the contract — **open**; Terms must match |
| Customer data | Stays with Ricardo Tour | Likely shared with the partner to fulfil the booking → privacy policy impact (RT-80 gap G2) |
| Payment / settlement | Future Sprint 13 | Future Sprint 13; who collects and who pays whom is **open** |
| Risk if mislabelled | Claiming to operate a tour that a partner operates (liability, consumer-protection exposure) | Claiming a partnership or exclusivity that is not documented |

**How each answer changes the build**
- **Q1 (classification):** nothing changes publicly until answered; unclassified is the safe default (`operationType = null`).
- **Q3 (contract form):** *Markup* → the system stores a net rate and the Owner sets the public price; *Commission* → the system stores a commission basis and the public price is the partner's retail price; *Other* → RT-100 waits. This is the only answer that changes the meaning of a stored field.
- **Q5 (confirmation):** decides whether a partner booking shows "pending partner confirmation" and with what promised timeframe; with no answer the site promises no timeframe.
- **Q2 and Q4:** wording and currency; neither blocks the structural work but both must be answered before any partner tour is published.

**What the Owner needs to bring to decide**: the C2Rio agreement or written terms (or confirmation that none exists yet), the list of products to start with, and permission for descriptions/photos. The ten contractual conditions are in `docs/product/c2rio-catalog-preparation.md` §1.1.

**Minimum to unlock RT-100 (structure only, no partner tour published):** Q1 (even "all unclassified"), Q6, and approval of the model. Q2–Q5 are needed before the first PARTNER tour is made public.

## 9. Acceptance (RT-99)

1. This document exists and is reviewed independently against the schema (RT-98) — this file.
2. Every monetary field is marked as supplied by the Owner/contract — §3.3.
3. Owner questions listed — §8.
4. **Owner approval of the model (Owner Gate) is pending** and blocks RT-100.
