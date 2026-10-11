# Hosting for the commercial launch — free-tier evaluation (2026-10-11)

Owner constraints: minimum fixed cost, **no paid plan contracted**, Vercel Hobby is NOT authorized for commercial hosting, **no public deploy, no migration** and no change to the application architecture just to change host. This is a recommendation, not an action. The current configuration keeps working untouched.

## What was verified (sources fetched today)

| Provider / plan | Verified facts | What could NOT be verified |
| --- | --- | --- |
| **Vercel Hobby** (current) | Vercel's Fair Use Guidelines (updated 2026-09-14): "Hobby teams are restricted to non-commercial personal use only. All commercial usage ... requires either a Pro or Enterprise plan." Commercial usage includes any deployment used for the financial gain of anyone involved, "advertising the sale of a product or service" and processing payment from visitors | Nothing missing: the rule is explicit. **Hobby cannot be the commercial host** |
| **Netlify Free** | Pricing page: Free = $0 with **300 credits**; bandwidth 20 credits/GB, compute 10 credits/GB-hour, 15 credits per production deploy (so about 15 GB or 30 GB-hours or 20 deploys per credit pool). Community reports and third-party guides: the limit is **hard**, all sites on the team are **paused** until the next cycle when credits run out, and some users report pauses well before the dashboard showed the limit | Netlify's pricing page does not address commercial use on Free; the terms of service were not read. Function timeouts and exact SSR limits were not on the page |
| **Cloudflare Workers Free** | Official limits page: 100,000 requests/day (Error 1027 beyond), **10 ms CPU per request**, 50 subrequests, 128 MB memory, 64 MiB script (another source says 3 MiB compressed on Free), 1 s startup. Next.js runs there through the OpenNext adapter (no edge runtime) | Commercial use on Free is not addressed by the limits page; the terms were not read. Whether *this* app fits the 10 ms CPU / script-size limits was not built or measured |

## Assessment for this application

- The app is a Next.js 16 App Router site with SSR pages, next-intl, Better Auth, Prisma + Neon, server actions, and the Concierge API calling OpenAI. It is not a static site.
- **Cloudflare Workers Free** is the likeliest to hit hard technical limits (10 ms CPU per request for SSR, script size, 50 subrequests), and would need the OpenNext adapter plus code and Prisma adapter changes: a real migration with unproven benefit. Not recommended without a measured proof of concept.
- **Netlify Free** can run Next.js SSR, but the **hard 300-credit cap that pauses every site** is a business risk for a commercial site (a traffic spike or several deploys takes the whole site down for the rest of the cycle), and commercial permission on Free is not confirmed.
- No option was found that is simultaneously: $0, explicitly allowed for commercial use, compatible with this app without migration work, and safe from a hard shutdown.

## Recommendation

1. **Do not publish commercially on Vercel Hobby.** Keep using it only for development and previews.
2. **Treat a paid plan as the realistic path to commercial launch** (Vercel Pro is the only option that needs no migration and is explicitly licensed for commercial use). Its current price must be confirmed on Vercel's pricing page at purchase time (not verified here); the decision and the spend are the Owner's.
3. If the Owner insists on $0 hosting, the only low-risk next step is a **time-boxed proof of concept on Netlify Free** (a clone, not production) after the Owner or I read Netlify's terms and confirm commercial use is permitted, measuring: build success, SSR latency, credits consumed per 1,000 visits, and behavior when credits run out. Cloudflare Workers Free should only be considered after a measured PoC proves the CPU and size limits are met.
4. **Daniela's own free-tier components stay as decided:** Upstash Free (limiter), OpenAI usage-based (about US$0.0003 to 0.001 per model-answered question depending on the model; the V1 cap of 300 messages/day bounds the worst case at about US$0.09/day with gpt-6-luna or US$0.35/day with gpt-4.1-mini, measured on the 84-case evaluation, and cheaper in practice because gate and recommendation answers need no model), Resend and Neon as already used.

## Changes needed for any migration (for planning only)

Environment variables (`DATABASE_URL`, `BETTER_AUTH_*`, `OPENAI_*`, `UPSTASH_*`, `RATE_LIMIT_HMAC_SECRET`, `RESEND_API_KEY`, `PUBLIC_SITE_URL`), the domain and DNS (RT-63), the region next to Neon (eu-west-2) and Upstash, the Concierge launch guard variables, and a rollback plan (RT-50). None of this was started.

## Risks if the Owner launches on a free plan anyway

A platform terms violation (Hobby), an unplanned site pause (Netlify credits), or SSR failures from CPU limits (Cloudflare Free). Each can take the commercial site offline at the worst moment.
