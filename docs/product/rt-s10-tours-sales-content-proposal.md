# Sprint 10 — Tours & Sales Content: ticket proposal for the Owner's approval

- Version 2, 2026-10-15 (replaces version 1 of the same day). Sources: Volume II §5 (Sprint 10), §6, §8, §11 (14/10: catalog frozen at the four authorized tours); Volume I (Cadastur/claims rules, Owner gates); Jira on 15/10 (Sprint 10 = id 177, future, contains only RT-80/RT-81, reassigned by the Owner to continue in parallel).
- **Status: PROPOSAL.** No ticket below has been created; Sprint 10 has not started; nothing is executed before the Owner approves this list.
- **Hard rules for every ticket:** only the four existing tours; no new product or partner tour; **no invented price, itinerary, schedule, meeting point or rule** (every fact comes from the Owner, with the source recorded); prices change only with the Owner's confirmation; no publication or production data change without express authorization; PT/EN/ES parity; approved design preserved.

## The four tours (unchanged identities)
| # | Tour | Public id | Photo status (RT-79) |
|---|---|---|---|
| 1 | Cristo Redentor + Pão de Açúcar | `cmlhxkpy9000028zq27rhytew` | Owner's authorship and consent declared |
| 2 | Tour Favela Rocinha | `cmli1a6im000034zqqzc9sppb` | Owner's authorship and consent declared |
| 3 | Confeitaria Colombo + City Tour | `cmlibniq40000z4zqkbujnutt` | Owner's authorship declared |
| 4 | Tour Privativo Premium | `cmljo0s1u0000t0zqa0bpd23p` | Owner's photo, **to be replaced** (Owner considers it inadequate) |

## Baseline (verified 15/10, production read-only and code)
- The pages show: duration, category, description, highlights, included, not included, price per person (R$), "dates arranged with the team", one photo.
- **Missing** against Volume II §5 and the Owner's Terms draft v0.3 §4/T8: itinerary, meeting point, time, languages, participation requirements, accessibility, operator, conditions/cancellation summary, gallery.
- Model limits: one `imageUrl` per tour (**no gallery**); duration/category/inclusions live as text parsed from `description`; `physicalLevel` and `childrenAllowed` exist but are not shown; **no admin editing of tours** (planned for Sprint 11). Any new structured field or gallery needs an **additive migration** (same discipline as RT-100), and content changes reach the public site only through the hosted database.

## Proposed tickets

### RT-RB-S10-01 — Content gap matrix for the four tours (AGENT)
- **Objective:** one table per tour listing every content field required by Volume II §5 and Terms v0.3 §4, its current value on the site, the source and the status (present / missing / needs Owner).
- **Scope:** read-only (public pages, code, local DB clone). Out: any change.
- **Acceptance:** 4 tours × all fields covered; each value cites its source; no field filled by the agent.
- **Dependencies:** none (Sprint 9 baseline).
- **Evidence:** `docs/product/rt-s10-01-content-gap-matrix.md`, commit.
- **DoD:** independent check of a sample against production; Jira comment.

### RT-RB-S10-02 — Owner content intake (OWNER, HYBRID)
- **Objective:** collect from the Owner, per tour: itinerary (stops in order), approximate duration, meeting point or pickup rule, start time(s), languages offered, what is included/excluded (confirm), minimum age/children, physical level, accessibility notes, weather rule, operator (Q6: Ricardo Tour or a partner), and photo list.
- **Scope:** a structured form (doc or sheet) per tour; the agent prepares it pre-filled with the current site values marked "a confirmar". Out: inventing any answer.
- **Acceptance:** every field answered or explicitly marked "não se aplica" / "pendente" by the Owner, with the date.
- **Dependencies:** S10-01.
- **Evidence:** completed forms (stored as docs, no prices beyond those confirmed).
- **DoD:** Owner sign-off per tour recorded in Jira.

### RT-RB-S10-03 — Storage decision and additive model for structured tour facts + gallery (HYBRID)
- **Objective:** decide how meeting point, time, languages, requirements, accessibility and a photo gallery are stored (proposal: additive optional fields + a `TripImage` table with order, alt text in PT/EN/ES and a rights reference).
- **Scope:** design doc, then implementation on a branch, validated on local throw-away databases (as RT-100). Out: applying the migration to Neon (needs express authorization and Preview isolation).
- **Acceptance:** migration additive only, rollback documented, the 4 pages unchanged until content is entered, no private field exposed, tests.
- **Dependencies:** S10-02 (which fields are really needed); Owner approval of the design.
- **Evidence:** design doc, migration validation report, test results.
- **DoD:** independent review; branch only; no merge/migration in production.

### RT-RB-S10-04 — Tour page: show the new facts and the gallery (AGENT)
- **Objective:** render the confirmed facts (itinerary, meeting point, time, languages, requirements, accessibility, physical level, children) and an accessible gallery on the tour page, PT/EN/ES, within the approved design.
- **Scope:** UI only for fields that have confirmed content; hidden when empty (no placeholders on the public page). Out: price changes, booking changes.
- **Acceptance:** desktop and mobile; keyboard/alt text; message parity PT/EN/ES; Playwright list + detail; Lighthouse of the tour pages recorded; JSON-LD still valid.
- **Dependencies:** S10-03.
- **Evidence:** screenshots before/after, test reports.
- **DoD:** Owner Visual Gate on Preview (with an isolated Preview DB) or on local captures if the Preview DB is not isolated.

### RT-78 (reuse) — Commercial copy PT/EN/ES for the four tours (HYBRID)
- **Objective:** titles, summaries, descriptions and highlights in PT/EN/ES based only on S10-02 facts; no claims without evidence (Volume I/II rules).
- **Action:** move RT-78 from Sprint 8 to Sprint 10 and narrow its scope note to the four tours (no new ticket).
- **Acceptance:** Owner approves the copy per tour and language; parity test passes.
- **Dependencies:** S10-02.
- **Evidence/DoD:** copy document + Jira approval comment.

### RT-RB-S10-05 — Photos and galleries with recorded rights (OWNER, AGENT)
- **Objective:** assemble per tour the approved photo set (cover + gallery) with author, consent of identifiable people and an alt text; includes the **Tour Privativo Premium replacement**.
- **Scope:** optimized derivatives (existing media pipeline), rights recorded per file. Out: stock or AI images without license; any Hero work (RT-79, backlog).
- **Acceptance:** every published photo has a rights record; no photo chosen by the agent.
- **Dependencies:** Owner photos; S10-03 for the gallery.
- **Evidence:** rights table, derivative report.
- **DoD:** Owner approves the photo set per tour.

### RT-RB-S10-06 — Replace the Quem Somos photo (OWNER, AGENT)
- **Objective:** Volume II §3/§5: replace the current Quem Somos photo with the authentic photo the Owner approves.
- **Acceptance:** rights recorded; Home About block and `/quem-somos` updated; visual check.
- **Dependencies:** Owner photo. **DoD:** Owner approval; branch only.

### RT-RB-S10-07 — Per-tour conditions summary linked to the Terms (AGENT)
- **Objective:** a short "Condições" block per tour (confirmation, cancellation, weather, age) with a link to the Terms page.
- **Scope:** only rules the Owner decided in RT-81. Until then the block is **not shown** (the current page deliberately shows no policy).
- **Dependencies:** RT-81 decisions (T2–T6). **DoD:** wording identical to the approved Terms.

### RT-RB-S10-08 — Controlled content update of the four tours in the hosted database (HYBRID)
- **Objective:** a reviewed, reversible procedure to apply the approved content (and any confirmed price change) to the four production rows: backup, dry run on a local clone, diff of every changed field, Owner authorization per batch, post-check.
- **Why:** there is no admin editing until Sprint 11; content only reaches the site through the hosted database.
- **Dependencies:** S10-02/03/05, RT-78; express authorization; preferably Preview DB isolation (RT-104…108 deferred). **Out:** any other table or row.
- **Evidence:** dry-run diff, backup reference, post-check captures. **DoD:** executed only with written Owner authorization.

### RT-RB-S10-GATE — Owner Content Gate (OWNER)
- **Acceptance (Volume II §5):** each publishable tour has complete content in PT/EN/ES and licensed media; no price without Owner approval; Owner approves copy and photos and confirms the sale prices.
- **Required tests:** message parity PT/EN/ES, Playwright listing and detail, Lighthouse of the tour pages, JSON-LD validation.

## Parallel work in Sprint 10 that is not tour content
- **RT-80 / RT-81** (already in Sprint 10, Em andamento): continue from the Owner's v0.3 drafts; they **share inputs** with S10-02 (operator, confirmation, rules) and feed S10-07, so the Owner answers once for both. They do not block S10-01…06; they block only S10-07 and publication of the legal pages.
- **RT-110** (backlog, security): not Sprint 10 content (Volume II puts booking security in Sprint 11). Recommendation: schedule it at the start of Sprint 11 or earlier if the Owner prefers; it does not affect the tour-content work, and the current public flow (guest request) is already protected.

## Suggested order
S10-01 → S10-02 (Owner) → in parallel: S10-03 (design), RT-78 (copy), S10-05/06 (photos) → S10-04 → S10-07 (after RT-81) → S10-08 (authorization) → Gate.

## Decisions the Owner needs to make to start
1. Approve, edit or remove tickets from this list.
2. Approve the storage approach for structured facts and gallery (S10-03) or prefer text-only content without a migration.
3. Confirm that RT-78 moves from Sprint 8 to Sprint 10.
4. Authorize the start of Sprint 10 in Jira when ready.
