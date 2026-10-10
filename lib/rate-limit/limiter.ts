import { createHmac } from "node:crypto";
import { RateLimitStoreError, type LimiterEvent, type RateLimitRule, type RateLimitStore, type StoreErrorClass } from "./types";

/** "closed": a store failure denies (Concierge: cost safety outranks availability). "degrade": a store failure falls back to the in-memory store, visibly (public forms). */
export type FailMode = "closed" | "degrade";

export type LimiterOptions = {
  /** null = the shared store is not configured. */
  store: RateLimitStore | null;
  /** Per-instance store used only in "degrade" mode. */
  fallbackStore?: RateLimitStore;
  /** HMAC secret (server-only). Identifiers are never stored or logged in clear. */
  secret: string;
  namespace: string;
  failMode: FailMode;
  onEvent?: (event: LimiterEvent) => void;
  now?: () => number;
  /** Consecutive store failures before the breaker opens, and how long it stays open. */
  breaker?: { threshold: number; cooldownMs: number };
};

export type CheckInput = { rule: RateLimitRule; dimension: string; identifier: string };
export type CheckResult = {
  allowed: boolean;
  /** True only when the visitor exceeded the limit (as opposed to being denied by a store failure). */
  limited: boolean;
  retryAfterSeconds: number;
  /** The per-instance fallback answered instead of the shared store. */
  degraded: boolean;
  storeError?: StoreErrorClass;
};

/** Opaque, non-reversible identifier: HMAC-SHA-256 of "dimension\nidentifier", truncated. */
export function opaqueId(secret: string, dimension: string, identifier: string) {
  return createHmac("sha256", secret).update(`${dimension}\n${identifier}`).digest("hex").slice(0, 32);
}

const DENY_CACHE_MAX = 2_000;

export function createLimiter(options: LimiterOptions) {
  const { store, fallbackStore, secret, namespace, failMode } = options;
  const now = options.now ?? Date.now;
  const breakerConfig = options.breaker ?? { threshold: 3, cooldownMs: 30_000 };
  const emit = (event: LimiterEvent) => {
    try {
      options.onEvent?.(event);
    } catch {
      /* telemetry is best-effort */
    }
  };
  // Keys already known to be over the limit are denied locally until their window ends, so an abuser cannot burn the
  // free-plan command quota by hammering a key that is already blocked.
  const denyUntil = new Map<string, number>();
  let failures = 0;
  let openUntil = 0;

  const storeFailure = (rule: RateLimitRule, errorClass: StoreErrorClass, nowMs: number): CheckResult => {
    emit({ type: "store_error", namespace, rule: rule.name, errorClass, breaker: nowMs < openUntil ? "open" : "closed" });
    // Never fails open here: the only permitted degradation is the explicit, counted fallback store (degradeToFallback).
    return { allowed: false, limited: false, retryAfterSeconds: 30, degraded: false, storeError: errorClass };
  };

  return {
    async check({ rule, dimension, identifier }: CheckInput): Promise<CheckResult> {
      const nowMs = now();
      const key = `rl:${namespace}:${rule.name}:${opaqueId(secret, dimension, identifier)}`;

      const blockedUntil = denyUntil.get(key);
      if (blockedUntil !== undefined) {
        if (nowMs < blockedUntil) {
          emit({ type: "checked", namespace, rule: rule.name, allowed: false, source: "local_deny_cache" });
          return { allowed: false, limited: true, retryAfterSeconds: Math.max(1, Math.ceil((blockedUntil - nowMs) / 1000)), degraded: false };
        }
        denyUntil.delete(key);
      }

      const degradeToFallback = async (reason: "unconfigured" | StoreErrorClass): Promise<CheckResult> => {
        emit({ type: "fallback_in_use", namespace, reason });
        const hit = await fallbackStore!.hit(key, rule, nowMs);
        emit({ type: "checked", namespace, rule: rule.name, allowed: hit.allowed, source: "fallback" });
        return { allowed: hit.allowed, limited: !hit.allowed, retryAfterSeconds: hit.allowed ? 0 : hit.retryAfterSeconds, degraded: true, storeError: reason === "unconfigured" ? undefined : reason };
      };

      if (!store) {
        if (failMode === "degrade" && fallbackStore) return degradeToFallback("unconfigured");
        return storeFailure(rule, "unconfigured", nowMs);
      }
      if (nowMs < openUntil) {
        if (failMode === "degrade" && fallbackStore) return degradeToFallback("unavailable");
        return storeFailure(rule, "unavailable", nowMs);
      }

      try {
        const hit = await store.hit(key, rule, nowMs);
        failures = 0;
        if (!hit.allowed) {
          if (denyUntil.size >= DENY_CACHE_MAX) denyUntil.clear();
          denyUntil.set(key, nowMs + hit.retryAfterSeconds * 1000);
        }
        emit({ type: "checked", namespace, rule: rule.name, allowed: hit.allowed, source: "store" });
        return { allowed: hit.allowed, limited: !hit.allowed, retryAfterSeconds: hit.allowed ? 0 : hit.retryAfterSeconds, degraded: false };
      } catch (error) {
        const errorClass = error instanceof RateLimitStoreError ? error.errorClass : "unavailable";
        failures += 1;
        if (failures >= breakerConfig.threshold) openUntil = nowMs + breakerConfig.cooldownMs;
        if (failMode === "degrade" && fallbackStore) {
          emit({ type: "store_error", namespace, rule: rule.name, errorClass, breaker: nowMs < openUntil ? "open" : "closed" });
          return degradeToFallback(errorClass);
        }
        return storeFailure(rule, errorClass, nowMs);
      }
    },
  };
}
export type Limiter = ReturnType<typeof createLimiter>;
