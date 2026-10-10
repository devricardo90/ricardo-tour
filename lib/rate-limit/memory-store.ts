import type { HitResult, RateLimitRule, RateLimitStore } from "./types";

/**
 * Fixed-window counter in process memory. It is the single in-memory implementation: used by tests, as the explicit
 * degraded fallback for the public forms, and (through lib/security/rate-limit.ts) by the legacy limiter API.
 * It is per server instance and resets on cold start, so it is never the production protection for the Concierge.
 */
const MAX_ENTRIES = 5_000;
const SWEEP_EVERY = 1_000;

export function createMemoryCore() {
  const counters = new Map<string, { count: number; expiresAt: number }>();
  let inserts = 0;

  const sweepExpired = (nowMs: number) => {
    for (const [key, entry] of counters) if (entry.expiresAt <= nowMs) counters.delete(key);
  };

  return {
    size: () => counters.size,
    hit(key: string, rule: RateLimitRule, nowMs: number = Date.now()): HitResult {
      const windowMs = rule.windowSeconds * 1000;
      const index = Math.floor(nowMs / windowMs);
      const windowEnd = (index + 1) * windowMs;
      const slot = `${key}:${index}`;
      let entry = counters.get(slot);
      if (!entry) {
        // New slot: occasionally drop expired windows, and keep a hard cap by evicting the oldest slot in O(1)
        // (Map keeps insertion order), so a key-rotation flood can neither grow memory nor make every hit O(n).
        if (++inserts % SWEEP_EVERY === 0) sweepExpired(nowMs);
        while (counters.size >= MAX_ENTRIES) {
          const oldest = counters.keys().next().value;
          if (oldest === undefined) break;
          counters.delete(oldest);
        }
        entry = { count: 0, expiresAt: windowEnd };
        counters.set(slot, entry);
      }
      entry.count += 1;
      const allowed = entry.count <= rule.limit;
      return {
        allowed,
        count: entry.count,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - entry.count),
        retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - nowMs) / 1000)),
      };
    },
  };
}

export function createMemoryStore(now: () => number = Date.now): RateLimitStore {
  const core = createMemoryCore();
  return { hit: async (key, rule, nowMs) => core.hit(key, rule, nowMs ?? now()) };
}
