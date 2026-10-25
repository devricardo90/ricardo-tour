/**
 * RT-124: booking states and the only transitions allowed between them. The states are the existing BookingStatus
 * values; new commercial states (awaiting deposit, completed, no-show) depend on RT-121/RT-125 decisions and are not
 * added here. Cancellation RULES (deadlines, refunds) are not decided here either: this only says which status change
 * is structurally possible.
 */
export type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELED";

/** Statuses that hold the schedule slot (a private group excludes every other booking on the same slot). */
export const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const satisfies readonly BookingStatusValue[];

const TRANSITIONS: Readonly<Record<BookingStatusValue, readonly BookingStatusValue[]>> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["CANCELED"],
  CANCELED: [],
};

export function canTransition(from: BookingStatusValue, to: BookingStatusValue): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Event types written to BookingEvent (append-only history; never personal data). */
export type BookingEventType = "CREATED" | "CONFIRMED" | "CANCELED_BY_USER" | "CANCELED_BY_ADMIN";

export type BookingActor = { userId: string | null; role: "USER" | "ADMIN" | "SYSTEM" };
