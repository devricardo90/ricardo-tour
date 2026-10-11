# Concierge panel — final minor changes (ROUND 3, RT-71 / RT-74)

**Status: PROVISIONALLY APPROVED by the Owner on 2026-10-11 for this isolated prototype only (see `docs/architecture/rt-71-74-concierge-panel-ui.md` §5). This is NOT a public activation, public mount, endpoint-integration approval or production readiness.** The panel is still the isolated, production-hidden prototype (`/pt/rebuild-lab/concierge-panel`): no public mount, no endpoint, no model. Rounds 1 and 2 are kept in `../desktop`, `../mobile` and `../round-2`.

Captured 2026-10-11 from the local dev server, desktop 1280×800 and mobile 390×844. The black round "N" in the lower-left corner is the Next.js development overlay. Only the two requested changes were made.

## 1. The name: Daniela

| Where | Text |
| --- | --- |
| Header title (also the dialog's accessible name) | **Daniela**, with the eyebrow "Concierge · Ricardo Tour" |
| Opening line of the welcome | "Olá! Eu sou a Daniela, a assistente de IA da Ricardo Tour: uma inteligência artificial, não uma pessoa da equipe." |
| Label above each answer | "Daniela · IA" |
| Avatar accessible name | "Daniela, assistente de IA da Ricardo Tour (ilustração)" |
| Entry button accessible name | "Abrir o Concierge da Ricardo Tour: Daniela, assistente de IA" (the closed tab keeps the visual label "Concierge · IA") |

## 2. The avatar

An **editorial vector illustration** (inline SVG, flat colours with a few tonal layers; not a photograph, not a cartoon, no mascot): a woman with long blonde hair and green eyes, fair warm skin typical of southern Brazil, a slim face, a dark tailored top with a gold neckline edge, small gold earrings, inside the brand's gold hairline ring. The crop is tight on head and shoulders so the green eyes read at 32 px. Close-up: `round-3/desktop/00-daniela-portrait-closeup.png`. Sizes: 56 px in the welcome (with an explicit gold "IA" badge on its corner), 44 px in the header (32 px once the conversation starts), 32 px beside answers.

It was drawn for this prototype. It is a **placeholder portrait for the Owner to accept or replace** with a commissioned illustration or photograph of a model with the proper rights; using a real person's photo or an AI-generated photographic face would raise consent and provenance questions, so none was used.

## 3. Transparency stays explicit (and nothing implies a live human)

- Daniela's first words state she is an AI and not a team member; the full RT-70 disclosure remains in the welcome; the compact strip "Assistente de IA: pode errar e não confirma preços, reservas ou pagamentos." stays visible after the first message; the header keeps the "Assistente de IA" tag.
- The large portrait carries a visible "IA" badge; every answer is labelled "Daniela · IA"; the portrait is announced as an illustration.
- No wording or UI claims a human is replying live ("online agora", "atendente", typing-as-a-person): a test checks this. The human path stays separate and explicit ("Falar com a equipe" → WhatsApp/e-mail, nothing sent automatically).

## Screenshots

`round-3/desktop/` and `round-3/mobile/`: 01-closed, 02-open-empty (new header, welcome, IA badge), 03-active-conversation, 04-tour-recommendation, 05-whatsapp-handoff, 06-price-handoff, 07-error-degraded, 08-rate-limited. DOM checks on both viewports passed as before (labelled dialog, live log, 0 text under 12 px, no horizontal scroll, focus returns on Escape, no clipping, 0 console errors).

## Still open (not part of these two changes)

1. **Persona in the real runtime:** the approved policy and generation instructions do not name the assistant yet. Before integration, the runtime must introduce itself as Daniela consistently, never claim to be human, and keep the handoff texts coherent (e.g. "Eu não transfiro conversas…"). That is runtime/policy work under the RT-75 gate, not UI.
2. Legal approval of the notice texts (RT-70), emergency and availability wording, the catalog wording points raised in round 2, the RT-75 gate and endpoint integration.
3. Not verified: other browsers/devices, screen readers (NVDA/VoiceOver), EN/ES (V1 is PT only).
