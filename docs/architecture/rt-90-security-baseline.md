# RT-90 — Flight Security Baseline (provider-independent controls)

- Ticket: RT-90 (RT-RB-C-08) — Flight Security Architecture Review
- Status: **OPEN — provider-independent baseline, revision 2 (2026-10-03).** Not a completed review. No independent reviewer sign-off. No Owner residual-risk acknowledgment.
- Input: `rt-65-flight-commercial-architecture.md`. Related: `rt-39-provider-integration-questionnaire.md`.
- Scope: documentation only. No security code is implemented or changed by this document.
- Rule: **no provider or PSP security behavior is invented.** Anything that depends on provider/PSP evidence is `EXTERNAL_DECISION_REQUIRED`.
- Blocks: RT-40, RT-86, RT-87. Does not block RT-38 (mock-only).
- Control ids (`SEC-xx`) are stable references for the independent reviewer. "Proposed" means the reviewer must confirm, amend or reject.

## 1. Data classes (used by the controls below)

| Class | Examples | Handling |
| --- | --- | --- |
| C1 Secret | provider credentials, PSP keys, webhook secrets, signing keys | secret store only; never logged, never client-side |
| C2 Traveler PII | names, birth dates, document numbers, nationality, contact | encrypted at rest, minimal, access-logged, never in logs/analytics |
| C3 Order/commercial | prices, offer ids, order state, ticket numbers | integrity-protected, append-only history |
| C4 Operational | correlation ids, status codes, timings | loggable |
| C5 Public | search criteria without identity, static content | no special handling |

## 2. Controls

### 2.1 Credentials and secrets

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-01 | **Server-only secrets.** C1 values are read only in server code. No `NEXT_PUBLIC_*` (or equivalent client-exposed) variable may hold a C1 value. The browser receives only Rick Travel view models. | Credential format: `EXTERNAL_DECISION_REQUIRED` |
| SEC-02 | **Storage.** C1 values live only in the platform secret/environment store. Never in the repo, docs, tickets, chat, screenshots, build output or client bundle. A secret-scanning check runs before merge. | — |
| SEC-03 | **Environment separation.** Development, Preview and Production use distinct credentials. A credential valid in one environment must not work in another. | Provider sandbox/production separation: `EXTERNAL_DECISION_REQUIRED` |
| SEC-04 | **Preview vs Production.** Preview deployments receive sandbox/test values only, never production provider or PSP credentials. Preview URLs must not be able to trigger real reservation, issuance or payment. A purchase path is disabled when a non-production credential set is detected in a production context and vice versa. | — |
| SEC-05 | **Least privilege.** Each integration uses its own credential with the narrowest scope the provider allows. No shared credentials between provider and PSP, or between products. | Scope granularity: `EXTERNAL_DECISION_REQUIRED` |
| SEC-06 | **Rotation baseline.** A written rotation runbook exists and can be executed without a code change. Rotation is scheduled, and is also triggered immediately on suspected exposure, staff change or vendor notice. Secrets are readable from environment at runtime so a redeploy applies the new value. | Provider rotation process and overlap window: `EXTERNAL_DECISION_REQUIRED` |
| SEC-07 | **Invalid/expired credential behavior.** Authentication failure raises an alert and disables only the purchase path with a degraded UI (RT-65 §26 row 24). No retry loop against the provider with bad credentials. | Provider auth error semantics: `EXTERNAL_DECISION_REQUIRED` |
| SEC-08 | **Access to secrets.** Only named maintainers can view or change production secrets. Changes are traceable. | Platform role set-up is an Owner action |

### 2.2 PII and encryption

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-10 | **Isolation.** C2 is stored apart from analytics, marketing and e-mail tooling. Analytics events never carry C2 or document numbers. | Provider-required fields: `EXTERNAL_DECISION_REQUIRED` |
| SEC-11 | **Minimization.** Collect only fields required by the validated offer and provider. Collection of a field without a documented need is a review finding. | Provider-required fields: `EXTERNAL_DECISION_REQUIRED` |
| SEC-12 | **Encryption in transit.** TLS for every hop (browser, server, provider, PSP, database, e-mail). No plaintext fallback. | Provider minimum TLS: `EXTERNAL_DECISION_REQUIRED` |
| SEC-13 | **Encryption at rest.** C2 is encrypted at rest. Document numbers and birth dates receive field-level encryption in addition to storage encryption (expectation; reviewer to confirm mechanism and key management). Encryption keys are C1 and are kept apart from the data. | — |
| SEC-14 | **Access to C2.** Read access is role-restricted and every read by an operator is audited. Bulk export of C2 is not available in operator tooling by default. | — |
| SEC-15 | **E-mail content.** Confirmation e-mails carry the minimum needed (no document numbers). The order page after authentication is the source of detail. | — |
| SEC-16 | **Non-production data.** Production C2 is never copied to Development or Preview. Test data is synthetic. | — |

### 2.3 Logging and audit

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-20 | **Log redaction.** No C1 or C2, no raw provider/PSP payloads, no full guest tokens and no payment data in logs, errors, traces or monitoring. Logs carry correlation ids and C4 only. Redaction is applied centrally, not per call site. | — |
| SEC-21 | **Error responses.** Browser-facing errors use Rick Travel's taxonomy and a reference id. Provider messages, stack traces and internal ids are never returned. | — |
| SEC-22 | **Audit events.** OrderEvent is append-only. Each event records: order id, event type, prior and new state, actor (customer/operator/system/provider/PSP), source, timestamp and correlation id. Corrections are new events; no update or delete path exists in application code. | Provider/PSP event content: `EXTERNAL_DECISION_REQUIRED` |
| SEC-23 | **Audit integrity (tamper resistance).** Database permissions for the application role deny update/delete on the event table. Reviewer to decide whether hash chaining or external write-once storage is warranted. | — |
| SEC-24 | **Operator action audit.** Every manual-review decision, refund decision, data view and state override records actor and a mandatory reason. | — |
| SEC-25 | **Audit retention.** Audit events outlive the C2 they refer to. They reference orders by id, not by embedded C2. | Legal period: Owner/legal decision |

### 2.4 Guest checkout token

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-30 | **Entropy.** Generated with a cryptographically secure generator, at least 128 bits, unguessable and unrelated to order id or sequence. | — |
| SEC-31 | **Storage.** Only a hash of the token is stored server-side. The token is shown once in the confirmation link. | — |
| SEC-32 | **Scope.** One token grants access to one order and a defined set of actions (view, status). It never grants refund, cancel or edit of C2 without re-verification. | — |
| SEC-33 | **Expiry and revocation.** Tokens expire and can be revoked. Expiry is reduced after final state. | Expiry duration: Owner decision |
| SEC-34 | **Transport.** Token is not placed in URLs sent to third parties, not logged, not in analytics, and responses carrying it send `Referrer-Policy: no-referrer` and `Cache-Control: no-store`. | — |
| SEC-35 | **Abuse.** Failed token lookups are rate-limited per IP and per order and return an indistinguishable response for unknown and wrong tokens. | — |
| SEC-36 | **Higher-risk actions.** Cancel/refund requests require an additional factor (e.g. e-mail link or data match) in addition to the token. | Refund process: `EXTERNAL_DECISION_REQUIRED` |

### 2.5 Operator / manual-review tooling

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-40 | **Authentication and role.** Operator tooling requires an authenticated session with an explicit operator role. It is not reachable by normal customer sessions. Default deny. | — |
| SEC-41 | **Strong authentication.** Multi-factor authentication for operator accounts (expectation). | — |
| SEC-42 | **Separation of duties.** Refund decisions require a different actor than the one who triggered the manual review where staffing allows. Reviewer to confirm thresholds. | Owner decision |
| SEC-43 | **Least data.** Operator views mask C2 by default and reveal on explicit action (audited, SEC-24). | — |
| SEC-44 | **Server enforcement.** Authorization is enforced on the server for every action, not only hidden in the UI. | — |
| SEC-45 | **No raw secret or card exposure** in operator tooling. | — |

### 2.6 CSRF, session and transport

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-50 | **CSRF.** Every state-changing endpoint (select offer, submit passengers, start payment, cancel) validates origin/CSRF token. Cookie-authenticated mutations use `SameSite` cookies at minimum. | — |
| SEC-51 | **Session cookies.** `HttpOnly`, `Secure`, `SameSite`, bounded lifetime, rotation on privilege change. | — |
| SEC-52 | **Security headers.** HSTS, `X-Content-Type-Options`, frame-ancestors restriction and a content security policy suitable for the checkout pages. Embedding by third parties is denied unless a provider integration requires it. | Widget/iframe/embed requirements: `EXTERNAL_DECISION_REQUIRED` |
| SEC-53 | **Input validation.** All input validated server-side with an allowlist schema before reaching provider or database. | Provider field formats: `EXTERNAL_DECISION_REQUIRED` |
| SEC-54 | **Webhook endpoints are separate** from browser endpoints: exempt from CSRF but protected by signature verification (SEC-70 group, provider/PSP-dependent). | Signature scheme: `EXTERNAL_DECISION_REQUIRED` |

### 2.7 Rate limiting and abuse protection

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-60 | **Distributed limiter.** Rate limiting for search, revalidation, order and token endpoints uses a shared store. An in-memory limiter is not acceptable for real provider traffic (RT-65 §28; RT-82). | Provider quota: `EXTERNAL_DECISION_REQUIRED` |
| SEC-61 | **Layered keys.** Limits by IP, by session and by order. Stricter limits on write operations. | — |
| SEC-62 | **Search cost protection.** Each search may cost provider quota. Cache and coalesce identical searches, cap passengers/date range, and degrade gracefully when the limit is reached. | Look-to-book rules: `EXTERNAL_DECISION_REQUIRED` |
| SEC-63 | **Bot/abuse controls.** Bot detection on search and checkout (a challenge on suspicious traffic). Spend-protection: a global ceiling on provider calls with an alert. | Provider limits: `EXTERNAL_DECISION_REQUIRED` |
| SEC-64 | **Enumeration resistance.** Order, token and e-mail lookups give uniform responses and timing where feasible. | — |
| SEC-65 | **Card-testing resistance** on any payment start endpoint (limits per session/IP/e-mail). | PSP controls: `EXTERNAL_DECISION_REQUIRED` |

### 2.8 Timeouts, retries and idempotency (Rick Travel side)

| Id | Control (proposed) | Provider/PSP-dependent part |
| --- | --- | --- |
| SEC-66 | **Bounded timeouts** on every outbound call, with budgets under platform function limits. | Provider timeout guidance: `EXTERNAL_DECISION_REQUIRED` |
| SEC-67 | **No blind retry** of reservation, issuance, payment capture or refund. Ambiguous result → status lookup, else `MANUAL_REVIEW`. | Which calls are safe to retry: `EXTERNAL_DECISION_REQUIRED` |
| SEC-68 | **Internal idempotency keys** on every state-changing operation, stored before the call is made. | Provider key support: `EXTERNAL_DECISION_REQUIRED` |
| SEC-69 | **Server-side price/amount authority.** The amount charged is derived from the validated offer on the server, never from client input. Mismatch → `MANUAL_REVIEW` (RT-65 §26 row 12). | — |

### 2.9 Provider- and PSP-dependent controls (not assessable yet)

| Id | Area | State |
| --- | --- | --- |
| SEC-70 | Webhook signature verification scheme and raw-body handling | `EXTERNAL_DECISION_REQUIRED` |
| SEC-71 | Webhook replay protection (timestamp tolerance, event id) | `EXTERNAL_DECISION_REQUIRED` |
| SEC-72 | Webhook ordering, duplicate and retry handling | `EXTERNAL_DECISION_REQUIRED` |
| SEC-73 | Authorization / capture / refund boundary | `EXTERNAL_DECISION_REQUIRED` (no PSP chosen) |
| SEC-74 | Provider authentication method, IP allowlisting, domain approval | `EXTERNAL_DECISION_REQUIRED` |
| SEC-75 | Provider data-processing terms, retention and cross-border transfer | `EXTERNAL_DECISION_REQUIRED` |
| SEC-76 | PCI scope (whether any card data could reach Rick Travel) | `EXTERNAL_DECISION_REQUIRED` |

## 3. Retention and deletion boundaries

Periods are not set here. Legal and fiscal periods are an Owner/legal decision (`OWNER_DECISION_REQUIRED`). Boundaries (proposed):

| Data | Boundary |
| --- | --- |
| C2 for abandoned/unpaid orders | short fixed expiry, then deleted |
| C2 for completed orders | kept only as long as service, fiscal and dispute obligations require, then deleted or irreversibly anonymized |
| C3 order/commercial records | retained for the fiscal period; contain no more C2 than needed |
| Audit events (SEC-22) | outlive C2; reference orders by id |
| Logs (C4) | bounded retention; contain no C2 (SEC-20) |
| Backups | deletion applies to backups within a stated delay; restore procedures re-apply deletions |
| Customer deletion request | documented process: verify identity, delete or anonymize C2, retain what law requires, record the action as an audit event |
| Provider-side copies | `EXTERNAL_DECISION_REQUIRED` (SEC-75) |

## 4. Incident-response baseline

1. **Roles:** a named incident owner and a backup, with contacts recorded outside the affected system.
2. **Detect:** alerts on authentication failures to provider/PSP, anomalous provider spend, webhook signature failures, operator access to C2, and spikes in token lookups.
3. **Contain:** disable the purchase path (feature switch), revoke and rotate affected credentials (SEC-06), block abusive sources.
4. **Assess:** determine which data classes and orders are affected using audit events (SEC-22), with correlation ids.
5. **Notify:** customers and authorities as required by law; the provider/PSP through their escalation contacts (`EXTERNAL_DECISION_REQUIRED` until RT-39 answers, Q30).
6. **Recover and review:** restore service, reconcile orders, write a post-incident review with corrective actions.
7. **Exercise:** the runbook is rehearsed at least once before production exposure.

## 5. Status for the reviewer

| Group | Provider-independent baseline | Remaining |
| --- | --- | --- |
| Credentials, rotation, environment separation, Preview/Production (SEC-01–08) | drafted | reviewer confirmation; platform set-up evidence |
| PII isolation, encryption (SEC-10–16) | drafted | key-management design; provider-required fields |
| Logging, audit (SEC-20–25) | drafted | integrity mechanism decision |
| Guest token (SEC-30–36) | drafted | expiry values (Owner) |
| Operator tooling (SEC-40–45) | drafted | role model; separation-of-duties thresholds |
| CSRF/session/headers (SEC-50–54) | drafted | embed requirements depend on RT-39 |
| Rate limiting/abuse (SEC-60–65) | drafted | provider quota depends on RT-39 |
| Timeouts/retry/idempotency (SEC-66–69) | drafted | provider guidance depends on RT-39 |
| Retention/deletion (§3) | boundaries drafted | periods: Owner/legal |
| Incident response (§4) | baseline drafted | provider/PSP contacts; rehearsal |
| Provider/PSP-dependent (SEC-70–76) | **not assessable** | `EXTERNAL_DECISION_REQUIRED` |

## 6. Remaining for RT-90 closure

1. Independent reviewer assessment of each area, with findings and required controls.
2. Resolution or documented acceptance of each `EXTERNAL_DECISION_REQUIRED` item after RT-39 answers and the PSP decision.
3. Reviewer sign-off.
4. Owner acknowledgment of residual risks.

RT-90 is **not** closed by this document.
