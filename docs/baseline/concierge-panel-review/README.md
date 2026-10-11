# Concierge panel — Owner design review evidence (RT-71 / RT-74)

**Status: OWNER VISUAL GATE PENDING. This package is evidence for review; it is not an approval and not an activation.** The panel stays an isolated, production-hidden prototype in the rebuild lab (`/pt/rebuild-lab/concierge-panel`). It is not mounted on any public route and does not call the endpoint or a model: replies come from deterministic scenarios that reuse the real runtime texts and the real handoff builder.

Captured 2026-10-11 from the local dev server with a headless Chromium (desktop 1280×800, mobile 390×844) by the script described below. The black round "N" at the bottom-left of the screenshots is the Next.js development overlay, not part of the product.

| # | Desktop | Mobile | What to judge |
| --- | --- | --- | --- |
| 01 | `desktop/01-closed.png` | `mobile/01-closed.png` | Closed state: slim vertical editorial tab (desktop) / gold pill (mobile), no chat bubble |
| 02 | `desktop/02-open-empty.png` | `mobile/02-open-empty.png` | Empty conversation: AI disclosure, starter questions, persistent "Falar com a equipe" |
| 03 | `desktop/03-active-conversation.png` | `mobile/03-active-conversation.png` | Active conversation: editorial answer with gold rule, user block, compact AI strip |
| 04 | `desktop/04-tour-recommendation.png` | `mobile/04-tour-recommendation.png` | Tour recommendation using two real published tours, official links, no price or availability |
| 05 | `desktop/05-whatsapp-handoff.png` | `mobile/05-whatsapp-handoff.png` | WhatsApp handoff: suggested message visible and editable, WhatsApp primary, e-mail secondary, "nothing is sent automatically" |
| 06 | `desktop/06-price-handoff.png` | `mobile/06-price-handoff.png` | Price question: no price in chat, hands over to the tour page or the team |
| 07 | `desktop/07-error-degraded.png` | `mobile/07-error-degraded.png` | Error: composer disabled, retry, human channels visible |
| 08 | `desktop/08-rate-limited.png` | `mobile/08-rate-limited.png` | Rate limit: countdown, composer re-enabled automatically, human channels visible |

## Reading guide (hierarchy)

Header (brand eyebrow → "Concierge" display title → AI tag + human entry) → disclosure strip → conversation → composer → privacy link. The human path is always one tap away; the AI nature is stated before the first message and kept as a strip afterwards. Palette RT-10 (charcoal, matte gold), typography RT-11 (Cormorant Garamond display, Inter interface).

## Automated checks run on the rendered DOM (not a screen-reader test)

Both viewports: dialog labelled, announced log region (`aria-live="polite"`), labelled composer, 0 text elements under 12 px, no horizontal scroll, Escape closes the panel and returns focus to the entry tab. Console: 0 errors.

## Things the Owner may want to decide (observations from this capture)

1. Tour links in answers now read "ver o passeio" instead of a long raw URL (changed after the first capture showed raw URLs wrapping mid-word).
2. The recommendation text is an illustrative fixture shaped by the approved recommendation policy; the real wording will come from the model at integration time, which is why real answer quality is judged at RT-75, not here.
3. Emergency, availability and legal-notice wording are still proposals (Owner approval pending), as before.

## Not verified

Other browsers and real devices, screen readers (NVDA/VoiceOver), real network latency, behaviour with the real endpoint, EN/ES (V1 is PT only).

## Reproduce

Run the dev server, open the lab route, pick a scenario with the radio list, open the panel and send any message. The capture used the browser-automation skill with a script that selects each scenario, sends one message and takes a screenshot per state (script kept outside the repo).
