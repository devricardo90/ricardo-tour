# Daniela V1 — Owner review package (local only, nothing published)

## Test it yourself (real conversation, real model)
1. `npm run dev:daniela` (port 3001; set PORT to change; optionally `npm run dev:daniela -- gpt-6-luna` to try another model for this session only), wait for the first compile (about a minute), open http://localhost:3001/pt (also /en and /es) and click the **Concierge** button.
2. Uses the development OpenAI key and the Upstash test database from `.env.local`. Real limits apply (10 messages/min per IP, 20 per session). Nothing is deployed; production stays blocked by the launch guard.
3. Try: "É minha primeira vez no Rio" (cards), "Quanto custa o passeio do Cristo?" (WhatsApp with the tour in the message), "Vocês têm passeio em Búzios?" (limitation, no substitute, WhatsApp).

## Fixed-scenario lab (no model, shows loading, unavailable and limit states)
http://localhost:3001/pt/rebuild-lab/concierge-panel (also /en, /es). Privacy draft text: `/{locale}/rebuild-lab/privacy-draft`. Alert delivery check: `npm run alert:test`.

## Captures (`{pt,en,es}/{desktop,mobile}/`)
01 site with closed panel · 02 welcome · 03a loading · 03 recommendation cards · 04 price question + contextual WhatsApp · 05 tour not in catalog · 06 sourced answer · 07 lab loading state · 08 unavailable + WhatsApp fallback · 09 limit reached · 10 closed and reopened.

Status: awaiting Owner visual/functional approval. RT-75 is NOT approved.
