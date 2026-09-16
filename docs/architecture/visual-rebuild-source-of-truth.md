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
| Verified | 2026-09-07, read end-to-end; all nine sections present. Link and metadata re-checked 2026-09-16: still live, `modifiedTime` unchanged |

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

### Correction to the RT-9 record

`current-home-baseline.md` §"Source of truth availability" states the Source of Truth was "not readable from this environment", citing Confluence returning 404.

**That conclusion was wrong, and the reasoning behind it was wrong.** Confluence genuinely is not provisioned on this Atlassian site, but the Source of Truth was never a Confluence page — it is a Google Doc, as RT-5's Jira Validation says explicitly and as RT-6's and RT-7's own documents already recorded in writing. What those documents did **not** carry — and what no file in the repository carried before this one — was a *resolvable* reference: neither the canonical URL nor the Drive document ID appeared anywhere in the repo. RT-9 searched the wrong surface, and searching Google Drive would have found the document immediately, as RT-5 did.

The practical effect on RT-9 was limited: its measurements are runtime evidence and do not depend on the Doc, and its targeting guidance came from RT-6, which had itself been derived from the Doc. But the availability statement in that file is inaccurate and is **superseded by §1 of this document**.

RT-9's committed artifact is deliberately left untouched here — amending a closed task's record is not RT-5's call. Correcting that one paragraph is available as a follow-up if the Owner wants the file to stand alone without this cross-reference.

## 10. Governance findings

Recorded, not acted on.

1. **Blocked state is recorded as a label, not a status.** No `Blocked` status or transition exists in the RT workflow, so the Doc's state model cannot be followed literally — but the state is not lost: RT-39 / RT-RB-S5-03 carries a `blocked` label, and it is the only issue of the 47 that does. The mismatch is one of mechanism, not of information. Two consequences: anything querying blocked work must use `labels = blocked` rather than status, and the `blocked` label is absent from the Doc's documented label set. Owner decision: add a Blocked status, or amend the Doc to adopt the label convention.
2. **`Backlog` and `Ready` are one status** (`BACKLOG / READY`), so readiness is not visible from status alone. Every Sprint 0 issue executed so far was judged ready from its description fields.
3. **Two Source of Truth files exist in Drive** — the Google Doc and an older `.docx`. Canonicality is asserted in §1; removing the duplicate is an Owner decision.
4. **The Source of Truth has not been updated since 2026-09-02** (`modifiedTime` re-confirmed 2026-09-16), while Sprint 0 has since completed four of five tasks. Its §5 requires updating the Doc at sprint close with decisions that changed. Sprint 0 produced at least three: the rebuild lab route and its environment gate (RT-8), the lab's deliberate omission of header/footer/Concierge (RT-8), and the performance baseline with its explicit non-field-data caveat (RT-9). Updating the Doc is an **Owner action** — the Doc is Owner-owned and RT-5 does not write to it.
5. **The repository identified the Source of Truth but could not resolve it.** RT-6 (`current-home-architecture-audit.md`) and RT-7 (`current-home-inventory.md`) both name the Google Doc "Rick Travel - Visual Rebuild Source of Truth" in writing and quote its Sprint 0 rows, so the reference was never absent. What was missing was a **resolvable** one: no canonical URL and no Drive document ID appeared anywhere in the repository, so nothing in-repo could lead a reader to the actual document. Registering that missing reference is precisely the gap RT-5 closes, and its absence is why RT-8 and RT-9 each had to restate the Doc's contents from second-hand evidence.

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
