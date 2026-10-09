import type { RuntimeInput } from "./types";

export const RUNTIME_MAX_MESSAGE_LENGTH = 800;
const ALLOWED_KEYS = new Set(["message", "locale"]);

export type InputResult = { ok: true; value: RuntimeInput } | { ok: false; reason: string };

/** Fail closed: unknown keys (vector store, model, instructions, filters…) are rejected, never ignored. */
export function validateRuntimeInput(raw: unknown): InputResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, reason: "body_not_object" };
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, reason: "unexpected_field" };
  }
  const { message, locale } = raw as Record<string, unknown>;
  if (typeof locale !== "string" || !locale.trim()) return { ok: false, reason: "locale_missing" };
  if (typeof message !== "string") return { ok: false, reason: "message_not_string" };
  const cleaned = message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").trim();
  if (!cleaned) return { ok: false, reason: "message_empty" };
  if (cleaned.length > RUNTIME_MAX_MESSAGE_LENGTH) return { ok: false, reason: "message_too_long" };
  return { ok: true, value: { message: cleaned, locale: locale.trim() } };
}

export function isSupportedRuntimeLocale(locale: string) {
  return /^pt(?:-br)?$/i.test(locale);
}
