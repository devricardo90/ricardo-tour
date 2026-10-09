import type { HistoryTurn, RuntimeInput } from "./types";

export const RUNTIME_MAX_MESSAGE_LENGTH = 800;
/** Session context is client-held and bounded: at most 4 exchanges (8 turns), 4,000 characters in total. */
export const RUNTIME_MAX_HISTORY_TURNS = 8;
export const RUNTIME_MAX_HISTORY_TURN_LENGTH = 1200;
export const RUNTIME_MAX_HISTORY_TOTAL_LENGTH = 4000;
const ALLOWED_KEYS = new Set(["message", "locale", "history"]);
const ALLOWED_TURN_KEYS = new Set(["role", "text"]);

export type InputResult = { ok: true; value: RuntimeInput } | { ok: false; reason: string };

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (value: string) => value.replace(CONTROL_CHARS, " ").trim();

function validateHistory(raw: unknown): { ok: true; value: HistoryTurn[] } | { ok: false; reason: string } {
  if (raw === undefined) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, reason: "history_not_array" };
  if (raw.length > RUNTIME_MAX_HISTORY_TURNS) return { ok: false, reason: "history_too_long" };
  const turns: HistoryTurn[] = [];
  let total = 0;
  for (const item of raw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return { ok: false, reason: "history_turn_invalid" };
    if (Object.keys(item).some((key) => !ALLOWED_TURN_KEYS.has(key))) return { ok: false, reason: "history_turn_unexpected_field" };
    const { role, text } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return { ok: false, reason: "history_role_invalid" };
    if (typeof text !== "string") return { ok: false, reason: "history_text_invalid" };
    const cleaned = clean(text);
    if (!cleaned || cleaned.length > RUNTIME_MAX_HISTORY_TURN_LENGTH) return { ok: false, reason: "history_text_invalid" };
    total += cleaned.length;
    turns.push({ role, text: cleaned });
  }
  if (total > RUNTIME_MAX_HISTORY_TOTAL_LENGTH) return { ok: false, reason: "history_too_large" };
  return { ok: true, value: turns };
}

/** Fail closed: unknown keys (vector store, model, instructions, filters…) are rejected, never ignored. */
export function validateRuntimeInput(raw: unknown): InputResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, reason: "body_not_object" };
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, reason: "unexpected_field" };
  }
  const { message, locale, history } = raw as Record<string, unknown>;
  if (typeof locale !== "string" || !locale.trim()) return { ok: false, reason: "locale_missing" };
  if (typeof message !== "string") return { ok: false, reason: "message_not_string" };
  const cleaned = clean(message);
  if (!cleaned) return { ok: false, reason: "message_empty" };
  if (cleaned.length > RUNTIME_MAX_MESSAGE_LENGTH) return { ok: false, reason: "message_too_long" };
  const turns = validateHistory(history);
  if (!turns.ok) return turns;
  return { ok: true, value: { message: cleaned, locale: locale.trim(), history: turns.value } };
}

export function isSupportedRuntimeLocale(locale: string) {
  return /^pt(?:-br)?$/i.test(locale);
}
