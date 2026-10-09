# RT-72 / RT-82 — Shared Rate-Limiter Technical Decision Report

- Date: 2026-10-09. Tickets: RT-72 (RT-RB-AI-06, Concierge) and RT-82 (RT-RB-L-07, public forms; blocks the RT-51 final gate). Jira: decide **one** shared limiter and reuse it; do not duplicate.
- Status: **analysis only. Nothing was purchased, provisioned, installed or coded.** The decision (vendor, cost, subprocessor) belongs to the Owner. Production quotas are intentionally not proposed (RT-72 §3: set them only when expected usage and model cost are known).
- Cost figures are **estimates from public pricing pages read on 2026-10-09 and from stated volume assumptions**, not quotes. Verify before approval.

## 1. Existing infrastructure (audited)

| Item | Finding |
| --- | --- |
| Current limiter | `lib/security/rate-limit.ts`: per-instance in-memory sliding window; resets on cold start; its own header says it is not production-grade. Used only by `app/actions/tour-request.ts` and `app/actions/contact-message.ts` |
| Client key | `clientKeyFromHeaders` trusts the first `x-forwarded-for` value, else a shared `"unknown"` bucket. On the hosting platform this header should be set by the platform; confirm before relying on it |
| Concierge | `/api/ai-concierge` has **no limiter** and is disabled in production; the real runtime (`lib/ai-concierge/runtime`) is not wired to any route |
| Database | Neon Postgres (hostname class checked; no credentials read) via Prisma 7 + `pg` adapter. Any new table is a production schema migration |
| Redis / KV / limiter packages | none installed (`@upstash/*`, `ioredis`, `redis` absent); Vercel KV / Vercel Postgres are no longer offered, Marketplace integrations replace them |
| Hosting | Vercel (project linked). The plan tier (Hobby/Pro/Enterprise) could not be verified here, and it decides WAF rate-limit availability |
| Observability | RT-73 now exposes `limiter_store_errors_total`, a `rate_limited` product event and cost-ceiling alert hooks, all waiting for a limiter to emit them |

## 2. Requirements to satisfy (RT-72 §2, R1–R8)

Shared state across instances/regions; atomic check-and-increment; sliding-window or token-bucket; low latency; separate dev/preview/prod namespaces; hashed keys and counters only; observable; testable with a fake store. Plus: fail **closed** for the model path when the store is down (RT-72 §5), layered with coarse platform protection, dimensions = session, IP/abuse, conversation, burst, cost cap, global emergency ceiling, unknown client (never unlimited).

## 3. Options

| | A. Managed Redis (Upstash via Vercel Marketplace) | B. Existing Neon Postgres table | C. Vercel WAF rate-limit rules | D. Runtime Cache / improved in-memory |
| --- | --- | --- | --- | --- |
| R1 shared / R2 atomic | Yes; atomic scripts, sliding window via the standard library | Yes with `INSERT … ON CONFLICT DO UPDATE … RETURNING` (fixed window); sliding window needs more work; a hot global row can contend | Yes at the edge; per-rule fixed window (token bucket Enterprise only) | **No.** Per-region/ephemeral, no atomic counters guaranteed |
| Dimensions | All (session, conversation, cost, global) | All, but cost/global counters on one row | **IP/header-level only**: cannot enforce conversation, token or cost caps | n/a |
| Latency (R4) | Low (HTTP/REST to a regional endpoint; typically a few ms to tens of ms) | Medium; Neon scale-to-zero cold starts can add hundreds of ms on the first request | None added in the app | Lowest, but not valid |
| New vendor / dependency | Yes: Upstash (new subprocessor) + 2 npm packages | No | No (platform feature) | No |
| Prod schema change | No | **Yes** (new table + purge job) | No | No |
| Fail-closed handling | Straightforward | Straightforward; DB outage already breaks bookings | n/a (platform) | n/a |
| Fit for RT-82 forms | Yes (replace the in-memory limiter) | Yes | Partial (IP only) | No |
| Ops burden | Low (managed) | Low–medium (migration, cleanup cron, connection pressure) | Low | None |

D is rejected: it cannot meet R1/R2. C is **complementary**, not sufficient alone (RT-72 §2 "layering").

## 4. Estimated monthly cost (assumptions, not quotes)

Assumptions: each Concierge request performs 3 limiter checks (IP burst, session/conversation, global ceiling) and each check costs about 3 Redis commands, so about 9 commands per request. Forms traffic is small and ignored.

| Monthly Concierge requests | A. Upstash pay-as-you-go | A'. Upstash fixed plan | B. Neon table | C. WAF rule |
| --- | --- | --- | --- | --- |
| 10,000 | $0 (≈90k commands; free tier 500k) | $10 (250 MB) — unnecessary at this size | ≈ $0 incremental (30k writes) | ≈ $0.01 |
| 100,000 | ≈ $0.80 (900k commands; 400k billable at $0.20 / 100k) | $10 | ≈ $0 incremental, but adds steady write load | ≈ $0.05 |
| 1,000,000 | ≈ $17 (9M commands; 8.5M billable) | $10–20 (more commands than a small plan may allow; confirm limits) | write load becomes noticeable; Neon compute cost not estimable without the plan | ≈ $0.50 |

Reference prices seen: Upstash Redis pay-as-you-go $0.20 per 100K commands, free tier 500K commands/month, 256 MB, fixed 250 MB plan $10/month; Vercel WAF rate limiting $0.50 per 1M allowed requests (regional), fixed-window on all plans per current docs, token bucket Enterprise. Not verified: whether the Marketplace free tier equals the direct free tier; whether WAF rate limiting is included on the current Vercel plan (older pages say Pro/Enterprise); Neon plan limits. **A model call costs far more than the limiter**: the limiter is protection for the spend, not a material cost.

## 5. Security implications

- **Keys**: store only HMAC-SHA-256 of IP/session/conversation identifiers with a server secret and an environment namespace prefix; never raw IPs. A hashed IP is still personal data under LGPD, so keep TTL equal to the window (minutes to a day), and disclose it on the Privacy page (RT-70).
- **New subprocessor (option A)**: Upstash must be added to the privacy/legal review and region chosen deliberately; only hashed keys and counters are sent. Credentials are Marketplace-injected server-only environment variables, never `NEXT_PUBLIC_*`, rotated through the vendor.
- **Fail closed**: if the store is unreachable the model/retrieval path is not called (degraded response + handoff, already supported by RT-74/RT-71); static handoff stays available.
- **Spoofing**: use the platform-provided client address, not a client-controlled `x-forwarded-for` value; keep a strict bucket for unknown clients, never unlimited.
- **Enumeration/uniformity**: same response shape for limited and unknown identities; `Retry-After` only.
- **Cost safety**: counters increment before the paid call; failed calls still count; a global emergency ceiling and a kill switch are required before RT-75.
- **Bot/abuse layer**: platform bot protection or a challenge on suspicious traffic complements counters (RT-90 SEC-63).

## 6. Recommendation

**One shared limiter = Option A behind a small provider-independent `RateLimitStore` interface, layered under Option C for coarse IP flood protection.**

1. Build the interface (get/increment with TTL, atomic) with an in-memory **fake** for tests (R8) and a Redis adapter; both RT-72 (Concierge dimensions) and RT-82 (replace the in-memory limiter in the two form actions) consume it, so nothing is duplicated.
2. Use a Redis service from the Vercel Marketplace: atomic sliding window, integrated billing and credential injection, no production database migration, estimated $0 to about $20/month across plausible volumes, a small fraction of the model spend it protects.
3. If the Owner prefers **no new vendor**, the fallback is Option B (Neon table behind the same interface), accepting added latency, a production migration, a purge job, and weaker handling of the hot global counter. Because the interface is the same, switching later is a small change.
4. Quotas are set afterwards from measured RT-73 usage and cost data, not guessed now.

## 7. Owner decisions required

1. Approve the vendor class: managed Redis via the Vercel Marketplace (recommended) vs. the existing Neon database (no new vendor).
2. Approve the expected monthly cost range (about $0–20) and a hard monthly ceiling for the limiter.
3. Confirm the Vercel plan and whether to enable WAF rate-limit rules (cost about $0.50 per 1M allowed requests).
4. Add the chosen store to the privacy/legal review as a subprocessor (hashed identifiers, short TTL), together with the open RT-70 items.
5. After RT-73 produces measurements: set initial quotas and the global emergency ceiling.

Not started: RT-72 and RT-82 implementation, package installation, Marketplace provisioning, WAF rules, database migration.
