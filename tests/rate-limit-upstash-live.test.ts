import { createHash } from "node:crypto";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { describe, expect, it } from "vitest";
import { handleConciergeMessage } from "@/lib/ai-concierge/runtime";
import { loadRegistry } from "@/lib/ai-concierge/runtime/provenance";
import { readLimiterConfig } from "@/lib/rate-limit/config";
import { createLimiter } from "@/lib/rate-limit/limiter";
import { createMemoryStore } from "@/lib/rate-limit/memory-store";
import { createUpstashStore } from "@/lib/rate-limit/upstash-store";

/**
 * LIVE verification against a REAL Upstash Redis Free-plan database. SKIPPED unless explicitly enabled:
 *
 *   UPSTASH_LIVE_TEST=1 plus UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN / RATE_LIMIT_HMAC_SECRET
 *
 * It exists so the checks the emulator cannot prove (real atomicity under real concurrency, real TTL expiry, real
 * latency, real error shapes) can be executed once the Owner authorizes creating the database. Budget: well under
 * 200 billable commands in total (about 0.04 percent of the 500K monthly free allowance), all under a unique,
 * self-expiring key namespace.
 */
const enabled = process.env.UPSTASH_LIVE_TEST === "1";
// Vitest does not load .env.local by itself; only the explicit live run reads it (values are never printed).
if (enabled) dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
const config = enabled ? readLimiterConfig(process.env) : null;

describe.skipIf(!enabled)("Upstash Free plan — live verification (pending Owner authorization)", () => {
  it("has well-formed credentials", () => {
    expect(config).not.toBeNull();
  });

  it("enforces an atomic limit under real concurrency across independent limiter instances", async () => {
    const store = () => createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 });
    const namespace = `livetest${Math.random().toString(36).slice(2, 10)}`;
    const make = () => createLimiter({ store: store(), secret: config!.secret, namespace, failMode: "closed" });
    const rule = { name: "live", limit: 5, windowSeconds: 30 };
    const a = make();
    const b = make();
    const input = { rule, dimension: "burst", identifier: "live-test-client" };
    const results = await Promise.all([...Array.from({ length: 10 }, () => a.check(input)), ...Array.from({ length: 10 }, () => b.check(input))]);
    expect(results.some((r) => r.storeError)).toBe(false);
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("measures round-trip latency (informational) and sees a fresh window after the TTL", async () => {
    const store = createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 });
    const rule = { name: "livettl", limit: 1, windowSeconds: 2 };
    const key = `rl:live:ttl:${Math.random().toString(36).slice(2, 10)}`;
    const t0 = Date.now();
    const first = await store.hit(key, rule);
    const latencyMs = Date.now() - t0;
    console.info(`[live] single check round trip: ${latencyMs} ms`);
    expect(first.allowed).toBe(true);
    expect((await store.hit(key, rule)).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 2_500)); // next fixed window
    expect((await store.hit(key, rule)).allowed).toBe(true);
  });

  it("rejects a wrong token with a closed 'auth' class", async () => {
    const bad = createUpstashStore({ url: config!.url, token: "x".repeat(40), timeoutMs: 5_000 });
    await expect(bad.hit("rl:live:auth", { name: "a", limit: 1, windowSeconds: 10 })).rejects.toMatchObject({ errorClass: "auth" });
  });
});

// End-to-end behaviour on the REAL store: the Concierge limit chain with a fake model provider, and the form fallback
// against a real authentication failure. The provider is fake on purpose: no OpenAI call is ever made by this file.
describe.skipIf(!enabled)("Upstash Free plan — end-to-end limiter behaviour on the real store", () => {
  const sha = (value: string) => createHash("sha256").update(value).digest("hex");

  it("Concierge: requests over the real limit are RATE_LIMITED and never reach the model provider", async () => {
    const registry = loadRegistry();
    const faq = [...registry.values()].find((s) => s.status === "ACTIVE" && s.source_class === "approved-faq")!;
    const chunk = "## 1. O que é a Ricardo Tour?\n\nA Ricardo Tour é uma agência de turismo no Rio de Janeiro.\n";
    const chunkSha = sha(chunk);
    const hit = {
      file_id: "file-live", score: 0.9, text: chunk,
      attributes: { source_id: faq.source_id, source_version: faq.version, source_class: faq.source_class, locale: "pt", source_sha256: faq.source_sha256, normalized_sha256: faq.normalized_sha256, chunk_ordinal: 0, chunk_sha256: chunkSha, chunk_id: sha(`${faq.source_id}\n${faq.version}\npt\n0\n${chunkSha}`) },
    };
    let generated = 0;
    const provider = { retrieve: async () => [hit], generate: async () => (generated++, "A Ricardo Tour é uma agência de turismo no Rio de Janeiro.") };
    const namespace = `livee2e${Math.random().toString(36).slice(2, 8)}`;
    const limiter = createLimiter({ store: createUpstashStore({ url: config!.url, token: config!.token, timeoutMs: 5_000 }), secret: config!.secret, namespace, failMode: "closed" });
    const env = {
      OPENAI_API_KEY: "sk-live_test_0123456789abcdef", OPENAI_CONCIERGE_VECTOR_STORE_ID: "vs_0123456789abcdef", OPENAI_CONCIERGE_MODEL: "dev-model-1",
      AI_CONCIERGE_RATE_LIMITS: JSON.stringify({ burst: { limit: 3, windowSeconds: 30 }, session: { limit: 50, windowSeconds: 30 }, global: { limit: 50, windowSeconds: 30 } }),
    };
    const outcomes: string[] = [];
    for (let i = 0; i < 5; i++) outcomes.push((await handleConciergeMessage({ message: "O que é a Ricardo Tour?", locale: "pt" }, env, { ip: "203.0.113.200" }, { limiter, provider })).outcome);
    expect(outcomes).toEqual(["ANSWER", "ANSWER", "ANSWER", "RATE_LIMITED", "RATE_LIMITED"]);
    expect(generated).toBe(3); // the two limited requests never reached the provider
  });

  it("Forms: a real authentication failure degrades to the counted fallback and still enforces the limit", async () => {
    const namespace = `livefrm${Math.random().toString(36).slice(2, 8)}`;
    const events: string[] = [];
    const limiter = createLimiter({
      store: createUpstashStore({ url: config!.url, token: "x".repeat(40), timeoutMs: 5_000 }), // real server answers 401
      fallbackStore: createMemoryStore(), secret: config!.secret, namespace, failMode: "degrade", onEvent: (e) => events.push(e.type),
    });
    const rule = { name: "form_live", limit: 5, windowSeconds: 600 };
    const results = [];
    for (let i = 0; i < 7; i++) results.push(await limiter.check({ rule, dimension: "form", identifier: "203.0.113.201" }));
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect(results.every((r) => r.degraded)).toBe(true);
    expect(events).toContain("fallback_in_use");
  });
});
