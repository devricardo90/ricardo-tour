import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { launchLoadRecord } from "@/lib/catalog/content-load";
import { isMockRecord } from "@/lib/catalog/tour-content";

/**
 * RT-S11 plan A (Owner 01/11/2026): the approved card copy of a launch tour, i.e. what its Trip row must hold before the
 * Owner's approval act. title = approved product name per locale; description = approved content summary per locale.
 * Server/scripts only (imports draft data through the content loader); never imported by public routes or components.
 */
export const LAUNCH_COPY_LOCALES = ["pt", "en", "es"] as const;
export type LaunchCopy = Record<(typeof LAUNCH_COPY_LOCALES)[number], string>;

export function approvedTripCopy(id: string): { title: LaunchCopy; description: LaunchCopy } {
  const offer = PROTOTYPE_OFFER[id];
  const record = launchLoadRecord(id);
  if (!offer || isMockRecord(record)) throw new Error(`${id}: approved content missing or mock`);
  const title = {} as LaunchCopy;
  const description = {} as LaunchCopy;
  for (const l of LAUNCH_COPY_LOCALES) {
    const t = (offer.titleByLocale?.[l] ?? "").trim();
    const d = (record.summary?.[l] ?? "").trim();
    if (!t || !d) throw new Error(`${id} ${l}: approved title or summary missing`);
    if (/R\$\s*\d/.test(t + d)) throw new Error(`${id} ${l}: a price must never be written to the card copy`);
    title[l] = t;
    description[l] = d;
  }
  return { title, description };
}

/** Fields of a Trip row that differ from the approved card copy (empty = plan A already applied). */
export function tripCopyDiff(id: string, row: { title: unknown; description: unknown }): string[] {
  const next = approvedTripCopy(id);
  const changes: string[] = [];
  for (const field of ["title", "description"] as const) {
    const current = (row[field] ?? {}) as Partial<LaunchCopy>;
    for (const l of LAUNCH_COPY_LOCALES) if ((current[l] ?? "") !== next[field][l]) changes.push(`${field}.${l}: ${JSON.stringify(current[l] ?? null)} -> ${JSON.stringify(next[field][l])}`);
  }
  return changes;
}
