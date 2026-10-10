import { randomBytes } from "node:crypto";
import { getServerObservability } from "@/lib/ai-concierge/observability";
import { clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { readLimiterConfig } from "./config";
import { createLimiter, type FailMode, type Limiter } from "./limiter";
import { createMemoryStore } from "./memory-store";
import { createUpstashStore } from "./upstash-store";
import type { LimiterEvent, RateLimitRule } from "./types";

/**
 * Server-side composition of the ONE shared limiter (RT-72 Concierge + RT-82 public forms).
 * Upstash Redis (Free plan, USD 0) is used when configured; otherwise the behaviour is explicit:
 *  - "closed" limiters (Concierge) deny the model path;
 *  - "degrade" limiters (public forms) use the per-instance fallback, counted and warned about once per process.
 */
const processSalt = randomBytes(32).toString("hex"); // used only when no HMAC secret is configured: identifiers stay opaque
let warnedFallback = false;
const limiters = new Map<FailMode, Limiter>();
const fallbackStore = createMemoryStore();

function recordEvent(event: LimiterEvent) {
  try {
    getServerObservability().metrics.recordLimiterEvent(event);
  } catch {
    /* telemetry is best-effort */
  }
  if (event.type === "fallback_in_use" && !warnedFallback) {
    warnedFallback = true;
    // Content-free, once per process: the degradation is visible to operators, never silent.
    console.warn(`[rate-limit] shared store unavailable (${event.reason}); using the per-instance fallback for public forms`);
  }
}

export function getLimiter(failMode: FailMode, env: Record<string, string | undefined> = process.env): Limiter {
  const cached = limiters.get(failMode);
  if (cached) return cached;
  const config = readLimiterConfig(env);
  const secret = config?.secret ?? (env.RATE_LIMIT_HMAC_SECRET && env.RATE_LIMIT_HMAC_SECRET.length >= 32 ? env.RATE_LIMIT_HMAC_SECRET : processSalt);
  const limiter = createLimiter({
    store: config ? createUpstashStore({ url: config.url, token: config.token }) : null,
    fallbackStore: failMode === "degrade" ? fallbackStore : undefined,
    secret,
    namespace: config?.namespace ?? "local",
    failMode,
    onEvent: recordEvent,
  });
  limiters.set(failMode, limiter);
  return limiter;
}

export function resetLimitersForTests() {
  limiters.clear();
  warnedFallback = false;
}

/** Same numbers as before the shared limiter existed (5 attempts / 10 minutes per client), now counted in the shared store. */
export const FORM_LIMIT = { limit: 5, windowSeconds: 600 } as const;

export async function isFormSubmissionLimited(headers: { get(name: string): string | null }, form: "contact_message" | "tour_request") {
  const rule: RateLimitRule = { name: `form_${form}`, ...FORM_LIMIT };
  const result = await getLimiter("degrade").check({ rule, dimension: `form:${form}`, identifier: clientKeyFromHeaders(headers) });
  return !result.allowed;
}
