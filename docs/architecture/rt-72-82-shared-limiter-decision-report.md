# RT-72 / RT-82 — Shared Rate Limiter: Decision and Implementation Record

- Tickets: RT-72 (RT-RB-AI-06, Concierge) and RT-82 (RT-RB-L-07, public forms; blocks the RT-51 final gate). Jira rule: decide **one** shared limiter and reuse it.
- **Owner decision (2026-10-10): APPROVED — Upstash Redis, FREE plan only. Monthly budget USD 0. Paid upgrades, pay-as-you-go, automatic upgrades, paid provisioning and purchases are NOT authorized.** This replaces the earlier recommendation that started from pay-as-you-go. The "about USD 20" figure in the first version of this report was a planning estimate, **not** a spending budget. Neon PostgreSQL stays the fallback architecture only (no Neon tables or migrations were created).
- Status: **code implemented and tested; real Upstash NOT provisioned; production NOT activated.** Creating the Upstash database requires an external account/resource and acceptance of terms, so it is waiting for the Owner's explicit authorization of that specific action (§8).

## 1. Existing infrastructure (audited)

| Item | Finding |
| --- | --- |
| Old limiter | `lib/security/rate-limit.ts`: per-instance, in-memory, reset on cold start; used only by the contact and tour-request actions (5 attempts / 10 min, keyed by the raw client IP in process memory). The Concierge had none |
| Database | Neon Postgres, hostname region token `eu-west-2` (London); Prisma 7 + `pg`. Not used for rate limiting (Owner decision) |
| Hosting | Vercel; no `vercel.json`/`vercel.ts` in the repo, so the function region is whatever the project setting says (Vercel default for new projects is `iad1`, Washington D.C.). **The plan tier and the actual function region could not be confirmed here** (Vercel CLI not installed; the Vercel connector requires an interactive login). Pending Owner check |
| Redis packages | none installed. The adapter uses plain `fetch` against the Upstash REST API, so **no new npm dependency** was added |
| Observability | RT-73 layer reused: `rate_limited` product event, `limited` request bucket, `limiter_store_errors_total` now emitted |

## 2. Upstash Free plan — current limits (official pages read 2026-10-10)

Sources: `upstash.com/pricing/redis`, `upstash.com/docs/redis/overall/billing`, Upstash troubleshooting pages.

| Item | Value / finding | Confidence |
| --- | --- | --- |
| Price | $0 / month; "Every account starts with a free database. No credit card required." | official |
| Commands | **500K commands / month** | official |
| Data size / bandwidth | 250 MB (pricing page; other pages say 256 MB) / 10 GB | official |
| Throughput | 10,000 commands/second; max request size 10 MB | official |
| Databases | 1 free database | official |
| Upgrade | "When you entered your credit card, your database will be upgraded automatically." **Therefore never enter a card; no card is needed for Free** | official |
| What counts | "one command is one billable request"; each command inside a pipeline/transaction is billed individually | official |
| EVAL / Lua counting | **not documented**. The adapter assumes the worst case: EVAL + INCR (+ EXPIRE on the first hit of a window) = up to 3 commands per check | unverified |
| Quota exhaustion | Documented error text: `ERR max requests limit exceeded` (monthly); an older page mentions a *daily* cap of 10,000 (`ERR max daily request limit exceeded`). **The HTTP status is not documented** (429 was not confirmed). The adapter treats any error body matching those texts, HTTP 429 and any other failure as a closed `quota_exhausted` / `unavailable` store error | partly unverified |
| Inactivity | not stated on the Free plan page | unverified |
| Regions | not listed on the pricing page; choose at creation | unverified |
| Marketplace | pricing "same as going direct" in Vercel's 2024 announcement; whether the Marketplace free plan matches the direct free plan was **not** confirmed | unverified |

**Daily-cap ambiguity:** because one Upstash page still mentions 10,000 commands per day, §3 also shows that stricter worst case.

## 3. Free-plan budget (estimate, worst case)

Commands per check ≤ 3 (assumed). A Concierge request performs up to 3 checks (IP burst, session, global ceiling) ⇒ ≤ 9 commands; a form submission performs 1 check ⇒ ≤ 3 commands.

| Quota assumption | Max Concierge requests | Max form submissions |
| --- | --- | --- |
| 500K / month (official) | ≈ 55,000 / month | ≈ 166,000 / month |
| 10K / day (older page, worst case) | ≈ 1,100 / day | ≈ 3,300 / day |

Quota protection built in: (a) blocked keys are denied from a local deny-cache until their window ends, so a flood on a blocked key costs **zero** commands; (b) the chain stops at the first denial; (c) malformed requests never reach the limiter; (d) a circuit breaker stops calling a failing store; (e) the kill switch costs nothing. Residual risk: an attacker rotating many IPs can still consume the free quota, after which the Concierge model path is denied (fail closed, **USD 0 and no OpenAI spend**) and the forms degrade to the per-instance fallback. Platform WAF rate-limit rules (a separate, separately approved decision) are the complementary coarse layer. **If the Free plan proves insufficient, usage and options will be reported and no upgrade will be made without explicit Owner approval.**

## 4. Architecture (implemented)

`lib/rate-limit/` — one limiter for everything:

- `types.ts` provider-independent contracts (`RateLimitStore.hit`, closed error classes, content-free events).
- `memory-store.ts` the **only** in-memory implementation (tests, form fallback, legacy API wrapper). Bounded (5,000 entries, O(1) eviction).
- `upstash-store.ts` Upstash REST adapter: **one round trip and one atomic EVAL per check** (`INCR`, `EXPIRE` only when the key is new); fixed window, window index inside the key, TTL = window + 5 s, 1.5 s timeout; no Upstash analytics or other endpoints are contacted.
- `limiter.ts` HMAC-SHA-256 opaque keys (`rl:<env>:<rule>:<32-hex>`), per-environment namespace, local deny-cache, circuit breaker (3 failures → 30 s), fail modes: **closed** (Concierge) and **degrade** (forms: explicit per-instance fallback, announced once and counted, still enforcing the old 5-per-10-minutes limit).
- `config.ts` server-only configuration with strict shape validation (https, `*.upstash.io` host only, no credentials in the URL, secret ≥ 32 characters). `KV_REST_API_*` aliases are accepted.
- `server.ts` singletons, the form helper and observability wiring. `lib/security/rate-limit.ts` is now a thin wrapper over the memory core.
- Concierge policy `lib/ai-concierge/runtime/limits.ts`: kill switch → IP burst → session → global ceiling; limits come **only** from `AI_CONCIERGE_RATE_LIMITS` (no invented quotas); absent/invalid ⇒ the model path is denied. `handleConciergeMessage(raw, env, client)` has no path to the model that skips the limiter. New outcome `RATE_LIMITED` (HTTP 429 + `Retry-After` is for the future route), handoff H5, no counts or windows revealed.
- Forms: `app/actions/contact-message.ts` and `app/actions/tour-request.ts` call `isFormSubmissionLimited` (same 5 / 10 min numbers). Until Upstash exists they behave exactly as before, with a warning and a metric.

## 5. Privacy and security

Redis receives only: an opaque 32-hex HMAC key per (dimension, identifier), a counter and a TTL. It never receives raw IPs, e-mails, phones, booking ids, messages, prompts, answers or histories (tested with canary strings against the wire protocol). Every key expires by itself (window + 5 s, at most 31 days for a configured window). Upstash analytics are not used. The bearer token and HMAC secret are server-only environment variables (mark as Sensitive; never `NEXT_PUBLIC_*`; never logged — errors carry a closed class only). A hashed IP is still personal data: the **subprocessor/privacy review through RT-70 is required before production activation**. The client address must come from the platform; `x-forwarded-for` handling should be verified on Vercel before launch. A Redis failure exposes no customer data.

## 6. Reliability (behavior and test status)

| Scenario | Behavior | Evidence |
| --- | --- | --- |
| Timeout / connection loss | closed class; Concierge denied (fail closed), forms degrade to fallback; breaker avoids repeated waits | emulator-verified |
| Free quota exhausted / 429 / auth / 5xx / malformed | same, with the specific class counted in `limiter_store_errors_total` | emulator-verified |
| Concurrency | 60 parallel checks vs limit 10 ⇒ exactly 10 allowed | emulator-verified (atomic by construction: 1 EVAL) |
| Shared across instances | two limiter instances with separate local state share one budget through the store | emulator-verified |
| TTL | keys carry window + 5 s and disappear; a new window starts at 1 | emulator-verified |
| OpenAI cost | 100 simultaneous requests ⇒ model calls ≤ global ceiling; blocked, store-failed, unconfigured and kill-switch paths make **0** provider calls; counters are consumed before the paid call | deterministic (fake provider) |
| Real Upstash behavior (latency, real atomicity, real TTL, real error shapes, quota behavior, EVAL counting) | **not verified** | pending live test |

"Emulator-verified" means the real adapter ran over real local HTTP sockets against an in-process emulator of the REST protocol; it does **not** prove Upstash behavior.

## 7. Test evidence (2026-10-10)

- New: `tests/rate-limit-core.test.ts` (23), `rate-limit-upstash.test.ts` (15, emulator), `rate-limit-concierge.test.ts` (23), `rate-limit-forms.test.ts` (7); `tests/rate-limit-upstash-live.test.ts` (4, **skipped** until `UPSTASH_LIVE_TEST=1` with real credentials; budget < 200 commands).
- Full Vitest: 25 files passed, 1 skipped (live); 345 passed, 4 skipped (68 new tests passing). TypeScript, ESLint, RT-69 regression and the production build: see the commit/Jira record.
- Defects found and fixed by the tests: memory-store cap off by one and O(n) work under key-rotation floods; a misleading no-op fail-open branch removed from the limiter before use.

## 8. Deployment dependencies and Owner actions (nothing below was done)

1. **Authorize creating the Upstash Free database** (external account/resource and acceptance of terms; no payment details). Prefer provisioning through the Vercel Marketplace Upstash integration **only after** the Owner confirms the Marketplace free plan has no card requirement; otherwise create it directly at Upstash without a card.
2. Confirm the **Vercel plan** and the actual **Vercel Function region**, then create the database in the same region (Neon is in `eu-west-2`; if functions run in `iad1`, a London Redis adds roughly one transatlantic round trip per check). If latency matters, the three Concierge checks can later be sent in one pipelined request (same command count, one round trip).
3. Set server-only variables in Vercel (Sensitive): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HMAC_SECRET`; for the Concierge also `AI_CONCIERGE_RATE_LIMITS` (quotas to be chosen from RT-73 measurements) — never in Git or Jira.
4. Run the live test once (`UPSTASH_LIVE_TEST=1 npx vitest run tests/rate-limit-upstash-live.test.ts`) and record the results here.
5. Complete the RT-70 subprocessor/privacy review. Production Concierge and UI stay disabled until RT-75.

## 9. Superseded analysis

The first version of this report compared four options (managed Redis, a Neon table, Vercel WAF rules, in-memory/Runtime Cache) and priced Upstash pay-as-you-go. The Owner chose Upstash **Free only**; the Neon option remains the documented fallback behind the same `RateLimitStore` interface; WAF rules remain a possible complementary layer needing their own approval; pay-as-you-go estimates are retained only as context and are not approved.
