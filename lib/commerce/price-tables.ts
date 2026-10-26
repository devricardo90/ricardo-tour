import type { GroupPriceTable } from "@/lib/commerce/group-pricing";

/**
 * RT-124: the group price tables the booking engine may quote with. A table enters this registry ONLY after the Owner
 * approves it (RT-121) and the approval is recorded in the Source of Truth; TEST ONLY rehearsal data never counts.
 *
 * 26/10/2026 (RT-121): TOUR-03 4 hours is the only approved table. TOUR-01, TOUR-02, TOUR-04 and TOUR-03 6 hours have
 * none, so the engine refuses them with PRICE_NOT_APPROVED. The engine is not wired to any public route: a table here
 * does not open sales (that needs terms RT-81/RT-118 and the Owner's publication authorization).
 *
 * Deposit and balance are NOT per table: RT-121 fixes 30% / 70% of the total for every tour (group-pricing.ts).
 */
export type ChildPricingPolicy =
  /** No child rule approved for this tour: a booking with children 0–2 is refused (availability by WhatsApp). */
  | "NOT_APPROVED"
  /** Children 0–2 pay 50% of the per-person price of the band and count for it (the TOUR-01 CR-13/CR-14 formula). */
  | "INFANT_HALF_FARE_0_2";

export type ApprovedGroupPriceTable = GroupPriceTable & {
  /** Stable id recorded in every quote snapshot (e.g. "TOUR-03-4H"); also the option the customer chooses. */
  id: string;
  /** Version recorded in every quote snapshot; a changed table gets a new version, old quotes keep theirs. */
  version: string;
  tripId: string;
  childPolicy: ChildPricingPolicy;
  /** Where the Owner's approval is recorded (Source of Truth row / Jira). */
  approvalRecord: string;
};

const TOUR_03_TRIP_ID = "cmlibniq40000z4zqkbujnutt";

const APPROVED_GROUP_PRICE_TABLES: readonly ApprovedGroupPriceTable[] = [
  {
    // TOUR-03 Centro Histórico e Cultural, 4-hour essential route: R$ 650 / 760 / 900 / 1.040 for 1 / 2 / 3 / 4 people.
    id: "TOUR-03-4H",
    version: "2026-10-26",
    tripId: TOUR_03_TRIP_ID,
    currency: "BRL",
    groupTotalCents: { 1: 65_000, 2: 76_000, 3: 90_000, 4: 104_000 },
    // RT-121: the TOUR-01 child policy is not extended to other tours; TOUR-03 has no approved child rule yet.
    childPolicy: "NOT_APPROVED",
    approvalRecord: "RT-121 Owner decision 26/10/2026 (Jira RT-121; Source of Truth Volume II §11, 26/10/2026)",
  },
];

/**
 * The approved table for a trip. With `priceTableId` it must match exactly; without it the trip must have exactly one
 * approved table (an ambiguous choice is refused, never guessed).
 */
export function getApprovedGroupPriceTable(tripId: string, priceTableId?: string): ApprovedGroupPriceTable | null {
  const matches = APPROVED_GROUP_PRICE_TABLES.filter(
    (table) => table.tripId === tripId && (priceTableId === undefined || table.id === priceTableId),
  );
  return matches.length === 1 ? matches[0] : null;
}

export function listApprovedGroupPriceTables(): readonly ApprovedGroupPriceTable[] {
  return APPROVED_GROUP_PRICE_TABLES;
}
