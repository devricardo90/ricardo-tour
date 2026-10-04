# RT-58 / RT-59 / RT-60 — Domain Foundation (reactivated 2026-10-03)

- Tickets: RT-58 (RT-RB-F-01), RT-59 (RT-RB-F-02), RT-60 (RT-RB-F-03). Related: RT-39.
- Target domain: **ricardotour.com**.
- History preserved: domain/DNS work was deferred by the Owner on 2026-10-02 (Source of Truth §12.2). It is **reactivated on 2026-10-03** because of new provider evidence (§1). The earlier deferral is not rewritten.
- Sections 1–8 record the state **as verified on 2026-10-03** (historical). **§9 records the final state completed and verified on 2026-10-04 and supersedes the planned values in §4–§7.** The Owner performed the DNS, Vercel and environment changes; no agent changed DNS, Vercel or environment.
- Timeline: deferred 2026-10-02 → reactivated 2026-10-03 (provider requirement) → **completed 2026-10-04**.

## 1. Provider evidence (Oner Travel, relayed by the Owner, 2026-10-03)

- The agency must already have its own URL.
- The URL is essential for release of the search engine.
- The agency must submit the widget request form.
- Oner may take up to 72 business hours to respond after submission.

`PROVIDER_REQUIREMENT: CUSTOM_DOMAIN_REQUIRED_FOR_WIDGET_RELEASE`

Limits of this evidence: it concerns the **widget / search-engine release**. It does **not** prove API access, and no API capability is inferred. The statement was relayed by the Owner; no written provider document has been received yet. RT-39 remains `BLOCKED / EXTERNAL_DEPENDENCY`. New immediate blocker: the production domain must be live before the widget request can proceed.

The public widget request page (read 2026-10-03) adds: the widget works only on the specified domain and will not display in local, editing or development environments (so Preview URLs will not show it); behavior on Wix or shared hosting is not guaranteed; response within 72h of submission; questions to widget@onertravel.com. This is from the public form page, not from a provider commitment to Rick Travel.

## 2. Verified state (2026-10-03, from this machine)

| Item | Finding | Source |
| --- | --- | --- |
| Registrar | **PDR Ltd. d/b/a PublicDomainRegistry.com** (IANA 303) | Verisign RDAP |
| Registration / expiry | registered 2025-06-11, expires **2027-06-11**; status `client transfer prohibited` (normal lock); last changed 2026-05-11 | Verisign RDAP |
| Registrant identity | not exposed in RDAP (privacy). **Ownership by the Owner is not verified by this evidence.** | RDAP |
| Delegated nameservers | `NS00080.HOSTGATOR.COM.BR`, `NS00081.HOSTGATOR.COM.BR` | RDAP |
| DNSSEC | not signed | RDAP |
| DNS resolution | **fails**: SERVFAIL via local resolver, 1.1.1.1 and 8.8.8.8; Cloudflare DoH reports "No Reachable Authority at delegation" (the HostGator servers answer SERVFAIL) | nslookup, DoH |
| A / AAAA / MX / CNAME | not obtainable (zone unreachable) | same |
| HTTPS | `https://ricardotour.com` and `www` do not resolve; no certificate state | curl |
| Vercel account in CLI | authenticated as `devricardo90`, scope `devricardo90s-projects` | vercel whoami |
| Vercel project | `rick-travel` (`prj_Euy5UFIp5BDIlObYqL0uRM0GR7jD`) | `.vercel/project.json` |
| Domains attached in Vercel | **none** (0 domains in the team) | vercel domains ls |
| ricardotour.com attached elsewhere in Vercel | not in this team; other accounts unknown | same |
| Production fallback | `https://rick-travel.vercel.app` responds (307 → `/pt`) | curl |
| `PUBLIC_SITE_URL` in Vercel | **not set** in Production/Preview/Development. Site falls back to `https://rick-travel.vercel.app` (`lib/public-site-url.ts`) | vercel env ls |
| Other env present | `DATABASE_URL`, `RESEND_API_KEY`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `AI_CONCIERGE_ENABLED`, `NEXT_PUBLIC_AI_CONCIERGE_ENABLED` | vercel env ls (values not read) |

Interpretation: the domain exists and is delegated to HostGator Brazil, whose nameservers are not answering for it (zone missing, account suspended, or server fault; the cause is not determinable from outside). The earlier evidence in `rt-57-public-promotion.md` (2026-10-01) is unchanged.

## 3. RT-58 — status

**Not satisfied; requires an Owner action.** A registered domain is not proof that the Owner controls the registrar account, and RDAP hides the registrant. Registrar and DNS access cannot be verified by an agent.

Owner action required (any one confirms access):

1. Log in to the **PublicDomainRegistry.com** account (or the reseller/panel the domain was bought through, possibly via HostGator) and confirm `ricardotour.com` is listed there; **or** log in to the HostGator panel that holds the DNS zone.
2. Confirm in writing on RT-58: "ricardotour.com is the definitive production domain; I have registrar access at <where>; I have DNS access at <where>."
3. Tell the agent **whether e-mail currently works on the domain** (see §6 risk).

## 4. RT-59 — status

**Not started — blocked on RT-58 and registrar/DNS access.** Nothing was attached in Vercel: the DNS zone is unreachable, so a Vercel attachment could not be verified, and the attach step is gated on Owner access.

### 4.1 Canonical host decision (proposed)

**[Superseded 2026-10-04 — final canonical host is `https://www.ricardotour.com`, see §9.]** Proposed at the time: `ricardotour.com` (apex); `www.ricardotour.com` redirects to it (permanent redirect, configured in Vercel). Rationale: it matches the Owner's stated target and the public contact address (`contato@ricardotour.com`); one canonical host keeps canonical/hreflang/sitemap consistent. The Owner may choose `www` instead; the decision must be recorded before RT-60 activation.

### 4.2 DNS options (Owner action at the registrar/DNS host)

**Option A — point nameservers to Vercel (simplest; Vercel manages the zone).** At the registrar set nameservers to Vercel's (shown in the Vercel dashboard when the domain is added; Vercel's documented values are `ns1.vercel-dns.com` and `ns2.vercel-dns.com`). **Risk:** this replaces the whole zone. Any existing records (MX for e-mail, SPF/DKIM, other subdomains) must first be recreated in Vercel DNS. Because HostGator currently does not answer, existing records cannot be read, so this must be decided with the Owner's knowledge of the e-mail setup.

**Option B — keep the current DNS host and add records** (requires the HostGator zone to be restored/working first):

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | `76.76.21.21` *(legacy value; **not used** — see §9)* |
| `www` | CNAME | `cname.vercel-dns.com` *(legacy value; **not used** — see §9)* |

Vercel may show project-specific values when the domain is added. **The values shown in the Vercel dashboard are authoritative over this table.** Confirm them at attach time.

### 4.3 Steps once access exists (agent can then execute, with Owner approval)

1. `vercel domains add ricardotour.com rick-travel` (and `www.ricardotour.com`) — Owner approval first.
2. Owner applies the DNS records or nameservers from §4.2.
3. Wait for propagation; verify with DoH/nslookup.
4. Verify certificate issued by Vercel and HTTPS valid on apex and `www`.
5. Configure `www` → apex redirect; check for redirect loops (`curl -I` both hosts).
6. Verify PT/EN/ES public routes (`/pt`, `/en`, `/es`, `/tours`, `/quem-somos`, `/contato`).
7. Keep `rick-travel.vercel.app` working. Do not remove it. Rollback: remove the domain from the Vercel project (or revert DNS); the vercel.app host is unaffected.

Acceptance (from the ticket): domain resolves, valid certificate, redirect behavior documented, rollback path noted.

## 5. RT-60 — environment contract and activation gate

Status: **contract prepared; activation not performed.** Nothing was set in Vercel.

### 5.1 `PUBLIC_SITE_URL`

- Value on activation: ~~`https://ricardotour.com`~~ **`https://www.ricardotour.com`** (final canonical host, §9; the earlier planned value is obsolete).
- Accepted by `lib/public-site-url.ts` only when set, starting with `https://`, and not containing `localhost`; otherwise the fallback `https://rick-travel.vercel.app` applies.
- Scope: **Production only.** Preview and Development keep the fallback so preview pages do not claim the production canonical.
- Activation gate: set only **after** the domain resolves, HTTPS is valid and the redirect rules are verified (§4.3). No production env change without Owner approval. A redeploy is required for the value to take effect.

### 5.2 Impact on code paths that read it (verified by reading the repo)

| Surface | Source | Effect on activation |
| --- | --- | --- |
| Root metadata, `metadataBase`, OG url | `app/[locale]/layout.tsx` | canonical base becomes the new host |
| Per-page OG url | `(site)/page.tsx`, `quem-somos`, `contato` | follow `PUBLIC_SITE_URL` |
| `sitemap.xml` | `app/sitemap.ts` | base URL and per-locale alternates move to the new host |
| `robots.txt` | `app/robots.ts` | sitemap URL moves to the new host |

hreflang alternates are built through the same helpers and follow the host. **Note:** a root-level `robots.ts` still hardcodes `https://ricktravel.com.br`; it was recorded as inert in the current build (`current-home-baseline.md`). It is not changed here (no unrelated code change) and is flagged for RT-63 SEO activation.

### 5.3 Other values that must be reviewed at cutover (not changed now)

| Item | Why |
| --- | --- |
| `BETTER_AUTH_URL` (Preview, Production, currently a secret) | auth callbacks/cookies and trusted origins must match the production host; a mismatch can break login. Verify its current value before activation. |
| Mercado Pago webhook / return URLs (`MP_WEBHOOK_SECRET`, `MP_ACCESS_TOKEN`) | notification and return URLs configured at the provider may point at the old host. MP variables are not currently listed in Vercel env; confirm where they are configured. |
| `RESEND_API_KEY` and sender | sender is `reservas@ricktravel.com.br` by design (`lib/services/tour-request-notification.ts`); domain verification for Resend is RT-61/RT-62, a separate chain. |
| Preconnect `https://api.ricktravel.com` | legacy host in `app/[locale]/layout.tsx`; flagged only. |
| `.env.example` | does not document `PUBLIC_SITE_URL` (risk 9 in `current-home-inventory.md`). Proposed: add a commented entry when RT-60 is executed. Not changed now. |

### 5.4 Do not activate before resolution

Domain-dependent SEO assumptions (canonical, sitemap, robots host, Search Console submission, social links) are not activated until the domain actually resolves correctly (RT-63).

## 6. Risks

1. **E-mail may break if nameservers move (Option A).** The public contact is `contato@ricardotour.com`; the domain's current mail service (likely HostGator) is unknown. Do not change nameservers before the e-mail setup is known.
2. **Oner widget will not work on Preview/localhost** (public form page). Widget testing happens only on the production domain.
3. **72h response time** after the form submission starts only when the Owner submits; it is not started by this work.
4. Registrant ownership unproven (RT-58).

## 7. Oner widget form readiness (not submitted)

Form: `https://onertravel.com/solicitacao-de-widget/` (fields read from the public page 2026-10-03; all four are required).

| Field (as labeled) | Value | State |
| --- | --- | --- |
| Nome do Solicitante | Owner's name as the requester | **Owner to provide** |
| CNPJ da Agência | Ricardo Tour agency CNPJ | **Owner to provide** (not in the repository; not invented) |
| E-mail do Solicitante | requester e-mail | **Owner to provide** (the site's public contact is `contato@ricardotour.com`, but that mailbox depends on the e-mail setup in §6; the Owner chooses) |
| Link do site em que será adicionado o widget | **`https://www.ricardotour.com`** (final canonical host, §9) | **READY** — domain live over HTTPS (verified 2026-10-04) |

Pre-submission checklist:

- [ ] RT-58 confirmed by the Owner (§3)
- [ ] Domain attached, DNS correct, HTTPS valid (RT-59)
- [ ] Public site on the domain serves PT/EN/ES routes, not an error page
- [ ] The URL entered is the canonical host (no redirect surprise)
- [ ] The Owner submits the form manually; the submission date is recorded on RT-39
- [ ] Record Oner's answer (due within 72h of submission) as written evidence on RT-39

Submitting the form is an Owner action. This work did not submit anything.

## 8. Status summary (as of 2026-10-03; superseded by §9)

| Ticket | State |
| --- | --- |
| RT-39 | `BLOCKED / EXTERNAL_DEPENDENCY`; evidence `CUSTOM_DOMAIN_REQUIRED_FOR_WIDGET_RELEASE` recorded; not complete |
| RT-58 | reactivated; **Owner action required** (registrar access confirmation) |
| RT-59 | reactivated; not started; blocked on RT-58 and DNS access |
| RT-60 | contract prepared; activation gated on RT-59 |

## 9. Final state (completed 2026-10-04)

Source: Owner manual validation on 2026-10-04, plus read-only checks by the agent on 2026-10-04 (DNS-over-HTTPS, HTTP headers and page source). No DNS, Vercel or environment change was made by the agent.

| Item | Final state | Agent re-check 2026-10-04 |
| --- | --- | --- |
| Canonical production URL | **`https://www.ricardotour.com`** | — |
| DNS provider | HostGator remains the DNS provider (nameservers `ns00080.hostgator.com.br`, `ns00081.hostgator.com.br`) | confirmed (NS) |
| Apex `ricardotour.com` | `A 216.198.79.1` | confirmed |
| `www.ricardotour.com` | `CNAME 3dbc0dde6b93740b.vercel-dns-017.com` | confirmed |
| Legacy Vercel values (`76.76.21.21`, `cname.vercel-dns.com`) | **not used; do not replace the records above with them** | — |
| E-mail | Titan preserved: MX 10 `mx1.titan.email`, MX 20 `mx2.titan.email`; SPF and DKIM configured; **no DMARC yet** (future improvement, **not** a blocker for RT-58/59/60) | MX confirmed; `_dmarc` returns NXDOMAIN |
| Vercel project | `rick-travel`; `www.ricardotour.com` = Valid Configuration, **Production**; `ricardotour.com` = Valid Configuration, **308 redirect to www** | apex returns `308` → `https://www.ricardotour.com/` |
| HTTPS | working on both hosts; apex redirects over HTTPS | confirmed (no TLS errors) |
| Technical fallback | `rick-travel.vercel.app` remains available | responds (307 → `/pt`) |
| `PUBLIC_SITE_URL` | Production = `https://www.ricardotour.com`; production redeploy succeeded | effect visible in output below |
| `robots.txt` | `Sitemap: https://www.ricardotour.com/sitemap.xml` | confirmed |
| `sitemap.xml` | URLs on `https://www.ricardotour.com`; `/voos` absent | confirmed (0 `voos` entries) |
| Canonical `/pt` | `https://www.ricardotour.com/pt` | confirmed |
| hreflang | `pt`, `en`, `es` → `/pt`, `/en`, `/es` on www; `x-default` → `/pt` | confirmed |
| `og:url` | `https://www.ricardotour.com/pt` | confirmed |
| `/voos` mock route | not in sitemap; `noindex, nofollow` | confirmed |

### 9.1 Ticket outcomes

- **RT-58** — satisfied: domain control confirmed operationally by Owner access to HostGator/cPanel; DNS management access confirmed; definitive production domain confirmed; canonical host `www.ricardotour.com`.
- **RT-59** — satisfied: custom domain attached, DNS correct, `www` Production, apex 308 to `www`, HTTPS valid, HostGator DNS and Titan e-mail records preserved, `vercel.app` fallback kept. Rollback path: remove the domain from the Vercel project or revert the two DNS records; `rick-travel.vercel.app` is unaffected.
- **RT-60** — satisfied for the `PUBLIC_SITE_URL` activation and SEO URL checks listed above. Items in §5.3 that were flagged for cutover review (`BETTER_AUTH_URL`, Mercado Pago return/webhook URLs, the inert root `robots.ts`, the legacy `api.ricktravel.com` preconnect) were **not part of this validation and are not changed here**; they remain tracked for RT-63 (SEO activation) and the auth/payment tickets.
- **RT-39** — `DOMAIN_PREREQUISITE = SATISFIED`. Still `BLOCKED / EXTERNAL_DEPENDENCY`; remaining blocker `ONER_WIDGET_REQUEST_AND_PROVIDER_RESPONSE` (§9.2).

### 9.2 Oner widget form readiness

`ONER_FORM_URL_READY = YES` — production URL to submit: **`https://www.ricardotour.com`**. The form has not been submitted; the Owner submits it manually. Requester name, agency CNPJ and requester e-mail are still **Owner-provided** and are not in the repository or invented here. After submission: record the date on RT-39 and wait for Oner's reply (up to 72 business hours per Oner's statement). The domain prerequisite does not prove API access.
