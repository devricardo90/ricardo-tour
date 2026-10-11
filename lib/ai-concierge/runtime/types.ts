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
  | "UPSTREAM_ERROR"
  | "RATE_LIMITED";

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
  | "upstream_error"
  | "rate_limited"
  | "commercial_terms";

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
  | "malformed"
  | "limiter";

import type { HandoffCode, HandoffOffer } from "./handoff";

/** Generation output with provider-measured token usage (RT-73). A bare string is accepted for tests and fakes. */
export type GenerationResult = { text: string; usage?: { input_tokens: number; output_tokens: number } };

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
  /** Approved catalog tours recommended by the deterministic recommendation step (ids from the closed allow-list). */
  tour_ids?: string[];
  /** Support reference for degraded responses only (random, carries no request data). */
  reference_id?: string;
  /** RT-72: only on RATE_LIMITED. Seconds until the window resets; the only limit detail ever exposed. */
  retry_after_seconds?: number;
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
  generate: (request: { instructions: string; input: string }) => Promise<string | GenerationResult>;
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
  // ---- RT-73 observability. Every field below is MEASURED by the runtime and content-free (numbers / closed strings). ----
  response_kind: ResponseKind;
  /** Bucketed only; the message itself and its exact length are never recorded. */
  message_length_bucket: "short" | "medium" | "long";
  stage_ms: { retrieve?: number; generate?: number };
  /** Provider calls actually made, retries included. */
  provider_calls: { retrieve: number; generate: number };
  /** Provider-reported token usage; absent when no generation happened or the provider omitted it. */
  usage?: { input_tokens: number; output_tokens: number };
  /** Retrieval ran but produced no usable evidence. */
  rag_empty: boolean;
  /** Hits rejected for being superseded/retired/blocked/unapproved (RT-69 invariants). */
  stale_filtered: number;
  /** Evidence reaching the model whose registry entry is not ACTIVE. Must be 0; page-worthy otherwise. */
  stale_content_served: number;
  /** Closed provenance rejection reasons with counts. */
  rejected_by_reason: Record<string, number>;
  /** Approved source IDs used (identifiers only, never source text). */
  source_ids: string[];
  failed_stage?: "retrieve" | "generate" | "config" | "limiter";
  /** RT-72 `rate_limited` product event: which limit dimension was reached. */
  rate_limited_dimension?: "session" | "ip_hash" | "global" | "cost_ceiling";
};
