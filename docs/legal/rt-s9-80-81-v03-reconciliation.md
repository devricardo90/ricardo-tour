# RT-80 / RT-81 — Owner drafts v0.3 reconciled with the real site (2026-10-15)

- Inputs: `docs/legal/owner-drafts/privacy-policy-v0.3.md`, `docs/legal/owner-drafts/terms-of-use-v0.3.md` (Owner-supplied, stored verbatim), the institutional document (Owner's Downloads folder, not stored in the repo), `origin/main` code and read-only checks of www.ricardotour.com.
- Purpose: answer every `[VALIDAR]` the code or production can answer, flag sentences that do not match what the site does, and leave commercial/legal decisions to the Owner. **No policy, deadline, payment rule or retention period was invented.** Nothing published.

## 0. Company identity (institutional document vs drafts)
| Item | Value | Status |
|---|---|---|
| Trade name | Ricardo Tour | Confirmed (document + Owner) |
| CNPJ | 49.142.341/0001-90 | **Confirmed by the Owner on 15/10/2026.** Check digits valid. The institutional document's line 8 had `49.14.341/0001-90` (13 digits, invalid); corrected in the Owner's file on 15/10 at the Owner's request |
| Razão social | — | **Pending** (not in the document; confirm on the Receita Federal card) |
| Cadastur number | Document line 15 shows `49.142.341/0001-90`, identical to the CNPJ | **Pending**: a Cadastur number is a separate registration; confirm on the Cadastur certificate before any use |
| Address | Rua Projetada, nº 8, Centro, Itaocara, RJ, 28570-000 | Declared by the Owner; registered address pending (v0.3 itself marks it "informado") |
| Legal representative | "Ricardo Souza Francisco" (data field) vs "Ricardo De Souza Francisco" (signature) | **Inconsistent spelling**: confirm the registered name |
| Phone / e-mail | +55 22 99846-1906 / contato@ricardotour.com | Match `PUBLIC_CONTACT` |
| Instagram | Document: @ricardotour1; site constant: @ricktravelbrasil | **Inconsistent** (not used in the legal pages; flag for RT-78 copy review) |
| Website | Document lists `comprarviagem.com.br/ricardotour` and `ricardotour.com` | The legal pages use www.ricardotour.com |
| Statements not used | "10 anos de experiência na Europa", "formado em Turismo", "Guias turísticos credenciados", "Parcelamento facilitado" | Claims or commercial terms: not used in any draft without approved evidence (Volume II §9) |

## 1. Privacy v0.3 — `[VALIDAR]` answered by evidence
| v0.3 section | Verified fact (evidence) |
|---|---|
| §3.5 / §7 / P3 cookies and storage | Exactly three cookies are set by ricardotour.com: (1) `ricktravel_analytics_attribution`, first-party, 30 days, campaign source and landing page (`proxy.ts`; observed in production with `Max-Age=2592000`); (2) `NEXT_LOCALE`, session cookie with the chosen language, set only when the language differs from the browser's (next-intl 4.9.1; observed in production); (3) the login session cookie `better-auth.session_token`, only if someone signs in (`lib/auth.ts`). Browser storage: a random analytics session id in `sessionStorage` (`lib/analytics/client.ts`). **No third-party analytics, advertising pixel, tag manager or session replay** (verified 12/10). Third-party code: the Oner flight widget on `/pt/planeje-sua-viagem` loads from `static.onertravel.com`; its own cookies are unknown (Q5). Consent banner: none exists; whether one is needed is a legal question (P3). |
| §6 / P2 providers integrated | Hosting Vercel; database Neon; transactional e-mail Resend; usage-limit store Upstash; AI OpenAI (Daniela, **disabled**); flight widget Oner. **No payment platform, no partner integration** (C2Rio blocked, RT-101), no CRM, no marketing e-mail tool. |
| §8 / P6 security controls | HTTPS on the production domain; admin and `/reservas` require a login session (`proxy.ts`); tour-request and contact forms are rate-limited (`app/actions/tour-request.ts`, `contact-message.ts`); Daniela's limits use a hashed IP. **Known gap recorded by the Owner on 14/10: Preview deployments share the production database** (isolation FAIL; RT-104…108 deferred). The text must not claim isolation that does not exist. |
| §9 / P5 retention | **No automatic deletion exists** for contact messages, tour requests, accounts or statistics. Concrete periods are an Owner/legal decision (Q3). |
| §11 / P4 international transfer | Neon database region **eu-west-2 (London)** (host name, RT-100 audit); Vercel, Resend, OpenAI and Upstash are foreign companies; their processing regions and transfer mechanisms are not verified. Legal decides the mechanism. |
| §12 / P7 AI | Provider: OpenAI. Ricardo Tour does not store conversations; OpenAI may keep logs (the documentation consulted said up to 30 days; re-check before publication); training use not verified. **Daniela is disabled**; v0.3's "quando ativa" wording fits that. Human handoff exists (WhatsApp/e-mail link, nothing sent automatically). |
| §19 / P8 privacy channel | contato@ricardotour.com exists; an "encarregado" (DPO) is not designated: Owner/legal decision. |

## 2. Privacy v0.3 — sentences that do not match the site today (flag; the Owner decides wording)
| v0.3 | Site today |
|---|---|
| §3.1 "Idioma de preferência; País de origem" | Forms store name, e-mail, phone and a message containing tour, date, group size, notes and the page language. **Country of origin is not collected.** |
| §3.2 "Local de hospedagem ou encontro" | Not collected by the site (could come in WhatsApp conversations). |
| §3.3–3.4 reservation status, payment data | No online payment. A legacy login booking area exists (`/reservas`, not linked). |
| §7 "Análise de navegação; Avaliação de campanhas" | First-party only (attribution cookie + session events); no third-party analytics. |
| §17 promotional communications | No promotional sending mechanism exists; e-mail is transactional only (Resend). |

## 3. Terms v0.3 — reconciliation
| v0.3 | Fact or gap |
|---|---|
| §3 own vs partner tours | The four public tours are `UNCLASSIFIED` (RT-99); no partner tour is offered. §3.2 applies only after RT-101 is unblocked. `[VALIDAR — modelo contratual]` stays Owner/legal. |
| §4 / T8 tour-page information | The four tour pages show duration, category, description, highlights, included, not included and "datas combinadas com a equipe". **Missing: meeting point, time, languages, participation requirements, confirmed accessibility, operator, cancellation conditions.** This is Sprint 10 scope (tour content). |
| §5 prices may vary until confirmation | The pages show a fixed "Preço por pessoa" in R$. The Owner's wording is consistent with request-then-confirm, but legal should check it against the displayed price. |
| §6 reservations | **Matches the site exactly** (a request is not a confirmation; confirmation only by express communication). This answers most of Q7; only channel and response time remain. |
| §7 payments | No online payment exists. All options are an Owner decision (T3). |
| §19 third-party services (voos, hotéis, pacotes, locação, seguros) | **Only flight search (Oner, PT only) exists today.** Hotels, packages, car rental and insurance are not offered on the site. |
| §21 support in PT/EN/ES | An Owner commitment; the site is in PT/EN/ES. |
| §22 AI assistant | Daniela is disabled; the "quando disponível" wording fits. |
| T7 acceptance record | **No acceptance mechanism exists** (no checkbox, no stored version of accepted terms). Needs a ticket when booking is built (Sprint 11), after the Owner decides T7. |
| §8 CDC art. 49 and §28 jurisdiction | Legal review. |

## 4. What the Owner still has to decide (consolidated; replaces Q1–Q12)
**Identity:** razão social; Cadastur number (separate from the CNPJ); registered address; spelling of the legal representative's name.
**Privacy:** retention periods (P5/Q3); encarregado / privacy channel (P8); ask Oner about the widget's data and cookies (Q5); whether a cookie banner is required (legal).
**Commercial (Terms):** operator of each of the 4 tours (T2/Q6); confirmation channel and response time (rest of Q7); payment methods, deposit, instalments, currency, processors (T3/Q9); cancellation policy for own tours (T4/Q8); rescheduling (§9); refund procedure (T5); delay tolerance and no-show (T6); reference language and acceptance record (T7); per-tour weather, age and physical rules (Q10, also Sprint 10 content).
**Legal review:** who reviews both texts, and when (Q11).
**Resolved by v0.3 or evidence:** Q2 (accounts: cookie disclosed), Q4 (AI section conditional "quando ativa"), Q7 core (request is not confirmation), currency R$ on the pages. Q12 (`/privacidade`, `/termos`) still needs a "yes".

## 5. Next step after the Owner's answers
1. Owner approves a v0.4 (PT) built from v0.3 + §1–§3 corrections.
2. Replace the lab drafts (`lib/legal/privacy-copy.ts`, `lib/legal/terms-copy.ts`) with v0.4; EN/ES translations prepared **after** the PT text is approved (avoids translating text that will change), marked as translations pending review.
3. Legal review; then the public routes, footer links and sitemap (plan in `rt-s9-80-81-legal-pages-preparation.md` §4), only with publication authorization.
