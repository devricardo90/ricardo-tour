"use client";

import { useCallback, useMemo } from "react";
import { ConciergePanel } from "@/components/ai-concierge/panel/concierge-panel";
import type { ConciergeReply, ConciergeTransport, PanelEvent } from "@/lib/ai-concierge/ui/types";

/**
 * Daniela V1 mount. Rendered by the site layout ONLY when the launch guard allows it (it is off by default). It connects the
 * panel to `/api/ai-concierge`: no cookies, no storage, no tracking; the conversation lives in the panel's memory only.
 * The reply is validated against the closed `ConciergeReply` shape before it reaches the panel.
 */
const KINDS = new Set(["grounded", "clarify", "refusal", "handoff", "degraded"]);

function parseReply(data: unknown): ConciergeReply | null {
  if (typeof data !== "object" || data === null) return null;
  const reply = data as Record<string, unknown>;
  if (typeof reply.outcome !== "string" || typeof reply.answer !== "string" || reply.answer.length > 6_000) return null;
  if (typeof reply.response_kind !== "string" || !KINDS.has(reply.response_kind)) return null;
  return {
    outcome: reply.outcome,
    answer: reply.answer,
    response_kind: reply.response_kind as ConciergeReply["response_kind"],
    ...(typeof reply.handoff === "object" && reply.handoff !== null ? { handoff: reply.handoff as ConciergeReply["handoff"] } : {}),
    ...(typeof reply.retry_after_seconds === "number" ? { retry_after_seconds: reply.retry_after_seconds } : {}),
    ...(typeof reply.reference_id === "string" ? { reference_id: reply.reference_id.slice(0, 16) } : {}),
    ...(Array.isArray(reply.tour_ids) ? { tour_ids: reply.tour_ids.filter((id): id is string => typeof id === "string").slice(0, 3) } : {}),
  };
}

export function ConciergeMount({ locale }: { locale: string }) {
  const transport = useMemo<ConciergeTransport>(
    () => ({
      async send({ message, history, locale: lang }) {
        const response = await fetch("/api/ai-concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history, locale: lang ?? locale }),
          credentials: "omit",
          cache: "no-store",
        });
        // Rate-limited replies come with status 429 and a normal reply body; anything else that is not a valid reply is a failure.
        const reply = parseReply(await response.json().catch(() => null));
        if (!reply) throw new Error("invalid_reply");
        return reply;
      },
    }),
    [locale],
  );

  // Closed client events (RT-73): the panel only emits {name, surface} / {name, channel, handoff_code}. Fire and forget.
  const onEvent = useCallback((event: PanelEvent) => {
    try {
      const body = JSON.stringify(event);
      if (!navigator.sendBeacon?.("/api/ai-concierge/events", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/ai-concierge/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "omit" }).catch(() => undefined);
      }
    } catch {
      /* telemetry is best-effort */
    }
  }, []);

  return <ConciergePanel transport={transport} onEvent={onEvent} locale={locale} surface="public_site" />;
}
