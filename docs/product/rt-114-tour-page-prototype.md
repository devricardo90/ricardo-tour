# RT-114 [RT-RB-S10-04] — Tour page prototype (mock) for the Owner's visual review

- Date: 2026-10-16. Status: **awaiting the Owner's visual approval.** Tests passing do not approve the design.
- Rebuild-lab only: 404 in production (verified on a production build, 16/10), `noindex`, not linked from the site. No database is read or written; the public `/tours/[id]` page is unchanged.

## How to view it locally
1. Worktree `C:\Users\ricardodev\Desktop\rick-travel-s9-gate`, branch `sprint10/tours-content`.
2. `npx next dev --webpack --port 3233` (no `.env` needed; the prototype uses no database).
3. Open the index: `http://127.0.0.1:3233/pt/rebuild-lab/tour-content-preview`.
4. Screens available (4 tours × PT/EN/ES = 12): `http://127.0.0.1:3233/{pt|en|es}/rebuild-lab/tour-content-preview/{id}` with
   - `cmlhxkpy9000028zq27rhytew` — Cristo Redentor + Pão de Açúcar
   - `cmli1a6im000034zqqzc9sppb` — Tour Favela Rocinha com Guia Local
   - `cmlibniq40000z4zqkbujnutt` — Confeitaria Colombo + City Tour Rio
   - `cmljo0s1u0000t0zqa0bpd23p` — Tour Privado Premium Rio de Janeiro

Static captures: `docs/baseline/rt-114-prototype/` (desktop 1440 px and mobile 390 px; PT for the four tours, EN and ES for Cristo + Pão de Açúcar).

## What is real and what is MOCK
| Part | Origin |
|---|---|
| Title, price per person, category, "Sobre o passeio", highlights, included / not included | **Published today** (verbatim snapshot of 16/10, verified 69/69 by RT-111). Labelled "PUBLICADO HOJE". Prices unchanged. Still Portuguese in EN/ES — that is the real state |
| Duration in "Informações práticas" | Published value, localized formatting only |
| Meeting point, start time, requirements, accessibility, weather, itinerary stops | **MOCK** — every text says "(exemplo fictício)" / "(fictitious example)" / "(ejemplo ficticio)" |
| Languages "Português · Inglês · Espanhol" | **MOCK** (decision A2 of RT-112 pending) |
| Gallery (3 photos) | Arrangement is **MOCK**; the photos are only ones with recorded rights (the tour's own published photo — Owner attestation RT-79 — and the two Rio Story photos, RT-32 "OWNER ORIGINAL") |
| "Fale com a equipe" box | Placeholder for the existing request form (not changed) |
| Yellow banner | States that the page is a prototype with fictitious data |

## What is already functional
- Gallery: previous/next buttons, thumbnail strip, Left/Right arrow keys, "Foto n de N" announced politely; works with 1…n images.
- Sections render only when they have content (no empty headings in production use).
- Practical facts grid, itinerary timeline with durations, requirements/accessibility/weather notes, PT/EN/ES labels.
- Publication gate behind it (RT-113): only OWNER_APPROVED, non-MOCK content and rights-recorded images can ever be public.

## Evidence
| Check | Result |
|---|---|
| `scripts/rt-114-capture.mjs` (24 loads: 4 tours × 3 languages × desktop/mobile) | 24/24: HTTP 200, mock banner present, gallery advances by click and by ArrowRight, no horizontal overflow, no console errors (`results.json`) |
| `scripts/rt-114-a11y-check.mjs` (12 pages) | 12/12: one `h1`; every image has alt (empty only for decorative thumbnails inside labelled buttons); every button named; one current thumbnail; live position; visible keyboard focus outline; `<html lang>` = locale (`a11y.json`). Not a full audit (no axe-core in the project) |
| Render test `tests/rt-113-tour-content.test.tsx` | Banner, unchanged published price and every section in PT/EN/ES |
| Production build | Routes compile; served 404 in production mode |
| Defect found and fixed | Server→client props: gallery labels were functions (HTTP 500 in dev); now string templates + regression test |

## Decisions for the Owner (visual)
Layout order (gallery first, facts at the top right, itinerary after "Sobre o passeio"), card style of practical facts, timeline style, thumbnail strip, mobile stacking. After approval, RT-114 wires these sections into the public `/tours/[id]` page (still reading only approved content), in a separate authorized change.

## Round 1 — Owner review "Changes requested" + Design System addendum (16–17/10/2026)
Status: **still awaiting the Owner's visual approval** (RT-114 stays in Revisar).

| Owner request | What changed |
|---|---|
| Strong CTA "Solicitar disponibilidade" | Solid matte-gold primary button (Design System CTA: `#C8A86B`, charcoal text, radius 6px) in the hero booking card, repeated in a sticky desktop aside and in a **mobile sticky bottom bar** (safe-area aware); all point to the request section that stands for the existing request form. No booking or confirmation logic changed |
| Hero must communicate the tour; only rights-cleared photos | Hero = gallery + commercial summary (title, pitch, modality chips, price, CTA). The cover is flagged **"Foto provisória · capa definitiva no RT-116"**: no rights-cleared photo that clearly shows Christ/Sugarloaf exists yet, so no image was swapped |
| Old prices/routes must not be carried over | Price shows **"Em definição"** (Pendente); duration Pendente; old items (R$ 385, 5–6 h, van, etc.) removed from the prototype (a test forbids them). Review chips on every fact: **Confirmado** (private experience — Owner 16/10), **Provisório** (name, hotel pickup, cover), **Pendente** (price, duration), **Fictício** (everything else) |
| Legibility | Labels 13px, body 16–17px, values 17px semibold; contrast measured on the final surface (gold 8.54:1, muted text 11.46:1, CTA 8.54:1) |
| Less "technical sheet", more commercial | Order: hero → essentials → benefits of a private experience → itinerary → inclusions/exclusions → practical conditions → final request |
| Addendum: no dominant beige; use the existing Design System | Page now uses the surface the Home uses for tours (**"Experiences": charcoal, raised cards, gold**). Audit and gaps: `docs/architecture/rt-114-design-system-audit.md`. The extra token tried earlier was reverted — no new tokens |
| Addendum: adaptive gallery (1/3/5/8), no aggressive crops, framing | Main photo never cropped or distorted (shown whole over a blurred copy of itself); thumbnails use a per-image focal point (`TripImage.focalX/Y`, RT-113); 1 image = no controls/empty slots; 3/5/8 = scrollable thumbnails. Lab: `/{locale}/rebuild-lab/gallery-lab/{1|3|5|8}` |

Evidence (round 1, `docs/baseline/rt-114-prototype/round-1/`): capture 32/32 (24 tour pages: HTTP 200, mock banner, **CTA visible without scrolling on all 24**, gallery by click and arrow key on the first try, no overflow, no console errors; 8 gallery scenarios: count = thumbnails, main image `object-fit: contain`, no overflow); accessibility 12/12; references of the current Home "Experiences" and production tour page for comparison; viewport-only mobile captures showing the sticky bar at the bottom (full-page captures draw fixed bars mid-page — a capture artifact).

Defects found and fixed this round: (1) photos stuck blurred/grey — `OptimizedImage` only clears its loading blur on `onLoad`, which is lost if the image loads before hydration; the gallery now uses `next/image` directly. **Risk recorded:** the same component is used by public pages (Home cards, current tour page, tour cards); not changed (out of scope, production). (2) Mobile bar price wrapped to two lines — tightened.
