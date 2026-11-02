/**
 * RT-119 (LOCAL PREPARATION ONLY) — controlled content load of the three launch tours into the RT-113 tables
 * (Owner 01/11/2026: TOUR-01 Cristo + Selarón + Pão de Açúcar, TOUR-02 Rocinha, TOUR-03 Centro Histórico e Cultural).
 * Default is a DRY RUN (plan + per-field diff per tour, no write). `--apply` writes each tour in its own transaction,
 * always as DRAFT (loading is not an approval). `--trip=<id>` limits the run to one launch tour.
 * `--allow-replace-approved` is required to overwrite OWNER_APPROVED content (the approval is then invalidated).
 * Refuses any database other than a local throw-away one (localhost:5433/rt119_* or rt_s11_*): running against the hosted
 * database is NOT authorized (it belongs to the release procedure: backup, dry run reviewed by the Owner, written
 * authorization; see docs/ops/rt-s11-catalog-release-procedure.md). Writes only the RT-113 content tables, never Trip.
 * Usage: DATABASE_URL=<local rt119_*|rt_s11_*> npx tsx scripts/rt-119-load-content.ts [--apply] [--trip=<id>] [--allow-replace-approved]
 */
import { prisma } from "@/lib/prisma";
import { loadTourContentRecord, contentFingerprint } from "@/lib/catalog/tour-content";
import { applyLoad, launchLoadRecord, LAUNCH_LOAD_TRIP_IDS, planLoad } from "@/lib/catalog/content-load";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !/^\/(rt119_|rt_s11_)/.test(url.pathname) || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt119_* or rt_s11_* is allowed (hosted load not authorized)");
}
assertDatabaseAccess({ operation: "write", label: "scripts/rt-119-load-content.ts" }); // RT-104: deny by default

const apply = process.argv.includes("--apply");
const allowReplaceApproved = process.argv.includes("--allow-replace-approved");
const only = process.argv.find((a) => a.startsWith("--trip="))?.slice("--trip=".length);
if (only && !(LAUNCH_LOAD_TRIP_IDS as readonly string[]).includes(only)) throw new Error(`--trip=${only} is not a launch tour`);

async function main() {
  const ids = only ? [only] : [...LAUNCH_LOAD_TRIP_IDS];
  // Plan every tour first: one refused plan stops the whole run before any write.
  const plans = [];
  for (const id of ids) {
    const next = launchLoadRecord(id);
    const trip = await prisma.trip.findUnique({ where: { id }, select: { id: true } });
    const current = await loadTourContentRecord(id);
    const plan = planLoad(current, next, { tripExists: Boolean(trip), allowReplaceApproved });
    plans.push({ next, plan });
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...plan, fingerprintIfApproved: contentFingerprint(next), counts: { itinerary: next.itinerary.length, faq: next.faq?.length ?? 0, media: next.images.length } }, null, 2));
  }
  if (plans.some(({ plan }) => plan.action === "refused")) {
    console.log("refused: nothing applied");
    process.exitCode = 2;
    return;
  }
  if (!apply) return;
  for (const { next, plan } of plans) {
    if (plan.action === "create" || plan.action === "update") {
      await applyLoad(prisma, next, plan, { allowReplaceApproved });
      console.log(`applied ${next.tripId}: ${plan.action} (status DRAFT, no approval)`);
    } else console.log(`${next.tripId}: nothing to apply (no change)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
