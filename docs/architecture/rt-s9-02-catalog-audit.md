# RT-98 — Catalog structure audit (RT-RB-S9-02)

- Jira: RT-98. Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), section 5.
- Date: 2026-10-12. Base: branched from `origin/main` @ `40136a3`; line references were read at `31ae86c` (two favicon commits ahead, no cited file differs) on branch `sprint9/commercial-foundation`.
- Type: documentation only. No code, database, seed or migration was changed. **No remote database was read** (`.env` points at a hosted Neon database and was not used); every fact below comes from the repository or from earlier recorded audits, and each is cited.
- No price, margin, commission or availability value is proposed here.

## 1. What the catalog is today

### 1.1 Data model (`prisma/schema.prisma`)

| Model | Lines | Commercially relevant fields |
|---|---|---|
| `Trip` | 69–91 | `id` (cuid), `city`, `location?`, `priceCents` (Int, single price), `title` (Json), `description` (Json?), `highlights` (Json), `imageUrl`, `isPublished` (default **true**), `childrenAllowed`, `durationDays` (default 1), `physicalLevel` (enum), `maxGuests?`, `startDate?`/`endDate?` |
| `TripSchedule` | 93–107 | `tripId`, `startAt`, `endAt?`, `capacity`, `pricePerPersonCents`, `status` (free `String`: `OPEN`/`CLOSED`) |
| `Booking` | 109–131 | `userId`, `tripId`, `scheduleId?`, `status` (`PENDING`/`CONFIRMED`/`CANCELED`), `paymentStatus` (`UNPAID`/`PAID`/`REFUNDED`/`PARTIAL`), `guestCount`, `totalPriceCents` |
| `PaymentAttempt` | 133–152 | `bookingId`, `provider` (free `String`), `amountCents`, `currency` (default `BRL`), `status`, `metadata` Json |

What the model does **not** have: an operator or supplier, a catalog "type", a cost, a margin or commission, a price source, a slug, or any structured inclusions/exclusions/itinerary/meeting-point/cancellation fields.

### 1.2 Where each content attribute really lives

| Attribute | Stored in | Evidence | Note |
|---|---|---|---|
| Title / description | `Trip.title`, `Trip.description` (JSON keyed by locale) | `lib/types.ts` (`LocalizedText`), `lib/schemas.ts:17-33` | Per-locale JSON. Volume II/RT-78 records that tour content is currently identical across locales. |
| Highlights | `Trip.highlights` (JSON per locale) | `components/site/tour/tour-detail-view.tsx:38` | Only structured list. |
| **Duration, category, inclusions, exclusions** | **Free text blocks inside `description`** ("Duracao: …", "Categoria: …", "Inclusoes: a, b.", "Exclusoes: c.") | `lib/catalog/trip-presentation.ts:5-6, 19-31, 33-48` | Parsed by regex at render time. `durationDays` is only the schema default 1 and is not used for display (comment at `trip-presentation.ts:6`). Fragile: a comma inside an item splits it; locale-specific labels are not handled. |
| Price | `Trip.priceCents` and `TripSchedule.pricePerPersonCents` | `lib/services/booking.service.ts:247, 286` | Booking total comes from the schedule price when a schedule is chosen, else the trip price. Two sources of price. |
| Availability | `TripSchedule.status` + `capacity` vs. summed `Booking.guestCount` (PENDING/CONFIRMED) | `booking.service.ts:251-295` | Internal capacity only; no partner confirmation concept. |
| Itinerary, meeting point, cancellation policy | Not modeled | — | Only whatever prose is inside `description`. |
| Photos | `Trip.imageUrl` (one image), assets under `public/images/trips` | `schema.prisma` `Trip.imageUrl`; provenance/rights unknown (RT-79) | Single image per tour. |

### 1.3 Three competing sources of "the catalog"

| Source | Contents | Evidence |
|---|---|---|
| Seed | 6 active tours with ids `seed-002-…` to `seed-007-…` (+ `seed-001-…` unpublished), prices and schedules | `prisma/seed.ts:23-41` (ids), `:109-356` (trips), `:362-444` (schedules) |
| Real-trips file | 5 entries (`nome`, `slug`, `descricao`, `duracao`, `preco_base`, `categoria`, `inclusoes`, `exclusoes`, …) matched by PT title | `data/real-trips.json`, `scripts/import-real-trips.mjs` (referenced by `lib/catalog/trip-presentation.ts:3-4`) |
| Public allowlist (what visitors actually see) | 4 production records with **cuid** ids | `lib/catalog/public-trips.ts:21-26` (`LAUNCH_TRIP_IDS`), `scripts/rt-57-production-launch-trips.mjs:30-33` |

**Finding F1 (HIGH).** None of the seed ids (`seed-00x-…`) is in `LAUNCH_TRIP_IDS`. Against a database seeded by `prisma/seed.ts`, `getPublicTrips()` (`public-trips.ts:123-126`) returns zero trips (`NOT_APPROVED_FOR_LAUNCH`, `public-trips.ts:87`). The seed therefore does not reproduce the public catalog, and the public catalog's content lives only in the hosted database. The May 2026 operational record of "6 published tours" (`docs/ops/status.md`) predates the RT-53 launch gate and no longer describes what is public. Anything built on the seed (tests, fixtures, a partner example) will not appear on public pages unless the allowlist changes.

## 2. How the public surface reads the catalog

All public readers go through one gate, `lib/catalog/public-trips.ts` (RT-53):

| Consumer | File:line | Reads |
|---|---|---|
| Home "Experiences" | `components/experiences-in-rio-section.tsx:57` | `getPublicTrips()` |
| Tours listing | `app/[locale]/(site)/tours/page.tsx:78` | `getPublicTrips()` + `filterPublicTrips` |
| Tour detail | `app/[locale]/(site)/tours/[id]/page.tsx:24, 47` | `getPublicTripById()` → `notFound()` when `null` |
| Tour request action | `app/actions/tour-request.ts:51` | `getPublicTripById()` |
| Sitemap | `app/sitemap.ts:30` | `getPublicTrips()` |
| Public API | `app/api/trips/route.ts:14-17` | `getPublicTrips()`, **maps to `{ id, title, description, city, location }` only** |
| Structured data | `app/[locale]/(site)/tours/[id]/page.tsx:55`, `lib/seo/structured-data.ts:31-43` | `priceCents` → `Offer` when > 0 |
| Booking | `lib/services/booking.service.ts:184-300` | `prisma.trip.findUnique` (not through the gate) |
| Admin | `app/[locale]/admin/tours/page.tsx`, `…/new/page.tsx`, `app/actions/admin.ts:25-39`, `app/api/trips/[id]/route.ts` (PUT, ADMIN only) | create + list + update API |

**Finding F2 (MEDIUM) — pendency P2 is already resolved.** The registered P2 ("detail page of an unpublished tour returns 200", `docs/ops/status.md`, RT-FINAL-HARDENING-01) no longer applies: the detail page now resolves through `getPublicTripById`, which returns `null` for any id outside the allowlist or unpublished/invalid (`public-trips.ts:129-137`), and the page calls `notFound()`. Not re-verified at runtime in this ticket (documentation only); recommend a one-line automated check in RT-100 and then closing the P2 record.

**Finding F3 (MEDIUM) — gate returns whole rows.** `getPublicTrips()` and `getPublicTripById()` use `prisma.trip.findMany/findFirst` **without `select`** (`public-trips.ts:124, 131`), so the entire `Trip` row (every column, including any column added later) flows into Server Components (`TourDetailView`, `PublicTourCard`, the Home Experiences section). Today none of it reaches a client component: the client children (`TourViewTracker`, `TourRequestForm`) receive only `tripId`, `title`, `locale`, `city` and `hasSchedules`, so the risk is **latent**. A future change that passes `trip` into a client component would expose every column. Only `/api/trips` filters explicitly. Consequence for the OWN/PARTNER work: **cost, margin or commission must not be added as plain `Trip` columns**; either keep them in a separate model that the public gate never selects, or switch the gate to an explicit `select`. See RT-99.

**Finding F4 (LOW).** `Trip.isPublished` defaults to `true` (`schema.prisma`, comment in `public-trips.ts:3-5`), `tripSchema` also defaults it to `true` (`lib/schemas.ts:27`), and `buildTripPayload` (used by `createTripRecord`) writes `validated.isPublished` (`lib/services/trip.service.ts:134`). Safety currently relies on the admin action forcing `false` (`app/actions/admin.ts:27-28`) and on the allowlist. A direct service call or script can still create a published record, which the allowlist then hides.

## 3. Admin capabilities today

- Admin routes: bookings (list + detail with confirm/cancel), contacts, tours (list + `new`) (`app/[locale]/admin/`).
- There is **no tour edit page and no routed schedule UI** (an unrouted legacy copy exists under `.admin_backup/`); edits go through `PUT /api/trips/[id]` (ADMIN session required, `route.ts:9-21`) and scripts. Schedules are created through `schedule.service.ts` (server side) or the seed.
- New tours are always created unpublished (`admin.ts:22-28`; `admin/tours/new/page.tsx:54`).
- Admin shows `priceCents` formatted (`admin/tours/page.tsx:68`); it has no concept of operator or margin.

## 4. Bookings and payments (for later sprints)

- `Booking` has no link to an operator/partner; its lifecycle is `PENDING → CONFIRMED | CANCELED` (`schema.prisma:224-228`) with a separate `paymentStatus`. A partner-operated tour needs an explicit "awaiting partner confirmation" notion that the current enum cannot express.
- Price is snapshotted into `Booking.totalPriceCents` at creation (`booking.service.ts:247, 286, 295`), which is the right shape; cost/commission are not snapshotted anywhere.
- `PaymentAttempt.provider` is a free string and `currency` defaults to `BRL`; no partner payout/settlement model exists.
- Public conversion today is a manual pre-booking / contact flow (no online payment): see `docs/ops/status.md` (RT-FINAL-04B) and `app/actions/tour-request.ts`.

## 5. Gaps for OWN / PARTNER

| Gap | Kind | Where it hurts |
|---|---|---|
| No `operation type` (OWN/PARTNER) and no partner/operator identity | Missing in model | Cannot label, filter or route confirmations |
| No cost, margin/commission model, price source | Missing in model | Cannot represent the commercial arrangement; **values must come from the Owner/contract** |
| Inclusions/exclusions/duration/category as free text in `description` | Model weakness | Unreliable for partner imports and for per-locale content |
| Single `imageUrl`, rights unverified | Missing content / rights | RT-79; Sprint 10 |
| No itinerary, meeting point, cancellation policy fields | Missing in model/content | Sprint 10 content |
| Classification of the 4 public tours (own vs. operated by a partner) unknown | Missing content (Owner) | Needed before any `PARTNER` label is shown |
| Seed does not reproduce the public catalog (F1) | Process | Test fixtures, onboarding |
| Whole-row reads (F3) | Risk | Leaking commercial columns |

"Missing in model" = a schema change is needed. "Missing content" = the model may already hold it, but the Owner/partner has to supply it.

## 6. Migration risks and recommendation

1. **Prefer an additive change.** New nullable columns/tables with safe defaults; never rename or drop `Trip`/`Booking` columns. The migration history is a linear list of additive migrations (`prisma/migrations/`).
2. **Keep commercial financials out of `Trip`** (F3): put cost/margin/commission in a separate table keyed by `tripId` that no public reader selects, or add an explicit `select` to the gate first.
3. **Do not apply any migration to the hosted database in Sprint 9.** Validate only against the local database (`.env.local`: `localhost:5433/ricktravel`).
4. **Default classification must not mislabel.** Existing rows should be `UNCLASSIFIED`/null until the Owner classifies them; a default of `OWN` would claim an operator relationship that is not confirmed.
5. **Fix the seed/allowlist mismatch deliberately** (F1): either make test fixtures explicit and flagged as test data, or keep the seed out of the public gate; do not add seed ids to `LAUNCH_TRIP_IDS`.
6. **Regression guard:** `tests/public-trips.test.ts` and the public Playwright suite (`e2e/public/`) already protect the public catalog; extend them rather than adding a parallel check.

## 7. Questions for the Owner (feed RT-99)

1. Which of the 4 public tours are operated by Ricardo Tour and which by a partner?
2. Is the C2Rio 2026.4 tariff a reference only until a contract is confirmed (assumed yes, per Volume II)?
3. Who confirms a partner-operated booking, and by which channel?
4. Should the seed stay as developer data only, with the hosted database as the single source of public truth?

## 8. Verification notes

- All line references were read from the repository at the base commit listed above.
- Not verified (by design): contents/prices of the hosted database; runtime behavior of P2; real C2Rio data (no C2Rio file exists in the repository).
