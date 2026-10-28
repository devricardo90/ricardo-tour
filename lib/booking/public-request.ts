import { getApprovedGroupPriceTable, type ApprovedGroupPriceTable } from "@/lib/commerce/price-tables";
import { PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS } from "@/lib/catalog/public-tour-presentation";
import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";

/**
 * RT-124 (27/10/2026, local): which tours accept a private booking REQUEST from the public tour page, and the slot it
 * reserves. A request creates a PENDING booking through the existing engine (one group per slot, immutable quote); the
 * ADMIN verifies it, records the 30% deposit (RT-125) and only then confirms the booking. Nothing is charged online.
 *
 * Start time: PROVISIONAL, pending the Owner's availability rules (RT-123: departure times, minimum notice, blocked
 * days). One slot per tour per day; the team confirms the exact start time with the customer before the deposit.
 */
export const PUBLIC_REQUEST_SLOTS: Readonly<Record<string, { startLocalTime: string; durationMinutes: number; priceTableId: string }>> = {
  // TOUR-03 Centro Histórico e Cultural, 4-hour route (the only approved table, RT-121 26/10/2026).
  cmlibniq40000z4zqkbujnutt: { startLocalTime: "09:00", durationMinutes: 240, priceTableId: "TOUR-03-4H" },
};

/** Minimum notice in days (PROVISIONAL, RT-123 question 3): a request is for tomorrow or later, never for today. */
export const REQUEST_MIN_DAYS_AHEAD = 1;
export const REQUEST_MAX_DAYS_AHEAD = 365;
const RIO_UTC_OFFSET = "-03:00"; // Brazil has no daylight saving time since 2019.

export type PublicRequestMode = "public" | "lab";

/**
 * The approved table a public request may quote with, or null. The booking request is offered only where the price is
 * approved (registry) AND may be shown: publicly that needs the Owner's price-publication authorization; in the local
 * rebuild lab (never enabled on deployments) the approved table is enough, for the Owner's review.
 */
export function publicRequestTable(tripId: string, mode: PublicRequestMode, env: Record<string, string | undefined> = process.env): ApprovedGroupPriceTable | null {
  const slot = PUBLIC_REQUEST_SLOTS[tripId];
  if (!slot) return null;
  const table = getApprovedGroupPriceTable(tripId, slot.priceTableId);
  if (!table) return null;
  if (mode === "lab") return isRebuildLabEnabled(env) ? table : null;
  return PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(tripId) ? table : null;
}

/** The slot instant for a requested day (YYYY-MM-DD, Rio time). */
export function requestSlotStart(tripId: string, isoDate: string): Date | null {
  const slot = PUBLIC_REQUEST_SLOTS[tripId];
  if (!slot || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const start = new Date(`${isoDate}T${slot.startLocalTime}:00${RIO_UTC_OFFSET}`);
  return Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== isoDate ? null : start;
}

/** Accepted request window for a day (YYYY-MM-DD in Rio), relative to today's date in Rio. */
export function isRequestDateAllowed(isoDate: string, todayRio: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || Number.isNaN(Date.parse(`${isoDate}T12:00:00Z`))) return false;
  const days = Math.round((Date.parse(`${isoDate}T12:00:00Z`) - Date.parse(`${todayRio}T12:00:00Z`)) / 86_400_000);
  return days >= REQUEST_MIN_DAYS_AHEAD && days <= REQUEST_MAX_DAYS_AHEAD;
}
