/** RT-67 Concierge runtime V1 — internal typed contract. Never serialized to customers as-is. */

export const RUNTIME_LOCALE = "pt" as const;

export type RuntimeOutcome =
  | "ANSWER"
  | "HANDOFF"
  | "DYNAMIC_LOOKUP_REQUIRED"
  | "UNSUPPORTED_LOCALE"
  | "INSUFFICIENT_EVIDENCE"
  | "REFUSED"
  | "INVALID_INPUT"
  | "UPSTREAM_ERROR";

export type DynamicReason =
  | "price"
  | "availability"
  | "flight_inventory"
  | "hotel_inventory"
  | "oner_inventory";

export type HandoffReason =
  | "explicit_request"
  | "unsupported_request"
  | "complaint"
  | "repeated_failure"
  | "booking_status"
  | "payment_status"
  | "refund_decision"
  | "operational_confirmation"
  | "booking_request"
  | "safety_sensitive"
  | "out_of_scope_advice"
  | "emergency"
  | "insufficient_evidence"
  | "upstream_error";

/** RT-74 §1 standard response shapes, so a future UI can render each kind without inspecting outcomes. */
export type ResponseKind = "grounded" | "clarify" | "refusal" | "handoff" | "degraded";

export type RefusalReason =
  | "prompt_injection"
  | "prompt_injection_history"
  | "internal_information"
  | "abusive_content"
  | "third_party_comparison";

export type UpstreamErrorClass =
  | "config"
  | "timeout"
  | "auth"
  | "rate_limit"
  | "retrieval"
  | "generation"
  | "malformed";

import type { HandoffCode, HandoffOffer } from "./handoff";

/** Client-held session context. Untrusted: it is validated, bounded and never stored by the server. */
export type HistoryTurn = { role: "user" | "assistant"; text: string };

export type RuntimeInput = { message: string; locale: string; history: HistoryTurn[] };

export type RuntimeResult = {
  outcome: RuntimeOutcome;
  /** Customer-facing PT text. Never contains hashes, provider IDs or policy text. */
  answer: string;
  /** Internal testing metadata only. */
  source_ids: string[];
  source_versions: string[];
  chunk_ids: string[];
  handoff_reason?: HandoffReason;
  dynamic_reason?: DynamicReason;
  error_class?: UpstreamErrorClass;
  invalid_reason?: string;
  refusal_reason?: RefusalReason;
  response_kind: ResponseKind;
  /** RT-71: structured, user-initiated handoff (links only). Present whenever the visitor should be offered the team. */
  handoff?: HandoffOffer;
  /** Support reference for degraded responses only (random, carries no request data). */
  reference_id?: string;
};

/** Hosted search hit, reduced to what provenance validation needs. */
export type HostedHit = {
  file_id: string;
  score: number;
  text: string;
  attributes: Record<string, unknown> | null;
};

export type RuntimeDeps = {
  retrieve: (query: string) => Promise<HostedHit[]>;
  generate: (request: { instructions: string; input: string }) => Promise<string>;
  onEvent?: (event: RuntimeEvent) => void;
  /** Injectable clock (ms) for the bounded-retry budget; defaults to Date.now. */
  now?: () => number;
};

/** Content-free observability record. */
export type RuntimeEvent = {
  outcome: RuntimeOutcome;
  latency_ms: number;
  retrieval_results: number;
  accepted_results: number;
  rejected_results: number;
  source_classes: string[];
  handoff_reason?: HandoffReason;
  dynamic_reason?: DynamicReason;
  error_class?: UpstreamErrorClass;
  refusal_reason?: RefusalReason;
  /** RT-71 `handoff_offered`: code only, never message content. (`handoff_clicked` is emitted by the UI under RT-73.) */
  handoff_offered?: HandoffCode;
  retried?: boolean;
};
