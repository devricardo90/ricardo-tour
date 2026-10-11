import { redactPersonalData } from "@/lib/ai-concierge/runtime/privacy";

// RT-64: everything that reaches an operational log passes through here first. No raw stacks, query strings, headers,
// cookies, request bodies or personal data are ever logged.

const MAX_MESSAGE = 300;
// Bound the work BEFORE any regex runs: upstream error bodies can be arbitrarily long and the redactors are not linear.
const MAX_INPUT = 2_000;
const REMOVED = "[dado removido]";

/** Error text safe for logs: personal data and credentials redacted, URL query strings and long tokens removed, length bounded. */
export function sanitizeMessage(value: unknown): string {
  // Database client errors echo the call arguments (names, e-mails, phones): only the class is safe to log.
  if (value instanceof Error && /^Prisma/.test(value.name)) return "database error (details withheld)";
  const raw = (value instanceof Error ? value.message : typeof value === "string" ? value : "").slice(0, MAX_INPUT);
  return redactPersonalData(raw)
    .replace(/\b(?:Bearer|Basic)\s+\S+/gi, "[credential]")
    .replace(/\b(?:authorization|api[_-]?key|token|secret|password|passwd|pwd|cookie)\b\s*[:=]\s*\S+/gi, "[credential]")
    // Brazilian and international phone formats with spaces, dots, dashes and parentheses between the digit groups.
    .replace(/(?:\+?\d{1,3}[\s.()-]{0,2})?\(?\d{2}\)?[\s.-]{0,2}9?\d{4}[\s.-]{0,2}\d{4}\b/g, REMOVED)
    .replace(/\b9?\d{4}[\s.-]\d{4}\b/g, REMOVED) // local numbers without an area code
    .replace(/\?[^\s"')]*/g, "?…")
    .replace(/[A-Za-z0-9+/_-]{24,}={0,2}/g, "[token]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE);
}

/** Path only: no query, no hash, no host. Opaque ids (long segments, uuids, cuids) collapse to `:id` to keep cardinality low. */
export function sanitizePath(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  let path = value;
  try {
    path = new URL(value, "https://site.invalid").pathname;
  } catch {
    path = value.split(/[?#]/)[0];
  }
  return (
    path
      .split("/")
      .map((segment) => (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment) || /^c[a-z0-9]{20,}$/.test(segment) || /^\d{4,}$/.test(segment) ? ":id" : segment))
      .join("/")
      .slice(0, MAX_PATH) || "/"
  );
}

const MAX_PATH = 160;

export function errorName(value: unknown): string {
  const name = value instanceof Error ? value.name : typeof value === "string" ? "Error" : "UnknownError";
  return /^[A-Za-z0-9_.$-]{1,60}$/.test(name) ? name : "Error";
}

export function errorDigest(value: unknown): string | undefined {
  const digest = (value as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(digest) ? digest : undefined;
}
