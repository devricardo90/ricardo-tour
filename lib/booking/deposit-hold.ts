/**
 * RT-123 temporary hold of a private booking request (Owner decisions 28/10/2026 and 29/10/2026).
 *
 * A PENDING private request holds its date, but never for good:
 * - D1: the team has 24 hours from the request to send the deposit instructions (recorded by an ADMIN as a
 *   DEPOSIT_INSTRUCTIONS_SENT history event). Without that, the hold lapses 24 hours after the request.
 * - Once the instructions are sent (within those 24 hours), the customer has 48 hours to pay the 30% deposit.
 * - D2: the window is counted from the FIRST sending only; a payment canceled after it does not restart it.
 * - D3: the customer is told the exact deadline, in Brasília time (admin deposit instructions text).
 * A lapsed hold is expired by the next request for the date (lazy expiry, no scheduled job).
 *
 * Safety: a request never expires while it has any payment line that is not CANCELED or REFUNDED (a payment registered
 * as pending, received or confirmed protects it); a CONFIRMED booking never expires.
 */
export const DEPOSIT_HOLD_HOURS = 48;
export const INSTRUCTIONS_DUE_HOURS = 24;
export const DEPOSIT_INSTRUCTIONS_SENT_EVENT = "DEPOSIT_INSTRUCTIONS_SENT";
export const HOLD_EXPIRED_EVENT = "EXPIRED";
/** Payment statuses that protect a request from expiring (registered, received or confirmed money). */
export const PROTECTING_PAYMENT_STATUSES = ["PENDING", "RECORDED", "CONFIRMED"] as const;
/** The Owner's reference time zone for every deadline told to the customer or the team. */
export const HOLD_TIME_ZONE = "America/Sao_Paulo";

const HOUR = 3_600_000;

export function depositHoldDeadline(instructionsSentAt: Date): Date {
  return new Date(instructionsSentAt.getTime() + DEPOSIT_HOLD_HOURS * HOUR);
}

/** D1: last moment to send the deposit instructions for a request created at `requestedAt`. */
export function instructionsDueAt(requestedAt: Date): Date {
  return new Date(requestedAt.getTime() + INSTRUCTIONS_DUE_HOURS * HOUR);
}

export type HoldState = {
  status: string;
  pricingModel: string;
  requestedAt: Date;
  instructionsSentAt: Date | null;
  protectingPayments: number;
};

/** When the hold lapses: 48 h after instructions sent within the 24 h allowance; otherwise 24 h after the request. */
export function holdDeadline(hold: Pick<HoldState, "requestedAt" | "instructionsSentAt">): Date {
  const due = instructionsDueAt(hold.requestedAt);
  return hold.instructionsSentAt && hold.instructionsSentAt.getTime() < due.getTime() ? depositHoldDeadline(hold.instructionsSentAt) : due;
}

/** True when the request's temporary hold lapsed and the date may be released. */
export function isDepositHoldExpired(hold: HoldState, now: Date): boolean {
  if (hold.status !== "PENDING" || hold.pricingModel !== "PRIVATE_GROUP") return false;
  if (hold.protectingPayments > 0) return false;
  return now.getTime() >= holdDeadline(hold).getTime();
}
