/**
 * RT-S11 plan A (Owner 01/11/2026, LOCAL PREPARATION ONLY) — puts the approved names and summaries of the three launch
 * tours on their Trip rows, which feed the Home and listing cards (production still holds the old catalog copy, e.g.
 * TOUR-03 "Confeitaria Colombo + City Tour Rio").
 *
 * Writes ONLY Trip.title and Trip.description of TOUR-01/02/03, in PT/EN/ES. Never prices, images, highlights,
 * publication flags, other trips or any other table. Texts come from the Owner-approved content (lib/catalog/launch-trip-copy.ts).
 * MUST run BEFORE the approval act: a Trip change after approval invalidates it (enforced by the database).
 *
 * Default is a DRY RUN (backup of the current values + per-field diff, no write). `--apply` writes in one transaction.
 * Refuses any database other than a local throw-away one (127.0.0.1/localhost:5433, database rt_s11_* or rt119_*):
 * running it against the hosted database is NOT authorized; that run belongs to the controlled release procedure
 * (backup, this dry run reviewed, Owner's written authorization).
 * Usage: DATABASE_URL=<local rt_s11_*> npx tsx scripts/s11-launch-trip-copy.ts [--apply]
 */
import { prisma } from "@/lib/prisma";
import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { approvedTripCopy, tripCopyDiff } from "@/lib/catalog/launch-trip-copy";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !/^\/(rt_s11_|rt119_)/.test(url.pathname) || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt_s11_* or rt119_* is allowed (hosted run not authorized)");
}
assertDatabaseAccess({ operation: process.argv.includes("--apply") ? "write" : "read", label: "scripts/s11-launch-trip-copy.ts" }); // RT-104

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await prisma.trip.findMany({ where: { id: { in: [...LAUNCH_TRIP_IDS] } }, select: { id: true, title: true, description: true } });
  if (rows.length !== LAUNCH_TRIP_IDS.length) throw new Error(`expected ${LAUNCH_TRIP_IDS.length} launch Trip rows, found ${rows.length}`);
  const plan = rows.map((row) => ({ id: row.id, backup: { title: row.title, description: row.description }, next: approvedTripCopy(row.id), changes: tripCopyDiff(row.id, row) }));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", plan: plan.map(({ id, backup, changes }) => ({ id, backup, changes })) }, null, 2));
  if (!apply) return;
  const pending = plan.filter((p) => p.changes.length);
  await prisma.$transaction(pending.map((p) => prisma.trip.update({ where: { id: p.id }, data: { title: p.next.title, description: p.next.description } })));
  console.log(`applied: ${pending.length} Trip row(s) (title/description only)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
