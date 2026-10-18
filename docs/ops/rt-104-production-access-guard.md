# RT-104 — Production database access guard (local implementation, 18/10/2026)

- Owner authorization (18/10/2026): implement and test LOCALLY protections against accidental access to the production database by Prisma CLI commands and repository scripts. **Not authorized:** access to, change of, or migrations on the production (Neon) database; push, merge, deploy; production load; commercial publication.
- Plan of record: `docs/ops/rt-s9-infra-isolation-plan.md` §4.2 (untracked draft in the `rick-travel-s9` worktree). Related: RT-105…108 (still deferred), RT-113 / RT-119 (their hosted migrations/load stay blocked).
- Rule: **PRODUCTION DATABASE ACCESS = DENIED** by default. Insufficient evidence about the destination ⇒ block.

## 1. Risks found (audit)
1. **`prisma.config.ts` loaded the repository `.env`** (`import 'dotenv/config'`). In the main checkout `.env` holds the hosted (production) URL. As a result, any direct `npx prisma migrate deploy | migrate dev | db push | migrate reset | db execute` there targeted production. Prisma 7 does not load `.env` by itself (verified), so this import was the only path.
2. **Scripts that write data had no guard:**
   - `scripts/import-real-trips.mjs` (loads `.env`; create/update)
   - `scripts/translate-existing-trips.ts` (update)
   - `scripts/cleanup-trips.ts` (delete)
   - `e2e/global.setup.ts` (loads `.env`; deletes and recreates users)
3. **Scripts that read data had no guard:**
   - `list-users.ts` (personal data)
   - `list-trips.ts`, `check-db-images.ts`, `diagnose-trip-images.js`
   - `rt-53-catalog-audit.ts` (loads `.env`)
   - `rt-30-experiences-validation.mjs`
   - `rt-69-catalog-snapshot.ts` (falls back to `.env`)
   - `test-db.ts` (`check:db`, part of `preflight:staging`; loads `.env`)
4. **Existing guards trusted the host name only:**
   - the seed uses `isLocalDatabaseUrl`;
   - RT-100 / RT-113 / RT-119 and the RT-022A e2e test check for loopback and/or port 5433.

   A tunnel (`ssh -L 5433:…`) on localhost defeats all of them.
5. No CI exists, and `build` / `postinstall` (`prisma generate`) / `dev` / `start` never migrate (now asserted by a test).

## 2. Matrix — command | destination | risk | protection
| Command / script | Destination (variable) | Operation | Risk without guard | Protection now |
|---|---|---|---|---|
| `prisma migrate deploy` / `migrate resolve` | `DATABASE_URL` via `prisma.config.ts` | schema | applies migrations to whatever URL is loaded (was prod `.env`) | config guard: local+marker, or allowlisted hosted target (+ ack for production) |
| `prisma migrate status`, `migrate diff --from/to-config-datasource`, `db pull` | same | read | reads production schema | config guard (read) |
| `prisma migrate dev`, `migrate reset`, `db push`, `db execute`, `studio`, `mcp`, unknown commands | same | destructive | drops/rewrites data | config guard: **local isolated database only**, never hosted |
| `prisma db seed` → `prisma/seed.ts` | same | write | seeds fictitious data | config guard + seed's loopback check + script guard |
| `prisma generate`, `validate`, `format`, `version`, schema-only `migrate diff` | none | none | — | never blocked (no URL needed) |
| `--url`, `--from-url`, `--to-url`, `--shadow-database-url`, `--from/to-schema-datasource` | URL on the command line | any | bypasses `DATABASE_URL` | refused |
| `scripts/import-real-trips.mjs`, `translate-existing-trips.ts`, `rt-119-load-content.ts`, `rt-100-gate-integration.ts`, e2e RT-022A | `DATABASE_URL` | write | writes trips/bookings | script guard (write) |
| `scripts/cleanup-trips.ts`, `e2e/global.setup.ts`, `rt-113(b)-validate.ts`, `rt-119-verify-load.ts` | `DATABASE_URL` | destructive | deletes users/trips/content | script guard: local isolated only |
| `scripts/test-db.ts`, `list-*.ts`, `check-db-images.ts`, `diagnose-trip-images.js`, `rt-53`, `rt-30`, `rt-69`, `rt-119-trips-hash.ts` | `DATABASE_URL` | read | reads production (incl. users) | script guard (read) |
| `scripts/rt-57-production-launch-trips.mjs` | `RT57_TARGET_DATABASE_URL` (prod) / `.env.local` offline | write/read | historical production launch | own confirmations + script guard (hosted ⇒ target+allowlist+ack: denied today) |
| `scripts/rt-100-validate-migration.mjs`, `rt-100-audit-checks.mjs` | `RT100_ADMIN_URL` (admin, `postgres` db) | destructive (CREATE/DROP DATABASE) | — | own loopback check + script guard (marker on `postgres` db required); scratch DBs get the marker |
| `scripts/rt-113b-local-db.mjs`, `scripts/db/mark-local-database.mjs` | inside the Docker container (`docker exec`) | create/drop/mark | — | exempt: cannot reach another server by construction; throw-away names only |
| App runtime (`lib/prisma.ts`, Next.js) | `DATABASE_URL` of the deployment | read/write | — | **not covered** (D: deployment configuration) |

## 3. Protections implemented (A = repository scripts)
- **`lib/db/target-guard.mjs`** — pure decision logic. Never reports credentials, only host:port/database.
  - **Local:** all of the following must hold:
    - the host is a **literal** loopback address (`127.0.0.1` or `[::1]`) with an **explicit port**. The name `localhost` is refused, because it may resolve differently for the check and for the real connection;
    - at run time, the server reports the marker `rt.environment = 'local-isolated'` **stored for that database** (read from `pg_db_role_setting`, not the session, so `?options=-c …` / `PGOPTIONS` cannot fake it), and `current_database()` matches. The check runs in a sanitized child process.

    Neither loopback nor port 5433 alone counts as proof. `host.docker.internal` and private IPs are not local.
  - **Hosted / unknown:** requires `RT_DB_TARGET=preview|production` and a host in the committed allowlist `HOSTED_TARGETS`. The allowlist is **empty** today, so every hosted database is refused. Production additionally needs `RT_PROD_MIGRATION_ACK=RT-<n>`. Destructive operations are never allowed on a hosted database.
  - **Refused:** a missing or unparseable URL when a connection is needed; non-postgres protocols (e.g. `prisma+postgres://`); multiple hosts.
  - **Query parameters:** only an allowlist that cannot redirect the connection or alter the session is accepted (`schema`, `sslmode`, `channel_binding`, `ssl*` files, pool/timeouts, `application_name`, `pgbouncer`, `statement_cache_size`). Everything else is refused, e.g. `?host=`, `?hostaddr=`, `?port=`, `?user=`, `?options=`, `?service=`.
  - **`PG*` environment variables:** every one is refused except `PGPASSWORD`, `PGPASSFILE`, `PGAPPNAME` and `PGCONNECT_TIMEOUT`. `PGPORT`, `PGHOST` and `PGOPTIONS` could otherwise point the script at a different server than the one checked.
  - **Refused as conflicts:**
    - other connection variables (`DIRECT_URL`, `SHADOW_DATABASE_URL`, `POSTGRES_*`, …) pointing elsewhere;
    - `RT_DB_TARGET` contradicting the host;
    - a `VERCEL_ENV` that does not match;
    - an ack given for a non-production target.
  - Preview is never presumed to be production, and the reverse also holds.
- **`lib/db/guard-runtime.mjs`** — `assertDatabaseAccess` (scripts) and `guardPrismaCli` (Prisma CLI). Any error inside the guard means deny.
- **`prisma.config.ts`** — loads only `.env.local` and calls `guardPrismaCli(process.argv.slice(2))` before building the config. Every Prisma CLI command that uses this config is guarded, including direct `npx prisma …` calls, not only npm scripts.
- **Scripts** — 24 database-connecting files call the guard before connecting (`scripts/*`, `prisma/seed.ts`, `e2e/*`). A test fails if a new connecting script lacks it; the only exemptions are scripts that run `psql` inside the local container, each listed with its reason.
- **Playwright e2e** (`playwright.config.ts`, which creates and deletes users and bookings through the app):
  - guard at config load, reading `.env.local` only;
  - an explicit `DATABASE_URL` is passed to the `next dev` server it starts;
  - an already running server is never reused, and an external `PLAYWRIGHT_BASE_URL` is refused, because their database cannot be verified.

  The read-only public suite is unchanged.
- **Marker tooling** — `npm run db:mark-local -- <db>` runs `ALTER DATABASE … SET rt.environment` **inside** the local container. The throw-away helpers (`rt-113b-local-db.mjs`, RT-100 scratch DBs) mark the databases they create.
  - The developer's own local DB must be marked once, e.g. `npm run db:mark-local -- <your_local_db>`, and `.env.local` must use `127.0.0.1:<port>` instead of `localhost`. Until then scripts and Prisma refuse it (fail-closed).
  - The RT-100 audits mark their scratch databases over their own admin connection; that connection is itself guarded first.
  - The RT-100 audits also need `npm run db:mark-local -- postgres`.

## 4. What this does NOT protect (honest limits)
- **A. Repository paths only.** The guard runs inside `prisma.config.ts` and inside the repository's scripts. It does not protect:
  - Prisma with another config (`--config other.ts`) or a modified config;
  - `psql` / `pg_dump` or other tools;
  - ad-hoc code with its own client;
  - the Next.js runtime (`lib/prisma.ts`).

  Someone who edits the guard or the allowlist bypasses it. That edit is a visible code change.
- **B. Credentials.** The production URL still sits in the developer `.env` of the main checkout and in Vercel (Preview builds included, plan §4.6–4.7). The guard stops the repo from **using** it accidentally; it does not remove the secret. Recommended Owner actions: delete the hosted URL from the local `.env`; rotate the production credentials after the Preview DB exists (RT-108).
- **C. Database permissions.** The production role can still do anything. Real protection needs separate roles: a migrator role used only in the authorized procedure, and an app role without DDL (RT-106 / RT-108). Not done here: no hosted change is authorized.
- **D. Execution / infrastructure.** No CI or deployment control is touched (RT-107: production only by Owner promotion; RT-106: isolated Preview DB).
  - The marker is a stored database setting, so forging it needs `ALTER DATABASE` rights on the server being reached. Anyone who owns or administers a server can mark it. The marker defends against accidents (tunnels, wrong URLs), not against an attacker.
  - The in-container `psql` scripts and the helpers trust the local Docker context: a Docker context pointing at a remote engine is not detected.

## 5. Evidence (18/10/2026; no hosted database contacted; fictitious `.invalid` hosted URLs only)
| Check | Result |
|---|---|
| `tests/rt-104-db-guard.test.ts` | **34/34** — the 10 required scenarios plus the review bypass cases (`?port=`, `?options=`, `?user=`, `PGPORT`/`PGOPTIONS`/`PGDATABASE`/`PGUSER`/`PGSSLMODE`, `localhost`, missing port, `generate --sql`); Prisma command classification; `prisma.config.ts` loads only `.env.local` and guards before `defineConfig`; build/postinstall/dev/start/preflight never migrate; empty allowlist; every connecting script calls the guard |
| `scripts/rt-104-guard-integration.mjs` (real `npx prisma` and real scripts; throw-away `rt104_marked` / `rt104_unmarked`, dropped afterwards) | **40/40**. **Allowed** on the marked local DB: migrate deploy, status, diff from the config datasource (no drift), development seed, migrate reset. **Denied:** the unmarked loopback DB, for Prisma, the seed and scripts (the tunnel case). Marker injection via `?options=` / `PGOPTIONS`, `?port=`, `PGPORT` and `localhost`. Hosted URLs, for 4 Prisma commands and 5 scripts, even with `RT_DB_TARGET=production` plus an ack. Unknown host; missing URL; `DIRECT_URL` conflict; `RT_DB_TARGET` conflict; `db execute --url`; `?host=`; `PGHOST`; destructive commands on a non-local target; a closed loopback port (cannot verify). **Not blocked:** `validate` / `format` without a URL or with a hosted URL |
| RT-119 regression (load + verification on a fresh throw-away DB, now through the guard) | migrate deploy OK; load create (DRAFT); verification **51/51** |
| Full suite | 893 passed, 6 skipped (51 files) |
| `tsc`, ESLint (0 errors; 2 old warnings in `rt-35-chrome-validation.mjs`), `prisma validate`, `next build --webpack`, `git diff --check` | OK |

## 6. Independent review (18/10/2026)
The reviewer tried to bypass the guard through the project's own execution paths.

Fixed:
1. **`?port=` override (major):** the driver honours it, so the check and the real connection could reach different ports. Now only an allowlist of query parameters is accepted.
2. **`PGPORT` (major):** `pg` falls back to it when the URL has no port. Now every redirecting `PG*` variable is refused and local URLs must state their port.
3. **Marker forgeable through `?options=-c …` (major):** it set a session value. Now the marker is read from the stored database setting and `options` is refused.
4. **`prisma generate --sql` connects:** now classified as a read.
5. **The Playwright UI path was unguarded:** now guarded, with an explicit web-server environment, no server reuse and no external server.
6. **`localhost` can resolve two ways:** only literal loopback addresses are accepted.
7. **Coverage test:** now also detects `docker exec` and `npx prisma` scripts, with documented exemptions.

Confirmed correct by the reviewer:
- Prisma's own config loader does not read `.env`.
- Scripts that load `.env` are refused when it holds a hosted URL.
- `postinstall` / `next build` are unaffected.
- The `process.argv` handling works for npx, `.cmd` and bunx.
- Unknown or leading-flag commands fail closed.
- Every guarded script calls the guard before its first query.

Accepted limitations: see §4.

## 7. Operational closure (18/10/2026, Owner directive "Fechamento operacional e revisão")
No hosted database contacted; no credential printed; only host/port/database names and cluster identifiers recorded.

**Development database confirmed local:**
- **Container:** Docker container `ricktravel-db`, image `postgres:16` (PostgreSQL 16.11), published as `0.0.0.0:5433` and `[::]:5433` → 5432.
- **Docker context:** `desktop-linux` (local named pipe, not a remote engine).
- **WSL:** the only distro is `docker-desktop`.
- **Port 5433:** listened on only by `com.docker.backend` (`:::5433`) and `wslrelay` (`::1:5433`, Docker Desktop's IPv6 relay).
- **No tunnel or proxy:** no `ssh` / `plink` / `cloudflared` / `ngrok` / proxy process, and no `-L` / `-R` port forwarding in any command line.
- **Positive identity:** the Postgres `system_identifier` reached over TCP at `127.0.0.1:5433` and at `[::1]:5433` is **7604176269319524391**, equal to the one read inside the container (`docker exec … pg_control_system()`). Database `ricktravel`.
- **Variables:** `DATABASE_URL`, `PG*`, `RT_DB_TARGET`, `VERCEL_ENV`, `DIRECT_URL` and `POSTGRES_*` are not set in the shell, User or Machine environment.

**Next.js precedence:** `process.env` wins over `.env.local`, which wins over `.env`. Checked with `@next/env` in the main checkout: `next dev` and `next build` / `start` load `.env.local`, `.env` and resolve `DATABASE_URL` to the local `ricktravel` database. The hosted URL in `.env` is shadowed by `.env.local`.

**Tests:** Vitest loads no env file and no unit test reads `DATABASE_URL`. The e2e suite is guarded; the public Playwright suite does not touch the database.

**Applied:**
- `.env.local` (main checkout, git-ignored): host `localhost` → `127.0.0.1` in `DATABASE_URL` (one line).
- `npm run db:mark-local -- ricktravel`. The stored setting `ricktravel | {rt.environment=local-isolated}` is the only marked database.

**Continuity through the guard** (worktree, dev URL taken from `.env.local` without printing it):
- `prisma validate` OK;
- `prisma migrate status` reaches the dev DB;
- `check:db` ("Database connection OK").

**Negative controls:**
- The `.env` (hosted) URL is DENIED for Prisma and for `check:db` before any connection.
- The old `localhost` form is DENIED.
- **Precedence:**
  - a hosted URL in `process.env` wins over `.env.local` and is DENIED;
  - with no `process.env` value, `.env.local` is used and still verified;
  - a `.env` file is ignored.

  This was checked with temporary files containing fictitious URLs only, deleted afterwards.
- `channel_binding` (Neon SCRAM hardening, cannot redirect) was added to the allowed parameters; the host rules still decide.

**Residual risks (to the Owner):**
1. **The guard exists only on `sprint10/tours-content`.** `main` and the main checkout's branch (`daniela/rt-96-audit`) still have the old `prisma.config.ts` (`import 'dotenv/config'`), and the main checkout's `.env` holds the production URL. A direct `npx prisma migrate …` **in the main checkout** would still reach production until this branch is merged (merge not authorized), or until the hosted URL is removed from that `.env`.
   - Removing it is safe for `next dev`, which uses `.env.local`. It is an Owner decision because it touches a credential file.
2. **The dev DB is 5 migrations behind the repository:** `20261013120000_rt100…` and the four `rt113…` migrations. They were not applied; applying them locally is an Owner choice.
3. **Not covered:** credentials in Vercel and rotation (RT-108), database roles (RT-106 / 108), deployment control (RT-107).
4. Denial messages show the hosted **host name** (never user or password), to explain the refusal.

## 8. Final security review (18/10/2026, Owner directive "Revisão final de segurança")
Read-only checks; no secret printed; Neon not accessed; Vercel only read for project metadata (no environment values read).

**Git — true state:**
- **Local:**
  - current branch `sprint10/tours-content` at `7fe2e6f`, clean, **no upstream**;
  - local commits not on the remote: `7a044b5`, `444aae5`, `23cb3d0`, `7fe2e6f` (and the earlier Sprint 10 commits);
  - local `main` = `40136a3`, unchanged, one commit behind `origin/main`.
- **Remote (`git ls-remote`):**
  - no `sprint10/*` branch exists;
  - `origin/main` = `a4a7252` (RT-97 favicon, 14/10/2026, the last authorized publication);
  - none of the RT-104 / RT-119 commits is on any remote ref.
- **Push:** none. No report of this work states a push; every report records "no upstream, nothing pushed".
- **Deploy:** none. The Vercel project's last update is 14/10/2026 (RT-97). The deployment list returned 403 to this token and the Vercel CLI is not installed, so this conclusion rests on that indirect evidence plus the absence of any push (deploys are push-triggered).

**Credential files:**
- `.env*` has been git-ignored from the start (`.gitignore:42`). No env file has ever been committed on any ref.
- The history scan found only fictitious test URLs (placeholder passwords, reserved hosts, `127.0.0.1`).
- The production **host name** (no password) appears in the RT-57 script (`e5df179`, `ALLOWED_HOST`). That is low risk in a private repository.
- `.env.example` holds the local example only.

**Checkouts:**
- Only the main checkout's `.env` holds a hosted `DATABASE_URL`, and it has one `DATABASE_URL` line.
- `rick-travel/.env.local` → `127.0.0.1:5433/ricktravel`; `rick-travel-rt97/.env.local` → `localhost:5433/ricktravel` (local); the other worktrees have no env files.
- No database variables in the shell, User or Machine environment.

**Removing the production `DATABASE_URL` from the main checkout's `.env`: STOPPED before removal.** The Owner's condition, "credential preserved in secure storage", could not be confirmed:
- the Owner's password manager cannot be inspected;
- verifying the Vercel copy would require reading the secret value, which was deliberately not done.

Locally the removal is safe:
- `.env` keys: `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`. Only `DATABASE_URL` would be removed.
- `.env.local` defines `DATABASE_URL` and wins in Next.js.
- In the main checkout's old configuration, Prisma CLI commands would then have no URL and fail closed.

**Pending migrations on the dev DB (static analysis only; not executed):**

| Order | Migration | Changes | Data |
|---|---|---|---|
| 1 | `20261013120000_rt100_operation_type_partner_commercial` | 5 enums; `Trip` + `operationType` (NOT NULL DEFAULT 'UNCLASSIFIED') + `partnerId` (nullable, FK `Partner`); new `Partner`, `TripCommercial`, `TripCommercialRate`; 9 CHECKs | additive; existing trips become UNCLASSIFIED with no partner (satisfies the partner CHECK); rollback in the header (no `rollback.sql` file) |
| 2 | `20261016120000_rt113_tour_content_gallery` | 2 enums; new `TripContent`, `TripItineraryStop`, `TripImage` (FK `Trip`, cascade); CHECKs | additive, new tables empty |
| 3 | `20261017180000_rt113_faq_conditions_media` | `TripContent` + 2 JSONB; `TripImage` + credit / `mediaType` (DEFAULT 'IMAGE') / poster / mobile / duration; new `TripFaqItem`; CHECKs | additive; depends on 2 |
| 4 | `20261017200000_rt113_approval_fingerprint` | `TripContent` + `approvedContentHash` + CHECK | additive; depends on 2 |
| 5 | `20261017220000_rt113_durable_approval_media_publication` | 3 nullable columns; 1 CHECK; functions and triggers on `TripContent` / `TripItineraryStop` / `TripFaqItem` / `TripImage` / `Trip` | additive; the `Trip` trigger only reads `Trip` and writes `TripContent` when content is approved (none); depends on 2, 3 and 4 |

No column is dropped, renamed or re-typed, and no existing row is rewritten. RT-100 is independent of RT-113 (both only reference `Trip`), but `schema.prisma` and the code expect all five, so they must be applied together, in timestamp order (1 → 5). None of the five is on `origin/main`.

**Re-run:** full suite 893 passed / 6 skipped; `tsc` OK; working tree clean before this note.
