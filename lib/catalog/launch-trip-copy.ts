import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { isMockRecord } from "@/lib/catalog/tour-content";

/**
 * RT-S11 option R (Owner 01/11/2026): the approved card copy of a launch tour (name and summary per locale), read from the
 * Owner-approved content in code. The public catalog shows it instead of the legacy Trip.title/Trip.description, so the
 * release never writes those columns: the current production site keeps reading its own rows unchanged until the switch,
 * and a deployment rollback restores it exactly (no new titles mixed with old prices).
 * title = approved product name (PROTOTYPE_OFFER.titleByLocale); description = approved content summary (the same record
 * the RT-119 load writes). Pure data: no database or file access, safe for public routes.
 */
export const LAUNCH_COPY_LOCALES = ["pt", "en", "es"] as const;
export type LaunchCopy = Record<(typeof LAUNCH_COPY_LOCALES)[number], string>;

export function approvedTripCopy(id: string): { title: LaunchCopy; description: LaunchCopy } {
  const offer = PROTOTYPE_OFFER[id];
  const record = MOCK_TOUR_CONTENT[id];
  if (!offer || !record || isMockRecord(record)) throw new Error(`${id}: approved content missing or mock`);
  const title = {} as LaunchCopy;
  const description = {} as LaunchCopy;
  for (const l of LAUNCH_COPY_LOCALES) {
    const t = (offer.titleByLocale?.[l] ?? "").trim();
    const d = (record.summary?.[l] ?? "").trim();
    if (!t || !d) throw new Error(`${id} ${l}: approved title or summary missing`);
    if (/R\$\s*\d/.test(t + d)) throw new Error(`${id} ${l}: a price must never be part of the card copy`);
    title[l] = t;
    description[l] = d;
  }
  return { title, description };
}

/**
 * The public row of a launch tour with its approved name and summary in place of the legacy database columns, or null
 * when the approved copy is unavailable (the tour is then left out of the catalog rather than shown with the old copy).
 */
export function withApprovedCopy<T extends { id: string; title: unknown; description?: unknown }>(row: T): T | null {
  try {
    const copy = approvedTripCopy(row.id);
    return { ...row, title: copy.title, description: copy.description };
  } catch {
    return null;
  }
}

/**
 * Owner 01/11/2026: the card keeps a place line, translated, from code (option R: Trip.location is never written and is
 * not localized). TOUR-01 "Rio de Janeiro"; TOUR-02 "Rocinha, Rio de Janeiro"; TOUR-03 "Centro Histórico do Rio de
 * Janeiro". Spanish uses "Río de Janeiro", as in the approved Spanish tour copy.
 */
const APPROVED_TRIP_LOCATION: Record<string, LaunchCopy> = {
  cmlhxkpy9000028zq27rhytew: { pt: "Rio de Janeiro", en: "Rio de Janeiro", es: "Río de Janeiro" },
  cmli1a6im000034zqqzc9sppb: { pt: "Rocinha, Rio de Janeiro", en: "Rocinha, Rio de Janeiro", es: "Rocinha, Río de Janeiro" },
  cmlibniq40000z4zqkbujnutt: { pt: "Centro Histórico do Rio de Janeiro", en: "Historic Center of Rio de Janeiro", es: "Centro Histórico de Río de Janeiro" },
};

/** The approved place line of a launch tour card in the locale, or null for any other tour (legacy behavior applies). */
export function approvedTripLocation(id: string, locale: string): string | null {
  const byLocale = APPROVED_TRIP_LOCATION[id];
  if (!byLocale) return null;
  return byLocale[locale === "en" || locale === "es" ? locale : "pt"];
}
