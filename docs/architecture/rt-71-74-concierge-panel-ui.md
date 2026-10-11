# RT-71 / RT-74 — Concierge Side Panel (isolated UI prototype)

- Tickets: RT-71 (handoff UI states, contract §9.3) and RT-74 (degraded UI). Both stay in **Revisar**: this delivers the UI rendering criterion as an **isolated prototype**; Owner visual review and the RT-75 gate remain.
- Owner direction applied (2026-10-10): prioritize the AI Concierge experience and UI; expandable right-hand side panel on desktop, near-full-screen responsive sheet on mobile; premium, editorial, modern, accessible, Ricardo Tour identity; **no** generic chatbot/robot look; **no** public activation.
- Where it lives: `components/ai-concierge/panel/` (component, copy, CSS module), `lib/ai-concierge/ui/` (pure state, reply mapper, lab fixtures), lab route `app/[locale]/rebuild-lab/concierge-panel/` (production-hidden by the lab layout: 404 unless `REBUILD_LAB_ENABLED`, development only by default).
- Not touched: the Home, the existing `AIConciergeWidget`, any public route or layout, `app/api/ai-concierge`, `app/globals.css`, the runtime.

## 1. Design

| Aspect | Decision |
| --- | --- |
| Entry (closed) | A slim vertical editorial tab on the right edge: Cormorant "Concierge", a matte-gold ornament and "IA" — not a floating chat bubble. On mobile it becomes a gold-outlined pill at the bottom right |
| Panel (desktop) | 440 px charcoal panel sliding from the right, gold hairline edge, the page stays visible and usable (non-modal) |
| Panel (mobile) | Near-full-screen sheet (8 px from the top, rounded top corners) |
| Identity | RT-10 palette (charcoal `#0B0E11`, matte gold `#C8A86B`, bright gold focus, off-white text) and RT-11 typography (Cormorant Garamond display, Inter interface). Tokens are scoped inside the CSS module; `globals.css` is unchanged. Minimum text size 12 px; 44 px touch targets |
| Conversation | The assistant speaks as editorial text with a gold left rule (not as bubbles); the visitor's messages are quiet raised blocks. No avatar, robot icon or typing-bot imagery |
| AI disclosure | Before the first message: an "Assistente de IA" tag and the full RT-70 disclosure note. Afterwards a persistent compact strip |
| Persistent human entry | "Falar com a equipe" in the header at all times: static canonical data that works with every backend down |
| Handoff card | Title, the visible and editable suggested message (fixed text per handoff code), WhatsApp as the primary action, e-mail as secondary, and the note that nothing is sent automatically |
| Degraded | Fixed message and handoff, composer disabled, user-initiated "Tentar novamente" |
| Rate limited | Fixed message and handoff, composer disabled, live countdown from `retry_after_seconds`, re-enabled automatically; no counts or windows shown |
| Privacy | "Privacidade e uso de IA" disclosure with the RT-70 notice, visibly flagged **provisional — legal approval pending** while `legal_review` is `PENDING` |
| Motion | Short slide; fully disabled under `prefers-reduced-motion` |

## 2. Architecture and guarantees

- Pure state machine (`lib/ai-concierge/ui/state.ts`): open/close, send, reply, failed, countdown, retry, reset. The conversation exists **only in memory** (RT-70): no `localStorage`, `sessionStorage`, IndexedDB, cookies, network or tracking APIs in the panel code (enforced by a test that scans code, not comments).
- History sent per request is bounded to the runtime limits (8 turns, 1,200 characters each, 4,000 in total); a test proves it is always accepted by the real `validateRuntimeInput`.
- The browser receives only `ConciergeReply` (text, response kind, handoff offer, retry seconds, reference). `toConciergeReply` strips source ids, versions, chunk ids, error classes and refusal/invalid reasons.
- **Handoff integrity in the UI:** the offer is rebuilt from its closed code with the canonical constants. A tampered reply (other number, other URL, other prefill, unknown code) cannot change what is rendered. Only `https://www.ricardotour.com/…` URLs inside answers become links.
- Transport is injected. The lab uses a deterministic fake that reuses the real runtime texts and handoff builder; **no API, model or network is called**. A future public integration only has to supply a transport for the gated endpoint.
- Client events follow the RT-73 contract and are handed to the host through `onEvent` (never sent by the panel): `concierge_opened` and `handoff_clicked` (channel + handoff code only). The host validates them with the existing strict schema.
- Accessibility: dialog labelled by its title, entry button with `aria-expanded`/`aria-controls`, closed panel is `inert` and `aria-hidden`, announced log region (`aria-live="polite"`), loading and notices as `role="status"`, labelled composer and send button, Enter to send / Shift+Enter for a new line, Escape closes and returns focus to the entry tab, focus moves to the composer on open, visible 3 px focus ring.

## 3. Verification (2026-10-10)

- Unit and markup tests: `tests/ai-concierge-panel-state.test.ts` (20) and `tests/ai-concierge-panel-markup.test.tsx` (14): state machine, history bounds vs. the real server validation, internal-field stripping, tamper resistance, no storage/network/hardcoded contacts, CSS invariants (12 px minimum, focus ring, reduced motion, mobile breakpoint, the button-contrast regression), and markup for every state.
- Real browser (headless Chromium via the browser-automation tool against the dev server, desktop 1280×800 and mobile 390×844, 0 console errors, 0 failed requests): closed/open states, focus on open, Escape and focus return, grounded answer, handoff (canonical WhatsApp link, `target=_blank`, both client events emitted), degraded (composer disabled, retry re-enables), rate limit countdown, near-full-screen mobile sheet without horizontal scroll.
- Defects found by the review and fixed: intro heading clipped by an auto-scroll on open; duplicated disclosure in the empty state; **handoff button text was pale gold on gold** (an un-scoped link rule) — now covered by a regression test; a harness-only horizontal overflow from the lab's event log.
- Not verified: other browsers/devices, screen-reader behaviour (NVDA/VoiceOver), real network latency, the production build behaviour under a real endpoint.

## 4. Still open

1. Owner visual review in the lab (Source of Truth: no visual task reaches production without an Owner Visual Gate).
2. Integration with the gated endpoint and the public mount point (after RT-75); EN/ES copy (V1 is PT only).
3. `handoff_clicked` / `concierge_opened` forwarding to the RT-73 sink and the persistence decision (RT-73/RT-70).
4. Owner-approved emergency wording, team availability wording and the legal approval of the notice texts.

## 5. Owner decisions and approval record

| Date | Decision |
| --- | --- |
| 2026-10-11 | Round 1 reviewed: direction promising, visual approval NOT granted; a second refinement round required. |
| 2026-10-11 | Round 2 reviewed: substantially improved; two final changes requested (the Concierge is named **Daniela**; she gets a dedicated avatar: female, blonde, green eyes, elegant, not cartoonish) with the explicit requirement that she stays identified as an AI and never implies a live human. |
| 2026-10-11 | Round 3 delivered and reviewed. **PROVISIONAL VISUAL APPROVAL GRANTED by the Owner for the isolated Concierge panel prototype.** |

**Scope of the approval (Owner's words, applied literally):** it applies to the current isolated prototype only. It does **not** mean public activation, public mount, endpoint-integration approval, production readiness, or closure of unrelated open gates. Further refinements are deferred to a later polish phase.

**Ticket impact:** RT-71 and RT-74 stay in **Revisar**. The visual criterion is provisionally satisfied; both tickets still have non-visual dependencies (RT-70 legal review, RT-72 production store, RT-73 sink, RT-75 gate, endpoint integration, emergency/availability wording). Evidence: `docs/baseline/concierge-panel-review/{round-2,round-3}/README.md`.

**Standing requirement for RT-75 and any integration (Owner, 2026-10-11):** Daniela is always explicitly identified as an AI assistant; she never implies that she is a live human team member; the runtime persona stays aligned with the approved UI. Implemented and tested in the runtime on 2026-10-11: `lib/ai-concierge/runtime/persona.ts` (single source of the name and the rules), the model instructions, the deterministic `human_claim` post-generation check, and a deterministic identity gate (fixed answer, no retrieval, no model call). The panel copy and the runtime are pinned to the same name by a test. The legal notice text (`CONCIERGE_PRIVACY.ai_disclosure`) does not name Daniela yet: it is a RT-70 legal-review text and is left unchanged until the legal review.
