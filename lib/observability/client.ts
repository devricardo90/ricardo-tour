"use client";

import type { ClientReport } from "./client-schema";

/** Browser → /api/observability/client. Fire-and-forget; never throws, never blocks rendering. */
export function sendObservabilityReport(report: ClientReport): void {
  try {
    const body = JSON.stringify(report);
    if (typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/observability/client", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/observability/client", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* telemetry is best-effort */
  }
}

export function reportBrowserError(source: "client_boundary" | "client_runtime", error: Error & { digest?: string }): void {
  sendObservabilityReport({
    kind: "error",
    source,
    name: (error.name || "Error").slice(0, 60),
    message: (error.message || "").slice(0, 500),
    path: window.location.pathname.slice(0, 300),
    ...(error.digest ? { digest: error.digest.slice(0, 40) } : {}),
  });
}
