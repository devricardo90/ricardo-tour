/**
 * RT-72 / RT-82 shared rate limiter — provider-independent contracts.
 * One limiter serves the AI Concierge and the public forms. Stores keep ONLY temporary counters under opaque keys.
 */
export type RateLimitRule = {
  /** Short stable name used inside the key (e.g. "burst", "session", "global", "form"). */
  name: string;
  limit: number;
  windowSeconds: number;
};

export type HitResult = {
  allowed: boolean;
  /** Attempts counted in the current window, including this one. */
  count: number;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export type StoreErrorClass = "timeout" | "connection" | "quota_exhausted" | "auth" | "unavailable" | "malformed" | "unconfigured";

/** Carries only a closed class — never provider text, URLs or credentials. */
export class RateLimitStoreError extends Error {
  constructor(readonly errorClass: StoreErrorClass) {
    super(errorClass);
    this.name = "RateLimitStoreError";
  }
}

export interface RateLimitStore {
  /** Atomically counts one attempt for `key` in the fixed window containing `nowMs`. Keys expire on their own (TTL). */
  hit(key: string, rule: RateLimitRule, nowMs?: number): Promise<HitResult>;
}

/** Content-free limiter telemetry (counts and closed strings only). */
export type LimiterEvent =
  | { type: "checked"; namespace: string; rule: string; allowed: boolean; source: "store" | "local_deny_cache" | "fallback" }
  | { type: "store_error"; namespace: string; rule: string; errorClass: StoreErrorClass; breaker: "closed" | "open" }
  | { type: "fallback_in_use"; namespace: string; reason: "unconfigured" | StoreErrorClass };
