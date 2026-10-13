# RT-100 — Safe deployment, backup and recovery plan

- Scope: how the RT-100 migration (`20261013120000_rt100_operation_type_partner_commercial`) and code must be released **when the Owner authorizes it**. This document authorizes nothing: the Owner has **not** authorized any migration on the hosted Neon database, any merge to `main`, or any production publication (Owner decision, 2026-10-13).
- Status: plan only. Nothing in it has been executed against a shared or hosted database.
- Everything marked **[PROVEN]** was verified on throw-away local databases (`scripts/rt-100-validate-migration.mjs`, `scripts/rt-100-audit-checks.mjs`, public before/after comparison). Everything marked **[TO VERIFY]** depends on the Neon or Vercel consoles and must be confirmed by someone with access.

## 1. Facts that shape the plan

| Fact | Status |
|---|---|
| The migration is additive: no DROP/RENAME/UPDATE/DELETE/INSERT; new columns have defaults; new tables are created empty | **[PROVEN]** (static guard + 46 database checks) |
| Existing `Trip` rows are preserved column by column; they become `UNCLASSIFIED` through the column default | **[PROVEN]** |
| **Old code keeps working on a migrated database** (public pages identical to old code on the unmigrated database) | **[PROVEN]** — see the backward-compatibility run in the audit report |
| **New code fails on a database without the migration** (it selects the new column and relation) | Reasoned from the queries; Preview of this branch will fail until its database is migrated |
| The documented rollback restores the exact previous SQL schema and loses no legacy data | **[PROVEN]** (267 schema lines identical; legacy rows byte-identical) |
| `ADD COLUMN … NOT NULL DEFAULT <constant>` on PostgreSQL ≥ 11 is a catalog-only change (no table rewrite); the `CHECK` scans `Trip` once (the table is tiny); the new index is built non-concurrently (milliseconds) | PostgreSQL behaviour; confirm the Neon server version **[TO VERIFY]** |
| Which restore features the Neon plan offers (point-in-time restore window, branching) | **[TO VERIFY]** in the Neon console |
| Whether Vercel Preview deployments use the production database credentials | **[TO VERIFY]** — the repository documents it as "still to verify with the Owner's Vercel login" (`docs/ops/launch-readiness-infrastructure-dependencies.md`) |

## 2. Release order (never reversed)

1. **Owner written authorization** in Jira for: the exact target database, the release window and the exact commit.
2. **Back up** (section 3).
3. **Pre-checks** (section 4).
4. **Apply the migration** to the target database (section 5).
5. **Post-checks** (section 6).
6. **Only then deploy the new code** (a Preview/staging that points at a migrated database first, then production with the Owner's authorization).
7. **Smoke tests** (section 7).

Code from before RT-100 stays valid after step 4, so a failed or postponed code deploy never leaves the site broken.

## 3. Backup (step 2)

Do both when possible; the second is mandatory if the first is unavailable.
1. **Provider-level snapshot**: if the Neon plan offers branching or point-in-time restore, create a restore point and record its identifier/timestamp in Jira **[TO VERIFY]**.
2. **Logical backup**: `pg_dump -Fc` of the target database, run from a trusted machine, stored off-machine, with its SHA-256 recorded.
3. **Prove the backup is restorable**: restore the dump into a **local throw-away database** and compare row counts of `Trip`, `TripSchedule`, `Booking`, `User` with the production counts taken in section 4. A backup that has not been restored is not a backup.

## 4. Pre-checks (read-only, before applying)

- Confirm the target: the connection host and database name are exactly the intended ones (print host and `current_database()`; never print credentials).
- `prisma migrate status` against the target shows **exactly one pending migration** (RT-100) and **no failed/pending-resolution** migration.
- Record row counts (`Trip`, `TripSchedule`, `Booking`, `User`, `ContactSubmission`) and the list of published trips.
- Check for long-running transactions or open locks on `"Trip"` (`pg_stat_activity`); choose a low-traffic window.
- Run the release candidate's full test suite and the local validation scripts one more time on the exact commit.

## 5. Applying the migration (step 4)

- Run from a **clean checkout of the release commit**, with an **explicit** `DATABASE_URL` for the target. The Sprint 9 worktree deliberately contains no `.env*` files.
- Use `prisma migrate deploy`. **Never** `migrate dev`, `migrate reset`, `db push` or the seed on a shared or hosted database (`prisma.config.ts` auto-loads `.env`, which points at the hosted database).
- Consider a short `lock_timeout` for the session so the change fails fast instead of queueing behind a long transaction **[TO VERIFY how to pass it with the chosen tooling]**.
- Expected duration: seconds. If it fails, Prisma leaves the migration marked failed: stop, do not retry blindly, go to section 8.

## 6. Post-checks (read-only)

- `prisma migrate status`: database schema is up to date.
- Counts from section 4 are unchanged; every pre-existing `Trip` has `operationType = 'UNCLASSIFIED'` and `partnerId IS NULL`; `Partner`, `TripCommercial`, `TripCommercialRate` have 0 rows.
- The expected constraints exist (`Trip_partner_consistency_check`, rate checks, foreign keys with RESTRICT/CASCADE as designed).
- With the **old code still deployed**, the public site behaves exactly as before.

## 7. Code deploy and smoke tests (steps 6–7)

- Deploy to a Preview/staging connected to the migrated database; run the public Playwright suite (desktop + Pixel 7) and the 26-URL before/after comparison method used in the audit.
- After the Owner authorizes production: deploy, then run the same smoke list against production (Home in 3 languages, tours list, the four tour pages × 3 languages, `/api/trips`, sitemap, robots, one unknown tour → 404).

## 8. Recovery (decision tree)

| Situation | Action |
|---|---|
| New code misbehaves after deploy | **Roll the code back** (Vercel instant rollback to the previous deployment). The old code is compatible with the migrated schema **[PROVEN]**; the database stays as it is |
| Migration fails midway | Do not re-run. Inspect the failure; the migration is transactional per Prisma/Postgres conventions, so partial application is unlikely **[TO VERIFY on the target]**. Resolve with `prisma migrate resolve` only after understanding the state |
| Schema must be reverted | Run the **documented rollback SQL** from the migration header (tested: restores the exact previous schema). **First** confirm the new tables are empty or export their rows — rolling back drops `Partner`, `TripCommercial`, `TripCommercialRate` and their data. Then remove the migration's row from `_prisma_migrations` |
| Data corruption (not expected: nothing is updated or deleted) | Restore from the section 3 backup into a new database, verify, then switch — never overwrite blindly |

## 9. Preview and production isolation (finding, to be closed before any release)

- Until the Owner confirms in the Vercel project settings that **Preview** environment variables point to a **separate database**, assume a Preview can reach the production database. A Preview of code containing write paths (contact form, tour request, booking, admin) could then write to production data.
- Recommended: a separate Neon database/branch for Preview and Development, with `DATABASE_URL` scoped **Preview-only** in Vercel; production credentials scoped **Production-only**. Verify with `vercel env ls` (names and scopes only; values are not shown).
- Recommended code-level safeguard (needs an Owner-approved ticket): a small guard so Prisma CLI commands and the seed refuse a hosted database unless explicitly acknowledged; today only the seed has it.

## 10. What an agent will not do without explicit written authorization

Apply any migration to a hosted/shared database, run any seed there, merge to `main`, push to `main`, deploy to production, change Vercel or Neon settings, or read hosted data.
