/**
 * Guide calendar shared by the three launched own tours (Sprint 11, 28/10/2026).
 *
 * The scarce resource is the guide, not the seat: per the Manual Mestre, Ricardo is the guide on TOUR-01 (guide and
 * driver, own Renault Mégane 2025, ~8 h hotel to hotel), TOUR-02 (Ricardo Tour guide during the whole visit, ~3 h) and
 * TOUR-03 (guide and driver, own Mégane, 4 h + ~1 h pickup/return). A booking on any of them therefore occupies the guide.
 *
 * Rule: at most ONE active private departure (PENDING or CONFIRMED) per guide per Rio calendar day, whatever the tour.
 * PROVISIONAL and conservative until the Owner answers RT-123 (questions 1 and 5: departures per day; does a booking
 * block the other tours that day). It can refuse a combination the Owner might later allow (e.g. TOUR-02 in the morning
 * and TOUR-03 in the afternoon), never accept two tours the guide cannot run.
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
