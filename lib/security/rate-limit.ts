// Legacy synchronous API kept for compatibility. RT-82: there is now ONE limiter implementation. The counting core is
// lib/rate-limit/memory-store.ts and the shared, distributed limiter is lib/rate-limit (Upstash Redis Free plan when
// configured). The public forms use the shared limiter through lib/rate-limit/server.ts; this wrapper no longer owns
// any counting logic of its own.
import { createMemoryCore } from "@/lib/rate-limit/memory-store";

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const core = createMemoryCore();
  const rule = { name: "legacy", limit, windowSeconds: windowMs / 1000 };
  return {
    /** Records this attempt and returns true when the caller is over the limit. In memory only: per instance. */
    isLimited(key: string, now: number = Date.now()) {
      return !core.hit(key, rule, now).allowed;
    },
  };
}

/** Client key for rate limiting: the first forwarded address, otherwise a shared "unknown" bucket. It is HMAC'd before it reaches any store. */
export function clientKeyFromHeaders(h: { get(name: string): string | null }) {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
