# RT-11 — owner decision and approved preview evidence

## Decision record

- Date recorded: 2026-09-17.
- Issue: RT-11 — define display and interface typography.
- Mode: design proposal / owner review; no application implementation.
- Decision: **Option A approved**.

| Role | Approved family | Approved boundary |
| --- | --- | --- |
| Display | Cormorant Garamond | Display titles and principal headings only. |
| Interface | Inter | Navigation, forms, buttons, cards, functional text and body copy; card titles use Inter. |

Owner rationale: Option A is more aligned with Rick Travel’s premium, sophisticated and editorial positioning and better preserves the visual direction approved in RT-10.

## Required card-text correction

The Owner rejected 11px as the default card-text size and directed that 12px is the minimum acceptable size, 13px is preferred for short descriptions, the 12px minimum also applies on mobile, and no card text may be reduced below it.

The isolated approved preview applies:

| Card element | Desktop | Mobile | Family / weight |
| --- | ---: | ---: | --- |
| Experience title | 20px / 1.10 | 20px / 1.10 | Inter 600 |
| Short description | **13px / 1.45** | **13px / 1.45** | Inter 400 |
| Price label | **12px / 1.20** | **12px / 1.20** | Inter 700 |
| “Foto pendente” badge | **12px / 1.20** | **12px / 1.20** | Inter 700 |

No visible card text is smaller than 12px. Cards retain the approved component structure, padding, dimensions, spacing, imagery, colors and responsive rail behavior.

## Preserved review captures

These PNG files were copied from the isolated preview capture and are byte-verified against the capture report.

| Evidence | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| [`owner-approved-desktop.png`](owner-approved-desktop.png) | 1440 × 2607 | 1,741,610 | `5eeb5217c0923de639d178007e5b9e1f61c43a591f6c7dcc2fba4123674c8da9` |
| [`owner-approved-mobile.png`](owner-approved-mobile.png) | 390 × 3502 | 454,661 | `1f42de18d315408fa82bb262d29fcecee2fcadc64234ba47c6cc59d317d49e52` |

Full per-viewport test results, actual font usage, international glyph verification, image loading, text measurements, page/card overflow, long-description wrapping, screenshot integrity and sensitive-pattern scan: [`validation.json`](validation.json).

## Integrity, content and scope checks

- Playwright/Chromium captured full-page PNGs at 1440×900 and 390×844. Both files have valid PNG signatures; screenshot dimensions and SHA-256 hashes are listed above and recorded in `validation.json`.
- Both custom families rendered actual text. Font glyph samples cover Portuguese, English, Spanish and Swedish, including accented/special characters.
- No viewport-wide horizontal overflow. The mobile card rail remains separately swipe-scrollable. The longer description wraps and stays inside card bounds in both viewports.
- All five content images loaded; no browser errors. An automated scan of rendered copy found no email address or credential/secret-label pattern. Manual content review found only the travel preview, public place names, placeholder `$XX` prices, and RT-10 media-pending notices; no contact details or credentials.
- The old three-option boards/captures remain historical pre-decision proposal artifacts in `.tmp/rt-11-typography-proposal/artifacts/`; they are not the final approved Option A evidence.

## Source of Truth follow-up

The canonical Google Doc is updated in place on 2026-09-17. Section 7 records Ricardo's Option A approval and the exact card scale. Section 9 preserves the earlier RT-RB-S1-01 planning pointer as historical context, identifies it as superseded by RT-10 completion (`cb68cbb`) and RT-11 closure, and records that the next Sprint 1 task awaits explicit Owner authorization. RT-15 remains `BACKLOG / READY` and was not changed.

Jira RT-11 acceptance criterion: “Fontes escolhidas com legibilidade e licenciamento adequados.” It is met by the documented Google Fonts source records and SIL Open Font License 1.1 evidence, plus Playwright/Chromium validation of actual Cormorant Garamond and Inter rendering, international glyph coverage, card-size floors, responsive wrapping, overflow, and screenshot integrity. Jira is commented with the approval, permanent evidence paths, and pushed commit after `Remote DONE`; RT-11 is transitioned to `Concluído` only after the push is verified.

## Scope boundary

This record does not implement typography or change production. No `app/`, `components/`, `globals.css`, database, Prisma, migration, production record, or RT-15 was changed. RT-10 remains complete and was not reopened or modified. Jira/Google Doc governance updates and the documentation/evidence commit are limited to RT-11 closure.
