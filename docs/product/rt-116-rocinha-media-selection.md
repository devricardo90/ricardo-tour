# RT-116 — Favela Rocinha: media recovery, integrity and proposed use

- Date: 2026-10-17. Tour: `cmli1a6im000034zqqzc9sppb` (Tour Favela Rocinha com Guia Local). Sprint 10.
- Status: **originals recovered and verified; selection analysed; usage proposal awaiting Owner confirmation.** No file converted or optimized for production (Owner rule, 17/10: confirm the selection first). Nothing published, no push/merge/deploy.
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
