import type { RuntimeResult } from "../runtime/types";
import type { ConciergeReply } from "./types";
import { resolveTourCards, tourIdsFromSourceIds } from "./tours";

const normalizeForMatch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Server-side mapper for the future gated endpoint: strips every internal field from a runtime result so the browser only
 * receives customer-facing text, the response kind and the handoff offer. Source ids, versions, chunk ids, error classes,
 * invalid/refusal reasons and any provider data stay on the server.
 */
export function toConciergeReply(result: RuntimeResult): ConciergeReply {
  // Recommendation cards come only from grounded answers whose retrieved sources are approved catalog entries; the ids that
  // reach the browser are trip ids from the closed allow-list, never source ids, versions or chunk ids.
  // `source_ids` are ALL retrieved evidence, not the recommendation: a card is shown only when the answer itself names the tour.
  const answer = normalizeForMatch(result.answer);
  const direct = resolveTourCards(result.tour_ids).map((tour) => tour.id);
  const derived =
    result.response_kind === "grounded"
      ? resolveTourCards(tourIdsFromSourceIds(result.source_ids))
          .filter((tour) => answer.includes(normalizeForMatch(tour.title)))
          .map((tour) => tour.id)
      : [];
  // Recommended by the deterministic catalog step (direct) or named in a grounded model answer (derived); at most three, no duplicates.
  const tourIds = resolveTourCards([...direct, ...derived]).map((tour) => tour.id);
  return {
    outcome: result.outcome,
    answer: result.answer,
    response_kind: result.response_kind,
    ...(result.handoff ? { handoff: result.handoff } : {}),
    ...(typeof result.retry_after_seconds === "number" ? { retry_after_seconds: result.retry_after_seconds } : {}),
    ...(result.reference_id ? { reference_id: result.reference_id } : {}),
    ...(tourIds.length > 0 ? { tour_ids: tourIds } : {}),
  };
}
