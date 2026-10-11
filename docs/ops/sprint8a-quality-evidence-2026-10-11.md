# Sprint 8A — Quality closure evidence (2026-10-11)

Scope: RT-45 (performance), RT-46 (accessibility), RT-44 (critical flows), RT-83 (cross-browser, automated part), RT-47 (SEO checks), RT-64/RT-84 (observability findings). Authority: Owner directives of 2026-10-11 (Sprint 8A, DESIGN FREEZE). Nothing was published, purchased or provisioned. The production site was only **read** (GET, no search, no form submission).

## 1. Measurement method (RT-45)

- **Builds compared:** A = `40136a3` (exported with `git archive`, built separately), B = working tree. Both are `next build` production builds served locally with `next start` (A :3201, B :3200), using `NEXT_DIST_DIR=.next-prod` so a build never collides with a dev server.
- **Tool:** Lighthouse 12.8.2 (CLI spawned without a shell) with Playwright Chromium 1217.
  - mobile: default Moto G Power emulation, simulated slow 4G, 4× CPU
  - desktop: `--preset=desktop`
- **Primary design: interleaved A/B** (`scripts/rt-45-ab-runs.mjs`).
  - Each B run is taken next to the matching A run, same page and form factor, alternating AB/BA each round, 5 rounds. 100 runs, 19:12–19:49 UTC.
  - A change counts as robust only when the paired delta has the same sign in **5/5 pairs**.
  - Both servers are health-checked before every run.
- **Recorded conditions:** host CPU load per run (WMI `LoadPercentage`, mean of 3 samples) and Lighthouse `benchmarkIndex`. Host: i7-1165G7, 8 logical cores, 32 GB. The Owner's own applications (Chrome, VS Code, Docker) were left running and are part of the recorded load.
- **Why A/B and not before/after matrices:** the sequential matrices (`.tmp/lh-before`, `.tmp/lh-after`) ran under very different machine speed (`benchmarkIndex` ~600 vs ~1300–1800). That confounds the comparison, so they are kept as context only. They also produced an apparent planner regression that the A/B showed to be load noise.
- **Invalid runs discarded:**
  - all runs interrupted by the 2026-10-11 power loss
  - one 1-run smoke test
  - one A/B attempt aborted when server :3200 exited silently (twice, both times right after a PowerShell tool call ended; cause not proven). The server was later run as a harness-managed task and stayed up.

## 2. Results — interleaved A/B (median [min–max], paired Δ)

| Page | Metric | A (before) | B (after) | Paired Δ | Verdict |
|---|---|---|---|---|---|
| mobile /pt | Perf | 55 [50–61] | 75 [58–81] | +19 | **better 5/5** |
| mobile /pt | TBT | 1886 ms | 447 ms | −1132 ms | **better 5/5** |
| mobile /pt | LCP | 4625 ms | 3871 ms | −754 ms | mixed (4/5) |
| desktop /pt | Perf | 85 [79–89] | 99 [96–99] | +14 | **better 5/5** |
| desktop /pt | TBT | 313 ms | 21 ms | −292 ms | **better 5/5** |
| desktop /pt | LCP | 1012 ms | 821 ms | −185 ms | **better 5/5** |
| desktop /pt/contato | LCP / TBT | 795 / 15 ms | 762 / 3 ms | −49 / −12 ms | **better 5/5** |
| all other page × form-factor cells | — | — | — | — | within noise |
| CLS | all pages | 0–0.005 | 0–0.005 | 0 | unchanged (good) |

Raw data: `.tmp/lh-ab/summary.json`.

**Regression found and fixed:** mobile /pt/tours showed LCP +70 ms (worse 5/5). Cause: `fetchPriority="high"` on two images made them compete (LCP image load delay 56→228 ms). The attribute was removed. Targeted A/B afterwards (`.tmp/lh-ab-tours`, 5 pairs): LCP Δ −251 ms (mixed), no consistent regression.

## 3. What produced the gains (cause → fix → evidence)

| Finding | Evidence | Fix | Measured effect |
|---|---|---|---|
| WebGL globe textures rasterised on the main thread (2D canvas `shadowBlur`), ~4 s blocking with software canvas | CPU profile: one function (`uploadTexture`) took 5.6–6.4 s self time with SwiftShader. Phase split (`scripts/rt-45-globe-texture-phases.mjs`): raster glow 1437 ms + detail 2636 ms on SwiftShader vs 38 + 48 ms on a real GPU | Rasterise in a Web Worker (OffscreenCanvas, same drawing code), upload raw RGBA; main-thread fallback kept | Home TBT −1.1 s mobile / −0.29 s desktop (5/5) |
| Per-frame `clientWidth/clientHeight` reads in `render()` forcing synchronous layout | Profile with GPU: 603 ms self time in the resize helper; Lighthouse `forced-reflow-insight` | Cached size via ResizeObserver (callback redraws) | Part of the Home TBT gain |
| Logo declared at 2172×724: single `w=3840` candidate, preloaded on every page | HTML srcset + transfer measurement | Declared rendered size 255×85 (3:1). The A/B ran with 192×64; it was raised after the independent review so 3× screens stay sharp | Final: logo **253,686 → 11,157 B desktop (`w=256`, −95.6 %) / 43,083 B mobile (`w=640`, −83 %)**. With 192×64 the same-origin page weight fell by 228–241 KB on all 10 page×profile cells |
| /quem-somos portrait (LCP element) not in initial HTML | LCP load delay 2401 ms | `eager` prop on that page only | Load delay **2401 → 11 ms**; LCP unchanged in the lab (bottleneck moved to render delay) — no claimed gain |

**Lab vs real devices.** Lighthouse headless renders WebGL with SwiftShader (software). With the host GPU (ANGLE/D3D11) the same Home load had 2.4–3.4 s of blocking at 4× CPU, versus 8.9–9.2 s with SwiftShader, before the worker change. Devices with GPU-accelerated canvas paid little for the textures; devices without acceleration paid the ~4 s freeze, and the worker removes it for both.

**Final-code confirmation.** The independent-review fixes below landed after the main A/B. A targeted interleaved A/B on mobile /pt (3 pairs, `.tmp/lh-ab-final`) gave:
- Perf 55 → 67 (Δ +12)
- LCP 4604 → 4166 ms (Δ −438)
- TBT 1847 → 718 ms (Δ −1129)

The sign was the same in 3/3 pairs.

## 4. Design preservation (DESIGN FREEZE)

- **Texture parity** (`scripts/rt-45-globe-texture-parity.mjs`): worker texels vs main-thread canvas texels, **0 differing bytes of 29,360,128** on SwiftShader and on GPU. GL readback parity is also 0 differences on GPU. On SwiftShader the GL readback was empty, so it counts as inconclusive and is not claimed.
- **Hero frames** (`scripts/rt-45-hero-frames.mjs` + `rt-45-frame-diff.mjs`):
  - 5 journey positions × desktop/mobile, old build vs final build: **0 pixels changed beyond tolerance below the header**.
  - Inside the header: the logo is resampled at its correct size, and the menu text shifts by about 1 px (subpixel). Visually identical.
- **Behaviour** (`scripts/rt-45-globe-behaviour.mjs`): first load, resize, history back, client-side navigation away and back, and reload, on desktop and mobile. Result: `ready`, backing store = CSS × min(DPR, 2), globe painted, no page errors. **ALL PASS.**
- **Fallback matrix RT-20** (`scripts/rt-20-fallback-validation.mjs`): **PASS** (A–G + 360/768). The script now waits for the async `data-webgl` outcome.

### Independent review (governance)

A separate review agent read the full diff. Verdict: **APPROVE WITH FIXES**.

**Fixed:**
1. **Major — first frames after the WebGL handover used a 0×0 cached size, giving a stretched 1×1 canvas.**
   - Reproduced by a new first-frame check in `rt-45-globe-behaviour.mjs`: desktop `[[1,1],[1,1],[1,1]]`, mobile `[[1,1],[1,1],[824,1410]]` on the pre-fix build.
   - Fix: `resize()` reads the layout size while no size has been observed yet.
   - After the fix: desktop `[[1210,900]×3]`, mobile `[[824,1410]×3]`.
2. **Textures were produced before WebGL2 was checked** (a regression for devices without WebGL2). WebGL2 is now probed first (`supportsGlobe`). Verified: with WebGL2 disabled the result is `unavailable` in 490 ms and **0** workers are created.
3. **No `onmessageerror`** on the worker. Added; it falls back to the main thread.
4. **`dirty` declared after use** by the async callback. Moved up.
5. **rt-19 / rt-27 / rt-17 validation scripts** did not wait for the async `data-webgl`. Waits added; rt-19 and rt-27 **PASS**.
6. **Logo slightly soft on 3× screens.** Now 255×85.
7. **The Edge project needs local Edge.** Documented.

**Not changed (scope / Owner):**
- The footer "Quem somos" still links to the Home section. The Owner approved the header change only.
- `aria-current` on the desktop header would require making a server component a client component.

**Post-fix checks, all PASS:**
- behaviour suite (incl. first frames)
- RT-19, RT-20, RT-27
- hero frames: 0 changed pixels below the header
- Vitest 714
- cross-browser 142/0/0 flaky
- public e2e 47

## 5. Accessibility (RT-46)

- **Contrast audit** (`scripts/rt-46-gold-contrast-audit.mjs`): 307 gold text states (incl. hover), 16 routes, PT/EN/ES.
  - Before: 24 failures, all `--site-gold-deep` (#8a6a2b) on cream #f3efe6 = 4.38:1.
  - After: **0 failures**.
- **The fix:** new token `--site-gold-text` #856629. Same hue and saturation, L 35.5 → 34.2 %, 4.66:1. It is applied only to small gold text on cream:
  - Why-section numbers
  - contact section label and contact link hover
  - four tour-detail section labels
- The official gold is unchanged everywhere else and passes there: 4.74 on #fbf8f2, 5.03 on white.
- **Gold labels over the Rio Story video/images** (`scripts/rt-46-image-bg-contrast.mjs`): median 6.5–10.7, but the worst pixel behind the glyphs is **3.46–4.23** on some labels (mobile "Atmosfera"/"Cultura", desktop "Vídeo editorial"). **Not changed** (DESIGN FREEZE) → Owner decision. Options: a slightly stronger scrim under the label, or a subtle text shadow.
- Footer link accessible names now include their visible text (earlier commit). Lighthouse a11y: Home 96 → 100.
- **Reduced motion:** the hero enters `data-mode=static`; covered by e2e and RT-20 case B.

## 6. Critical flows and cross-browser (RT-44, RT-83 automated part)

- **Public suite** `npm run test:e2e:public`: **47 passed, 3 skipped** (opt-in tests) on the local production build.
  - Coverage: Home, Tours, Tour detail (request form, empty submit blocked), About, Contact, header "Quem somos" → /quem-somos in PT/EN/ES (desktop + mobile menu), footer, planner (PT 200; EN/ES 404 per Option C; /pt/voos 308), reduced motion, skip link, OG/JSON-LD, concierge API closed on a default-flag server.
- **Booking engine on the authorized origin** (read-only, `E2E_PLANNER_AUTHORIZED=1` against www.ricardotour.com): **2/2 passed**. The widget renders products, search fields and Buscar.
- **Cross-browser** `npm run test:e2e:crossbrowser`: Chromium, Edge, Firefox 148, WebKit 26.4, Pixel 7, iPhone 13 → **142 passed, 0 failed, 0 flaky, 8 skipped**.
- **Limits (remain RT-83 HYBRID / Owner):**
  - WebKit on Windows is not Safari, and emulation is not a device. Real iOS Safari, Android Chrome and macOS Safari still need checking.
  - WebKit's Tab order skips links by default (verified). The skip link is checked there with programmatic focus; real Safari Tab is a device check.
- **Unit and static checks:** Vitest 714 passed / 6 skipped; `tsc` 0; ESLint on all changed/new files 0. Whole project: 0 errors, 2 pre-existing warnings. `.next-prod/**` is now ignored.

## 7. Planner / Oner widget (RT-64, RT-84)

- **Production (authorized origin):** the widget works on desktop and mobile. Provider APIs return 200.
- **Localhost:** `institutionWidgetConfiguration` returns 500 and the widget shows "Não autorizado!". This is domain authorization by the provider, not a site defect.
- **"Script error." = provider exception** `Bootstrap's JavaScript requires jQuery` at `widget-befly.js:3721`. It is attributed via CDP and also happens in production. It is not unmuted, because the provider sends no CORS headers (a `crossorigin` attribute would break the widget). It is not suppressed.
- **Planner TBT attribution:**
  - Lighthouse third-party summary: Oner ~1.0–1.7 s of 1.3–2.3 s TBT on mobile.
  - V8 CPU profiles: production `widget-befly.js` 2442 ms vs Ricardo Tour `_next` 666 ms self time.
  - Local runs **underestimate** the planner cost, because the unauthorized widget does less work.

## 8. SEO (RT-47) — checked on the local production build

- `/{locale}/og` returns 200 `image/png` (1200×630).
- `og:image` and `twitter:image` are absolute.
- TravelAgency and TouristTrip JSON-LD parse.
- All public URLs derive from `PUBLIC_SITE_URL` (metadataBase), so the domain decision is not anticipated. With `PUBLIC_SITE_URL` unset locally they fall back to the existing technical host.
- Rich Results / social-debugger validation on the production host remains open: it needs a deployment, which is not authorized.

## 9. Open items (real pendencies)

1. **Owner — contrast over video:** gold labels over Rio Story media (worst pixel 3.46–4.23). Design decision under DESIGN FREEZE.
2. **Owner/provider — Oner:** fix the jQuery error, serve CORS, authorize a preview origin.
3. **RT-83 HYBRID:** real-device QA (iOS Safari, Android Chrome, macOS Safari, Tab behaviour).
4. **RT-45 residual:**
   - Mobile LCP is ~3.7–4.6 s on all pages in the lab. On mobile the dominant phase is render delay (main-thread / hydration under 4× CPU), not resources.
   - 4 render-blocking CSS files (~22 KB gzip): `inlineCss` is a trade-off (no caching) and was **not** applied without measurement.
5. **RT-47:** production-host validation of OG and structured data after an authorized deployment.
