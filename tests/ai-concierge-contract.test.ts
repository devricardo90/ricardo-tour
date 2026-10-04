import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as postAIConcierge } from "@/app/api/ai-concierge/route";
import { isAIConciergeEnabled } from "@/lib/ai-concierge/config";
import {
  AI_CONCIERGE_MAX_MESSAGE_LENGTH,
  parseAIConciergeRequest,
} from "@/lib/ai-concierge/contract";
import { createMockAIConciergeResponse } from "@/lib/ai-concierge/mock-backend";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI Concierge feature flag", () => {
  it("can be disabled explicitly", () => {
    expect(isAIConciergeEnabled({ AI_CONCIERGE_ENABLED: "false" })).toBe(false);
    expect(isAIConciergeEnabled({ NEXT_PUBLIC_AI_CONCIERGE_ENABLED: "0" })).toBe(false);
  });

  it("keeps production disabled even when an enable flag is set", () => {
    expect(isAIConciergeEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isAIConciergeEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(
      isAIConciergeEnabled({ VERCEL_ENV: "production", AI_CONCIERGE_ENABLED: "true" })
    ).toBe(false);
    expect(
      isAIConciergeEnabled({ NODE_ENV: "production", NEXT_PUBLIC_AI_CONCIERGE_ENABLED: "on" })
    ).toBe(false);
  });

  it("defaults to enabled outside production for the UI shell", () => {
    expect(isAIConciergeEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("returns 503 from the API in production even when the mock flag is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("AI_CONCIERGE_ENABLED", "true");

    const response = await postAIConcierge(
      new Request("https://www.ricardotour.com/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en", message: "safe production gate probe" }),
      })
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      status: "error",
      error: { code: "FEATURE_DISABLED" },
    });
  });
});

describe("AI Concierge request contract", () => {
  it("accepts a valid request and normalizes the message", () => {
    const parsed = parseAIConciergeRequest({
      locale: "pt",
      message: "  Quero   um passeio de meio dia  ",
      pageContext: { path: "/pt/contato", surface: "contact" },
    });

    expect(parsed).toEqual({
      ok: true,
      value: {
        locale: "pt",
        message: "Quero um passeio de meio dia",
        pageContext: { path: "/pt/contato", surface: "contact" },
      },
    });
  });

  it("rejects unsupported locales and oversized messages", () => {
    expect(
      parseAIConciergeRequest({ locale: "fr", message: "Hello" })
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_REQUEST" },
    });

    expect(
      parseAIConciergeRequest({
        locale: "pt",
        message: "x".repeat(AI_CONCIERGE_MAX_MESSAGE_LENGTH + 1),
      })
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_REQUEST" },
    });
  });
});

describe("AI Concierge mocked backend", () => {
  it("returns a deterministic safe mocked response", () => {
    const request = {
      locale: "pt" as const,
      message: "Quero um passeio de meio dia",
    };

    const first = createMockAIConciergeResponse(request);
    const second = createMockAIConciergeResponse(request);

    expect(first).toEqual(second);
    expect(first.responseKind).toBe("mock");
    expect(first.handoffRequired).toBe(true);
    expect(first.answer).toContain("resposta inicial simulada");
    expect(first.answer).toContain("precos");
    expect(first.safetyFlags).toContain("no_availability_confirmation");
  });
});
