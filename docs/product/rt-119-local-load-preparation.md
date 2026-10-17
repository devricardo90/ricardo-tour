# RT-119 — Controlled catalog load: LOCAL PREPARATION (17/10/2026)

- Owner authorization (17/10/2026): local technical preparation only, using the RT-113 data model. **Not authorized:** load into the hosted database, publication, push/merge/deploy. Loading is never an editorial approval nor a publication authorization.
- Branch `sprint10/tours-content` (local). Scope prepared: Favela Rocinha (`cmli1a6im000034zqqzc9sppb`); the other three tours are not loaded.

## 1. What the load does
| Item | Source | Target |
|---|---|---|
| Texts PT/EN/ES (summary, description, duration, meeting point, practical info, accessibility, operating conditions, optional services) | `lib/catalog/drafts/rocinha.draft.ts` (Owner-approved editorial content) | `TripContent` |
| 8-step itinerary | draft | `TripItineraryStop` (stable id `<trip>_stop_<position>`) |
| 7 FAQs | draft | `TripFaqItem` (`<trip>_faq_<position>`) |
| Inclusions (6) / exclusions (7) | draft | `TripContent` |
| 5 photos (order, cover, framing, credit) + 1 video (poster, mobile rendition, duration), **rights PENDING (`UNVERIFIED`)** — see §6 | RT-116 media visually approved by the Owner | `TripImage` (`<trip>_media_<position>`) |
| Status | — | always `DRAFT`, no `approvedAt`, no fingerprint |

Never written: `Trip` (prices, titles, publication flag), provisional prices, internal costs, suppliers, the operator fee.

Code: `lib/catalog/content-load.ts` (`rocinhaLoadRecord`, `loadProblems`, `diffRecords`, `planLoad`, `applyLoad`); CLI `scripts/rt-119-load-content.ts` (default **dry run**; `--apply`; `--allow-replace-approved`); verification `scripts/rt-119-verify-load.ts`; Trip fingerprint `scripts/rt-119-trips-hash.ts`; fixture `scripts/rt-119-trips-fixture.sql` (fictitious rows for the 4 ids).

Safety rules: refuses a database other than `localhost:5433/rt119_*`; refuses invalid content (PT/EN/ES on every field, required fields, cover image, site-relative media paths, price-like text, mock data) and a missing trip (never creates trips); idempotent (identical content → no write; key order of jsonb ignored); one transaction; never overwrites approved content unless `--allow-replace-approved`, and then the approval is invalidated.

## 2. Approval: diagnosis and minimal fix
**Before:** approval was a single `status = OWNER_APPROVED` (+ `approvedAt`) on `TripContent`. Editing a FAQ, a stop, a photo or any text afterwards did not change that status, so the edited content would be public without review. The public gate checked only the status. No public page and no Daniela AI code reads these tables yet (verified by search), so there was no live exposure.

**After (implemented, fail-closed):** `TripContent.approvedContentHash` = SHA-256 of all public content at approval time (`contentFingerprint`: texts, languages, itinerary, FAQ in order, media src/alt/cover/framing/credit/video fields; rights excluded because they are enforced item by item). The public gate publishes only when the stored fingerprint equals the fingerprint of the current content:

CONTENT CHANGED → fingerprint differs → APPROVAL INVALIDATED (gate) → PUBLICATION BLOCKED → NEW REVIEW REQUIRED (`validateTourContent` reports it).

- An approval without fingerprint is never public (no status-only approval).
- The approval is an explicit act (`approvalFor`); the loader never calls it.
- DB rule: a fingerprint can exist only on approved content and must be a 64-char hex (CHECK).
- Migration `prisma/migrations/20261017200000_rt113_approval_fingerprint/` (+ rollback): one nullable column + one CHECK, additive. It belongs to the RT-113 data-model flow (RT-119 excludes migrations).
- Limits: the Daniela AI must read only the gated projection when it starts using catalog content (it does not today); a future admin should show "changed since approval" and offer re-approval.

## 3. Evidence (local throw-away PostgreSQL only)
Isolation: Docker `ricktravel-db` at `localhost:5433`, databases `rt119_*`; worktree without `.env`; no DATABASE/DIRECT/SHADOW variable in the shell; scripts refuse other hosts and `host`/`hostaddr` overrides; fictitious fixtures only; databases dropped and the temporary credential file deleted afterwards.

| Check | Result |
|---|---|
| Fingerprint migration on a database with all previous migrations (22) | applied; drift vs schema **0**; rollback → schema identical to the previous state (0 lines); re-apply OK |
| Dry run | `create` planned (8 stops, 7 FAQs, 6 media); **0 rows written** |
| `--apply` | `create`, one transaction, DRAFT, no approval |
| Second `--apply`, third dry run | `noop`, nothing written (idempotent) |
| `scripts/rt-119-verify-load.ts` | **25/25**: one Rocinha record only; PT/EN/ES complete, 7 FAQs and 8 stops per language; order (motorcycle taxi up = 3, down = 7); 6 inclusions incl. motorcycle taxi both ways, 7 exclusions; optional services not guaranteed/not mandatory; 5 photos + 1 video with poster/mobile; rights recorded; no price/cost/operator fee; Trip rows byte-identical; other 3 tours untouched; approve → public; FAQ edit → not public + "new review required"; identical reload keeps approval; replacement refused without flag; UNVERIFIED photo hidden |
| Unit tests `tests/rt-119-content-load.test.ts` | load record, refusals (languages, required, price text, mock, cover, missing trip), idempotency with reordered jsonb keys, approved content never replaced silently, rights changes visible in the diff, 7 kinds of edit invalidating the approval |

## 4. Still required before any production load (RT-119 criteria)
1. Owner approval of the content (RT-120) and an explicit approval act recorded (who/when) — the fingerprint makes it verifiable.
2. Hosted migrations (RT-113 tables + fingerprint) applied first, with Owner authorization and preferably an isolated Preview database (RT-104…108).
3. Backup of the hosted database, test run on a local clone of production data, field diff approved by the Owner per batch, written authorization, post-verification of the 4 pages in 3 languages.
4. Publication blockers unchanged: RT-81, RT-110, RT-118, RT-120, RT-114 public wiring; internal prices not publishable.

## 5. Independent review (17/10/2026) and follow-ups
No blocking finding. Deterministic fixes applied, then the database checks were re-run with the final code (RT-119 load cycle: dry run → create → noop, verification 25/25, missing JSON values stored as SQL NULL; RT-113 complement validator 23/23 incl. "status-only approval is never public"):
1. RT-113 validators approve through `approvalFor` (fingerprint); `rt-113-validate.ts` (dev-DB-clone based) was updated but **not re-run**, to avoid cloning the local dev database.
2. Missing JSON fields written as SQL NULL (`Prisma.DbNull`).
3. The plan is recomputed inside the transaction (stops if the stored content changed since the dry run, e.g. approved meanwhile); explicit transaction timeout.
4. `approvalFor` refuses mock or invalid content.
5. Media references validated at load time: `src`/`posterSrc`/`mobileSrc` must be site-relative and exist under `public/`; rights note required. (Superseded by §6: UNVERIFIED media may now be stored — it is never public — with a note saying what is pending.)
6. `approvalValid` flag (approval fingerprint matches) used by the load plan (`approvalKept`) and by the lab chips (a stale approval no longer shows CONFIRMED).
Minor: absent/undefined JSON keys treated alike in the fingerprint and diff; rollback header documents the order (code first, demote approved rows); helper header; rights note says "own media (photo/video)".

### Decisions for the Owner (17/10/2026 — both decided and implemented in §6)
- **Content-bound approval vs persistent demotion.** Today an edit after approval blocks publication at the gate, but the stored status stays `OWNER_APPROVED` with the old fingerprint; restoring exactly the approved content makes it valid again without a new review. Anything that reads `status` directly instead of the gate (future admin, concierge, sitemap) must use `approvalValid`. Alternative: demote to DRAFT on every write (admin, Sprint 11) — stricter, needs the write path.
- **Rights are outside the approval.** Changing a media item from UNVERIFIED to OWNER_ATTESTED after approval makes it public without re-reviewing the text (the loader still shows it in the diff). Trip-level fields (title, legacy description, highlights) are also outside the fingerprint (RT-113 scope).
- **Video data.** The loader records the video rights as OWNER_ATTESTED (Owner's own clip, visual approval 17/10); the mobile rendition's visual quality is still pending the Owner's judgement (RT-116).

### Undoing a local load
Drop the throw-away database, or delete the trip's rows from `TripImage`, `TripFaqItem`, `TripItineraryStop` and `TripContent` (in that order) — the loader never wrote anything else.

## 6. Owner decisions 17/10/2026 — durable invalidation and media rights (implemented locally, 18/10/2026)
Authorization: local fixes of the approval mechanisms only. **Not** authorized: publication, push, merge, deploy, hosted migration, production load, price publication, bookings.

### 6.1 Diagnosis
1. **Approval was content-bound, not durable.** An edit after approval blocked publication only through the fingerprint; the stored status stayed `OWNER_APPROVED`, so restoring the exact approved values made the content public again without a new review. Anything reading `status` directly would also see "approved".
2. **Rights and publication were one flag.** A media item was public whenever its `rightsStatus` ≠ `UNVERIFIED`; a later clearance (UNVERIFIED → OWNER_ATTESTED) published it without any decision. The loader also recorded the Rocinha photos/video as `OWNER_ATTESTED` on the basis of the Owner's declaration and visual approval — which the Owner now states is **not** proof of rights.

### 6.2 Solution
Flow: CONTENT APPROVED → MODIFIED → APPROVAL INVALIDATED (stored) → PUBLICATION BLOCKED → NEW REVIEW AND EXPLICIT APPROVAL.
- **Database triggers** (migration `20261017220000_rt113_durable_approval_media_publication`, additive):
  - any change to a public field of `TripContent`, any insert/update/delete of `TripItineraryStop`, `TripFaqItem` or `TripImage`, and any change to the public `Trip` fields (title, description, highlights, cover, city, location, duration, physical level, children, group size) **demotes** approved content to `DRAFT`. It also clears `approvedAt` and the fingerprint, and records `approvalInvalidatedAt` + `approvalInvalidationReason`. Reverting the values does not restore anything. Rewriting identical values does not invalidate, because the jsonb comparison is semantic.
  - TRUNCATE of the child tables demotes every approved content.
  - The invalidation locks the content row first, so an edit and the approval act are serialized and an approval can never fingerprint content that is being changed concurrently.
  - The fingerprint stays as the integrity check: the gate still requires it to match.
- **Media: three separate conditions.** (A) editorial approval of the content; (B) rights verified (`rightsStatus` ≠ `UNVERIFIED`); (C) publication authorization `TripImage.publicationApprovedAt`, granted **only** by the approval act and equal to the current `approvedAt`. Public only when A ∧ B ∧ C.
  - A rights change, whether clearance or revocation, clears C. A revocation hides the item immediately; a clearance never publishes it.
  - A new media row can never arrive pre-authorized.
  - A CHECK forbids C on UNVERIFIED media, and the trigger rejects any authorization granted outside the approval act (a transaction-local marker, plus equality with the approved `approvedAt`).
- **Approval act** `approveTourContent` (`lib/catalog/content-approval.ts`):
  - one transaction with the content row locked;
  - re-reads and validates;
  - records status, `approvedAt` and the fingerprint, and clears the invalidation record;
  - authorizes only the media whose rights are verified at that moment.

  Nothing calls it automatically: the loader never does, and there is no admin (Sprint 11).
- **Rocinha media rights kept PENDING:** the 5 photos and the video are stored as `UNVERIFIED`, with a note recording the Owner's declaration and that it is not documentary proof. The mural photo also states that the artist's authorship and rights are not verified. Consequence: even after an approval act, **no Rocinha media is public** until rights are documented and a new approval is made.
- **Loader:** UNVERIFIED media can be stored (it is never public), but a note is required. Replacing approved content (`--allow-replace-approved`) records the invalidation.
- **Preserved:** PT/EN/ES texts, the internal price table (unchanged, internal only), the RT-114 v2 design, the gallery and video in the lab preview, the 8-step itinerary, the booking rules, and the other 3 tours. Rocinha stays draft.

### 6.3 Models / migrations
- `TripContent.approvalInvalidatedAt DateTime?`, `TripContent.approvalInvalidationReason String?`, `TripImage.publicationApprovedAt DateTime?`.
- CHECK `TripImage_publication_rights_check`.
- Functions/triggers:
  - `rt_invalidate_trip_approval`
  - `rt_trip_content_guard`
  - `rt_trip_stop_guard`
  - `rt_trip_faq_guard`
  - `rt_trip_media_guard`
  - `rt_trip_public_guard` (on `Trip`: reads only, writes `TripContent`)
  - `rt_trip_children_truncate_guard` (3 TRUNCATE triggers)
- `rollback.sql` demotes approved content first (otherwise the previous gate would show verified media again), then drops only these objects.
- Existing rows are not rewritten; existing media start unauthorized (fail-closed).

### 6.4 Evidence (local throw-away PostgreSQL only; databases dropped and temporary credential deleted afterwards)
| Check | Result |
|---|---|
| Migration on a database with every previous migration + RT-113b fixtures | applied; drift vs schema **0**; existing rows identical (data hash); rollback → schema identical to the previous state (0 lines) and approved rows demoted (1 → 0); re-apply identical (0 lines) |
| `scripts/rt-113b-validate.ts` | **23/23** |
| RT-119 cycle | dry run `create` → `--apply` create (DRAFT) → second `--apply` no change |
| `scripts/rt-119-verify-load.ts` | **51/51** — Owner tests 1–12 with real data and SQL. The Rocinha media stays pending and is never authorized; a simulated rights verification **in the throwaway DB only** exercises the rules: clearance does not publish; re-approval does; revocation hides one photo at once; FAQ / translation / gallery / itinerary / media reorder / Trip title edits demote; revert does not restore; SQL bypasses are rejected or demoted (CHECK, forged authorization on unverified and on verified media, pre-authorized insert, status-only approval, FAQ delete, TRUNCATE); concurrency (an approval waits for an in-flight edit and fingerprints the committed content); the loader replacement records the invalidation; the final state equals the real state; other tours have no content |
| Unit tests | 102 in the RT-113/119 files; full suite 863 passed / 6 skipped |
| Owner test 13 | client bundles contain no rights notes, authorization fields, Drive paths or prices; network scan of the lab "visual" mode PT/EN/ES: 0 responses with prices (control mode shows them, as designed) |
| Owner test 14 | other 3 tours: no content rows written; mock/integrity tests pass; no change to their data or code |
| `prisma validate`, `tsc`, ESLint (0 errors; 2 old warnings in `rt-35-chrome-validation.mjs`), `next build --webpack`, `git diff --check` | OK |

### 6.5 Independent review (18/10/2026)
No leak was found. Fixed:
1. An authorization granted by a direct SQL update on verified media is now rejected by the trigger.
2. Public `Trip` fields are now inside the durable invalidation.
3. Concurrency: the invalidation locks the content row.
4. The rollback demotes approved content.
5. TRUNCATE demotes.
6. The loader replacement records the invalidation.

Accepted limitations (deliberate action with database privileges, to be closed by production roles, RT-104): disabling triggers or replication mode; a session forging the approval-act marker together with OWNER_APPROVED and a matching fingerprint; hand-editing the invalidation record. Design point for the Owner: one approval act grants both content approval and the authorization of all media verified at that moment. A future admin may split this per item.
Non-blocking: Prisma prints a `pg` deprecation warning for relation loads inside interactive transactions.

### 6.6 Still pending before any publication
Documentary proof of rights for the Rocinha photos/video and consent of identifiable people; mural authorship; Owner content approval (RT-120) and a recorded approval act; hosted migrations (RT-113 chain incl. this one) with authorization and preferably an isolated Preview DB (RT-104…108); backup and production-clone rehearsal; RT-81, RT-110, RT-118, RT-114 public wiring; prices stay internal.
