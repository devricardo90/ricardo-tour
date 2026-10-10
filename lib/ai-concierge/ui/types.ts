import type { HandoffOffer } from "../runtime/handoff";
import type { ResponseKind } from "../runtime/types";

/**
 * RT-71 / RT-74 Concierge panel — client-safe contracts.
 * `ConciergeReply` is the ONLY shape the browser ever receives: it carries the customer-facing text, the response kind
 * and the handoff offer. It never carries source ids, chunk ids, hashes, provider data or error classes.
 */
export type ConciergeReply = {
  outcome: string;
  answer: string;
  response_kind: ResponseKind;
  handoff?: HandoffOffer;
  /** Seconds until the visitor may write again (RATE_LIMITED only). */
  retry_after_seconds?: number;
  /** Support reference of a degraded response; already printed inside `answer`. */
  reference_id?: string;
};

export type HistoryTurn = { role: "user" | "assistant"; text: string };

/** The transport is injected: the lab uses a deterministic fake; a future public integration will call the (gated) endpoint. */
export interface ConciergeTransport {
  send(input: { message: string; history: HistoryTurn[] }): Promise<ConciergeReply>;
}

/** Client-originated product events (RT-73 contract). The host validates and forwards them; the panel never sends them anywhere. */
export type PanelEvent =
  | { name: "concierge_opened"; surface: "public_site" | "tour_detail" | "contact" }
  | { name: "handoff_clicked"; channel: "whatsapp" | "email"; handoff_code: HandoffOffer["code"] };
