# RT-90 — Flight Security Baseline (provider-independent sections)

- Ticket: RT-90 (RT-RB-C-08) — Flight Security Architecture Review
- Status: **OPEN — baseline draft only.** Not a completed review. No independent reviewer sign-off; no Owner risk acknowledgment.
- Prepared: 2026-10-03. Input: `rt-65-flight-commercial-architecture.md`.
- Scope: documentation only. No security code is implemented by this document.
- Rule: **no provider or PSP security behavior is invented.** Anything that depends on provider/PSP answers is `EXTERNAL_DECISION_REQUIRED`.
- Blocks: RT-40, RT-86, RT-87. Does not block RT-38 (mock-only).

## 1. Baseline controls (provider-independent, proposed)

These are requirements the Rick Travel side must meet regardless of provider. They are proposals for the reviewer to confirm or amend.

| Area | Baseline requirement | Provider-dependent part |
| --- | --- | --- |
| Server-only provider boundary | Provider credentials and calls exist only in server code; the browser receives only Rick Travel view models. No provider identifier or raw payload is exposed that enables direct provider calls. | Credential format: `EXTERNAL_DECISION_REQUIRED` |
| Credential storage | Secrets live only in environment/secret storage, never in the repo, client bundle or logs. Separate values per environment. | Auth scheme, rotation process, sandbox/prod separation: `EXTERNAL_DECISION_REQUIRED` |
| Preview vs production secrets | Preview deployments must not hold production provider or PSP credentials. | — |
| Rotation | A documented rotation procedure exists and can be executed without code change. | Provider rotation/overlap window: `EXTERNAL_DECISION_REQUIRED` |
| PSP webhook signature | Webhooks are accepted only after signature verification on the raw body; unverified requests are rejected and logged without payload. | PSP scheme: `EXTERNAL_DECISION_REQUIRED` (no PSP chosen) |
| Replay protection | Event ids stored; duplicates are no-ops; timestamp tolerance where the scheme provides one. | Scheme support: `EXTERNAL_DECISION_REQUIRED` |
| Idempotency | Every state-changing operation carries an internal idempotency key; no blind retry of reservation or issuance. | Provider idempotency support: `EXTERNAL_DECISION_REQUIRED` |
| Auth / capture / refund boundary | Payment state changes only from verified PSP events or authenticated operator actions; no refund without authorized policy. | PSP capabilities: `EXTERNAL_DECISION_REQUIRED` |
| Card data | Rick Travel never handles raw card data. | Provider/PSP confirmation: `EXTERNAL_DECISION_REQUIRED` |
| PII isolation and encryption | Passenger data stored separately from marketing/analytics data, encrypted at rest, minimal fields, access logged. | Provider required fields and retention: `EXTERNAL_DECISION_REQUIRED` |
| Log redaction | No passenger documents, contact data, tokens, secrets or payment data in logs; correlation ids used instead. | — |
| Audit integrity | OrderEvent is append-only; corrections are new events; operator actions record actor and reason. | — |
| Operator tooling access | Manual-review tooling requires authenticated, role-restricted access with audit. | — |
| Guest checkout token | Unguessable, high-entropy, scoped to one order, expiring, not stored in logs or URLs shared to third parties. | — |
| CSRF / session | State-changing endpoints enforce CSRF/same-site protections and session validation. | — |
| Rate limiting | Distributed rate limiting on search and order endpoints before real provider traffic (RT-82). | Provider limits: `EXTERNAL_DECISION_REQUIRED` |
| Abuse protection | Bot/abuse controls on search and checkout to protect provider quota. | Provider look-to-book rules: `EXTERNAL_DECISION_REQUIRED` |
| Timeout / retry | Bounded timeouts; ambiguous results go to status lookup or `MANUAL_REVIEW`. | Provider timeouts and safe-retry calls: `EXTERNAL_DECISION_REQUIRED` |
| Retention / deletion | Defined retention per data class and a deletion path compatible with legal/fiscal obligations. | Provider retention and DPA terms: `EXTERNAL_DECISION_REQUIRED` |
| Incident response | Documented contacts, triage, credential revocation, customer notification and provider escalation steps. | Provider escalation contacts and SLA: `EXTERNAL_DECISION_REQUIRED` |

## 2. Items that cannot be completed yet

- Provider authentication, IP allowlisting and domain approval requirements (RT-39).
- Provider webhook security and event semantics (RT-39).
- PSP selection and its webhook/refund capabilities (Owner decision; RT-86).
- Legal retention periods (Owner/legal).

## 3. Remaining for RT-90 closure

1. Independent reviewer assessment of each area, with findings and required controls.
2. Resolution or documented acceptance of each `EXTERNAL_DECISION_REQUIRED` item after RT-39 answers arrive.
3. Reviewer sign-off.
4. Owner acknowledgment of residual risks.

RT-90 is **not** closed by this document.
