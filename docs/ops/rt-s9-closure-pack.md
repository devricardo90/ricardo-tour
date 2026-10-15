# Sprint 9 closure pack — acceptance sheets, RT-79 treatment, RT-103 state, Sprint 10 conditions

- Date: 2026-10-15. Owner directive "SPRINT 9 CLOSURE". Sources: Volume I, Volume II (§5, §8, §11), Jira (RT-51, RT-79…RT-103, Sprint 8 = id 106).
- Supersedes for the Owner's reading the longer `docs/ops/rt-s9-103-gate-readiness.md` (kept as detail). No audit was repeated: the evidence below is the existing evidence, cited.
- Nothing was transitioned, moved, merged, migrated, deployed or pushed. Local commit only (branch `sprint9/rt-80-81-legal-drafts`, not pushed).

## 1. Acceptance sheets

### RT-98 — Catalog audit
| | |
|---|---|
| **Original criteria** | (1) audit document with fields/consumers and file:line; (2) OWN/PARTNER gaps split model vs content; (3) migration risks with additive recommendation; (4) no invented price/margin/commission. DoD: independent review, branch commit, Jira evidence. |
| **Evidence** | `docs/architecture/rt-s9-02-catalog-audit.md` (commit `3b2e0b2`); independent review 12/10 (1 error + 4 inaccuracies corrected); Jira 13373. |
| **Pending, out of scope** | None for RT-98. Finding F2 (P2) is fixed in `main` and was confirmed read-only in production on 15/10 (non-allowlisted id → 404). |
| **Recommendation** | **Technical acceptance: YES.** |

### RT-100 — OWN/PARTNER structure
| | |
|---|---|
| **Original criteria** | (1) additive migration validated on a local test DB, rollback documented; (2) current tours render identically; (3) no cost/margin/commission in public API/HTML (automated test); (4) OWN/PARTNER queryable on the server. DoD: independent review incl. data security; isolated branch; no push to main. |
| **Evidence** | Branch `sprint9/rt-100-catalog-structure` @ `9fff054`: 46/46 DB checks and rollback executed (`rt-100-implementation-evidence.md`); 26 URLs before/after identical; Playwright 44/0; leak test; gate 16/16; independent audit GO (`rt-100-independent-audit.md`). Governance record: Volume II §11 row 13/10 (written 15/10). |
| **Pending, out of scope** | Reduced scope to accept explicitly: OWN/PARTNER fixtures beyond the dev seed, public "Operado por…" label, P2 fix (already in `main`). Not part of acceptance and still forbidden: merge to main, Neon migration, publication (RT-104…108 deferred; Preview DB isolation = FAIL). Before any first PARTNER tour: risks 1, 4, 5 of the audit. |
| **Recommendation** | **Technical acceptance: YES**, with the reduced scope above recorded. |

### RT-102 — Booking/payment dependencies
| | |
|---|---|
| **Original criteria** | (1) `docs/architecture/rt-s9-06-booking-payment-dependencies.md`; (2) each dependency with Sprint 9 reservation, implementing sprint, Owner decision; (3) cross-references to RT-85/86/89/90 without duplication. DoD: independent review against schema and RT-65. |
| **Evidence** | Document (commit `4db49e4`), 14 dependencies, §5 cross-references; independent review 12/10; Jira 13376. |
| **Pending, out of scope** | Six payment questions, open by design for Sprint 13. Volume II §5 still says RT-85/RT-89 are reused for tours (they are flight-domain): correction recorded in §11 on 15/10; §5 text not rewritten. |
| **Recommendation** | **Technical acceptance: YES.** |

## 2. RT-79 — correct treatment

**Verified facts**
- Sprint 8 — Launch Readiness (Jira id 106) is **future, not open**; it holds RT-44…RT-51 and RT-76…RT-84 except RT-79/80/81, which were moved to Sprint 9 on 12/10 ("reutilizados, sem duplicação").
- **RT-79, RT-80 and RT-81 already block RT-51** (Jira links 10221, 10222, 10223, type Blocks). RT-51's description lists "media rights" and "legal pages (Privacy, Terms)" among its mandatory checks.
- RT-103 criterion 2: RT-79/80/81 "Concluído, or explicitly reassigned by the Owner with justification". Volume II §5: "não duplicar tickets existentes"; Sprint 8 "mantém … L-01 a L-09; tickets sobrepostos às Sprints 9–12 são reatribuídos, não duplicados".

**Treatment (complies with all three rules, no new ticket, no new link)**
1. RT-79 stays **one ticket**, status Em andamento, Hero rights **not approved** (code keeps `RIGHTS_NOT_VERIFIED`).
2. The traceable pending item tied to the Final Gate **already exists**: the link RT-79 → blocks → RT-51. RT-51 cannot pass while RT-79 is open.
3. At Sprint 9 closure, Jira asks where to move unfinished issues. The Owner chooses **Backlog** for RT-79 (not Sprint 8, which is not open). That choice, with the justification below, is the "explicit reassignment" RT-103 requires.
4. Justification to record: "RT-79 fica no backlog, bloqueando o RT-51. Única pendência: licença comercial do Hero NÃO VERIFICADA (decisão do Owner de 15/10: investigação adiada, substituição futura por fotos próprias). Os demais itens estão resolvidos por declaração do Owner."
5. Local work is not blocked: no code depends on RT-79.

## 3. RT-80 / RT-81 — drafts and pending decisions

**Drafts (local, production-hidden lab routes, noindex, not linked):**
- Privacy: `lib/legal/privacy-copy.ts` updated with proven facts only. It now discloses the login session cookie (Q2/G4) and the Oner widget (G1), reads contacts from `PUBLIC_CONTACT` (G8) and lists the open decisions. Preview: `/{pt,en,es}/rebuild-lab/privacy-draft`.
- Terms (new): `lib/legal/terms-copy.ts`, a factual skeleton. It states the request is not a booking, there is no online payment and prices are per person in R$; every undecided rule is a visible `PENDENTE (Qx)` block. Preview: `/{pt,en,es}/rebuild-lab/terms-draft`.
- Guards: `tests/legal-terms-copy.test.ts` checks: drafts PENDING, same sections and codes in 3 languages, placeholders for Q6/Q8/Q10/Q11, **no invented deadline, percentage, fee, guarantee, refund or jurisdiction**, contacts from `PUBLIC_CONTACT`. The privacy test is extended.

**Owner decisions still pending (9 + 2 confirmations):**
- Company and legal: Q1 identity (legal name, CNPJ, address, Cadastur number?), Q3 retention, Q5 ask Oner, Q11 legal review / law / venue.
- Commercial: Q6 operator of each of the 4 tours, Q7 confirmed-booking rule, Q8 cancellation/refund (after the agency research), Q9 when/how the customer pays, Q10 weather / age / physical rules.
- Confirm only: Q4 (policy without the Daniela section while disabled), Q12 (`/privacidade`, `/termos`).

## 4. RT-103 — exact state (15/10/2026)
| Criterion | State |
|---|---|
| 1 RT-97…RT-102 | RT-97 ✔, RT-99 ✔; RT-98/100/102 ready, **Owner acceptance pending**; RT-101 blocked, **block confirmed by the Owner on 15/10** ("RT-101 permanece bloqueado por decisão do Owner até análise contratual C2Rio") |
| 2 RT-79/80/81 | Open. RT-79: backlog at closure (§2), Owner's explicit word needed. RT-80/81: drafts ready; finish in Sprint 9 if Q1–Q12 arrive, else the same backlog treatment (both already block RT-51) |
| 3 OWN/PARTNER approved | ✔ 13/10 |
| 4 Nothing invented | ✔ (Terms guard adds an automated check) |
| 5 Evidence and reviews | ✔ for RT-98/100/102 |
| 6 Nothing published without authorization | ✔ (only RT-97) |
| Tests on the consolidated branch | **Not run.** Needs the local merge of the Sprint 9 branches (+ this drafts branch) and a local migrated DB; no push |
| DoD | Owner decision in Jira + Volume II, sprint closed only with confirmation |

## 5. Conditions to release Sprint 10
1. Owner accepts RT-98, RT-100 (with reduced scope) and RT-102 → Concluído.
2. Owner states the reassignment of RT-79 (and RT-80/81 if still open) to the backlog with the justification of §2.
3. Consolidated local run: lint, typecheck, unit tests, build and public Playwright on the merged Sprint 9 branches with a local DB; results attached to RT-103.
4. Owner gate decision recorded in RT-103 and Volume II §11; Sprint 9 closed in Jira with the Owner's confirmation (closing is one-way).
5. Sprint 10 (Jira id 177, "Sprint 10 — Tours & Content") holds **no tickets yet**; its Volume II scope (tour content, RT-78, photos with rights, Quem Somos replacement) needs the Owner's approval of the ticket list before it starts. Q6–Q10 answers feed both RT-81 and Sprint 10 tour content.
6. Push authorization for the local branches (this drafts branch is local only).

## 6. Update — 15/10/2026, after the Owner directive "Continuidade e preparação do gate"

### 6.1 RT-100 out-of-scope items: tracking in Jira (verified)
- **P2 (unpublished tour reachable by URL):** already **fixed in `main`** (`getPublicTripById` + `notFound()`; `docs/ops/backlog.md` marks RT-FINAL-HARDENING-01 "SUPERSEDED — corrigido em RT-FINAL-04D"; production probe 15/10: non-allowlisted id → 404). It has no Jira ticket and **needs none**; it is recorded in RT-98 (F2) and RT-100. Stale mentions to correct at the gate record: Volume II §4 ("Pendência P2 registrada") and §5 Sprint 11 scope ("correção da pendência P2"), which should read "verified fixed".
- **"Operado por…" public label:** tracked only in RT-100 comments and `docs/architecture/rt-s9-03-own-partner-model.md`; **no Jira ticket**. RT-101's scope does not include it. It only matters for the first PARTNER tour, which is blocked (RT-101). Proposal without duplication: add it as an explicit pre-publication condition on RT-101 (comment), together with the audit's other PARTNER prerequisites (booking must respect the public gate; approval gate for PARTNER publication). A separate ticket only when RT-101 is unblocked.

### 6.2 Consolidated local test run (RT-103 "Testes obrigatórios") — PASS
- Integration: local branch `sprint9/gate-integration-local` = `sprint9/rt-100-catalog-structure` (9fff054) + `sprint9/rt-80-81-legal-drafts` (which contains `sprint9/commercial-foundation` ccf6874), merge `cdf6b2e`, **no conflicts**, not pushed. Worktree without any `.env` file.
- Database: throw-away `rt100_gate`, a clone of the local dev database on Docker `localhost:5433`; **`DATABASE_URL` checked before use: host `localhost:5433`, db `rt100_gate`, no `neon` in the URL**. RT-100 migration applied only there (`prisma migrate deploy`). Database dropped after the run; the local `ricktravel` database was not modified.
- Results: lint 0 errors (2 pre-existing warnings in `scripts/rt-35-chrome-validation.mjs`); typecheck 0 errors; unit tests **761 passed / 6 skipped**; production build OK (dummy local secrets, dummy Resend key; no e-mail sent); public Playwright (desktop + Pixel 7) on `next start` against the migrated local DB: **44 passed / 0 failed** (including "concierge API closed" with `E2E_EXPECT_CONCIERGE_OFF=1`). Extra checks on the production build: `/pt/rebuild-lab/{terms,privacy}-draft` → 404 (hidden); tour page and `/api/trips` contain no `UNCLASSIFIED`/`operationType`/`TripCommercial`/`remuneration`.
- Not done (by restriction): no Preview/remote run, no push, no Neon or Vercel change.

### 6.3 RT-103 final checklist
| # | Item | State |
|---|---|---|
| 1 | RT-97, RT-99 Concluído | ✔ |
| 2 | RT-98 accepted by the Owner → Concluído | ☐ awaiting the Owner's explicit acceptance |
| 3 | RT-100 accepted (with reduced scope) → Concluído | ☐ awaiting the Owner's explicit acceptance |
| 4 | RT-102 accepted → Concluído | ☐ awaiting the Owner's explicit acceptance |
| 5 | RT-101 block accepted | ✔ Owner, 15/10 |
| 6 | RT-79 → Backlog with justification, link to RT-51 kept, Hero license NOT regularized | ☐ prepared; executed at sprint close with the Owner's word |
| 7 | RT-80/81 → Concluído (approved text + pages) or Backlog with justification (both already block RT-51) | ☐ drafts + v0.3 reconciliation ready; Owner decisions pending |
| 8 | OWN/PARTNER model approved | ✔ |
| 9 | Nothing invented (price, margin, commission, availability) | ✔ re-checked in the consolidated run |
| 10 | Evidence and independent reviews in each ticket | ✔ |
| 11 | Nothing published without authorization | ✔ (only RT-97) |
| 12 | Consolidated tests | ✔ local (6.2) |
| 13 | Gate decision recorded in Jira and Volume II | ☐ after items 2–7 |
| 14 | Sprint 9 closed in Jira with the Owner's confirmation | ☐ |
| 15 | Push of the local branches | ☐ needs specific authorization |
