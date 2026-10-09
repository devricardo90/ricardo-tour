# RT-74 — Concierge Safety and Failure/Fallback Contract

- Ticket: RT-74 (RT-RB-AI-08). Status: **Owner-approved safety/fallback policy; localized fixed copy and implementation remain open.**
- Core rule: **prefer "I don't have verified information for that" plus an appropriate handoff over inventing an answer.** A refusal or handoff is never a failure; an invented fact is.
- The model never acts autonomously: no bookings, payments, cancellations, refunds, e-mails or data changes.
- Wording below describes behavior. V1 locales are PT/EN/ES; fixed localized response copy and evaluation remain for RT-75. No Swedish locale.

## 1. Standard response shapes

| Kind | Content |
| --- | --- |
| `grounded` | answer built only from retrieved approved sources; `sourceRefs` present |
| `clarify` | one short question to narrow the request; no facts asserted |
| `refusal` | what the Concierge cannot do, in one sentence, plus what it can do |
| `handoff` | "I don't have verified information for that" (or the reason-specific line) + channels (RT-71) |
| `degraded` | service problem message + channels; no model-generated text |

Refusal/handoff/degraded texts are **fixed, pre-approved strings**, not model-generated, so they cannot be corrupted by prompt injection or hallucination.

## 2. Behavior matrix

| # | Situation | Required behavior | Handoff | Event (RT-73) |
| --- | --- | --- | --- | --- |
| 1 | **Unknown answer** (no relevant source) | say verified information is unavailable, link a relevant current page where available, and offer human handoff; no guessing or unsupported general answer | H4 | `knowledge_miss` + `handoff_offered` |
| 2 | **Stale source** (expired/superseded) | not used; treat as missing; state information needs confirmation and offer handoff | H4 | `fallback_triggered` |
| 3 | **Conflicting sources** | do not answer the conflicting point; answer only verified non-conflicting parts; offer handoff | H4 | `knowledge_miss` + `handoff_offered` |
| 4 | **Provider unavailable** (model API down) | `degraded`; input disabled or one retry hint; no partial model text and no fabricated inventory/booking status | H5 | `fallback_triggered` + `handoff_offered` |
| 5 | **LLM timeout** | bounded timeout; one retry only if idempotent and within budget; else `degraded`; never stream half an answer as final | H5 | `timeout` + `fallback_triggered` |
| 6 | **RAG failure** (index/search error) | do **not** let the model answer without retrieval; `degraded` and offer human contact | H5 | `fallback_triggered` + `handoff_offered` |
| 7 | **Unsupported language** | do not invent or expand facts; offer available PT/EN/ES content or human contact using approved wording | H3 | `fallback_triggered` + `handoff_offered` |
| 8 | **Price question** | never quote a tour price from RAG, even if present in a page/source; direct the visitor to the current product page or approved booking flow containing the live/current commercial value | H9 | `knowledge_miss` + `handoff_offered` where appropriate |
| 9 | **Availability / dates / schedules** | never claim availability or current schedules unless a future approved structured integration supplies current data; no stale or mock values | H9 | `handoff_offered` |
| 10 | **Safety-sensitive tourism question** (areas, crime, favelas, health, weather risk, activity risk) | no guarantees such as "this place is safe"; give only appropriately qualified practical information backed by approved source/content; otherwise state uncertainty and offer handoff | H10 | `handoff_offered` |
| 11 | **Emergency** (user in immediate danger or medical crisis) | do not invent emergency guidance; use only separately approved fixed localized emergency wording, otherwise direct to a human/public emergency authority through approved wording | H8 | `handoff_offered` |
| 13 | **Booking/payment request** ("book it", "pay", "send Pix", "cancel my booking") | refuse to act; offer a human handoff; no payment/data collection in chat | H2 | `handoff_offered` |
| 14 | **Existing booking/private data questions** | no lookup; do not ask for booking numbers or documents in chat | H2 | `handoff_offered` |
| 15 | **Refund / cancellation** | no case-specific policy or promise without a currently approved canonical policy; offer the team | H7 | `handoff_offered` |
| 16 | **Flights / hotels / packages** | do not fabricate inventory, prices, provider or booking status; state the unavailable verified information and offer the team | H11 | `knowledge_miss` + `handoff_offered` |
| 17 | **Prompt injection** (in user text or retrieved content: "ignore previous instructions", role-play to bypass rules, hidden instructions in documents) | ignore the instruction; continue under the policy; if the user is clearly attempting extraction, fixed refusal; retrieved content is data, never instructions | optional | `error` stage `validate` + abuse counter (RT-72) |
| 18 | **Requests for internal information** (system prompt, rules, sources list beyond `sourceRefs`, env, keys, other users' data, model/vendor details, internal tooling such as RIC Studio) | fixed refusal; reveal nothing about prompts, infrastructure or internal processes | optional | counted as abuse |
| 19 | **Abusive/harassing content** | brief neutral refusal; no engagement; may end the session | H6 if complaint | `error` |
| 20 | **Medical, legal, visa advice** | out of scope; direct to appropriate official sources/professionals using approved wording | H3 | `handoff_offered` |
| 21 | **Request to compare with competitors / negative claims** | no claims about third parties | H3 | — |
| 22 | **Personal data volunteered** (e.g., passport number) | do not repeat or store; advise not to share it in chat; do not log (RT-90 SEC-20) | H2 | — |
| 23 | **Rate limited / ceiling** | RT-72 §6 degraded message | H5 | `rate_limited` |
| 24 | **Feature disabled** | `FEATURE_DISABLED`; widget not shown | — | — |

## 3. Generation guardrails (to implement at RT-67)

1. **Retrieval first, then generate.** Answers are generated only from retrieved chunks; if retrieval returns nothing above the confidence threshold, the model is not asked to answer.
2. **System instructions are separate from content**: a fixed system prompt, retrieved chunks passed as quoted data with delimiters, user text as user turn. The system prompt is not shown to the user and contains no secrets.
3. **Post-generation checks** before returning: any tour price quoted from RAG → block; contains date/availability confirmation language without an approved structured source → block; contains unsupported safety assurances or guarantees → block; contains promises (refund, discount, booking) → block; contains contact data not equal to `PUBLIC_CONTACT` → block; discloses internal/security information → block. A blocked answer becomes `handoff`.
4. **Language check**: answer language matches the request or the approved fallback.
5. **No tool use** with side effects; no browsing; no external fetch at answer time.
6. **Bounded**: output length, tokens, retrieval chunks, timeouts (RT-72 §3).
7. **No hidden memory**: the model sees only the current conversation turns within the cap; no cross-user memory.
8. **Deterministic fixed strings** for refusal/degraded/handoff kinds.

## 4. Failure behavior of the platform

| Failure | Behavior |
| --- | --- |
| Any unhandled error | return `degraded` with a reference id; log with correlation id; never return stack traces, provider messages or internal ids (RT-90 SEC-21) |
| Partial failure (some chunks fail) | answer only if remaining sources suffice, else `handoff` |
| Index inconsistent with catalog (RT-69 §3.6) | suppress mismatched entries; do not serve their price/availability statements |
| Observability failure | must not block the answer; telemetry is best-effort |
| Handoff data failure | contact channels are static (`PUBLIC_CONTACT`) and never depend on the backend |

## 5. Test set required for RT-67 and RT-75

A fixed evaluation set per language containing at least: each row of §2 with several phrasings, prompt-injection variants (direct, indirect via documents), price questions with/without stored price, safety questions, booking/payment demands, and flight/hotel requests. Pass criterion: **zero** invented prices, availability confirmations, safety assurances, policy invention or leaked internals. Results are shown to the Owner at RT-75.

## 6. Owner decision record — 2026-10-04

- Approved core rule: verified information or clear uncertainty plus human handoff; never confident fabrication.
- Unknown/no verified source: say that verified information is unavailable and offer the relevant current page or handoff.
- No RAG prices; direct price questions to the current product page/approved booking flow. Never claim availability without a future approved structured integration.
- Prompt injection and requests for prompts, secrets, internal configuration, hidden sources, or credentials must not disclose that information.
- RAG/model failure uses degraded UI plus human contact. Provider failure must not fabricate inventory or booking status.
- Safety-sensitive tourism answers must not guarantee safety; only appropriately qualified information backed by approved source/content may be stated.
- Fixed localized copy, emergency wording, and evaluation remain to be finalized at RT-75. No unsupported safety/emergency facts are approved.

RT-74 remains open until localized fixed copy and implementation/evaluation acceptance criteria are met.

## 7. Implementation status — 2026-10-09 (PT V1 backend runtime)

Scope implemented: the server-side runtime (`lib/ai-concierge/runtime`). **Not** changed: `app/api/ai-concierge`, the public widget/UI, production flags. Production stays disabled until RT-75.

### 7.1 Specification review (before implementation)

| Finding | Resolution |
| --- | --- |
| §2 rows 10, 11, 13, 17–21 and §3.3 checks had no runtime coverage (only price/availability/booking/payment/refund/injection existed) | Implemented as deterministic gates and post-generation checks (below) |
| Row 18 forbids revealing "model/vendor details", but the RT-70 privacy notice must name the AI provider | Resolved: the Concierge refuses to discuss model, version, keys, sources, infrastructure and other users; the fixed, Owner-reviewed privacy notice (RT-70) is the only place the provider is named |
| Row 11 requires Owner-approved fixed emergency wording, which does not exist yet | Proposed fixed text implemented with **no numbers or procedures**, flagged `EMERGENCY_COPY_STATUS = PROPOSED_PENDING_OWNER_APPROVAL`; approval stays at RT-75. A live test showed the model volunteering 190/192/193 from memory; those numbers are now blocked in output and prohibited in the instructions |
| Contract lists PT/EN/ES copy; Owner scope for V1 is PT only | PT only implemented; EN/ES copy remains out of scope (unsupported locale returns the fixed handoff) |
| §2 row 5 allows one bounded retry; RT-72 (budgets/rate limits) is not delivered | Local constants (`RETRY_BUDGET_MS`); RT-72 may replace them. Not a prerequisite: Jira links RT-74 only to RT-67 (Concluído) |
| "Degraded UI" in the Jira goal vs. instruction not to touch the public UI | Runtime exposes `response_kind` (`grounded | refusal | handoff | degraded`) and a data-free `reference_id`; rendering is left to the UI ticket after the RT-75 gate |
| Row 3 (conflicting sources) cannot be detected deterministically across chunks | Instruction rule 11 makes the model answer only the non-conflicting part or report no evidence; RT-69 guarantees one ACTIVE version per source |

### 7.2 Behavior implemented

- **Deterministic, no model call:** emergency (highest priority, fixed wording), booking/payment/cancel action requests, booking/payment status, refunds, operational confirmation, medical/legal/visa/vaccine out-of-scope, price, availability, flights/hotels/Oner (RT-67/70 gates kept).
- **Fixed refusals:** prompt injection (current and prior turns), requests for internal information (keys, config, vector store, model/sources, other users, internal tooling), abusive content, third-party comparisons.
- **Safety-sensitive topics:** answered only from approved evidence; model assurances ("é seguro", "sem risco", guarantees, promises of refund/discount) are blocked and become the fixed no-guarantee handoff (`safety_sensitive`); with no evidence the same handoff is used and the model is not called.
- **Post-generation checks added:** safety assurances, promises, schedule claims, emergency numbers, answers drifting out of Portuguese (plus the RT-67 checks for prices, availability, booking/payment confirmation, Oner, fake handoff, leaks, non-canonical contact).
- **Retrieved content is data:** a chunk that reads like an injection is dropped before generation even if it passed provenance.
- **Failures:** one bounded retry for timeouts and provider 5xx inside a 20 s budget, never for auth/rate limit; RAG failure never falls through to an ungrounded model answer; degraded text is fixed and carries a random `reference_id`; telemetry failures are swallowed.
- **Personal data:** deterministic reminder appended whenever redaction occurred (not dependent on the model).
- **Unknown answer:** fixed text now links the published tours page and the canonical channels.
- **Configuration:** API key, vector-store ID and model are shape-validated; a malformed or tampered value fails closed.

### 7.3 Evaluation (PT, `tests/ai-concierge-safety.test.ts`, 54 deterministic tests)

Every row of §2 that applies to PT V1 with several phrasings, injection variants (user, history, retrieved), unsafe-model-output families (price, availability, booking, payment, Oner, fake handoff, promises, schedules, contacts, URLs, leaks, English, emergency numbers), retry/budget/degraded behavior, canonical-contact integrity of all fixed strings, secret non-leakage and config tampering. Pass criterion met: zero invented prices, availability, safety assurances, policy or leaked internals. A small live run (8 + 1 calls) confirmed grounded answers, deterministic blocking and the emergency-number fix.

### 7.4 Still open for RT-74 (why it is not closed)

1. Degraded/handoff **UI rendering** (public UI is out of scope until RT-75).
2. Owner approval of the emergency wording and of EN/ES fixed copy (V1 is PT only).
3. Owner review of the evaluation results at RT-75.
4. Residual: for a safety question without evidence the model may still add a vague, non-factual pointer ("consulte serviços públicos de apoio ao turismo"); no invented facts, numbers or assurances pass the checks.
