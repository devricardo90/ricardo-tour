# RT-100 — OWN/PARTNER catalog structure: implementation and evidence (Sprint 9)

- Jira: RT-100 (RT-RB-S9-04). Authority: Owner decision of 2026-10-13 recorded in RT-99 and `docs/architecture/rt-s9-03-own-partner-model.md` §10.
- Branch: `sprint9/rt-100-catalog-structure` (not merged; nothing published; the hosted Neon database was never contacted).
- Scope: **structure only.** No tour is classified, no tariff/cost/commission/markup is registered, no public page, price, text, photograph, availability or booking flow changes.

## 1. What was built

| Area | Change |
|---|---|
| Schema (`prisma/schema.prisma`, +92 lines, 0 deleted) | `Trip.operationType` (`UNCLASSIFIED` default) and `Trip.partnerId`; new `Partner` (INACTIVE by default), `TripCommercial` (private) and `TripCommercialRate` (private, empty); enums `OperationType`, `PartnerStatus`, `PriceSource`, `RemunerationModel`, `CommercialRecordStatus` |
| Migration `20261013120000_rt100_operation_type_partner_commercial` | Additive only (no DROP/RENAME/UPDATE/DELETE/INSERT). Database CHECK: `operationType = PARTNER ⇔ partnerId IS NOT NULL`. Rate checks: amount needs currency, no negative amount/age, age and validity ranges coherent, non-blank category, ISO-style currency, URL-safe partner slug. FKs: `Trip→Partner` and `TripCommercial→Trip` are **Restrict**; rates cascade with their `TripCommercial` |
| Public gate (`lib/catalog/public-trips.ts`, +21/−2) | Joins **only** the partner status; new exclusion reason `PARTNER_INACTIVE` (a PARTNER tour is public only while its partner is ACTIVE; the launch allowlist and integrity checks still apply). UNCLASSIFIED/OWN trips are evaluated exactly as before |
| Helpers (`lib/catalog/operation-type.ts`) | `validateOperationAssignment` (mirrors the DB CHECK) and `resolvePartnerPublicLabel` (returns the approved label only for an ACTIVE PARTNER in exactly the visitor's locale; null for everything else, so `UNCLASSIFIED` can never be returned). Not wired into any page (visitor-facing label is a Sprint 10 decision) |
| Seed (`prisma/seed.ts`, +23) | **Development-only guard**: refuses a non-local `DATABASE_URL` (`lib/db/local-database.ts`), with no override. Adds the C2Rio partner structure: INACTIVE, no label, **no tour** |

## 2. The Owner's 12 conditions

| # | Condition | How it is met / proven |
|---|---|---|
| 1, 5 | The four public tours stay unclassified; nothing presumed OWN/PARTNER | Column default `UNCLASSIFIED`; migration validation: all 4 legacy rows end `UNCLASSIFIED`, `partnerId` NULL |
| 2 | Temporary internal `UNCLASSIFIED` state | Enum value + default |
| 3 | No change to public behavior, prices, texts, bookings | Public before/after comparison (§4): 26 URLs, rendered content identical |
| 4 | `UNCLASSIFIED` never shown | Static guard: no page, component or API route mentions it; helper returns null; none of the 26 new responses contains it |
| 6 | Seed is development-only | Guard in the seed; verified: refuses a remote-looking URL (exit 1, never prints it), runs and is idempotent locally |
| 7 | C2Rio has its own structure | `Partner` table + dev seed row (INACTIVE, no tour) |
| 8 | No real tariff without approved source/conditions | Tables created empty; migration has no INSERT; seed registers nothing commercial |
| 9 | No commission/markup presumed | `remunerationModel` nullable, no default, **no value field** |
| 10 | Prepared for child rates, seasonality, price categories | `TripCommercialRate`: category, age range, season label, validity window, net amount + currency |
| 11 | Private data not exposed | Separate tables; no source file references them; `/api/trips` runtime test: only `id,title,description,city,location`; guards verified with negative controls |
| 12 | Neon untouched; migrations validated in isolation | §3 |

## 3. Safety measures taken (Neon never touched)

- `prisma.config.ts` auto-loads `.env`, which points at the hosted database. The Sprint 9 worktree's copies of `.env*` were **deleted**, so a Prisma command without an explicit `DATABASE_URL` cannot reach it. Every command used an explicit local URL.
- All validation used **throw-away databases** (`rt100_scratch_*`, `rt100_cmp_*`) on the local Docker Postgres (`localhost:5433`). The validator refuses any non-local host (and any URL carrying `host`/`hostaddr`/`service` parameters). All scratch databases were dropped; the Owner's local dev database `ricktravel` was not modified (it still lacks the new column).
- The worktree's Prisma client was isolated from the main checkout's `node_modules`, so `prisma generate` could not change the generated client used by the Owner's main checkout (verified: main client unchanged).

## 4. Validation evidence

1. **`scripts/rt-100-validate-migration.mjs` — 46/46 checks** (local, throw-away databases): upgrade of legacy-shaped data (the four public ids): every pre-existing column of every row byte-identical after the migration, new columns `UNCLASSIFIED`/NULL, new tables empty; every database rule (PARTNER⇔partner both directions, Restrict on partner and on trips with private data, uniqueness, all rate checks, cascade of rates, slug format, defaults); `prisma migrate deploy` of the whole chain, **no drift** against `schema.prisma`, and the generated client; the dev-only seed (refuses remote, runs locally, idempotent, C2Rio INACTIVE, nothing commercial).
2. **Public before/after** (OLD = `origin/main` code on an unmigrated clone of the local dev database; NEW = this branch on a migrated clone; production builds of both; 26 URLs: Home, tours list, the 4 tour details × 3 locales, contact, about, planner, `/api/trips`, sitemap, robots and two 404s):
   - **22/26 byte-identical** after removing only framework scripts, hashed asset names, build ids, the new favicon `<link>` tags (RT-97, separate approved ticket) and sitemap timestamps;
   - **4/26** differ only by the order in which Next streams `<title>`/metadata; compared canonically (title + all `<meta>`/canonical/alternate tags, JSON-LD, all visible text) they are **identical**;
   - `/api/trips` identical (4 trips; keys `id,title,description,city,location`); **0 of 26** new responses contain `UNCLASSIFIED`, `operationType`, `partnerId`, `TripCommercial`, `netAmountCents`, `remunerationModel` or `tariffReference`.
3. **Unit/static tests:** full suite 747 passed / 6 skipped; `tsc` 0 errors; ESLint 0 errors (2 pre-existing warnings). New guards were each verified with a negative control (they fail when a violation is introduced).

## 5. Independent review and dispositions

Verdict: no blockers to the 12 conditions; CHANGES REQUESTED for the following, all addressed unless noted.

| Finding | Disposition |
|---|---|
| **Seed guard bypass (verified):** `postgresql://u:p@localhost/db?host=evil` passes a host-only check and `pg` would connect to `evil` | Fixed: URLs with `host`/`hostaddr`/`service` are rejected (tests + validator) |
| `ALLOW_REMOTE_SEED` override contradicts "development-only" | Removed entirely (no override exists; tested) |
| Privacy guard evadable (`include: { commercial: true }`, `.rates`, bracket access) | Fixed: patterns added; 4 evasion forms verified to fail the test |
| `/api/trips` check was a substring match | Replaced with a runtime test over the response keys |
| `getPublicTripById` join not asserted | Assertion added in `tests/public-trips.test.ts` |
| `ageMax` could be negative | CHECK extended; validator +1 check |
| Rollback note omitted `_prisma_migrations` | Added |
| Fail-open of the gate if a future caller omits the partner join | Covered by tests that assert both queries join the partner status |
| Partner could be ACTIVE without an approved three-locale label | **Deferred (Owner decision, see §7)** |
| No cross-table currency check; no uniqueness/overlap protection on rate rows | Deferred: add with the first real rate (needs the child-pricing decision) |

## 6. Deployment order (important)

The new code selects the new column and relation. **Apply the migration to a database before running this code against it.**
- Code deployed against a database without the migration → every query on `Trip` fails (Home, tours, tour detail, `/api/trips`, tour request).
- Code from before RT-100 keeps working **after** the migration alone (it never selects the new columns; defaults satisfy the CHECK).
- Therefore: (1) apply the migration to the target database (hosted Neon: only with the Owner's explicit authorization at release; it is additive and validated), then (2) deploy. A Vercel Preview of this branch will fail DB queries until the database it uses has the migration; this is why RT-100 lives on its own branch, separate from the favicon/documentation branch.
- Local development: run `prisma migrate deploy` against your local database before running this branch.

## 7. Open items and decisions (none blocks RT-100; needed before the first PARTNER tour is public)

1. **Disclosure label (new, from the review):** the gate only requires the partner to be ACTIVE. Decide whether a PARTNER tour may be public **without** an approved "Operated by …" label in all three locales; recommended: require it (a rule in the gate and/or at the ACTIVE transition). Related to Q2.
2. Q2 (partner display name and approved label PT/EN/ES), Q3 (contract form: markup vs commission), Q4 (currency), Q5 (who confirms a partner booking and how), and how to present child pricing (RT-101 Q4).
3. Deleting a trip that has a `TripCommercial` row now fails by design (Restrict): such trips must be unpublished, not deleted (`trip.service.ts` delete and `scripts/cleanup-trips.ts` will raise an FK error).

## 8. Not done (by design)

No admin UI, no public "Operated by" label, no classification of any tour, no partner tour, no tariff import, no payment fields, no change to bookings; the migration was **not** applied to any shared or hosted database.

## 9. Rollback

See the header of the migration file. The objects are new and nothing existing depends on them; dropping them restores the previous schema exactly.
