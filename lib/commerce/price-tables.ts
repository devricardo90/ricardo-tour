import type { GroupPriceTable } from "@/lib/commerce/group-pricing";

/**
 * RT-124: the group price tables the booking engine may quote with. A table enters this registry ONLY after the Owner
 * approves it (RT-121) and the approval is recorded in the Source of Truth; TEST ONLY rehearsal data never counts.
 *
 * 26/10/2026 (RT-121): TOUR-03 4 hours approved. 28/10/2026 (Owner final decision, RT-121): TOUR-01 and TOUR-02 tables
 * chosen; 29/10/2026: the Owner ordered them registered LOCALLY (the accountant's validation stays a gate for effective
 * sales, not for this registry). TOUR-04 and the TOUR-03 6-hour option have no table here (the 6-hour prices are
 * approved but the option is not implemented in the request flow), so the engine refuses them with PRICE_NOT_APPROVED.
 * A table here does not open sales or show a price publicly: that needs the terms (RT-81/RT-118), the Owner's
 * publication authorization (PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS) and a release.
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

const TOUR_01_TRIP_ID = "cmlhxkpy9000028zq27rhytew";
const TOUR_02_TRIP_ID = "cmli1a6im000034zqqzc9sppb";
const TOUR_03_TRIP_ID = "cmlibniq40000z4zqkbujnutt";

const APPROVED_GROUP_PRICE_TABLES: readonly ApprovedGroupPriceTable[] = [
  {
    // TOUR-01 Cristo Redentor + Escadaria Selarón + Pão de Açúcar (tickets included): R$ 1.200 / 1.700 / 2.200 / 2.600.
    id: "TOUR-01",
    version: "2026-10-28",
    tripId: TOUR_01_TRIP_ID,
    currency: "BRL",
    groupTotalCents: { 1: 120_000, 2: 170_000, 3: 220_000, 4: 260_000 },
    // Ficha TOUR-01 CR-13/CR-14: children 0–2 pay 50% of the band's per-person price and count for the band.
    childPolicy: "INFANT_HALF_FARE_0_2",
    approvalRecord: "RT-121 Owner final decision 28/10/2026 (Jira RT-121 #13554; Volume II §11, 28/10/2026); local registration ordered 29/10/2026",
  },
  {
    // TOUR-02 Favela da Rocinha (adults only, 18+): R$ 450 / 580 / 690 / 780.
    id: "TOUR-02",
    version: "2026-10-28",
    tripId: TOUR_02_TRIP_ID,
    currency: "BRL",
    groupTotalCents: { 1: 45_000, 2: 58_000, 3: 69_000, 4: 78_000 },
    // Adults only (minimum age 18, Owner 17/10/2026): no child fare exists, so a party with children is refused.
    childPolicy: "NOT_APPROVED",
    approvalRecord: "RT-121 Owner final decision 28/10/2026 (Jira RT-121 #13554; Volume II §11, 28/10/2026); local registration ordered 29/10/2026",
  },
  {
    // TOUR-03 Centro Histórico e Cultural, 4-hour essential route: R$ 650 / 760 / 900 / 1.040 for 1 / 2 / 3 / 4 people.
    id: "TOUR-03-4H",
    // 2026-10-30: same prices, child rule added (quotes stored under 2026-10-26 keep their own snapshot).
    version: "2026-10-30",
    tripId: TOUR_03_TRIP_ID,
    currency: "BRL",
    groupTotalCents: { 1: 65_000, 2: 76_000, 3: 90_000, 4: 104_000 },
    // Ficha TOUR-03 v1.0 §13 (Owner-approved 18/10/2026; Jira RT-121 #13545), enabled online by the Owner on 30/10/2026:
    // children 0-2 pay 50% of the band's per-person price and count for the band (same rule as TOUR-01).
    childPolicy: "INFANT_HALF_FARE_0_2",
    approvalRecord: "RT-121 Owner decision 26/10/2026 (Jira RT-121; Source of Truth Volume II §11, 26/10/2026); child rule Ficha TOUR-03 v1.0 §13, enabled 30/10/2026",
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
