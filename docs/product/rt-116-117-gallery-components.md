# RT-116 / RT-117 — Gallery and photo components (technical part)

- Date: 2026-10-16. Status: **components implemented and tested; real photographs pending from the Owner.** Neither ticket is complete until the approved photos and their rights records exist.

## 1. Components
| Component | File | Notes |
|---|---|---|
| `ImageGallery` (client) | `components/site/media/image-gallery.tsx` | 1 image → plain figure; 2+ → previous/next buttons, thumbnail strip, Left/Right keys, polite "Foto n de N". Labels are plain strings with `{n}`/`{total}` (serializable server→client). Reusable outside tours (RT-117 Quem Somos can use it with one image) |
| `TourGallery` | `components/site/tour/content/tour-content-sections.tsx` | Wires `ImageGallery` to `TourContentView.gallery` with PT/EN/ES labels; cover image first |
| Data | `TripImage` (RT-113) | Ordered images, localized alt text, `isCover`, `rightsStatus`, `rightsNote` |

## 2. Licensing and publication rules
1. A photo is public only with `rightsStatus` = `OWNER_ATTESTED` or `LICENSED`; `UNVERIFIED` photos are filtered out by the gate (tested on a local database).
2. `rightsNote` records author, consent of identifiable people and the licence/attestation reference (RT-79 register).
3. No stock or AI-generated image without a licence; nothing from the Hero (RT-79, licence NOT verified).
4. The agent never chooses photos; the Owner approves the set per tour.
5. Alt text in PT/EN/ES describes what the photo shows (RT-111 found the Rocinha catalog alt "Vista da Rocinha" does not match its photo).

## 3. Evidence
Unit tests (rights filter, cover ordering, label serializability, mock photos limited to rights-recorded files), local DB gate check (UNVERIFIED image hidden), prototype captures 24/24 with working gallery, accessibility check 12/12 (see `docs/product/rt-114-tour-page-prototype.md`).

## 4. Pending (Owner)
- RT-116: cover + gallery photos for each of the four tours, with rights; **replacement photo for the Tour Privativo Premium**; the Colombo master (6002×8002, 4.8 MB) needs optimized derivatives.
- RT-117: the new Quem Somos photo, with author and consent.

## Update — round 1 (17/10/2026): adaptive gallery for the Owner's real photographs
- Owner decision: real photographs supplied by the Owner first, later complemented by photos taken during operations; no AI images for real tours; third-party images only with verified commercial rights.
- Works with any quantity (tested 1, 3, 5, 8 on desktop and mobile): 1 image → plain figure; more → thumbnails, buttons, arrow keys; never empty slots.
- Quality: the main view shows the whole photo (no crop, no distortion) over a blurred copy; responsive `sizes`; Next image optimization (web formats, resized per viewport).
- Framing: optional focal point per image (`TripImage.focalX/focalY`, 0–1, DB CHECK) used for thumbnails/cover crops.
- `next/image` used directly (the existing `OptimizedImage` can stay blurred when an image loads before hydration — risk recorded for the public components that use it).
