// RT-100 (Sprint 9): pure helpers for the OWN / PARTNER catalog classification (Owner decision 2026-10-13, RT-99).
//
// Nothing here is wired into a public page yet (the visitor-facing label is a Sprint 10 decision), and nothing here
// touches the database. The rules mirror the database CHECK constraint so application code fails early with a clear reason.

export const OPERATION_TYPES = ["UNCLASSIFIED", "OWN", "PARTNER"] as const;
export type OperationTypeValue = (typeof OPERATION_TYPES)[number];

export type OperationAssignmentInput = {
  operationType: string;
  partnerId?: string | null;
};

export type OperationAssignmentResult =
  | { ok: true }
  | { ok: false; reason: "UNKNOWN_TYPE" | "PARTNER_REQUIRED" | "PARTNER_NOT_ALLOWED" };

/**
 * Same rule as the database: a trip is PARTNER if and only if it points to a partner. UNCLASSIFIED and OWN trips must not
 * have a partner. (The database CHECK `Trip_partner_consistency_check` is the final guarantee.)
 */
export function validateOperationAssignment(input: OperationAssignmentInput): OperationAssignmentResult {
  if (!(OPERATION_TYPES as readonly string[]).includes(input.operationType)) return { ok: false, reason: "UNKNOWN_TYPE" };
  const hasPartner = typeof input.partnerId === "string" && input.partnerId.trim() !== "";
  if (input.operationType === "PARTNER") return hasPartner ? { ok: true } : { ok: false, reason: "PARTNER_REQUIRED" };
  return hasPartner ? { ok: false, reason: "PARTNER_NOT_ALLOWED" } : { ok: true };
}

const PUBLIC_LOCALES = ["pt", "en", "es"] as const;

/**
 * The approved "Operated by ..." wording for a visitor, or null.
 *
 * Returns text only when ALL of these hold: the trip is PARTNER, its partner is ACTIVE, and the Owner-approved label has a
 * non-empty string for exactly this locale (no fallback to another language and no generated text). For every other case,
 * including every UNCLASSIFIED or OWN trip, it returns null, so the internal classification itself (including the word
 * UNCLASSIFIED) can never reach a visitor through this helper.
 */
export function resolvePartnerPublicLabel(
  trip: { operationType: string; partner?: { status: string; publicLabel?: unknown } | null },
  locale: string,
): string | null {
  if (trip.operationType !== "PARTNER") return null;
  if (trip.partner?.status !== "ACTIVE") return null;
  if (!(PUBLIC_LOCALES as readonly string[]).includes(locale)) return null;
  const label = trip.partner.publicLabel;
  if (!label || typeof label !== "object" || Array.isArray(label)) return null;
  const text = (label as Record<string, unknown>)[locale];
  return typeof text === "string" && text.trim() !== "" ? text.trim() : null;
}

/**
 * Owner decision (2026-10-13): a PARTNER tour needs the real operator identified in PT, EN and ES. A partner label is
 * "complete" only when every public locale has a non-empty approved string. Nothing is translated or inferred.
 */
export function hasCompletePartnerLabel(publicLabel: unknown): boolean {
  if (!publicLabel || typeof publicLabel !== "object" || Array.isArray(publicLabel)) return false;
  const label = publicLabel as Record<string, unknown>;
  return PUBLIC_LOCALES.every((locale) => typeof label[locale] === "string" && (label[locale] as string).trim() !== "");
}
