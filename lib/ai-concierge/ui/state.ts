import { buildHandoffOffer } from "../runtime/handoff";
import { degradedMessage } from "../runtime/messages";
import {
  RUNTIME_MAX_HISTORY_TOTAL_LENGTH,
  RUNTIME_MAX_HISTORY_TURNS,
  RUNTIME_MAX_HISTORY_TURN_LENGTH,
  RUNTIME_MAX_MESSAGE_LENGTH,
} from "../runtime/input";
import type { HandoffOffer } from "../runtime/handoff";
import type { ResponseKind } from "../runtime/types";
import type { ConciergeReply, HistoryTurn } from "./types";

/**
 * RT-71 / RT-74 Concierge panel state machine (pure, no I/O).
 * Session context lives ONLY in this in-memory state (RT-70): nothing is written to localStorage, sessionStorage,
 * IndexedDB or cookies, and it is gone on reload. History sent to the server is bounded to the runtime limits.
 */
export type PanelMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; kind: ResponseKind; handoff?: HandoffOffer; tours?: string[] };

export type PanelStatus = "idle" | "sending" | "degraded" | "rate_limited";

export type PanelState = {
  open: boolean;
  messages: PanelMessage[];
  draft: string;
  status: PanelStatus;
  /** Seconds left while `rate_limited`. */
  retryAfter: number;
  seq: number;
};

export const MAX_COUNTDOWN_SECONDS = 3_600;

export const initialPanelState = (overrides: Partial<PanelState> = {}): PanelState => ({
  open: false,
  messages: [],
  draft: "",
  status: "idle",
  retryAfter: 0,
  seq: 0,
  ...overrides,
});

export type PanelAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "draft"; text: string }
  | { type: "send"; text: string }
  | { type: "reply"; reply: ConciergeReply }
  | { type: "failed"; lang?: "pt" | "en" | "es" }
  | { type: "tick" }
  | { type: "retry" }
  | { type: "reset" };

const nextId = (state: PanelState) => `m${state.seq + 1}`;

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case "open":
      return { ...state, open: true };
    case "close":
      return { ...state, open: false };
    case "draft":
      return { ...state, draft: action.text.slice(0, RUNTIME_MAX_MESSAGE_LENGTH) };
    case "send": {
      const text = action.text.trim().slice(0, RUNTIME_MAX_MESSAGE_LENGTH);
      if (!text || state.status !== "idle") return state;
      return {
        ...state,
        draft: "",
        status: "sending",
        seq: state.seq + 1,
        messages: [...state.messages, { id: nextId(state), role: "user", text }],
      };
    }
    case "reply": {
      if (state.status !== "sending") return state;
      const reply = action.reply;
      const limited = reply.outcome === "RATE_LIMITED";
      const status: PanelStatus = limited ? "rate_limited" : reply.response_kind === "degraded" ? "degraded" : "idle";
      return {
        ...state,
        status,
        retryAfter: limited ? clampSeconds(reply.retry_after_seconds) : 0,
        seq: state.seq + 1,
        messages: [...state.messages, { id: nextId(state), role: "assistant", text: reply.answer, kind: reply.response_kind, handoff: reply.handoff, ...(reply.tour_ids?.length ? { tours: reply.tour_ids } : {}) }],
      };
    }
    case "failed": {
      if (state.status !== "sending") return state;
      // The transport itself failed (network, bad payload): fixed text + static handoff, never raw errors.
      const reference = `local-${state.seq + 1}`;
      return {
        ...state,
        status: "degraded",
        seq: state.seq + 1,
        messages: [...state.messages, { id: nextId(state), role: "assistant", text: degradedMessage(reference, action.lang ?? "pt"), kind: "degraded", handoff: buildHandoffOffer("H5", "upstream_error", { lang: action.lang ?? "pt" }) }],
      };
    }
    case "tick": {
      if (state.status !== "rate_limited") return state;
      const left = state.retryAfter - 1;
      return left <= 0 ? { ...state, status: "idle", retryAfter: 0 } : { ...state, retryAfter: left };
    }
    case "retry":
      return state.status === "degraded" ? { ...state, status: "idle" } : state;
    case "reset":
      return initialPanelState({ open: state.open });
  }
}

export function clampSeconds(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 30;
  return Math.min(MAX_COUNTDOWN_SECONDS, Math.max(1, Math.ceil(value)));
}

export function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Bounded history for the next request: the most recent turns, at most 8 turns, 1,200 characters per turn and 4,000 in
 * total (the server rejects anything larger). Oldest turns are dropped first.
 */
export function historyFor(messages: PanelMessage[]): HistoryTurn[] {
  const turns: HistoryTurn[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0 && turns.length < RUNTIME_MAX_HISTORY_TURNS; i--) {
    const text = messages[i].text.slice(0, RUNTIME_MAX_HISTORY_TURN_LENGTH);
    if (!text.trim()) continue;
    if (total + text.length > RUNTIME_MAX_HISTORY_TOTAL_LENGTH) break;
    total += text.length;
    turns.unshift({ role: messages[i].role, text });
  }
  return turns;
}

/** Starter questions: all inside the approved PT V1 scope and none triggers a dynamic-data gate. */
export const STARTER_QUESTIONS = [
  "É minha primeira vez no Rio",
  "Quero conhecer o Cristo",
  "Quais passeios vocês recomendam?",
] as const;
