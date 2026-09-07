# Current Home Performance and Screenshot Baseline

## Baseline

- Branch: `main`
- HEAD at capture: `10cbf642107aa499ddf0b59370b4580fcb1332f4` (HEAD == origin/main, ahead 0, behind 0, worktree clean)
- Issue: RT-9
- Canonical code: RT-RB-S0-05
- Task: Baseline de performance e screenshots da Home atual
- Classification: AGENT (Jira labels `agent`, `rick-travel`, `sprint-0`, `visual-rebuild`)
- Sprint: Sprint 0 - Foundation & Audit (Jira sprint id 100, state ACTIVE, board 100)
- Jira Acceptance Criteria: "Baseline guardado para comparação posterior."
- Jira Validation: "Verify canonical code, labels, sprint assignment, screenshots, and performance baseline evidence when execution occurs."
- Captured at: `2026-09-07T16:40:09.729Z`
- Predecessors: RT-6 / RT-RB-S0-02 (`current-home-architecture-audit.md`), RT-7 / RT-RB-S0-03 (`current-home-inventory.md`, 18 risks, all DOCUMENT ONLY), RT-8 / RT-RB-S0-04 (`rebuild-lab-route.md`, commit `10cbf64`).

### Source of truth availability

The authoritative "Rick Travel - Visual Rebuild Source of Truth" is **not readable from this environment**. Confluence is not provisioned on the Atlassian site (`/wiki/api/v2/spaces` returns 404), and registering the document in-repo is RT-5 / RT-RB-S0-01, still BACKLOG. This baseline therefore rests only on the RT-9 Jira issue and corroborated repository evidence.

### What RT-9 requires, read from Jira

The subject is **the current public Home**, not the rebuild lab. RT-9 measures what exists today so later rebuild work has a fixed point of comparison. Jira names two deliverables - screenshots and performance baseline evidence - and requires the result be *saved* for later comparison. RT-6's Sprint 0 implications add the targeting guidance followed here: `/{defaultLocale}` (`/pt`) plus middleware-resolved root behaviour, capturing database-backed trip rendering, header, AI Concierge flag state, and the current dark Home shell.

The generic "Scope Out" block in the RT-9 description is the same issue-seeding boilerplate carried by RT-6, RT-7 and RT-8; the issue-specific fields govern, as established in `rebuild-lab-route.md`.

## Method

| Aspect | Choice | Rationale |
| --- | --- | --- |
| Build | `npm run build` (`next build --webpack`), served with `npx next start -p 3200` | A production build is the only meaningful performance baseline; `next dev` is unoptimised and would not be comparable to later measurements. |
| Instrumentation | Playwright (`playwright-core`) + Chrome DevTools Protocol | Already installed as project tooling (`@playwright/test`, Chromium in the Playwright cache). **No dependency was added.** |
| Timings | `PerformanceObserver` (LCP, CLS) + Navigation Timing + Paint Timing, read in-page | Direct Web Vitals measurement rather than a synthesised score. |
| Bytes | CDP `Network.loadingFinished.encodedDataLength` | Authoritative on-the-wire byte counts, including the HTML document itself. |
| Repetition | 3 runs for `/pt` desktop and `/pt` mobile; medians reported, all runs retained | The first run of a fresh server is consistently slower; a median is honest where a single sample is not. |
| Harness | `scripts/baseline-home.mjs` | Committed so the baseline is reproducible for the "comparação posterior" the Acceptance Criteria requires. Not imported by the app, not part of any build. |

### What each metric actually measures

Stated precisely, because two of these deviate from the standard Web Vitals definitions and a later reader must not compare them against field data.

| Column | Source | Exact computation | Note |
| --- | --- | --- | --- |
| TTFB | Navigation Timing | `responseStart - requestStart` | **Server response latency only**, measured through Navigation Timing. DNS, connect, TLS and redirect setup are excluded, so this is **not** standard field / Web-Vitals TTFB, which is `responseStart` measured from navigation start. Valid for comparing a rebuilt Home measured by this same harness; not comparable to field TTFB. |
| FCP | Paint Timing | `first-contentful-paint` entry `startTime` | Standard. `first-paint` is captured separately and is not used anywhere in this document. |
| LCP | `PerformanceObserver`, `largest-contentful-paint`, `buffered: true`, installed before navigation | `startTime` of the last observed candidate | Standard for a load-only capture. |
| CLS | `PerformanceObserver`, `layout-shift`, `buffered: true` | raw sum of `entry.value` where `hadRecentInput === false`, from navigation until the metrics snapshot | **Not the standard CLS session-window algorithm.** A raw accumulation is an upper bound on session-window CLS, so treat it as an accumulated layout-shift baseline for this harness rather than as a field CLS value. **Initial-load only:** the metrics snapshot is taken before the screenshot preparation scroll, so scroll-induced shifts are excluded by construction. |
| load | Navigation Timing | `loadEventEnd` | Absolute, from time origin. |
| Transfer | CDP `Network.loadingFinished` | sum of `encodedDataLength` | Encoded on-the-wire bytes, response headers included - not decoded body size, not uncompressed resource size. |
| Requests | CDP `Network.requestWillBeSent` / `Network.responseReceived` | count of requests that received a response | Requests that never received a response are excluded. No measured route redirects: every target here is a direct 200. |

Neither the TTFB nor the CLS deviation changes a stored number, and neither is altered here - RT-9 records what the harness measured. They are named so that a later comparison re-uses this same harness instead of reading these values as real-user metrics.

### Environment captured

- `NODE_ENV=production`
- `AI_CONCIERGE_ENABLED` unset -> Concierge resolves **disabled** in production
- `REBUILD_LAB_ENABLED` unset -> rebuild lab resolves **disabled** (verified: `/pt/rebuild-lab` -> HTTP 404)
- `PUBLIC_SITE_URL` unset -> metadata falls back to `https://rick-travel.vercel.app`
- Database: local Postgres `localhost:5433/ricktravel`, 8 trips, **7 published**, 1 draft

## Results

`/pt` desktop and mobile are 3 runs; the remaining rows are single runs.

**Not every field in this section is a median.** TTFB, FCP, LCP, CLS, load, Transfer and Requests are medians. The remaining evidence fields - **DOM node count**, **page height**, **LCP element attribution**, the **transfer composition** table, the **heaviest requests**, the **image and request composition**, and the **~71 % image-weight** and **~37 % hero-weight** figures derived from that composition - are taken from **run 0, the representative first run**, not from medians. On `/pt` desktop the run-0 total and the median total differ by 14 bytes, 0.001 %, so both percentages are identical either way; the distinction is one of provenance, not of arithmetic.

| Route | Viewport | HTTP | TTFB | FCP | LCP | CLS | load | Transfer | Requests | DOM nodes | Page height |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/pt` | desktop 1440x900 | 200 | 34 ms | 184 ms | 184 ms | 0.0027 | 220 ms | **1257.1 KiB** | 43 | 558 | 4353 px |
| `/pt` | mobile 390x844 | 200 | 31 ms | 140 ms | 140 ms | 0 | 186 ms | **872.4 KiB** | 38 | 562 | 6980 px |
| `/pt` | tablet 768x1024 | 200 | 22 ms | 204 ms | 204 ms | 0 | 259 ms | 714.5 KiB | 39 | 560 | 4879 px |
| `/en` | desktop 1440x900 | 200 | 29 ms | 184 ms | 184 ms | 0.003 | 213 ms | 1262.1 KiB | 43 | 562 | 4299 px |
| `/es` | desktop 1440x900 | 200 | 33 ms | 172 ms | 172 ms | 0.003 | 202 ms | 1258.3 KiB | 43 | 560 | 4299 px |
| `/sv` | desktop 1440x900 | 200 | 26 ms | 172 ms | 172 ms | 0.003 | 199 ms | 1256.2 KiB | 43 | 560 | 4325 px |

Per-run spread, `/pt` desktop: TTFB 34/50/32 ms, FCP 216/184/160 ms, LCP 224/184/160 ms, load 250/220/190 ms. Timings vary run to run by roughly a third on a loopback measurement, which is why medians are reported and why these numbers are a reference point rather than a precise figure. Transfer bytes and request counts, by contrast, are stable to within a fraction of a percent and are the more reliable half of this baseline.

**LCP element on every route and viewport:** `img.absolute.inset-0` - the hero still `public/videos/imagem-rio-perfil.jpg`, `<link rel="preload">`ed in the document head with a srcset up to 3840w and `imageSizes="100vw"`.

### Transfer composition

First-run (run 0) composition, per the provenance note above; the total row carries the median total.

| Type | `/pt` desktop | `/pt` mobile |
| --- | --- | --- |
| Image | 8 req, **898.5 KiB** | 7 req, **511.4 KiB** |
| Script | 20 req, 307.7 KiB | 20 req, 307.7 KiB |
| Document | 1 req, 22.2 KiB | 1 req, 22.2 KiB |
| Stylesheet | 1 req, 17.8 KiB | 1 req, 17.8 KiB |
| Fetch | 13 req, 10.9 KiB | 9 req, 13.4 KiB |
| **Total** | **43 req, 1257.1 KiB** | **38 req, 872.4 KiB** |

Images are **71 %** of desktop weight (run-0 image bytes against the median total). The single heaviest request is the hero at **463.0 KiB** (`/_next/image?url=%2Fvideos%2Fimagem-rio-perfil.jpg&w=1920&q=75`), 37 % of the whole page. The remaining image weight is seven database-driven trip photographs served through `/_next/image` at `w=640&q=75` (101.2, 97.5, 70.4, 56.0, 38.6, 37.3, 34.5 KiB).

The served HTML document is 111,110 bytes uncompressed, 22.2 KiB on the wire.

### Route and middleware behaviour

| Check | Result |
| --- | --- |
| `GET /` (no locale) | HTTP 307 -> `/pt`, then HTTP 200 |
| `/pt`, `/en`, `/es`, `/sv` | HTTP 200, correct `<html lang>` per locale |
| `/pt/rebuild-lab` | HTTP 404 (RT-8 gate, production default; unchanged by RT-9) |
| Localized `<title>` | pt "Passeios exclusivos no Rio de Janeiro" / en "Rio de Janeiro Experiences" / es "Experiencias en Río de Janeiro" / sv "Upplevelser i Rio de Janeiro" |

### Home runtime state

| Surface | State in the production render |
| --- | --- |
| Header (`HeroHeader`) | Mounted, layout-level |
| Skip link | Mounted, layout-level |
| Hero search input | Present ("Buscar passeios, atrações ou bairros...") |
| Trip cards | 7 rendered from `Trip.imageUrl`, real titles and prices |
| Footer + Cadastur | Mounted, Home-level; `cadastur.png` present |
| `AIConciergeWidget` | **Not mounted** - flag unset, disabled in production |
| Home robots meta | `index, follow` |
| Canonical | `https://rick-travel.vercel.app/pt` |
| hreflang | Emitted for en, pt, es, sv and `x-default` |
| `/robots.txt` | Served from `app/robots.ts` (`Disallow: /admin/`, `/api/`) |

## Screenshots

Stored in `docs/baseline/rt-9-current-home/`. Total **5.28 MiB across 9 PNGs** (three full-page captures account for 4.52 MiB of that). This is deliberate repository weight in exchange for a visual reference point; if an Owner would rather not carry it, the full-page PNGs are the compressible part.

| File | Route | Viewport | Frame |
| --- | --- | --- | --- |
| `home-pt-desktop-fold.png` | `/pt` | 1440x900 | above the fold |
| `home-pt-desktop-full.png` | `/pt` | 1440x900 | full page |
| `home-pt-mobile-fold.png` | `/pt` | 390x844 | above the fold |
| `home-pt-mobile-full.png` | `/pt` | 390x844 | full page |
| `home-pt-tablet-fold.png` | `/pt` | 768x1024 | above the fold |
| `home-pt-tablet-full.png` | `/pt` | 768x1024 | full page |
| `home-en-desktop-fold.png` | `/en` | 1440x900 | above the fold |
| `home-es-desktop-fold.png` | `/es` | 1440x900 | above the fold |
| `home-sv-desktop-fold.png` | `/sv` | 1440x900 | above the fold |

### Capture method, and a correction worth recording

Above-the-fold shots are taken on arrival, before any scrolling.

Full-page shots are taken **after a scroll-through pass**. The first capture attempt did not scroll, and produced full-page images in which the trip grid and the traveler-support section were **invisible** - a tall empty band between the hero and the footer, despite all seven trip images having been fetched. The cause is `components/ui/fade-in-section.tsx`: `FadeInSection` renders `motion.div` with `initial={{ opacity: 0 }}` and `whileInView`, used by `components/trip-grid.tsx` and by the Home itself. Sections never scrolled into view stay at opacity 0, so an un-scrolled full-page screenshot misrepresents the Home as mostly empty.

The harness now scrolls the page, lets the in-view animations settle, returns to the top, and only then captures. The scroll happens **after** metrics are read, so load timings and CLS are unaffected by it.

This was a defect in the measurement, not in the Home, and it was fixed in the measurement. No application behaviour was changed.

## Limitations - what this baseline is and is not

Stated plainly so later comparisons are not built on a false premise:

- **Local, not field data.** Captured on a developer workstation over loopback against a local Postgres. TTFB and transfer times are a best case with effectively zero network latency. These numbers are a *relative* reference point for comparing a rebuilt Home measured the same way - they are not production performance, not CrUX or any other real-user field dataset, and must not be quoted as such.
- **No Lighthouse score.** Lighthouse is not a project dependency and none was added. Core Web Vitals were measured directly instead (LCP, CLS, plus FCP/TTFB/load). If an Owner wants Lighthouse *scores* specifically, that requires adding `lighthouse` as a devDependency - a package change, deliberately not made here.
- **INP not measured.** Interaction to Next Paint requires real interaction; this baseline is load-only.
- **Database-dependent.** Seven published trips in the local database. A production database with a different row count or different `Trip.imageUrl` values would change image weight and page height.
- **Single machine, single browser.** Chromium only, `deviceScaleFactor: 1`, no CPU or network throttling.
- **Mobile is an emulated viewport**, not a real device.

## RT-7 risk observations

RT-9 is measurement. Every one of RT-7's 18 risks remains **DOCUMENT ONLY**; none is remediated, reclassified or closed here. Runtime evidence corroborating five of them is recorded below because observation is exactly what this task is for.

| Risk | What the runtime shows | Disposition |
| --- | --- | --- |
| **7** - DB-driven asset references prevent proving repo-unreferenced assets are unused | **Confirmed empirically, and across two different RT-7 tiers.** RT-7 classifies `imagem-praia-ipanema.jpg` as `ASSET_UNREFERENCED_IN_REPO`, and `imagem-morro-pao-de-acucar.jpg` as `DOCS_ONLY`, in RT-7's "Assets referenced only by documentation" table. Both are nevertheless **served on the live Home**, supplied by `Trip.imageUrl` database values and rendered through `/_next/image`; neither requires any repository static reference in order to appear. Both tiers are derived from repository text search, so **repository-search reference tiers are runtime-agnostic**: "repo-static unreferenced" must never be treated as equivalent to "runtime unused". Deleting on repo-search evidence alone would have broken two live trip cards. | **DOCUMENT ONLY.** No asset deleted, moved or reclassified, and RT-7's inventory is not edited by RT-9. The risk is broader than RT-7 stated, and is strengthened rather than resolved. |
| **10** - AI Concierge defaults to disabled in production | **Confirmed.** No `ai-concierge` markup in the production render of any locale. The Concierge is absent from the Home in a default production build. | DOCUMENT ONLY |
| **18** - Layout-level skip link hardcoded in Portuguese | **Confirmed.** "Pular para o conteúdo principal" renders identically on `/pt`, `/en`, `/es` and `/sv`. | DOCUMENT ONLY - not fixed here |
| **5** - Two robots implementations | `/robots.txt` is served from `app/robots.ts`; the root `robots.ts` is inert in this build. Its advertised sitemap host is the `PUBLIC_SITE_URL` fallback `rick-travel.vercel.app` because the variable is unset locally - which is risk 9's mechanism, observed, not a statement about production. | DOCUMENT ONLY - **no robots winner chosen, no domain chosen** |
| **16** - Split motion stack | `motion/react` `whileInView` in `FadeInSection` is why full-page capture needed a scroll pass. | DOCUMENT ONLY |

Risks 1, 2, 3, 4, 6, 8, 9, 11, 12, 13, 14, 15, 17: no action, owners unchanged.

## Non-goals

Not done here, and not to be inferred from this baseline existing:

- No change to the production Home, its components, layout, or data.
- No change to the RT-8 rebuild lab or its environment gate. The lab was confirmed 404 in production and otherwise left alone.
- No asset deleted, moved, renamed, compressed or optimized - including the 463 KiB hero, which is the single largest win this baseline identifies and is **not** RT-9's to take.
- No robots decision, no domain decision, no Cadastur or trust-mark decision.
- No Swedish-locale fix, no skip-link localization fix, no navbar / footer / Concierge redesign.
- No dependency added or removed; `package.json` and `package-lock.json` untouched.
- No production cutover, no Sprint 1 or later visual work.
- No Jira transition performed by this task.

Nothing in this document is a performance target, a budget, or an approval to change anything. A slow number here is evidence, not permission.

## Reproduction

```
npm run build
npx next start -p 3200
node scripts/baseline-home.mjs --base-url http://127.0.0.1:3200 --runs 3
```

Writes `docs/baseline/rt-9-current-home/metrics.json` plus the PNGs. `metrics.json` retains every individual run, the per-type byte breakdown, and the ten heaviest requests per target, so a later comparison does not depend on the summary tables above.

Two notes for whoever runs this next:

- **Dependency resolution.** `scripts/baseline-home.mjs` imports `playwright-core`. That package is not declared in `package.json`; it resolves transitively through the existing `@playwright/test` devDependency. **No dependency was added for RT-9**, and none needs to be added to run this - but a strict or non-hoisted `node_modules` layout may fail to resolve it.
- **Non-destructive reproduction.** The harness accepts `--out`. Pointing it at a scratch directory reproduces the measurement **without overwriting the canonical RT-9 evidence** in `docs/baseline/rt-9-current-home/`:

```
node scripts/baseline-home.mjs --base-url http://127.0.0.1:3200 --out /tmp/baseline-verify --runs 1
```

## Handed forward

- Hero still image is 37 % of desktop page weight and is the LCP element on every route and viewport. Input to the cinematic hero work (RT-RB-S2-02 / RT-RB-S3-04), not acted on here.
- Images are 71 % of desktop transfer. Input to the media sprint.
- Production field measurement, Lighthouse scores if wanted, and INP remain uncaptured - Owner's call whether any belongs in a later QA task (RT-RB-S6-05 territory).
- Two files carrying repo-search-derived classifications - one `ASSET_UNREFERENCED_IN_REPO` (`imagem-praia-ipanema.jpg`) and one `DOCS_ONLY` (`imagem-morro-pao-de-acucar.jpg`) - are provably live via database-backed `Trip.imageUrl` values. **Repository static-reference classification alone is not deletion clearance.** Runtime and database evidence must be checked before any future asset deletion, whichever RT-7 tier a file sits in. Any future asset cleanup must query the production database first, per RT-7 risk 7.
