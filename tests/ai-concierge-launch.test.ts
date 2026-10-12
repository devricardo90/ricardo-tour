import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getConciergeLaunchStatus } from "@/lib/ai-concierge/launch";

// Daniela V1 launch guard, endpoint and mount. No network and no model: the runtime is mocked at the module boundary.
const RUNTIME_ENV = { OPENAI_API_KEY: "sk-test-0123456789abcdef", OPENAI_CONCIERGE_VECTOR_STORE_ID: "vs_test12345678", OPENAI_CONCIERGE_MODEL: "dev-model" };
const LIMITER_ENV = { UPSTASH_REDIS_REST_URL: "https://example-redis.upstash.io", UPSTASH_REDIS_REST_TOKEN: "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789", RATE_LIMIT_HMAC_SECRET: "x".repeat(40) };
const QUOTAS = { AI_CONCIERGE_RATE_LIMITS: JSON.stringify({ burst: { limit: 10, windowSeconds: 60 }, session: { limit: 30, windowSeconds: 3600 }, global: { limit: 1000, windowSeconds: 86400 } }) };

describe("launch guard", () => {
  it("is OFF by default, everywhere", () => {
    expect(getConciergeLaunchStatus({}).enabled).toBe(false);
    expect(getConciergeLaunchStatus({}).blockers).toContain("flag_off");
    expect(getConciergeLaunchStatus({ NODE_ENV: "development" }).enabled).toBe(false);
  });

  it("non-production: needs the explicit flag and a valid runtime configuration; the kill switch wins", () => {
    expect(getConciergeLaunchStatus({ AI_CONCIERGE_ENABLED: "true" }).blockers).toEqual(["openai_runtime_config_missing"]);
    expect(getConciergeLaunchStatus({ AI_CONCIERGE_ENABLED: "true", ...RUNTIME_ENV })).toMatchObject({ enabled: true, environment: "non-production", blockers: [] });
    expect(getConciergeLaunchStatus({ AI_CONCIERGE_ENABLED: "true", AI_CONCIERGE_KILL_SWITCH: "1", ...RUNTIME_ENV })).toMatchObject({ enabled: false, blockers: ["kill_switch_on"] });
    expect(getConciergeLaunchStatus({ AI_CONCIERGE_ENABLED: "yes", ...RUNTIME_ENV, OPENAI_CONCIERGE_VECTOR_STORE_ID: "tampered" }).enabled).toBe(false);
  });

  it("production: every mandatory criterion is listed, and the code-level approvals (legal text, emergency wording) still block it", () => {
    const flagOnly = getConciergeLaunchStatus({ NODE_ENV: "production", AI_CONCIERGE_ENABLED: "true" });
    expect(flagOnly.enabled).toBe(false);
    expect(flagOnly.blockers).toEqual(
      expect.arrayContaining(["openai_runtime_config_missing", "rt75_owner_gate_not_approved", "legal_review_pending", "emergency_wording_not_approved", "shared_rate_limiter_not_configured"]),
    );
    // Even with the flag, the Owner gate variable, the infrastructure and the quotas, the two approvals recorded in code keep it closed.
    const everythingElse = getConciergeLaunchStatus({ VERCEL_ENV: "production", AI_CONCIERGE_ENABLED: "true", AI_CONCIERGE_RT75_GATE_APPROVED: "true", ...RUNTIME_ENV, ...LIMITER_ENV, ...QUOTAS });
    expect(everythingElse.enabled).toBe(false);
    expect(everythingElse.blockers).toEqual(["legal_review_pending", "emergency_wording_not_approved"]);
  });
});

describe("the public site mounts Daniela only behind the guard", () => {
  const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
  it("the site layout renders the mount only when the guard allows it; the legacy mock widget is gone from every layout", () => {
    const layout = read("app/[locale]/(site)/layout.tsx");
    expect(layout).toContain("{isConciergeEnabled() ? <ConciergeMount locale={locale} /> : null}");
    expect(read("app/[locale]/(public)/layout.tsx")).not.toMatch(/AIConciergeWidget|isAIConciergeEnabled/);
  });

  it("the mount uses no storage, cookies or tracking, and sends only the closed fields", () => {
    const source = read("components/ai-concierge/concierge-mount.tsx");
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|gtag|posthog/);
    expect(source).toContain('credentials: "omit"');
    expect(source).toContain("/api/ai-concierge/events");
  });
});

describe("POST /api/ai-concierge", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@/lib/ai-concierge/runtime");
    vi.doUnmock("@/lib/ai-concierge/observability/notify");
    vi.doUnmock("next/server");
  });

  const enable = () => {
    for (const [key, value] of Object.entries({ AI_CONCIERGE_ENABLED: "true", ...RUNTIME_ENV })) vi.stubEnv(key, value);
  };
  const call = async (body: unknown, headers: Record<string, string> = {}, raw?: string) => {
    const { POST } = await import("@/app/api/ai-concierge/route");
    return POST(new Request("http://localhost/api/ai-concierge", { method: "POST", headers: { "content-type": "application/json", host: "localhost", ...headers }, body: raw ?? JSON.stringify(body) }));
  };
  const mockRuntime = (result: unknown) => {
    const handleConciergeMessage = vi.fn(async () => result);
    vi.doMock("@/lib/ai-concierge/runtime", () => ({ handleConciergeMessage }));
    return handleConciergeMessage;
  };

  it("answers 503 FEATURE_DISABLED while the guard is closed, without touching the runtime", async () => {
    const handle = mockRuntime({});
    const response = await call({ message: "oi", locale: "pt" });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "error", error: { code: "FEATURE_DISABLED" } });
    expect(handle).not.toHaveBeenCalled();
  });

  it("when enabled, returns only the closed reply shape, never cached, and passes the platform client address", async () => {
    enable();
    const handle = mockRuntime({
      outcome: "ANSWER", answer: "Olá!", response_kind: "grounded", tour_ids: ["cmlhxkpy9000028zq27rhytew"],
      source_ids: ["approved-faq:pt"], source_versions: ["sha256:abc"], chunk_ids: ["deadbeef"], error_class: "limiter",
    });
    const response = await call({ message: "oi", locale: "pt" }, { "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["answer", "outcome", "response_kind", "tour_ids"]);
    expect(JSON.stringify(body)).not.toMatch(/approved-faq|sha256|deadbeef|limiter/);
    expect(handle.mock.calls[0]).toEqual([{ message: "oi", locale: "pt" }, process.env, { ip: "203.0.113.9" }]);
  });

  it("maps a rate-limited result to 429 with Retry-After", async () => {
    enable();
    mockRuntime({ outcome: "RATE_LIMITED", answer: "limite", response_kind: "degraded", retry_after_seconds: 12.2, source_ids: [], source_versions: [], chunk_ids: [] });
    const response = await call({ message: "oi", locale: "pt" });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("13");
  });

  it("rejects cross-site, non-JSON, oversize and malformed requests before the runtime", async () => {
    enable();
    const handle = mockRuntime({});
    expect((await call({ message: "x", locale: "pt" }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await call({ message: "x", locale: "pt" }, { origin: "https://evil.example" })).status).toBe(403);
    expect((await call({ message: "x", locale: "pt" }, { "content-type": "text/plain" })).status).toBe(415);
    expect((await call({ message: "x", locale: "pt" }, { "content-length": "99999" })).status).toBe(413);
    expect((await call(null, {}, "x".repeat(13_000))).status).toBe(413);
    expect((await call(null, {}, "{not json")).status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it("never leaks internals when the runtime throws", async () => {
    enable();
    vi.doMock("@/lib/ai-concierge/runtime", () => ({
      handleConciergeMessage: vi.fn(async () => {
        throw new Error("secret stack detail sk-live-123456789012345678901234");
      }),
    }));
    const response = await call({ message: "oi", locale: "pt" });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/secret|sk-live|stack/);
  });

  // RT-96 (G3): a slow or hanging alert e-mail must never delay the visitor's answer, and failures are still evaluated.
  const mockHangingNotifier = () => {
    const check = vi.fn(() => new Promise<never>(() => {}));
    vi.doMock("@/lib/ai-concierge/observability/notify", () => ({ getAlertNotifier: () => ({ check }) }));
    return check;
  };

  it("answers without waiting for alert delivery", async () => {
    enable();
    mockRuntime({ outcome: "ANSWER", answer: "Olá!", response_kind: "grounded", source_ids: [], source_versions: [], chunk_ids: [] });
    const check = mockHangingNotifier();
    const response = await Promise.race([
      call({ message: "oi", locale: "pt" }),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), 2_000)),
    ]);
    expect(response).not.toBe("timeout");
    expect((response as Response).status).toBe(200);
    expect(check).toHaveBeenCalledTimes(1);
    vi.doUnmock("@/lib/ai-concierge/observability/notify");
  });

  it("inside a request scope, registers the alert check with after() instead of running it before the reply", async () => {
    enable();
    mockRuntime({ outcome: "ANSWER", answer: "Olá!", response_kind: "grounded", source_ids: [], source_versions: [], chunk_ids: [] });
    const check = mockHangingNotifier();
    const deferred: Array<() => unknown> = [];
    vi.doMock("next/server", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/server")>()), after: (task: () => unknown) => { deferred.push(task); } }));
    const response = await call({ message: "oi", locale: "pt" });
    expect(response.status).toBe(200);
    expect(deferred).toHaveLength(1);
    expect(check).not.toHaveBeenCalled(); // nothing ran before the reply
    void deferred[0]();
    expect(check).toHaveBeenCalledTimes(1);
    vi.doUnmock("next/server");
  });

  it("still evaluates alerts when the runtime fails (500 path)", async () => {
    enable();
    vi.doMock("@/lib/ai-concierge/runtime", () => ({ handleConciergeMessage: vi.fn(async () => { throw new Error("boom"); }) }));
    const check = mockHangingNotifier();
    const response = await call({ message: "oi", locale: "pt" });
    expect(response.status).toBe(500);
    expect(check).toHaveBeenCalledTimes(1);
    vi.doUnmock("@/lib/ai-concierge/observability/notify");
  });
});

describe("POST /api/ai-concierge/events", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  const send = async (body: unknown, headers: Record<string, string> = {}) => {
    const { POST } = await import("@/app/api/ai-concierge/events/route");
    return POST(new Request("http://localhost/api/ai-concierge/events", { method: "POST", headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 250)}`, ...headers }, body: JSON.stringify(body) }));
  };

  it("is not found while the Concierge is off", async () => {
    expect((await send({ name: "concierge_opened", surface: "public_site" })).status).toBe(404);
  });

  it("records only the two closed client events; anything else is rejected", async () => {
    for (const [key, value] of Object.entries({ AI_CONCIERGE_ENABLED: "true", ...RUNTIME_ENV })) vi.stubEnv(key, value);
    expect((await send({ name: "concierge_opened", surface: "public_site" })).status).toBe(204);
    expect((await send({ name: "handoff_clicked", channel: "whatsapp", handoff_code: "H9" })).status).toBe(204);
    expect((await send({ name: "handoff_clicked", channel: "whatsapp", handoff_code: "H9", message: "free text" })).status).toBe(400);
    expect((await send({ name: "message_sent", length_bucket: "short" })).status).toBe(204); // a valid RT-73 name: validated by the strict schema
    expect((await send({ name: "concierge_opened" }, { "sec-fetch-site": "cross-site" })).status).toBe(403);
  });
});
