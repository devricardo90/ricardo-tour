import { createServer } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createLimiter, opaqueId } from "@/lib/rate-limit/limiter";
import { createMemoryStore } from "@/lib/rate-limit/memory-store";
import { HIT_SCRIPT, TTL_SLACK_SECONDS, createUpstashStore } from "@/lib/rate-limit/upstash-store";
import { RateLimitStoreError, type RateLimitRule } from "@/lib/rate-limit/types";
import { startUpstashEmulator } from "./helpers/upstash-emulator";

/**
 * Adapter tests: the REAL Upstash REST adapter over real local HTTP sockets against an in-process emulator of the REST
 * protocol. Everything here is EMULATOR-verified. Nothing in this file proves behaviour of a real Upstash database
 * (that is the gated live test, tests/rate-limit-upstash-live.test.ts, which is skipped until an account is authorized).
 */
let clock = 1_800_000_000_000; // fixed, window-aligned start
const emulator = await startUpstashEmulator({ clock: () => clock });
const rule: RateLimitRule = { name: "t", limit: 10, windowSeconds: 60 };
const store = (timeoutMs = 400) => createUpstashStore({ url: emulator.url, token: emulator.token, timeoutMs });

beforeAll(() => undefined);
afterAll(async () => emulator.close());
beforeEach(() => {
  emulator.reset();
  clock = 1_800_000_000_000;
});

async function errorClassOf(run: Promise<unknown>) {
  try {
    await run;
  } catch (error) {
    expect(error).toBeInstanceOf(RateLimitStoreError);
    return (error as RateLimitStoreError).errorClass;
  }
  throw new Error("expected a RateLimitStoreError");
}

describe("Upstash adapter over HTTP (emulator-verified)", () => {
  it("each check is exactly one round trip and one atomic EVAL, authenticated with the bearer token only", async () => {
    const s = store();
    for (let i = 0; i < 4; i++) await s.hit("rl:production:t:abc", rule, clock);
    expect(emulator.state.requests).toBe(4);
    expect(emulator.commands).toHaveLength(4);
    for (const command of emulator.commands) expect(command.slice(0, 3)).toEqual(["EVAL", HIT_SCRIPT, "1"]);
    expect(new Set(emulator.authHeaders)).toEqual(new Set([`Bearer ${emulator.token}`]));
    expect(new Set(emulator.urls)).toEqual(new Set(["/"])); // no analytics, telemetry or other endpoints are contacted
  });

  it("counts, limits and reports Retry-After from the fixed window", async () => {
    const s = store();
    const results = [];
    for (let i = 0; i < 12; i++) results.push(await s.hit("k", rule, clock));
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results[10]).toMatchObject({ allowed: false, count: 11, remaining: 0 });
    expect(results[10].retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(results[10].retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("concurrency: 60 parallel checks against limit 10 admit exactly 10 and no more", async () => {
    emulator.setMode("slow", 40); // hold every request open so all 60 are genuinely in flight at once
    const s = store(5_000);
    const results = await Promise.all(Array.from({ length: 60 }, () => s.hit("burst", rule, clock)));
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results.filter((r) => !r.allowed)).toHaveLength(50);
    expect(emulator.state.maxInFlight).toBeGreaterThan(20); // the requests really overlapped
    expect(new Set(results.map((r) => r.count)).size).toBe(60); // every attempt received a distinct counter value
  });

  it("two independent limiter instances (separate local state) share one budget through the store", async () => {
    emulator.setMode("slow", 20);
    const make = () => createLimiter({ store: store(5_000), secret: "s".repeat(40), namespace: "production", failMode: "closed", now: () => clock });
    const a = make();
    const b = make();
    const input = { rule, dimension: "burst", identifier: "203.0.113.9" };
    const outcomes = await Promise.all([...Array.from({ length: 15 }, () => a.check(input)), ...Array.from({ length: 15 }, () => b.check(input))]);
    expect(outcomes.filter((o) => o.allowed)).toHaveLength(10);
    expect(outcomes.filter((o) => o.limited)).toHaveLength(20);
  });

  it("TTL: keys carry window+slack seconds, expire by themselves, and a new window starts clean", async () => {
    const s = store();
    await s.hit("ttl", rule, clock);
    const [key] = emulator.keys();
    expect(key).toMatch(/^ttl:\d+$/);
    expect(Number(emulator.commands[0][4])).toBe(rule.windowSeconds + TTL_SLACK_SECONDS);
    expect(emulator.ttlOf(key)).toBe(rule.windowSeconds + TTL_SLACK_SECONDS);
    clock += (rule.windowSeconds + TTL_SLACK_SECONDS) * 1000 + 1;
    expect(emulator.keys()).toEqual([]); // nothing permanent is left behind
    expect((await s.hit("ttl", rule, clock)).count).toBe(1);
  });

  it("the first hit sets the expiry and later hits do not extend it", async () => {
    const s = store();
    await s.hit("fixed", rule, clock);
    const [key] = emulator.keys();
    const first = emulator.ttlOf(key);
    clock += 20_000;
    await s.hit("fixed", rule, clock);
    expect(emulator.ttlOf(key)).toBe((first ?? 0) - 20);
  });
});

describe("Upstash adapter failure handling (emulator-verified)", () => {
  it("timeout: a slow server fails within the timeout with class 'timeout'", async () => {
    emulator.setMode("slow", 1_500);
    const started = Date.now();
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("timeout");
    expect(Date.now() - started).toBeLessThan(1_200);
  });

  it("connection failure: a dropped socket and a closed port both yield class 'connection'", async () => {
    emulator.setMode("drop");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("connection");
    const closedPort = await new Promise<number>((resolve) => {
      const probe = createServer();
      probe.listen(0, "127.0.0.1", () => {
        const { port } = probe.address() as { port: number };
        probe.close(() => resolve(port));
      });
    });
    const dead = createUpstashStore({ url: `http://127.0.0.1:${closedPort}`, token: "t".repeat(20), timeoutMs: 400 });
    expect(await errorClassOf(dead.hit("k", rule, clock))).toBe("connection");
  });

  it("free-plan quota exhaustion: the documented error body and HTTP 429 are both 'quota_exhausted'", async () => {
    emulator.setMode("quota_400");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("quota_exhausted");
    emulator.setMode("quota_429");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("quota_exhausted");
  });

  it("auth, 5xx, malformed JSON and non-integer results are classified and never succeed", async () => {
    emulator.setMode("unauthorized");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("auth");
    emulator.setMode("server_500");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("unavailable");
    emulator.setMode("bad_json");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("malformed");
    emulator.setMode("non_integer");
    expect(await errorClassOf(store().hit("k", rule, clock))).toBe("malformed");
    const wrongToken = createUpstashStore({ url: emulator.url, token: "w".repeat(20) });
    emulator.setMode("ok");
    expect(await errorClassOf(wrongToken.hit("k", rule, clock))).toBe("auth");
  });

  it("errors carry only a closed class: no provider text, URL or token can leak through them", async () => {
    emulator.setMode("quota_400");
    try {
      await store().hit("k", rule, clock);
    } catch (error) {
      const text = `${(error as Error).message} ${(error as Error).name} ${JSON.stringify(error)}`;
      expect(text).not.toMatch(/500000|Usage|Limit:|127\.0\.0\.1|test-token|Bearer/);
    }
  });
});

describe("Concierge-style closed limiter over the failing store (emulator-verified)", () => {
  const closed = () => createLimiter({ store: store(), secret: "s".repeat(40), namespace: "production", failMode: "closed", now: () => clock, breaker: { threshold: 3, cooldownMs: 30_000 } });

  it("free-plan exhaustion denies the model path and the breaker stops hammering the store (no wasted calls or timeouts)", async () => {
    emulator.setMode("quota_400");
    const limiter = closed();
    for (let i = 0; i < 30; i++) {
      const r = await limiter.check({ rule, dimension: "burst", identifier: "203.0.113.9" });
      expect(r).toMatchObject({ allowed: false, limited: false });
    }
    expect(emulator.state.requests).toBe(3); // 3 failures opened the breaker; the other 27 never left the process
  });

  it("recovers after the cool-down when the store is healthy again", async () => {
    emulator.setMode("server_500");
    const limiter = closed();
    for (let i = 0; i < 3; i++) await limiter.check({ rule, dimension: "d", identifier: "x" });
    emulator.setMode("ok");
    clock += 31_000;
    expect((await limiter.check({ rule, dimension: "d", identifier: "x" })).allowed).toBe(true);
  });

  it("form-style degrade limiter keeps enforcing limits through a Redis outage", async () => {
    emulator.setMode("drop");
    const limiter = createLimiter({ store: store(), fallbackStore: createMemoryStore(() => clock), secret: "s".repeat(40), namespace: "production", failMode: "degrade", now: () => clock });
    const results = [];
    for (let i = 0; i < 14; i++) results.push(await limiter.check({ rule, dimension: "form", identifier: "x" }));
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results.every((r) => r.degraded)).toBe(true);
  });
});

describe("Redis-side privacy: only opaque keys and counters ever leave the process (emulator-verified)", () => {
  it("keys and commands contain no raw IP, e-mail, phone, booking id, message or conversation text", async () => {
    const secret = "p".repeat(40);
    const limiter = createLimiter({ store: store(), secret, namespace: "production", failMode: "closed", now: () => clock });
    const canaries = ["203.0.113.77", "ana.canario@exemplo.com", "+55 11 91234-5678", "RT-998877", "Quero reservar o passeio canario"];
    for (const canary of canaries) {
      await limiter.check({ rule, dimension: "burst", identifier: canary });
      await limiter.check({ rule: { ...rule, name: "session" }, dimension: "session", identifier: canary });
    }
    const wire = JSON.stringify([emulator.commands, emulator.keys(), emulator.authHeaders.map((h) => h?.replace(emulator.token, "TOKEN")), emulator.urls]);
    for (const canary of canaries) expect(wire).not.toContain(canary);
    expect(wire).not.toMatch(/203\.0\.113|ana\.canario|exemplo|91234|998877|canario/);
    for (const key of emulator.keys()) expect(key).toMatch(/^rl:production:(t|session):[a-f0-9]{32}:\d+$/);
    expect(emulator.keys()[0]).toContain(opaqueId(secret, "burst", canaries[0]));
    for (const command of emulator.commands) expect(command).toHaveLength(5); // EVAL, script, numkeys, one key, one ttl: nothing else is sent
  });
});
