/**
 * RT-119 (LOCAL PREPARATION ONLY) — controlled content load of the three launch tours into the RT-113 tables
 * (Owner 01/11/2026: TOUR-01 Cristo + Selarón + Pão de Açúcar, TOUR-02 Rocinha, TOUR-03 Centro Histórico e Cultural).
 * Default is a DRY RUN (plan + per-field diff per tour, no write). `--apply` writes each tour in its own transaction,
 * always as DRAFT (loading is not an approval). `--trip=<id>` limits the run to one launch tour.
 * `--allow-replace-approved` is required to overwrite OWNER_APPROVED content (the approval is then invalidated).
 * By default refuses any database other than a local throw-away one (localhost:5433/rt119_* or rt_s11_*). The isolated
 * preview database is accepted only as described in lib/catalog/content-script-target.ts (RT_DB_TARGET=preview +
 * --target=preview + allowlisted host + one --trip); every preview run needs the Owner's written authorization (dry run
 * reviewed first; see docs/ops/rt-s11-catalog-release-procedure.md). Production is always refused. Writes only the RT-113
 * content tables, never Trip.
 * Usage: DATABASE_URL=<local rt119_*|rt_s11_*> npx tsx scripts/rt-119-load-content.ts [--apply] [--trip=<id>] [--allow-replace-approved]
 */
import { prisma } from "@/lib/prisma";
import { loadTourContentRecord, contentFingerprint } from "@/lib/catalog/tour-content";
import { applyLoad, launchLoadRecord, LAUNCH_LOAD_TRIP_IDS, planLoad } from "@/lib/catalog/content-load";
import { resolveContentScriptTarget } from "@/lib/catalog/content-script-target";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

// Default: local throw-away database only. Preview only when declared twice, allowlisted and limited to one tour; never production.
const { target, trip: only } = resolveContentScriptTarget({ env: process.env, argv: process.argv, launchTripIds: LAUNCH_LOAD_TRIP_IDS, script: "scripts/rt-119-load-content.ts" });
assertDatabaseAccess({ operation: "write", label: "scripts/rt-119-load-content.ts" }); // RT-104: deny by default

const apply = process.argv.includes("--apply");
const allowReplaceApproved = process.argv.includes("--allow-replace-approved");

async function main() {
  const ids = only ? [only] : [...LAUNCH_LOAD_TRIP_IDS];
  console.log(JSON.stringify({ target, trips: ids }));
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
