import { afterEach, describe, expect, it, vi } from "vitest";

// RT-96 review: alert e-mails run after the response, but a hanging provider call must still end, or the function stays
// alive (cost, concurrency) until its maximum duration.
describe("resendAlertSender", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@/lib/resend");
  });

  it("gives up after ALERT_SEND_TIMEOUT_MS and reports non-delivery", async () => {
    vi.useFakeTimers();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.doMock("@/lib/resend", () => ({ resend: { emails: { send: () => new Promise(() => {}) } } }));
    const { resendAlertSender, ALERT_SEND_TIMEOUT_MS } = await import("@/lib/ai-concierge/observability/notify");
    const result = resendAlertSender({ to: ["ops@example.com"], subject: "alert", text: "x" });
    await vi.advanceTimersByTimeAsync(ALERT_SEND_TIMEOUT_MS + 1);
    await expect(result).resolves.toBe(false);
  });

  it("still reports a successful send", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.doMock("@/lib/resend", () => ({ resend: { emails: { send: async () => ({ error: null }) } } }));
    const { resendAlertSender } = await import("@/lib/ai-concierge/observability/notify");
    await expect(resendAlertSender({ to: ["ops@example.com"], subject: "alert", text: "x" })).resolves.toBe(true);
  });
});
