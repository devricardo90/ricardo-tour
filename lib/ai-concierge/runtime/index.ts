import { randomUUID } from "node:crypto";
import { degradedMessage } from "./messages";
import { readRuntimeConfig } from "./config";
import { createOpenAIDeps } from "./openai";
import { loadRegistry } from "./provenance";
import { runConcierge } from "./run";

import { buildHandoffOffer } from "./handoff";
import { getServerObservability } from "../observability";

export { CONCIERGE_PRIVACY } from "./privacy";
export { getHandoffChannels } from "./handoff";
import type { RuntimeResult } from "./types";

/**
 * Server-only entrypoint (RT-67). Intentionally NOT imported by app/api/ai-concierge: production stays disabled
 * until the RT-75 Owner gate and RT-70 privacy decisions. Missing configuration fails closed.
 */
export async function handleConciergeMessage(raw: unknown, env: Record<string, string | undefined> = process.env): Promise<RuntimeResult> {
  const config = readRuntimeConfig(env);
  if (!config) {
    const reference_id = randomUUID().slice(0, 8);
    // A missing/invalid configuration must be visible to operators (content-free, best-effort).
    getServerObservability().onEvent({
      outcome: "UPSTREAM_ERROR", latency_ms: 0, retrieval_results: 0, accepted_results: 0, rejected_results: 0, source_classes: [],
      handoff_reason: "upstream_error", error_class: "config", handoff_offered: "H5", response_kind: "degraded",
      message_length_bucket: "short", stage_ms: {}, provider_calls: { retrieve: 0, generate: 0 }, rag_empty: false,
      stale_filtered: 0, stale_content_served: 0, rejected_by_reason: {}, source_ids: [], failed_stage: "config",
    });
    return {
      outcome: "UPSTREAM_ERROR",
      answer: degradedMessage(reference_id),
      response_kind: "degraded",
      reference_id,
      // RT-71: handoff is static data and stays available even when configuration or every backend is unavailable.
      handoff: buildHandoffOffer("H5", "upstream_error"),
      handoff_reason: "upstream_error",
      error_class: "config",
      source_ids: [],
      source_versions: [],
      chunk_ids: [],
    };
  }
  return runConcierge(raw, { ...createOpenAIDeps(config), onEvent: getServerObservability().onEvent }, loadRegistry());
}
