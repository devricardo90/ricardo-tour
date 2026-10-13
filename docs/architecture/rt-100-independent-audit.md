# RT-100 — Independent final audit

- Ticket: RT-100 (RT-RB-S9-04). Branch `sprint9/rt-100-catalog-structure` @ `044c4e5` (audit date 2026-10-13). Base: `origin/main` @ `40136a3`.
- **Recommendation: GO for technical acceptance — READY FOR OWNER ACCEPTANCE**, with the conditions in §8.
- Not authorized and **not done**: merge to `main`, any migration on the hosted Neon database, any production publication, any access to a remote database, Vercel or Neon console. Sprint 9 is **not** closed.

## 1. How this audit was made (independence)

- The **audit** (code, tests, SQL, documents, Google Docs, Jira) was performed by a separate reviewing agent that did not write the code, in **read-only** mode (no scripts, builds, databases or credentials). Its findings are quoted here with their evidence.
- The **evidence runs** (database scripts, builds, Playwright) were executed by the implementer on throw-away LOCAL databases. The auditor could not re-run them; they are listed as claims with the exact command so the Owner or anyone can repeat them (§3).
- Nothing here relied on, or touched, the hosted Neon database.

## 2. Result per category

| | Category | Result | One-line reason |
|---|---|---|---|
| A | Database safety | **PASS WITH CONDITIONS** | The seed guard holds, but no technical guard exists for Prisma CLI/`migrate` or the other mutating scripts; Preview-vs-production isolation is **unverified** |
| B | Migration safety | **PASS** (SQL) / **CONDITIONS** (plan) | SQL is additive and data-preserving; rollback proven; recovery plan has `[TO VERIFY]` items that need the Neon/Vercel consoles |
| C | Commercial data security | **PASS WITH CONDITIONS** | No leak path; inactive partners and incomplete operator labels are blocked; only 1 of the Owner's 6 PARTNER publication prerequisites is enforced by code |
| D | Public website | **PASS WITH CONDITIONS** | No content/markup regression on 26 URLs and the full Playwright suite; no pixel comparison, no production data, builds are local |
| E | Governance | **PASS WITH CONDITIONS** | Sprint 9 open; Jira consistent; the Google Docs do not yet record the 13/10 decisions (text to paste in §9) |

## 3. Objective evidence (all on local, throw-away databases)

| Evidence | Result | Reproduce |
|---|---|---|
| Migration validation: legacy-data upgrade, every database rule, `prisma migrate deploy` + zero drift, Prisma client, dev-only seed | **46/46** | `node scripts/rt-100-validate-migration.mjs` |
| **Documented rollback executed**: SQL schema identical to a database built from the pre-RT-100 migrations (267 lines, 0 differ); legacy rows byte-identical; no RT-100 object left | **9/9** | `node scripts/rt-100-audit-checks.mjs` |
| **Real public gate through real Prisma** on a migrated database: inactive partner, partner without ES/blank/no operator label, full label, private-data leakage (amount, notes, tariff reference, model, status never in output), server-side filters | **16/16** | same command |
| Public site before/after: `origin/main` code on an unmigrated clone vs this branch on a migrated clone (production builds), 26 URLs | 22 byte-identical + 4 canonically identical; `/api/trips` identical; **0** internal/private tokens in the 26 new responses | method in the evidence doc §4 |
| **Backward compatibility:** OLD code on the MIGRATED database vs OLD code on the unmigrated one, 26 URLs | 19 byte-identical + 7 canonically identical; **0** differences in content | same method |
| Playwright public suite (desktop Chromium + Pixel 7), production build of this branch on a migrated clone, **default flags (concierge off), minimal environment** | **44 passed, 0 skipped, 0 failed** | `E2E_EXPECT_CONCIERGE_OFF=1 PLAYWRIGHT_BASE_URL=… npx playwright test -c playwright.public.config.ts` |
| Unit/static tests | **753 passed, 6 skipped**; `tsc` 0 errors; ESLint 0 errors (2 pre-existing warnings) | `npx vitest run` |

**About the Playwright run (Owner question D).** It ran against a **local production build** (`next build` + `next start` on `127.0.0.1`) connected to a migrated, throw-away clone of the local development database — **not** against a remote Preview or production. Projects: `desktop` (Desktop Chrome) and `mobile` (Pixel 7).

**The two tests that were skipped in the first run** were a single test, *"concierge API is closed on a default (flag-off) server"* (`e2e/public/public-critical-flows.spec.ts:81`), counted once per project. It is **opt-in by design**: it only runs when `E2E_EXPECT_CONCIERGE_OFF=1` is set, because it must be run against a server started with the default flags (the Owner's local `.env.local` may enable features). It concerns the AI concierge, not RT-100. **It has now been run** against a default-flag server with a minimal environment (database and dummy secrets only): **passed on desktop and mobile**, confirming the concierge API is closed. The full suite with it enabled: 44/44.

## 4. Findings by category

### A. Database safety — PASS WITH CONDITIONS
- **Seed guard holds** (`prisma/seed.ts` → `lib/db/local-database.ts`): local hosts only; rejects `host`/`hostaddr`/`service` query parameters (a verified `pg` bypass found and fixed in review); no override variable (asserted by test).
- **No other guard exists.** `prisma.config.ts` does `import 'dotenv/config'`, which loads `.env` (hosted database). `scripts/validate-env.ts` only checks that `DATABASE_URL` is a PostgreSQL URL. `package.json` has no guard on any script. `scripts/cleanup-trips.ts`, `import-real-trips.mjs` and `translate-existing-trips.ts` write to the database with no local-only check. A `prisma migrate deploy` / `db push` in a checkout whose `.env` points at Neon would run against Neon. The only protection used in this work was deleting `.env*` from the Sprint 9 worktree (a manual step).
- **Preview vs production credentials: UNVERIFIED.** The repository states it is "still to verify with the Owner's Vercel login" (`docs/ops/launch-readiness-infrastructure-dependencies.md:36`); `docs/ops/secrets.md:40` states an *intent* to isolate staging. History shows the seed was run against Neon production by hand (`docs/ops/execution-log.md`). No Vercel/Neon access was used, as instructed.

### B. Migration safety — PASS (SQL); CONDITIONS (plan)
- Line-by-line: nothing dropped, renamed, updated, deleted or inserted; constant-default `ADD COLUMN` (metadata-only on PostgreSQL ≥ 11); the CHECK scans a tiny table once; brief locks only; FKs are Restrict (partner, commercial) and Cascade only for rates under their commercial row. CHECK constraints verified correct, including the new `ageMax >= 0`.
- **Compatibility between versions — proven:** old code works on the migrated database (§3); new code **fails** on an unmigrated database (it selects the new column and relation), so the order is **migration first, code second**. A Preview of this branch will fail every `Trip` query until its database is migrated.
- Rollback restores the exact previous schema (§3). Rolling back **after** any Partner/commercial data exists loses that data (warned in the plan).
- `docs/ops/rt-100-deployment-backup-recovery-plan.md` (release order, backup, pre/post checks, decision tree). **Gaps the auditor found, to close before any release:** use Neon's *direct* (non-pooled) connection string for `migrate deploy`; an explicit "freeze other deployments/writes and confirm no other pending migration" step; the dump tool must be version-compatible with the server; Neon restore capability, server version, "transactional" behaviour and `lock_timeout` are `[TO VERIFY]`.

### C. Commercial data security — PASS WITH CONDITIONS
- Verified: no application source references the private tables or fields (static scan with negative controls); the gate selects only the partner status and approved public label; `/api/trips` returns exactly `id,title,description,city,location` (runtime test); an inactive partner hides its tours; an active partner without the operator identified in PT, EN **and** ES also hides them; private fixtures never appear in the gate output.
- **A PARTNER tour cannot become public by a database change alone** *for a trip that is not in the code allowlist* (`LAUNCH_TRIP_IDS`). The allowlist is a code change, and `main` auto-deploys production, so that control is a **code review, not a technical barrier**.
- Limits: the privacy guards are static regex scans (a dynamically built `select` could evade them); the admin list now carries `operationType`/`partnerId` (no commercial data, admin-only).

### D. Public website — PASS WITH CONDITIONS
- The method supports "no content/markup regression" on one dataset. Limits: **no pixel/screenshot comparison** (the RT-100 Jira evidence list mentions before/after captures); the data is a local clone, not production data; builds are local; nothing time-dependent was exercised. The only runtime change on the public path is one extra join plus a rule that cannot fire for UNCLASSIFIED rows.

### E. Governance — PASS WITH CONDITIONS
- Sprint 9 is `active` in Jira (id 176), RT-103 open, RT-100 in *Revisar*. Acceptance criteria 1–4 and the Definition of Done in the RT-100 description are covered by §3 (criterion 4, server-side filtering, by the 16-scenario gate script). Written scope **not delivered** by Owner decision of RT-99 (structure only): fixtures with an OWN and a fictitious PARTNER tour, the visitor-facing "Operated by" label (Sprint 10), and the P2 fix. The Jira description was not rewritten; the narrowing is recorded in the RT-99/RT-100 comments and the evidence doc §8.
- **The Google Docs record none of the 2026-10-13 decisions** (Volume II unchanged since 12/10 17:59; Volume I only gained the pointer). Paste-ready text is in §9.

## 5. Risk register

| # | Severity | Risk | Evidence | Mitigation | Blocks RT-100 acceptance? |
|---|---|---|---|---|---|
| 1 | **HIGH** | Only 1 of the Owner's 6 PARTNER prerequisites is enforced by code (and partly); an incomplete PARTNER record can go public once its id is added to `LAUNCH_TRIP_IDS` with an active partner holding a 3-language label | `lib/catalog/public-trips.ts` gate; §6 | Positive publication check (approved tariff status, confirmed conditions, reviewed information, image rights, booking compatibility) before any PARTNER tour; CI check that `LAUNCH_TRIP_IDS` changes need an approval record | **No** — blocks publishing a PARTNER tour |
| 2 | **HIGH** | Applying the migration/deploying against hosted data while Preview/production isolation is unverified; a Preview of code with write paths pointed at production credentials could write to production | recovery plan §1/§9; infra doc line 36 | Owner checks Vercel environment scopes; separate Preview database; migrate first, deploy second | **No** — blocks applying the migration and any Preview/deploy |
| 3 | **HIGH** | No technical guard on Prisma CLI, `migrate` or the other mutating scripts | `prisma.config.ts`, `scripts/validate-env.ts`, three mutating scripts | Wrapper/guard that refuses a hosted URL unless explicitly acknowledged (needs an Owner-approved ticket; touches every Prisma command, including the Vercel build's `prisma generate`) | **No** — blocks applying the migration to hosted data |
| 4 | MEDIUM | Reclassifying an allowlisted PARTNER trip to OWN/UNCLASSIFIED by a database edit removes every PARTNER rule while the trip stays public | gate rules apply only when `operationType = PARTNER` | Audit trail on `operationType`; positive publication check (risk 1) | No — blocks publishing a PARTNER tour |
| 5 | MEDIUM | Booking creation ignores the public gate: `POST /api/bookings` (login required) calls `createBookingForUser`, which loads the trip by id with no `isPublished`/gate check. **Pre-existing** (same class as pendency P2); hidden or PARTNER trips could be booked by id by an authenticated user | `app/api/bookings/route.ts`, `lib/services/booking.service.ts:171-215` | Apply the same gate to booking creation (Owner prerequisite 6) | No — blocks publishing a PARTNER tour |
| 6 | MEDIUM | Source of truth does not reflect the 13/10 decisions | Drive metadata; §4 E | Paste §9 into Volume II; keep Jira in sync | Governance — before recording acceptance |
| 7 | MEDIUM | Recovery-plan gaps (pooled vs direct connection, Neon capabilities/version, `lock_timeout`, freeze step) | plan; §4 B | Close each before release | No — blocks applying the migration |
| 8 | MEDIUM | "No regression" is local, text/markup only; no screenshots | §4 D | Run the comparison on a migrated Preview; add screenshots | No — blocks release |
| 9 | LOW | Branch mixes RT-97/98/99/101/79/80/81 docs and the favicon with RT-100; the RT-100 diff cannot be accepted or reverted in isolation | `git diff --stat` | Owner decides integration order (see `docs/ops/sprint9-git-integration-strategy.md`) | No |
| 10 | LOW | Static privacy guards can be evaded by dynamic code; admin serialization not covered | `tests/rt-100-commercial-privacy.test.ts` | A runtime test on real queries exists (`rt-100-gate-integration.ts`); keep it in CI | No |
| 11 | LOW | `PG*` environment variables are not examined by the seed guard | `lib/db/local-database.ts` | Document; low likelihood | No |

## 6. The Owner's six PARTNER publication prerequisites — what code enforces today

| Prerequisite | Enforced by code? |
|---|---|
| Operator identified and validated | **Partly.** The partner must be ACTIVE and have non-blank text in PT, EN and ES. Nothing records *who* validated it |
| Commercial tariffs approved | **No.** `TripCommercial.recordStatus = APPROVED_FOR_PUBLICATION` exists in the schema but no gate reads it (and the gate must not read private data without a deliberate design) |
| Operating conditions confirmed | **No** (no field) |
| Public information reviewed | **No** (only the pre-existing integrity rules) |
| Image rights verified | **No** (only a placeholder-image check) |
| Booking flow compatible with the operator | **No** (risk 5) |

**Can an incomplete PARTNER record be published accidentally?** Only if a reviewed code change adds its id to `LAUNCH_TRIP_IDS` *and* the partner is active with the 3-language label; nothing else would be checked. So today the real control is **Owner/code review plus the process**, not the software. Until the follow-up below exists, **no PARTNER tour may be published**, which is consistent with the Owner's decision.

## 7. Unverifiable items (and how to close them)

- Neon server version, restore/branching capability, and whether Preview uses production credentials → needs the Neon and Vercel consoles (`vercel env ls` shows names and scopes only).
- Evidence numbers were produced by the implementer; the auditor could not re-run them (commands in §3).
- Visual regression (no screenshots); behaviour on production data.
- Pre-existing items not traced: whether pendency P2 still exists on other routes.

## 8. Recommendation and conditions

**GO — technical acceptance of RT-100 as a structural change. READY FOR OWNER ACCEPTANCE**, with these conditions:
1. **Governance record updated** (Jira RT-100/RT-103 to commit `044c4e5`; the evidence doc; the Google Docs with §9). *Jira and the evidence doc are updated with this report; the Google Docs need the Owner's paste (§9).*
2. **The Owner explicitly accepts the narrowed scope** (fixtures with an OWN and a fictitious PARTNER tour, the public "Operated by" label and the P2 fix are outside RT-100).

**Do NOT proceed to these steps until their own conditions are met:**
- **Applying the migration to hosted Neon:** the Preview/production credential question closed (risk 2), an automated guard on Prisma commands (risk 3), recovery-plan gaps closed (risk 7), and the Owner's written authorization.
- **Publishing any PARTNER tour:** an enforced approval gate (risk 1), the booking gate (risk 5), an audit trail on `operationType` (risk 4), and the Owner's answers to Q2–Q5 and the child-pricing decision.
- **Merge to `main` / production publication:** only on the Owner's explicit authorization.

**Proposed follow-up tickets (not created; each needs the Owner's approval):** (a) PARTNER publication approval gate + CI check on the allowlist + `operationType` audit trail (risks 1, 4); (b) booking creation respects the public gate (risk 5); (c) automated guard for Prisma CLI and mutating scripts (risk 3); (d) Vercel/Neon isolation verification and a separate Preview database (risk 2); (e) before/after screenshots on a migrated Preview (risk 8).

## 9. Text to add to the Google Docs (Volume II, section "Change Log")

> **13/10/2026 — Decisões do Owner (Sprint 9).** RT-97: favicon aprovado (letras RT em dourado sobre fundo escuro em 16 px; monograma oficial completo a partir de 32 px); nada publicado. RT-99: arquitetura comercial OWN / PARTNER / UNCLASSIFIED aprovada; os quatro passeios públicos permanecem inalterados e sem classificação definitiva; `prisma/seed.ts` somente para desenvolvimento; estrutura própria para o parceiro C2Rio sem publicar passeios; nenhuma tarifa, comissão ou markup presumido; dados financeiros privados nunca expostos; banco Neon de produção não modificado. RT-100 (estrutura) implementado e auditado; aceite técnico recomendado (GO). **Passeios PARTNER:** o operador real deve ser identificado em PT, EN e ES; nenhum passeio PARTNER pode ser publicado sem operador validado, tarifas comerciais aprovadas, condições de operação confirmadas, informações públicas revisadas, direitos de imagem verificados e fluxo de reserva compatível com o operador. **Não autorizados:** merge na main, migrations no Neon de produção, publicação em produção. O RT-103 e a Sprint 9 permanecem abertos.
