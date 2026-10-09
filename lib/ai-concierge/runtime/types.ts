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
  | "booking_status"
  | "payment_status"
  | "refund_decision"
  | "operational_confirmation"
  | "insufficient_evidence"
  | "upstream_error";

export type UpstreamErrorClass =
  | "config"
  | "timeout"
  | "auth"
  | "rate_limit"
  | "retrieval"
  | "generation"
  | "malformed";

export type RuntimeInput = { message: string; locale: string };

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
  refusal_reason?: string;
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
};
