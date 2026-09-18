# RT-11 — Display and interface typography

## Status and scope

- Canonical issue: RT-11 / RT-RB-S1-02, “Definir sistema tipográfico display + interface”.
- **Owner-approved direction: Option A, 2026-09-17.** The approval record and rendered proof are preserved in `docs/baseline/rt-11-approved/`.
- This file documents the selected families and responsive candidate tokens. It does **not** implement them in the application or authorize applying typography to production.
- RT-11 closure is limited to documentation, approved preview evidence, and governance records. No app components/styles, database, Prisma, production data, or RT-15 were changed; no migration was run.

## Owner decision

The Owner approved the Option A pairing because it best carries Rick Travel’s premium, sophisticated and editorial position while maintaining functional clarity and continuity with RT-10.

| Role | Family | Boundary |
| --- | --- | --- |
| Display | Cormorant Garamond | Display titles and principal headings only; used for hero H1 and principal section H2 in the approved composition. |
| Interface | Inter | Navigation, forms, buttons, cards, functional text and body copy. Card headings are Inter. |

The chosen family pair is approved; sizes and weights below are candidate values for a future, separately authorized implementation. RT-10’s approved palette, hero lighting, imagery, grid, spacing and component composition are unchanged.

## Candidate responsive tokens

Sizes are pixels; line-height is a unitless multiplier; letter-spacing is zero unless stated. Mobile values apply at the 390px preview viewport.

| Token | Family / weight | Desktop | Mobile | Letter spacing |
| --- | --- | --- | --- | --- |
| H1 hero | Cormorant Garamond 500 | 68px / 0.82 | 48px / 0.88 | 0 |
| H1 secondary display line | Cormorant Garamond 500 | 35px / 0.82 | 25px / 0.88 | 0 |
| H2 principal section | Cormorant Garamond 500 | 32px / 1.02 | 29px / 1.02 | 0 |
| H3 experience card | Inter 600 | 20px / 1.10 | 20px / 1.10 | 0 |
| H4 subsection (extension candidate) | Inter 600 | 18px / 1.25 | 17px / 1.25 | 0 |
| H5 compact heading (extension candidate) | Inter 600 | 16px / 1.30 | 15px / 1.30 | 0 |
| H6 small heading (extension candidate) | Inter 600 | 14px / 1.40 | 14px / 1.40 | 0 |
| Body L — hero | Inter 400 | 14px / 1.55 | 12px / 1.55 | 0 |
| Body M — supporting copy | Inter 400 | 13px / 1.50 | 13px / 1.50 | 0 |
| Body S — card description | Inter 400 | **13px / 1.45** | **13px / 1.45** | 0 |
| Card price / compact metadata | Inter 700 | **12px / 1.20** | **12px / 1.20** | 0 |
| Card photo-status badge | Inter 700 | **12px / 1.20** | **12px / 1.20** | 0; uppercase |

The Owner explicitly rejected 11px as the standard card size and established **12px as the absolute minimum for every visible card text on desktop and mobile**, with **13px preferred for short descriptions**. The isolated preview applies this to the card descriptions, prices and pending-photo badges; it does not change card padding, dimensions, grid, or spacing. H4–H6 are extension candidates and were not present in the reviewed composition.

Other functional sizes present in the RT-10 composition (navigation, controls and general captions) were retained to isolate this approved typographic refinement; the 12px floor above is specific to card text.

## Font sourcing, license and web delivery

- Cormorant Garamond: official [Google Fonts family page](https://fonts.google.com/specimen/Cormorant+Garamond) and [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/METADATA.pb) record a variable normal family, weights 300–700, with Latin and Latin-ext subsets.
- Inter: official [Google Fonts family page](https://fonts.google.com/specimen/Inter), [Google Fonts metadata](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb), and [Inter project](https://rsms.me/inter/) record a variable normal family, weights 100–900 and optical-size axis 14–32, with Latin and Latin-ext subsets.
- Both metadata records specify SIL Open Font License 1.1 (OFL). The license permits commercial use and web embedding/redistribution when the required copyright and license notices accompany the font; it does not permit selling the font by itself. See the [official OFL text](https://openfontlicense.org/open-font-license-official-text/) and [OFL FAQ](https://openfontlicense.org/ofl-faq/).
- The isolated review uses unmodified WOFF2 files obtained from the official Google Fonts CSS/CDN service; the fetched Latin subsets total **85,896 bytes** and both Latin plus Latin-ext subsets total **204,700 bytes** for the selected pair. The review uses `font-display: swap`, unicode-range subsetting and system fallbacks. A future application integration should ship only the selected family files and limit preloads to the critical subset.
- The browser verified custom-font rendering for Portuguese, English, Spanish and Swedish character samples, including accents and special characters. Detailed per-glyph validation is in `docs/baseline/rt-11-approved/validation.json`.

## Visual and responsive validation

The isolated preview is a copy of the approved RT-10 composition with type-only changes. Playwright/Chromium checks passed at 1440×900 and 390×844:

- actual Cormorant display-heading and Inter interface/card rendering;
- 13px card descriptions and no card text below 12px in either viewport;
- no document-level horizontal overflow, with the approved mobile experience rail remaining independently scrollable;
- long-description wrapping and containment within the card;
- successful loading of all five content images and no browser errors;
- rendered copy scan for email-address and credential/secret-label patterns, with no matches.

The screenshots are full-page PNGs; PNG dimensions, byte sizes, SHA-256 hashes and validation details are included in `docs/baseline/rt-11-approved/`.

## Canonical Source of Truth reconciliation

The canonical Google Doc is updated in place as part of RT-11 closure. Section 7 records Ricardo's formal approval of Option A and the exact card scale. Section 9 retains its earlier planning entries as history and adds a dated reconciliation: the RT-RB-S1-01 next-action pointer is superseded by completed RT-10 (`cb68cbb`) and approved/closed RT-11; the next Sprint 1 task awaits explicit Owner authorization. RT-15 remains `BACKLOG / READY` and was not changed.

This approval closes the typography proposal only. It does not authorize production font implementation or other application work.

## Non-goals

- No edit to `app/`, `components/` or `globals.css`.
- No database, Prisma, migration, or production-record access/change.
- No RT-15 changes.
- No change to RT-10 or its approved design.

The full token table and evidence pointers are in [`../baseline/rt-11-approved/owner-decision.md`](../baseline/rt-11-approved/owner-decision.md).
