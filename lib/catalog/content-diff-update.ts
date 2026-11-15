import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { canonicalJson, loadTourContentRecord, type TourContentRecord } from "@/lib/catalog/tour-content";
import { contentRowData, diffRecords, faqRowData, LAUNCH_LOAD_TRIP_IDS, loadProblems, mediaRowData, stopRowData } from "@/lib/catalog/content-load";
import { approveTourContentInTransaction } from "@/lib/catalog/content-approval";

/**
 * A1b (Owner 15/11/2026) — diff-only update of ONE tour's stored content to the approved content in code, used for the
 * TOUR-03 correction on the preview. The general load (applyLoad) is unchanged and still the way to load a tour.
 *  - Only what really differs is written: the TripContent text fields that differ, the itinerary / FAQ / media rows that
 *    differ (deletes first, then updates, then inserts). Identical rows and fields are not touched at all.
 *  - A scope allowlist (`allowedChanges`) is mandatory: any difference outside it refuses the whole plan, so a surprise
 *    found at run time is never written.
 *  - The update AND the new approval act run in ONE transaction: any failure rolls everything back (no half-updated
 *    tour, no intermediate DRAFT state).
 *  - Integrity checks kept: content validation (loadProblems / approvalFor), the approval fingerprint, the database
 *    triggers, a re-plan inside the transaction (stops if the stored content changed since the dry run), a post-write
 *    diff that must be empty, and a hash of the launch tours' Trip public fields that must not change.
 */

export type DiffAction = "update" | "noop" | "refused";
export type RowOps = { delete: number[]; update: number[]; create: number[]; kept: number[] };
export type DiffPlan = {
  tripId: string;
  action: DiffAction;
  reasons: string[];
  /** Every difference found (diffRecords format: "meetingPoint", "faq[5] changed", "media[0] removed"…). */
  changes: string[];
  /** Differences outside the allowlist (any → refused). */
  outOfScope: string[];
  contentFields: string[];
  itinerary: RowOps;
  faq: RowOps;
  media: RowOps;
};

const CONTENT_FIELDS = ["summary", "description", "durationLabel", "meetingPoint", "startTimeNote", "languages", "inclusions", "exclusions", "requirements", "accessibility", "weatherPolicy", "operationalConditions", "optionalServicesNote", "source"] as const;
type ContentField = (typeof CONTENT_FIELDS)[number];

const pickStop = (s: TourContentRecord["itinerary"][number]) => canonicalJson([s.title, s.description, s.durationMinutes]);
const pickFaq = (f: NonNullable<TourContentRecord["faq"]>[number]) => canonicalJson([f.question, f.answer]);
const pickMedia = (m: TourContentRecord["images"][number]) =>
  canonicalJson([m.src, m.alt, m.isCover, m.focalX ?? null, m.focalY ?? null, m.credit ?? null, m.mediaType ?? "IMAGE", m.posterSrc ?? null, m.mobileSrc ?? null, m.durationSeconds ?? null, m.rightsStatus, m.rightsNote ?? null]);

function rowOps<T extends { position: number }>(current: T[], next: T[], pick: (x: T) => string): RowOps {
  const ops: RowOps = { delete: [], update: [], create: [], kept: [] };
  const now = new Map(current.map((x) => [x.position, x]));
  const want = new Map(next.map((x) => [x.position, x]));
  for (const [pos, x] of now) {
    const y = want.get(pos);
    if (!y) ops.delete.push(pos);
    else if (pick(x) !== pick(y)) ops.update.push(pos);
    else ops.kept.push(pos);
  }
  for (const pos of want.keys()) if (!now.has(pos)) ops.create.push(pos);
  for (const list of Object.values(ops)) list.sort((a, b) => a - b);
  return ops;
}
const withPos = <T>(list: T[] | null | undefined) => (list ?? []).map((x, position) => ({ ...x, position }));

/**
 * Scope allowlist: "meetingPoint" matches that field only; "faq[5]" matches that question only ("faq[5] changed");
 * an entry ending in "[" ("media[") matches every row of that list.
 */
export function inScope(change: string, allowedChanges: readonly string[]) {
  return allowedChanges.some((entry) => (entry.endsWith("[") ? change.startsWith(entry) : change === entry || change.startsWith(`${entry} `)));
}

/** Pure planning step (dry run): what the diff-only update would write, without touching the database. */
export function planContentDiffUpdate(current: TourContentRecord | null, next: TourContentRecord, opts: { tripExists: boolean; allowedChanges: readonly string[] }): DiffPlan {
  const empty: RowOps = { delete: [], update: [], create: [], kept: [] };
  const plan: DiffPlan = { tripId: next.tripId, action: "noop", reasons: [], changes: [], outOfScope: [], contentFields: [], itinerary: empty, faq: empty, media: empty };
  if (!opts.tripExists) return { ...plan, action: "refused", reasons: [`trip ${next.tripId} not found`] };
  if (!current) return { ...plan, action: "refused", reasons: ["no stored content: the diff-only update never creates content (use the full load)"] };
  const problems = loadProblems(next);
  if (problems.length) return { ...plan, action: "refused", reasons: problems };

  plan.changes = diffRecords(current, next);
  plan.contentFields = CONTENT_FIELDS.filter((f) => canonicalJson(current[f] ?? null) !== canonicalJson(next[f] ?? null));
  plan.itinerary = rowOps(current.itinerary, next.itinerary, pickStop);
  plan.faq = rowOps(withPos(current.faq), withPos(next.faq), pickFaq);
  plan.media = rowOps(current.images, next.images, pickMedia);
  plan.outOfScope = plan.changes.filter((change) => !inScope(change, opts.allowedChanges));

  if (plan.outOfScope.length) {
    return { ...plan, action: "refused", reasons: [`differences outside the authorized scope (${plan.outOfScope.join(", ")}): nothing is written; bring them to the Owner`] };
  }
  if (plan.changes.length === 0) return plan;
  return { ...plan, action: "update" };
}

/** Hash of the launch tours' Trip public fields (+ updatedAt): proves the update writes no Trip row. */
export async function launchTripFieldsHash(client: Pick<PrismaClient, "trip"> | Prisma.TransactionClient) {
  const rows = await client.trip.findMany({ where: { id: { in: [...LAUNCH_LOAD_TRIP_IDS] } }, orderBy: { id: "asc" }, select: { id: true, title: true, description: true, imageUrl: true, priceCents: true, highlights: true, location: true, updatedAt: true } });
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
}

export type DiffResult = { contentFields: string[]; itinerary: RowOps; faq: RowOps; media: RowOps; fingerprint: string; approvedAt: Date; authorizedMedia: number; unauthorizedMedia: number };

/**
 * Applies a diff-only plan and re-approves the tour in ONE transaction (rollback on any error).
 * `testHooks.beforeApproval` exists only so the tests can prove the rollback; scripts never pass it.
 */
export async function applyContentDiffUpdate(
  prisma: PrismaClient,
  next: TourContentRecord,
  plan: DiffPlan,
  opts: { allowedChanges: readonly string[]; approvedAt?: Date; testHooks?: { beforeApproval?: () => Promise<void> | void } },
): Promise<DiffResult> {
  if (plan.action !== "update") throw new Error(`refusing to apply a ${plan.action} plan`);
  if (plan.tripId !== next.tripId) throw new Error("plan was built for another trip");
  const tripId = next.tripId;
  return prisma.$transaction(
    async (tx) => {
      // Lock the content row first (same lock as the approval act), then re-plan against what is stored now.
      const locked = await tx.$queryRaw<Array<{ tripId: string }>>`SELECT "tripId" FROM "TripContent" WHERE "tripId" = ${tripId} FOR UPDATE`;
      if (locked.length === 0) throw new Error(`no content stored for trip ${tripId}`);
      const trip = await tx.trip.findUnique({ where: { id: tripId }, select: { id: true } });
      const current = await loadTourContentRecord(tripId, tx);
      const fresh = planContentDiffUpdate(current, next, { tripExists: Boolean(trip), allowedChanges: opts.allowedChanges });
      if (canonicalJson(fresh) !== canonicalJson(plan)) throw new Error("stored content changed since the dry run; re-run the dry run");
      const tripHashBefore = await launchTripFieldsHash(tx);

      // TripContent: only the differing text fields, plus the approval being replaced in this same transaction.
      const allText = contentRowData(next);
      const text = Object.fromEntries(plan.contentFields.map((f) => [f, allText[f as ContentField]]));
      const invalidation = current?.status === "OWNER_APPROVED" ? { status: "DRAFT" as const, approvedAt: null, approvedContentHash: null, approvalInvalidatedAt: new Date(), approvalInvalidationReason: "Diff-only content update (Owner 15/11/2026)" } : {};
      if (plan.contentFields.length || current?.status === "OWNER_APPROVED") await tx.tripContent.update({ where: { tripId }, data: { ...text, ...invalidation } });

      // Children: deletes first (e.g. the old cover goes before the new cover is set), then updates, then inserts.
      const stops = new Map(next.itinerary.map((s) => [s.position, s]));
      const faq = new Map(withPos(next.faq).map((f) => [f.position, f]));
      const media = new Map(next.images.map((m) => [m.position, m]));
      const expectCount = (n: number, want: number, what: string) => {
        if (n !== want) throw new Error(`expected to delete ${want} ${what} rows, deleted ${n}`);
      };
      if (plan.itinerary.delete.length) expectCount((await tx.tripItineraryStop.deleteMany({ where: { tripId, position: { in: plan.itinerary.delete } } })).count, plan.itinerary.delete.length, "itinerary");
      if (plan.faq.delete.length) expectCount((await tx.tripFaqItem.deleteMany({ where: { tripId, position: { in: plan.faq.delete } } })).count, plan.faq.delete.length, "faq");
      if (plan.media.delete.length) expectCount((await tx.tripImage.deleteMany({ where: { tripId, position: { in: plan.media.delete } } })).count, plan.media.delete.length, "media");
      for (const position of plan.itinerary.update) await tx.tripItineraryStop.update({ where: { tripId_position: { tripId, position } }, data: stopRowData(stops.get(position)!) });
      for (const position of plan.faq.update) await tx.tripFaqItem.update({ where: { tripId_position: { tripId, position } }, data: faqRowData(faq.get(position)!) });
      for (const position of plan.media.update) await tx.tripImage.update({ where: { tripId_position: { tripId, position } }, data: mediaRowData(media.get(position)!) });
      for (const position of plan.itinerary.create) await tx.tripItineraryStop.create({ data: { id: `${tripId}_stop_${position}`, tripId, position, ...stopRowData(stops.get(position)!) } });
      for (const position of plan.faq.create) await tx.tripFaqItem.create({ data: { id: `${tripId}_faq_${position}`, tripId, position, ...faqRowData(faq.get(position)!) } });
      for (const position of plan.media.create) await tx.tripImage.create({ data: { id: `${tripId}_media_${position}`, tripId, position, ...mediaRowData(media.get(position)!) } });

      // What is stored now must be exactly the approved content in code.
      const after = await loadTourContentRecord(tripId, tx);
      const left = after ? diffRecords(after, next) : ["content missing"];
      if (left.length) throw new Error(`post-update check failed (${left.join(", ")}); rolled back`);

      await opts.testHooks?.beforeApproval?.();
      const approval = await approveTourContentInTransaction(tx, tripId, opts.approvedAt ?? new Date());
      if ((await launchTripFieldsHash(tx)) !== tripHashBefore) throw new Error("Trip public fields changed during the update; rolled back");
      return { contentFields: plan.contentFields, itinerary: plan.itinerary, faq: plan.faq, media: plan.media, fingerprint: approval.fingerprint, approvedAt: approval.approvedAt, authorizedMedia: approval.authorizedMedia, unauthorizedMedia: approval.unauthorizedMedia };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
}
