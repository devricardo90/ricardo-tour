# Privacy facts verified from the code (2026-10-11) — evidence for the RT-80 draft

Draft texts: `lib/legal/privacy-copy.ts` (PT/EN/ES), reviewable at `/{pt,en,es}/rebuild-lab/privacy-draft` (production-hidden). **Owner approval: PENDING. Legal review: PENDING (in-depth review deferred by the Owner; no lawyer has approved anything).** Not linked from the footer, not published.

| Statement in the draft | Evidence in the repository |
| --- | --- |
| Contact and tour-request forms store name, e-mail, optional phone and message in the database and e-mail a copy to the team | `prisma/schema.prisma` `ContactSubmission`; `app/actions/contact-message.ts`, `app/actions/tour-request.ts`; `lib/services/tour-request-notification.ts` (Resend) |
| Account/session data includes IP address and user agent | `prisma/schema.prisma` `Session.ipAddress/userAgent` (Better Auth) |
| Usage events carry a random session id (tab-scoped), page path and campaign attribution | `lib/analytics/client.ts` (`sessionStorage`), `prisma` `AnalyticsEvent`, `app/api/analytics/route.ts` |
| Campaign attribution cookie, 30 days | `proxy.ts` (`maxAge: 60*60*24*30`), `lib/analytics/attribution.ts` |
| Site errors/performance logged as path-only records in the platform logs | `lib/observability/*` (RT-64) |
| Daniela: no conversation stored by us; history only in the panel's memory | `lib/ai-concierge/ui/state.ts`, `components/ai-concierge/concierge-mount.tsx`, tests forbid storage/cookies in panel and mount |
| Messages go to OpenAI to generate the answer, `store: false` | `lib/ai-concierge/runtime/openai.ts` |
| Limiter keeps counters tied to an irreversible hash of IP/session id, expiring in seconds-hours | `lib/rate-limit/*` (HMAC keys, TTL = window + 5 s) |
| Content-free events (panel opened, WhatsApp click, errors, limits, tokens) | `lib/ai-concierge/observability/*`, `app/api/ai-concierge/events/route.ts` |
| WhatsApp/e-mail opened with an editable prefilled message; no history transmitted | `lib/ai-concierge/runtime/handoff.ts` (closed prefill), tests |
| Providers: Vercel, Neon, Resend, Upstash, OpenAI | `docs/ops/*`, `lib/prisma.ts`, `lib/resend.ts`, `lib/rate-limit/upstash-store.ts`, `lib/ai-concierge/runtime/openai.ts` |

## NOT verified (written as such in the draft, or left for the Owner)

- Legal entity name, tax ID, address of the controller.
- Retention periods for contact messages, accounts, bookings and analytics: **no automatic deletion exists in the code**; the Owner must define them.
- OpenAI's retention (the draft says "up to 30 days for security per the documentation consulted; may change; verify before publication"): not independently re-verified today.
- Whether the account/booking features are live for visitors.
- International-transfer basis (providers outside Brazil) and the LGPD legal bases: legal review.
- Vercel runtime-log retention on the plan finally chosen for commercial hosting.
