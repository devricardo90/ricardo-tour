# Sprint 9 — Git relationship analysis and safe integration strategy (2026-10-12)

Authority: Owner addendum to Sprint 9 (item 5). **Analysis only. No merge, rebase, push, checkout of another branch, stash or deletion was performed.** All commands used were read-only (`git fetch`, `merge-base`, `rev-list`, `diff`, `merge-tree --write-tree`), plus a throw-away rehearsal worktree that has been removed.

## 1. Where each branch stands

| Branch | Tip | Relation to `origin/main` (`40136a3`) | Remote |
|---|---|---|---|
| `origin/main` | `40136a3` | — (production auto-deploys from `main`) | yes |
| `sprint-8a/quality-closure` | `ba2d8f5` | 2 commits ahead, 0 behind | pushed |
| `daniela/rt-96-audit` | `866a7e0` | 4 commits ahead, 0 behind | pushed |
| `sprint9/commercial-foundation` | 6 commits at the time of writing (tip recorded in Jira) | 6 ahead, 0 behind | **not pushed** (local worktree only) |

All three feature branches **fork from the same commit `40136a3`**; none contains another. They are parallel lines.

**Answer to "is Sprint 9 based on code earlier than the Sprint 8A corrections?"** Yes. Sprint 9 starts from `40136a3`, which does **not** include the two Sprint 8A commits (`c7eb334`, `ba2d8f5`) nor the four RT-96 Daniela commits. This does not currently matter for Sprint 9's content (see 2), but it will matter when anything in Sprint 9 starts to change runtime code (RT-100) because the 8A branch edits shared files.

## 2. What each branch changes (vs `origin/main`)

- **Sprint 8A (37 files):** performance/accessibility/QA closure: hero globe texture worker and loader, header and logo components, a few colour classes in public pages (`tour-detail-view.tsx`, `contato`, `quem-somos`, `site-theme.css`), `eslint.config.mjs`, `package.json` (one new script), `e2e/public/public-critical-flows.spec.ts`, a cross-browser Playwright config, many `scripts/rt-45/46/64-*.mjs`, one evidence doc.
- **RT-96 Daniela (7 files):** `app/api/ai-concierge/route.ts`, `lib/ai-concierge/observability/notify.ts`, three test files, the audit doc and one line block in the source-of-truth mirror. Daniela is disabled by flag, so there is no public effect.
- **Sprint 9 (16 files, docs + favicon):** `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `e2e/public/favicon.spec.ts`, `tests/favicon-assets.test.ts`, favicon/media helper scripts and documentation under `docs/` (no runtime code).

**File overlap between Sprint 9 and the others: none.** Sprint 9 only adds files that neither other branch touches, or replaces `app/favicon.ico`, which neither touches.

## 3. Conflict check and integration rehearsal (evidence)

| Check | Result |
|---|---|
| `git merge-tree` Sprint 9 + 8A | clean |
| `git merge-tree` Sprint 9 + Daniela | clean |
| `git merge-tree` 8A + Daniela | clean |
| 8A + Daniela + Sprint 9 all together | clean |
| Do 8A edits shift code lines that Sprint 9 documents cite (e.g. `tour-detail-view.tsx:38,49,201`)? | No: 8A changes only Tailwind colour classes in that file; the cited lines are unchanged at the 8A tip |

A **throw-away detached worktree** with all three branches combined (unreferenced temporary commit, since removed) was validated:

- `tsc --noEmit`: 0 errors.
- `vitest`: **43 files passed / 1 skipped; 727 tests passed, 6 skipped** (Sprint 8A alone reported 714; the combined count also includes the Daniela and Sprint 9 test files).
- ESLint: 0 errors (same 2 pre-existing warnings).
- Public Playwright suite against a **local production build** (desktop + Pixel 7): first run **47 passed, 5 skipped, 8 failed** — all 8 were Pixel 7 navigation timeouts at the end of a ~10-minute run while other heavy processes were running on the same machine. Re-running exactly those 8 tests on the same build: **8/8 passed in 17 s**. The earlier failures were therefore load-related, not an integration defect; they are recorded here as an observation (the suite is slow and load-sensitive on this machine), not hidden. A development-server run also showed a 60 s cold-compile timeout once; the project's own evidence (Sprint 8) already recommends running E2E against a production build.

## 4. Proposed integration strategy (needs Owner authorization for every step that touches `main`)

Principles: `main` auto-deploys to production, so **any push or merge to `main` is a production release** and stays the Owner's call. Nothing below is executed without that authorization.

1. **Keep the branches parallel and independent.** Because there is no overlap, the order does not affect correctness. Recommended release order by risk: (a) Sprint 8A (quality; has its own evidence and Owner design-freeze items), (b) Daniela RT-96 (flagged off), (c) Sprint 9 (docs + favicon; the favicon needs the Owner Visual Gate first).
2. **Integrate through pull requests, not by pushing `main`.** Open one PR per branch against `main`; use the Vercel Preview of each PR for the Owner's validation. Pushing a branch triggers a Preview deployment (not production); **this has not been done for Sprint 9** — decision requested below.
3. **Before each real merge, re-run the rehearsal** (merge-tree + a temporary combined worktree + the checks above) on the then-current `main`, since `main` may move.
4. **Update Sprint 9 onto the latest `main` once earlier PRs land** (merge `main` into the branch, or rebase if the Owner prefers a linear history; either is safe here). Do this **before starting RT-100**, so schema/gate work is built on the 8A code.
5. **Do not squash away evidence** unless the Owner prefers it; each Sprint 9 commit message names its Jira ticket.
6. **Preserve local work.** The main checkout (on `daniela/rt-96-audit`) has uncommitted changes (`app/[locale]/rebuild-lab/page.tsx`, untracked `rebuild-lab/*` directories, `.tmp/`, `debug.log`, RT-17 docs/scripts, `skills.md`, and a deleted `public/images/seals/cadastur-official.png`). None of the branches above touches those paths, so they do not conflict, but **do not switch branches, pull or clean in that checkout** without first committing them to a dedicated WIP branch (Owner's choice). They were never modified or discarded by this work.
7. **Rollback:** every PR is independently revertible; Sprint 9 contains no schema or runtime change so far.

## 5. Decisions requested from the Owner

1. May the agent **push `sprint9/commercial-foundation` to `origin`** (a branch push; it can trigger a Vercel Preview but not production) so the favicon can be reviewed in a real preview?
2. Preferred integration style: **merge commit** or **rebase** when Sprint 9 is brought up to date with `main`?
3. Should the Owner's uncommitted local work in the main checkout be **committed to a WIP branch** (agent can do it on request) before any branch switch?

## 6. Housekeeping notes

- A `.next-integ`/`.next-s9` build output and temporary worktrees were created and removed; the Sprint 9 worktree (`../rick-travel-s9`) remains and uses a junction to the main checkout's `node_modules` (remove the junction with `rmdir`, never recursive delete, before removing that worktree).
