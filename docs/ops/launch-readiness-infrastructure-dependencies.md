# Launch Readiness — Infrastructure Dependencies (mandatory before commercial launch)

- Recorded: 2026-10-10, from the Owner decision "Infrastructure decision deferred".
- Status: **DEFERRED, NOT CANCELLED.** The final hosting and production-infrastructure decision is postponed to the Launch Readiness phase (Sprint 8, gate RT-51). Development continues on the current infrastructure without purchases or migrations.
- Jira holders (no new ticket was created): **RT-51** (Owner final gate + production validation), **RT-49** (Vercel Preview final + Owner checklist), **RT-50** (cutover and rollback plan), **RT-82** and **RT-72** (production rate limiter), **RT-84** (production monitoring review).

## Owner decisions in force

1. Continue developing the website; keep the current infrastructure; **no** purchase of Vercel Pro, **no** migration to a VPS or HostGator at this stage.
2. Keep the Upstash Redis **Free** architecture for the shared rate limiter (USD 0/month; no paid upgrade).
3. RT-72 and RT-82 stay in Revisar until their remaining acceptance criteria are satisfied.
4. The public AI Concierge is **not** activated; no privacy, security or commercial-hosting gate is bypassed.
5. **The current Vercel Hobby environment is not approved for commercial production use.**

## Why Hobby cannot be the commercial production environment (factual basis)

Vercel Fair Use Guidelines (page updated 2026-09-14): "Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan." Commercial usage is any deployment used for the financial gain of anyone involved in any part of the production of the project, for example advertising the sale of a product or service, or processing payment from visitors. A tour agency site that advertises and sells tours is commercial. (The plan actually in use has not been verified: the Vercel login is still pending, see the verification list below.)

## Mandatory Launch Readiness checklist (all must be satisfied before commercial launch)

| # | Dependency | Current state | Needs | Jira holder |
| --- | --- | --- | --- | --- |
| 1 | **Compliant commercial hosting** (e.g. Vercel Pro or another compliant host) chosen and in place | Deferred. Hobby in use for development | Owner decision, budget approval, migration or upgrade plan, rollback plan | RT-51, RT-49, RT-50 |
| 2 | Production Function region matched to data stores | Verified `iad1`; Neon is `eu-west-2` | Decide region alignment (functions ↔ database ↔ Redis) with the hosting decision | RT-51, RT-84 |
| 3 | Production shared rate limiter | Code complete and validated on a dev/test Upstash database; **no production database or credentials** | Create the production Upstash Free database (no card), Sensitive env vars, re-run live tests from the production region; RT-51 verifies | RT-82, RT-72, RT-51 |
| 4 | Edge flood protection for public forms | Proposal only (one WAF rate-limit rule, Log mode first) | Owner authorization after the plan is known | RT-82 |
| 5 | Production monitoring, log retention and alerting | Baseline not built; platform log retention depends on the plan | RT-64 baseline, RT-84 final review, retention tied to the hosting choice | RT-64, RT-84 |
| 6 | Privacy and subprocessor validation | Pending legal review (OpenAI, Upstash, hosting; international transfers; hashed IP is personal data) | RT-70 legal review and published Privacy page | RT-70, RT-80 |
| 7 | Production environment variables and secrets | Not configured (by design) | Sensitive Production/Preview variables, rotation process | RT-51, `docs/ops/secrets.md` |
| 8 | Domain, DNS and HTTPS | Owner-deferred | Part of the hosting decision | RT-63, RT-50 |
| 9 | Public AI Concierge activation | Disabled; backend foundation validated | RT-75 Owner gate after items 1, 3, 5, 6 | RT-75 |
| 10 | Production validation of all of the above | Not started | Owner final gate | RT-51 |

## Facts still to be verified when the Owner is ready (none of these block development)

- The actual Vercel plan and the Preview/Production environment variable configuration (needs the Owner's Vercel login or a statement of the plan).
- Marketplace terms for the Upstash free plan; behaviour at real free-quota exhaustion; latency from the production region.
- Cost of the chosen compliant hosting at expected traffic, including WAF rate-limit pricing if used.

## What does NOT depend on this decision (work continues)

AI Concierge experience and UI prototype (isolated, non-public), tour catalog work, UX/UI refinements, and commercial functionality that is provider-neutral or specification-only. Anything blocked by infrastructure, privacy or an existing dependency is recorded on its ticket and the next independent task proceeds.
