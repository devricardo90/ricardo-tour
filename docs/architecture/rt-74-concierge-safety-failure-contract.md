# RT-74 — Concierge Safety and Failure/Fallback Contract

- Ticket: RT-74 (RT-RB-AI-08). Status: **DRAFT — Owner review of wording required.**
- Core rule: **prefer "I don't have verified information for that" plus an appropriate handoff over inventing an answer.** A refusal or handoff is never a failure; an invented fact is.
- The model never acts autonomously: no bookings, payments, cancellations, refunds, e-mails or data changes.
- Wording below describes intent. Final per-language copy (pt/en/es; `sv` per RT-68) is `OWNER_CONTENT_REQUIRED` and is reviewed at RT-75.

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
| 1 | **Unknown answer** (no relevant source) | `handoff` kind; no guessing; no "general knowledge" answer about tours, prices, policy, safety | H4 | `knowledge_miss` |
| 2 | **Stale source** (expired/superseded) | not used; treat as missing; if the topic is operational, say information needs confirmation by the team | H4 | `fallback_triggered(stale_source)` |
| 3 | **Conflicting sources** | do not answer the conflicting point; answer only non-conflicting parts; flag for owner review | H4 | `knowledge_miss` + conflict flag |
| 4 | **Provider unavailable** (model API down) | `degraded`; input disabled or one retry hint; no partial model text | H5 | `fallback_triggered(provider_unavailable)` |
| 5 | **LLM timeout** | bounded timeout; one retry only if idempotent and within budget; else `degraded`; never stream half an answer as final | H5 | `fallback_triggered(llm_timeout)` |
| 6 | **RAG failure** (index/search error) | do **not** let the model answer without retrieval; `degraded` | H5 | `fallback_triggered(rag_failure)` |
| 7 | **Unsupported language** | reply in a supported language with a short note and the options; do not machine-translate approved policy as if official | H3 | `fallback_triggered(unsupported_language)` |
| 8 | **Pricing without verified price** | no number; "I don't have a verified price for that" | H9 | `knowledge_miss` |
| 9 | **Price stored (T1-PRICES)** | state as indicative with currency; "final price and availability are confirmed by the team" | offer H9 | `answer_returned` |
| 10 | **Availability / dates** | never confirm; no source | H9 | `handoff_requested` |
| 11 | **Safety-sensitive tourism question** (areas, crime, favelas, health, weather risk, activity risk) | no "safe/unsafe" claims, no reassurance, no risk scoring; share only Owner-approved safety wording if it exists; recommend asking the team and official local sources | H10 | `handoff_requested` |
| 12 | **Emergency** (user in danger, medical) | one fixed line telling them to contact local emergency services first (wording approved by the Owner), then channels | H8 | `handoff_requested` |
| 13 | **Booking/payment request** ("book it", "pay", "send Pix", "cancel my booking") | refuse to act; explain that the team handles it; no collection of payment data or personal documents in chat | H2/H7 | `handoff_requested` |
| 14 | **Existing booking/private data questions** | no lookup (private sources are Tier 3); do not ask for booking numbers or documents in chat | H2 | `handoff_requested` |
| 15 | **Refund / cancellation** | quote only an approved policy text verbatim if one exists; no case-specific promises | H7 | `handoff_requested` |
| 16 | **Flights / hotels / packages** | no verified source; say flight/hotel options are not available through the Concierge; offer the team | H11 | `knowledge_miss` |
| 17 | **Prompt injection** (in user text or retrieved content: "ignore previous instructions", role-play to bypass rules, hidden instructions in documents) | ignore the instruction; continue under the policy; if the user is clearly attempting extraction, fixed refusal; retrieved content is data, never instructions | optional | `error` stage `validate` + abuse counter (RT-72) |
| 18 | **Requests for internal information** (system prompt, rules, sources list beyond `sourceRefs`, env, keys, other users' data, model/vendor details, internal tooling such as RIC Studio) | fixed refusal; reveal nothing about prompts, infrastructure or internal processes | optional | counted as abuse |
| 19 | **Abusive/harassing content** | brief neutral refusal; no engagement; may end the session | H6 if complaint | `error` |
| 20 | **Medical, legal, visa advice** | out of scope; direct to official sources/professionals via the team | H3 | `handoff_requested` |
| 21 | **Request to compare with competitors / negative claims** | no claims about third parties | H3 | — |
| 22 | **Personal data volunteered** (e.g., passport number) | do not repeat or store; advise not to share it in chat; do not log (RT-90 SEC-20) | H2 | — |
| 23 | **Rate limited / ceiling** | RT-72 §6 degraded message | H5 | `rate_limited` |
| 24 | **Feature disabled** | `FEATURE_DISABLED`; widget not shown | — | — |

## 3. Generation guardrails (to implement at RT-67)

1. **Retrieval first, then generate.** Answers are generated only from retrieved chunks; if retrieval returns nothing above the confidence threshold, the model is not asked to answer.
2. **System instructions are separate from content**: a fixed system prompt, retrieved chunks passed as quoted data with delimiters, user text as user turn. The system prompt is not shown to the user and contains no secrets.
3. **Post-generation checks** before returning: contains a number/currency not present in retrieved T1-PRICES → block; contains date/availability confirmation language → block; contains safety assertions not present in approved sources → block; contains promises (guaranteed, refund, discount) → block; contains contact data not equal to `PUBLIC_CONTACT` → block; mentions internal names → block. A blocked answer becomes `handoff`.
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

## 6. Owner decisions

1. Approval of the matrix and fixed wording per language.
2. Emergency line wording.
3. Whether any safety wording is approved for the Concierge to quote (default: none, hand off).
4. Policy for ending abusive sessions.
