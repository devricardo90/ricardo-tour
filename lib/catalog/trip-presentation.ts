// Shared presentation helpers for public trip content (RT-53). Used by the Home Experiences section and the public
// tours listing; RT-54 (tour detail) reuses them, so there is one parser and no competing implementations.
//
// scripts/import-real-trips.mjs stores "summary\n\nDuracao: X.\n\nCategoria: Y.\n\nInclusoes: a, b.\n\nExclusoes: c." in
// `description`. `durationDays` is only a schema default (1), so duration is read from the description instead.

export type ParsedTripDescription = {
  /** First sentence of the lead paragraph: safe public summary, never raw metadata. */
  summary: string | null;
  /** Every non-metadata paragraph, in order: natural prose for a detail page (never raw metadata). */
  paragraphs: string[];
  /** Raw duration text, e.g. "5 a 6 horas". */
  duration: string | null;
  category: string | null;
  includes: string[];
  excludes: string[];
};

const METADATA_LABELS = /^(Duracao|Categoria|Inclusoes|Exclusoes):/;

function splitList(value: string | null) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function parseTripDescription(text: string): ParsedTripDescription {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const field = (label: string) =>
    blocks.find((b) => b.startsWith(`${label}:`))?.slice(label.length + 1).trim().replace(/\.$/, "") || null;
  const lead = blocks.find((b) => !METADATA_LABELS.test(b));
  const summary = lead ? lead.split(/(?<=[.!?])\s+/)[0] : null;
  return {
    summary,
    paragraphs: blocks.filter((b) => !METADATA_LABELS.test(b)),
    duration: field("Duracao"),
    category: field("Categoria"),
    includes: splitList(field("Inclusoes")),
    excludes: splitList(field("Exclusoes")),
  };
}

/** Kept under its original name so existing callers keep the same behavior. */
export const parseDescription = parseTripDescription;

export function isCityOnly(location: string | null | undefined, city: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  return !location || norm(location) === norm(city);
}

const HOURS_UNIT = { pt: "horas", en: "hours", es: "horas" } as const;
const HOURS_UNIT_ONE = { pt: "hora", en: "hour", es: "hora" } as const;

/**
 * Localizes a duration written as "5 horas" / "3 a 4 horas" for display (numbers and the unit only; no content is
 * translated). Anything that does not match the known shape is returned unchanged, never invented.
 */
export function formatTripDuration(raw: string | null | undefined, locale: string) {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d+)(?:\s*(?:a|-|–|to)\s*(\d+))?\s*horas?$/i);
  if (!match) return raw.trim();
  const key = (locale === "en" || locale === "es" ? locale : "pt") as "pt" | "en" | "es";
  const [, from, to] = match;
  if (to) return `${from}–${to} ${HOURS_UNIT[key]}`;
  return `${from} ${from === "1" ? HOURS_UNIT_ONE[key] : HOURS_UNIT[key]}`;
}

/** Display text for the place line: the location when it adds information beyond the city, otherwise null. */
export function displayLocation(location: string | null | undefined, city: string) {
  const loc = location?.trim();
  return loc && !isCityOnly(loc, city) ? loc : null;
}

const BRL_AMOUNT = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "R$ 900,00", "R$ 1.040,00" (pt-BR thousands grouping; plain space after "R$"). */
export function formatPriceBRL(priceCents: number) {
  return `R$ ${BRL_AMOUNT.format(priceCents / 100)}`;
}
