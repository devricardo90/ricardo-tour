import { GUIDE_DAY_TRIP_IDS, rioDayOf } from "@/lib/booking/guide-calendar";

type Client = typeof import("@/lib/prisma")["prisma"];

/**
 * Live suites that book the real tour ids share the guide calendar (one departure per guide per Rio day), also with
 * earlier runs on the same disposable database. Each suite searches its own range of days ahead and gets the next Rio
 * day that has no schedule of a guided tour at all, so suites never collide with each other or with leftovers.
 */
export function guideDayPicker(prisma: Client, fromDaysAhead: number, toDaysAhead: number) {
  const taken = new Set<string>();
  let offset = fromDaysAhead;
  return async function nextFreeGuideDay(): Promise<string> {
    for (; offset <= toDaysAhead; offset++) {
      const { day, start, end } = rioDayOf(new Date(Date.now() + offset * 86_400_000));
      if (taken.has(day)) continue;
      const used = await prisma.tripSchedule.count({ where: { tripId: { in: [...GUIDE_DAY_TRIP_IDS] }, startAt: { gte: start, lt: end } } });
      if (used === 0) {
        taken.add(day);
        offset++;
        return day;
      }
    }
    throw new Error(`no free guide day between ${fromDaysAhead} and ${toDaysAhead} days ahead: use a fresh disposable database`);
  };
}
