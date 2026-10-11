"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { reportBrowserError, sendObservabilityReport } from "@/lib/observability/client";

const REPORTED = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);
const SAMPLE_RATE = 0.2; // enough for a baseline, keeps log volume (and free-tier log retention) small

// Chosen once per page load so one visit reports either all of its vitals or none of them. Only read inside effects/handlers.
const sampled = typeof window !== "undefined" && Math.random() < SAMPLE_RATE;

// Module-scope handler: a stable reference, so re-renders never re-register the web-vitals observers (no double reporting).
function handleVital(metric: { name: string; value: number; rating?: string }) {
  if (!sampled || !REPORTED.has(metric.name)) return;
  const rating = metric.rating === "good" || metric.rating === "poor" ? metric.rating : "needs-improvement";
  sendObservabilityReport({
    kind: "vital",
    name: metric.name as "CLS" | "FCP" | "INP" | "LCP" | "TTFB",
    value: metric.value,
    rating,
    path: window.location.pathname.slice(0, 300),
  });
}

// Uncaught errors outside any React boundary (event handlers, async code). Not sampled (rare), capped per page; the server limits volume again.
let errorsSeen = 0;
const MAX_ERRORS_PER_PAGE = 5;
function asError(reason: unknown): Error {
  return reason instanceof Error ? reason : new Error(typeof reason === "string" ? reason : "Unhandled rejection");
}

/** RT-64: invisible. Sends Core Web Vitals and uncaught browser errors (path only, no user identifiers). */
export function WebVitalsReporter() {
  useReportWebVitals(handleVital);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (errorsSeen++ >= MAX_ERRORS_PER_PAGE) return;
      reportBrowserError("client_runtime", event.error instanceof Error ? event.error : new Error(event.message || "Error"));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (errorsSeen++ >= MAX_ERRORS_PER_PAGE) return;
      reportBrowserError("client_runtime", asError(event.reason));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
