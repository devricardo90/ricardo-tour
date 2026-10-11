import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { deriveProductEvents, getServerObservability, validateProductEvent } from "@/lib/ai-concierge/observability";
import { handleConciergeMessage } from "@/lib/ai-concierge/runtime";
import { applyConciergeLimits, readConciergeLimits, syntheticEvent } from "@/lib/ai-concierge/runtime/limits";
import { loadRegistry } from "@/lib/ai-concierge/runtime/provenance";
import type { HostedHit } from "@/lib/ai-concierge/runtime/types";
import { createLimiter } from "@/lib/rate-limit/limiter";
import { createMemoryStore } from "@/lib/rate-limit/memory-store";
import { getLimiter, resetLimitersForTests } from "@/lib/rate-limit/server";
import { RateLimitStoreError, type RateLimitStore } from "@/lib/rate-limit/types";

// RT-72 Concierge limit integration. Deterministic: memory/fake stores and fake providers. NO real Redis and NO OpenAI.
const registry = loadRegistry();
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const faq = [...registry.values()].find((s) => s.status === "ACTIVE" && s.source_class === "approved-faq")!;
const CHUNK = "## 1. O que é a Ricardo Tour?\n\nA Ricardo Tour é uma agência de turismo no Rio de Janeiro.\n";

function hit(): HostedHit {
  const chunkSha = sha(CHUNK);
  return {
    file_id: "file-test", score: 0.9, text: CHUNK,
    attributes: {
      source_id: faq.source_id, source_version: faq.version, source_class: faq.source_class, locale: "pt",
      source_sha256: faq.source_sha256, normalized_sha256: faq.normalized_sha256, chunk_ordinal: 0, chunk_sha256: chunkSha,
      chunk_id: sha(`${faq.source_id}\n${faq.version}\npt\n0\n${chunkSha}`),
    },
  };
}
const LIMITS = { burst: { limit: 3, windowSeconds: 60 }, session: { limit: 2, windowSeconds: 600 }, global: { limit: 6, windowSeconds: 86_400 } };
const baseEnv = (extra: Record<string, string> = {}) => ({
  OPENAI_API_KEY: "sk-test_0123456789abcdef", OPENAI_CONCIERGE_VECTOR_STORE_ID: "vs_0123456789abcdef", OPENAI_CONCIERGE_MODEL: "dev-model-1",
  AI_CONCIERGE_RATE_LIMITS: JSON.stringify(LIMITS), ...extra,
});
function setup(store: RateLimitStore = createMemoryStore()) {
  const hits: string[] = [];
  const spy: RateLimitStore = { hit: (key, rule, now) => (hits.push(key), store.hit(key, rule, now)) };
  const limiter = createLimiter({ store: spy, secret: "s".repeat(40), namespace: "production", failMode: "closed" });
  const provider = {
    retrieve: vi.fn(async (...args: [string]) => (void args, [hit()])),
    generate: vi.fn(async (...args: [{ instructions: string; input: string }]) => (void args, "A Ricardo Tour é uma agência de turismo no Rio de Janeiro.")),
  };
  const call = (message = "O que é a Ricardo Tour?", client: { ip?: string; sessionId?: string } = { ip: "203.0.113.9" }, env = baseEnv()) =>
    handleConciergeMessage({ message, locale: "pt" }, env, client, { limiter, provider });
  return { hits, provider, call, limiter };
}
const failingStore = (errorClass: ConstructorParameters<typeof RateLimitStoreError>[0]): RateLimitStore => ({
  hit: async () => { throw new RateLimitStoreError(errorClass); },
});

describe("RT-72 Concierge limits: enforcement and cost protection", () => {
  it("allowed requests reach the pipeline and answer", async () => {
    const t = setup();
    const result = await t.call();
    expect(result.outcome).toBe("ANSWER");
    expect(t.provider.generate).toHaveBeenCalledTimes(1);
  });

  it("burst limit: the over-limit request gets RATE_LIMITED with Retry-After and a handoff, and NO provider call", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) expect((await t.call()).outcome).toBe("ANSWER");
    const calls = t.provider.generate.mock.calls.length;
    const limited = await t.call();
    expect(limited).toMatchObject({ outcome: "RATE_LIMITED", response_kind: "degraded", handoff_reason: "rate_limited" });
    expect(limited.retry_after_seconds).toBeGreaterThanOrEqual(1);
    expect(limited.retry_after_seconds).toBeLessThanOrEqual(60);
    expect(limited.handoff).toMatchObject({ required: true, code: "H5" });
    expect(t.provider.generate.mock.calls.length).toBe(calls);
    expect(limited.answer).not.toMatch(/\b(?:3|60|600|86400)\b|segundos|minutos por/i); // no counts or windows are revealed
    expect(limited.answer).toContain("contato@ricardotour.com");
  });

  it("checks run cheapest-first and stop at the first denial (a blocked client does not touch later counters)", async () => {
    const t = setup();
    for (let i = 0; i < 3; i++) await t.call("O que é a Ricardo Tour?", { ip: "203.0.113.9" });
    t.hits.length = 0;
    await t.call("O que é a Ricardo Tour?", { ip: "203.0.113.9" });
    expect(t.hits.every((key) => key.includes(":burst:"))).toBe(true);
    expect(t.hits.some((key) => key.includes(":global:"))).toBe(false);
  });

  it("session limit is per session id, independent of other sessions; a malformed session id is ignored", async () => {
    const t = setup();
    const a = { ip: "198.51.100.1", sessionId: "aaaaaaaaaaaaaaaaaaaa" };
    const b = { ip: "198.51.100.2", sessionId: "bbbbbbbbbbbbbbbbbbbb" };
    expect((await t.call("O que é a Ricardo Tour?", a)).outcome).toBe("ANSWER");
    expect((await t.call("O que é a Ricardo Tour?", a)).outcome).toBe("ANSWER");
    expect((await t.call("O que é a Ricardo Tour?", a)).outcome).toBe("RATE_LIMITED");
    expect((await t.call("O que é a Ricardo Tour?", b)).outcome).toBe("ANSWER");
    const bad = { ip: "198.51.100.3", sessionId: "short" };
    for (let i = 0; i < 3; i++) expect((await t.call("O que é a Ricardo Tour?", bad)).outcome).toBe("ANSWER"); // no session counter applies
  });

  it("global emergency ceiling is shared by all clients", async () => {
    const t = setup();
    const outcomes = [];
    for (let i = 0; i < 9; i++) outcomes.push((await t.call("O que é a Ricardo Tour?", { ip: `198.51.100.${i + 10}` })).outcome);
    expect(outcomes.filter((o) => o === "ANSWER")).toHaveLength(6);
    expect(outcomes.filter((o) => o === "RATE_LIMITED")).toHaveLength(3);
  });

  it("an unknown client (no platform address) shares ONE strict bucket and is never unlimited", async () => {
    const t = setup();
    const outcomes = [];
    for (let i = 0; i < 5; i++) outcomes.push((await t.call("O que é a Ricardo Tour?", {})).outcome);
    expect(outcomes.filter((o) => o === "ANSWER")).toHaveLength(3);
  });

  it("OpenAI cost protection: 100 simultaneous requests cause at most the global ceiling of model calls", async () => {
    const t = setup();
    const results = await Promise.all(Array.from({ length: 100 }, (_, i) => t.call("O que é a Ricardo Tour?", { ip: `192.0.2.${i}` })));
    expect(results.filter((r) => r.outcome === "ANSWER").length).toBe(LIMITS.global.limit);
    expect(t.provider.generate.mock.calls.length).toBe(LIMITS.global.limit);
    expect(t.provider.retrieve.mock.calls.length).toBe(LIMITS.global.limit);
  });

  it("counters are consumed before the paid call: failing model calls still count", async () => {
    const t = setup();
    t.provider.generate.mockRejectedValue(Object.assign(new Error("x"), { status: 401 }));
    for (let i = 0; i < 3; i++) expect((await t.call()).outcome).toBe("UPSTREAM_ERROR");
    expect((await t.call()).outcome).toBe("RATE_LIMITED");
  });

  it("malformed input does not consume limiter quota", async () => {
    const t = setup();
    const result = await handleConciergeMessage({ message: "", locale: "pt" }, baseEnv(), { ip: "203.0.113.9" }, { limiter: t.limiter, provider: t.provider });
    expect(result.outcome).toBe("INVALID_INPUT");
    expect(t.hits).toHaveLength(0);
  });
});

describe("RT-72 fail-closed behaviour (no path to the model without the limiter)", () => {
  it.each(["timeout", "connection", "quota_exhausted", "auth", "unavailable", "malformed"] as const)(
    "store failure '%s' denies the model path and offers handoff",
    async (errorClass) => {
      const t = setup(failingStore(errorClass));
      const result = await t.call();
      expect(result).toMatchObject({ outcome: "UPSTREAM_ERROR", error_class: "limiter", response_kind: "degraded" });
      expect(result.handoff?.code).toBe("H5");
      expect(t.provider.retrieve).not.toHaveBeenCalled();
      expect(t.provider.generate).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toMatch(/quota|timeout|redis|upstash|unavailable/i);
    },
  );

  it("V1: limits not overridden means the Owner-approved defaults apply (10/min per IP, 20 per session, 300/day), never unlimited", async () => {
    const t = setup();
    const env = baseEnv();
    delete (env as Record<string, string | undefined>).AI_CONCIERGE_RATE_LIMITS;
    expect(readConciergeLimits(env)).toMatchObject({ burst: { limit: 10, windowSeconds: 60 }, session: { limit: 20, windowSeconds: 3600 }, global: { limit: 300, windowSeconds: 86400 } });
    const result = await t.call("O que é a Ricardo Tour?", { ip: "203.0.113.9" }, env);
    expect(result.outcome).not.toBe("UPSTREAM_ERROR");
    expect(t.hits.length).toBeGreaterThan(0); // the shared limiter was consulted before any model call
  });

  it("a set-but-invalid override fails closed: the model path is denied", async () => {
    const t = setup();
    const result = await t.call("O que é a Ricardo Tour?", { ip: "203.0.113.9" }, baseEnv({ AI_CONCIERGE_RATE_LIMITS: "not json" }));
    expect(result).toMatchObject({ outcome: "UPSTREAM_ERROR", error_class: "limiter" });
    expect(t.provider.generate).not.toHaveBeenCalled();
  });

  it("an unconfigured shared store (no Upstash credentials) denies the Concierge model path", async () => {
    resetLimitersForTests();
    const result = await handleConciergeMessage({ message: "O que é a Ricardo Tour?", locale: "pt" }, baseEnv(), { ip: "203.0.113.9" }, { provider: { retrieve: async () => [hit()], generate: async () => "x" } });
    expect(result).toMatchObject({ outcome: "UPSTREAM_ERROR", error_class: "limiter" });
    resetLimitersForTests();
  });

  it("kill switch denies instantly without touching the store", async () => {
    const t = setup();
    const result = await t.call("O que é a Ricardo Tour?", { ip: "203.0.113.9" }, baseEnv({ AI_CONCIERGE_KILL_SWITCH: "true" }));
    expect(result.outcome).toBe("RATE_LIMITED");
    expect(t.hits).toHaveLength(0);
    expect(t.provider.generate).not.toHaveBeenCalled();
  });

  it("limit configuration is strictly validated", () => {
    expect(readConciergeLimits({ AI_CONCIERGE_RATE_LIMITS: JSON.stringify(LIMITS) })).toMatchObject({ burst: { name: "burst", limit: 3 } });
    for (const raw of ["not json", "[]", "null", JSON.stringify({ burst: LIMITS.burst }), JSON.stringify({ ...LIMITS, global: { limit: 0, windowSeconds: 60 } }),
      JSON.stringify({ ...LIMITS, burst: { limit: 1.5, windowSeconds: 60 } }), JSON.stringify({ ...LIMITS, session: { limit: 5, windowSeconds: 99999999 } }), JSON.stringify({ ...LIMITS, burst: { limit: "5", windowSeconds: 60 } })]) {
      expect(readConciergeLimits({ AI_CONCIERGE_RATE_LIMITS: raw })).toBeNull();
    }
  });
});

describe("RT-72 observability integration (RT-73 contract; no new event categories)", () => {
  it("a limited response yields the approved rate_limited product event with a closed dimension", () => {
    for (const dimension of ["ip_hash", "session", "global"] as const) {
      const events = deriveProductEvents(syntheticEvent({ outcome: "RATE_LIMITED", response_kind: "degraded", handoff_reason: "rate_limited", handoff_offered: "H5", rate_limited_dimension: dimension }));
      const limited = events.find((e) => e.name === "rate_limited");
      expect(limited).toMatchObject({ dimension });
      expect(validateProductEvent(limited).ok).toBe(true);
      expect(events.every((e) => validateProductEvent(e).ok)).toBe(true);
    }
  });

  it("server metrics count limited requests and limiter store errors (limited bucket and limiter_store_errors_total)", async () => {
    const before = getServerObservability().metrics.snapshot().measured;
    const t = setup();
    for (let i = 0; i < 4; i++) await t.call();
    resetLimitersForTests();
    await handleConciergeMessage({ message: "O que é a Ricardo Tour?", locale: "pt" }, baseEnv(), { ip: "203.0.113.9" }, { provider: { retrieve: async () => [hit()], generate: async () => "x" } });
    const after = getServerObservability().metrics.snapshot().measured;
    expect(after.requests_total.limited - before.requests_total.limited).toBe(1);
    expect(after.limiter_store_errors_total - before.limiter_store_errors_total).toBe(1);
    expect(after.limiter_store_errors_by_class.unconfigured).toBeGreaterThanOrEqual(1);
    expect(after.provider_errors_total.limiter ?? 0).toBeGreaterThanOrEqual(1);
    resetLimitersForTests();
  });

  it("privacy canary: client address, session and message text never reach the store keys, results or events", async () => {
    const t = setup();
    const secrets = { ip: "203.0.113.77", message: "Meu email é ana.canario@exemplo.com e quero parapente-canario" };
    const events: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = await t.call(secrets.message, { ip: secrets.ip });
      events.push(JSON.stringify(result));
    }
    const wire = JSON.stringify([t.hits, events, getServerObservability().metrics.snapshot()]);
    expect(wire).not.toMatch(/203\.0\.113\.77|ana\.canario|exemplo|parapente-canario/);
    for (const key of t.hits) expect(key).toMatch(/^rl:production:(burst|session|global):[a-f0-9]{32}$/);
  });

  it("the limiter decision chain can be tested in isolation", async () => {
    const limiter = createLimiter({ store: createMemoryStore(), secret: "s".repeat(40), namespace: "x", failMode: "closed" });
    const limits = readConciergeLimits({ AI_CONCIERGE_RATE_LIMITS: JSON.stringify(LIMITS) });
    const decisions = [];
    for (let i = 0; i < 4; i++) decisions.push(await applyConciergeLimits(limiter, limits, { ip: "1.2.3.4" }, {}));
    expect(decisions.map((d) => d.allowed)).toEqual([true, true, true, false]);
    expect(decisions[3]).toMatchObject({ reason: "limited", dimension: "ip_hash" });
    expect(getLimiter).toBeTypeOf("function");
  });
});
