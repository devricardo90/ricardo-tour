import { TRANSACTIONAL_FROM } from "@/lib/email-identity";
import { evaluateAlerts, type Alert, type AlertThresholds } from "./alerts";
import type { MetricsSnapshot } from "./metrics";

/**
 * Essential operational alerts for Daniela V1 (content-free: alert id, severity and numbers only; never a message, answer or
 * identifier). Delivery goes by e-mail through the existing verified sender, ONLY to the recipients explicitly configured in
 * `AI_CONCIERGE_ALERT_EMAIL`. With no recipient configured the notifier is off and alerts stay in the runtime logs.
 * Nothing here claims delivery works: `delivery_tested` is true only after the Owner runs `npm run alert:test` and it succeeds
 * (see scripts/alert-test.ts); tests use an injected fake sender.
 */
export type AlertSender = (message: { to: string[]; subject: string; text: string }) => Promise<boolean>;

const SIMPLE_ADDRESS = /^[^\s<>"',;:\\()[\]]+@[^\s<>"',;:\\()[\]]+\.[^\s<>"',;:\\()[\]]+$/;

/** Recipients come only from the environment and must be plain, well-formed addresses (at most 3). */
export function readAlertRecipients(env: Record<string, string | undefined> = process.env): string[] {
  return (env.AI_CONCIERGE_ALERT_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 254 && SIMPLE_ADDRESS.test(value))
    .slice(0, 3);
}

/** Thresholds are Owner-visible defaults for the V1 volume (300 messages/day): error/timeout rates need at least 10 requests. */
export const V1_ALERT_THRESHOLDS: AlertThresholds = { min_requests: 10, error_rate: 0.2, timeout_rate: 0.2 };

/** Extra V1 rule: many limiter denials (per-IP, per-session or the global daily cap) point to abuse or an exhausted daily budget. */
export const LIMIT_DENIALS_THRESHOLD = 20;
function consumptionAlerts(snapshot: MetricsSnapshot): Alert[] {
  const denied = snapshot.measured.limiter_denied_total;
  return denied >= LIMIT_DENIALS_THRESHOLD ? [{ id: "limit_denials_high", severity: "warning", observed: denied, threshold: LIMIT_DENIALS_THRESHOLD }] : [];
}

export function createAlertNotifier(options: { sender?: AlertSender; recipients?: string[]; throttleMs?: number; now?: () => number; thresholds?: AlertThresholds } = {}) {
  const recipients = options.recipients ?? readAlertRecipients();
  const throttleMs = options.throttleMs ?? 60 * 60 * 1000; // one e-mail per alert id per hour per instance
  const now = options.now ?? Date.now;
  const lastSent = new Map<string, number>();
  return {
    configured: recipients.length > 0 && Boolean(options.sender),
    /** Evaluates the snapshot and sends each NEW alert once per throttle window. Never throws; telemetry must not affect responses. */
    async check(snapshot: MetricsSnapshot): Promise<Alert[]> {
      try {
        const alerts = [...evaluateAlerts(snapshot, options.thresholds ?? V1_ALERT_THRESHOLDS), ...consumptionAlerts(snapshot)];
        const fresh = alerts.filter((alert) => now() - (lastSent.get(alert.id) ?? -Infinity) >= throttleMs);
        // Always visible in the runtime logs, content-free.
        for (const alert of fresh) console.warn(JSON.stringify({ event: "ai_concierge_alert", ...alert }));
        if (fresh.length === 0 || recipients.length === 0 || !options.sender) return fresh;
        for (const alert of fresh) lastSent.set(alert.id, now());
        const text = fresh.map((alert) => `${alert.severity.toUpperCase()} ${alert.id}: observed ${alert.observed}, threshold ${alert.threshold}`).join("\n");
        await options.sender({ to: recipients, subject: `[Daniela] alerta: ${fresh.map((alert) => alert.id).join(", ")}`, text });
        return fresh;
      } catch {
        return [];
      }
    },
  };
}

/** Real sender: the existing verified Resend identity. Returns false (never throws) when delivery fails. */
export const resendAlertSender: AlertSender = async ({ to, subject, text }) => {
  try {
    if (!process.env.RESEND_API_KEY) return false;
    const { resend } = await import("@/lib/resend");
    const { error } = await resend.emails.send({ from: TRANSACTIONAL_FROM, to, subject: subject.replace(/[\r\n]+/g, " "), text });
    return !error;
  } catch {
    return false;
  }
};

/** What the operator can truthfully read: whether recipients are configured; delivery is NEVER assumed. */
export function getAlertStatus(env: Record<string, string | undefined> = process.env) {
  const recipients = readAlertRecipients(env);
  return { recipients_configured: recipients.length, resend_configured: Boolean(env.RESEND_API_KEY), delivery_tested: false as const };
}

let singleton: ReturnType<typeof createAlertNotifier> | undefined;
export const getAlertNotifier = () => (singleton ??= createAlertNotifier({ sender: resendAlertSender }));
