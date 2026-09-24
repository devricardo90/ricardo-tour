# RT-17 — Real 3D POC (Version C)

Status: Owner-authorized experimental refinement, 20/09/2026. This document records the isolated Version C proof. It does not close RT-17, does not start RT-18, does not modify RT-22 and does not approve any media master.

## Scope

Version A remains `/[locale]/rebuild-lab/cinematic`. Version B remains `/[locale]/rebuild-lab/cinematic-depth-poc`. Version C is isolated at `/[locale]/rebuild-lab/cinematic-3d-poc` and applies real 3D **only** to the segment Globo → América do Sul → Brasil, as authorized.

The original acceptance criterion is unchanged: “Scroll controla narrativa sem trocar de página.”

Preserved without modification: the RT-16 percentages (`0 / 12 / 28 / 44 / 62 / 78`), the sticky travel distance (`320svh` desktop, `280svh` mobile), the 0–8% hold, reverse scroll, the desktop/mobile route, the accessibility fallbacks, and the public Home. States 04–06 (Rio, helicopter, Christ) reuse Version B's timeline segments verbatim, so a B/C comparison isolates exactly one variable: the technique used for the globe.

## Continuation from the interrupted execution

The previous agent (Codex) created `app/[locale]/rebuild-lab/cinematic-3d-poc/` and stopped after downloading one asset:

```
app/[locale]/rebuild-lab/cinematic-3d-poc/assets/earth-nasa-2048.jpg   266,599 bytes, 2048x1024
```

No component, route, shader, runner or document existed, and the route returned 404. The file is a complete, valid equirectangular JPEG, but **no provenance record accompanies it** — no origin URL, licence or date in `.tmp/` or in any RT-17 document. This repository requires verified provenance for media, so Version C does not use it. The file was left in place, unmodified, pending the Owner's ruling.

Using a photographic Earth texture would also have confounded the comparison: Version C could then appear better than Version B because it is photographic rather than because it is volumetric.

## Technique

Version C renders a genuine 3D scene in raw WebGL2. It is not a transformed image and not a parallaxed layer stack:

- A UV sphere (128 × 64 segments) is rasterised through a perspective projection with a real depth buffer.
- The camera physically orbits and dollies in world space. Distance is expressed in sphere radii, so `d = 4.6` is a real altitude, not a CSS scale factor.
- A Lambert term and a smooth terminator are evaluated per fragment, with a Fresnel gold rim in the RT-10 palette.
- A second, larger sphere shell renders the atmosphere additively. Depth testing keeps only the hemisphere in front of the planet, so the halo wraps the real silhouette.
- The Rio anchor is a world-space point projected through the same matrices, hidden by a normal·view test, so it is occluded by the planet's own curvature at the limb.

Camera distances are solved from the lens rather than chosen by eye. For a subject whose half-arc on the sphere is `t` to sit inside the half-FOV `f`:

```
d = sin(t) / tan(f) + cos(t)
```

The lens is fitted to the **narrower** canvas axis. With a fixed vertical FOV, a portrait canvas cropped the globe left and right and pushed the Rio anchor out of frame on mobile before the approach reached Brazil.

| Progress | Camera | Intent |
| --- | --- | --- |
| 0–8% | `d 4.6`, lat 4, lon −52 | Hold. The whole planet keeps a margin and establishes scale. |
| 8–12% | `d 4.6 → 4.15` | Approach begins, matching RT-16's stability note. |
| 12–28% | `d → 2.8`, lat −14, lon −60 | South America spans the frame with the limb still readable. |
| 28–38% | `d → 2.3`, lat −12, lon −52 | Brazil takes the frame as a consequence of the same approach. |
| 38–44% | `d → 1.95`, lat −17, lon −47 | Closes onto the Rio anchor so the 44% handover is already framed on the destination. |
| 44–53% | `d → 1.72` while fading | The dolly continues through the crossfade, so the handover reads as continued approach rather than a cut. |

## Provenance

All visual material is authored laboratory artwork written for this proof: schematic landmass outlines defined as low-vertex latitude/longitude polygons, baked to an equirectangular canvas at runtime and uploaded as a GL texture. The Brazil highlight uses a separate regional texture covering a South America box, which carries roughly 28 texels per degree instead of the ~6 a global 2048-wide map provides.

No external image, no downloaded texture and no AI-generated picture is presented as a photograph. No photograph of Rio, the helicopter or Christ the Redeemer is introduced. Final media remains a Sprint 3 dependency.

The outlines are **schematic and not cartographic reference data**. Real 3D makes coarse coastlines more visible than 2.5D did; this is a deliberate, recorded limitation, not an accuracy claim.

## Dependencies

**None added.** No change to `package.json` or the lockfile. WebGL2 is used directly rather than installing `three` or `@react-three/fiber`, consistent with RT-16 §10.3. The already-present `gsap@3.14.2` drives the same normalized progress used by Versions A and B.

## Files

- `app/[locale]/rebuild-lab/cinematic-3d-poc/page.tsx`
- `app/[locale]/rebuild-lab/cinematic-3d-poc/globe-journey.tsx`
- `app/[locale]/rebuild-lab/cinematic-3d-poc/globe-journey.module.css`
- `app/[locale]/rebuild-lab/cinematic-3d-poc/globe-3d.ts`
- `app/[locale]/rebuild-lab/cinematic-3d-poc/world-atlas.ts`
- `scripts/rt-17-3d-poc-validation.mjs`

Versions A and B were not modified; their files are byte-identical to the state left by the previous execution.

## Local URLs

- Version A: `http://127.0.0.1:3218/pt/rebuild-lab/cinematic`
- Version B: `http://127.0.0.1:3218/pt/rebuild-lab/cinematic-depth-poc`
- Version C: `http://127.0.0.1:3218/pt/rebuild-lab/cinematic-3d-poc`

The same routes are available under `/en/` and `/es/`. If the server is stopped: `npm run dev -- --hostname 127.0.0.1 --port 3218`.

## Validation record

Runner: `node scripts/rt-17-3d-poc-validation.mjs`. It does not use the project's E2E globalSetup and never touches the database.

The final run covered **12 comparison cases** (two variants × two viewports × three locales) at 0%, 12%, 28% and 44%, plus reverse scroll and sticky release, and **8 fallback cases** (reduced motion and no-JavaScript, both variants, both viewports). All 20 passed with **zero console errors, zero page errors and no horizontal overflow**.

| Measure | Version B | Version C |
| --- | --- | --- |
| Progress at 0 / 12 / 28 / 44% (desktop) | 0.0000 / 0.1201 / 0.2799 / 0.4399 | 0.0000 / 0.1201 / 0.2799 / 0.4399 |
| Desktop travel / section | 2880px / 3780px | 2880px / 3780px |
| Mobile travel / section | 2363px / 3207px | 2363px / 3207px |
| Reverse scroll returns to 0 | yes | yes |
| Sticky releases to next section | yes | yes |
| Transferred bytes (mean) | 3.309 MB | 3.346 MB |
| Long tasks (mean count / total) | 2.0 / 591 ms | 4.7 / 915 ms |
| JS heap (mean) | 61.0 MB | 64.8 MB |
| WebGL path exercised | n/a | `ready` in all 6 cases |
| Rio anchor visible at all four checkpoints | n/a | yes, desktop and mobile |

Checkpoint progress is identical between B and C, which confirms the storyboard percentages, scroll speed and travel distance were preserved rather than re-tuned. The measurements are comparative diagnostics from a development server on software rendering; they are not production performance guarantees.

Other gates: `tsc --noEmit` passed, directed ESLint exited 0 with no warnings, the existing Vitest suite passed 34/34, and `git diff --check` is clean.

Evidence: `.tmp/rt-17-3d-poc-review/validation.json` and the paired `desktop-*` / `mobile-*` B/C captures at 0/12/28/44/100. `.tmp` is review evidence, not a production asset package.

## Defects found and corrected during this execution

Three were surfaced by the runner and the captures, not assumed:

1. **The Rio anchor left the frame.** The marker read `false` at 44% desktop and at 28% mobile. The camera was targeting central Brazil while the landscape handover needed the destination already framed. Corrected by splitting 28–44% into a Brazil pass and a Rio approach.
2. **A portrait canvas cropped the globe.** A fixed vertical FOV left only a 9.5° horizontal half-angle at 390px. Corrected by fitting the lens to the narrower axis.
3. **The closest frames were a blur.** At `d = 1.5` the baked Rio dot and the Brazil stroke magnified into blobs. Corrected by stopping the dolly at a readable altitude, moving the anchor out of the texture into a fixed-size projected element, and giving Brazil a high-resolution regional texture.

## Environment limitations

Headless Chromium on this machine has no usable GPU (`debug.log`). The runner uses `--disable-gpu --enable-unsafe-swiftshader`, which yields a SwiftShader WebGL2 context while keeping compositing fast. Forcing `--use-angle=swiftshader` also produced a context but composited the blurred and blended layers roughly six times slower, pushing screenshots past their timeout. If WebGL were unavailable the runner fails loudly rather than reporting a pass that never exercised 3D.

Long-task and heap figures therefore reflect software rendering, not real GPU behaviour on a real device. The runner positions scroll instantly to measure boundaries; normal scrolling feel and perceptual quality remain the Owner's judgement. The Next.js development indicator appears in the captures and is not part of the design.

## Acceptance for this experiment

- Volume is perceptible in the globe — the sphere shows real curvature, a terminator and a limb.
- Camera direction stays coherent across the three tested states; one continuous dolly, no cuts.
- Brazil emerges as a consequence of the same approach.
- The improvement is spatial rather than colour, shadow, blur or glow.
- Versions A and B are unchanged and show no regression.
- Desktop and mobile remain usable with the existing fallbacks.

## Fallbacks

`prefers-reduced-motion` and save-data keep `data-mode="static"`. A device without WebGL keeps the server-rendered static frame, sets `data-webgl="unavailable"` and shows an explicit notice instead of an empty stage. Without JavaScript the first frame, the approved headline and all six labels render server-side and the next section stays reachable — verified in all 8 fallback cases.

## Limits of this delivery

- RT-17 is **not** closed; RT-18 is not started; RT-22 is not modified.
- No commit, no push, no Jira transition, no Google Doc change.
- The public Home, the approved visual package and RT-10/RT-11 were not modified.
- Rio, the helicopter and Christ the Redeemer were **not** implemented in 3D, as instructed.
- The pre-existing deletion `public/images/seals/cadastur-official.png` was not restored, modified or included.
- No final media master was produced, and nothing here approves the motion design or authorizes publication.

## Next decision for the Owner

Compare B and C at the same checkpoints and decide whether real 3D justifies its cost over the 2.5D direction. Open questions this proof deliberately leaves to the Owner: whether the schematic coastline fidelity is acceptable or requires real cartographic or photographic source data; whether the provenance of `earth-nasa-2048.jpg` can be established, or the asset should be removed; and whether the added cost measured above is acceptable on real mobile hardware, which this environment cannot measure.

## Owner checkpoint — 2026-09-23 (supersedes prior execution state)

**Canonical status: RT-17 — PROTOTYPE ACCEPTED / REFINEMENT PENDING.** The Owner accepted Version C as the current prototype baseline. This is not final production polish, does not approve final media masters, and does not satisfy the Sprint 2 final Motion/Experience Gate.

The accepted journey is now recorded as:

- 0–44%: real WebGL 3D globe, including the South America/Brazil approach.
- 44–100%: the accepted hybrid cinematic scenes for Rio arrival, helicopter/cockpit, and Christ finale.

The earlier sections above preserve the evidence and decision state as recorded on 2026-09-20. Where they say the Rio sequence was not implemented, that the Owner decision was still pending, or RT-18–RT-22 were not authorized to proceed, this newer Owner checkpoint supersedes that state without deleting the historical record.

### Deferred RT-17 refinement debt — non-blocking for Sprint 2 progression

- South America/Brazil geographic fidelity and coastline refinement.
- Provenance/licensing verification remains **PENDING VERIFICATION** for `rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, and `rio-christ-finale.webp`; their inclusion as temporary prototype media is not final rights approval.
- Further Rio, helicopter, and Christ visual polish.
- Real-device mobile performance and vertical crop review, especially the Christ scene.
- Final validation on the project-supported Node version if required.

This debt does not block the canonical Sprint 2 order: RT-18 → RT-19 → RT-20 → RT-21 → RT-22. RT-18 is the next execution ticket and remains READY / not started until its separate implementation task. The earlier prohibition on progressing while awaiting RT-17 Owner review is superseded. RT-22 remains the final motion/experience approval gate.
