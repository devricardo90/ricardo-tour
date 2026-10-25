/** Largest value of a Postgres INTEGER column (all *Cents columns). */
export const MAX_CENTS = 2_147_483_647;

/** A positive whole number of cents that fits an INTEGER column. */
export function isValidCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= MAX_CENTS;
}

/**
 * Strict Brazilian money input to cents: "350", "350,5", "350,50", "1.234,56", "R$ 1.234,56". Anything ambiguous or
 * malformed returns null (no "1,234.56", no negative, no more than two decimals, no exponent, no zero) instead of guessing.
 */
export function parseBrlToCents(input: string): number | null {
  if (typeof input !== "string") return null;
  const text = input.trim().replace(/^R\$\s*/i, "");
  const match = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const reais = Number(match[1].replace(/\./g, ""));
  const cents = Number((match[2] ?? "").padEnd(2, "0") || "0");
  const total = reais * 100 + cents;
  return isValidCents(total) ? total : null;
}

export function formatBrl(cents: number, locale = "pt-BR") {
  return (cents / 100).toLocaleString(locale, { style: "currency", currency: "BRL" });
}
