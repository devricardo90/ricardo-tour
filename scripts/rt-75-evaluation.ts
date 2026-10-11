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
  const metrics = observability.metrics.snapshot();
  const report = {
    evaluation_set_version: set.version,
    run_at: new Date().toISOString(),
    mode: offline ? "OFFLINE (deterministic gates only, no provider call)" : "LIVE (real runtime, development/validation model, store:false)",
    model_class: offline ? "n/a" : "DEVELOPMENT / VALIDATION MODEL (NOT the final production model)",
    model,
    provider_calls: providerCalls,
    summary,
    metrics,
    cases: rows,
  };
  mkdirSync("docs/architecture/rt-75-evidence", { recursive: true });
  const file = `docs/architecture/rt-75-evidence/rt-75-evaluation-results-${offline ? "offline" : "live"}.json`;
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ summary, provider_calls: providerCalls, file }));
  if (summary.passed !== summary.total) process.exitCode = 2;
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String(error?.message ?? error).slice(0, 200) }));
  process.exitCode = 1;
});
