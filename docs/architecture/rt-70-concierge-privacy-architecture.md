# RT-70 — Concierge Privacy, Consent and Retention (V1)

- Ticket: RT-70 (RT-RB-AI-04). Supersedes the open questions in `rt-70-concierge-persistence-retention-draft.md` for what is technically decidable.
- Status: **technical privacy architecture implemented and tested; legal review of the notice texts and provider terms is still required before public enablement (RT-75).** Production Concierge stays disabled.
- Scope: PT V1 only. Builds on RT-67 (runtime) and RT-69 (hosted retrieval); neither behavior was weakened.

## 1. Owner decisions applied

| # | Decision | Implementation |
| --- | --- | --- |
| 1 | Context within the current session only | Client-held history, re-sent per request, bounded (§3) |
| 2 | No permanent visitor memory | No identifier, cookie, account link or server store of any kind |
| 3 | No conversation history in our database | No database access in the runtime; a test scans the runtime source for persistence APIs |
| 4 | Visitors must know it is AI | `CONCIERGE_PRIVACY.ai_disclosure` (§5) |
| 5 | Privacy docs accurately describe processing, retention, providers | §4 and §6 |
| 6 | Production blocked until RT-75 | Route and UI untouched; `legal_review: "PENDING"` is the machine-readable gate |
| 7 | PT-only V1 | Unchanged |

## 2. Data flow

Browser (session memory) → our server runtime (stateless) → OpenAI (`vectorStores.search` over public approved knowledge, then `responses.create` with `store: false`) → our server → browser.

- Our server keeps nothing after the response. There is no session ID, conversation ID, cookie or storage.
- The only operational output is a content-free event (outcome, latency, counts, reasons, error class) written to platform stdout. It contains no message, answer, identifier or IP.
- **Operational metadata store: decided NOT necessary**, so no metadata schema or retention period is introduced.
- Human handoff is an external action (WhatsApp / e-mail) chosen by the visitor; the transcript is never attached or persisted by us.

## 3. Session context (`input.ts`, `run.ts`, `policy.ts`)

- Request: `{ message, locale, history? }`, `history` = at most 8 turns (4 exchanges), 1,200 characters per turn, 4,000 in total, roles `user | assistant` only, no extra keys. Anything else is `INVALID_INPUT`.
- History is untrusted. A prior user turn containing an injection attempt → `REFUSED`; a prior assistant turn that fails the post-generation check (price, availability, booking/payment confirmation, faked handoff, leaked internals, non-canonical contact) → `INVALID_INPUT`, so forged assistant turns cannot smuggle claims. The runtime's own handoff and dynamic messages are tested to remain valid history.
- History is passed to the model as `<conversa_anterior>` inside `input`, never in `instructions`; facts must still come from validated evidence. A short follow-up is retrieved together with the previous user turn.
- Gates, provenance and post-generation validation apply to every turn exactly as in RT-67.
- Client requirement for the UI ticket (not implemented here): keep history in component memory only — no `localStorage`, `sessionStorage`, IndexedDB or cookies — and drop it on close/reload; trim to the bounds above.

## 4. OpenAI data handling (verified 2026-10-09 against OpenAI "Your data" documentation)

- API data is **not used to train or improve OpenAI models** by default.
- **Abuse-monitoring logs: retained up to 30 days** for API usage (including `/v1/responses` and vector-store requests), unless longer retention is required by law. `store: false` does **not** remove this; only OpenAI-approved Zero Data Retention (ZDR) or Modified Abuse Monitoring does.
- `/v1/responses`: application state is "None" with `store: false`; without it, responses are stored 30 days by default. Every Concierge call sets `store: false` (tested).
- `/v1/files` and `/v1/vector_stores`: retained until deleted, and not ZDR-eligible. They hold only the **public, Owner-approved RT-69 knowledge** (no visitor data); the store also expires after 30 days of inactivity.
- Default processing is in the United States; EU/EEA residency is available only with ZDR or Modified Abuse Monitoring. ZDR / Modified Abuse Monitoring require prior OpenAI approval and acceptance of additional terms.
- Consequence for disclosure: we must not say "no data is kept anywhere". Accurate statement: Ricardo Tour does not store the conversation; the AI provider may keep technical safety logs for up to 30 days.

## 5. Visitor-facing texts (PROPOSED — `lib/ai-concierge/runtime/privacy.ts`, version `2026-10-09.1`)

- **AI disclosure** (before the first message, kept visible): "Você está conversando com um assistente de inteligência artificial da Ricardo Tour, não com uma pessoa. Ele pode errar e não confirma preços, disponibilidade, reservas ou pagamentos. Não envie dados pessoais ou sensíveis, como documentos, cartão ou senhas."
- **Privacy notice** (short, links to the Privacy page): "Suas mensagens são enviadas à OpenAI, nossa fornecedora de IA, apenas para gerar a resposta. A Ricardo Tour não guarda a conversa: ela existe somente nesta sessão, no seu navegador. A fornecedora pode manter registros técnicos de segurança por até 30 dias. Saiba mais na Política de Privacidade."
- **Privacy-page content to include (RT-RB-L-05):** provider (OpenAI) and purpose; US processing / international transfer; no training on the data; up to 30-day provider safety logs; no conversation storage by Ricardo Tour; session-only context in the browser; do not share sensitive data; human contact channels; visitor rights channel (contato@ricardotour.com) — final wording and legal basis subject to §7.

Consent behavior: V1 uses **notice-based transparency** (disclosure shown before use, no persistent consent record, since nothing is persisted). Whether LGPD requires explicit consent for the international transfer is open (§7); if it does, a per-session acknowledgment held in memory can be added in the UI without server storage.

## 6. Data minimization

Before any text leaves our server for the provider (`redactPersonalData`): e-mail addresses, CPF, payment-card numbers (Luhn-valid) and any remaining run of 10+ digits (phones, document/account numbers) are replaced by `[dado removido]`, in the message and in history, and the model is instructed not to repeat personal data. Redaction is best-effort, not a guarantee; the notice still tells visitors not to share sensitive data. Names and free-text sensitive content cannot be reliably detected and are not redacted.

## 7. Open items requiring Owner / legal decision (not blocking the code, blocking public enablement at RT-75)

1. **Provider data-handling tier:** accept OpenAI's defaults (30-day abuse logs, US processing) or pursue ZDR / Modified Abuse Monitoring / EU residency (cost, contract and OpenAI approval).
2. **Legal review of notice texts:** controller identity and privacy contact, LGPD legal basis, whether explicit consent is required for the international transfer, treatment of minors, rights-request channel. On approval set `CONCIERGE_PRIVACY.legal_review` to `"APPROVED"` (and bump the version).
3. **Privacy page publication** (RT-RB-L-05) with the §5 content.
4. **Platform logs:** hosting-provider infrastructure logs (not application logs) may include IP addresses; retention follows the hosting plan and must be reflected in the Privacy page.

## 8. Tests (`tests/ai-concierge-privacy.test.ts`, 11 deterministic tests)

Session context use and bounds, forged/unsafe history, injection in history, gates still applied with history, own messages valid as history, redaction (and no over-redaction of ordinary text), personal data never reaching retrieval/generation, notice content and `PENDING` gate, and a static scan proving no persistence/cookie/storage/DB/`NEXT_PUBLIC` use in the runtime. Live check: a real two-turn follow-up (2 API calls) resolved the reference from history and answered from approved evidence.
