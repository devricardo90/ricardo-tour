import { handoffMessage } from "./messages";
import { readRuntimeConfig } from "./config";
import { createOpenAIDeps } from "./openai";
import { loadRegistry } from "./provenance";
import { runConcierge } from "./run";
import type { RuntimeResult } from "./types";

/**
 * Server-only entrypoint (RT-67). Intentionally NOT imported by app/api/ai-concierge: production stays disabled
 * until the RT-75 Owner gate and RT-70 privacy decisions. Missing configuration fails closed.
 */
export async function handleConciergeMessage(raw: unknown, env: Record<string, string | undefined> = process.env): Promise<RuntimeResult> {
  const config = readRuntimeConfig(env);
  if (!config) {
    return { outcome: "UPSTREAM_ERROR", answer: handoffMessage("upstream_error"), handoff_reason: "upstream_error", error_class: "config", source_ids: [], source_versions: [], chunk_ids: [] };
  }
  return runConcierge(raw, createOpenAIDeps(config), loadRegistry());
}
