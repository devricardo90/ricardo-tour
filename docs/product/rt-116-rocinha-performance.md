# RT-116 — Favela Rocinha: performance criteria and local 4G results

- Date: 2026-10-17. Context: Owner visual approval of the Rocinha integration (17/10). Owner request: validation criteria for 4G playback, start time, stalls, page load and mobile experience; run what is possible locally; **do not publish to test**.
- Environment: local production build (`next build --webpack` + `next start`, rebuild lab enabled only on this local server), commit `dc58359`; Playwright Chromium, mobile 390×844 @2x, touch; network and CPU emulated through Chrome DevTools Protocol; cache disabled. Scripts: `scripts/rt-116-video-perf.mjs` (4G page + video), `scripts/rt-116-perf.mjs` (cold first visit, unthrottled). Raw data: `docs/baseline/rt-116-rocinha/perf-4g.json`, `perf-4g-baseline-gallery-lab-1.json`.
- Limits: local server without CDN or real radio network; CPU slowdown is applied to a desktop CPU. Numbers are indicative; they do not replace Lighthouse/field data on an isolated Preview (RT-114 criterion 5, RT-104…108).

## 1. Acceptance criteria (proposed for publication)
| # | Criterion | Target | Why |
|---|---|---|---|
| P1 | Video bytes before the visitor presses play | 0 | The clip must not cost anything to visitors who do not watch it |
| P2 | Video start time (play → first frame), fast 4G | ≤ 1.0 s | Feels immediate |
| P3 | Video start time, slow 4G | ≤ 2.0 s | Acceptable wait on weak signal |
| P4 | Stalls during playback, fast 4G | 0 (≤ 300 ms total tolerated) | Smooth playback on a normal connection |
| P5 | Stalls during playback, slow 4G | ≤ 1 stall and ≤ 1 s total | Weak signal common for tourists on roaming |
| P6 | Page weight on first visit (without video) | ≤ 1 MB | Mobile data cost |
| P7 | LCP (mobile, slow 4G, 4× CPU) | ≤ 2.5 s ("good" in Core Web Vitals) | Main photo visible quickly |
| P8 | CLS | ≤ 0.1 | No layout jumps (video block and gallery reserve their space) |
| P9 | Main-thread long-task time (lab proxy for responsiveness) | not worse than the site's lightest page + 1 s | The tour page should not add heavy scripts |
| P10 | Mobile experience | no horizontal scroll; CTA visible without scrolling; video plays inline with native controls; no autoplay; no sound | Approved layout behaviour |

## 2. Results (17/10/2026)
### 2.1 Video and page under 4G (mobile, 4× CPU, 2 runs per profile)
| Profile | TTFB | FCP | LCP | CLS | Long tasks | Page | Video before play | Video start | Stalls | Stalled | Played to end | Video transferred |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fast 4G (9 Mbps, 60 ms) run 1 | 191 ms | 4.39 s | 4.39 s | 0 | 5.5 s | 629 KB | 0 | 0.63 s | 0 | 0 | yes | 3,646 KB (1 request) |
| Fast 4G run 2 | 118 ms | 1.68 s | 1.68 s | 0 | 3.4 s | 629 KB | 0 | 0.58 s | 3 | 0.21 s | yes | 3,646 KB |
| Slow 4G (1.6 Mbps, 150 ms) run 1 | 111 ms | 2.30 s | 3.56 s | 0 | 4.2 s | 645 KB | 0 | 1.53 s | 8 | 2.37 s | yes | 3,646 KB |
| Slow 4G run 2 | 200 ms | 4.55 s | 4.90 s | 0 | 6.5 s | 645 KB | 0 | 1.40 s | 9 | 2.37 s | yes | 3,646 KB |
| Baseline: lightest lab page (gallery-lab/1), fast 4G | 82 ms | 3.50 s | 3.50 s | 0 | 2.4 s | 299 KB | — | — | — | — | — | — |
| Baseline, slow 4G | 55 ms | 1.87 s | 1.90 s | 0 | 2.1 s | 299 KB | — | — | — | — | — | — |

### 2.2 Cold first visit without throttling (from the integration round)
Desktop LCP 1.34 s / 584 KB; mobile 0.18 s / 620 KB; cover served as WebP 89–106 KB; video 0 KB before play.

## 3. Verdict per criterion
| # | Result | Status |
|---|---|---|
| P1 | 0 bytes in every run | **Met** |
| P2 | 0.58–0.63 s | **Met** |
| P3 | 1.40–1.53 s | **Met** |
| P4 | 0 stalls / 3 short stalls (0.21 s) | **Met** (within tolerance) |
| P5 | 8–9 stalls, 2.4 s frozen; the clip ends ~3.5 s later than its length | **Not met** — the clip averages ≈ 1.9 Mbps, above the 1.6 Mbps link |
| P6 | 629–645 KB | **Met** |
| P7 | 1.7–4.9 s (high variance between runs; the baseline page also reaches 3.5 s) | **Inconclusive locally** — needs Lighthouse on an isolated Preview |
| P8 | 0 | **Met** |
| P9 | 3.4–6.5 s vs baseline 2.1–2.4 s | **Not met / to investigate** — the tour page adds 1–4 s of main-thread work under 4× CPU |
| P10 | No overflow, CTA visible, inline playback, no autoplay, no sound (previous round) | **Met** |

## 4. Recommendations (technical; none changes the approved look)
1. **Slow-4G stalls (P5):** add a lighter rendition of the same clip (e.g. 540×960 at ≈ 0.9–1.0 Mbps, ≈ 1.8 MB) served to small screens via `<source media>` or as the only source on mobile; target ≤ 1 stall on slow 4G. Needs the Owner's OK because the delivered quality changes (same clip, same framing). Not done.
2. **Main-thread cost (P9) and LCP (P7):** profile the public version, not the lab: review-mode chips, the lab banner and the gallery client bundle inflate the prototype; check the blurred backdrop image (second image request per photo) and hydration of `ImageGallery`. Measure again with Lighthouse on an isolated Preview before publication.
3. **Caching:** `public/` files are served with `Cache-Control: public, max-age=0` by `next start`; on Vercel static assets get CDN caching, but immutable names (hash in the file name) or Blob storage would allow long caching for media.
4. Re-run `scripts/rt-116-video-perf.mjs` against the isolated Preview once RT-104…108 exist; field data (Web Vitals) after publication.

## 5. Update — lighter mobile rendition (Owner authorisation 17/10/2026, local only)
Same clip, same window (6.5–22 s), same framing and tone mapping; only the bitrate changes. Built from a near-lossless SDR reference of the original; quality measured with VMAF/SSIM against that reference (720×1280).

| Candidate | Size | Avg bitrate | VMAF | SSIM | Chosen |
|---|---|---|---|---|---|
| Current full clip (desktop) | 3.73 MB | 1.93 Mbps | 94.2 | 0.917 | stays for screens ≥ 768 px (unchanged) |
| 720×1280, cap 1.0 Mbps | 1.99 MB | 1.03 Mbps | 82.8 | 0.858 | **yes** (`rocinha-praca-movimento-mobile.mp4`) |
| 540×960, cap 0.9 Mbps | 1.79 MB | 0.92 Mbps | 79.6 | 0.832 | no (lower quality for 10 % less weight) |
| 540×960, cap 0.7 Mbps | 1.39 MB | 0.72 Mbps | 74.3 | 0.810 | no (visible degradation in the busy scene) |

Served with `<source media="(max-width: 767px)">` before the full source; desktop is unchanged (verified: wide screens play `rocinha-praca-movimento.mp4`, phones `rocinha-praca-movimento-mobile.mp4`).

Slow 4G (1.6 Mbps, 150 ms, mobile, 4× CPU), same session, 3 runs each (`perf-4g-slow-mobile-clip.json`, `perf-4g-slow-full-clip.json`):
| Clip | Start | Stalls | Stalled time | Wall time for 15.5 s | Transferred |
|---|---|---|---|---|---|
| Full clip (what phones received before) | 1.14–1.15 s | 8–9 | 1.88–1.92 s | 18.5 s | 3,646 KB |
| **Mobile rendition** | **0.70–0.74 s** | **0** | **0** | **16.2 s** | **1,946 KB** |
Fast 4G with the mobile rendition (`perf-4g-fast-mobile-clip.json`): start 0.23–0.25 s, 0 stalls.

Criteria update: **P5 now met** on mobile (0 stalls). Quality: VMAF 82.8 ("good" range) vs 94.2 for the full clip; the difference is mainly fine detail in the moving motorbikes and wires. **Visual quality to be judged by the Owner** (the variant is not an approval of final quality).

Note on the main-thread figures: in this session the long-task time was 1.0–1.4 s on mobile (vs 3.4–6.5 s in the first session), confirming that those numbers depend heavily on the local machine load. LCP on slow 4G mobile: 2.76–2.79 s (target 2.5 s). Both still need Lighthouse on an **isolated Preview**, which does not exist yet (RT-106 backlog): not available, not replaced by a production deploy.
