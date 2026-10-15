# RT-103 — Sprint 9 gate readiness and pending acceptances (RT-98, RT-100, RT-102)

- Date: 2026-10-15. Sources read first: Volume I, Volume II (§5, §8, §11), Jira RT-79…RT-103 (descriptions and all comments).
- **Nothing was closed, transitioned, merged, migrated or deployed.** No Neon or Vercel change. Sprint 10 not started. This document only prepares the Owner's decisions.

## 1. RT-103 criteria — where each stands

| # | Criterion (RT-103) | State on 15/10/2026 | Missing |
|---|---|---|---|
| 1 | RT-97 to RT-102 Concluído, or Owner block registered and accepted | RT-97 ✔ Concluído (published 14/10). RT-99 ✔ Concluído. RT-98, RT-100, RT-102: Revisar, all criteria evidenced (§2). RT-101: Revisar + `blocked`; the Owner stated on 15/10 "RT-101 — continuar bloqueado pelo contrato" | Owner acceptance of RT-98, RT-100, RT-102. RT-101: the 15/10 statement is recorded as the Owner's acceptance of the block (confirm). |
| 2 | RT-79, RT-80, RT-81 Concluído, or explicitly reassigned by the Owner with justification | All three Em andamento. RT-79: everything resolved except the Hero license (§3). RT-80/81: 9 Owner answers + legal review pending (`docs/legal/rt-s9-80-81-legal-pages-preparation.md` §7) | Owner: reassign RT-79 now (proposed); RT-80/81 either answered and built in Sprint 9 or reassigned (§3). |
| 3 | OWN/PARTNER model approved | ✔ Owner Gate RT-99, 13/10 | — |
| 4 | No invented price, margin, commission or availability | ✔ RT-99/RT-100 evidence: monetary tables created empty, no values in seed/docs; the 4 public prices are the existing approved ones | Re-check at the consolidated run (step 4 below). |
| 5 | Tests and independent reviews attached to each ticket | ✔ RT-98, RT-100, RT-102 have independent-review records in Jira | — |
| 6 | Nothing published without express authorization | ✔ Only RT-97 in production (express authorization 14/10) | — |
| Tests | Public Playwright, lint, typecheck, build **on the consolidated branch** | Not yet: the two Sprint 9 branches are separate (`sprint9/commercial-foundation` docs+favicon; `sprint9/rt-100-catalog-structure` = an older state of the first + RT-100) | Step 4 below. |
| DoD | Owner decision recorded in Jira and Volume II; sprint closed only with confirmation | Pending | Steps 5–6 below. |

## 2. Acceptance sheets

### RT-98 — Catalog audit (Revisar)
| Criterion | Evidence | Status |
|---|---|---|
| 1. `docs/architecture/rt-s9-02-catalog-audit.md` maps fields and consumers with files/lines | Document on `sprint9/commercial-foundation` (commit `3b2e0b2`), §1–§2 | ✔ |
| 2. OWN/PARTNER gaps split into "missing in the model" vs "missing in the content" | §5 | ✔ |
| 3. Migration risks with additive recommendation | §6; the recommendation was then implemented additively in RT-100 | ✔ |
| 4. No invented price/margin/commission | Hosted DB not read; no values | ✔ |
| DoD: independent review, corrections applied | Jira comment 12/10 (1 substantive error + 4 inaccuracies corrected) | ✔ |
| Follow-up re-checked 15/10 | F2 (P2, unpublished tour reachable by URL): code fix still on `main` (`getPublicTripById` + `notFound()`, `app/[locale]/(site)/tours/[id]/page.tsx:47-50`); **runtime probe on production (read-only): a non-allowlisted id (`seed-007-helicoptero-cristo`) and an unknown id return 404; a public tour returns 200** | Informative |

**Owner decision needed:** accept the audit (→ Concluído).

### RT-100 — OWN/PARTNER structure (Revisar)
| Criterion | Evidence | Status |
|---|---|---|
| 1. Additive migration validated on a local test DB; rollback documented | 46/46 DB checks; rollback executed (0 schema differences) — `docs/architecture/rt-100-implementation-evidence.md`, `rt-100-independent-audit.md` (branch `sprint9/rt-100-catalog-structure` @ `9fff054`) | ✔ |
| 2. Current tours render identically | 26 URLs before/after (22 byte-identical, 4 content-identical); Playwright 44/0 | ✔ |
| 3. No cost/margin/commission in public API/HTML (automated test) | Leak test + 0/26 responses with private fields | ✔ |
| 4. OWN/PARTNER type queryable/filterable on the server | Gate 16/16 scenarios | ✔ |
| DoD: independent review incl. data security | Audit GO (13/10) | ✔ |
| Audit condition (1): governance record in the Google Docs | **Done 15/10**: Volume II §11 row "13/10/2026" with the audit §9 text | ✔ |
| Audit condition (2): Owner accepts the reduced scope | Out of RT-100 by design: OWN/PARTNER test fixtures beyond the dev seed, the public "Operado por…" label, the P2 fix (already in `main`, see RT-98) | **Owner** |

**Not part of acceptance (unchanged, Owner decisions of 13–14/10):** no merge to `main`, no Neon migration, no production publication; deployment order "migration first, then code" only with express authorization and an isolated Preview DB (RT-104…108 deferred). **Owner decision needed:** accept the delivered scope (→ Concluído) and the reduced scope above.

### RT-102 — Booking/payment dependencies (Revisar)
| Criterion | Evidence | Status |
|---|---|---|
| 1. `docs/architecture/rt-s9-06-booking-payment-dependencies.md` | On `sprint9/commercial-foundation` (commit `4db49e4`) | ✔ |
| 2. Each dependency: what Sprint 9 reserves, which sprint implements, which Owner decision | §3 (14 dependencies) and §4 (questions) | ✔ |
| 3. Cross-references to RT-85/86/89/90 without duplication | §5 | ✔ |
| DoD: independent review against schema and RT-65 | Jira comment 12/10 | ✔ |
| Correction raised by RT-102 | Volume II §5 (Sprint 13) still says RT-85/RT-89 are reused for tours; they are flight-domain. **Recorded 15/10 in Volume II §11** (change log), §5 text left untouched | Informative |

**Owner decision needed:** accept the mapping (→ Concluído). The six payment questions stay open for Sprint 13 by design.

## 3. RT-79, RT-80, RT-81 — reassignment evaluation

| Ticket | Remaining | Can Sprint 9 finish it? | Proposal (Owner decides) |
|---|---|---|---|
| RT-79 | Only the Hero commercial license (Owner decision 15/10: NOT VERIFIED, investigation deferred, future replacement with own photos) | No: depends on the Owner's archive or new photography | **Reassign to Sprint 8 — Launch Readiness** (its original sprint; RT-51 already gates media rights) with residual scope "Hero license evidence or replacement before RT-51". Keep Em andamento. Never mark the Hero as approved. |
| RT-80 | 4 company/legal answers (Q1, Q3, Q5, Q11), 2 confirmations (Q4, Q12), legal review | Yes, if the answers and the review arrive before the gate; the build is ~1 task once the text is approved | Keep in Sprint 9 while the Owner answers; if the gate is reached first, reassign to Sprint 8 with the same justification as RT-79. |
| RT-81 | RT-80's company/legal answers + 5 commercial policies (Q6–Q10), Q8 waits for the agency research | Unlikely before the gate: Q8 depends on research in progress | Same as RT-80; Sprint 10 (tour content: "política" per tour) consumes the same answers, so the policies can be decided once for both. |

## 4. Closing sequence (when the Owner decides)
1. Owner accepts RT-98, RT-100, RT-102 → transition to Concluído.
2. Owner confirms RT-101 block acceptance (already stated 15/10) → recorded.
3. Owner reassigns RT-79 (and, if still open, RT-80/81) with justification → move to Sprint 8 in Jira.
4. Consolidated branch (local only, no push to `main`): merge `sprint9/commercial-foundation` into a copy of `sprint9/rt-100-catalog-structure`; run lint, typecheck, unit tests, build and the public Playwright suite against a **local** migrated database; attach results to RT-103.
5. Record the Owner's gate decision in Jira (RT-103) and Volume II §11.
6. Close Sprint 9 in Jira only with the Owner's confirmation. Sprint 10 starts only after that, per Volume II.
