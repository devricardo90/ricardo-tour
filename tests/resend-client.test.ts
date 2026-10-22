import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The real SDK is never reached: the constructor and its send are spies, so no e-mail can leave the test run.
const constructed = vi.fn();
const sdkSend = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => sdkSend(...args) };
    constructor(apiKey: string) {
      constructed(apiKey);
    }
  },
}));

const payload = { from: "Ricardo Tour <notificacoes@ricardotour.com>", to: ["test@example.test"], subject: "s", text: "t" };

describe("lib/resend without RESEND_API_KEY (preview builds)", () => {
  beforeEach(() => {
    vi.resetModules();
    constructed.mockReset();
    sdkSend.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("imports without the key and creates no client", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const mod = await import("@/lib/resend");
    expect(mod.isEmailServiceConfigured()).toBe(false);
    expect(constructed).not.toHaveBeenCalled();
  });

  it("send makes no external call and reports the service as unavailable (never a success)", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { resend, EMAIL_SERVICE_UNAVAILABLE_MESSAGE } = await import("@/lib/resend");
    const result = await resend.emails.send(payload);
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ name: "missing_api_key", statusCode: null, message: EMAIL_SERVICE_UNAVAILABLE_MESSAGE });
    expect(constructed).not.toHaveBeenCalled();
    expect(sdkSend).not.toHaveBeenCalled();
  });

  it("with the key configured, delegates to the SDK unchanged", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_mocked");
    sdkSend.mockResolvedValue({ data: { id: "msg_1" }, error: null, headers: null });
    const { resend, isEmailServiceConfigured } = await import("@/lib/resend");
    expect(isEmailServiceConfigured()).toBe(true);
    const result = await resend.emails.send(payload, { idempotencyKey: "k" });
    expect(constructed).toHaveBeenCalledWith("re_test_mocked");
    expect(sdkSend).toHaveBeenCalledWith(payload, { idempotencyKey: "k" });
    expect(result).toEqual({ data: { id: "msg_1" }, error: null, headers: null });
    await resend.emails.send(payload);
    expect(constructed).toHaveBeenCalledTimes(1);
  });

  it("contact notifications in send mode without the key end as failed, not sent", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("CONTACT_EMAIL_MODE", "send");
    vi.doMock("@/lib/observability/report", () => ({ reportServerError: vi.fn() }));
    const { sendContactNotification } = await import("@/lib/services/tour-request-notification");
    await expect(sendContactNotification({ submissionId: "s1", subject: "x", message: "y" })).resolves.toBe("failed");
    expect(sdkSend).not.toHaveBeenCalled();
  });
});
