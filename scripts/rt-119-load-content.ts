/**
 * RT-119 (LOCAL PREPARATION ONLY) — controlled content load for the Favela Rocinha into the RT-113 tables.
 * Default is a DRY RUN (plan + per-field diff, no write). `--apply` writes in one transaction, always as DRAFT.
 * `--allow-replace-approved` is required to overwrite OWNER_APPROVED content (the approval is then invalidated).
 * Refuses any database other than a local throw-away one (localhost:5433/rt119_*): running against the hosted database
 * is NOT authorized (RT-119 needs backup, diff approved by the Owner per batch, and written authorization).
 * Usage: DATABASE_URL=<local rt119_*> npx tsx scripts/rt-119-load-content.ts [--apply] [--allow-replace-approved]
 */
import { prisma } from "@/lib/prisma";
import { loadTourContentRecord, contentFingerprint } from "@/lib/catalog/tour-content";
import { applyLoad, planLoad, rocinhaLoadRecord } from "@/lib/catalog/content-load";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt119_") || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt119_* is allowed (hosted load not authorized)");
}
assertDatabaseAccess({ operation: "write", label: "scripts/rt-119-load-content.ts" }); // RT-104: deny by default

const apply = process.argv.includes("--apply");
const allowReplaceApproved = process.argv.includes("--allow-replace-approved");

async function main() {
  const next = rocinhaLoadRecord();
  const trip = await prisma.trip.findUnique({ where: { id: next.tripId }, select: { id: true } });
  const current = await loadTourContentRecord(next.tripId);
  const plan = planLoad(current, next, { tripExists: Boolean(trip), allowReplaceApproved });
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...plan, fingerprintIfApproved: contentFingerprint(next), counts: { itinerary: next.itinerary.length, faq: next.faq?.length ?? 0, media: next.images.length } }, null, 2));
  if (plan.action === "refused") process.exitCode = 2;
  else if (apply && (plan.action === "create" || plan.action === "update")) {
    await applyLoad(prisma, next, plan, { allowReplaceApproved });
    console.log(`applied: ${plan.action} (status DRAFT, no approval)`);
  } else if (apply) console.log("nothing to apply (no change)");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
