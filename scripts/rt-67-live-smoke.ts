/** RT-67 live smoke: a handful of synthetic PT prompts against the real Responses API + RT-69 hosted store. Local only. */
import dotenv from "dotenv";
import OpenAI from "openai";
import { readRuntimeConfig } from "../lib/ai-concierge/runtime/config";
import { createOpenAIDeps } from "../lib/ai-concierge/runtime/openai";
import { loadRegistry } from "../lib/ai-concierge/runtime/provenance";
import { runConcierge } from "../lib/ai-concierge/runtime/run";

dotenv.config({ path: ".env.local", quiet: true });
const config = readRuntimeConfig();
if (!config) throw new Error("Runtime configuration is incomplete");

let apiCalls = 0;
const client = new OpenAI({
  apiKey: config.apiKey,
  timeout: 45_000,
  maxRetries: 0,
  fetch: (...args: Parameters<typeof fetch>) => {
    apiCalls++;
    return fetch(...args);
  },
});
const deps = { ...createOpenAIDeps(config, client), onEvent: () => undefined };
const registry = loadRegistry();

const prompts = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "O que é a Ricardo Tour?",
      "Como posso falar com a Ricardo Tour?",
      "O que você pode me explicar sobre o Cristo Redentor?",
      "Qual passeio você recomenda para quem visita o Rio pela primeira vez?",
      "Vocês fazem passeio de parapente?",
      "Quanto custa hoje?",
      "Tem vaga amanhã?",
      "Meu pagamento foi confirmado?",
    ];

async function main() {
for (const message of prompts) {
  const before = apiCalls;
  const result = await runConcierge({ message, locale: "pt" }, deps, registry);
  console.log(JSON.stringify({
    prompt: message,
    outcome: result.outcome,
    api_calls: apiCalls - before,
    sources: result.source_ids.length,
    reason: result.dynamic_reason ?? result.handoff_reason ?? result.invalid_reason ?? result.error_class,
    answer: result.answer.slice(0, 600),
  }));
}
console.log(JSON.stringify({ total_api_calls: apiCalls, model_class: "DEVELOPMENT / VALIDATION MODEL" }));
}
main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String(error?.message ?? error).slice(0, 200) }));
  process.exitCode = 1;
});
