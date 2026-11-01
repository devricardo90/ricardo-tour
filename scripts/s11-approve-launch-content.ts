/**
 * RT-S11 (LOCAL PREPARATION ONLY) — records the Owner's approval act for the loaded content of the three launch tours
 * (content approved in the Owner gate of 30/10/2026; EN/ES confirmed on 01/11/2026). Uses the database approval act
 * (approveTourContent): content fingerprint + publication authorization of the media whose rights are verified now.
 *
 * Refuses to approve a tour unless:
 *  - its content is loaded (scripts/rt-119-load-content.ts) and validates;
 *  - its Trip row already holds the approved card copy (plan A, scripts/s11-launch-trip-copy.ts). Approving first would
 *    be invalidated by the later Trip change, so the order is enforced here.
 * Default is a DRY RUN (what would be approved, no write). Writing needs `--apply --confirm-owner-approval`.
 * Refuses any database other than a local throw-away one (localhost:5433/rt_s11_* or rt119_*): the hosted approval act
 * belongs to the release procedure and needs the Owner's written authorization.
 * Usage: DATABASE_URL=<local rt_s11_*> npx tsx scripts/s11-approve-launch-content.ts [--apply --confirm-owner-approval]
 */
import { prisma } from "@/lib/prisma";
import { LAUNCH_LOAD_TRIP_IDS } from "@/lib/catalog/content-load";
import { approveTourContent } from "@/lib/catalog/content-approval";
import { contentFingerprint, loadTourContentRecord, validateTourContent } from "@/lib/catalog/tour-content";
import { tripCopyDiff } from "@/lib/catalog/launch-trip-copy";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !/^\/(rt_s11_|rt119_)/.test(url.pathname) || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt_s11_* or rt119_* is allowed (hosted approval not authorized)");
}
const apply = process.argv.includes("--apply");
if (apply && !process.argv.includes("--confirm-owner-approval")) throw new Error("--apply requires --confirm-owner-approval (the approval is an explicit Owner act)");
assertDatabaseAccess({ operation: apply ? "write" : "read", label: "scripts/s11-approve-launch-content.ts" }); // RT-104

async function main() {
  const problems: string[] = [];
  for (const id of LAUNCH_LOAD_TRIP_IDS) {
    const trip = await prisma.trip.findUnique({ where: { id }, select: { title: true, description: true } });
    const record = await loadTourContentRecord(id);
    if (!trip) problems.push(`${id}: Trip row missing`);
    else if (tripCopyDiff(id, trip).length) problems.push(`${id}: Trip copy is not the approved copy yet — run scripts/s11-launch-trip-copy.ts --apply first`);
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
  for (const id of LAUNCH_LOAD_TRIP_IDS) {
    const result = await approveTourContent(prisma, id);
    console.log(`approved ${id}: fingerprint ${result.fingerprint}, media authorized ${result.authorizedMedia}, not authorized ${result.unauthorizedMedia}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
