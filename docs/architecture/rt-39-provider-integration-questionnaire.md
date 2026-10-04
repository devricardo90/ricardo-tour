# RT-39 — Provider Integration Questionnaire (Oner / Flytour / MaisFly)

- Ticket: RT-39 (RT-RB-S5-03) — receive documentation/credentials from the consolidator
- Status: **BLOCKED — `EXTERNAL_DEPENDENCY`**. This document is the request package; it is not an answer set.
- Prepared: 2026-10-03. Source inventory: `rt-65-flight-commercial-architecture.md` §27 (Q1–Q32) and §27a (Q33–Q48).
- Governing rule: **no provider capability is assumed.** Every answer received must be recorded with date and source document. Unanswered items stay `EXTERNAL_DECISION_REQUIRED`.
- Nothing in this package has been sent. Sending is an Owner action.

Two parts:

- **Part A** — Full technical questionnaire (provider technical/integration team).
- **Part B** — Short initial message in Portuguese (commercial/account contact).

---

# Part A — Full technical questionnaire

Question ids `[Qn]` refer to RT-65 §27/§27a. Items marked `[new]` are added by this package.

## 1. Context

Ricardo Tour / Rick Travel is evaluating the integration of three product categories into its own web platform:

- **Flights**
- **Hotels**
- **Flight + Hotel**

We need to understand which integration models the provider supports for each category, who owns search, reservation, issuance/confirmation, payment and support, and what onboarding is required. Please answer per product wherever the answer differs. If a capability does not exist, "not supported" is a complete and useful answer. Please do not describe planned features as available.

## 2. Integration model

For each product, which of the following are available? Mark all that apply.

Models: Widget · iframe · JavaScript embed · redirect · API · white-label · other (describe). [Q33–Q37, Q46–Q47]

| Product | Widget | API | White-label | Checkout ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| Flights | ☐ yes ☐ no | ☐ yes ☐ no | ☐ yes ☐ no | ☐ provider ☐ Rick Travel ☐ configurable | |
| Hotels | ☐ yes ☐ no | ☐ yes ☐ no | ☐ yes ☐ no | ☐ provider ☐ Rick Travel ☐ configurable | |
| Flight + Hotel | ☐ yes ☐ no | ☐ yes ☐ no | ☐ yes ☐ no | ☐ provider ☐ Rick Travel ☐ configurable | |

Follow-ups:

2.1 Is the **same API** used for all three products? [Q37]
2.2 If a widget exists, does an API exist **in addition**, or only the widget? A widget alone is not treated as API access. [Q36]
2.3 Can Rick Travel control the **search/results UI**? The **checkout UI**? [Q39–Q40]
2.4 Does checkout remain inside the provider platform? Is redirect, iframe or script embedding mandatory? [Q38, Q47]
2.5 What branding/white-label level is supported (domain, logo, colors, e-mails, documents)? [Q46]

## 3. Search / inventory

3.1 **Flights**: supported search criteria (one-way, round-trip, multi-city, flexible dates, direct-only); airport/city search or autocomplete endpoint; response size; pagination; filtering and sorting (server-side or client-side); text language. [Q3]
3.2 **Hotels**: destination search (city, region, point of interest, hotel id); occupancy/room configuration; availability; filtering/sorting; pagination.
3.3 **Identifiers**: format of offer / fare / room / rate identifiers; stable or per-search. [Q4]
3.4 **Offer validity**: validity duration; whether a re-search is required after expiry; how stale offers are signaled. [Q4]
3.5 **Repricing / revalidation**: dedicated endpoint? price-change semantics and tolerances; behavior when the fare is no longer available. [Q5]
3.6 **Baggage**: structure and reliability of included allowance per segment and passenger. [Q16]
3.7 **Fare rules**: structured change/refund conditions or free text; language. [Q17]
3.8 **Cabin classes**: supported values and mapping; mixed-cabin itineraries. [Q18]
3.9 **Hotel room/rate rules**: meal plans, cancellation policy, payment-at-property vs prepaid, taxes/fees disclosure, rate types. `[new]`
3.10 **Package composition**: how a Flight + Hotel offer is composed and priced (see §10). `[new]`

## 4. Reservation

4.1 Who creates the **PNR** (flight)? Endpoint, required passenger fields, name/document rules, infant linkage. [Q6, Q42]
4.2 Who creates the **hotel reservation**? [Q42]
4.3 Is a **hold / reservation without issuance** supported? Hold duration per fare/rate. [Q7, Q15]
4.4 **Ticketing deadline** and the consequence of lapse (penalties, debit memos). [Q15]
4.5 **Reservation expiry**: how it is signaled (status/event/none).
4.6 **Duplicate prevention**: does the provider detect duplicate bookings for the same passenger/itinerary? Behavior? `[new]`
4.7 **Idempotency**: idempotency keys on create/issue? [Q11]
4.8 **Lookup/recovery**: can an existing reservation be found by our own reference after a timeout or ambiguous response? Which calls are safe to retry? [Q11, Q22]

## 5. Ticket issuance

5.1 **Who issues** the ticket, and under which legal entity? [Q7, Q26, Q43]
5.2 Is issuance a separate call or automatic after reservation/payment? [Q7]
5.3 **Synchronous vs asynchronous** issuance; typical and maximum latency. [Q8]
5.4 **Ticket status API**: status values and polling guidance. [Q8]
5.5 **Issuance failure**: behavior, error codes, whether the reservation survives, how funds/credit are treated. [Q23]
5.6 **Void**: availability, window, API. [Q13]
5.7 **Cancel**: rules, windows, penalty source, API. [Q12]
5.8 **Reissue / change**: supported? API or manual? Fees?
5.9 **Responsibility split** between provider and agency for issuance errors, schedule changes and airline cancellations. `[new]`

## 6. Payment

Rick Travel has **not selected a payment provider**. These questions are information requests only.

6.1 Does the provider **collect payment from the end customer**, or only from the agency? [Q41]
6.2 Can Rick Travel use **its own PSP** for the customer's payment, independent of how Rick Travel pays the consolidator? [Q28]
6.3 Can **Mercado Pago** or another PSP be used in that role? Any restriction? [Q28]
6.4 **Authorization vs capture**: any expectation on when funds must be captured relative to reservation/issuance?
6.5 **Settlement flow**: how Rick Travel pays the consolidator (prepaid balance, invoice, per transaction), timing. [Q25]
6.6 **Currency handling**: pricing/settlement currency, FX responsibility and rate source. [Q25]
6.7 **Markup/commission**: can Rick Travel add markup? How is commission modeled, reported and paid? [Q25]
6.8 **Refunds** and **partial refunds**: who executes, API or manual, timelines, fees, flow of funds. [Q14]
6.9 **Failed issuance after successful customer payment**: expected process and who bears the exposure. `[new]`
6.10 **Reconciliation**: reports/APIs for reservations, tickets, voids, refunds, settlements; format and cadence. [Q24]
6.11 **Card data**: does the provider ever require card data from Rick Travel? (Target: never.) What form of payment is used on issuance? [Q27]

## 7. Events / webhooks

7.1 Are webhooks/push events supported? If not, what is the recommended polling approach? [Q9]
7.2 Event types: reservation, issuance, cancellation, refund, schedule change, hotel confirmation. [Q9]
7.3 **Signature** scheme and replay protection. [Q10]
7.4 **Retry policy**: attempts, backoff, total window. [Q9]
7.5 **Ordering**: are events ordered? Can they arrive out of order? `[new]`
7.6 **Duplicates**: can the same event be delivered more than once? Event id for dedupe? `[new]`
7.7 Which updates are delivered by event: reservation updates, issuance updates, cancellation/refund updates. [Q9]
7.8 Webhook source IPs / callback URL requirements. [Q29]

## 8. Security / credentials

8.1 **Authentication method** (API key, OAuth, mutual TLS, IP allowlist). [Q1]
8.2 **Credential types** and separation by environment/product. `[new]`
8.3 **Sandbox credentials**: issuance process. [Q2]
8.4 **Credential rotation**: process, notice period, overlap window. [Q1]
8.5 **IP allowlisting**: required? static egress IPs expected? Note: Vercel-hosted egress IPs are not static by default; please state whether allowlisting is mandatory. `[new]`
8.6 **Production domain approval**: allowlisted domains/IPs/callback URLs; contractual domain verification. [Q29, Q48]
8.7 **Certification process** before go-live. [Q32, Q48]
8.8 **Rate limits**: per second/day, per credential; cost per search; look-to-book expectations. [Q20]
8.9 **Timeout limits**: typical and maximum latency per operation; recommended client timeouts. [Q21]
8.10 Other **security requirements** (TLS versions, data handling, audit obligations). `[new]`

## 9. Passenger / traveler rules

9.1 Definitions and **age bands** for adult, child, infant (age at travel or at booking). [Q19]
9.2 **Passenger limits** per search and per order. [Q19]
9.3 **Required traveler fields** (names format, birth date, gender, contact). [Q6]
9.4 **Document/passport requirements** by route (domestic/international). `[new]`
9.5 **Nationality requirements** and visa/ETA data responsibility. `[new]`
9.6 Infant/child rules, unaccompanied minors. [Q19]
9.7 **PII retention** expectations and data-processing terms on the provider side; cross-border transfer. [Q31]
9.8 Hotels: guest/occupant rules (child ages, lead guest). `[new]`

## 10. Hotels and Flight + Hotel

Recent provider material indicates these product categories exist. We ask explicitly and assume nothing.

**Hotels**

10.1 Is there a **standalone hotel API and/or widget**? [Q34, Q36]
10.2 **Hotel confirmation process**: instant or on request; confirmation identifiers; who confirms. [Q44]
10.3 **Room/rate rules**: how rooms, rates, meal plans and taxes are modeled.
10.4 **Cancellation rules**: windows, penalties, modification, no-show; API or manual.

**Flight + Hotel**

10.5 Is it a **true package product** (distinct inventory/pricing), or **two combined transactions** (flight + hotel)? [Q35, Q45]
10.6 Is the reservation **atomic**? What happens if one component fails? [Q45]
10.7 **Package-specific pricing**: is the package price different from the sum of parts? Is the discount visible/hideable?
10.8 **Package cancellation/refund**: partial cancellation, per-component rules, who refunds.
10.9 **One confirmation or separate confirmations** (reference ids, documents)?
10.10 Is the same API/credential used for packages as for flights and hotels? [Q37]

## 11. Commercial / legal

11.1 **Issuing legal entity** and accreditation required of Rick Travel. [Q26]
11.2 **Seller / merchant of record** for each product. `[new]`
11.3 **Agency role**: Rick Travel as agent, reseller or sub-agent. `[new]`
11.4 **Commissions** and **markup rules**. [Q25]
11.5 **Invoicing**: who invoices the customer, who invoices the agency; fiscal documents. `[new]`
11.6 **Customer support responsibility** (pre- and post-sale, airline disruptions). [Q30]
11.7 **Refund responsibility**. [Q14]
11.8 **Dispute/chargeback responsibility** and evidence expectations. `[new]`
11.9 Contractual prerequisites for production. [Q32]

## 12. Environment / onboarding

12.1 **Sandbox** availability, parity with production, test data, availability windows. [Q2]
12.2 **Documentation** and **API reference** location; versioning and deprecation policy.
12.3 **SDKs** (languages). `[new]`
12.4 **Test credentials** and test scenarios (success, price change, unavailable, timeout, issuance failure).
12.5 **Certification** requirements. [Q32]
12.6 **Production onboarding** steps and typical lead time. [Q32]
12.7 **Support contact** and escalation path for issuance incidents. [Q30]
12.8 **SLA**: uptime, maintenance windows, incident response. [Q30]
12.9 **Error codes**: catalog, retryability flags, mapping guidance. [Q23]

## 13. Required artifacts

Please send, if available:

- [ ] API documentation
- [ ] OpenAPI / Swagger specification
- [ ] Widget documentation (flights, hotels, flight + hotel)
- [ ] Sample requests/responses (search, revalidate, reserve, issue, cancel)
- [ ] Webhook documentation
- [ ] Sandbox access
- [ ] Authentication guide
- [ ] Error-code catalog
- [ ] Commercial integration guide

## 14. Answer tracking (internal — remove before sending)

Record each answer in RT-39 with: date, provider contact, source document, answer, and the RT-65 question id. Unresolved items remain `EXTERNAL_DECISION_REQUIRED`.

Minimum to unblock RT-40 (RT-65 §28): Q1–Q11, Q21–Q23, plus sandbox credentials. RT-40 additionally requires RT-90 completion and Owner decisions 1–3 (RT-65 §24).

| Group | Questions | Answered? |
| --- | --- | --- |
| Integration model | 2.1–2.5 | no |
| Search/inventory | 3.x | no |
| Reservation | 4.x | no |
| Issuance | 5.x | no |
| Payment | 6.x | no |
| Events | 7.x | no |
| Security/credentials | 8.x | no |
| Passenger rules | 9.x | no |
| Hotels / Flight + Hotel | 10.x | no |
| Commercial/legal | 11.x | no |
| Onboarding | 12.x, 13 | no |

---

# Part B — Short initial message (Portuguese)

> Assunto: Documentação de integração — Voos, Hotéis e Voo + Hotel (Ricardo Tour)
>
> Olá, [Nome],
>
> Sou [Nome do Owner], da Ricardo Tour (Rick Travel). Estamos avaliando integrar **Voos**, **Hotéis** e **Voo + Hotel** à nossa própria plataforma web e gostaríamos de entender como isso funciona com a [Oner / Flytour / MaisFly].
>
> Poderiam, por favor, nos indicar o contato técnico correto e enviar a documentação disponível? Em especial, gostaríamos de saber, para cada produto:
>
> 1. Se a integração é por **widget, API, redirecionamento ou white-label**;
> 2. Quem fica responsável pelo **checkout, pagamento, reserva e emissão**;
> 3. Se há **ambiente de testes (sandbox)** e como é o processo de homologação e contratação.
>
> Se houver documentação de API (OpenAPI/Swagger), documentação de widget, guia de autenticação ou guia comercial de integração, ficaremos muito agradecidos em recebê-los. Podemos enviar um questionário técnico mais detalhado ao time responsável, se preferirem.
>
> Obrigado,
> [Nome] — Ricardo Tour
> [Telefone / e-mail]


---

# Provider evidence log (internal, append only)

## 2026-10-03: Oner Travel, relayed by the Owner

`CUSTOM_DOMAIN_REQUIRED_FOR_WIDGET_RELEASE`: the agency must already have its own URL; the URL is essential for release of the search engine; the widget request form must be submitted; response may take up to 72 business hours. Does not prove API access.

## 2026-10-04: domain prerequisite satisfied; request submitted

- `DOMAIN_PREREQUISITE = SATISFIED`: production domain `https://www.ricardotour.com` is live (`rt-58-60-domain-foundation.md` section 9).
- `ONER_FORM_SUBMITTED = YES` (submitted manually by the Owner). Submission date/time and requester data are held by the Owner and are not recorded here.
- `STATUS = AWAITING_PROVIDER_RESPONSE` (Jira status stays BACKLOG / READY; labels `blocked`, `external-dependency`, `awaiting-provider-response`).

## 2026-10-04: widget integration instructions (Oner, relayed by the Owner)

| Element | Value |
| --- | --- |
| HEAD stylesheet | `https://static.onertravel.com/widget/search/production/styles.css` |
| HTML / custom element | `<befly-widget language="pt-br" new-tab="true"></befly-widget>` |
| Script | `https://static.onertravel.com/widget/search/production/widget-befly.js` |
| Provider note | the widget only works on the domain specified in the request form; it is not displayed in local, edit or development environments |

Interpretation:

- `WIDGET_INTEGRATION = CONFIRMED` (a search widget delivered as a custom element with a hosted script and stylesheet).
- `API_INTEGRATION = NOT CONFIRMED`. No API capability is inferred from the widget instructions.
- The instructions name only a search widget. Nothing received yet covers hotels, Flight + Hotel, checkout ownership, payment, reservation, issuance, webhooks or sandbox. Questionnaire section 2 (integration matrix) stays open for those products.
- `new-tab="true"` suggests results/checkout open on the provider side (provider-owned checkout). This is an inference to confirm with Oner, not a fact: see questions 2.3, 2.4 and 6.1.
- The widget is not implemented by this record. Implementation needs its own ticket, an Owner decision and an RT-90-style review of loading a third-party script/stylesheet on the public site (CSP, privacy, performance).

## Remaining external dependency

`ONER_RESPONSE`, widget authorization, provider documentation, credentials/configuration instructions, and confirmation whether API access exists. RT-39 stays open.
