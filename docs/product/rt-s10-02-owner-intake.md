# RT-112 [RT-RB-S10-02] — Owner intake for the four tours (decisions only)

- Date: 2026-10-16. Input: RT-111 matrix (`docs/product/rt-s10-01-content-gap-matrix.md`). Only questions the Owner must answer are listed; everything the site already shows correctly is pre-filled and only needs a "confirmo" (or a correction).
- **Nothing is invented.** No answer below is assumed; prices change only by explicit Owner decision. The same answers feed RT-81 (Terms) — the shared items are marked **[RT-81]** so they are answered once.

## A. General decisions (answer once, valid for all four tours)
| # | Decision | Why | Options to choose from (no default assumed) |
|---|---|---|---|
| A1 | **Operator of each tour** [RT-81 T2] | Required by the Terms and by the OWN/PARTNER model (all four are `UNCLASSIFIED`) | Ricardo Tour operates / partner operates (name) — per tour in §B |
| A2 | **Languages the guides offer** | "Guia bilíngue" appears without languages; pages are trilingual | PT · EN · ES · other — per tour if different |
| A3 | **How dates work** | Site says "datas combinadas com a equipe"; no schedules exist | keep on request / fixed days and times (list) |
| A4 | **Meeting rule** | No meeting point anywhere | hotel pickup (which areas) / fixed meeting point (address) / both |
| A5 | **Children and minimum age** [RT-81] | Current values are database defaults (children allowed, no minimum) | general rule, or per tour in §B |
| A6 | **Weather rule** [RT-81] | Not stated anywhere | what happens with rain/low visibility (reschedule / alternative / cancel) — wording approved by the Owner |
| A7 | **Official product name** | Site: "Tour **Privado** Premium"; Owner/Jira texts: "Tour **Privativo** Premium" | Privado / Privativo |
| A8 | **Prices stay as published?** | R$ 385 / 120 / 245 / 900 are live | confirm each, or give the new approved price (applied only via RT-119 with authorization) |

## B. Per tour — pre-filled from the site (confirm or correct) + open questions

### B1. Cristo Redentor + Pão de Açúcar (R$ 385 per person)
- Pre-filled (confirm): duration 5–6 h · included: van transport, tourist guide, Christ ticket, Sugarloaf ticket · not included: food · highlights: Cristo Redentor, Bondinho do Pão de Açúcar, Vista da Baía de Guanabara.
- **Open:** (1) are **both entrance tickets really included** in R$ 385? (2) itinerary order and approximate start time; (3) operator (A1); (4) physical effort (walking/stairs) and minimum age.

### B2. Tour Favela Rocinha com Guia Local (R$ 120 per person)
- Pre-filled (confirm): duration 3–4 h · included: local guide, transport, guided walk · not included: food · highlights: panoramic view of Rocinha, interaction with the local community, culture and history.
- **Open:** (1) **"maior favela do Brasil"**: give the source, or approve rewording without the superlative; (2) **who is the "guia local"** (community guide/partner or Ricardo Tour) → operator; (3) route and meeting point; (4) physical effort (stairs, slopes), accessibility and minimum age.

### B3. Confeitaria Colombo + City Tour Rio (R$ 245 per person)
- Pre-filled (confirm): duration 5 h · category City Tour · included: round-trip transport, tourist guide, photo stops · highlights: city panoramic view, historic centre.
- **Open (conflicts found by RT-111):** (1) **does this tour include Christ the Redeemer?** If **no**: remove the highlight "Cristo Redentor", the phrase "principal cartão-postal do Brasil" and the exclusion "Ingresso opcional trem ou van". If **yes**: confirm and describe the visit. (2) Is anything at **Confeitaria Colombo** included (snack/meal) or paid by the customer? (3) "Guia bilíngue": which languages (A2). (4) Stops of the historic-centre route.

### B4. Tour Privado/Privativo Premium (R$ 900)
- Pre-filled (confirm): duration 8 h · category Premium · included: private guide, executive transport, fully flexible route · not included: entrance tickets, food · example highlights: personalised route, Christ, Sugarloaf, Santa Teresa, Selarón steps.
- **Open:** (1) **R$ 900 per person or per group?** (2) maximum group size; (3) pickup rule and start-time window; (4) languages (A2); (5) **replacement photo** (RT-116; current one considered inadequate).

## C. Photos (RT-116 / RT-117)
For each tour: the cover photo and up to N gallery photos (Owner chooses N), each with author and, if people are identifiable, their consent. Plus the new Quem Somos photo.

## D. What the agent can do without waiting (no Owner decision needed)
- Fix the typo "colombo r" when the Colombo text is rewritten (after B3.1).
- Write a correct alt text for the Rocinha photo (it shows people on a stairway, not a "view").
- Prepare RT-113 (data model + gallery) on **local, mocked data** only.
- Prepare EN/ES drafts (RT-115) only **after** the PT facts above are confirmed.
