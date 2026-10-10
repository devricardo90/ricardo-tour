import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getServerObservability } from "@/lib/ai-concierge/observability";
import { FORM_LIMIT, isFormSubmissionLimited, resetLimitersForTests } from "@/lib/rate-limit/server";

// RT-82 public-form limiter. With no Upstash credentials (the current state) behaviour must equal the previous
// limiter (5 per 10 minutes per client) and the degradation must be visible, not silent. Deterministic; no network.
const headers = (ip?: string) => ({ get: (name: string) => (name === "x-forwarded-for" && ip ? ip : null) });

beforeEach(() => {
  resetLimitersForTests();
  for (const name of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "RATE_LIMIT_HMAC_SECRET"]) vi.stubEnv(name, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("public forms use the shared limiter", () => {
  it("keeps the previous numbers: 5 attempts per client allowed, the 6th refused", async () => {
    expect(FORM_LIMIT).toEqual({ limit: 5, windowSeconds: 600 });
    const outcomes = [];
    for (let i = 0; i < 7; i++) outcomes.push(await isFormSubmissionLimited(headers("203.0.113.9"), "contact_message"));
    expect(outcomes).toEqual([false, false, false, false, false, true, true]);
  });

  it("separates clients and separates the two forms", async () => {
    for (let i = 0; i < 6; i++) await isFormSubmissionLimited(headers("203.0.113.9"), "contact_message");
    expect(await isFormSubmissionLimited(headers("203.0.113.9"), "contact_message")).toBe(true);
    expect(await isFormSubmissionLimited(headers("203.0.113.9"), "tour_request")).toBe(false);
    expect(await isFormSubmissionLimited(headers("203.0.113.10"), "contact_message")).toBe(false);
  });

  it("requests without a client address share one bucket (never unlimited)", async () => {
    const outcomes = [];
    for (let i = 0; i < 6; i++) outcomes.push(await isFormSubmissionLimited(headers(), "tour_request"));
    expect(outcomes.at(-1)).toBe(true);
  });

  it("without shared-store credentials the per-instance fallback is announced once and counted (never silent)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const before = getServerObservability().metrics.snapshot().measured.limiter_fallback_in_use_total;
    for (let i = 0; i < 4; i++) await isFormSubmissionLimited(headers("203.0.113.9"), "contact_message");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/per-instance fallback/);
    expect(String(warn.mock.calls[0][0])).not.toMatch(/203\.0\.113|upstash\.io|token/i);
    expect(getServerObservability().metrics.snapshot().measured.limiter_fallback_in_use_total - before).toBe(4);
  });

  it("the client address never appears in logs or metrics", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await isFormSubmissionLimited(headers("203.0.113.55"), "tour_request");
    expect(JSON.stringify([warn.mock.calls, getServerObservability().metrics.snapshot()])).not.toContain("203.0.113.55");
  });

  it("both form actions call the shared limiter and no longer contain a limiter of their own", () => {
    for (const file of ["app/actions/contact-message.ts", "app/actions/tour-request.ts"]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).toMatch(/isFormSubmissionLimited\(h, "(?:contact_message|tour_request)"\)/);
      expect(source, file).not.toMatch(/createRateLimiter|limiter\.isLimited/);
    }
  });

  it("there is one limiter implementation: no other file keeps its own counting logic", () => {
    const legacy = readFileSync(resolve(process.cwd(), "lib/security/rate-limit.ts"), "utf8");
    expect(legacy).toContain("createMemoryCore");
    expect(legacy).not.toMatch(/new Map|\.filter\(/);
  });
});
