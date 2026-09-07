# Rebuild Lab Route and Environment

## Baseline

- Branch: `main`
- HEAD at start: `847c68f923b530b1ea2a768958f8b0fdc7d22d63`
- Origin main at start: `847c68f923b530b1ea2a768958f8b0fdc7d22d63` (HEAD == origin/main, ahead 0, behind 0, worktree clean)
- Issue: RT-8
- Canonical code: RT-RB-S0-04
- Task: Definir rota/ambiente isolado de rebuild lab
- Classification: AGENT (Jira labels `agent`, `rick-travel`, `sprint-0`, `visual-rebuild`)
- Sprint: Sprint 0 - Foundation & Audit (Jira sprint id 100, state ACTIVE, board 100)
- Jira Acceptance Criteria: "Protótipo acessível sem alterar a Home pública."
- Jira Validation: "Verify canonical code, labels, sprint assignment, and isolated route/environment evidence when execution occurs."
- Authoritative source: "Rick Travel - Visual Rebuild Source of Truth", Sprint 0 row RT-RB-S0-04 (mode AGENT, initial status BACKLOG, sprint goal "Congelar arquitetura de trabalho, inventariar Home atual e criar rebuild lab"). The document itself is not stored in this repository; registering it in-repo is RT-5 / RT-RB-S0-01 and is still BACKLOG.
- Predecessor evidence: RT-6 / RT-RB-S0-02 (`docs/architecture/current-home-architecture-audit.md`) and RT-7 / RT-RB-S0-03 (`docs/architecture/current-home-inventory.md`, 18 regression risks, all DOCUMENT ONLY).

### Reading of the Jira contract

The RT-8 description carries the same generic "Scope Out" block as RT-6 and RT-7 ("Do not start any sprint, implement application code, modify production, commit, push, or change unrelated Jira issues"). That block is issue-seeding boilerplate: it is identical across all 47 rebuild issues, including issues whose whole purpose is implementation. The issue-specific fields govern, and they are unambiguous - the Acceptance Criteria requires an accessible prototype, the Validation line asks for "isolated route/environment evidence **when execution occurs**", and the sprint goal names "criar rebuild lab" as a Sprint 0 deliverable. RT-8 is therefore executed as a route/environment implementation, with production behaviour preserved.

## Decision

A new route segment `/{locale}/rebuild-lab` is the rebuild lab. It is a sibling of the `(public)` route group, not a member of it.

| Decision | Choice | Rationale |
| --- | --- | --- |
| Route | `/{locale}/rebuild-lab` | Locale-aware like every other app route, so `proxy.ts` i18n routing applies unchanged. Named for its purpose, not for a product surface, so it cannot be mistaken for a Home candidate URL. |
| Placement | `app/[locale]/rebuild-lab/` - outside `(public)` | Follows the existing convention for non-public segments (`app/[locale]/admin`, `app/[locale]/login`). Being outside the group is what makes the isolation structural rather than conventional. |
| Layout | Own layout, `PublicLayout` **not** reused | Closes the RT-7 deferral. See "Layout decision" below. |
| Availability | `REBUILD_LAB_ENABLED`, resolved by `lib/rebuild-lab/config.ts` | Closes the RT-7 lab-environment deferral. See "Environment decision" below. |
| Indexing | `robots: { index: false, follow: false }` in route metadata | Keeps the lab out of search results without editing `app/robots.ts` or the root `robots.ts`, so the unresolved robots/domain question (RT-7 risk 5) stays untouched. |
| Sitemap | No change | `app/sitemap.ts` builds from an explicit `staticRoutes` array plus published trips. A new segment does not enter it by default and none was added. |
| Data | None | The lab shell reads no database, no API, and no product content, so the RT-6 warning about prototypes silently faking production data does not apply yet. |

### Layout decision

RT-7 left the choice open: reusing `PublicLayout` inherits `HeroHeader` and `AIConciergeWidget` but still not the footer; defining a new layout loses both.

The lab defines its own layout. Reuse was rejected because it makes the lab a live public route sharing a mount tree with `tours`, `contato`, `quem-somos` and `reservas`: any header, skip-link or Concierge experiment performed for the rebuild would immediately change all of them. The Acceptance Criteria is "without altering the public Home", and a shared layout cannot guarantee that as the lab grows.

RT-7 risk 2 warns that a lab with its own layout "silently loses the Concierge mount". The word that matters is *silently*. Here the omission is explicit: it is stated in the layout source comment, listed on the lab page itself as an isolation boundary, asserted by a test, and recorded in this table.

| Surface | Production mount today | Lab mount | Evidence | Later owner |
| --- | --- | --- | --- | --- |
| `HeroHeader` | Layout-level, `app/[locale]/(public)/layout.tsx:2,21` | Not mounted | RT-7 risk 1 | RT-RB-S4-06 |
| Skip link ("Pular para o conteúdo principal") | Layout-level, hardcoded Portuguese, `app/[locale]/(public)/layout.tsx:19` | Not mounted; not copied, so the hardcoded-locale defect is not duplicated | RT-7 risk 18 | RT-RB-S4-06 / localization follow-up |
| `AIConciergeWidget` | Layout-level, `app/[locale]/(public)/layout.tsx:11,25` | Not mounted | RT-7 risks 2, 10 | RT-RB-S4-04 |
| `FooterSection` + Cadastur | Home-level, `app/[locale]/(public)/page.tsx:13,68` | Not mounted; the Cadastur mark is not duplicated or restated | RT-7 risks 3, 4, 8, 17 | RT-RB-S4-02 / RT-RB-S4-06 |

Nothing above is a decision about where these belong in the rebuilt Home. They stay open for their listed owners.

### Environment decision

`lib/rebuild-lab/config.ts` exports `isRebuildLabEnabled(env)`. It mirrors the resolution shape already used by `lib/ai-concierge/config.ts` rather than introducing a second flag idiom:

- An explicit `REBUILD_LAB_ENABLED` of `1|true|yes|on` enables, and `0|false|no|off` disables.
- With no recognised value, the lab is disabled when `VERCEL_ENV` or `NODE_ENV` is `production`, and enabled otherwise.

The second bullet is more restrictive than "not production" reads, because `NODE_ENV` is `production` on **every** Vercel deployment, Preview included - Vercel only sets `NODE_ENV=development` for `vercel dev`, and `next build`/`next start` force `production` regardless. The `NODE_ENV` disjunct therefore fires on Preview as well as Production. The resolved default is:

| Environment | `VERCEL_ENV` | `NODE_ENV` | Lab with no flag set |
| --- | --- | --- | --- |
| Local development (`next dev`) | unset | `development` | **Enabled** |
| Vercel Preview | `preview` | `production` | **Disabled (404)** |
| Vercel Production | `production` | `production` | **Disabled (404)** |
| Local production build (`next build` + `next start`) | unset | `production` | **Disabled (404)** |

Consequences: the lab is reachable in local development, which satisfies "protótipo acessível"; everywhere `NODE_ENV` is `production` - Vercel Preview and Vercel Production alike - it returns 404 unless the Owner sets `REBUILD_LAB_ENABLED` explicitly, so no deployed environment gains a new surface by default and current production behaviour is preserved. `app/[locale]/rebuild-lab/layout.tsx` calls `notFound()` when the flag resolves false, so the gate covers every future child route of the lab, not only the current page.

Enabling the lab on a deployment is therefore always a deliberate act: set `REBUILD_LAB_ENABLED=true` (or `1`/`on`). **Scope that variable to the Preview environment only if the intent is to expose Preview without exposing Production** - a Vercel project-level environment variable applies to all environments, including Production, unless it is scoped. `false`/`0`/`off` always disables, in every environment, and an unrecognised value falls back to the environment default above rather than enabling.

Enabling the lab on a deployment makes it publicly reachable by URL. The `noindex, nofollow` metadata keeps it out of search indexes; it is a crawler directive, not access control, and it grants no protection against anyone who knows or guesses the URL. Whether the lab should ever be exposed on a deployment, and behind what access control, remains an Owner decision (see "Open items handed forward").

Two intentional limits:

- Only `REBUILD_LAB_ENABLED` exists. No `NEXT_PUBLIC_` twin was added; the gate is server-side and a public twin would create a second source of truth for the same decision (the pattern RT-7 risk 9 already flags for the Concierge).
- Because `app/[locale]` declares no `generateStaticParams`, these routes render on demand, so the flag is read per request rather than baked at build time. Changing the value on a hosting provider still requires the usual redeploy for the new environment value to take effect.

`.env.example` gains `REBUILD_LAB_ENABLED`, commented out so that copying the file preserves the default rather than disabling the lab locally. Only this new key was added. `AI_CONCIERGE_ENABLED`, `NEXT_PUBLIC_AI_CONCIERGE_ENABLED` and `PUBLIC_SITE_URL` remain undocumented: that is RT-7 risk 9, its disposition is DOCUMENT ONLY, and it is owned by RT-RB-S6-04. Documenting the key this task introduces is not an action on risk 9; it prevents adding a fourth instance of it.

## What changed

| File | Change | Purpose |
| --- | --- | --- |
| `lib/rebuild-lab/config.ts` | New | Lab availability flag resolution |
| `app/[locale]/rebuild-lab/layout.tsx` | New | Isolated lab shell, availability gate, `noindex` metadata |
| `app/[locale]/rebuild-lab/page.tsx` | New | Lab entry page: isolation contract and empty prototype stage |
| `tests/rebuild-lab-route.test.tsx` | New | Flag matrix, gate behaviour, isolation assertions |
| `.env.example` | Modified | Documents `REBUILD_LAB_ENABLED` only |
| `docs/architecture/rebuild-lab-route.md` | New | This record |

No file under `app/[locale]/(public)/` was modified. `app/robots.ts`, the root `robots.ts`, `app/sitemap.ts`, `proxy.ts`, `next.config.ts`, `package.json` and `package-lock.json` were not modified. No dependency was added. No asset was created, deleted, moved, renamed or optimized.

## Lab shell copy

The lab shell carries internal engineering text only - route identity, isolation boundaries, and the flag name. It is deliberately not routed through `messages/*.json`, because adding keys would require inventing product copy in four locales for a surface that has no approved copy yet.

This is a scoped exception for internal lab chrome, and it is not a precedent: RT-7 risk 13 concerns *product* copy escaping the i18n bundles, and nothing in this shell may be carried into the rebuilt Home without going through `messages/*.json`. When the lab starts hosting real Home sections, their copy follows the normal i18n workflow.

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | Pass |
| Types | `npm run typecheck` | Pass |
| Unit tests | `npm run test` | Pass, 6 files / 32 tests, including the new lab tests |
| Whitespace | `git diff --check` | Clean |

Runtime smoke check, `next dev --webpack` against this working tree:

| Check | Configuration | Result |
| --- | --- | --- |
| `/pt/rebuild-lab` reachable | flag unset, development | HTTP 200, page renders the isolation contract and the prototype stage |
| Lab excluded from indexing | flag unset, development | Served HTML carries `<meta name="robots" content="noindex, nofollow">` |
| Lab isolation | flag unset, development | Served HTML contains no skip link, no `ai-concierge-*` element, no `/cadastro/cadastur.png`, no `imagem-rio-perfil` hero image |
| Lab gate | `REBUILD_LAB_ENABLED=false` | HTTP 404 |
| Public Home unaffected | both configurations | `/pt` HTTP 200, still serving header skip link, AI Concierge and the Cadastur footer, and containing no reference to the lab route |

The unit tests assert the flag matrix in both directions, that the layout calls `notFound()` when the lab is disabled and renders its children when enabled, that both layout and page metadata declare `index: false, follow: false`, and that the rendered lab tree mounts none of `HeroHeader`, `AIConciergeWidget`, `FooterSection`, `HeroSection` or `ReservationsSection`. The last assertion is a standing guard: a future edit that pulls a production Home component into the lab fails the suite.

Not verified in this task: Lighthouse, Core Web Vitals, screenshots and any transfer-size measurement. Those are RT-9 / RT-RB-S0-05 and were not executed. No production deployment was made and no production environment value was read.

## Non-goals

Not done here, and not to be inferred from this route existing:

- No visual design, design tokens, typography, grid, motion, or cinematic hero (Sprint 1 and Sprint 2).
- No Home section, no Flight Planner, no AI Concierge integration (Sprint 4 and Sprint 5).
- No replacement, redirect, or rewrite of the production Home; no cutover plan (RT-RB-S6-07).
- No performance baseline or screenshots (RT-9).
- No asset deletion or optimization. RT-7 classified 13 files as `ASSET_UNREFERENCED_IN_REPO`; that classification carries no deletion clearance and none was taken.
- No robots file chosen, no domain chosen, no Cadastur or trust-mark decision.
- No dependency added or removed; no change to `package.json` or `package-lock.json`.
- No Jira transition performed by this task.

## RT-7 risk disposition after RT-8

All 18 risks remain DOCUMENT ONLY. None was remediated, reclassified or closed here.

| Risk | Relevance to RT-8 | Handling |
| --- | --- | --- |
| 1 Header layout-level, footer Home-level | Direct | Recorded in the mount table; lab mounts neither |
| 2 AI Concierge layout-level | Direct | Omission made explicit in source, page, test and this record |
| 3 Home-only replacement can drop the footer | Direct | The lab replaces nothing; the Home keeps its own footer import |
| 9 Config keys absent from `.env.example` | Lab environment | Only the new lab key documented; the three pre-existing keys untouched |
| 10 Concierge defaults off in production | Lab environment | Recorded as context; the lab does not mount or re-enable the Concierge |
| 16 Split motion stack | Lab motion | No motion library used by the lab shell; the third pattern is not created |
| 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 17, 18 | Not owned by RT-8 | No action; owners unchanged |

## Open items handed forward

- Where the header, footer and AI Concierge mount inside the rebuilt Home (RT-RB-S4-02, RT-RB-S4-04, RT-RB-S4-06).
- The data strategy for prototypes that need trips, once the lab hosts a section that renders them (RT-6 warning about not silently faking production data).
- Whether the lab should ever be exposed in production, and under what access control if so (Owner).
- Cutover and rollback from lab to production Home (RT-RB-S6-07).
