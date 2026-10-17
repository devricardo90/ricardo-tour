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
| 5 photos (order, cover, framing, credit, rights) + 1 video (poster, mobile rendition, duration) | Owner-approved RT-116 media | `TripImage` (`<trip>_media_<position>`) |
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
5. Media references validated at load time: `src`/`posterSrc`/`mobileSrc` must be site-relative and exist under `public/`; rights note required; UNVERIFIED media refused.
6. `approvalValid` flag (approval fingerprint matches) used by the load plan (`approvalKept`) and by the lab chips (a stale approval no longer shows CONFIRMED).
Minor: absent/undefined JSON keys treated alike in the fingerprint and diff; rollback header documents the order (code first, demote approved rows); helper header; rights note says "own media (photo/video)".

### Decisions for the Owner (not implemented, by design)
- **Content-bound approval vs persistent demotion.** Today an edit after approval blocks publication at the gate, but the stored status stays `OWNER_APPROVED` with the old fingerprint; restoring exactly the approved content makes it valid again without a new review. Anything that reads `status` directly instead of the gate (future admin, concierge, sitemap) must use `approvalValid`. Alternative: demote to DRAFT on every write (admin, Sprint 11) — stricter, needs the write path.
- **Rights are outside the approval.** Changing a media item from UNVERIFIED to OWNER_ATTESTED after approval makes it public without re-reviewing the text (the loader still shows it in the diff). Trip-level fields (title, legacy description, highlights) are also outside the fingerprint (RT-113 scope).
- **Video data.** The loader records the video rights as OWNER_ATTESTED (Owner's own clip, visual approval 17/10); the mobile rendition's visual quality is still pending the Owner's judgement (RT-116).

### Undoing a local load
Drop the throw-away database, or delete the trip's rows from `TripImage`, `TripFaqItem`, `TripItineraryStop` and `TripContent` (in that order) — the loader never wrote anything else.
