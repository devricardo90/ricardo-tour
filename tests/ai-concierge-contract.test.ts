import { describe, expect, it } from "vitest";
import { isAIConciergeEnabled } from "@/lib/ai-concierge/config";
import {
  AI_CONCIERGE_MAX_MESSAGE_LENGTH,
  parseAIConciergeRequest,
} from "@/lib/ai-concierge/contract";
import { createMockAIConciergeResponse } from "@/lib/ai-concierge/mock-backend";

describe("AI Concierge feature flag", () => {
  it("can be disabled explicitly", () => {
    expect(isAIConciergeEnabled({ AI_CONCIERGE_ENABLED: "false" })).toBe(false);
    expect(isAIConciergeEnabled({ NEXT_PUBLIC_AI_CONCIERGE_ENABLED: "0" })).toBe(false);
  });

  it("defaults to disabled for production when no flag is set", () => {
    expect(isAIConciergeEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(isAIConciergeEnabled({ VERCEL_ENV: "production" })).toBe(false);
  });

  it("defaults to enabled outside production for the UI shell", () => {
    expect(isAIConciergeEnabled({ NODE_ENV: "development" })).toBe(true);
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
