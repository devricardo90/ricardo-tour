# Concierge panel — Owner design review, ROUND 2 (RT-71 / RT-74)

**Status: OWNER VISUAL GATE PENDING. Evidence for review, not an approval and not an activation.** The panel is still the isolated, production-hidden prototype (`/pt/rebuild-lab/concierge-panel`): not mounted on any public route, no endpoint call, no model call; replies come from deterministic lab scenarios that reuse the real runtime texts and the real handoff builder. Round 1 is kept for comparison in `../desktop` and `../mobile`.

Captured 2026-10-11 from the local dev server with headless Chromium, desktop 1280×800 and mobile 390×844. The black round "N" in the lower-left corner is the Next.js development overlay, not part of the product.

## What changed in this round (against your seven points)

| # | Requirement | What was done |
| --- | --- | --- |
| 1 | Avatars | **Concierge:** a 32 px circle with a gold hairline ring and a small abstract mark (a Rio ridge line, a baseline and a sun/moon dot, echoing the arc of the brand logo). No face, no robot, no mascot. Exposed to assistive tech as an image named "Concierge da Ricardo Tour". **Visitor:** a 28 px neutral grey circle with a thin head-and-shoulders line glyph, decorative (the visible "Você" label carries the meaning). Both are inline SVG, no image files |
| 2 | Intro | Title "Vamos descobrir o Rio?" and a welcome spoken by the Concierge itself, with its avatar: "Olá! Sou o Concierge da Ricardo Tour, um assistente de IA. Me conta: é a sua primeira vez no Rio ou você já sabe o que quer conhecer? Eu sugiro passeios para você começar." The institutional pitch is gone; the AI nature is stated in the first line and the full RT-70 disclosure remains below the prompts |
| 3 | Quick start | Exactly your three prompts as discreet outlined pills: "É minha primeira vez no Rio", "Quero conhecer o Cristo", "Quais passeios vocês recomendam?" (a test proves none trips a dynamic-data gate) |
| 4 | Recommendation cards | Compact horizontal cards under the Concierge's text, label "Passeios sugeridos": real photo, tour name, short approved summary, CTA "Ver passeio →" opening the public tour page. See "Card data" below |
| 5 | Hierarchy | Four registers: informational answer (avatar + plain text) < recommended experiences (cards) < human handoff (gold-edged, framed action card, the strongest block) < system notices for degraded/limit (dashed amber frame, label "Aviso", no Concierge avatar or name) |
| 6 | Mobile | Header compacts after the first message (eyebrow removed, 21–24 px title, team button 36 px instead of 44 px): the header measured about 103 px on mobile in these captures versus about 155 px in round 1, and the conversation area measured about 68% of the sheet height (one-off measurements from the screenshots, not a CSS guarantee); tighter paddings, 88 px card photos; a new Concierge answer scrolls to its first line so tall card lists are read from the top (status changes such as the end of a rate-limit countdown never move the scroll position) |
| 7 | Composer | Placeholder shortened to "Pergunte sobre o Rio…", one-line field that grows with its content, send button now reads "Enviar →" (visible word plus arrow, accessible name "Enviar mensagem", clear disabled state) |

## Card data (nothing invented)

A closed allow-list of the four published tours (`lib/ai-concierge/ui/tours.ts`). Title and page path come from the approved catalog snapshots; the summary is a **verbatim, self-contained sentence or clause** of the approved snapshot description (a test enforces it); the photo is the image configured for that published trip in the launch data (`data/real-trips.json`), a test enforces it too. **No price, duration, schedule or availability exists in the data or the cards**; the card block ends with "Preços, datas e vagas ficam na página do passeio ou com a equipe." In the future endpoint, a card appears only for a grounded answer that **names the tour** (retrieved sources alone are not a recommendation: they are all the evidence the search returned) and whose retrieved sources include that catalog entry (`public-tour-catalog:<id>:pt`), mapped to allow-listed ids; the browser never receives source ids, versions or chunk ids.

## Screenshots (round-2)

| # | Desktop | Mobile | What to judge |
| --- | --- | --- | --- |
| 01 | `desktop/01-closed.png` | `mobile/01-closed.png` | Closed entry tab / pill |
| 02 | `desktop/02-open-empty.png` | `mobile/02-open-empty.png` | New welcome, avatar, quick-start pills, disclosure, composer |
| 03 | `desktop/03-active-conversation.png` | `mobile/03-active-conversation.png` | Visitor avatar and bubble, Concierge answer, compact header, AI strip |
| 04 | `desktop/04-tour-recommendation.png` | `mobile/04-tour-recommendation.png` | Recommendation cards (real photos, summaries, CTA) |
| 05 | `desktop/05-whatsapp-handoff.png` | `mobile/05-whatsapp-handoff.png` | Human handoff as the strongest block |
| 06 | `desktop/06-price-handoff.png` | `mobile/06-price-handoff.png` | Price question: no price in chat, hand-over |
| 07 | `desktop/07-error-degraded.png` | `mobile/07-error-degraded.png` | System notice register (dashed amber, "Aviso"), retry |
| 08 | `desktop/08-rate-limited.png` | `mobile/08-rate-limited.png` | Rate-limit notice and countdown |

## Checks on the rendered DOM (both viewports)

Labelled dialog, announced log region, labelled composer, 0 text elements under 12 px, no horizontal scroll, Escape returns focus to the entry tab, composer inside the viewport, no content clipped horizontally at the top or bottom scroll position of the conversation, all 3 card photos loaded, 0 console errors. This is a DOM check, not a screen-reader test.

## Open points for your decision (honest observations)

1. **Source text quality in the approved catalog (needs your decision):** the Confeitaria Colombo description contains a typo ("confeitaria colombo r e") and its opening sentence reads as if the tour were about "o principal cartão-postal do Brasil"; the Cristo + Pão de Açúcar description claims "ingressos inclusos". The independent review pointed out that cutting the Colombo sentence changed its meaning, so its card now uses another clean approved sentence ("Inclui transporte confortável e acompanhamento guiado"). A better, Owner-approved one-line summary per tour would be preferable to excerpts; the catalog entries themselves should be reviewed.
2. **Photos and alt texts:** they are the photos configured for the published trips. The Cristo + Pão de Açúcar photo shows a visitor on the Pão de Açúcar viewing deck with the bay behind, and the Tour Privado Premium photo is a historic church in the city centre rather than something specific to that tour. Please judge whether each photo represents its tour. The Rocinha card (fourth tour) is not shown in the lab screenshots, which list three.
3. The recommendation text is an illustrative fixture shaped by the approved recommendation policy; real wording comes from the model at integration time and is judged at RT-75.
4. Emergency, availability and legal-notice wording are still proposals.

## Not verified

Other browsers and real devices, screen readers (NVDA/VoiceOver), real network latency and image loading time on mobile data (the largest source photo is about 4.9 MB before Next.js image optimization), behaviour with the real endpoint, EN/ES (V1 is PT only).
