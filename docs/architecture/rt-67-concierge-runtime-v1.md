# RT-67 — AI Concierge Server-Side Runtime V1

- Ticket: RT-67 (RT-RB-AI-01). Dependency: RT-69 hosted retrieval (Concluído, commit `343dd6e`).
- Status: **backend foundation implemented and validated. Public activation is NOT part of this ticket.**
- RT-70 stays the open persistence / retention / privacy-page / legal decision ticket. RT-67 runs under the Owner-approved temporary no-persistence V1 constraint (see §6).

## 1. Pipeline

`lib/ai-concierge/runtime/run.ts` — one stateless function, `runConcierge(raw, deps, registry)`:

1. **Input validation** (`input.ts`): strict object with only `message` (≤ 800 chars, non-empty, control chars stripped) and `locale`. Any extra key — vector store, model, instructions, system, filters — is rejected (`INVALID_INPUT`), never ignored.
2. **Locale**: PT only (`pt`, `pt-BR`). Anything else → `UNSUPPORTED_LOCALE` before any provider call. EN/ES are not activated and PT knowledge is never presented as EN/ES.
3. **Prompt-injection gate** (`gates.ts`): ignore-rules / reveal-instructions / outside-knowledge / "without source" patterns → `REFUSED`, no retrieval, no model.
4. **Deterministic dynamic gates** (`gates.ts`, accent/case-insensitive), no model call:
   - `DYNAMIC_LOOKUP_REQUIRED`: price, live availability, flight inventory, hotel inventory, Oner inventory. Flights/hotels/Oner point to *Planeje sua viagem*; tour price/availability point to the current tour page or the human team.
   - `HANDOFF`: booking status / confirmation, payment status, refund decision, operational confirmation for a specific date.
5. **Hosted retrieval** (`openai.ts`): `vectorStores.search` on the RT-69 store only, with a server-fixed `locale = pt` filter, `rewrite_query: false`, at most 5 results.
6. **Provenance gate** (`provenance.ts`): every hit is reconciled against `knowledge/concierge/manifest.json`. Rejected: unknown source, stale version, RETIRED / BLOCKED / not `approved_for_rag`, wrong locale, wrong source class, wrong `source_sha256` / `normalized_sha256`, chunk text that does not match `chunk_sha256`, and `chunk_id` that does not equal `sha256(source_id, version, "pt", ordinal, chunk_sha256)`. Rejected hits are dropped before generation; the model never sees them. Hits below relevance 0.3 are dropped, and at most 4 chunks are used.
7. **Insufficient evidence**: no accepted evidence → `INSUFFICIENT_EVIDENCE` with approved channels; the model is not called and nothing is answered from model memory.
8. **Generation** (`policy.ts`, `openai.ts`): Responses API with `store: false`. `instructions` = fixed safety contract + the Owner-approved `concierge-recommendation-policy.md` (loaded from the canonical file, only markdown backslash-escapes removed; never published to retrieval). `input` = `<evidencias>` (untrusted factual context) and then `<mensagem_do_cliente>`. Retrieved or user text is never placed in `instructions`.
9. **Post-generation validation** (`postcheck.ts`): fail closed on currency amounts, availability claims, booking/payment confirmation, Oner/provider inventory, faked handoff ("já chamei um atendente"), internal leakage (hashes, provider IDs, tags), and any phone, e-mail or URL outside the canonical contact set. A failed check, or the model's `[[SEM_EVIDENCIA]]` marker, becomes `INSUFFICIENT_EVIDENCE`.

## 2. Result contract

`RuntimeResult { outcome, answer, source_ids, source_versions, chunk_ids, handoff_reason?, dynamic_reason?, error_class?, invalid_reason?, refusal_reason? }` with outcomes `ANSWER | HANDOFF | DYNAMIC_LOOKUP_REQUIRED | UNSUPPORTED_LOCALE | INSUFFICIENT_EVIDENCE | REFUSED | INVALID_INPUT | UPSTREAM_ERROR`. `answer` is the only customer-facing field; the identifier fields are internal test metadata and no hash or provider ID ever appears in `answer`.

## 3. Handoff

Texts are deterministic (`messages.ts`) and always give the canonical channels: WhatsApp `+55 22 99846-1906`, `contato@ricardotour.com` (from `lib/public-contact.ts`). The runtime never claims a transfer, a contacted employee, a reservation, or a payment state.

## 4. Configuration (server-only)

`OPENAI_API_KEY`, `OPENAI_CONCIERGE_VECTOR_STORE_ID`, `OPENAI_CONCIERGE_MODEL` (placeholders in `.env.example`; never `NEXT_PUBLIC_*`; the store ID is not in source). Missing configuration → `UPSTREAM_ERROR / config` (fail closed). The RT-69 provider mapping file stays Git-ignored.

**Model: `gpt-4.1-mini` was used for development/validation smoke only — DEVELOPMENT / VALIDATION MODEL, NOT the final production model.** No model benchmark was run; the production model is a later explicit decision. The SDK stays at `openai@7.30.0`.

## 5. Errors and observability

Provider errors are classified (`timeout | auth | rate_limit | retrieval | generation | malformed | config`) and never expose provider messages or secrets; the customer gets a safe message with the official channels. Each request emits one content-free event (`outcome`, `latency_ms`, retrieval/accepted/rejected counts, source classes, reasons, error class): no message, answer, prompt, key or identifier. No analytics vendor was added.

## 6. Privacy / retention constraint (RT-70 still open)

Stateless single-turn runtime: nothing is persisted, there is no chat-history table and no memory, every Responses call uses `store: false` (asserted by test), and nothing logs prompts or responses by default. Multi-turn session state, retention periods, consent and Privacy-page disclosure were **not** implemented because they require the RT-70 legal/product decisions.

## 7. Production boundary

`app/api/ai-concierge/route.ts` and the public UI are unchanged: the existing mock stays disabled in production and the real runtime is not imported by any route. `handleConciergeMessage` in `lib/ai-concierge/runtime/index.ts` is the future server entrypoint for the RT-75 Owner gate.

## 8. Validation

- `tests/ai-concierge-runtime.test.ts`: 38 deterministic tests (no network) covering factual, contact, Rio, catalog, price, availability, flight/hotel/Oner, booking, payment, refund, operational, out-of-catalog, unsupported locale, empty/low retrieval, stale/wrong-locale/wrong-digest/unknown/blocked/retired/unapproved provenance, malformed and client-controlled input, prompt injection, unsafe model output, upstream failures, `store: false`, and content-free events.
- `scripts/rt-67-live-smoke.ts` (`npm run smoke:concierge-live`): 8 synthetic PT prompts against the real Responses API and the RT-69 store. Five factual prompts returned `ANSWER` (2 API calls each: one search, one generation) and the three dynamic prompts ("Quanto custa hoje?", "Tem vaga amanhã?", "Meu pagamento foi confirmado?") were blocked before any call. Total 10 API calls. Live hits passed the provenance gate (including chunk-digest equality).

## 9. Extension points

Multi-turn context and session state (after RT-70), distributed rate limiting (RT-72), analytics (RT-73), failure/fallback hardening (RT-74), EN/ES with separately approved sources, the final model decision, and route wiring after the RT-75 gate.

## 10. Update (RT-70)

Session context (client-held, bounded), data minimization and the AI disclosure/notice were added by RT-70; see `rt-70-concierge-privacy-architecture.md`. The single-turn statement in §6 is superseded: the server still stores nothing, but accepts bounded client-held history.
