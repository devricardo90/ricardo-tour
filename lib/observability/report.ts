import { errorDigest, errorName, sanitizeMessage, sanitizePath } from "./sanitize";

/**
 * RT-64 minimal observability baseline. One structured JSON line per event on stdout/stderr, which the hosting platform's
 * runtime logs collect. There is deliberately no vendor SDK, database or default external destination here: a persistent
 * sink (and its retention) is a Launch Readiness decision (RT-RB-L-09 / RT-48 final review). Reporting never throws and
 * never changes the response the visitor receives.
 */

export type ErrorSource = "server_action" | "api_route" | "render" | "route_handler" | "client_boundary" | "client_runtime" | "form" | "background";

export type SiteErrorRecord = {
  event: "site_error";
  source: ErrorSource;
  /** Stable label of the failing surface, e.g. "contact-message" or "api/bookings:POST". Never user input. */
  where: string;
  error_name: string;
  message: string;
  path?: string;
  digest?: string;
  release: string;
  env: string;
  ts: string;
};

export type WebVitalName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
export type WebVitalRecord = {
  event: "web_vital";
  name: WebVitalName;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  path: string;
  release: string;
  env: string;
  ts: string;
};

type Writer = (line: string) => void;
let writer: Writer | undefined;

/** Test hook: replace the log writer. Pass undefined to restore stdout/stderr. */
export function setObservabilityWriter(next: Writer | undefined) {
  writer = next;
}

function context() {
  return {
    release: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_RELEASE ?? "dev").slice(0, 12),
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    ts: new Date().toISOString(),
  };
}

function write(line: string, level: "error" | "info") {
  try {
    if (writer) writer(line);
    else if (level === "error") console.error(line);
    else console.info(line);
  } catch {
    /* telemetry is best-effort */
  }
}

export function buildErrorRecord(input: { source: ErrorSource; where: string; error: unknown; path?: unknown }): SiteErrorRecord {
  const path = input.path === undefined ? undefined : sanitizePath(input.path);
  const digest = errorDigest(input.error);
  return {
    event: "site_error",
    source: input.source,
    where: input.where.slice(0, 80),
    error_name: errorName(input.error),
    message: sanitizeMessage(input.error),
    ...(path ? { path } : {}),
    ...(digest ? { digest } : {}),
    ...context(),
  };
}

/** Server-side error capture. Safe to call from any catch block; returns nothing and never throws. */
export function reportServerError(input: { source: ErrorSource; where: string; error: unknown; path?: unknown }): void {
  try {
    write(JSON.stringify(buildErrorRecord(input)), "error");
  } catch {
    /* telemetry is best-effort */
  }
}

export function reportWebVital(input: { name: WebVitalName; value: number; rating: WebVitalRecord["rating"]; path: unknown }): void {
  try {
    const record: WebVitalRecord = {
      event: "web_vital",
      name: input.name,
      value: Math.round(input.value * 1000) / 1000,
      rating: input.rating,
      path: sanitizePath(input.path),
      ...context(),
    };
    write(JSON.stringify(record), "info");
  } catch {
    /* telemetry is best-effort */
  }
}
