# RT-72 / RT-82 — Shared Rate Limiter: Decision, Implementation and Live Validation Record

- Tickets: RT-72 (RT-RB-AI-06, Concierge) and RT-82 (RT-RB-L-07, public forms; blocks the RT-51 final gate). Jira rule: **one** shared limiter, reused.
- **Owner decisions:** (2026-10-10) Upstash Redis, **Free plan only, USD 0/month**, no paid upgrade, no card, no pay-as-you-go, no automatic upgrade. (2026-10-10, later) creation of an Upstash Free database, free registration if needed, acceptance of standard free-service terms, development/test credentials and live tests are authorized; **production activation and payment are not**. Neon stays fallback only (no Neon tables/migrations). The "about USD 20" figure of the first draft was a planning estimate, never a budget.
- Status: **code implemented; real Upstash validated against a DEVELOPMENT/TEST database; production database and production environment variables NOT created; production Concierge/UI disabled.**

## 1. Verified infrastructure (2026-10-10)

| Item | Result | How verified |
| --- | --- | --- |
| Production Function region | **`iad1` (Washington, D.C.)** | Three read-only GETs of `https://www.ricardotour.com/api/health` returned `X-Vercel-Id: arn1::iad1::…` (edge `arn1` = where the probe entered; function region = `iad1`). Not inferred from Neon |
| Vercel plan | **NOT verified** | Not exposed by headers; the Vercel CLI is not installed, the browser extension is not connected and the Vercel connector needs an interactive OAuth login (see §10 action A) |
| Neon database region | `eu-west-2` (London) | hostname token. Functions in `iad1` therefore query Neon across the Atlantic on each request — a separate latency finding, out of scope here |
| Client address trust | **Safe to use** | Vercel docs (request headers): `x-forwarded-for` is the client's public IP and Vercel *overwrites* the header and does not forward external IPs, to prevent spoofing. `clientKeyFromHeaders` (first entry) is therefore appropriate. Not re-proven empirically in a deployment |
| Development / preview environment | Vercel project environment variables **not inspected or changed** (no access). Local development uses `.env.local` (Git-ignored) | — |
| WAF rate limiting availability and cost | See §7 | Vercel docs (WAF rate limiting page updated 2026-08-28; usage-and-pricing page) |

## 2. Upstash Free plan — corrected facts

Sources (official, read 2026-10-10): `upstash.com/pricing/redis`, `/docs/redis/overall/billing`, `/docs/redis/troubleshooting/max_requests_limit`, `/docs/redis/troubleshooting/max_daily_request_limit`, `/docs/devops/developer-api/start-redis/create`.

| Item | Current official statement |
| --- | --- |
| Commands | **500K commands per month** |
| Data / bandwidth / rate | 250 MB; 10 GB; 10,000 commands/second; max request 10 MB |
| Databases | 1 free database |
| Card | "Every account starts with a free database. No credit card required." Entering a card later upgrades automatically — **never enter one** |
| Billing unit | One command is one billable request; each command inside a pipeline or transaction is billed individually |
| Quota exhaustion | `ERR max requests limit exceeded` — "exceeds the max **monthly** request count limit" |

**Correction:** the earlier "10,000 commands per day" figure is **withdrawn**. It came from a community thread and an older error page; Upstash's current "max daily request limit" page gives **no number** and does not say it applies to the Free plan. The monthly 500K limit is the current limit.

**Remaining uncertainty (documented separately):** (a) the HTTP status returned at monthly exhaustion is not documented (the adapter treats any non-2xx or error body as a closed store error, so behaviour does not depend on it); (b) whether an *account* free database differs from the instant database used for testing (the same pricing page is used for both); (c) whether the Vercel Marketplace free plan has the same terms; (d) the Free plan's idle/inactivity policy is not stated; (e) the existence of a "daily limit" page suggests a possible daily cap — if one exists it is not published.

## 3. Development/test database (real Upstash)

- Created through Upstash's documented instant-database endpoint (`POST https://upstash.com/start-redis`, no account, no card, no API key), using the documented `Idempotency-Key` and `User-Agent` headers. This is **scratch infrastructure for validation only**: it expires **2026-10-13** unless claimed in an Upstash account, and Upstash states it must not be used for production or PII.
- Credentials are in the Git-ignored `.env.local` only (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HMAC_SECRET` generated locally, plus a non-secret metrics URL for the live scripts). Nothing is in Git, Jira, logs or this report. The database id appeared once in the interactive session output; the database contains only opaque counters and expires on its own.
- Region: not disclosed by the response. **Do not use this database to choose the production region.**
- No production credentials were created; the Vercel environment was not touched.

## 4. Live evidence — REAL Upstash vs emulator

**Real Upstash (development/test database, measured from the developer workstation):**

| Check | Result |
| --- | --- |
| Gated live test `UPSTASH_LIVE_TEST=1 npx vitest run tests/rate-limit-upstash-live.test.ts` | **6/6 passed**: config valid; atomic limit under real concurrency across two independent limiter instances; real TTL window rollover; wrong token ⇒ closed class `auth`; **Concierge chain on the real store** (limit 3: 3 answered, 2 `RATE_LIMITED`, the fake provider was called exactly 3 times, so limited requests never reach the model); **forms degrade path against a real 401** (fallback used, 5 allowed then limited) |
| Concurrency / shared counters | 60 simultaneous checks (30 on each of two limiter instances, limit 10) ⇒ **exactly 10 allowed**, 0 store errors |
| Latency (workstation → database, 20 sequential checks) | min 122 ms, p50 **144 ms**, p95 161 ms, max 410 ms. **Not representative** of Vercel `iad1` → Redis latency; re-measure after the production database exists |
| TTL | Real keys carry TTL = window + 5 s (30 s window ⇒ 34–35 s observed); a 2 s-window key was **gone after 8.5 s** |
| Privacy canaries | After sending raw IP, e-mail, phone, booking-id and message-like identifiers, `KEYS` showed only `rl:<ns>:<rule>:<32 hex>:<window>` keys; **0 canaries** in any key; every key had a TTL |
| Redis error responses | wrong token ⇒ HTTP 401 `WRONGPASS…`; unknown command ⇒ 400 `ERR Command is not available…`; script error ⇒ 400 `ERR Error running script…` |
| Adapter error classes | wrong token ⇒ `auth`; 1 ms timeout ⇒ `timeout`; unresolvable host ⇒ `connection` |
| **Billable commands per check** | **First check of a window (creates the key): exactly 3 commands (EVAL + INCR + EXPIRE). Existing-key check: exactly 2 (EVAL + INCR).** Measured with 40 + 40 checks on the database's own metrics counter after it settled (120 and 81 commands = 3·40 and 3 + 2·39). Upstash **does** bill the commands inside the Lua script |
| Free-quota consumption | about 640 commands so far (0.13 % of 500K) across all validation; the quota was not stressed |

**Emulator only (NOT proof of Upstash behaviour):** quota-exhaustion error bodies/status (400 text and 429), 5xx, malformed JSON, dropped sockets, slow responses, circuit-breaker timing, fallback behaviour. Real quota exhaustion was deliberately not triggered.

**Not yet verified (pending):** behaviour at real quota exhaustion; latency from Vercel `iad1`; the production database; the production environment variables; Marketplace terms.

## 5. Architecture (unchanged; see git history for the code)

`lib/rate-limit/`: provider-independent `RateLimitStore`; Upstash REST adapter (plain `fetch`, no new dependency, one round trip and one atomic EVAL per check, TTL = window + 5 s, 1.5 s timeout, no Upstash analytics); HMAC-SHA-256 opaque keys with an environment namespace; local deny-cache (a blocked key costs **zero** commands); circuit breaker (3 failures ⇒ 30 s); fail modes **closed** (Concierge) and **degrade** (forms: counted, announced per-instance fallback that still enforces 5 / 10 min); a single in-memory implementation shared with the legacy wrapper. Concierge policy in `lib/ai-concierge/runtime/limits.ts`: kill switch → IP burst → session → global ceiling; limits only from `AI_CONCIERGE_RATE_LIMITS`; `RATE_LIMITED` outcome; no path to the model without the limiter. Free-plan budget (measured): ≤ 3 commands per check, so ≤ 9 per Concierge request (3 checks) and ≤ 3 per form submission ⇒ at most ≈ 55,000 Concierge requests or ≈ 166,000 form submissions per month on the free quota, in the worst case where every check creates a key.

Design note kept: the three Concierge checks stay **sequential with short-circuit**. Pipelining them would save two round trips, but a blocked client would then also consume session and global counters, letting abusers burn the global emergency ceiling; correctness outranks a few milliseconds.

## 6. Reliability matrix

| Scenario | Behaviour | Evidence |
| --- | --- | --- |
| Redis timeout / connection loss | Concierge: model path denied, handoff offered, 0 OpenAI calls. Forms: per-instance fallback, counted and announced | emulator + real error classes |
| Free quota exhausted | same as above; USD 0 | emulator (real exhaustion not triggered) |
| Required limiter configuration missing (credentials, HMAC secret, limits) | Concierge denied; forms use the counted fallback | deterministic tests |
| Limit exceeded / global ceiling / kill switch | `RATE_LIMITED`, 0 provider calls | deterministic tests |
| 100 simultaneous Concierge requests | model calls ≤ the global ceiling | deterministic tests (fake provider) |
| Concurrency and cross-instance sharing | exactly `limit` admitted | **real Upstash** + emulator |
| Redis failure exposes customer data | impossible by design: Redis only ever receives opaque keys and counters | real key inspection |

## 7. Public form protection — review and strategy

**Current layers:** server validation; Next.js same-origin check for Server Actions; hidden honeypot (fake success, nothing stored); the shared limiter (5 attempts / 10 min per client, separate counters per form); store-first pipeline (a notification problem never loses a message). Until the production database and variables exist, the limiter in production is **still the old per-instance one** (counted fallback): this is not sufficient as the sole serverless protection, so the production database (§10) is a launch prerequisite (RT-51 verifies it).

**Vercel WAF facts (docs, 2026-10-10):** custom rules and IP blocking are free on all plans; WAF **rate limiting is available on all plans**: Hobby = 1 rule per project, 1,000,000 allowed requests included, window 10 s–10 min, keys IP / JA4; Pro = 40 rules, usage-based (regional price shown in the dashboard dialog before the first rule); Enterprise adds header/User-Agent keys, token bucket, 1 h windows. Counters are per region. Firewall-mitigated traffic does not consume CDN requests or Fast Data Transfer. Attack Mode (challenge) is a free emergency lever.

**Proposed production strategy (NOT applied; changing production firewall settings needs separate Owner authorization):**
1. Keep the app-level limiter as the precise, per-form control.
2. Add **one** edge rule as flood protection that costs nothing on Hobby: condition `Method = POST` **and** `Request header next-action` present (Server Actions), keyed by IP, fixed window 60 s, **start with action `Log`** for a week, then switch to `Default (429)` after reviewing the observed traffic. The numeric limit is the Owner's call from observed traffic (the app limiter's 5 per 10 min is the real per-form limit; the edge rule only has to be well above human behaviour). One rule fits the Hobby allowance; Pro pricing is expected to be negligible at this traffic (the dashboard dialog shows the exact price).
3. Emergency lever: Attack Mode during an active flood.
4. Legitimate submissions are preserved: a visitor who is rate-limited sees the existing friendly message and the WhatsApp/e-mail alternatives; nothing is deleted; the edge rule uses the IP only, handled by Vercel.
5. Optional later (needs approval and a cost check): bot detection / challenge on form pages.
No layer stores personal information beyond what visitors already submit through the forms.

## 8. Concierge cost protection and quota proposal (for the Owner to approve; nothing is configured)

Fail-closed rules are unchanged: OpenAI is never called when Redis is unavailable, the limit or the global ceiling is exceeded, limiter configuration is missing, or the kill switch is active.

**Measured and published inputs.** RT-73 live measurement (development model `gpt-4.1-mini`, one factual question): 2,524 input tokens, 32 output tokens; recommendation questions use more evidence (assume up to about 4,000 input / 150 output). Official OpenAI pricing (read 2026-10-10): `gpt-4.1-mini` $0.40 per 1M input and $1.60 per 1M output tokens ⇒ generation costs about **$0.0011 (measured) to $0.0019 (assumed upper)** per answered request. The retrieval step uses the direct vector-store search endpoint, whose price is **not published**; the file-search *tool* is priced at $2.50 per 1,000 calls, so a conservative assumption is up to $0.0025 per request. Conservative total ≈ **$0.0044**; measured-generation-only ≈ **$0.0011**. Vector-store storage is free up to 1 GB. The production model is still undecided, so these figures must be recomputed when it is chosen.

**Global daily ceiling = ⌊monthly OpenAI budget ÷ 30 ÷ cost per request⌋ (answered requests per day):**

| Monthly OpenAI budget (Owner to choose) | Conservative ($0.0044) | Measured ($0.0011) |
| --- | --- | --- |
| USD 5 | ≈ 37 / day | ≈ 150 / day |
| USD 10 | ≈ 75 / day | ≈ 300 / day |
| USD 25 | ≈ 190 / day | ≈ 750 / day |

**Per-client limits (proposal):** burst per IP ≈ 6 requests / 60 s (human typing pace, tolerates short NAT sharing); session ≈ 30 requests / hour per anonymous session; both only need to stop scripted loops since the global ceiling bounds spend. **Redis is not the binding constraint:** at the conservative ceiling of 190 requests/day the Concierge uses at most 190 × 9 = 1,710 commands/day ≈ 51,000/month (≈ 10 % of the free allowance).

`AI_CONCIERGE_RATE_LIMITS` example for a USD 10 budget with the conservative figure (illustration only, **not configured**): `{"burst":{"limit":6,"windowSeconds":60},"session":{"limit":30,"windowSeconds":3600},"global":{"limit":75,"windowSeconds":86400}}`. Final production quotas and the monthly OpenAI budget are the Owner's separate decision, to be revisited with real RT-73 measurements after launch.

## 9. Privacy (RT-70 gate preserved)

Redis stores only an opaque HMAC key, a counter and a TTL ≤ window + 5 s (the longest configurable window is 31 days). No raw IP, e-mail, phone, booking id, message, prompt, answer or history, and no permanent visitor memory; Upstash analytics are not used (the adapter calls no analytics endpoint). The HMAC secret and the bearer token are server-only variables (Sensitive in Vercel, never `NEXT_PUBLIC_*`, never logged: errors carry a closed class only). A hashed IP is still personal data and Upstash is a new subprocessor: the **RT-70 subprocessor/privacy review (including the production region and any international transfer) must be completed before production activation.**

## 10. Deployment dependencies — Owner actions (nothing below was done)

A. **Vercel access** for the plan and project settings: open the one-time Vercel authorization link issued by the connector in the working session and finish the login (or send the plan name and a screenshot of Settings → Functions → Function Regions). Needed to choose between Hobby/Pro WAF behaviour and to confirm Preview/Production environment configuration.
B. **Production database:** after A, create the production Upstash Free database (claimed in an Upstash account, no card) in **`us-east-1` (N. Virginia), co-located with `iad1`** — or in a different region if the verified Function setting differs — and re-run the live test and the latency measurement from `iad1`. The instant test database must not be used in production.
C. Set Production/Preview variables (Sensitive): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HMAC_SECRET` (≥ 32 random characters); later `AI_CONCIERGE_RATE_LIMITS` once quotas are approved. Production activation of the Concierge stays blocked by RT-75.
D. Optional WAF rule per §7 (Owner authorization).
E. RT-70 subprocessor/privacy review.

## 11. Test evidence

- Deterministic/emulator: `tests/rate-limit-core.test.ts` (23), `rate-limit-upstash.test.ts` (15, emulator), `rate-limit-concierge.test.ts` (23), `rate-limit-forms.test.ts` (7).
- Real Upstash: `tests/rate-limit-upstash-live.test.ts` (6, run with `UPSTASH_LIVE_TEST=1`, passed; skipped in normal runs) and the re-runnable scripts `scripts/rt-72-live-evidence.ts` and `scripts/rt-72-live-command-cost.ts` (results in §4).
- Full suite, TypeScript, ESLint, RT-69 regression and production build: see the commit/Jira record.
