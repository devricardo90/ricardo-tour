# Visual Rebuild — Source of Truth Registration and Governance Conventions

## Baseline

- Branch: `main`
- HEAD at registration: `fec15afa8b41abf969a1ea949a945fbbceaed04b` (HEAD == origin/main, ahead 0, behind 0, worktree clean)
- Issue: RT-5
- Canonical code: RT-RB-S0-01
- Task: Registrar Source of Truth e convenções de governança
- Classification: **HYBRID** (Jira labels `hybrid`, `rick-travel`, `sprint-0`, `visual-rebuild`)
- Sprint: Sprint 0 — Foundation & Audit (Jira sprint id 100, state ACTIVE, board 100)
- Jira Acceptance Criteria: "Documento canônico criado, regras e estados definidos."
- Jira Validation: "Verify Google Doc source-of-truth link, governance conventions, canonical code, labels, and sprint assignment."
- Registered on: 2026-09-07

This file is the **in-repo registration** of the Source of Truth. It is not a copy of it and does not compete with it. The Google Doc remains canonical; this file records where it is, what it rules, and how its conventions map onto the tooling this repository actually uses.

## 1. The Source of Truth — registered

| Field | Value |
| --- | --- |
| Title | **Rick Travel — Visual Rebuild Source of Truth** |
| Surface | Google Doc (`application/vnd.google-apps.document`) |
| Document ID | `1B9SptmnGo2MI6yyQiQkHpHw-Npeb4TkUxsJjg971LhI` |
| Canonical link | https://docs.google.com/document/d/1B9SptmnGo2MI6yyQiQkHpHw-Npeb4TkUxsJjg971LhI/edit |
| Owner | Ricardo Souza (`ricardodesouzafrancisco@gmail.com`) |
| Created | 2026-09-02T17:09:24Z |
| Last modified | 2026-09-02T19:01:53Z |
| Document status | PLANNING / APPROVED BASE WIREFRAME |
| Version | Versão inicial — 02 setembro 2026 |
| Verified | 2026-09-07, read end-to-end; all nine sections present. Re-checked 2026-09-16 (RT-5 round): still live, `modifiedTime` reported unchanged at that check. **Re-checked again later the same day (RT-10 round): `modifiedTime` is now `2026-09-16T15:39:09.507Z` — the Doc *was* edited between the two checks.** Full text read at that time; content is consistent with the Change Log entries the Doc itself records for 2026-09-16 (Sprint 0 Owner Gate approval, RT-5/RT-6/RT-7/RT-8/RT-9 evidence reconciliation, Sprint 1 opening). See §10 correction below. |

**Link verified, not assumed.** The document was located and read in full during RT-5. Its Sprint 0 table matches the canonical codes, modes, initial statuses and Definitions of Done that RT-6, RT-7, RT-8 and RT-9 were executed against.

### A second copy exists — the Google Doc is canonical

Drive also holds `Rick_Travel_Visual_Rebuild_Source_of_Truth.docx` (id `18h7zejQIiDDs50lmu2_cuVlcOBkYMtp4`, modified 2026-09-02T16:59:55Z). It is an earlier snapshot of the same content: its `modifiedTime` is about **9 minutes and 29 seconds** before the Google Doc was created (`16:59:55Z` -> `17:09:24Z`), and about **two hours** behind the Doc's last edit (`19:01:53Z`). Its content was compared against the Doc and is substantively identical — same nine sections, same sprint tables, same modes, same Definitions of Done — so the `.docx` holds nothing the Doc lacks.

The Google Doc is canonical, for three reasons: RT-5's Jira Validation names a **Google Doc**; the Doc is the more recently edited of the two; and the Doc's own §1 assigns "Google Doc" the role of "fonte de verdade principal do rebuild". The `.docx` must not be edited or cited as authority. Deleting it is an Owner decision and was not taken here.

### What this registration deliberately does not reproduce

This file registers the Source of Truth; it does not restate it. Five sections of the Google Doc are **intentionally not reproduced here** and remain canonical **exclusively** in the Doc:

| Source of Truth section | Subject | Why it stays in the Doc only |
| --- | --- | --- |
| **§2** | Approved Home concept — section ordering, hero narrative, approved wireframe | Live product and design decisions; the Owner edits these |
| **§4** | Sprint objectives and exit gates | Same; the Sprint 0 gate alone is quoted in **this file's** §9 below, because RT-5 must record that gate's *state* — Sprints 1-6 are not reproduced |
| **§7** | Approved decisions | Live decision record; changes as the Owner decides |
| **§8** | Change Log | The Doc's own history; duplicating it would fork the history |
| **§9** | Next authorized action | Changes every sprint |

Copying those sections into the repository would create a second copy that drifts the moment the Owner edits the Doc — exactly the competing Source of Truth this registration exists to prevent. Read them at the canonical link above.

What this file *does* reproduce — Doc §1 (hierarchy and principles), §3 (work modes), §5 (Jira model) and §6 (execution gate) — are governance rules that bind every task and that an agent must be able to read without leaving the repository. They are reproduced as a working convenience, not as authority. **Where this file and the Google Doc ever differ, the Doc governs.**

## 2. Surface hierarchy (Source of Truth §1)

| Surface | Responsibility | Rule |
| --- | --- | --- |
| **Google Doc** | Vision, scope, decisions, architecture, sprints, gates | **Primary source of truth for the rebuild** |
| **Jira** | Backlog, status, owners, blockers, evidence | Source of truth for *execution state* |
| **Figma** | Approved static wireframes and visual design | Visual source for layout, tokens, components |
| **Git / GitHub** | Code, history, implementation evidence | One task = one controlled scope; follow Protocolo Rick |
| **Vercel Preview** | Real browser behaviour validation | Visual and interaction approval before production |
| **Media Masters** | Final video/image and web derivatives | Master preserved; web receives optimized files |

Jira controls daily execution; **it does not replace the decisions recorded in the Google Doc.** Where the two disagree about intent, the Doc wins; where they disagree about current execution state, Jira wins.

## 3. Non-negotiable principles (Source of Truth §1)

Reproduced because every future task is bound by them:

1. Do not rebuild backend, reservations, data or working integrations merely to change the UI.
2. The new Home is born isolated in a lab/preview before replacing the production Home.
3. Rio de Janeiro stays the protagonist; the flight engine is a tool of the journey, not the whole brand identity.
4. **Cadastur must be preserved** and described without inventing certifications, guarantees or unproven claims.
5. The cinematic hero is validated with temporary media before final video production.
6. Mobile, performance, accessibility and `prefers-reduced-motion` are in scope from the prototype onward.
7. **No visual task reaches production without an Owner Visual Gate.**
8. No flight integration is presented as real until API/documentation and functional validation exist.

## 4. Work division and gates (Source of Truth §3)

| Mode | Who executes | Meaning for an agent |
| --- | --- | --- |
| **AGENT** | Agent executes end-to-end within approved scope | Proceed within scope; stop at review |
| **HYBRID** | Agent implements; Ricardo validates feel, content or visual decision | Implement, then **stop for Owner validation** |
| **OWNER** | Manual Ricardo action/decision is indispensable | Agent does not execute; prepare inputs only |

Visual workflow:

```
AGENT IMPLEMENTA → OWNER TESTA NO PREVIEW → FEEDBACK OBJETIVO → AGENT AJUSTA
→ OWNER VISUAL GATE → TESTES → COMMIT/PUSH → REMOTE DONE
```

RT-5 itself is **HYBRID**: this registration is the agent's implementation, and it awaits Owner validation.

## 5. Execution gate — the eight states (Source of Truth §6)

1. **DISCUSSION** — confirm scope and risks without touching production.
2. **READY** — issue has Scope In/Out, criteria, and resolved dependencies.
3. **EXECUTION** — only the necessary files; no silent scope expansion.
4. **REVIEW** — diff, screenshots/preview, and matching tests.
5. **OWNER GATE** — mandatory when the task changes feel, identity, or a commercial decision.
6. **COMMIT** — one coherent commit per task where applicable.
7. **PUSH / REMOTE DONE** — remote sync evidence and Jira updated.
8. **STOP** — do not auto-start the next sprint while an Owner gate is pending.

## 6. Jira operational model (Source of Truth §5)

| Field | Standard |
| --- | --- |
| Summary | `[RT-RB-Sx-yy]` + verb + objective result |
| Issue type | Story/Task for execution; Epic optional per macro-phase; Gate may be a Task |
| Status | Backlog → Ready → In Progress → Review → Done; **Blocked** when a real dependency exists |
| Labels | `rick-travel`, `visual-rebuild`, `sprint-x`, and one of `agent` \| `hybrid` \| `owner` |
| Description | Goal, Scope In, Scope Out, Inputs, Acceptance Criteria, Validation, Evidence |
| Evidence | Commit/PR, screenshots, Vercel Preview, tests, and Owner decision where applicable |
| Sprint close | Update the Source of Truth with decisions that changed; do not duplicate the whole operational log |

Every issue carries the canonical code at the start of its Summary so it survives a Jira key change or a project migration. **The canonical code, not the Jira key, is the durable identifier.**

### Canonical state model vs. the Jira workflow as it exists — a real gap

The Doc's state model is `Backlog → Ready → In Progress → Review → Done`, plus `Blocked`. The RT project's workflow does not currently express that model one-to-one:

| Canonical state | Actual Jira status | Transition id | Note |
| --- | --- | --- | --- |
| Backlog | `BACKLOG / READY` | 11 | **Backlog and Ready are merged into one status** |
| Ready | `BACKLOG / READY` | 11 | Not separately representable |
| In Progress | `Em andamento` | 21 | |
| Review | `Revisar` (transition named `REVIEW`) | 31 | Transition name and target status differ |
| Done | `Concluído` (transition named `Itens concluídos`) | 41 | |
| **Blocked** | no status — carried by a `blocked` **label** | — | No Blocked status or transition exists in this workflow; the state is expressed as a label instead |

Consequences to respect until an Owner decides otherwise:

- "READY" cannot be distinguished from "BACKLOG" by status alone. An issue's readiness must be judged from its description fields, not its status chip.
- **Blocked is a label here, not a status.** RT-39 / RT-RB-S5-03 is specified as `BLOCKED` in the Source of Truth (it depends on external consolidator credentials). Jira carries it as status `BACKLOG / READY` **plus a `blocked` label** — verified on RT-39, which is the only issue of the 47 carrying that label. So the blocked state *is* represented, just not where the Doc's state model implies. A board filter or JQL must query `labels = blocked`; a status query will never surface it.
- The `blocked` label is **not part of the Doc's documented label set** (`rick-travel`, `visual-rebuild`, `sprint-x`, `agent|hybrid|owner`). It is a sensible extension rather than a defect, but it is undocumented, so the Doc and the board disagree about how blocked state is recorded.

Recording the mismatch is RT-5's job. **Resolving it — adding a Blocked status, or amending the Doc to adopt the label convention — is an Owner decision and was not taken here.**

## 7. Sprint name alias contract — verified against live Jira

The Doc defines aliases for sprint names that exceed Jira's length limit. The alias changes nothing about goal, scope, ordering, canonical codes, dependencies, acceptance criteria, mode classifications, gates, or blocked states. Verified in Jira:

| Canonical sprint name | Jira sprint name | Jira id | State |
| --- | --- | --- | --- |
| Sprint 0 — Foundation & Audit | *(same)* | 100 | **active** |
| Sprint 1 — Design Foundation | *(same)* | 101 | future |
| Sprint 2 — Cinematic Motion Prototype | **Sprint 2 — Cinematic Prototype** | 104 | future |
| Sprint 3 — Media & Final Hero | *(same)* | 102 | future |
| Sprint 4 — Core Home Experience | **Sprint 4 — Home Experience** | 105 | future |
| Sprint 5 — Flight Planner | *(same)* | 103 | future |
| Sprint 6 — QA, Performance & Launch | **Sprint 6 — QA, Perf & Launch** | 106 | future |

All three documented aliases are in use exactly as specified, and no undocumented alias exists. Note that Jira sprint ids are **not** in sprint order (S2=104, S3=102, S5=103, S4=105); order by canonical code, never by sprint id.

## 8. Canonical code → Jira key index

47 issues, all on board 100. Verified 2026-09-07 and re-verified 2026-09-16 — no status changed in between.

Label conformance was checked issue by issue against the Doc's convention and is **complete**: all 47 carry `rick-travel`, `visual-rebuild`, the correct `sprint-N`, and exactly one mode label. Every one of the 47 mode labels (`agent` / `hybrid` / `owner`) matches the mode the Source of Truth assigns that canonical code — no drift. The only additional label anywhere is `blocked` on RT-39 (see §6).

| Canonical code | Jira | Mode | Sprint | Status |
| --- | --- | --- | --- | --- |
| RT-RB-S0-01 | RT-5 | HYBRID | 0 | BACKLOG / READY |
| RT-RB-S0-02 | RT-6 | AGENT | 0 | **Concluído** |
| RT-RB-S0-03 | RT-7 | AGENT | 0 | **Concluído** |
| RT-RB-S0-04 | RT-8 | AGENT | 0 | **Concluído** |
| RT-RB-S0-05 | RT-9 | AGENT | 0 | **Concluído** |
| RT-RB-S1-01 | RT-10 | HYBRID | 1 | BACKLOG / READY |
| RT-RB-S1-02 | RT-11 | HYBRID | 1 | BACKLOG / READY |
| RT-RB-S1-03 | RT-12 | OWNER | 1 | BACKLOG / READY |
| RT-RB-S1-04 | RT-13 | HYBRID | 1 | BACKLOG / READY |
| RT-RB-S1-05 | RT-14 | AGENT | 1 | BACKLOG / READY |
| RT-RB-S1-GATE | RT-15 | OWNER | 1 | BACKLOG / READY |
| RT-RB-S2-01 | RT-16 | HYBRID | 2 | BACKLOG / READY |
| RT-RB-S2-02 | RT-17 | AGENT | 2 | BACKLOG / READY |
| RT-RB-S2-03 | RT-18 | AGENT | 2 | BACKLOG / READY |
| RT-RB-S2-04 | RT-19 | AGENT | 2 | BACKLOG / READY |
| RT-RB-S2-05 | RT-20 | AGENT | 2 | BACKLOG / READY |
| RT-RB-S2-06 | RT-21 | HYBRID | 2 | BACKLOG / READY |
| RT-RB-S2-GATE | RT-22 | OWNER | 2 | BACKLOG / READY |
| RT-RB-S3-01 | RT-23 | AGENT | 3 | BACKLOG / READY |
| RT-RB-S3-02 | RT-24 | OWNER | 3 | BACKLOG / READY |
| RT-RB-S3-03 | RT-25 | HYBRID | 3 | BACKLOG / READY |
| RT-RB-S3-04 | RT-26 | AGENT | 3 | BACKLOG / READY |
| RT-RB-S3-05 | RT-27 | AGENT | 3 | BACKLOG / READY |
| RT-RB-S3-06 | RT-28 | AGENT | 3 | BACKLOG / READY |
| RT-RB-S3-GATE | RT-29 | OWNER | 3 | BACKLOG / READY |
| RT-RB-S4-01 | RT-30 | AGENT | 4 | BACKLOG / READY |
| RT-RB-S4-02 | RT-31 | AGENT | 4 | BACKLOG / READY |
| RT-RB-S4-03 | RT-32 | HYBRID | 4 | BACKLOG / READY |
| RT-RB-S4-04 | RT-33 | AGENT | 4 | BACKLOG / READY |
| RT-RB-S4-05 | RT-34 | HYBRID | 4 | BACKLOG / READY |
| RT-RB-S4-06 | RT-35 | AGENT | 4 | BACKLOG / READY |
| RT-RB-S4-GATE | RT-36 | OWNER | 4 | BACKLOG / READY |
| RT-RB-S5-01 | RT-37 | HYBRID | 5 | BACKLOG / READY |
| RT-RB-S5-02 | RT-38 | AGENT | 5 | BACKLOG / READY |
| RT-RB-S5-03 | RT-39 | OWNER | 5 | BACKLOG / READY + **`blocked` label** — see §6 |
| RT-RB-S5-04 | RT-40 | AGENT | 5 | BACKLOG / READY |
| RT-RB-S5-05 | RT-41 | AGENT | 5 | BACKLOG / READY |
| RT-RB-S5-06 | RT-42 | AGENT | 5 | BACKLOG / READY |
| RT-RB-S5-GATE | RT-43 | OWNER | 5 | BACKLOG / READY |
| RT-RB-S6-01 | RT-44 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-02 | RT-45 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-03 | RT-46 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-04 | RT-47 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-05 | RT-48 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-06 | RT-49 | HYBRID | 6 | BACKLOG / READY |
| RT-RB-S6-07 | RT-50 | AGENT | 6 | BACKLOG / READY |
| RT-RB-S6-GATE | RT-51 | OWNER | 6 | BACKLOG / READY |

Modes are the Source of Truth's, and were confirmed to match Jira's mode labels on all 47 issues. Statuses are Jira's, read 2026-09-07 and again 2026-09-16.

> **Historical snapshot.** Sprint 5 / Sprint 6 above, and the statuses in this table, describe the roadmap as registered on 2026-09-07 / 2026-09-16. On 2026-10-03 the Owner re-baselined Sprint 5–8; see **§12**. Canonical codes (`RT-RB-S5-*`, `RT-RB-S6-*`) and Jira keys are unchanged; only their sprint membership moved.

## 9. Sprint 0 evidence index

Where the completed Sprint 0 work lives. These artifacts are **not modified by RT-5**.

| Canonical code | Jira | Definition of Done (Source of Truth) | Repository evidence | Commit |
| --- | --- | --- | --- | --- |
| RT-RB-S0-01 | RT-5 | Documento canônico criado, regras e estados definidos | *this file* | pending |
| RT-RB-S0-02 | RT-6 | Mapa manter/adaptar/substituir/remover com evidência no repo | `docs/architecture/current-home-architecture-audit.md` | `db7eb01` |
| RT-RB-S0-03 | RT-7 | Inventário completo e riscos de regressão registrados | `docs/architecture/current-home-inventory.md` (18 risks, all DOCUMENT ONLY) | `847c68f` |
| RT-RB-S0-04 | RT-8 | Protótipo acessível sem alterar a Home pública | `docs/architecture/rebuild-lab-route.md`, `app/[locale]/rebuild-lab/`, `lib/rebuild-lab/config.ts` | `10cbf64` |
| RT-RB-S0-05 | RT-9 | Baseline guardado para comparação posterior | `docs/architecture/current-home-baseline.md`, `docs/baseline/rt-9-current-home/` | `fec15af` |

### Sprint 0 exit gate — registered, not met

The Source of Truth §4 sets exactly one exit gate for this sprint:

> **Auditoria aprovada; nenhum comportamento existente perdido por desconhecimento.**

Current state of the five Sprint 0 issues:

| Canonical code | Jira | State |
| --- | --- | --- |
| RT-RB-S0-02 | RT-6 | **Concluído** |
| RT-RB-S0-03 | RT-7 | **Concluído** |
| RT-RB-S0-04 | RT-8 | **Concluído** |
| RT-RB-S0-05 | RT-9 | **Concluído** |
| RT-RB-S0-01 | RT-5 | Implementation complete locally; **awaiting review and Owner validation** |

| Gate | State |
| --- | --- |
| Sprint 0 Owner approval | **PENDING** |
| Sprint 0 closure | **NOT AUTHORIZED** |
| Sprint 1 | **NOT STARTED** |

**Completing Jira tasks does not satisfy this gate.** Four issues at `Concluído` record that agent work was executed; the gate asks a different question — whether the *Owner* accepts the audit as approved, and accepts that no existing behaviour was lost through ignorance. Only Ricardo can answer that, and a Jira status transition is not that answer. RT-5 is itself HYBRID and not yet validated, so Sprint 0 is not even task-complete.

Nothing in this file approves the gate, closes the sprint, or authorizes Sprint 1. Source of Truth §6 state 8 governs until the Owner approves: do not auto-start the next sprint while an Owner gate is pending.

### Correction to the Sprint 0 gate table above (2026-09-16, RT-10 round)

The "Gate" table above (Sprint 0 Owner approval: PENDING, closure: NOT AUTHORIZED, Sprint 1: NOT STARTED) is the state as RT-5 recorded it and is **left unedited above** as the historical snapshot at registration time, consistent with how this file already treats RT-9's record below.

Reading the Google Doc directly during the RT-10 round found its own Change Log and a dedicated "Registro de execução — Sprint 0" block, both dated 16/09/2026, stating: Sprint 0 Owner Gate **APPROVED** by Ricardo Souza Francisco; Sprint 0 closure **AUTHORIZED**; Sprint 1 opening **AUTHORIZED**; and, distinctly, Sprint 1 Owner Visual Gate (RT-15) **PENDING** — not yet approved. The Doc is explicit that this Sprint 0 approval does not authorize asset deletion, unrelated risk remediation, or production replacement, and that the four pending governance decisions from §10 above remain open without blocking Sprint 1.

This is the Doc exercising its own authority as primary source of truth (§1) — an Owner action taken in the Doc itself, not a claim made by this repository file or by any agent session. RT-10 (a Sprint 1 task) proceeded on this basis: Sprint 0 is Owner-approved per the Doc, Sprint 1 is open, and RT-15 (Sprint 1's own gate) remains separately pending.

### Correction to the RT-9 record

`current-home-baseline.md` §"Source of truth availability" states the Source of Truth was "not readable from this environment", citing Confluence returning 404.

**That conclusion was wrong, and the reasoning behind it was wrong.** Confluence genuinely is not provisioned on this Atlassian site, but the Source of Truth was never a Confluence page — it is a Google Doc, as RT-5's Jira Validation says explicitly and as RT-6's and RT-7's own documents already recorded in writing. What those documents did **not** carry — and what no file in the repository carried before this one — was a *resolvable* reference: neither the canonical URL nor the Drive document ID appeared anywhere in the repo. RT-9 searched the wrong surface, and searching Google Drive would have found the document immediately, as RT-5 did.

The practical effect on RT-9 was limited: its measurements are runtime evidence and do not depend on the Doc, and its targeting guidance came from RT-6, which had itself been derived from the Doc. But the availability statement in that file is inaccurate and is **superseded by §1 of this document**.

RT-9's committed artifact is deliberately left untouched here — amending a closed task's record is not RT-5's call. Correcting that one paragraph is available as a follow-up if the Owner wants the file to stand alone without this cross-reference.

### RT-10 — token approval registered (2026-09-16)

Out of this file's original scope at registration (RT-5 registers Sprint 0), recorded here anyway because the Owner asked for it to be reflected in this document specifically, without disturbing the content above.

**Ricardo Souza Francisco approved RT-RB-S1-01 (RT-10) with adjustments on 2026-09-16** — the design-tokens candidate (charcoal/warm-gold/off-white palette, surface/text/control/semantic tokens, spacing scale, grid, radius, elevation), plus the hero lighting direction with a specific recalibration (halo and light-spread values reduced; see `docs/architecture/rt-10-design-tokens.md`). Full scope, adjustments, pending items and permanent evidence: `docs/baseline/rt-10-approved/approved-parameters.md`. Typography (RT-11) is explicitly excluded. **This approval does not cover Sprint 0 as a whole (see correction above), does not release Sprint 1 in general, does not satisfy RT-15 Owner Visual Gate, and does not authorize production implementation or media production.** No file under `app/`, `components/`, or `app/globals.css` was changed to produce it.

This entry was first written to this repository file because the RT-10 review session could not edit the Google Doc body. The exact approved text is preserved in `docs/baseline/rt-10-approved/approved-parameters.md`; it was synchronized to §7 of the canonical Google Doc during the authorized post-RT-10 consolidation on 2026-09-17.

## 10. Governance findings

Recorded, not acted on.

1. **Blocked state is recorded as a label, not a status.** No `Blocked` status or transition exists in the RT workflow, so the Doc's state model cannot be followed literally — but the state is not lost: RT-39 / RT-RB-S5-03 carries a `blocked` label, and it is the only issue of the 47 that does. The mismatch is one of mechanism, not of information. Two consequences: anything querying blocked work must use `labels = blocked` rather than status, and the `blocked` label is absent from the Doc's documented label set. Owner decision: add a Blocked status, or amend the Doc to adopt the label convention.
2. **`Backlog` and `Ready` are one status** (`BACKLOG / READY`), so readiness is not visible from status alone. Every Sprint 0 issue executed so far was judged ready from its description fields.
3. **Two Source of Truth files exist in Drive** — the Google Doc and an older `.docx`. Canonicality is asserted in §1; removing the duplicate is an Owner decision.
4. **Superseded finding, corrected 2026-09-16 (RT-10 round).** This finding originally read: "The Source of Truth has not been updated since 2026-09-02, while Sprint 0 has since completed four of five tasks... Updating the Doc is an Owner action." **That was accurate only for the RT-5 check earlier the same day.** A later check the same day found `modifiedTime` at `2026-09-16T15:39:09.507Z`: the Doc *has* since been updated — its own §8 Change Log and the "Registro de execução — Sprint 0" block now record the Sprint 0 Owner Gate approval, the RT-6/RT-7/RT-8/RT-9 evidence reconciliation, and Sprint 1 opening, dated 16/09/2026. The underlying point — that updating the Doc is an Owner action, not something RT-5 (or RT-10) performs — still holds and was exercised correctly: the Doc was updated by/for the Owner, not by an agent editing it directly.
5. **The repository identified the Source of Truth but could not resolve it.** RT-6 (`current-home-architecture-audit.md`) and RT-7 (`current-home-inventory.md`) both name the Google Doc "Rick Travel - Visual Rebuild Source of Truth" in writing and quote its Sprint 0 rows, so the reference was never absent. What was missing was a **resolvable** one: no canonical URL and no Drive document ID appeared anywhere in the repository, so nothing in-repo could lead a reader to the actual document. Registering that missing reference is precisely the gap RT-5 closes, and its absence is why RT-8 and RT-9 each had to restate the Doc's contents from second-hand evidence.
6. **Historical tooling limitation, resolved in consolidation.** The RT-10 review session could not write to the Google Doc body, so the approval-with-adjustments record was first preserved outside the Doc. The permanent record now lives at `docs/baseline/rt-10-approved/approved-parameters.md`, and an authorized connector synchronized the exact approved text to the Doc's §7 on 2026-09-17.

## 11. Non-goals

RT-5 registers and documents. It does not:

- Start Sprint 1 or any later sprint, or any design implementation.
- Create or redesign a design system, tokens, typography, or any visual work.
- Change the production Home, its components, layout, data or behaviour.
- Change the RT-8 rebuild lab, its route, or its environment gate.
- Modify the RT-6, RT-7, RT-8 or RT-9 artifacts.
- Delete, move, optimize or reclassify any asset.
- Perform any performance optimization.
- Remediate any of RT-7's 18 regression risks — all remain **DOCUMENT ONLY**.
- Write to the Source of Truth Google Doc, or delete the duplicate `.docx`.
- Transition, create or edit any Jira issue other than the evidence RT-5 itself records.
- Add a dependency or touch `package.json` / `package-lock.json`.

Nothing in this file approves anything. It records what was already approved, and where the record lives.

## 12. Roadmap rebaseline — Sprint 5–8 (Owner-approved 2026-10-03)

Added after the fact. §1–§11 are left as the historical record and are **not** rewritten. The product moved from visual rebuild to operational production: Sprints 0–4 and the public-site promotion (RT-52 to RT-57) are complete, and the Owner approved the public visual gate (RT-36, 2026-10-03). The Google Doc is canonical; this section is the in-repo registration of the approved structure and **has not been mirrored into the Doc** (an Owner action).

### 12.1 Sprint structure

| Sprint | Jira name | Jira id | Goal |
| --- | --- | --- | --- |
| 5 — Production Foundation & External Integrations | Sprint 5 — Prod Foundation | 138 (new) | Domain/DNS/HTTPS, `PUBLIC_SITE_URL` + env contract, business email + Resend, flight-provider onboarding, minimal observability |
| 6 — Flight Commerce | Sprint 6 — Flight Commerce | 103 (renamed; was "Sprint 5 — Flight Planner") | Flight UX and commercial architecture first; real provider integration only after architecture + provider docs/credentials |
| 7 — AI Concierge | Sprint 7 — AI Concierge | 139 (new) | Real, governed concierge replacing the mock backend |
| 8 — Launch Readiness | Sprint 8 — Launch Readiness | 106 (renamed; was "Sprint 6 — QA, Perf & Launch") | QA, performance, a11y, SEO, legal, media rights, polish, final audits and gate |

Sprint ids are still not in sprint order; order by canonical sprint number.

### 12.2 Owner constraints (preserved)

- Domain/DNS, `PUBLIC_SITE_URL` production activation, Resend sender verification and the business email-domain choice were **deliberately deferred** by the Owner (2026-10-02). They are now explicit tickets marked `OWNER / DEFERRED` or `BLOCKED BY OWNER DOMAIN DECISION`, and **must not block** Flight Planner UX or architecture work.
- No DNS, Vercel custom-domain, Resend, registrar or provider-credential change is made by an agent until the Owner confirms the domain and access.
- Flytour/MaisFly is **not** assumed to require the custom domain unless the provider's documentation explicitly proves it.
- The AI Concierge backlog exists now but is **not executed in parallel** with the main Flight integration unless the Owner explicitly authorizes. The mock `app/api/ai-concierge` endpoint stays disabled until the real backend passes its Owner gate.
- **Technical debt, recorded:** the in-memory per-instance limiter (`lib/security/rate-limit.ts`, used by the tour-request and contact-message actions) is best-effort only and is **not** production-grade. A distributed limiter must exist before final launch and is verified by the final gate.

### 12.3 Ticket map

New canonical codes avoid the old `S5`/`S6` codes. Existing tickets keep their codes and keys.

**Sprint 5 — Production Foundation**

| Code | Jira | Mode | State |
| --- | --- | --- | --- |
| RT-RB-F-01 Confirm domain + registrar access | RT-58 | OWNER | OWNER / DEFERRED |
| RT-RB-F-02 Vercel custom domain + DNS + HTTPS | RT-59 | HYBRID | blocked by F-01 |
| RT-RB-F-03 `PUBLIC_SITE_URL` + env contract | RT-60 | AGENT | contract can start; activation after F-02 |
| RT-RB-F-04 Canonical business email identity | RT-61 | OWNER | OWNER / DEFERRED |
| RT-RB-F-05 Resend sender + fix `email.service.ts` | RT-62 | HYBRID | blocked by F-01, F-04 |
| RT-RB-F-06 Activate canonical/hreflang/sitemap on prod domain | RT-63 | AGENT | blocked by F-02, F-03 (split from RT-47) |
| RT-RB-F-07 Minimal error/performance observability | RT-64 | AGENT | not blocked |
| RT-RB-S5-03 Provider docs/credentials | RT-39 | OWNER | moved here; `blocked` |

**Sprint 6 — Flight Commerce:** RT-37, RT-38 (may start now), RT-40, RT-41, RT-42, RT-43 (codes `RT-RB-S5-*` unchanged), plus **RT-RB-C-01 Flight Commercial Architecture (RT-65)** — must precede RT-40/RT-41; and RT-RB-C-02 flight analytics (RT-66, split from RT-48).

RT-65 must define: Search → Results → Fare/selection → Passenger data → Payment OR booking request → Consolidator reservation → Issuance → Confirmation → Failure/refund/cancellation boundary; Rick Travel / Flytour-MaisFly / payment-provider responsibilities; whether Mercado Pago participates; whether the existing booking flow is reused; who legally and technically issues the ticket; behavior when payment succeeds but issuance fails; data that must never reach the browser; webhook and idempotency requirements.

**Sprint 6 follow-up backlog (added 2026-10-03, after the RT-37 / RT-65 Owner review).** All are `backlog-only`: defined, **not started**, not moved into execution.

| Code | Jira | Mode | Scope | Blocked by |
| --- | --- | --- | --- | --- |
| RT-RB-C-03 | RT-85 | AGENT | Flight Order domain model + state machine (FlightOrder, passenger/PII boundary, payment relationship, ProviderReservation, TicketIssuance, OrderEvent audit, persistence/transitions). No Prisma yet. | RT-65 |
| RT-RB-C-04 | RT-86 | HYBRID | Provider-neutral PSP adapter + payment webhook contract (signed webhook, payment authority, idempotency, capture/refund interface, PCI boundary). **No PSP chosen.** | RT-65, **RT-90** |
| RT-RB-C-05 | RT-87 | AGENT | Provider reservation + issuance orchestration (validation, PNR, issuance, timeouts, ambiguous-result lookup, retry policy, MANUAL_REVIEW). | **RT-39**, RT-85, RT-86, RT-40, **RT-90** |
| RT-RB-C-06 | RT-88 | HYBRID | Reconciliation + operator / manual-review tooling. | RT-85, RT-86 |
| RT-RB-C-07 | RT-89 | HYBRID | Passenger + checkout UX (guest checkout supported; provider-unknown rules blocked). | RT-37, RT-65, RT-39, RT-86 |
| RT-RB-C-08 | RT-90 | HYBRID | **Flight Security Architecture Review** — documentation/review only (credentials, server-only boundary, webhook signature/replay, idempotency, auth/capture/refund boundary, PII isolation/encryption, log redaction, audit integrity, operator access control, guest-token security, CSRF/session, rate limiting, abuse protection, timeout/retry implications, preview/production secrets, retention/deletion, incident response). | RT-65 |

**Status after the Owner review of 2026-10-03:** RT-37 (UX contract) and RT-65 (commercial architecture) are **Concluído**. RT-65's closure confirms the commercial/domain architecture **only**; Owner approval is **not** a substitute for an independent security review, which is RT-90. RT-90 **blocks RT-40, RT-86 and RT-87** (real payment/provider orchestration is not production-ready until it is complete) and does **not** block RT-38 (mock-only).

**Owner navigation decision:** `HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED`. Header, mobile-menu and tour-page Flights links are deferred (not rejected). The approved Home and shared chrome are not modified by RT-38; the isolated mock route `/{locale}/voos` is reached by direct URL during the mock phase.

**Sprint 7 — AI Concierge:** RT-67 (replace mock backend), RT-68 (approved RAG sources), RT-69 (ingestion/update), RT-70 (persistence + retention), RT-71 (human/WhatsApp handoff), RT-72 (distributed rate limiting), RT-73 (analytics/observability), RT-74 (safety + fallback), RT-75 (Owner gate). Codes `RT-RB-AI-01..08` and `RT-RB-AI-GATE`.

**Sprint 8 — Launch Readiness:** RT-44 to RT-51 (codes `RT-RB-S6-*` unchanged), plus RT-76 mobile polish, RT-77 scroll/motion polish, RT-78 PT/EN/ES copy review, RT-79 hero/media licensing, RT-80 Privacy, RT-81 Terms, RT-82 distributed rate limit, RT-83 cross-device/browser QA, RT-84 monitoring review (codes `RT-RB-L-01..09`).

### 12.4 Splits

- **RT-47:** canonical/hreflang/sitemap activation on the production domain → RT-63 (Sprint 5). OG image and structured-data validation stay in RT-47 (Sprint 8).
- **RT-48:** Flight analytics ship with Flight (RT-66); Concierge analytics with the Concierge (RT-73); RT-48 becomes the final analytics audit (Sprint 8).
- **RT-44:** Playwright critical-flow coverage applies to the complete public production surface (Home, Tours, Tour detail, Contact, About, in PT/EN/ES), not only the Home (Owner-confirmed 2026-10-03).
- **RT-51 (final gate)** must explicitly validate: production domain, HTTPS, canonical/hreflang/sitemap, business email, Resend, legal pages, media rights, Flight production path, AI Concierge production state, analytics, monitoring, distributed rate limiting, rollback readiness.

### 12.5 Dependencies

```
RT-58 domain ─► RT-59 Vercel domain/DNS/HTTPS ─► RT-60 PUBLIC_SITE_URL ─► RT-63 SEO activation ─► RT-51
RT-58 ─► RT-61 email identity ─► RT-62 Resend ─► RT-51
RT-37 ─► RT-38                      (may start now; no domain dependency)
RT-65 commercial architecture ─┐
RT-39 provider docs/credentials ┴─► RT-40 ─► RT-41 ─► RT-42 ─► RT-43 ─► RT-51
RT-68/69/70/74 ─► RT-67 ─► RT-75 ◄─ RT-71/72/73 ;  RT-75 ─► RT-51
RT-64 ─► RT-84 ─► RT-51 ;  RT-66, RT-73 ─► RT-48 ─► RT-51
(added 2026-10-03) RT-90 security review ─► RT-40, RT-86, RT-87 ;  RT-85, RT-86 ─► RT-87, RT-88 ;  RT-39 ─► RT-87 ;  RT-86 ─► RT-89   (RT-38 mock-only: not blocked by RT-90)
```

### 12.6 Next execution units

RT-37 (Flight Planner UX contract) and RT-65 (Flight Commercial Architecture). Neither depends on domain/DNS.

*Update 2026-10-03:* RT-37 and RT-65 are complete (see the Sprint 6 follow-up backlog above). The next authorized unit is **RT-38** (isolated mock-only Flight Planner at `/{locale}/voos`). RT-40, RT-41 and RT-85 to RT-90 are not started.

*Update 2026-10-03 (provider evidence — domain chain reactivated):* Oner Travel informed the Owner that the agency must already have its own URL, that the URL is essential for release of the search engine/widget, and that the widget request form must be submitted (response up to 72 business hours). This is evidence of `CUSTOM_DOMAIN_REQUIRED_FOR_WIDGET_RELEASE`; it does **not** prove API access. The Owner's deferral of domain/DNS work (§12.2, 2026-10-02) is **lifted** for RT-58, RT-59 and RT-60 (target `ricardotour.com`); the earlier deferral is kept as history. The dependency graph gains: `RT-58 ─► RT-59 ─► live domain ─► Oner widget request ─► RT-39`. RT-39 stays `BLOCKED / EXTERNAL_DEPENDENCY`. RT-40 and RT-41 are not started. State and Owner actions: `docs/architecture/rt-58-60-domain-foundation.md`.

*Update 2026-10-04 (Sprint 7 foundation):* The Flight/domain track is externally blocked, so Sprint 7 foundation documentation was produced for RT-68, RT-69, RT-70 (draft), RT-71, RT-72, RT-73 and RT-74, plus an audit and RT-67 readiness assessment (`docs/architecture/rt-67-concierge-audit-and-readiness.md`). No ticket is complete: Owner approvals and legal retention decisions are outstanding. **RT-67 is not ready.** Audit finding: `POST /api/ai-concierge` returned the mock response in production on 2026-10-04, contrary to the rule that the mock endpoint stays disabled; production flag change awaits Owner approval. RT-75 is untouched.

*Update 2026-10-04 (domain foundation completed):* the Owner completed and validated the production domain. Canonical production host: **`https://www.ricardotour.com`** (apex `ricardotour.com` returns a 308 redirect to it). DNS stays at HostGator (`ns00080/ns00081.hostgator.com.br`; apex `A 216.198.79.1`, `www` CNAME `3dbc0dde6b93740b.vercel-dns-017.com`); Titan e-mail (MX/SPF/DKIM) preserved; no DMARC yet (future improvement, not a blocker). `PUBLIC_SITE_URL=https://www.ricardotour.com` in Production after a successful redeploy; robots, sitemap, canonical, hreflang (pt/en/es/x-default) and og:url verified; `/voos` stays out of the sitemap and `noindex`. `rick-travel.vercel.app` remains the technical fallback. Timeline preserved: deferred 2026-10-02 → reactivated 2026-10-03 → completed 2026-10-04. RT-58, RT-59 and RT-60 are satisfied. `DOMAIN_PREREQUISITE = SATISFIED` for RT-39, which stays `BLOCKED / EXTERNAL_DEPENDENCY` on the Oner widget request and provider response. Where earlier entries say the future `PUBLIC_SITE_URL` is `https://ricardotour.com`, the final value is `https://www.ricardotour.com`. Details: `docs/architecture/rt-58-60-domain-foundation.md` §9.


*Update 2026-10-04 (Oner submission, SEO activation, e-mail identity):* The Owner submitted the Oner widget request form. RT-39 is `AWAITING_PROVIDER_RESPONSE` (still `BLOCKED / EXTERNAL_DEPENDENCY`; domain prerequisite satisfied). Oner's widget instructions confirm a hosted search widget (custom element `<befly-widget>`, script and stylesheet on `static.onertravel.com`): `WIDGET_INTEGRATION = CONFIRMED`, `API_INTEGRATION = NOT CONFIRMED`; no API access is inferred. Evidence log: `docs/architecture/rt-39-provider-integration-questionnaire.md`. RT-63 (SEO activation) acceptance criteria are satisfied on the production host for pt/en/es and RT-63 is closed. RT-61 is satisfied with canonical identity `contato@ricardotour.com` on `ricardotour.com` (the retired `ricktravel.com.br` identity is not used); a separate transactional alias is `OWNER_DECISION_REQUIRED`. RT-62 stays open: Resend domain verification has not happened and no sender code was changed. Details: `docs/architecture/rt-61-62-email-identity-and-resend.md`. RT-40 and RT-41 remain not started.

*Update 2026-10-11 (Owner decision — Concierge simplification):* the dedicated AI Concierge section was removed from the public Home (order is now Hero → Experiences → Why → Rio Story → About). Daniela remains the side panel (vertical tab on desktop, floating button on mobile); the header/footer "AI Concierge" entry is now a button that opens the panel (window event `ricardotour:open-concierge`) and is shown only while the launch guard enables Daniela (no dead link when it is off). API, model, catalog and panel design unchanged. Supersedes the "AI Concierge placeholder" position in the RT-57 Home order. Tests: `tests/ai-concierge-home-simplification.test.tsx`.
