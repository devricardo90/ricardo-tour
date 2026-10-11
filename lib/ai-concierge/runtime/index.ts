import { randomUUID } from "node:crypto";
import type { Limiter } from "@/lib/rate-limit/limiter";
import { getLimiter } from "@/lib/rate-limit/server";
import { getServerObservability } from "../observability";
import { readRuntimeConfig } from "./config";
import { buildHandoffOffer } from "./handoff";
import { validateRuntimeInput } from "./input";
import { applyConciergeLimits, readConciergeLimits, syntheticEvent, type ClientContext, type LimitDecision } from "./limits";
import { degradedMessage, handoffMessage } from "./messages";
import { createOpenAIDeps } from "./openai";
import { loadRegistry } from "./provenance";
import { runConcierge } from "./run";
import type { RuntimeDeps, RuntimeResult } from "./types";

export { CONCIERGE_PRIVACY } from "./privacy";
export { getHandoffChannels } from "./handoff";
export type { ClientContext } from "./limits";

const noSources = () => ({ source_ids: [] as string[], source_versions: [] as string[], chunk_ids: [] as string[] });

function degraded(errorClass: "config" | "limiter"): RuntimeResult {
  const reference_id = randomUUID().slice(0, 8);
  // A missing configuration or a limiter failure must be visible to operators (content-free, best-effort).
  getServerObservability().onEvent(
    syntheticEvent({ outcome: "UPSTREAM_ERROR", response_kind: "degraded", error_class: errorClass, failed_stage: errorClass, handoff_reason: "upstream_error", handoff_offered: "H5" }),
  );
  return {
    outcome: "UPSTREAM_ERROR",
    answer: degradedMessage(reference_id),
    response_kind: "degraded",
    reference_id,
    // RT-71: handoff is static data and stays available even when configuration, the limiter or every backend is unavailable.
    handoff: buildHandoffOffer("H5", "upstream_error"),
    handoff_reason: "upstream_error",
    error_class: errorClass,
    ...noSources(),
  };
}

function limited(decision: Extract<LimitDecision, { reason: "limited" | "kill_switch" }>, lengthBucket: "short" | "medium" | "long"): RuntimeResult {
  const dimension = decision.reason === "limited" ? decision.dimension : "global";
  const retry_after_seconds = decision.reason === "limited" ? decision.retryAfterSeconds : 60;
  getServerObservability().onEvent(
    syntheticEvent({ outcome: "RATE_LIMITED", response_kind: "degraded", handoff_reason: "rate_limited", handoff_offered: "H5", rate_limited_dimension: dimension, message_length_bucket: lengthBucket }),
  );
  return {
    outcome: "RATE_LIMITED",
    answer: handoffMessage("rate_limited"),
    response_kind: "degraded",
    handoff: buildHandoffOffer("H5", "rate_limited"),
    handoff_reason: "rate_limited",
    retry_after_seconds,
    ...noSources(),
  };
}

/**
 * Server-only entrypoint, used by app/api/ai-concierge (Daniela V1) only behind the launch guard (lib/ai-concierge/launch.ts):
 * production stays disabled until the RT-75 Owner gate, the RT-70 legal review and the other mandatory criteria are met. There is NO path to the model that skips the rate limiter:
 * missing configuration, an unconfigured/failed limiter store and an exhausted free-plan quota all fail closed.
 * `client.ip` must come from the platform (not from the request body).
 */
export async function handleConciergeMessage(
  raw: unknown,
  env: Record<string, string | undefined> = process.env,
  client: ClientContext = {},
  /** Test seam only: production callers omit it. */
  overrides: { limiter?: Limiter; provider?: Pick<RuntimeDeps, "retrieve" | "generate"> } = {},
): Promise<RuntimeResult> {
  const config = readRuntimeConfig(env);
  if (!config) return degraded("config");

  const input = validateRuntimeInput(raw);
  if (input.ok) {
    // Only well-formed requests consume limiter quota; malformed ones are answered by the pipeline at no provider cost.
    const decision = await applyConciergeLimits(overrides.limiter ?? getLimiter("closed", env), readConciergeLimits(env), client, env);
    if (!decision.allowed) {
      if (decision.reason === "limited" || decision.reason === "kill_switch") {
        const length = input.value.message.length;
        return limited(decision, length <= 80 ? "short" : length <= 300 ? "medium" : "long");
      }
      // Store failures were already counted by the limiter's own hook (limiter_store_errors_total).
      return degraded("limiter");
    }
  }
  return runConcierge(raw, { ...(overrides.provider ?? createOpenAIDeps(config)), onEvent: getServerObservability().onEvent }, loadRegistry());
}
