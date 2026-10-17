# RT-116 — Favela Rocinha: media recovery, integrity and proposed use

- Date: 2026-10-17. Tour: `cmli1a6im000034zqqzc9sppb` (Tour Favela Rocinha com Guia Local). Sprint 10.
- Status (17/10/2026, §8): **visual integration APPROVED by the Owner** (layout RT-114 v2, main photo, 5 photos and order, short silent video, desktop and mobile). Local only; **not a publication authorisation**. Readiness: `rt-116-rocinha-production-readiness.md`; performance: `rt-116-rocinha-performance.md`.
- Context: RT-114 v2 visually approved by the Owner on 17/10 (layout accepted, identity aligned); photos are handled here, separately.

## 1. Source of truth
Google Drive, owner `ricardodesouzafrancisco@gmail.com`: `MIDIAS / 02_FAVELA_ROCINHA / ORIGINAIS` (folder id `10NdxIyEOSpjKHEYNEI2R6owWxoU-plwv`), created by the Owner on 17/10, with exactly 5 photos + 1 video. Sibling folder `SELECIONADAS_OWNER` (`12fdZS7LfrTIikGZFjwqmvO_7jfoZ0sxS`) is empty.

## 2. Local read-only mirror (outside the repo; media are not committed)
`C:\Users\ricardodev\Desktop\rick-travel-media\02_FAVELA_ROCINHA\ORIGINAIS` — files set read-only; `SHA256SUMS.txt` next to the folder.

| File (Drive) | Drive id | Bytes | Real format | Pixels | SHA-256 (first 16) | Match with Drive |
|---|---|---|---|---|---|---|
| IMG_1243.HEIC | 1LV8MTavlg04-oUbLqW7N39GP0En7mj8w | 1,959,130 | HEIF (`ftypheic`) | 3024×4032 (3:4) | 87393b5bb863caf3 | SHA-256 identical (Drive download) |
| IMG_1247.HEIC | 1liUvFv6WCN5L16D1W1uMmEey7iK6uQBI | 2,004,705 | HEIF | 3024×4032 | 0cef20d40f1f3273 | SHA-256 identical |
| IMG_1252.HEIC | 1eJ5STS7RWX4SiPxf5TZ6bh9LFpCu3kHU | 1,995,278 | HEIF | 3024×4032 | 91c6b716d500858a | SHA-256 identical |
| IMG_1253.HEIC | 1cShIT81Pr5Hsfm9RS_p-kNSJoA8v8vfr | 2,260,162 | HEIF | 3024×4032 | f477868b0523942b | SHA-256 identical |
| img-favela-deck.HEIC | 1cote3AB00zsmggEtL6MADcoaorsePmYb | 5,763,535 | HEIF | 6048×8064 (48 MP) | f5eb83af27e4f459 | SHA-256 identical; same file as `IMG_1289.HEIC` in "Ricardo tour passeios foto" |
| IMG_1256.MOV | 1kXqWWqH8QuGoVpyLQwuLbXlpUbu76T3d | 85,044,013 | QuickTime (`ftypqt`), HEVC 3840×2160 shown portrait (rotation −90°), 30 fps, AAC, 22.0 s | — | 8254c878c57232920 | Size identical; CRC32 `68e063d0` identical to the Drive export zip of "Ricardo tour passeios foto" (unzip -t OK). Direct Drive hash not possible (file too large for the connector) |

Integrity: all 5 photos decode (ffmpeg, full tile grid); the video decodes end to end with 0 errors. Orientation correct for all.

Recovery note: the iCloud copy of IMG_1243 (`Pictures\iCloud Photos`) is cloud-only and could not be read; a first copy attempt left a 0-byte file in the **local mirror** (never in Drive), which was replaced by the Drive download (hash-verified above). iCloud also holds a different `IMG_1256.MOV` (195,601,229 bytes, unreadable — cloud-only); Drive's 85 MB version is the one used, per the source-of-truth rule. Question for the Owner: is the 195 MB iCloud file a higher-quality master worth keeping?

## 3. Analysis (technical + commercial)
| # | File | Content | Quality | People / rights | Fit |
|---|---|---|---|---|---|
| 1 | IMG_1243 | Panorama from the top of Rocinha down to São Conrado and the sea, Brazilian flag in the foreground, cloudy sky | Sharp (Laplacian σ 60.8), well exposed, level horizon; sky ≈ 40% of the frame | No people | Strongest sense of place; **proposed cover** |
| 2 | IMG_1253 | Guests walking down a narrow alley (beco), colourful walls, wiring | Sharp (σ 67.3), good light | 4 guests, mostly from behind; one woman on the right in partial profile (moderate identifiability); residents' windows/decorations visible | Shows the walking experience |
| 3 | IMG_1252 | Guests descending stairs past a colourful mural signed "@wark rocinha" | Sharpest (σ 74.1) | 3 guests from behind/side, faces not visible; mural by a local artist (credit suggested) | Culture/art moment |
| 4 | img-favela-deck | View from a terrace (wooden deck) over Rocinha to Pedra da Gávea | Sharp, 48 MP; **strong colour grading** (teal/orange, dramatic sky) — different look from the others | No people | Atmosphere; may look edited next to the natural photos |
| 5 | IMG_1247 | Same panorama as #1 without the flag | Sharp (σ 60.7) | No people | **Near-duplicate of #1**; works as a closing image, but adds little variety |
| V | IMG_1256 (9–18 s) | Rocinha's main square from above: motorcycle taxis, shops, street life | 4K, stable in 9–18 s; at 4–6 s a bystander's shoulder blocks the frame | Riders with helmets and distant pedestrians, not identifiable; ambient audio | Real movement of the community |

Embedded metadata: the video has GPS coordinates (ISO 6709, inside Rocinha), camera model and date (iPhone 14 Pro Max, 03/12/2025); the photos carry iPhone EXIF. **Every web version must strip metadata** (location privacy).

## 4. Proposed use (for Owner confirmation — not executed)
- **Cover / hero:** #1 IMG_1243. Desktop: the gallery frame is landscape (16:10) and shows the whole portrait photo over its blurred copy (no crop); thumbnail/cover crops use focal point (0.50, 0.62) to keep the city and the flag. Mobile: frame 4:3, same rule.
- **Gallery order:** 1 IMG_1243 → 2 IMG_1253 → 3 IMG_1252 → 4 img-favela-deck → 5 IMG_1247 (arrival panorama → alleys → culture → viewpoint → closing panorama).
- **Video:** its own block below the gallery ("A Rocinha em movimento"), clip 9–18 s (9 s), **muted (audio removed), no autoplay**, native controls, `playsInline`, `preload="none"`, poster = frame at 12 s; desktop: portrait 9:16 player next to a short caption; mobile: full width, max height ≈ 70 % of the screen.
- **Web derivatives (only after confirmation):** JPEG/WebP 1600 px and 800 px long side, metadata removed, sRGB; video H.264 MP4 720×1280 without audio (target < 3 MB) + WebM optional; poster JPEG 720×1280.
- **Alt text** PT/EN/ES to be written from what each photo shows (RT-111 found the current alt "Vista da Rocinha" did not match its photo).
- **Gap to record:** the RT-113 model has no video field (`TripImage` only). For the local prototype the video would be a prototype-only field; a `TripVideo` (or media type on `TripImage`) is a follow-up for the admin (Sprint 11).

## 5. Rights and privacy register (to confirm with the Owner)
| Item | Status |
|---|---|
| Authorship | Owner's own photos/video (Drive folder owned by the Owner; iPhone originals). To be attested per file → `rightsStatus = OWNER_ATTESTED` |
| Identifiable people | #2 IMG_1253 (woman in partial profile) needs consent or Owner decision as in RT-79 B2; #3 low identifiability; video not identifiable |
| Mural (#3) | Artwork in a public place (Lei 9.610/98, art. 48 allows representation of works permanently in public places); crediting "@wark rocinha" is suggested — not legal advice |
| Residents' homes (#2) | Windows/decorations visible, no people; low risk |
| Location metadata | Present in originals; stripped in every derivative |

## 6. Questions for the Owner
1. Confirm cover = IMG_1243 and the gallery order above.
2. Keep IMG_1247 (near-duplicate of the cover) or replace it with another photo from the Drive?
3. Keep the colour-graded deck photo as is?
4. Video: OK with a 9 s muted clip, played only on request, poster at 12 s?
5. Consent of the woman in partial profile in IMG_1253 (or approve as in RT-79 B2).
6. Credit the mural artist (@wark rocinha)?
7. Is the 195 MB iCloud IMG_1256.MOV a master to keep?

After confirmation: generate derivatives into `public/images/tours/favela-rocinha/` (local branch only), wire them into the Rocinha preview (rebuild lab, production-hidden) with `OWNER_ATTESTED` notes, capture desktop/mobile evidence, update Jira and Volume II.

## 7. Update — Owner decision and local integration (17/10/2026)

### 7.1 Owner decisions (confirmed)
1. Photos, exactly in this order: IMG_1243 (cover) → IMG_1253 → IMG_1252 → img-favela-deck → IMG_1247. Selection closed; no new photo search.
2. Video: the recovered IMG_1256, clip up to 18 s, no audio, with poster; reviewed by the Owner before final approval.
3. Rights: the Owner holds consent/authorisation of the people shown for publication; the mural artist of IMG_1252 may be credited. The larger iCloud video is not needed for this stage.
4. Mandatory treatment: GPS/location removed from public versions, audio removed, originals preserved (never overwritten or deleted), web versions for local testing. Video support in the data model documented, not blocking.
5. Use the approved RT-114 v2 layout without changing the visual identity.

### 7.2 Web versions (`public/media/tours/favela-rocinha/`, local branch only)
Generated by `scripts/rt-116-media-derivatives.mjs` (reads ORIGINAIS read-only; manifest `docs/product/rt-116-rocinha-derivatives-manifest.json`). After generation the six originals were re-checked against `rt-116-rocinha-originals.sha256`: **6/6 OK, unchanged**.

| File | From | Size | Weight | Treatment |
|---|---|---|---|---|
| rocinha-01-panorama-bandeira.jpg (cover) | IMG_1243 | 1500×2000 | 389 KB | Display P3 → sRGB, mozjpeg q82, no EXIF/GPS/XMP/ICC |
| rocinha-02-beco.jpg | IMG_1253 | 1500×2000 | 574 KB | same |
| rocinha-03-mural.jpg | IMG_1252 | 1500×2000 | 491 KB | same; credit "Mural de @wark rocinha" |
| rocinha-04-mirante-deck.jpg | img-favela-deck | 1500×2000 | 479 KB | same (48 MP original reduced) |
| rocinha-05-panorama.jpg | IMG_1247 | 1500×2000 | 393 KB | same |
| rocinha-praca-movimento.mp4 | IMG_1256, 6.5 → 22.0 s | 720×1280, 15.5 s | 3.6 MB | HDR (HLG / Dolby Vision) tone-mapped to SDR BT.709, H.264 High, ~1.9 Mbps cap, **no audio track**, metadata (GPS ISO 6709, camera model) removed, faststart |
| rocinha-praca-movimento-poster.jpg | clip at 5.5 s (= 12 s of the original) | 720×1280 | 171 KB | no metadata |

Clip window: 6.5 s is the first clean frame after a bystander's shoulder leaves the frame (visible at about 4–6 s); the clip then runs to the end, within the 18 s rule. Video command:

```
ffmpeg -ss 6.5 -i IMG_1256.MOV -t 15.5 -vf "zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=720:1280:flags=lanczos" -an -sn -dn -map_metadata -1 -map_chapters -1 -c:v libx264 -preset slow -crf 27 -maxrate 1900k -bufsize 3800k -profile:v high -level 4.0 -r 30 -movflags +faststart rocinha-praca-movimento.mp4
```

### 7.3 Integration (prototype only)
- `lib/catalog/mock/tour-content.mock.ts`: `OWNER_GALLERY` (Rocinha's 5 photos, `OWNER_ATTESTED`, rights note citing the Drive original and its hash, real PT/EN/ES alt text, focal points) and `ROCINHA_VIDEO` (status PROVISIONAL until the Owner approves the clip); Rocinha cover status CONFIRMED. The record stays MOCK/DRAFT, so the public gate never shows it.
- Gallery: optional per-photo **credit** shown under the frame. Video: new `TourVideo` block (first section under the hero) with native controls, `preload="none"`, poster, `playsInline`, muted and **no autoplay**; portrait player beside its caption on desktop, full width (max about 70 % of the screen) on mobile. PT/EN/ES labels.
- RT-114 v2 identity unchanged (same tokens, components and hierarchy).
- **Defect found and fixed:** with 5 photos the thumbnail strip widened the gallery column on a 390 px phone (page 532 px wide, horizontal scroll). Cause: grid item without `min-w-0`. Fix: `min-w-0` on the gallery column and on `ImageGallery` (layout-neutral). Re-checked: no overflow on the 4 tour previews and on gallery-lab 1/3/5/8; regression test added.

### 7.4 Evidence (`docs/baseline/rt-116-rocinha/`)
| Check | Result |
|---|---|
| Desktop PT/EN/ES + mobile PT, HTTP | 200 ×4; production build without the lab flag → **404** (hidden) |
| Gallery order and content | 5/5 in the Owner's order (Foto 1…5 de 5), cover first; alt text per photo; credit only on photo 3 |
| Video | no autoplay; **0 bytes before play**; plays on request; duration 15.5 s; 720×1280; muted |
| CTA above the fold | 4/4 |
| Horizontal overflow | 0 after the fix (was 1 on mobile) |
| Console errors | 0 |
| Tests | 26/26 in `tests/rt-113-tour-content.test.tsx` (5 new RT-116 tests: order/rights/alt/credit, no metadata ≤ 2000 px ≤ 700 KB, clip ≤ 18 s without audio/location atoms, overflow guard, video markup); full suite passed; lint and typecheck clean; production build OK |
| Captures | `desktop-top(-en/-es)`, `desktop-full`, `desktop-gallery-1…5`, `desktop-video-poster/playing`, same set for mobile |

### 7.5 Performance (local production build, cold first visit, `scripts/rt-116-perf.mjs`)
| Device | LCP | Page weight | Images | Cover served | Video before play |
|---|---|---|---|---|---|
| Desktop 1440×900 | 1.34 s (includes first-time image optimisation) | 584 KB | 289 KB / 6 requests | WebP 828 w, 106 KB | 0 KB |
| Mobile 390×844 @2x | 0.18 s | 620 KB | 325 KB | WebP 750 w, 89 KB | 0 KB |
| Mobile, simulated 4G (9 Mbps, 150 ms) | 0.65 s | 635 KB | 340 KB | WebP 750 w, 89 KB | 0 KB |

Local server without CDN latency: real numbers will be higher. The 1500×2000 JPEG masters are never sent as-is (next/image serves resized WebP); the clip (3.6 MB) downloads only when the visitor presses play.

### 7.6 Pending
1. **Owner final review** of the preview, especially the clip (window 6.5–22 s, colour after HDR conversion, no sound) and the alt texts.
2. Confirm the exact handle of the mural artist (painted as "@wark rocinha").
3. Files in `public/` are reachable by URL once a branch is deployed, even if the page is hidden: keep them out of `main` until publication is authorised.
4. Data model (not blocking): localized `TripImage.credit` and video support (`TripVideo`) for the Sprint 11 admin; any migration local only until authorised.
5. Public wiring of the RT-114 sections and the other three tours' photos (RT-116 continues tour by tour).

## 8. Owner visual approval (17/10/2026)
- **Approved:** RT-114 v2 layout; main photo (IMG_1243); the five photos; gallery order; short video without audio; desktop and mobile presentation; visual identity and proportions.
- Rule: no new aesthetic changes without a proven defect or an Owner request.
- Evidence: commit `dc58359`; `docs/baseline/rt-116-rocinha/` (captures, `results.json`, `perf-4g.json`); review page shared with the Owner in the conversation (private).
- Jira: RT-114 comment recorded (17/10). The first RT-116 comment attempt (integration report, with the review-page link) was blocked by the agent's permission check; it was not bypassed, and this document is the canonical record.
- Still pending: credit spelling (@wark rocinha); written consent on file (recommended); slow-4G video stalls (lighter mobile rendition, Owner OK needed); data model for video/credit; everything in the readiness analysis before any publication.
