// Best-effort, in-memory rate limiter shared by the public forms (RT-55 tour request, RT-56 contact message).
//
// HONEST LIMIT: state lives in one server instance's memory. On serverless/multi-instance deployments each instance
// counts separately and restarts reset the counters, so this slows casual abuse but is NOT a durable, distributed
// limit. A shared store (for example a database or Redis) is launch debt, not solved here.

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records this attempt and returns true when the caller is over the limit. */
    isLimited(key: string, now: number = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return true;
      }
      recent.push(now);
      hits.set(key, recent);
      return false;
    },
  };
}

/** Client key for rate limiting: the first forwarded address, otherwise a shared "unknown" bucket. */
export function clientKeyFromHeaders(h: { get(name: string): string | null }) {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
