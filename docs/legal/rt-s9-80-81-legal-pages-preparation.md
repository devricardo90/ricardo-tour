# RT-80 / RT-81 — Privacy and Terms pages: preparation pack (Sprint 9)

- Jira: RT-80 (Privacy page), RT-81 (Terms page). Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), section 5.
- Date: 2026-10-12. **Preparation only.** No legal text was written, edited or approved by this work, no page was created or linked, nothing was published. The Owner supplies or approves all legal wording; legal review is separate and still pending (decision recorded by the Owner on 2026-10-11 in `docs/legal/privacy-facts-verified.md`).
- Ticket rules kept: "Legal copy must come from the Owner/legal; no invented legal text" (RT-80), "booking/payment/cancellation terms must be consistent with the commercial architecture" (RT-81).

## 1. Current state (verified in the repository)

| Item | State | Evidence |
|---|---|---|
| Privacy draft PT/EN/ES | **Exists, DRAFT.** Owner approval PENDING, legal review PENDING. Factual, built from code behavior | `lib/legal/privacy-copy.ts` (109 lines), evidence table in `docs/legal/privacy-facts-verified.md` |
| Privacy preview route | Exists, hidden in production | `app/[locale]/rebuild-lab/privacy-draft/page.tsx` (rebuild lab: 404 in production unless `REBUILD_LAB_ENABLED`, noindex) |
| Public Privacy route | **Does not exist** | no route under `app/[locale]/(site)`; footer has no legal links (`components/site/site-footer.tsx:14`) |
| Terms draft or route | **Nothing exists** | no `terms` copy, route or link anywhere |
| Cancellation-policy wording | **Deliberately absent** from tour pages "until" decided | `components/site/tour/tour-detail-view.tsx:29`, `tour-detail-copy.ts:3` |

## 2. RT-80 — review of the existing draft against the current code

The draft's factual statements were already tied to evidence (`privacy-facts-verified.md`). Since it was written (2026-10-11) the repository gained or confirmed things the draft does not mention. These are **gaps to bring to the Owner/legal; none is corrected here.**

| # | Gap or risk | Evidence | What is needed |
|---|---|---|---|
| G1 | **Third-party travel-search widget (Oner)** runs on `/pt/planeje-sua-viagem`: the provider's script and stylesheet are loaded at runtime from `static.onertravel.com` into the visitor's browser. The draft's providers list (Vercel, Neon, Resend, Upstash, OpenAI) and its cookies section do not mention it. | `components/site/oner/oner-widget-loader.ts:7-9`; `app/[locale]/(site)/planeje-sua-viagem/page.tsx` | Ask Oner (provider) what data and cookies the widget processes and who the controller is; Owner/legal decides the wording. The agent must not assume what the widget does. |
| G2 | **Partner-operated tours**: if customer data is passed to a partner (e.g. to request a booking confirmation), the policy must say so. | RT-99/RT-101/RT-102 (manual partner confirmation) | Owner decides the process; then legal wording. Not yet applicable until partner tours exist. |
| G3 | **Future payments** (PSP, passenger data for flights) | RT-65 §13–§14, RT-102 | Out of scope until Sprint 13/Flights; the policy will need a revision when they exist. |
| G4 | **Accounts and bookings**: the draft says data is handled "when you use the account or booking areas". The legacy booking/account area (`/reservas`) still exists but the new public footer has no account links. Whether these features are live for visitors is not verified. | `app/[locale]/(public)/reservas`, `site-footer.tsx:14`, `privacy-facts-verified.md` (NOT verified list) | Owner confirms if accounts/bookings are offered publicly. **Also:** the authentication library sets a **session cookie** when a visitor logs in (`lib/auth.ts:5,43` `nextCookies()`; `proxy.ts:25-26` reads `better-auth.session_token`). The draft's cookies section lists only the attribution cookie and the tab session id, so the policy would be incomplete if login is live. |
| G5 | **Cookie consent**: the draft discloses a 30-day campaign-attribution cookie. Whether a consent banner/mechanism is legally required is a legal decision. | `proxy.ts` (cookie, `maxAge` 30 days), `lib/analytics/attribution.ts` | Legal opinion. |
| G6 | **Minors**: tours have a `childrenAllowed` flag and tariffs have child bands; the policy does not address children's data. | `schema.prisma` `Trip.childrenAllowed`; RT-101 §1 | Legal opinion. |
| G7 | Items the draft itself marks pending: controller legal name / tax ID / address; retention periods (no automatic deletion exists); OpenAI retention statement (needs re-verification before publication); international-transfer basis; Vercel log retention. | `privacy-copy.ts` sections `who`, `retention`, `providers`; `privacy-facts-verified.md` "NOT verified" | Owner supplies; legal reviews. |
| G8 | The draft embeds the public WhatsApp number and e-mail as literals. They match the canonical values today. | `privacy-copy.ts:16, 36` (also `:66`, `:96`), `lib/public-contact.ts:10-14` | Technical: when the page is built, read them from `PUBLIC_CONTACT` instead of duplicating (so a contact change cannot leave the policy stale). |
| G9 | The Daniela section describes a live AI assistant. The assistant is **not enabled** (Owner restriction). If the page is published before Daniela is, the section describes something visitors cannot use. | Owner directive 12/10/2026 ("não habilitar Daniela") | Owner decides whether to publish the Daniela section now or only when she is enabled. |

**Verified negative (reviewed 2026-10-12):** the app code contains **no third-party analytics, tag manager, advertising pixel, session-replay tool or `<iframe>` embed**. The only external script source loaded by the app is the Oner widget loader (G1); the only `<script>` tags are inline JSON-LD. Usage analytics are first-party (`lib/analytics`, `sessionStorage`, the `proxy.ts` attribution cookie), which the draft already discloses. This scopes G1 to a single third party.

## 3. RT-81 — Terms: what the Terms will have to be consistent with

No text is proposed. The list below is **what the product does today and what remains undecided**, so that legal/Owner can write terms that are true.

**Facts from the repository**
- Public conversion is a **guest tour request** (no account, no payment, **no availability confirmation**) stored in `ContactSubmission` and e-mailed to the team (`app/actions/tour-request.ts`, header comment).
- There is **no online payment** on the site (RT-FINAL-04B; RT-65 §2: no payment service, no webhook route).
- Flights: the live search is a third-party widget in Portuguese only; EN/ES show a notice (`app/[locale]/(site)/voos/page.tsx`). The previous Flight Planner prototype used mock data and is not rendered.
- Tour pages state no cancellation policy; none is defined (comment in `tour-detail-view.tsx:29`).
- Two kinds of tours are planned (OWN and PARTNER, RT-99): a PARTNER booking is confirmed manually by the partner (RT-101, RT-102 D2).

**Decisions the Owner / legal must make before any Terms text exists**
| # | Decision | Why it matters |
|---|---|---|
| T1 | Who is the **seller/operator** of each kind of tour (OWN vs PARTNER) and how it is described to the customer | Determines the contracting party and liability wording |
| T2 | **Booking process** and when a booking is "confirmed" (manual confirmation; partner confirmation for PARTNER) | Avoids promising instant confirmation |
| T3 | **Cancellation, change, no-show and refund policy**, per type | Required by RT-81; also needed on tour pages |
| T4 | **Prices, currency, taxes/fees, price changes** (policy only; no values here) | Terms must not conflict with partner tariff rules (the C2Rio tariff can change) |
| T5 | **Payment terms** (when payment is collected; by whom; methods) — only when payments exist | Sprint 13 |
| T6 | **Weather, safety, health/physical-level, age and child rules** | Tour physical levels exist in the catalog |
| T7 | **Limitation of liability, governing law, venue, dispute channel** | Legal |
| T8 | **Intellectual property and use of the site**; user conduct | Legal |
| T9 | Role/limits of **Daniela** (AI) in the Terms vs. the Privacy page | Consistency with the privacy draft's Daniela section |
| T10 | **Third-party services** (flight widget, partners): that their terms apply | Consistency with G1 |
| T11 | **Entity identification**: legal name, tax ID, registration (Cadastur number only with approved evidence and wording) | Same open item as the Privacy controller identity |

## 4. Implementation plan once the Owner approves the text (not started)

1. **Slugs and routes** under `app/[locale]/(site)/` (the existing public pages use Portuguese slugs for all locales, e.g. `/en/quem-somos`; the Owner chooses the slug, e.g. `privacidade` and `termos`, consistent with that convention).
2. **Render from a single typed copy module** per page (as `privacy-copy.ts` already does), reading contact values from `PUBLIC_CONTACT`; remove the draft banner only on the Owner's approval; the draft status constants must flip only by explicit change.
3. **Footer links** in all three locales (`components/site/site-footer.tsx`), and links from the contact/tour-request forms where consent or notice is shown.
4. **SEO**: per-locale metadata, canonical and hreflang (`getLanguageAlternates`), include in `app/sitemap.ts`; keep `noindex` until the Owner approves publication.
5. **Tests**: Playwright public suite (renders in pt/en/es, footer links present, no draft banner in the approved build); a vitest guard that fails if a page shows draft/pending markers while marked approved; contact values come from `PUBLIC_CONTACT`; accessibility check of the pages.
6. **Consistency check** between Privacy, Terms and the commercial facts (T1–T6) before approval.

## 5. What can proceed now vs. what is gated

| Work | Status |
|---|---|
| Inventory of what the site collects and which third parties are involved | Done (`privacy-facts-verified.md` + section 2 above) |
| Gaps list for Owner/legal (G1–G9) | Done — section 2 |
| Terms decision list (T1–T11) | Done — section 3 |
| Technical plan and tests | Done — section 4 |
| Create the public Privacy/Terms routes, footer links, sitemap entries | **Gated**: needs Owner-approved text (and legal review as decided by the Owner). Creating empty or placeholder legal pages in the public site was deliberately not done. |
| Approving or writing any legal wording | **Owner/legal only** |

RT-80 and RT-81 acceptance criteria (pages in PT/EN/ES with footer link, Owner/legal copy) therefore remain **open**.
