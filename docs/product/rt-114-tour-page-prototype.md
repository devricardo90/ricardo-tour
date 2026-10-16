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
