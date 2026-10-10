/**
 * RT-72 / RT-82 live evidence against a REAL Upstash Redis database (development/test credentials from .env.local).
 * Re-runnable; prints only non-secret measurements. Budget: a few hundred commands. Never exhausts the free quota.
 *
 *   npx tsx scripts/rt-72-live-evidence.ts
 */
import dotenv from "dotenv";
import { resolve } from "node:path";
import { readLimiterConfig } from "../lib/rate-limit/config";
import { createLimiter, opaqueId } from "../lib/rate-limit/limiter";
import { createUpstashStore, HIT_SCRIPT } from "../lib/rate-limit/upstash-store";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
const config = readLimiterConfig(process.env);
if (!config) throw new Error("Limiter configuration is missing or malformed");
const metricsUrl = process.env.UPSTASH_LIVE_METRICS_URL; // public, unauthenticated metrics of an instant database (no secret)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const percentile = (values: number[], p: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil((p / 100) * values.length) - 1)];

async function rawCommand(command: unknown[], token = config!.token) {
  const started = Date.now();
  const response = await fetch(config!.url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  const text = await response.text();
  return { status: response.status, body: text, ms: Date.now() - started };
}
async function metrics() {
  if (!metricsUrl) return null;
  const response = await fetch(metricsUrl, { headers: { "User-Agent": "claude-code" } });
  return (await response.json()) as { commands_total: number; keys: number; uptime_seconds: number; bytes_in: number; bytes_out: number };
}
async function settledMetrics(previous: number | null, attempts = 8) {
  // The public metrics endpoint lags behind traffic: wait until it moves or give up.
  let current = await metrics();
  for (let i = 0; i < attempts && current && previous !== null && current.commands_total === previous; i++) {
    await sleep(2_000);
    current = await metrics();
  }
  return current;
}

async function main() {
  const evidence: Record<string, unknown> = {};
  const store = createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 });
  const rule = { name: "evidence", limit: 1_000_000, windowSeconds: 60 };

  // 1. Latency from this workstation (NOT representative of Vercel -> Redis latency; the Vercel region is unverified).
  const key = `rl:evidence:lat:${Math.random().toString(36).slice(2, 10)}`;
  const samples: number[] = [];
  await store.hit(key, rule); // warm TLS/DNS
  for (let i = 0; i < 20; i++) {
    const t0 = Date.now();
    await store.hit(key, rule);
    samples.push(Date.now() - t0);
  }
  evidence.latency_ms = { n: samples.length, min: Math.min(...samples), p50: percentile(samples, 50), p95: percentile(samples, 95), max: Math.max(...samples) };

  // 2. Real command consumption per check: EVAL(+INCR+EXPIRE) billed as how many commands?
  const before = await settledMetrics(null, 0);
  await sleep(3_000);
  const baseline = await metrics();
  const N = 20;
  const costKey = `rl:evidence:cost:${Math.random().toString(36).slice(2, 10)}`;
  for (let i = 0; i < N; i++) await store.hit(costKey, rule);
  const after = await settledMetrics(baseline?.commands_total ?? null);
  evidence.command_cost = {
    checks: N,
    metrics_before: baseline?.commands_total ?? before?.commands_total ?? null,
    metrics_after: after?.commands_total ?? null,
    delta: after && baseline ? after.commands_total - baseline.commands_total : null,
    per_check: after && baseline ? Number(((after.commands_total - baseline.commands_total) / N).toFixed(2)) : null,
  };

  // 3. Real concurrency + sharing across two independent limiter instances.
  const ns = `ev${Math.random().toString(36).slice(2, 8)}`;
  const make = () => createLimiter({ store: createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 }), secret: config!.secret, namespace: ns, failMode: "closed" });
  const a = make();
  const b = make();
  const concurrentRule = { name: "burst", limit: 10, windowSeconds: 30 };
  const input = { rule: concurrentRule, dimension: "burst", identifier: "203.0.113.77" };
  const results = await Promise.all([...Array.from({ length: 30 }, () => a.check(input)), ...Array.from({ length: 30 }, () => b.check(input))]);
  evidence.concurrency = { attempts: 60, limit: 10, allowed: results.filter((r) => r.allowed).length, store_errors: results.filter((r) => r.storeError).length };

  // 4. Privacy canaries: write with PII-looking identifiers, then inspect what is really stored in Redis.
  const canaries = ["203.0.113.88", "ana.canario@exemplo.com", "+55 11 91234-5678", "RT-998877", "quero parapente canario"];
  for (const canary of canaries) {
    await a.check({ rule: { name: "canary", limit: 5, windowSeconds: 30 }, dimension: "burst", identifier: canary });
  }
  const scan = await rawCommand(["KEYS", `rl:${ns}:*`]);
  const keys: string[] = JSON.parse(scan.body).result ?? [];
  const ttls: number[] = [];
  for (const k of keys) ttls.push(JSON.parse((await rawCommand(["TTL", k])).body).result);
  const dump = JSON.stringify(keys);
  evidence.privacy = {
    keys_found: keys.length,
    key_shape_ok: keys.every((k) => new RegExp(`^rl:${ns}:(burst|canary):[a-f0-9]{32}:\\d+$`).test(k)),
    canaries_in_keys: canaries.filter((c) => dump.includes(c)).length,
    expected_opaque_id_present: keys.some((k) => k.includes(opaqueId(config!.secret, "burst", canaries[0]))),
    all_keys_have_ttl: ttls.every((t) => t > 0 && t <= 35),
    ttl_range_s: [Math.min(...ttls), Math.max(...ttls)],
  };

  // 5. Real TTL expiry: a 2 s window leaves a key that must disappear by itself after window + slack (5 s).
  const ttlKey = `rl:${ns}:ttl:probe`;
  await store.hit(ttlKey, { name: "ttl", limit: 1, windowSeconds: 2 });
  const live = (await rawCommand(["KEYS", `${ttlKey}:*`])).body;
  await sleep(8_500);
  const gone = (await rawCommand(["KEYS", `${ttlKey}:*`])).body;
  evidence.ttl = { key_existed_after_hit: JSON.parse(live).result.length === 1, key_remaining_after_8_5s: JSON.parse(gone).result.length };

  // 6. Real error shapes (statuses/bodies are classified, never copied with credentials).
  const wrong = await rawCommand(["PING"], "x".repeat(40));
  const badCommand = await rawCommand(["NOTACOMMAND"]);
  const badScript = await rawCommand(["EVAL", "return redis.call('INCR')", "1", "k"]);
  const adapterAuth = await createUpstashStore({ url: config!.url, token: "x".repeat(40), timeoutMs: 5_000 }).hit("k", rule).then(() => "no-error", (e) => (e as { errorClass?: string }).errorClass);
  const adapterTimeout = await createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 1 }).hit("k", rule).then(() => "no-error", (e) => (e as { errorClass?: string }).errorClass);
  const adapterConnection = await createUpstashStore({ url: "https://does-not-exist-rt72.upstash.io", token: config!.token, timeoutMs: 5_000 }).hit("k", rule).then(() => "no-error", (e) => (e as { errorClass?: string }).errorClass);
  evidence.error_shapes = {
    wrong_token: { http_status: wrong.status, body_prefix: wrong.body.slice(0, 60).replace(/[A-Za-z0-9_-]{20,}/g, "<redacted>") },
    unknown_command: { http_status: badCommand.status, body_prefix: badCommand.body.slice(0, 80) },
    bad_script: { http_status: badScript.status, body_prefix: badScript.body.slice(0, 80) },
    adapter_classes: { wrong_token: adapterAuth, one_ms_timeout: adapterTimeout, unresolvable_host: adapterConnection },
    script_is_single_eval: HIT_SCRIPT.split("\n").length === 3,
  };

  const end = await settledMetrics(after?.commands_total ?? null, 4);
  evidence.free_tier_usage = { commands_total_so_far: end?.commands_total ?? null, monthly_allowance: 500_000, share_percent: end ? Number(((end.commands_total / 500_000) * 100).toFixed(3)) : null, keys_now: end?.keys ?? null };

  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ status: "STOPPED", error: String((error as Error)?.message ?? error).replace(/[A-Za-z0-9_-]{24,}/g, "<redacted>").slice(0, 200) }));
  process.exitCode = 1;
});
