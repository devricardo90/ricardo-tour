import { describe, expect, it, vi } from "vitest";
import { createMetrics } from "@/lib/ai-concierge/observability/metrics";
import { createAlertNotifier, getAlertStatus, readAlertRecipients } from "@/lib/ai-concierge/observability/notify";

// Essential alerts: content-free, recipients only from configuration, throttled, never claiming delivery without a real test.
const snapshotWith = (apply: (m: ReturnType<typeof createMetrics>) => void) => {
  const metrics = createMetrics(null);
  apply(metrics);
  return metrics.snapshot();
};
const event = (outcome: string, extra: Record<string, unknown> = {}) =>
  ({ outcome, latency_ms: 10, retrieval_results: 0, accepted_results: 0, rejected_results: 0, source_classes: [], response_kind: "grounded", message_length_bucket: "short", stage_ms: {}, provider_calls: { retrieve: 0, generate: 0 }, rag_empty: false, stale_filtered: 0, stale_content_served: 0, rejected_by_reason: {}, source_ids: [], ...extra }) as never;

describe("alert recipients and status", () => {
  it("accepts only plain well-formed addresses from the environment (max 3) and reports honestly", () => {
    expect(readAlertRecipients({ AI_CONCIERGE_ALERT_EMAIL: "a@x.com, b@y.org,not-an-email,Name <c@z.com>,d@w.io,e@v.io" })).toEqual(["a@x.com", "b@y.org", "d@w.io"]);
    expect(readAlertRecipients({})).toEqual([]);
    expect(getAlertStatus({ AI_CONCIERGE_ALERT_EMAIL: "a@x.com" })).toEqual({ recipients_configured: 1, resend_configured: false, delivery_tested: false });
  });
});

describe("alert notifier", () => {
  it("with no recipient configured nothing is sent (alerts stay in the logs)", async () => {
    const sender = vi.fn(async () => true);
    const notifier = createAlertNotifier({ sender, recipients: [] });
    expect(notifier.configured).toBe(false);
    const snap = snapshotWith((m) => { for (let i = 0; i < 25; i++) m.recordLimiterEvent({ type: "checked", source: "store", allowed: false } as never); });
    expect((await notifier.check(snap)).map((a) => a.id)).toContain("limit_denials_high");
    expect(sender).not.toHaveBeenCalled();
  });

  it("sends a content-free e-mail to the configured recipients, once per alert per throttle window", async () => {
    let clock = 0;
    const sender = vi.fn(async () => true);
    const notifier = createAlertNotifier({ sender, recipients: ["owner@example.com"], now: () => clock, throttleMs: 1000 });
    const snap = snapshotWith((m) => { for (let i = 0; i < 25; i++) m.recordLimiterEvent({ type: "checked", source: "store", allowed: false } as never); });
    await notifier.check(snap);
    await notifier.check(snap); // throttled
    expect(sender).toHaveBeenCalledTimes(1);
    const message = (sender.mock.calls[0] as unknown as [{ to: string[]; subject: string; text: string }])[0];
    expect(message.to).toEqual(["owner@example.com"]);
    expect(message.text).toMatch(/limit_denials_high: observed 25, threshold 20/);
    expect(message.subject + message.text).not.toMatch(/mensagem|resposta|prompt|@(?!example)/i);
    clock = 2000;
    await notifier.check(snap);
    expect(sender).toHaveBeenCalledTimes(2);
  });

  it("flags a high error rate only with enough traffic, and a failing sender never throws", async () => {
    const sender = vi.fn(async () => {
      throw new Error("smtp down");
    });
    const notifier = createAlertNotifier({ sender, recipients: ["owner@example.com"] });
    const few = snapshotWith((m) => {
      for (let i = 0; i < 3; i++) m.record(event("UPSTREAM_ERROR", { response_kind: "degraded" }));
    });
    expect((await notifier.check(few)).map((a) => a.id)).not.toContain("error_rate");
    const many = snapshotWith((m) => {
      for (let i = 0; i < 12; i++) m.record(event("UPSTREAM_ERROR", { response_kind: "degraded" }));
    });
    await expect(notifier.check(many)).resolves.toBeDefined();
  });
});
