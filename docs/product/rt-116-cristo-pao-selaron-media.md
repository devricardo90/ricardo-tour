# RT-116 — Cristo Redentor + Pão de Açúcar + Escadaria Selarón: media integrity, identification and local preview

- Date: 2026-10-17. Tour record: `cmlhxkpy9000028zq27rhytew` (published as "Cristo Redentor + Pão de Açúcar"). Branch `sprint10/tours-content` (local only). Nothing published; no push/merge/deploy; no database touched.
- Owner decisions (17/10/2026): editorial definition "Cristo Redentor + Pão de Açúcar + Escadaria Selarón"; own photos IMG_1162, IMG_1171, IMG_1163, IMG_1181, IMG_1179 approved; video IMG_1157.MOV, preferred version A (41–58 s), poster 51 s; Cristo and Selarón from Pexels (Maxi Franzoi, Bruno Scramgnon) as candidates; visitors' image authorisation **declared** by the Owner. Do not restart curation.

## 1. Source and local mirror
Drive `MIDIAS / 01_CRISTO_PAO_DE_ACUCAR_SELARON` (`1TbXlicV-xvk--Qy_eOE9bz1GGtbXkweW`). Local read-only mirror: `Desktop\rick-travel-media\01_CRISTO_PAO_DE_ACUCAR_SELARON\` (`SHA256SUMS-ORIGINAIS.txt`, `SHA256SUMS-SELECIONADAS.txt`; copy in `docs/product/rt-116-cristo-pao-selaron-originals.sha256`).

| File (Drive) | Bytes (= Drive) | Real format | Pixels | Metadata | Origin |
|---|---|---|---|---|---|
| img1-pao-de-acucar.webp | 235,924 | WebP (`RIFF…WEBP`) | 952×1269 | none | Export of an own photo (see §2) |
| img2-pao-de-acucar.webp | 126,468 | WebP | 952×1269 | none | idem |
| img3-pao-de-acucar.webp | 151,038 | WebP | 952×1269 | none | idem |
| img4-pao-de-acucar.webp | 273,284 | WebP | 952×1269 | none | idem |
| img5-pao-de-acucar.webp | 170,940 | WebP | 952×1269 | none | idem |
| img-cristo-redentor1.jpg | 1,037,887 | JPEG | 5616×3744 | small EXIF/XMP, no author | Third party — see §3 |
| img-escadaria-selarao1.jpg | 1,776,159 | JPEG | 2322×4128 | small EXIF, no author | Third party — see §3 |
| IMG_1157.MOV | 200,968,372 | QuickTime HEVC 4K vertical, HLG/Dolby Vision, AAC audio, 63.2 s | — | GPS (Urca/Pão de Açúcar), iPhone 14 Pro Max, 02/12/2025 | Own video; copied from the Drive export zip (same size, `unzip -t` OK) |
| SELECIONADAS_OWNER/PAO_versaoB_43-57s_1080x1920.mp4 | 5,171,884 | H.264 1080×1920, 14 s, **no audio**, still tagged HLG (HDR) | — | encoder tag only | Edited version B |

The HEIC originals of the five approved photos are **not in the Drive** (they exist only in the Owner's iCloud folder, cloud-only and not readable locally). Pending item, not blocking for the preview.

## 2. Identification of the own photos (by content, not by file name)
Method: each WebP compared with the Owner's visual index of the approved selection (`Downloads/pao_de_acucar_indice_visual.jpg`, thumbnails labelled with the camera file names) and, for IMG_1179, with the full-size iCloud export `IMG_1179.JPEG` (4344×5792); grey-scale correlation at 48×64 plus visual check (`docs/baseline/rt-116-cristo-pao-selaron/webp-vs-reference.jpg`).

| WebP | Best match | Correlation | Next best | Result |
|---|---|---|---|---|
| img1 | IMG_1162 | 0.996 | 0.400 | **IMG_1162** (two visitors at the viewpoint, Sugarloaf behind) |
| img2 | IMG_1171 | 0.999 | 0.579 | **IMG_1171** (cable-car wires and summit) |
| img3 | IMG_1163 | 0.997 | 0.042 | **IMG_1163** (visitor at the railing, bay behind) |
| img4 | IMG_1181 | 0.996 | 0.477 | **IMG_1181** (visitor on the deck) |
| img5 | **IMG_1180** | 0.998 | IMG_1179: 0.561 | **Not the approved IMG_1179.** It is IMG_1180 (reserve panorama with green nets) |

Quality for the local preview: 952×1269 (3:4) is enough for the gallery (the main frame shows ≈ 450 CSS px high on desktop, 4:3 frame on mobile); no visible blocking; IMG_1171 and IMG_1180 have a strong teal colour grade (already noted by the Owner's register as "looks filtered"). For publication, the HEIC originals should replace the WebPs.

## 3. Third-party candidates (Pexels) — identity check
Reference files downloaded from the cited Pexels pages (public CDN, `_PEXELS_REFERENCIA/`); page data checked on 17/10/2026: "Christ the Redeemer in Rio de Janeiro", Maxi Franzoi, 3000×2250; "The Selaron Steps in Rio de Janeiro, Brazil", Bruno Scramgnon, 3264×4928.

| Drive file | Cited Pexels photo | Comparison | Result |
|---|---|---|---|
| img-cristo-redentor1.jpg (5616×3744, 3:2) | 9977483 (3000×2250, 4:3) | Drive: close-up from below, whole statue fills the frame, pale sky, no pedestal. Pexels: full statue on its pedestal, deep blue sky, wide margins | **Different photograph.** Not a crop or resize (the Drive file is larger than the cited original and shows a different angle) |
| img-escadaria-selarao1.jpg (2322×4128, 9:16) | 13185516 (3264×4928, 2:3) | Drive: steps seen from below with a Brazilian-flag mural at the top. Pexels: different viewpoint, "KAZAKHSTAN" tile in the foreground, visitors on the steps | **Different photograph** |

Evidence: `docs/baseline/rt-116-cristo-pao-selaron/pexels-vs-drive.jpg`. Consequence: the real source and licence of the two Drive files are **unknown**; the Owner's licence register rows (Pexels, Maxi Franzoi / Bruno Scramgnon) do not apply to these files as they stand. In the preview they are marked `UNVERIFIED` (the public gate hides them) with the caption "Foto de terceiros · origem em verificação". Separate open points remain: rights over the statue and over Jorge Selarón's tiles (legal validation); no legal clearance declared.

## 4. Video
- **Version A (41–58 s) is not in the Drive**; only version B (43–57 s) is (in `SELECIONADAS_OWNER`). Version B is still tagged HDR (HLG), which can look washed out on SDR browsers, and is 1080×1920 at ≈ 2.9 Mbps.
- For the preview, the web rendition of the Owner's window A was produced from the original with the same pipeline as Rocinha (no creative re-edit: same window chosen by the Owner): 41.0 → 58.0 s (17 s; frames are clean until 58.6 s, a finger enters at 59 s), HDR → SDR BT.709, **audio removed**, metadata incl. GPS removed, faststart; poster = frame at 51 s.

| File | Size | Avg bitrate | VMAF vs reference | Use |
|---|---|---|---|---|
| pao-bondinho-41-58.mp4 (720×1280) | 2.85 MB | 1.34 Mbps | 92.2 | desktop / wide screens |
| pao-bondinho-41-58-mobile.mp4 (720×1280) | 2.08 MB | 0.98 Mbps | 89.1 | screens ≤ 767 px |
| pao-bondinho-41-58-poster.jpg | 121 KB | — | — | poster (51 s) |

Not approved until the Owner reviews playback.

## 5. Commercial conflict: Selarón (Owner editorial definition × published catalog)
| | Cristo Redentor + Pão de Açúcar (published) | Tour Privado Premium (published) |
|---|---|---|
| Highlights | Cristo Redentor, Bondinho do Pão de Açúcar, Vista da Baía de Guanabara | Roteiro personalizado, Cristo Redentor, Pão de Açúcar, Santa Teresa, **Escadaria Selarón** |
| Duration / price (old catalog, not approved for the private catalog) | 5 a 6 horas / R$ 385 | 8 horas / R$ 900 |
| Included | van transport, guide, Cristo and Pão de Açúcar tickets | private guide, executive transport, flexible route |

Conflict: adding Selarón to "Cristo + Pão de Açúcar" changes that product's route, duration, name and possibly price (RT-112 A7/A8, RT-115), and overlaps with the Premium, which today is the product that sells Selarón. **No route was changed:** the preview keeps the current name; Selarón appears only as a gallery candidate. The single decision that depends on the Owner is listed in §8.

## 6. Local preview (rebuild lab, production-hidden)
- Gallery (6): IMG_1162 (cover) → Cristo (third party, unverified) → IMG_1171 → IMG_1163 → IMG_1181 → Selarón (third party, unverified). **Order and cover are a proposal** (cover status PROVISIONAL): own photo as cover because the third-party images are unverified; attractions alternate so all three appear early. IMG_1180 is not shown (not approved).
- Video block "O Rio visto do Pão de Açúcar" (PT/EN/ES) with the mobile rendition served by `<source media="(max-width: 767px)">`.
- Same RT-114 v2 layout and Design System; no aesthetic change.

## 7. Evidence (`docs/baseline/rt-116-cristo-pao-selaron/`)
| Check | Result |
|---|---|
| Desktop PT/EN/ES + mobile PT | HTTP 200; 6/6 photos in order; captions on the two third-party photos only; no horizontal overflow; CTA above the fold; 0 console errors |
| Video | no autoplay; 0 bytes before play; desktop plays the full clip, mobile the lighter one; 17 s |
| 4G (mobile, 4× CPU, local production build) | fast 4G: start 0.21–0.24 s, 1 micro-stall (≤ 38 ms); slow 4G: start 0.71–0.73 s, 1 stall ≈ 0.1 s, plays to the end; page ≈ 636 KB; LCP 1.3–1.4 s (fast) / 3.1–3.2 s (slow) |
| Tests | `tests/rt-113-tour-content.test.tsx` 29/29 (new: mobile sources, gallery order, IMG_1180 excluded, third-party UNVERIFIED and hidden publicly, no metadata) |

## 8. Pending
| Type | Item |
|---|---|
| **Owner decision (commercial)** | Does Escadaria Selarón become an official stop of the "Cristo + Pão de Açúcar" product (affects name, route, duration, price and the Premium), or does it appear only as visual content until the route is defined in RT-112? |
| Owner (media) | IMG_1179 vs IMG_1180: the Drive holds IMG_1180; upload IMG_1179 or confirm the substitution |
| Owner (media) | Real source of the two third-party files, or replace them with the cited Pexels files |
| Owner (video) | Review the web rendition of version A (41–58 s, poster 51 s); upload the edited version A if it exists |
| Documentary | HEIC originals of the 5 photos in the Drive; written image authorisations of the identifiable visitors (IMG_1162, IMG_1163, IMG_1181) — declared, not yet documented |
| Legal | Rights over the statue (Cristo) and the Selarón tiles; Pexels licence text review; no clearance declared |
| Data model | Video and photo credit not in the schema (same as Rocinha) |
