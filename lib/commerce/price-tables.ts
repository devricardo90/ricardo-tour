import type { GroupPriceTable } from "@/lib/commerce/group-pricing";

/**
 * RT-124: the group price tables the booking engine may sell with. A table enters this registry ONLY after the Owner
 * approves it (RT-121) and the approval is recorded in the Source of Truth; TEST ONLY rehearsal data never counts.
 *
 * EMPTY on purpose (25/10/2026): no group table is approved yet (TOUR-01 and TOUR-02 pending; TOUR-03 approved only as
 * "a partir de", its 6 h mixed formula pending). With an empty registry every private booking is refused with
 * PRICE_NOT_APPROVED, so nothing can be sold by accident.
 */
export type ApprovedGroupPriceTable = GroupPriceTable & {
  /** Stable id recorded in every quote snapshot (e.g. "TOUR-03-4H"). */
  id: string;
  /** Version recorded in every quote snapshot; a changed table gets a new version, old quotes keep theirs. */
  version: string;
  tripId: string;
  /** Deposit share of the services part, in basis points (Owner decision per tour; 3000 = 30%). */
  depositBasisPoints: number;
  /** Tickets bought by the agency at booking time, per participant (TOUR-01 CR-18); 0 when none. */
  prepaidTicketsCents?: { fullFare: number; infant: number };
  /** Where the Owner's approval is recorded (Source of Truth row / Jira comment). */
  approvalRecord: string;
};

const APPROVED_GROUP_PRICE_TABLES: readonly ApprovedGroupPriceTable[] = [];

export function getApprovedGroupPriceTable(tripId: string): ApprovedGroupPriceTable | null {
  return APPROVED_GROUP_PRICE_TABLES.find((table) => table.tripId === tripId) ?? null;
}

export function listApprovedGroupPriceTables(): readonly ApprovedGroupPriceTable[] {
  return APPROVED_GROUP_PRICE_TABLES;
}
