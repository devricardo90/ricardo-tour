# Sprint 10 — public release plan for TOUR-01/02/03 (prepared, NOT executed)

**Status:** prepared on 21/10/2026 from branch `sprint10/integration-tour-01-02-03` (local only). Release gate: **NO-GO** (RT-120). Nothing in this plan may run without the Owner's written authorization for each step. It complements, and does not replace, [rt-100-deployment-backup-recovery-plan.md](rt-100-deployment-backup-recovery-plan.md) (backup, pre/post-checks, recovery tree) and [release-rollback-runbook.md](release-rollback-runbook.md) (publication, smoke tests, rollback rule). No internal costs here.

## 1. What the release contains

- **Public route integration** (`d249fab`): `/{locale}/tours/[id]` renders the Owner-approved design only when BOTH gates pass for the locale; otherwise the current page stays.
  - Content gate (`lib/catalog/tour-content.ts`, audience `public`): `TripContent` `OWNER_APPROVED` with a matching fingerprint; media only when rights are verified and authorized by the same approval act.
  - Presentation gate (`lib/catalog/public-tour-presentation.ts`): only TOUR-01/02/03; hero title and pitch `CONFIRMED` for the locale; every `PROVISIONAL`/`PENDING`/`MOCK` fact, provisional prices and lab notices are dropped.
  - Prices: `PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS` is empty, so the public price reads "Orçamento sob consulta". Adding TOUR-03 there publishes the approved table and "A partir de R$ 260 por pessoa"; that needs a separate Owner authorization.
  - Failure mode: if the content tables are unreachable, the page falls back to the current view (no 500).
- **Security fix** (`e71f5c4`): the proxy refuses disabled `rebuild-lab` routes before rendering. Before the fix, a production-mode 404 carried the lab page in its RSC payload; today's production already leaks the lab index text this way (no prices).
- **Approved visual and commercial work** (`6315ce0`, `8f22c7c`, `8d5a080`, `e25f232`, `87b57ca`) and everything already on `sprint10/tours-content` (RT-100, RT-104 guard, RT-110 booking guard, RT-113/RT-119 content model).

## 2. Database dependencies (production does not have them)

The branch is 61+ commits ahead of `main` and carries 5 migrations that production has never received:

| Order | Migration | Adds | Rollback |
|---|---|---|---|
| 1 | `20261013120000_rt100_operation_type_partner_commercial` | `Trip.operationType`, `Trip.partnerId`, `Partner`, `TripCommercial`, `TripCommercialRate` | SQL in the migration header (drops the new tables and their data) |
| 2 | `20261016120000_rt113_tour_content_gallery` | `TripContent`, `TripItineraryStop`, `TripImage` | `rollback.sql` |
| 3 | `20261017180000_rt113_faq_conditions_media` | `TripFaqItem`, conditions/optional services, media/video fields | `rollback.sql` |
| 4 | `20261017200000_rt113_approval_fingerprint` | approval fingerprint | `rollback.sql` |
| 5 | `20261017220000_rt113_durable_approval_media_publication` | invalidation triggers, `publicationApprovedAt` | `rollback.sql` |

- **The code cannot go first.** The public catalog already reads `Trip.operationType` and `Partner` (RT-100), and `main` auto-deploys production. Merging before migration 1 breaks `/tours`. The order is always migration → code.
- **Rehearsed locally on 21/10/2026.** All 23 migrations applied cleanly to an empty throw-away database (`rt119_*`, local Docker). This does not prove anything against production data; the section 4 pre-checks of the RT-100 plan are still required.
- **Operational trap (proven locally).** The RT-119 triggers demote approved content to DRAFT when a trip's public fields change after approval ("Trip public field changed after approval"). Final `Trip` fields (title, description, image) must therefore be written **before** the approval act, never after.

## 3. Release order (never reversed)

1. **Owner decisions (blocking):**
   - Written authorization naming the target database, window and exact commit.
   - Editorial status of TOUR-01 (title/pitch still `PROVISIONAL`) and of EN/ES (RT-115).
   - Media rights per item (RT-116).
   - Terms (RT-81/RT-118) and transport documents (Manual §12.2, §10.6.1).
   - Price publication (RT-120).
2. **Infrastructure checks (blocking):**
   - Grant the Vercel connector access to the project team, or install the CLI. On 21/10 the MCP returned 403 on `devricardo90s-projects`.
   - Confirm Preview and Production use **separate** databases (RT-104…108).
   - Confirm the plan's commercial-use terms (Hobby vs Pro is an Owner decision; nothing is contracted here).
3. **Backup and pre-checks** of the production database, per sections 3–4 of the RT-100 plan, including a restore test into a local throw-away database.
4. **Apply migrations 1→5** in one window, with post-checks after each (section 6 of the RT-100 plan). The old code is unaffected, because it does not select the new columns or tables.
5. **Content.**
   - Update the three `Trip` rows (approved titles, descriptions, images); today production still shows the old "Confeitaria Colombo" name for TOUR-03.
   - Load each tour's content as DRAFT through the RT-119 loader, with a per-batch diff approved by the Owner.
   - Record verified rights per media item.
   - Run the approval act (`approveTourContent`) only after the Owner approves.
6. **Preview** deployment of the exact commit, pointing at a migrated **non-production** database:
   - smoke tests (section 5);
   - lab paths return the bare 404.
7. **Merge to `main`** (fast-forward of the reviewed commit; `main` auto-deploys production) only with the Owner's release authorization.
8. **Production smoke tests and log review** (section 5); keep the previous deployment as the rollback target.

## 4. Rollback

| Situation | Action |
|---|---|
| New code misbehaves | Vercel instant rollback to the previous production deployment. The previous code is compatible with the migrated schema, so the database stays as it is |
| Approved design shows something wrong | Demote the tour's content to DRAFT (any content edit does it; or revert `approvedContentHash`): the page falls back to the current view immediately, no deploy needed |
| Price shown by mistake | Remove the tour from `PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS` and redeploy, or roll back the deployment |
| Migration failure / schema revert | Follow the RT-100 recovery tree: never re-run blindly; `rollback.sql` in reverse order 5→1 only after exporting the new tables; then fix `_prisma_migrations` |

## 5. Smoke tests (Preview first, then production)

- `/pt/tours` and `/pt` list the four tours and link to them.
- For each tour and locale, the page is the approved design only where both gates pass, and the current page otherwise.
- No review chips, lab banners, `MOCK`/`FICTÍCIO` text, provisional prices or booking form on the approved design.
- Public prices show only the quote-on-request wording until price publication is authorized.
- Buttons:
  - TOUR-03 "Solicitar disponibilidade" opens the official WhatsApp with the prefilled inquiry;
  - TOUR-02 jumps to the request section, which offers the WhatsApp request;
  - the mobile bar never clips the price (320–430 px).
- `POST /api/bookings` stays refused for the four own tours (RT-110).
- Every `/{locale}/rebuild-lab/...` path returns a bare 404 with no page payload.
- Canonical URL `https://www.ricardotour.com/...`, JSON-LD present, no console errors, no horizontal overflow, logs clean.

## 6. Local evidence (21/10/2026)

- Full suite on a clean LF checkout of `e71f5c4`: **944 passed, 0 failed, 6 skipped**. In CRLF working copies the RT-113 migration checksum test fails only because of `core.autocrlf`; the committed blob is intact. Suggested fix: `.gitattributes` with `*.sql text eol=lf`, an Owner-approved repository change.
- `next build` (production) passed, with no real database and the lab disabled.
- `next start` (production mode) against a throw-away database with fictitious trips and test-only rights attestations:
  - TOUR-03 PT and TOUR-02 PT/EN/ES render the approved design;
  - TOUR-03 EN/ES, TOUR-01 and TOUR-04 keep the current page;
  - the public payloads carry no hidden prices, statuses, rights notes or lab data;
  - lab paths return a 9-byte 404.
