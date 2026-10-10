import { describe, expect, it, vi } from "vitest";
import { readLimiterConfig } from "@/lib/rate-limit/config";
import { createLimiter, opaqueId } from "@/lib/rate-limit/limiter";
import { createMemoryCore, createMemoryStore } from "@/lib/rate-limit/memory-store";
import { RateLimitStoreError, type LimiterEvent, type RateLimitRule, type RateLimitStore } from "@/lib/rate-limit/types";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/security/rate-limit";

// RT-72 / RT-82 deterministic tests: in-memory only, no network. Fake clocks everywhere.
const rule: RateLimitRule = { name: "t", limit: 3, windowSeconds: 60 };
const SECRET = "s".repeat(40);

describe("memory store (the single in-memory implementation)", () => {
  it("counts within a fixed window, expires on the next window, and isolates keys", () => {
    const core = createMemoryCore();
    expect(core.hit("a", rule, 0)).toMatchObject({ allowed: true, count: 1, remaining: 2 });
    core.hit("a", rule, 10_000);
    expect(core.hit("a", rule, 20_000)).toMatchObject({ allowed: true, count: 3, remaining: 0 });
    const blocked = core.hit("a", rule, 30_000);
    expect(blocked).toMatchObject({ allowed: false, count: 4, remaining: 0 });
    expect(blocked.retryAfterSeconds).toBe(30);
    expect(core.hit("b", rule, 30_000).allowed).toBe(true);
    expect(core.hit("a", rule, 60_000)).toMatchObject({ allowed: true, count: 1 }); // TTL: a new window starts clean
  });

  it("is bounded in memory under key-rotation floods", () => {
    const core = createMemoryCore();
    for (let i = 0; i < 12_000; i++) core.hit(`k${i}`, rule, 0);
    expect(core.size()).toBeLessThanOrEqual(5_000);
    expect(createMemoryStore(() => 0)).toBeTruthy();
  });

  it("the legacy createRateLimiter API is a thin wrapper over the same core (no second implementation)", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.isLimited("ip", 0)).toBe(false);
    expect(limiter.isLimited("ip", 10)).toBe(false);
    expect(limiter.isLimited("ip", 20)).toBe(true);
    expect(limiter.isLimited("other", 20)).toBe(false);
    expect(limiter.isLimited("ip", 2000)).toBe(false);
    expect(clientKeyFromHeaders({ get: (n) => (n === "x-forwarded-for" ? "203.0.113.9, 10.0.0.1" : null) })).toBe("203.0.113.9");
    expect(clientKeyFromHeaders({ get: () => null })).toBe("unknown");
  });
});

describe("opaque identifiers (HMAC)", () => {
  it("are deterministic, secret-dependent, dimension-separated and never contain the input", () => {
    const id = opaqueId(SECRET, "burst", "203.0.113.9");
    expect(id).toBe(opaqueId(SECRET, "burst", "203.0.113.9"));
    expect(id).toMatch(/^[a-f0-9]{32}$/);
    expect(id).not.toContain("203");
    expect(opaqueId("t".repeat(40), "burst", "203.0.113.9")).not.toBe(id);
    expect(opaqueId(SECRET, "session", "203.0.113.9")).not.toBe(id);
    expect(opaqueId(SECRET, "burst", "203.0.113.10")).not.toBe(id);
  });
});

function makeLimiter(store: RateLimitStore | null, extra: Partial<Parameters<typeof createLimiter>[0]> = {}) {
  let clock = 1_000_000;
  const events: LimiterEvent[] = [];
  const limiter = createLimiter({ store, secret: SECRET, namespace: "production", failMode: "closed", onEvent: (e) => events.push(e), now: () => clock, ...extra });
  return { limiter, events, advance: (ms: number) => (clock += ms), clock: () => clock };
}
const failing = (errorClass: ConstructorParameters<typeof RateLimitStoreError>[0]): RateLimitStore => ({
  hit: vi.fn(async () => {
    throw new RateLimitStoreError(errorClass);
  }),
});

describe("limiter: keys, limits and the local deny cache", () => {
  it("builds namespaced opaque keys and never passes the identifier to the store", async () => {
    const seen: string[] = [];
    const store: RateLimitStore = { hit: async (key, r, now) => (seen.push(key), createMemoryCore().hit(key, r, now)) };
    const { limiter } = makeLimiter(store);
    await limiter.check({ rule, dimension: "burst", identifier: "203.0.113.9" });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatch(/^rl:production:t:[a-f0-9]{32}$/);
    expect(seen[0]).not.toContain("203.0.113.9");
  });

  it("denies over the limit with Retry-After and stops calling the store for a key already blocked (protects the free quota)", async () => {
    const store = createMemoryStore();
    const spy = vi.spyOn(store, "hit");
    const { limiter, events, advance } = makeLimiter(store);
    for (let i = 0; i < 3; i++) expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).allowed).toBe(true);
    const first = await limiter.check({ rule, dimension: "d", identifier: "x" });
    expect(first).toMatchObject({ allowed: false, limited: true });
    expect(first.retryAfterSeconds).toBeGreaterThan(0);
    const callsAtBlock = spy.mock.calls.length;
    for (let i = 0; i < 50; i++) expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).limited).toBe(true);
    expect(spy.mock.calls.length).toBe(callsAtBlock); // 50 blocked attempts cost zero store commands
    expect(events.filter((e) => e.type === "checked" && e.source === "local_deny_cache")).toHaveLength(50);
    advance(61_000);
    expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).allowed).toBe(true); // window rolled over
  });

  it("limits identifiers independently", async () => {
    const { limiter } = makeLimiter(createMemoryStore());
    for (let i = 0; i < 4; i++) await limiter.check({ rule, dimension: "d", identifier: "a" });
    expect((await limiter.check({ rule, dimension: "d", identifier: "a" })).limited).toBe(true);
    expect((await limiter.check({ rule, dimension: "d", identifier: "b" })).allowed).toBe(true);
  });
});

describe("limiter: store failures never fail open silently", () => {
  const classes = ["timeout", "connection", "quota_exhausted", "auth", "unavailable", "malformed"] as const;

  it.each(classes)("closed mode (Concierge) denies on %s and reports a closed error class", async (errorClass) => {
    const { limiter, events } = makeLimiter(failing(errorClass));
    const result = await limiter.check({ rule, dimension: "d", identifier: "x" });
    expect(result).toMatchObject({ allowed: false, limited: false, degraded: false, storeError: errorClass });
    expect(events).toContainEqual(expect.objectContaining({ type: "store_error", errorClass }));
  });

  it("closed mode denies when the shared store is not configured", async () => {
    const { limiter } = makeLimiter(null);
    expect(await limiter.check({ rule, dimension: "d", identifier: "x" })).toMatchObject({ allowed: false, storeError: "unconfigured" });
  });

  it("degrade mode (public forms) uses the per-instance fallback visibly and still enforces a limit", async () => {
    const { limiter, events } = makeLimiter(failing("quota_exhausted"), { failMode: "degrade", fallbackStore: createMemoryStore() });
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await limiter.check({ rule, dimension: "form", identifier: "x" }));
    expect(results.slice(0, 3).every((r) => r.allowed && r.degraded)).toBe(true);
    expect(results.slice(3).every((r) => !r.allowed && r.limited && r.degraded)).toBe(true); // protection is not disabled
    expect(events).toContainEqual({ type: "fallback_in_use", namespace: "production", reason: "quota_exhausted" });
  });

  it("degrade mode with no shared store configured behaves like the previous limiter and says so", async () => {
    const { limiter, events } = makeLimiter(null, { failMode: "degrade", fallbackStore: createMemoryStore() });
    for (let i = 0; i < 3; i++) expect((await limiter.check({ rule, dimension: "form", identifier: "x" })).allowed).toBe(true);
    expect((await limiter.check({ rule, dimension: "form", identifier: "x" })).limited).toBe(true);
    expect(events.some((e) => e.type === "fallback_in_use" && e.reason === "unconfigured")).toBe(true);
  });

  it("degrade mode without a fallback store still denies (no accidental fail-open)", async () => {
    const { limiter } = makeLimiter(failing("timeout"), { failMode: "degrade" });
    expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).allowed).toBe(false);
  });

  it("circuit breaker: after repeated failures the store is not called again until the cool-down ends", async () => {
    const store = failing("timeout");
    const { limiter, advance } = makeLimiter(store, { breaker: { threshold: 3, cooldownMs: 30_000 } });
    for (let i = 0; i < 3; i++) await limiter.check({ rule, dimension: "d", identifier: "x" });
    expect(store.hit).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 20; i++) expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).storeError).toBe("unavailable");
    expect(store.hit).toHaveBeenCalledTimes(3); // 20 more requests, zero extra round trips or timeouts
    advance(31_000);
    await limiter.check({ rule, dimension: "d", identifier: "x" });
    expect(store.hit).toHaveBeenCalledTimes(4); // half-open probe after the cool-down
  });

  it("a successful call resets the failure count", async () => {
    let fail = true;
    const store: RateLimitStore = { hit: async (key, r, now) => { if (fail) throw new RateLimitStoreError("timeout"); return createMemoryCore().hit(key, r, now); } };
    const { limiter } = makeLimiter(store, { breaker: { threshold: 3, cooldownMs: 30_000 } });
    await limiter.check({ rule, dimension: "d", identifier: "x" });
    await limiter.check({ rule, dimension: "d", identifier: "x" });
    fail = false;
    expect((await limiter.check({ rule, dimension: "d", identifier: "y" })).allowed).toBe(true);
    fail = true;
    await limiter.check({ rule, dimension: "d", identifier: "x" });
    await limiter.check({ rule, dimension: "d", identifier: "x" });
    expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).storeError).toBe("timeout"); // not yet open
  });

  it("a throwing telemetry hook never breaks a limit decision", async () => {
    const limiter = createLimiter({ store: createMemoryStore(), secret: SECRET, namespace: "p", failMode: "closed", onEvent: () => { throw new Error("telemetry down"); } });
    expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).allowed).toBe(true);
  });

  it("limiter events carry only counts and closed labels", async () => {
    const { limiter, events } = makeLimiter(failing("auth"));
    await limiter.check({ rule, dimension: "burst", identifier: "203.0.113.9 ana@exemplo.com" });
    expect(JSON.stringify(events)).not.toMatch(/203\.|ana@|exemplo/);
  });
});

describe("limiter configuration (server-only, shape-validated)", () => {
  const good = { UPSTASH_REDIS_REST_URL: "https://eu1-sample-12345.upstash.io", UPSTASH_REDIS_REST_TOKEN: "AbCdEf0123456789AbCdEf0123456789", RATE_LIMIT_HMAC_SECRET: SECRET, VERCEL_ENV: "production" };

  it("accepts a well-formed configuration, derives an environment namespace and accepts the KV_* alias names", () => {
    expect(readLimiterConfig(good)).toMatchObject({ url: good.UPSTASH_REDIS_REST_URL, namespace: "production" });
    const alias = { KV_REST_API_URL: good.UPSTASH_REDIS_REST_URL, KV_REST_API_TOKEN: good.UPSTASH_REDIS_REST_TOKEN, RATE_LIMIT_HMAC_SECRET: SECRET, NODE_ENV: "development" };
    expect(readLimiterConfig(alias)?.namespace).toBe("development");
  });

  it("rejects missing, malformed or redirecting values so a tampered variable cannot capture the bearer token", () => {
    const bad: Array<Record<string, string | undefined>> = [
      {}, { ...good, UPSTASH_REDIS_REST_URL: undefined }, { ...good, UPSTASH_REDIS_REST_TOKEN: undefined }, { ...good, RATE_LIMIT_HMAC_SECRET: undefined },
      { ...good, RATE_LIMIT_HMAC_SECRET: "short" },
      { ...good, UPSTASH_REDIS_REST_URL: "http://eu1-sample-12345.upstash.io" },
      { ...good, UPSTASH_REDIS_REST_URL: "https://evil.example.com" },
      { ...good, UPSTASH_REDIS_REST_URL: "https://upstash.io.evil.com" },
      { ...good, UPSTASH_REDIS_REST_URL: "https://user:pw@eu1-sample-12345.upstash.io" },
      { ...good, UPSTASH_REDIS_REST_URL: "not a url" },
      { ...good, UPSTASH_REDIS_REST_TOKEN: "has spaces and symbols !!!" },
    ];
    for (const env of bad) expect(readLimiterConfig(env), JSON.stringify(Object.keys(env))).toBeNull();
  });
});
