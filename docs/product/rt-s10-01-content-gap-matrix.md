# RT-111 [RT-RB-S10-01] — Content gap matrix of the four tours

- Date: 2026-10-16. Sprint 10 (Jira id 177, active since 16/10). Source of truth: Volume II §5 (Sprint 10), §11 (14/10: catalog frozen at the four authorized tours); Owner Terms draft v0.3 §4/T8 (`docs/legal/owner-drafts/terms-of-use-v0.3.md`).
- **Read-only audit.** Nothing was changed in production, the hosted database was not read, no price was touched. No value below was filled by the agent: every cell cites its source, and missing information is marked as missing.
- Reproducible check: `node scripts/rt-111-verify-matrix.mjs` re-reads production (public pages + `/api/trips`) and asserts every quoted production value (see §6).

## 1. Sources and how they relate
| Code | Source | What it is | Trust |
|---|---|---|---|
| **P** | Production public pages `/{pt,en,es}/tours/<id>` and `GET /api/trips` (read 16/10) | What visitors see today | Authoritative for "what is published" |
| **J** | JSON-LD `TouristTrip` on each tour page (production) | Structured data sent to search engines | Mirrors P |
| **R** | `data/real-trips.json` | Source file the production rows were created from (`scripts/rt-57-production-launch-trips.mjs`, RT-57) | Identical to P for every field below |
| **D** | Schema defaults applied by RT-57 (`childrenAllowed=true`, `physicalLevel=LIGHT`, `durationDays=1`, `maxGuests=null`) | **Defaults, not decisions** (script comment, line 70); confirmed on the local dev DB copy | Not confirmed |
| **C** | `knowledge/concierge/catalog/approved-tour-cards.json` (Daniela catalog, v2026-10-11.1) | PT summary = verbatim excerpt approved via RT-53/RT-69; EN/ES summaries and image alt texts exist, **no recorded approval** | PT approved; EN/ES unapproved input |
| **O** | Owner decisions recorded in Jira/Volume II (RT-53 launch gate, RT-79, RT-99) | Owner attestations | Confirmed |

Lineage note: `real-trips.json` keeps a legacy `matchByTitlePt` per tour (Premium ← "Tour centro do Rio"; Colombo ← "Passeio Confeitaria Colombo"; Rocinha ← "Tour Favela"; **Cristo + Pão de Açúcar ← "Rio Escadaria selarao"**), i.e. the four products were renamed/re-targeted from older records. Confirms that the current content was assembled, not written from an operational brief.

## 2. Cross-cutting facts (all four tours)
| Field | State | Source |
|---|---|---|
| Languages of the content | **EN and ES pages show the Portuguese title, description, highlights and inclusions**; only the labels are translated. `/api/trips` returns the same Portuguese text under `en`, `es` and `sv` | P |
| Availability | "As datas são combinadas diretamente com a equipe." No schedules exist (0 `TripSchedule` rows) | P; local DB |
| Price display | "Preço por pessoa", BRL; JSON-LD `Offer.priceCurrency = BRL` | P, J |
| Operator | `UNCLASSIFIED` (not shown). RT-99: "permanecem sem classificação operacional definitiva até confirmação do Owner" | O |
| Children / physical level / group size | `childrenAllowed=true`, `physicalLevel=LIGHT`, `maxGuests=null` are **defaults**, not shown on the page | D |
| Meeting point, start time, languages offered, participation requirements, accessibility, weather rule, cancellation conditions | **Absent everywhere** (P, R, C) | — |
| Gallery | One photo per tour (model has a single `imageUrl`) | P; schema |
| Photo rights | Authorship of the 4 photos and consent of the people shown: declared by the Owner (RT-79, 14–15/10) | O |
| Booking flow | Guest request (protected by the public gate). Account booking API: RT-110 (open, High) | code; Jira |

## 3. Matrix per tour
Legend: ✅ confirmed (published and approved at the RT-53 launch gate or attested by the Owner) · ⚠️ published but conflicting/doubtful · ❌ missing · 🔸 default, not a decision.

### 3.1 Cristo Redentor + Pão de Açúcar — `cmlhxkpy9000028zq27rhytew`
| Field | Current value | Source | Status |
|---|---|---|---|
| Title | Cristo Redentor + Pão de Açúcar | P, R | ✅ |
| Description | "Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos." | P, R, C (PT) | ✅ (PT only) |
| Duration | 5–6 horas | P, R | ✅ |
| Category | Passeio Clássico | P, R | ✅ |
| Highlights | Cristo Redentor · Bondinho do Pão de Açúcar · Vista da Baía de Guanabara | P, R | ✅ |
| Included | Transporte em van · Guia turístico · Ingresso Cristo Redentor · Ingresso Pão de Açúcar | P, R | ⚠️ confirm that **both tickets are included in R$ 385** (commercial) |
| Not included | Alimentação | P, R | ✅ |
| Price | R$ 385,00 per person | P, J, R | ✅ published (any change only by Owner) |
| Photo | `imagem-pao-de-acucar.jpg` | P | ✅ rights attested |
| Itinerary / meeting point / time / languages / requirements / accessibility | — | — | ❌ |
| Age / physical level | childrenAllowed=true, LIGHT | D | 🔸 |
| Operator | UNCLASSIFIED | O | ❌ decision |

### 3.2 Tour Favela Rocinha com Guia Local — `cmli1a6im000034zqqzc9sppb`
| Field | Current value | Source | Status |
|---|---|---|---|
| Title | Tour Favela Rocinha com Guia Local | P, R | ✅ |
| Description | "Conheça a cultura local da maior favela do Brasil com guia especializado e experiência guiada na Rocinha." | P, R, C | ⚠️ "maior favela do Brasil" is a factual claim with **no recorded source**; Volume I/II forbid unsupported claims → verify or reword (Owner) |
| Duration | 3–4 horas | P, R | ✅ |
| Category | Experiência Cultural | P, R | ✅ |
| Highlights | Vista panorâmica da Rocinha · Interação com comunidade local · Cultura e história | P, R | ✅ |
| Included | Guia local · Transporte · Passeio guiado | P, R | ⚠️ "Guia local": is the guide from the community (a partner) or Ricardo Tour? Ties to the operator decision |
| Not included | Alimentação | P, R | ✅ |
| Price | R$ 120,00 per person | P, J, R | ✅ published |
| Photo | `imagem-tour-favela-rocinha.jpg` (people walking; mural "@wark rocinha") | P | ✅ rights + consent attested. Catalog alt text "Vista da Rocinha" does not describe the photo (C) — fix in RT-116 |
| Itinerary / meeting point / time / languages / requirements / accessibility | — | — | ❌ |
| Age / physical level | childrenAllowed=true, LIGHT | D | 🔸 (a walking tour with stairs: LIGHT is unverified) |
| Operator | UNCLASSIFIED | O | ❌ decision |

### 3.3 Confeitaria Colombo + City Tour Rio — `cmlibniq40000z4zqkbujnutt`
| Field | Current value | Source | Status |
|---|---|---|---|
| Title | Confeitaria Colombo + City Tour Rio | P, R | ✅ |
| Description | "Explore o principal cartão-postal do Brasil com visita a confeitaria colombo r e passeio pelos pontos históricos do Rio de Janeiro. Inclui transporte confortável e acompanhamento guiado." | P, R | ⚠️ **conflict**: "principal cartão-postal do Brasil" describes Christ the Redeemer, not a historic-centre tour; typo "colombo r"; the approved Concierge summary uses only "passeio pelos pontos históricos do Rio de Janeiro" (C) |
| Duration | 5 horas | P, R | ✅ |
| Category | City Tour | P, R | ✅ |
| Highlights | **Cristo Redentor** · Vista panorâmica da cidade · Centro histórico · **Guia bilíngue** | P, R | ⚠️ **conflict**: is Christ the Redeemer part of this tour? "Guia bilíngue": which languages? |
| Included | Transporte ida e volta · Guia turístico · Paradas para fotos | P, R | ✅ |
| Not included | Alimentação · **Ingresso opcional trem ou van** | P, R | ⚠️ **conflict**: the "trem ou van" ticket is the access to Corcovado (Christ); only consistent if the Christ visit is part of the tour. Is the Colombo snack/meal included or not ("Alimentação" excluded)? |
| Price | R$ 245,00 per person | P, J, R | ✅ published |
| Photo | `confeitaria-colombo-city-tour.jpeg` (6002×8002, 4.8 MB master) | P | ✅ rights attested; heavy master (optimize in RT-116) |
| Itinerary / meeting point / time / languages / requirements / accessibility | — | — | ❌ |
| Age / physical level | childrenAllowed=true, LIGHT | D | 🔸 |
| Operator | UNCLASSIFIED | O | ❌ decision |

### 3.4 Tour Privado Premium Rio de Janeiro — `cmljo0s1u0000t0zqa0bpd23p`
| Field | Current value | Source | Status |
|---|---|---|---|
| Title | **Tour Privado** Premium Rio de Janeiro | P, R | ⚠️ naming: Owner/Volume/Jira texts say "Tour **Privativo** Premium"; choose one |
| Description | "Experiência exclusiva e personalizada pelos principais pontos do Rio com guia privado e veículo confortável." | P, R, C | ✅ (PT only) |
| Duration | 8 horas | P, R | ✅ |
| Category | Premium | P, R | ✅ |
| Highlights | Roteiro personalizado · Cristo Redentor · Pão de Açúcar · Santa Teresa · Escadaria Selarón | P, R | ✅ (as examples of a custom route) |
| Included | Guia privado · Transporte executivo · Flexibilidade total de roteiro | P, R | ✅ |
| Not included | Ingressos · Alimentação | P, R | ✅ |
| Price | R$ 900,00 **per person** | P, J, R | ⚠️ a **private** tour priced "por pessoa": confirm whether it is per person or per group, and the group size limit (commercial) |
| Photo | `imagem-igreja-centro-rio.jpg` | P | ⚠️ Owner considers it inadequate → **pending replacement** (RT-116) |
| Itinerary / meeting point / time / languages / requirements / accessibility | — (custom by design) | — | ❌ needs at least pickup rule, start-time window, languages, max group |
| Age / physical level | childrenAllowed=true, LIGHT | D | 🔸 |
| Operator | UNCLASSIFIED | O | ❌ decision |

## 4. Summary of conflicts (need an Owner answer, nothing changed)
1. **Colombo tour includes Christ the Redeemer or not?** Description ("cartão-postal"), highlight "Cristo Redentor" and exclusion "trem ou van" only make sense with a Corcovado visit; the title and the approved summary describe a historic-centre tour.
2. **"Guia bilíngue"** (Colombo): which languages; and which languages for every tour.
3. **Premium price unit**: R$ 900 per person or per group; maximum group size.
4. **Cristo + Pão de Açúcar**: both entrance tickets included in R$ 385.
5. **Rocinha "maior favela do Brasil"**: unsupported claim → source or reword.
6. **"Tour Privado" vs "Tour Privativo"**: official name.
7. **Rocinha "Guia local"**: who guides (ties to the operator decision).
8. Typo "colombo r" (Colombo description) — editorial fix once the description is rewritten.

## 5. Missing for every tour (Volume II §5 / Terms v0.3 §4)
Itinerary · meeting point/pickup · start time(s) · languages offered · participation requirements (age, physical level, mobility) · confirmed accessibility · weather rule · operator · cancellation summary (RT-81) · EN/ES content · gallery photos. Defaults `childrenAllowed`/`LIGHT`/no group limit must be confirmed or replaced.

## 6. Verification
`scripts/rt-111-verify-matrix.mjs` fetches production read-only and asserts, for each tour: title, duration, category, price, image file, each highlight/inclusion/exclusion quoted above, the conflicting strings of §4, and that the EN/ES pages contain the Portuguese description. Result recorded in Jira (RT-111).
