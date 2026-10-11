import { z } from "zod";
import type { RuntimeEvent } from "../runtime/types";

/**
 * RT-73 product analytics events (contract: rt-73-concierge-observability-contract.md §2 and §8).
 * The vocabulary is EXACTLY the eleven Owner-approved categories. Schemas are strict: any property outside the allowed
 * set is rejected, and every string is a closed enum or a bounded opaque id, so free text (messages, answers, names,
 * e-mails, booking ids…) cannot be carried even by mistake.
 */
export const PRODUCT_EVENT_NAMES = [
  "concierge_opened",
  "message_sent",
  "answer_returned",
  "knowledge_hit",
  "knowledge_miss",
  "fallback_triggered",
  "handoff_offered",
  "handoff_clicked",
  "error",
  "timeout",
  "rate_limited",
] as const;
export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];

const sessionId = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/); // opaque anonymous id supplied by the client analytics layer
const handoffCode = z.enum(["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12"]);
const handoffReason = z.enum([
  "explicit_request", "unsupported_request", "complaint", "repeated_failure", "booking_status", "payment_status",
  "refund_decision", "operational_confirmation", "booking_request", "safety_sensitive", "out_of_scope_advice", "emergency",
  "insufficient_evidence", "upstream_error", "rate_limited", "price", "availability", "flight_inventory", "hotel_inventory",
  "oner_inventory", "unsupported_locale", "commercial_terms",
]);
const latencyBucket = z.enum(["lt_500ms", "lt_1s", "lt_2s", "lt_5s", "gte_5s"]);
const stage = z.enum(["retrieve", "generate", "validate", "config", "limiter"]);
const responseKind = z.enum(["grounded", "clarify", "refusal", "handoff", "degraded"]);
const errorClass = z.enum(["config", "timeout", "auth", "rate_limit", "retrieval", "generation", "malformed", "limiter"]);
const locale = z.enum(["pt", "en", "es"]);
const common = { session_id: sessionId.optional(), locale: locale.optional() };

export const productEventSchema = z.discriminatedUnion("name", [
  z.strictObject({ name: z.literal("concierge_opened"), surface: z.enum(["public_site", "tour_detail", "contact"]).optional(), ...common }),
  z.strictObject({ name: z.literal("message_sent"), length_bucket: z.enum(["short", "medium", "long"]).optional(), ...common }),
  z.strictObject({
    name: z.literal("answer_returned"),
    response_kind: responseKind,
    latency_bucket: latencyBucket,
    source_count: z.number().int().min(0).max(20),
    ...common,
  }),
  z.strictObject({
    name: z.literal("knowledge_hit"),
    source_ids: z.array(z.string().regex(/^[a-z0-9:_-]{3,120}$/)).max(20),
    result_count: z.number().int().min(0).max(20),
    ...common,
  }),
  z.strictObject({ name: z.literal("knowledge_miss"), reason: z.enum(["no_accepted_evidence"]), ...common }),
  z.strictObject({ name: z.literal("fallback_triggered"), category: z.enum(["insufficient_evidence", "safety_sensitive", "repeated_failure", "degraded"]), ...common }),
  z.strictObject({ name: z.literal("handoff_offered"), handoff_code: handoffCode, reason: handoffReason, ...common }),
  z.strictObject({ name: z.literal("handoff_clicked"), channel: z.enum(["whatsapp", "email"]), handoff_code: handoffCode, ...common }),
  z.strictObject({ name: z.literal("error"), error_class: errorClass, stage, ...common }),
  z.strictObject({ name: z.literal("timeout"), stage, latency_bucket: latencyBucket, ...common }),
  z.strictObject({ name: z.literal("rate_limited"), dimension: z.enum(["session", "ip_hash", "global", "cost_ceiling"]), ...common }),
]);
export type ProductEvent = z.infer<typeof productEventSchema>;

export type ProductEventResult = { ok: true; event: ProductEvent } | { ok: false; reason: string };

/** Single entry point for every product event, including client-originated ones (concierge_opened, handoff_clicked). */
export function validateProductEvent(raw: unknown): ProductEventResult {
  const parsed = productEventSchema.safeParse(raw);
  // The zod message can echo input; only a fixed reason label leaves this function.
  return parsed.success ? { ok: true, event: parsed.data } : { ok: false, reason: "schema_violation" };
}

export function latencyBucketOf(ms: number): z.infer<typeof latencyBucket> {
  return ms < 500 ? "lt_500ms" : ms < 1000 ? "lt_1s" : ms < 2000 ? "lt_2s" : ms < 5000 ? "lt_5s" : "gte_5s";
}

/** Derives the product events for one runtime response from its content-free ops event. */
export function deriveProductEvents(event: RuntimeEvent, session_id?: string): ProductEvent[] {
  const base = { ...(session_id ? { session_id } : {}), locale: "pt" as const };
  const out: ProductEvent[] = [
    { name: "message_sent", length_bucket: event.message_length_bucket, ...base },
    { name: "answer_returned", response_kind: event.response_kind, latency_bucket: latencyBucketOf(event.latency_ms), source_count: event.source_ids.length, ...base },
  ];
  const retrievalRan = event.provider_calls.retrieve > 0;
  if (retrievalRan && !event.error_class) {
    if (event.rag_empty) out.push({ name: "knowledge_miss", reason: "no_accepted_evidence", ...base });
    else out.push({ name: "knowledge_hit", source_ids: event.source_ids, result_count: event.accepted_results, ...base });
  }
  if (event.outcome === "UPSTREAM_ERROR") out.push({ name: "fallback_triggered", category: "degraded", ...base });
  if (event.outcome === "RATE_LIMITED" && event.rate_limited_dimension) out.push({ name: "rate_limited", dimension: event.rate_limited_dimension, ...base });
  if (event.outcome === "INSUFFICIENT_EVIDENCE") {
    const category = event.handoff_reason === "safety_sensitive" ? "safety_sensitive" : event.handoff_reason === "repeated_failure" ? "repeated_failure" : "insufficient_evidence";
    out.push({ name: "fallback_triggered", category, ...base });
  }
  if (event.handoff_offered) {
    const reason = event.handoff_reason ?? event.dynamic_reason ?? "unsupported_locale";
    out.push({ name: "handoff_offered", handoff_code: event.handoff_offered, reason, ...base });
  }
  if (event.error_class === "timeout") {
    out.push({ name: "timeout", stage: event.failed_stage ?? "generate", latency_bucket: latencyBucketOf(event.latency_ms), ...base });
  } else if (event.error_class) {
    out.push({ name: "error", error_class: event.error_class, stage: event.failed_stage ?? "config", ...base });
  }
  return out;
}
