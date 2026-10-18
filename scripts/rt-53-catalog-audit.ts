/**
 * RT-53 — READ-ONLY audit of every Trip record against the public catalog gate (lib/catalog/public-trips).
 * Never writes: it only selects rows. Prints id, title, city, isPublished, the gate result and the grounded reasons.
 *
 *   npx tsx scripts/rt-53-catalog-audit.ts
 */
import dotenv from "dotenv";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

dotenv.config({ path: ".env.local" });
dotenv.config();

assertDatabaseAccess({ operation: "read", label: "scripts/rt-53-catalog-audit.ts" }); // RT-104: deny by default

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { auditTrips } = await import("../lib/catalog/public-trips");
  const rows = await prisma.trip.findMany({ orderBy: { createdAt: "desc" } });
  const audit = auditTrips(rows);
  const pad = (value: string, width: number) => value.padEnd(width).slice(0, width);
  console.log(`${pad("ID", 27)}${pad("TITLE", 40)}${pad("CITY", 16)}${pad("PUBLISHED", 10)}${pad("GATE", 10)}REASONS`);
  for (const entry of audit) {
    const row = rows.find((r) => r.id === entry.id)!;
    const title = (row.title as { pt?: string } | null)?.pt ?? "";
    console.log(
      `${pad(entry.id, 27)}${pad(JSON.stringify(title), 40)}${pad(JSON.stringify(row.city), 16)}${pad(String(row.isPublished), 10)}${pad(entry.included ? "INCLUDED" : "EXCLUDED", 10)}${entry.reasons.join(", ")}`
    );
  }
  console.log(`\nTOTAL ${audit.length}; INCLUDED ${audit.filter((a) => a.included).length}; EXCLUDED ${audit.filter((a) => !a.included).length}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
