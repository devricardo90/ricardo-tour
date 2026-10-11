import { readLimiterConfig } from "@/lib/rate-limit/config";
import { EMERGENCY_COPY_STATUS } from "./runtime/messages";
import { readConciergeLimits } from "./runtime/limits";
import { readRuntimeConfig } from "./runtime/config";
import { CONCIERGE_PRIVACY } from "./runtime/privacy";

/**
 * Daniela V1 launch guard. The Concierge is OFF unless explicitly enabled, and in production it additionally requires every
 * mandatory launch criterion, checked here in code so that "do not activate before the criteria are met" cannot be bypassed by
 * flipping a single flag:
 *  - `AI_CONCIERGE_ENABLED` true and the kill switch off;
 *  - the OpenAI runtime configuration (key, hosted store, model) present and well-formed;
 *  - production only: the RT-75 Owner gate recorded (`AI_CONCIERGE_RT75_GATE_APPROVED`), the legal review of the notice texts
 *    APPROVED in code (`CONCIERGE_PRIVACY.legal_review`), the emergency wording APPROVED (`EMERGENCY_COPY_STATUS`), the shared
 *    rate limiter configured (Upstash + HMAC secret); the Owner-approved quotas are built in (override: `AI_CONCIERGE_RATE_LIMITS`).
 * `blockers` lists, content-free, what is missing; it is what the Owner/operator reads before launch.
 */
const TRUTHY = new Set(["1", "true", "yes", "on"]);
const on = (value: string | undefined) => TRUTHY.has((value ?? "").trim().toLowerCase());

export type LaunchStatus = { enabled: boolean; environment: "production" | "non-production"; blockers: string[] };

export function getConciergeLaunchStatus(env: Record<string, string | undefined> = process.env): LaunchStatus {
  const production = env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
  const blockers: string[] = [];
  if (!on(env.AI_CONCIERGE_ENABLED)) blockers.push("flag_off");
  if (on(env.AI_CONCIERGE_KILL_SWITCH)) blockers.push("kill_switch_on");
  if (!readRuntimeConfig(env)) blockers.push("openai_runtime_config_missing");
  if (production) {
    if (!on(env.AI_CONCIERGE_RT75_GATE_APPROVED)) blockers.push("rt75_owner_gate_not_approved");
    if (CONCIERGE_PRIVACY.legal_review !== "APPROVED") blockers.push("legal_review_pending");
    if (EMERGENCY_COPY_STATUS !== "APPROVED") blockers.push("emergency_wording_not_approved");
    if (!readLimiterConfig(env)) blockers.push("shared_rate_limiter_not_configured");
    if (!readConciergeLimits(env)) blockers.push("rate_limit_quotas_invalid"); // unset = the approved V1 defaults; a malformed override fails closed
  }
  return { enabled: blockers.length === 0, environment: production ? "production" : "non-production", blockers };
}

export const isConciergeEnabled = (env: Record<string, string | undefined> = process.env) => getConciergeLaunchStatus(env).enabled;
