/**
 * RT-75 evaluation run: the versioned PT evaluation set against the REAL runtime (Responses API + RT-69 hosted store, store:false).
 * Local only, development/validation model, synthetic prompts, hard cap on provider calls. Writes the evidence file the Owner
 * reviews at the gate. `--offline` runs only the deterministic-gate cases with provider functions that throw if touched.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createObservability } from "../lib/ai-concierge/observability";
import { judge, summarize, type EvalSet, type Verdict } from "../lib/ai-concierge/evaluation/evaluate";
import { readRuntimeConfig } from "../lib/ai-concierge/runtime/config";
import { createOpenAIDeps } from "../lib/ai-concierge/runtime/openai";
import { loadRegistry } from "../lib/ai-concierge/runtime/provenance";
import { runConcierge } from "../lib/ai-concierge/runtime/run";
import type { RuntimeDeps } from "../lib/ai-concierge/runtime/types";

dotenv.config({ path: ".env.local", quiet: true });
const offline = process.argv.includes("--offline");
const MAX_PROVIDER_CALLS = 120; // hard stop: the set needs about 2 calls per model-bound case
const set = JSON.parse(readFileSync(resolve("knowledge/concierge/evaluation/rt-75-evaluation-set-pt.json"), "utf8")) as EvalSet;
const registry = loadRegistry();
const observability = createObservability({ logger: () => undefined });

let providerCalls = 0;
let deps: RuntimeDeps;
let model = "none (offline)";
if (offline) {
  deps = {
    retrieve: async () => {
      providerCalls++;
      throw new Error("offline: retrieval must not be called");
    },
    generate: async () => {
      providerCalls++;
      throw new Error("offline: generation must not be called");
    },
    onEvent: observability.onEvent,
  };
} else {
  const config = readRuntimeConfig();
  if (!config) throw new Error("Runtime configuration is incomplete (.env.local)");
  model = config.model;
  const client = new OpenAI({
    apiKey: config.apiKey,
    timeout: 45_000,
    maxRetries: 0,
    fetch: (...args: Parameters<typeof fetch>) => {
      if (++providerCalls > MAX_PROVIDER_CALLS) throw new Error("STOPPED: provider call cap reached");
      return fetch(...args);
    },
  });
  deps = { ...createOpenAIDeps(config, client), onEvent: observability.onEvent };
}

async function main() {
  const verdicts: Verdict[] = [];
  const rows: unknown[] = [];
  for (const testCase of set.cases) {
    if (offline && !testCase.expect.no_model_call) continue;
    const before = providerCalls;
    const started = Date.now();
    const result = await runConcierge({ message: testCase.prompt, locale: testCase.locale ?? "pt", history: testCase.history }, deps, registry);
    const calls = providerCalls - before;
    const verdict = judge(testCase, result, calls, set.global_must_not_match);
    verdicts.push(verdict);
    rows.push({
      id: testCase.id,
      category: testCase.category,
      prompt: testCase.prompt,
      outcome: result.outcome,
      response_kind: result.response_kind,
      handoff_code: result.handoff?.code ?? null,
      provider_calls: calls,
      latency_ms: Date.now() - started,
      pass: verdict.pass,
      failures: verdict.failures,
      answer: result.answer.slice(0, 700),
    });
    console.log(JSON.stringify({ id: testCase.id, outcome: result.outcome, calls, pass: verdict.pass, failures: verdict.failures }));
  }
  const summary = summarize(verdicts);
  // Cost: measured provider tokens x the per-1M prices passed explicitly (EVAL_PRICE_INPUT_PER_M / EVAL_PRICE_OUTPUT_PER_M).
  // No prices are assumed: without them only the token counts are reported.
  const tokens = (observability.metrics.snapshot().measured.llm_tokens ?? { input: 0, output: 0 }) as { input: number; output: number };
  const priceIn = Number(process.env.EVAL_PRICE_INPUT_PER_M);
  const priceOut = Number(process.env.EVAL_PRICE_OUTPUT_PER_M);
  const modelBound = rows.filter((row) => (row as { provider_calls: number }).provider_calls > 0).length;
  const cost = {
    input_tokens: tokens.input,
    output_tokens: tokens.output,
    model_bound_cases: modelBound,
    prices_per_1m_tokens: Number.isFinite(priceIn) && Number.isFinite(priceOut) ? { input: priceIn, output: priceOut } : null,
    estimated_usd: Number.isFinite(priceIn) && Number.isFinite(priceOut) ? (tokens.input * priceIn + tokens.output * priceOut) / 1e6 : null,
    estimated_usd_per_model_bound_answer: Number.isFinite(priceIn) && Number.isFinite(priceOut) && modelBound > 0 ? (tokens.input * priceIn + tokens.output * priceOut) / 1e6 / modelBound : null,
  };
  const wall = rows.map((row) => (row as { latency_ms: number }).latency_ms).filter((ms) => ms > 100).sort((a, b) => a - b);
  const latency = { model_bound_cases: wall.length, p50_ms: wall[Math.floor(wall.length * 0.5)] ?? null, p95_ms: wall[Math.min(wall.length - 1, Math.floor(wall.length * 0.95))] ?? null, max_ms: wall.at(-1) ?? null };
  const metrics = observability.metrics.snapshot();
  const report = {
    evaluation_set_version: set.version,
    run_at: new Date().toISOString(),
    mode: offline ? "OFFLINE (deterministic gates only, no provider call)" : "LIVE (real runtime, development/validation model, store:false)",
    model_class: offline ? "n/a" : "DEVELOPMENT / VALIDATION MODEL (NOT the final production model)",
    model,
    provider_calls: providerCalls,
    summary,
    cost,
    latency,
    metrics,
    cases: rows,
  };
  mkdirSync("docs/architecture/rt-75-evidence", { recursive: true });
  const file = `docs/architecture/rt-75-evidence/rt-75-evaluation-results-${offline ? "offline" : `live-${model.replace(/[^A-Za-z0-9._-]/g, "_")}`}.json`;
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ summary, provider_calls: providerCalls, file }));
  if (summary.passed !== summary.total) process.exitCode = 2;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String(error?.message ?? error).slice(0, 200) }));
  process.exitCode = 1;
});
