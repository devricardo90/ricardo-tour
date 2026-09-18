# Playwright validation — consolidated Home evidence

## Source report

The approved preview's Playwright report was generated on 18/09/2026 and covered PT, EN, and ES at desktop 1440×900 and mobile 390×844. It reports 6 locale/viewport scenarios, 15 assertions per scenario (90 total), 0 failed assertions, 0 issues, 0 browser errors, and 0 unloaded images.

The source report SHA-256 is:

cae56330e787aa146280872fbd0c60764591a28c50017059fbecf09315489e5f

Its original temporary location was .tmp/home-redesign-phase-b-2026-09-17/artifacts/validation-ai-concierge-refined-owner-review-2026-09-18.json. This concise report preserves the results without archiving environment-specific absolute paths or full DOM snapshots.

## Packaged-path verification

The archived HTML was opened from its permanent package path using Chromium/Playwright. All 6 locale/viewport combinations passed:

| Locale | Desktop 1440px | Mobile 390px |
| --- | --- | --- |
| PT | PASS | PASS |
| EN | PASS | PASS |
| ES | PASS | PASS |

Each run confirmed the viewport width matched document width (no horizontal overflow), all referenced images loaded, Cormorant Garamond and Inter loaded, the AI Concierge heading rendered, and no page or console errors occurred.

The source report additionally checked localized copy, card fit and text clipping, layout behavior, disabled chat controls, image loading, approved typography, and no regressions outside the AI Concierge section.
