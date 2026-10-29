/**
 * Guide calendar shared by the three launched own tours (Sprint 11, 28/10/2026).
 *
 * The scarce resource is the guide, not the seat: per the Manual Mestre, Ricardo is the guide on TOUR-01 (guide and
 * driver, own Renault Mégane 2025, ~8 h hotel to hotel), TOUR-02 (Ricardo Tour guide during the whole visit, ~3 h) and
 * TOUR-03 (guide and driver, own Mégane, 4 h + ~1 h pickup/return). A booking on any of them therefore occupies the guide.
 *
 * Rule APPROVED by the Owner (RT-123, 28/10/2026): operation every day; one confirmed private tour per day across
 * TOUR-01, TOUR-02 and TOUR-03; a confirmed booking blocks the date for the other tours. Here a PENDING request also
 * holds the day (so two customers are never sent deposit instructions for the same day); so that none blocks a day for
 * good, it expires 48 hours after the deposit instructions are sent (lib/booking/deposit-hold.ts, Owner 28/10/2026).
 */
export const GUIDE_DAY_TRIP_IDS: readonly string[] = [
  "cmlhxkpy9000028zq27rhytew", // TOUR-01 Cristo Redentor + Pão de Açúcar
  "cmli1a6im000034zqqzc9sppb", // TOUR-02 Favela Rocinha
  "cmlibniq40000z4zqkbujnutt", // TOUR-03 Centro Histórico e Cultural
];

export const MAX_DEPARTURES_PER_GUIDE_DAY = 1;

const RIO_UTC_OFFSET_MS = -3 * 3_600_000; // Brazil has no daylight saving time since 2019.

export function isGuideDayTrip(tripId: string) {
  return GUIDE_DAY_TRIP_IDS.includes(tripId);
}

/** The Rio calendar day (YYYY-MM-DD) of an instant and its [start, end) bounds in UTC. */
export function rioDayOf(instant: Date): { day: string; start: Date; end: Date } {
  const day = new Date(instant.getTime() + RIO_UTC_OFFSET_MS).toISOString().slice(0, 10);
  const start = new Date(Date.parse(`${day}T00:00:00.000Z`) - RIO_UTC_OFFSET_MS);
  return { day, start, end: new Date(start.getTime() + 86_400_000) };
}

/** Advisory-lock key serializing every booking write of the guide on one Rio day. */
export function guideDayLockKey(day: string) {
  return `booking:guide-day:${day}`;
}
