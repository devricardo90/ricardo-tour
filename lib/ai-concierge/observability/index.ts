import type { RuntimeEvent } from "../runtime/types";
import { deriveProductEvents, validateProductEvent, type ProductEvent } from "./events";
import { createMetrics, readPricing, type Metrics, type Pricing } from "./metrics";

export * from "./alerts";
export * from "./events";
export * from "./metrics";

/**
 * Where validated product events go. There is deliberately no default destination: persistence (existing /api/analytics
 * enum migration vs. a separate store) and its retention need an approved architecture/legal decision (RT-70, RT-48).
 */
export type ProductEventSink = { emit: (event: ProductEvent) => void | Promise<void> };

export type ObservabilityOptions = {
  productSink?: ProductEventSink;
  /** Operational log line writer. Defaults to structured stdout outside tests. */
  logger?: (line: string) => void;
  metrics?: Metrics;
  pricing?: Pricing | null;
};

export function createObservability(options: ObservabilityOptions = {}) {
  const metrics = options.metrics ?? createMetrics(options.pricing ?? null);
  const logger = options.logger ?? ((line: string) => { if (process.env.NODE_ENV !== "test") console.info(line); });
  let schemaRejected = 0;

  const deliver = (event: ProductEvent) => {
    try {
      // A failing or slow sink can never affect the customer response.
      void Promise.resolve(options.productSink?.emit(event)).catch(() => undefined);
    } catch {
      /* ignored: telemetry is best-effort */
    }
  };

  return {
    metrics,
    /** Pass as `deps.onEvent`. Never throws. */
    onEvent(event: RuntimeEvent) {
      try {
        metrics.record(event);
        logger(JSON.stringify({ event: "ai_concierge_runtime", ...event }));
        for (const candidate of deriveProductEvents(event)) {
          const checked = validateProductEvent(candidate);
          if (checked.ok) deliver(checked.event);
          else schemaRejected++;
        }
      } catch {
        /* ignored: telemetry is best-effort */
      }
    },
    /** For client-originated events (`concierge_opened`, `handoff_clicked`) and RT-72's `rate_limited`. */
    ingestClientEvent(raw: unknown): { ok: boolean } {
      const checked = validateProductEvent(raw);
      if (checked.ok) deliver(checked.event);
      else schemaRejected++;
      return { ok: checked.ok };
    },
    schemaRejectedCount: () => schemaRejected,
  };
}
export type Observability = ReturnType<typeof createObservability>;

let serverObservability: Observability | undefined;
/** Per-instance singleton used by the server entrypoint. Prices come only from operator-supplied environment values. */
export function getServerObservability() {
  serverObservability ??= createObservability({ pricing: readPricing() });
  return serverObservability;
}
