/**
 * RT-S11 (LOCAL PREPARATION ONLY) — records the Owner's approval act for the loaded content of the three launch tours
 * (content approved in the Owner gate of 30/10/2026; EN/ES confirmed on 01/11/2026). Uses the database approval act
 * (approveTourContent): content fingerprint + publication authorization of the media whose rights are verified now.
 *
 * Refuses to approve a tour unless its content is loaded (scripts/rt-119-load-content.ts) and validates.
 * Option R (Owner 01/11/2026): the release never writes Trip.title/Trip.description (the public catalog shows the
 * approved card copy from code), so there is no Trip step before the approval. This script never writes Trip either:
 * it prints a fingerprint of the Trip public fields before and after, and the run fails if they differ.
 * Default is a DRY RUN (what would be approved, no write). Writing needs `--apply --confirm-owner-approval`.
 * `--trip=<id>` limits the act to one launch tour (the other tours are not written).
 * By default refuses any database other than a local throw-away one (localhost:5433/rt_s11_* or rt119_*). The isolated
 * preview database is accepted only as described in lib/catalog/content-script-target.ts (declared twice, allowlisted,
 * one --trip) and only with the Owner's written authorization. Production is always refused.
 * Usage: DATABASE_URL=<local rt_s11_*> npx tsx scripts/s11-approve-launch-content.ts [--trip=<id>] [--apply --confirm-owner-approval]
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { LAUNCH_LOAD_TRIP_IDS } from "@/lib/catalog/content-load";
import { approveTourContent } from "@/lib/catalog/content-approval";
import { contentFingerprint, loadTourContentRecord, validateTourContent } from "@/lib/catalog/tour-content";
import { resolveContentScriptTarget } from "@/lib/catalog/content-script-target";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

// Default: local throw-away database only. Preview only when declared twice, allowlisted and limited to one tour; never production.
const { target, trip: only } = resolveContentScriptTarget({ env: process.env, argv: process.argv, launchTripIds: LAUNCH_LOAD_TRIP_IDS, script: "scripts/s11-approve-launch-content.ts" });
const ids: string[] = only ? [only] : [...LAUNCH_LOAD_TRIP_IDS];
const apply = process.argv.includes("--apply");
if (apply && !process.argv.includes("--confirm-owner-approval")) throw new Error("--apply requires --confirm-owner-approval (the approval is an explicit Owner act)");
assertDatabaseAccess({ operation: apply ? "write" : "read", label: "scripts/s11-approve-launch-content.ts" }); // RT-104

async function main() {
  console.log(JSON.stringify({ target, trips: ids }));
  const problems: string[] = [];
  for (const id of ids) {
    const trip = await prisma.trip.findUnique({ where: { id }, select: { id: true } });
    const record = await loadTourContentRecord(id);
    if (!trip) problems.push(`${id}: Trip row missing`);
    if (!record) problems.push(`${id}: content not loaded — run scripts/rt-119-load-content.ts --apply first`);
    else {
      const issues = validateTourContent({ ...record, status: "DRAFT", approvedAt: null, approvedContentHash: null });
      if (issues.length) problems.push(`${id}: content does not validate (${issues.map((i) => `${i.field}: ${i.problem}`).join("; ")})`);
      console.log(JSON.stringify({ id, status: record.status, fingerprintToApprove: contentFingerprint(record), media: record.images.length, mediaWithRightsVerified: record.images.filter((m) => m.rightsStatus !== "UNVERIFIED").length }));
    }
  }
  if (problems.length) {
    for (const p of problems) console.log(`REFUSED ${p}`);
    console.log("nothing approved");
    process.exitCode = 2;
    return;
  }
  if (!apply) {
    console.log("dry-run: ready to approve (run with --apply --confirm-owner-approval)");
    return;
  }
  const before = await tripPublicFieldsHash();
  for (const id of ids) {
    const result = await approveTourContent(prisma, id);
    console.log(`approved ${id}: fingerprint ${result.fingerprint}, media authorized ${result.authorizedMedia}, not authorized ${result.unauthorizedMedia}`);
  }
  const after = await tripPublicFieldsHash();
  console.log(`Trip public fields of the launch tours: ${before} -> ${after}`);
  if (before !== after) throw new Error("Trip public fields changed during the approval (option R forbids any Trip write)");
}

/** Hash of the legacy Trip columns the current production site reads (title, description, image, price, highlights,
 * location) plus updatedAt, so any write to these rows during the approval is detected (the run then fails). */
async function tripPublicFieldsHash() {
  const rows = await prisma.trip.findMany({ where: { id: { in: [...LAUNCH_LOAD_TRIP_IDS] } }, orderBy: { id: "asc" }, select: { id: true, title: true, description: true, imageUrl: true, priceCents: true, highlights: true, location: true, updatedAt: true } });
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
