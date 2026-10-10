import { describe, expect, it } from "vitest";
import { readLimiterConfig } from "@/lib/rate-limit/config";
import { createLimiter } from "@/lib/rate-limit/limiter";
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
