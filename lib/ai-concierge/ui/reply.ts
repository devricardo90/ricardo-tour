import type { RuntimeResult } from "../runtime/types";
import type { ConciergeReply } from "./types";

/**
 * Server-side mapper for the future gated endpoint: strips every internal field from a runtime result so the browser only
 * receives customer-facing text, the response kind and the handoff offer. Source ids, versions, chunk ids, error classes,
 * invalid/refusal reasons and any provider data stay on the server.
 */
export function toConciergeReply(result: RuntimeResult): ConciergeReply {
  return {
    outcome: result.outcome,
    answer: result.answer,
    response_kind: result.response_kind,
    ...(result.handoff ? { handoff: result.handoff } : {}),
    ...(typeof result.retry_after_seconds === "number" ? { retry_after_seconds: result.retry_after_seconds } : {}),
    ...(result.reference_id ? { reference_id: result.reference_id } : {}),
  };
}
