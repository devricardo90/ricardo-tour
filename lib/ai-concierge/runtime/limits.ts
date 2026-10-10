import type { Limiter } from "@/lib/rate-limit/limiter";
import type { RateLimitRule, StoreErrorClass } from "@/lib/rate-limit/types";
import type { RuntimeEvent } from "./types";

/**
 * RT-72 Concierge limit policy on top of the shared limiter (lib/rate-limit).
 * Order (cheapest first, RT-72 §4): kill switch -> IP burst -> session -> global ceiling. The first denial stops the chain,
 * so a blocked client costs at most the commands already spent. Counters are incremented BEFORE any retrieval or model
 * call, so a failed model call still counts. Production quotas are NOT defined here: they come from configuration and,
 * until configured, the model path is denied (never unlimited).
 */
export type ConciergeLimits = { burst: RateLimitRule; session: RateLimitRule; global: RateLimitRule };
export type ClientContext = {
  /** Platform-derived client address (never a client-supplied body field). Missing => one strict shared "unknown" bucket. */
  ip?: string;
  /** Opaque anonymous session id issued by the client analytics layer. */
  sessionId?: string;
};

const SESSION_ID = /^[A-Za-z0-9_-]{16,64}$/;
const bounded = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** `AI_CONCIERGE_RATE_LIMITS` = {"burst":{"limit":N,"windowSeconds":S},"session":{…},"global":{…}} — all three required. */
export function readConciergeLimits(env: Record<string, string | undefined> = process.env): ConciergeLimits | null {
  const raw = env.AI_CONCIERGE_RATE_LIMITS;
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const out: Partial<ConciergeLimits> = {};
  for (const name of ["burst", "session", "global"] as const) {
    const entry = (parsed as Record<string, { limit?: unknown; windowSeconds?: unknown } | undefined>)[name];
    if (!entry || !bounded(entry.limit, 1, 1_000_000) || !bounded(entry.windowSeconds, 1, 31 * 86_400)) return null;
    out[name] = { name, limit: entry.limit as number, windowSeconds: entry.windowSeconds as number };
  }
  return out as ConciergeLimits;
}

export type LimitDecision =
  | { allowed: true }
  | { allowed: false; reason: "limited"; dimension: NonNullable<RuntimeEvent["rate_limited_dimension"]>; retryAfterSeconds: number }
  | { allowed: false; reason: "kill_switch" }
  | { allowed: false; reason: "unconfigured" }
  | { allowed: false; reason: "store_error"; errorClass: StoreErrorClass };

const TRUTHY = new Set(["1", "true", "yes", "on"]);

export async function applyConciergeLimits(
  limiter: Limiter,
  limits: ConciergeLimits | null,
  client: ClientContext,
  env: Record<string, string | undefined> = process.env,
): Promise<LimitDecision> {
  // Global emergency switch: no Redis call, no cost.
  if (TRUTHY.has((env.AI_CONCIERGE_KILL_SWITCH ?? "").trim().toLowerCase())) return { allowed: false, reason: "kill_switch" };
  if (!limits) return { allowed: false, reason: "unconfigured" };

  const checks: Array<{ rule: RateLimitRule; dimension: "burst" | "session" | "global"; identifier: string; reported: NonNullable<RuntimeEvent["rate_limited_dimension"]> }> = [
    { rule: limits.burst, dimension: "burst", identifier: client.ip?.trim() || "unknown", reported: "ip_hash" },
  ];
  if (client.sessionId && SESSION_ID.test(client.sessionId)) {
    checks.push({ rule: limits.session, dimension: "session", identifier: client.sessionId, reported: "session" });
  }
  checks.push({ rule: limits.global, dimension: "global", identifier: "all", reported: "global" });

  for (const check of checks) {
    const result = await limiter.check({ rule: check.rule, dimension: check.dimension, identifier: check.identifier });
    if (result.storeError) return { allowed: false, reason: "store_error", errorClass: result.storeError };
    if (!result.allowed) return { allowed: false, reason: "limited", dimension: check.reported, retryAfterSeconds: result.retryAfterSeconds };
  }
  return { allowed: true };
}

/** A content-free runtime event for responses produced before the pipeline runs (limits, configuration). */
export function syntheticEvent(overrides: Partial<RuntimeEvent> & Pick<RuntimeEvent, "outcome" | "response_kind">): RuntimeEvent {
  return {
    latency_ms: 0, retrieval_results: 0, accepted_results: 0, rejected_results: 0, source_classes: [],
    message_length_bucket: "short", stage_ms: {}, provider_calls: { retrieve: 0, generate: 0 }, rag_empty: false,
    stale_filtered: 0, stale_content_served: 0, rejected_by_reason: {}, source_ids: [],
    ...overrides,
  };
}
