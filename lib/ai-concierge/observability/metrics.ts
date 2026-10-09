import type { RuntimeEvent } from "../runtime/types";

/**
 * RT-73 operational metrics (contract §3): aggregated, in-memory per server instance, no identifiers, no content.
 * Every figure is labelled MEASURED (counted or timed by the runtime / reported by the provider) or ESTIMATE
 * (derived with operator-supplied prices). Nothing here is persisted or sent to a third party.
 */
export const LATENCY_BUCKETS_MS = [100, 250, 500, 1000, 2000, 5000, 10000, 30000] as const;

type Histogram = { count: number; sum_ms: number; buckets: Record<string, number> };
const newHistogram = (): Histogram => ({ count: 0, sum_ms: 0, buckets: Object.fromEntries([...LATENCY_BUCKETS_MS.map((b) => [`le_${b}`, 0]), ["le_inf", 0]]) });
const observe = (h: Histogram, ms: number) => {
  h.count++;
  h.sum_ms += ms;
  const bucket = LATENCY_BUCKETS_MS.find((limit) => ms <= limit);
  h.buckets[bucket ? `le_${bucket}` : "le_inf"]++;
};

/** USD per one million tokens, supplied by the operator. The runtime never hardcodes provider prices. */
export type Pricing = { input_per_mtok_usd: number; output_per_mtok_usd: number };

export function readPricing(env: Record<string, string | undefined> = process.env): Pricing | null {
  const input = Number(env.OPENAI_CONCIERGE_PRICE_INPUT_PER_MTOK_USD);
  const output = Number(env.OPENAI_CONCIERGE_PRICE_OUTPUT_PER_MTOK_USD);
  if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0 || !env.OPENAI_CONCIERGE_PRICE_INPUT_PER_MTOK_USD || !env.OPENAI_CONCIERGE_PRICE_OUTPUT_PER_MTOK_USD) return null;
  return { input_per_mtok_usd: input, output_per_mtok_usd: output };
}

/** Cost is an ESTIMATE of generation tokens only (file-search / retrieval charges are not modelled). */
export function estimateGenerationCostUsd(usage: { input_tokens: number; output_tokens: number } | undefined, pricing: Pricing | null) {
  if (!usage || !pricing) return null;
  return (usage.input_tokens * pricing.input_per_mtok_usd + usage.output_tokens * pricing.output_per_mtok_usd) / 1_000_000;
}

const REQUEST_BUCKET: Record<RuntimeEvent["outcome"], "ok" | "refusal" | "handoff" | "error"> = {
  ANSWER: "ok",
  REFUSED: "refusal",
  INVALID_INPUT: "refusal",
  HANDOFF: "handoff",
  DYNAMIC_LOOKUP_REQUIRED: "handoff",
  INSUFFICIENT_EVIDENCE: "handoff",
  UNSUPPORTED_LOCALE: "handoff",
  UPSTREAM_ERROR: "error",
};

export function createMetrics(pricing: Pricing | null = null) {
  const state = {
    requests_total: { ok: 0, refusal: 0, handoff: 0, error: 0, limited: 0, disabled: 0 },
    requests_by_outcome: {} as Record<string, number>,
    grounded_responses_total: 0,
    degraded_responses_total: 0,
    latency_ms: { retrieve: newHistogram(), generate: newHistogram(), total: newHistogram() },
    provider_calls_total: { retrieve: 0, generate: 0 },
    provider_retries_total: 0,
    provider_errors_total: {} as Record<string, number>,
    llm_tokens: { input: 0, output: 0 },
    generations_with_usage: 0,
    generations_without_usage: 0,
    cost_estimate_usd: 0,
    rag_empty_total: 0,
    rag_stale_filtered_total: 0,
    stale_content_served_total: 0,
    timeout_total: { retrieve: 0, generate: 0 },
    handoff_offered_total: {} as Record<string, number>,
    // Declared for the owners named in the contract; emitted by RT-72 / RT-69 scripts / the route, not by the runtime.
    limiter_store_errors_total: 0,
    ingestion_events_total: {} as Record<string, number>,
    flag_state: {} as Record<string, "enabled" | "disabled">,
  };

  return {
    record(event: RuntimeEvent) {
      state.requests_total[REQUEST_BUCKET[event.outcome]]++;
      state.requests_by_outcome[event.outcome] = (state.requests_by_outcome[event.outcome] ?? 0) + 1;
      if (event.response_kind === "grounded") state.grounded_responses_total++;
      if (event.response_kind === "degraded") state.degraded_responses_total++;
      observe(state.latency_ms.total, event.latency_ms);
      if (event.stage_ms.retrieve !== undefined) observe(state.latency_ms.retrieve, event.stage_ms.retrieve);
      if (event.stage_ms.generate !== undefined) observe(state.latency_ms.generate, event.stage_ms.generate);
      state.provider_calls_total.retrieve += event.provider_calls.retrieve;
      state.provider_calls_total.generate += event.provider_calls.generate;
      if (event.retried) state.provider_retries_total++;
      if (event.error_class) state.provider_errors_total[event.error_class] = (state.provider_errors_total[event.error_class] ?? 0) + 1;
      if (event.error_class === "timeout") state.timeout_total[event.failed_stage === "retrieve" ? "retrieve" : "generate"]++;
      if (event.provider_calls.generate > 0 && event.outcome !== "UPSTREAM_ERROR") {
        if (event.usage) {
          state.generations_with_usage++;
          state.llm_tokens.input += event.usage.input_tokens;
          state.llm_tokens.output += event.usage.output_tokens;
          state.cost_estimate_usd += estimateGenerationCostUsd(event.usage, pricing) ?? 0;
        } else state.generations_without_usage++;
      }
      if (event.rag_empty) state.rag_empty_total++;
      state.rag_stale_filtered_total += event.stale_filtered;
      state.stale_content_served_total += event.stale_content_served;
      if (event.handoff_offered) state.handoff_offered_total[event.handoff_offered] = (state.handoff_offered_total[event.handoff_offered] ?? 0) + 1;
    },
    setFlagState(environment: string, value: "enabled" | "disabled") {
      state.flag_state[environment] = value;
    },
    snapshot() {
      return {
        scope: "per-instance, since process start",
        measured: JSON.parse(JSON.stringify({ ...state, cost_estimate_usd: undefined })),
        estimate: {
          cost_estimate_usd: pricing ? Number(state.cost_estimate_usd.toFixed(6)) : null,
          basis: pricing
            ? "generation tokens x operator-supplied prices; excludes retrieval/file-search charges"
            : "unavailable: no operator-supplied prices configured",
          token_coverage: { with_usage: state.generations_with_usage, without_usage: state.generations_without_usage },
        },
      };
    },
  };
}
export type Metrics = ReturnType<typeof createMetrics>;
export type MetricsSnapshot = ReturnType<Metrics["snapshot"]>;
