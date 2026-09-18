# Rick Travel — Approved Home design evidence

## Status and scope

This package preserves the consolidated Home preview selected by the Owner for the RT-12 / RT-13 design deliverables. It is a design reference and evidence archive only. It is not production code, does not implement the flight-search engine or AI Concierge, and is not approval to publish the Home.

The HTML, CSS, JavaScript, referenced images, video, fonts, and screenshots were copied from the approved preview and its explicitly referenced dependencies. The HTML and implementation assets were not redesigned. Their relative paths are preserved by the package layout below.

## Open the consolidated preview

Start at:

preview/complete-home/phase-b-ai-concierge-refined-preview.html

The local assets are resolved relative to that page. The package includes only the linked dependencies needed by the preview, not the entire temporary workspace.

## Evidence

- Desktop capture: screenshots/home-desktop-1440.png
- Mobile capture: screenshots/home-mobile-390.png
- Playwright results and packaged-path verification: validation/playwright-validation.md
- Owner decision record: OWNER-APPROVAL.md
- File inventory, source provenance, sizes, and SHA-256 hashes: MANIFEST.md
- RT-10 token snapshot: references/rt-10-design-tokens.md
- RT-11 system snapshot: references/rt-11-typography-system.md

The canonical RT-10 and RT-11 records remain at docs/architecture/rt-10-design-tokens.md and docs/architecture/rt-11-typography-system.md; their approved evidence remains in docs/baseline/rt-10-approved/ and docs/baseline/rt-11-approved/.

## Owner decision — 18/09/2026

The Owner approved option B: the consolidated HTML and its evidence replace retroactive reconstruction of the Home in Figma as a required deliverable for RT-12 and RT-13. No Figma file was created or is claimed here. Figma remains available for future work.

RT-12 now targets documented desktop evidence, including a 1440px capture and visual-approval evidence. RT-13 targets the responsive consolidated HTML, including a 390px mobile capture and responsive validation. RT-14 remains responsible for component specifications. RT-15 remains a separate Owner gate and has not been approved or transitioned by this record.

## Limitations and publication dependencies

- The flight-search form is visual only; no flight-search integration is present in this preview.
- AI Concierge is explicitly a non-operational visual concept.
- The portrait in preview/complete-home/about-ricardo-review/ricardo-pao-de-acucar-owner-supplied.png is provisional and must be replaced with an authentic approved photograph before publication, as recorded by the Owner.
- Cadastur/public registration details, company legal information, Privacy Policy, and Terms of Use remain subject to verification or completion before publication.
- The package does not assert that the Home is ready for production or publication.

## Data and integrity checks

The copied preview and report sources were scanned for credential-like patterns; no matches were found. JPEG/PNG metadata inspection found no GPS EXIF tags in the included photographs. The video container exposed only encoding/container tags. The preview intentionally retains the already-authorized public contact links and Owner-approved visual assets needed to reproduce the approved design.

All packaged files are individually listed with byte length and SHA-256 in MANIFEST.md. The source preview remains unchanged under .tmp/home-redesign-phase-b-2026-09-17/.
