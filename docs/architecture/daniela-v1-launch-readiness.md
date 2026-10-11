# Daniela AI Concierge V1 — scope, evidence and launch readiness (2026-10-11)

Owner decision (2026-10-11): prioritize finishing and launching the commercial MVP; no deep refinement of the Concierge now. Daniela must work correctly at the basics, recommend tours and send the visitor to WhatsApp whenever she cannot help. Mandatory security, privacy, infrastructure and legal-approval requirements are **not** optional refinements. **The Concierge is not activated and is not public**: the endpoint and the mount exist but are off by default and blocked in production by code until every mandatory criterion is met (section 4).

Future quality work is ticketed separately and does not block V1: **RT-95 "AI Concierge — Revisão de Qualidade V2"** (BACKLOG).

## 1. V1 scope vs what exists

| # | V1 requirement | How it is met | Evidence |
| --- | --- | --- | --- |
| 1 | Daniela identifies herself as the AI assistant of Ricardo Tour | Fixed identity answer (no model), persona rules in the instructions, `human_claim` post-check, "Daniela · IA" labels, IA badge, disclosure texts in 3 languages | `tests/ai-concierge-persona.test.ts`, `ai-concierge-v1.test.ts`, evaluation I01–I04, P01–P05 |
| 2 | Understands basic questions in PT, EN and ES | Language detected from the message (page locale as fallback); gates, fixed texts, post-checks, panel UI and model instruction in 3 languages | `ai-concierge-v1.test.ts` (language detection, gates), `ai-concierge-panel-i18n.test.tsx`, evaluation M01–M18, Q01–Q06 |
| 3 | Recommends 1 to 3 relevant experiences using only the approved catalog | **Deterministic** selection from a closed allow-list of the 4 published tours (keywords in 3 languages; classics by default; Rocinha only when asked). The model never recommends, so nothing outside the catalog can be offered | `selectRecommendations`, evaluation V01–V09 (always 1–3 ids, all in the allow-list, no model call) |
| 4 | Answers simple questions about tours using only the sources | Existing retrieval (RT-69 hosted store, provenance-validated) + generation, now answering in the visitor's language; anything unsupported fails closed to the team | evaluation G01–G10, Q01–Q10 (live) |
| 5 | Never invents prices, availability, inclusions (tickets) or commercial conditions | Price/availability gates; **commercial-terms gate** (what is included, payment methods, fees, cancellation → team); post-check blocks any "included/inclui/incluye" claim, currency, availability, confirmations, promises; model instructed accordingly | evaluation M01–M12, global forbidden patterns; live answers re-read |
| 6 | No reliable answer → say so naturally and offer a human | Fixed "I don't have enough confirmed information" texts in 3 languages + WhatsApp/e-mail; direct **safety questions** also go to the team without the model | evaluation G08, G09, Q05–Q10, S01–S03 |
| 7 | Handoff via the official WhatsApp +55 22 99846-1906 | Only `PUBLIC_CONTACT` values; WhatsApp first | `ai-concierge-handoff.test.ts`, V1 tests |
| 8 | Simple WhatsApp access with a contextual message about the tour of interest, without history or unnecessary personal data | Prefill built from a closed set: handoff code + language + an allow-listed approved tour (named in the message, in the visitor's language). Cards have a per-tour "Ask on WhatsApp" link. Never the conversation, free text, ids or personal data | `ai-concierge-v1.test.ts` (closed prefill, forged ids ignored, PII never carried), evaluation W01–W04 |
| 9 | Keep: session privacy, no permanent memory, no persistence, transparent AI identity, kill switch, essential protections | Unchanged and re-tested: client-held bounded history, redaction, no storage in the panel/mount, kill switch (`AI_CONCIERGE_KILL_SWITCH`), shared limiter fail-closed, same-origin/JSON/size guards on the endpoint, no-store responses, bodies never logged | `ai-concierge-launch.test.ts`, RT-70/72/73/74 suites |

## 2. What was added for V1 (and the decisions behind it)

- **Languages:** `runtime/lang.ts` (detection), `gate-terms.ts` (EN/ES gate vocabulary OR-ed with the PT patterns; bias: when in doubt, send to the team), lang-aware `messages.ts`, `handoff.ts`, `postcheck.ts`, `buildInstructions(lang)`, panel copy and disclosure/privacy texts in PT/EN/ES.
- **Recommendation gate** (deterministic) and **tour context** for WhatsApp: `ui/tours.ts` (allow-list, keywords, EN/ES summaries translated from the approved Portuguese excerpts; product names stay as published).
- **Commercial terms:** new handoff reason `commercial_terms` (H9) and a post-check that blocks any "included" claim. This is stricter than before on purpose: the Owner named "ingressos inclusos" as forbidden, and a model answer such as "o passeio inclui transporte e acesso" was found in the live evaluation and is now blocked.
- **Safety questions** no longer reach the model: no approved source supports an answer, so the team answers (RT-74 tests updated to the new behavior).
- **Endpoint** `POST /api/ai-concierge` (real runtime; replaces the old mock route) and `POST /api/ai-concierge/events` (RT-73 `concierge_opened` / `handoff_clicked`, strict schema); **mount** `ConciergeMount` rendered by the site layout only when `isConciergeEnabled()`; the legacy mock widget is no longer mounted anywhere.
- **Launch guard** `lib/ai-concierge/launch.ts` (section 4).

## 3. Evidence (2026-10-11)

- Tests: full suite green (tsc, ESLint, Vitest, `npm run build`); the V1 suites are `ai-concierge-v1`, `ai-concierge-launch`, `ai-concierge-panel-i18n`, `ai-concierge-persona`, `ai-concierge-evaluation`.
- **Evaluation set** (`knowledge/concierge/evaluation/rt-75-evaluation-set-pt.json`, version `2026-10-11.2-v1`, 84 synthetic cases in PT/EN/ES): offline 59/59 deterministic cases with zero provider calls; **live 84/84** (real runtime, development model `gpt-4.1-mini`, `store: false`, 32 provider calls, about 44k input / 0.6k output tokens, about US$0.02 in total). Results: `docs/architecture/rt-75-evidence/`.
- **Browser evidence** (lab, no model): `docs/baseline/concierge-v1/{pt,en,es}/{desktop,mobile}/` — welcome, recommendation cards with the contextual WhatsApp link, price question with contextual WhatsApp handoff, unknown question with handoff.
- Live answers were read, not only counted. Behaviors observed on the development model: grounded answers in the visitor's language; "inclui…" and "experiência personalizada" answers were blocked by the new checks (they fell back to the WhatsApp offer); safety, price, availability and booking questions never reached the model.

## 4. Launch guard (code-level)

`getConciergeLaunchStatus()` returns `enabled` and a list of `blockers`. Everywhere: `AI_CONCIERGE_ENABLED` must be true, the kill switch off and the OpenAI runtime configuration valid. **In production, additionally:** `AI_CONCIERGE_RT75_GATE_APPROVED` (the Owner gate), `CONCIERGE_PRIVACY.legal_review === "APPROVED"` (a code constant that changes only through an Owner/legal-approved commit), `EMERGENCY_COPY_STATUS === "APPROVED"` (same), the shared limiter configured (Upstash URL/token + `RATE_LIMIT_HMAC_SECRET`) and Owner-approved quotas (`AI_CONCIERGE_RATE_LIMITS`). Today production is blocked by `legal_review_pending`, `emergency_wording_not_approved` and the unset environment; a test pins this.

## 5. What is missing to launch V1 (mandatory, not refinements)

| Ticket | Missing | Who |
| --- | --- | --- |
| RT-70 | Legal approval of the AI disclosure and privacy notice in PT/EN/ES (EN/ES are proposed translations); Privacy page text (RT-80); subprocessor/transfer review | **Owner / legal** |
| RT-71 | Owner approval of the emergency/availability wording and of the WhatsApp message wording in 3 languages | **Owner** |
| RT-72 / RT-82 | Production Upstash database (free plan, no card) + env vars; Owner-approved quotas; **commercial hosting decision** (Vercel Hobby is not approved for commercial use) | **Owner** decides; provisioning can then be done with the Owner's account/authorization |
| RT-73 | Where events/logs live (Hobby keeps runtime logs about one hour) and who is alerted; budget ceiling | **Owner** |
| RT-74 | Emergency wording approval (EN/ES proposed); everything else is done | **Owner** |
| RT-75 | Owner gate review of this evidence and a live sample; final model choice (the development model is a placeholder) and re-run of the evaluation on it; then set `AI_CONCIERGE_RT75_GATE_APPROVED` | **Owner** |

## 6. What can be resolved automatically (once the Owner decides)

Flipping the two code constants after approval; adding the approved legal texts; production provisioning and env configuration when the Owner authorizes the accounts; re-running the evaluation on the final model; per-answer source traces if requested (V2 otherwise). Quota proposal for approval (not applied): per IP 10 messages/minute, global 1,000/day (the per-session rule exists in the limiter but the V1 mount does not send a session id, so it is not enforced yet; the request schema is closed on purpose); at the measured development-model cost (about US$0.0012 per model-bound answer, less for gate/recommendation answers) the worst case is about US$1.2/day.

## 6b. Independent review of V1 (2026-10-11): verdict APPROVE WITH FIXES, all fixed

A separate agent reproduced 11 defects with probes; the fixes are covered by `tests/ai-concierge-v1-review.test.ts` (131 cases): (1) inclusion claims restated without the word "included" (any ticket/entrance noun is now blocked); (2) English/Spanish post-checks were weaker than Portuguese (currency, schedules, safety, payment methods, availability, booking, human-team claims, fake handoff: parity added); (3) **the fixed commercial-terms answer, sent back as history, made every later message INVALID_INPUT**: the history check now accepts exactly the runtime's own fixed texts (and still rejects forged turns); (4) injection false positives ("tell me the rules for kids", "act as a translator") that also poisoned the session: tightened, real injections still detected; (5) language detection on short urgent messages ("I need a doctor" on the Portuguese page); (6) EN/ES emergency phrasings ("I was robbed", "I'm injured", "me siento mal"); (7) booking and payment intents ("I'd like to book", "gostaria de reservar", "paguei e não recebi"); (8) over-eager canned answers ("is there a place to eat?", "available in English?") and recommendation cards hijacking detail questions ("what time does it start?"); (9) the per-session quota is not enforced (doc corrected above); (11) card photo alt text now localized. Not changed: no code check for the RT-73 destination and the RT-74 visual gate beyond the single Owner gate variable (a documented limit), and "recommend a tour to Búzios" offers the default classics without saying Búzios is not in the catalog (V2).

## 7. Known limits (not hidden)

- Cards and EN/ES summaries are translations of approved Portuguese excerpts; tour names are not translated. Owner review of the translations is part of the visual/legal sign-off.
- The approved catalog still contains the claim "ingressos inclusos" and a typo in the Colombo description; the source text is not edited. A generated answer that mentions tickets, entrances or anything "included" is blocked by the post-check (any ticket/entrance noun, any include/inclui/incluye form), and the cards use clean excerpts. This was found to be bypassable by the first review ("comes with transport and tickets") and fixed; it remains a deny-list on the model's output, so removing the claim from the approved source is still the right long-term fix (Owner content decision). Fixing the source is an Owner content decision.
- "Como funciona o passeio…" style questions that make the model mention inclusions end as a WhatsApp offer (fail closed): less helpful, deliberately safe for V1; V2 (RT-95) can improve it.
- Language detection is heuristic (stop words); very short messages fall back to the page language.
- Not verified: other browsers/devices, screen readers, the final model, production latency and region, real quota exhaustion, legal sufficiency of any text.
