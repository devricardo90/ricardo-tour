/**
 * RT-72 live measurement: how many billable commands does one limiter check cost on a REAL Upstash database?
 * Uses the public metrics endpoint of the instant database; waits for the (lagging) counter to stabilise between phases.
 * Budget: about 250 commands (0.05 percent of the monthly allowance); takes 10+ minutes because the counter lags. Prints only counts.
 *
 *   npx tsx scripts/rt-72-live-command-cost.ts
 */
import dotenv from "dotenv";
import { resolve } from "node:path";
import { readLimiterConfig } from "../lib/rate-limit/config";
import { createUpstashStore } from "../lib/rate-limit/upstash-store";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
const config = readLimiterConfig(process.env);
const metricsUrl = process.env.UPSTASH_LIVE_METRICS_URL;
if (!config || !metricsUrl) throw new Error("Live configuration or metrics URL missing");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const read = async () => ((await (await fetch(metricsUrl, { headers: { "User-Agent": "claude-code" } })).json()) as { commands_total: number }).commands_total;

/** The public counter updates in delayed batches: poll every 10 s until it is unchanged for 12 consecutive reads (2 min), at most 10 min. */
async function stable() {
  let last = await read();
  let same = 0;
  for (let waited = 0; waited < 600_000 && same < 12; waited += 10_000) {
    await sleep(10_000);
    const now = await read();
    same = now === last ? same + 1 : 0;
    last = now;
  }
  return last;
}

async function main() {
  const store = createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 });
  const rule = { name: "cost", limit: 1_000_000, windowSeconds: 600 };
  const tag = Math.random().toString(36).slice(2, 8);
  const N = 40;

  const start = await stable();
  for (let i = 0; i < N; i++) await store.hit(`rl:cost:${tag}:distinct:${i}`, rule); // every check creates a key: EVAL + INCR + EXPIRE
  const afterDistinct = await stable();
  for (let i = 0; i < N; i++) await store.hit(`rl:cost:${tag}:same`, rule); // 1 creating check, N-1 existing-key checks
  const afterSame = await stable();

  const distinct = afterDistinct - start;
  const same = afterSame - afterDistinct;
  console.log(JSON.stringify({
    checks_per_phase: N,
    commands_counter: { start, afterDistinct, afterSame },
    first_hit_phase: { delta: distinct, per_check: Number((distinct / N).toFixed(2)) },
    mixed_phase_one_create_plus_29_existing: { delta: same, per_check: Number((same / N).toFixed(2)) },
    interpretation:
      distinct === N
        ? "one EVAL counts as ONE billable command, however many commands run inside the script"
        : distinct === 2 * N
          ? "EVAL is billed as two commands"
          : distinct === 3 * N
            ? "EVAL + INCR + EXPIRE are billed individually (worst case)"
            : "unexpected: inspect manually",
  }, null, 2));
}
main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String((error as Error)?.message ?? error).replace(/[A-Za-z0-9_-]{24,}/g, "<redacted>").slice(0, 200) }));
  process.exitCode = 1;
});
