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

const followupOnly = process.argv[2] === "--followup";
const prompts = followupOnly ? [] : process.argv.slice(2).length
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
    handoff: result.handoff?.code,
    reason: result.dynamic_reason ?? result.handoff_reason ?? result.invalid_reason ?? result.error_class,
    answer: result.answer.slice(0, 600),
  }));
}
if (followupOnly || !process.argv.slice(2).length) {
  // RT-70: session context is client-held. A follow-up that only makes sense with the previous turns.
  const first = await runConcierge({ message: "Quais passeios clássicos vocês têm no Rio?", locale: "pt" }, deps, registry);
  const before = apiCalls;
  const second = await runConcierge({
    message: "Qual desses é melhor para quem tem pouco tempo?",
    locale: "pt",
    history: [{ role: "user", text: "Quais passeios clássicos vocês têm no Rio?" }, { role: "assistant", text: first.answer }],
  }, deps, registry);
  console.log(JSON.stringify({ followup: true, first: first.outcome, second: second.outcome, api_calls_followup: apiCalls - before, answer: second.answer.slice(0, 500) }));
}
console.log(JSON.stringify({ total_api_calls: apiCalls, model_class: "DEVELOPMENT / VALIDATION MODEL" }));
}
main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String(error?.message ?? error).slice(0, 200) }));
  process.exitCode = 1;
});
