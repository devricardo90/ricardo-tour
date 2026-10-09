import type { MetricsSnapshot } from "./metrics";

/**
 * RT-73 alerts (contract §4) as pure evaluators. Numeric thresholds are NOT defined by the contract, so none are
 * invented: a rate/cost rule runs only when the operator passes its threshold. Zero-tolerance rules are built in.
 */
export type AlertThresholds = {
  /** Minimum requests in the snapshot before any rate rule is evaluated. */
  min_requests?: number;
  error_rate?: number;
  timeout_rate?: number;
  rag_empty_rate?: number;
  cost_ceiling_usd?: number;
};
export type Alert = { id: string; severity: "critical" | "warning"; observed: number; threshold: number };

export function evaluateAlerts(snapshot: MetricsSnapshot, thresholds: AlertThresholds = {}): Alert[] {
  const m = snapshot.measured;
  const alerts: Alert[] = [];
  const total = Object.values(m.requests_total as Record<string, number>).reduce((a, b) => a + b, 0);

  // Zero tolerance: superseded / inactive content must never reach the model (RT-69 invariant).
  if (m.stale_content_served_total > 0) alerts.push({ id: "superseded_content_served", severity: "critical", observed: m.stale_content_served_total, threshold: 0 });
  if (m.limiter_store_errors_total > 0) alerts.push({ id: "limiter_store_errors", severity: "warning", observed: m.limiter_store_errors_total, threshold: 0 });

  if (total >= (thresholds.min_requests ?? 1)) {
    const rule = (id: string, observed: number, threshold: number | undefined, severity: Alert["severity"] = "warning") => {
      if (threshold !== undefined && observed > threshold) alerts.push({ id, severity, observed: Number(observed.toFixed(4)), threshold });
    };
    rule("error_rate", m.requests_total.error / total, thresholds.error_rate);
    rule("timeout_rate", (m.timeout_total.retrieve + m.timeout_total.generate) / total, thresholds.timeout_rate);
    rule("rag_empty_rate", m.rag_empty_total / total, thresholds.rag_empty_rate);
  }
  const cost = snapshot.estimate.cost_estimate_usd;
  if (thresholds.cost_ceiling_usd !== undefined && cost !== null && cost > thresholds.cost_ceiling_usd) {
    alerts.push({ id: "cost_ceiling_estimate", severity: "warning", observed: cost, threshold: thresholds.cost_ceiling_usd });
  }
  return alerts;
}

const TRUTHY = new Set(["1", "true", "yes", "on"]);

/**
 * Configuration check: the Concierge flag must never be enabled in production without an approved RT-75 gate record.
 * `AI_CONCIERGE_RT75_GATE_APPROVED` is a placeholder name for that record; it is unset today, so any enabled flag in
 * production is reported as a violation.
 */
export function checkFlagGate(env: Record<string, string | undefined> = process.env) {
  const production = env.VERCEL_ENV === "production" || env.NODE_ENV === "production";
  const enabled = TRUTHY.has((env.AI_CONCIERGE_ENABLED ?? env.NEXT_PUBLIC_AI_CONCIERGE_ENABLED ?? "").trim().toLowerCase());
  const gateApproved = TRUTHY.has((env.AI_CONCIERGE_RT75_GATE_APPROVED ?? "").trim().toLowerCase());
  return { environment: production ? "production" : "non-production", flag_enabled: enabled, gate_approved: gateApproved, violation: production && enabled && !gateApproved };
}
