import type { Prisma, PrismaClient } from "@prisma/client";
import { approvalFor, loadTourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-119 — the explicit approval act for one tour's content (Owner decision 17/10/2026). Server/scripts only; nothing in
 * the app calls it automatically, and loading content never calls it.
 * In ONE transaction, with the content row locked (SELECT … FOR UPDATE) so a concurrent edit cannot slip in:
 *  1. re-reads what is stored now and validates it (approvalFor refuses mock or invalid content);
 *  2. sets OWNER_APPROVED + approvedAt + the content fingerprint, and clears the previous invalidation record;
 *  3. authorizes publication only for media whose rights are verified NOW (publicationApprovedAt = approvedAt); media
 *     without verified rights stay unauthorized. The media trigger accepts a new authorization only inside this
 *     transaction (transaction-local setting rt.approval_act) and only equal to the approvedAt just recorded.
 * After this, any change to the content, itinerary, FAQ or media is demoted to DRAFT by the database triggers (durable:
 * restoring old values does not restore the approval) and any rights change clears that item's authorization.
 */
export async function approveTourContent(prisma: PrismaClient, tripId: string, approvedAt: Date = new Date()): Promise<{ approvedAt: Date; fingerprint: string; authorizedMedia: number; unauthorizedMedia: number }> {
  return prisma.$transaction((tx) => approveTourContentInTransaction(tx, tripId, approvedAt), { timeout: 30_000, maxWait: 10_000 });
}

/**
 * The same approval act inside a transaction the caller already holds (the TOUR-03 media-only update, Owner 15/11/2026,
 * runs the media change and the new approval atomically). Identical steps and checks as approveTourContent.
 */
export async function approveTourContentInTransaction(tx: Prisma.TransactionClient, tripId: string, approvedAt: Date = new Date()): Promise<{ approvedAt: Date; fingerprint: string; authorizedMedia: number; unauthorizedMedia: number }> {
  const locked = await tx.$queryRaw<Array<{ tripId: string }>>`SELECT "tripId" FROM "TripContent" WHERE "tripId" = ${tripId} FOR UPDATE`;
  if (locked.length === 0) throw new Error(`no content stored for trip ${tripId}`);
  // Transaction-local marker checked by the media trigger: publication authorizations are granted only here.
  await tx.$queryRaw`SELECT set_config('rt.approval_act', ${tripId}, true)`;
  const record = await loadTourContentRecord(tripId, tx);
  if (!record) throw new Error(`no content stored for trip ${tripId}`);
  const approval = approvalFor(record, approvedAt);
  await tx.tripContent.update({
    where: { tripId },
    data: { status: approval.status, approvedAt: approval.approvedAt, approvedContentHash: approval.approvedContentHash, approvalInvalidatedAt: null, approvalInvalidationReason: null },
  });
  const authorized = await tx.tripImage.updateMany({ where: { tripId, rightsStatus: { not: "UNVERIFIED" } }, data: { publicationApprovedAt: approvedAt } });
  const unauthorized = await tx.tripImage.updateMany({ where: { tripId, rightsStatus: "UNVERIFIED" }, data: { publicationApprovedAt: null } });
  return { approvedAt, fingerprint: approval.approvedContentHash, authorizedMedia: authorized.count, unauthorizedMedia: unauthorized.count };
}
