/** RT-69 Stage 1: read the current public gate and write immutable PT-only, price-free projections. */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

function explicitPt(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const pt = (value as Record<string, unknown>).pt;
  return typeof pt === "string" ? pt.trim() : "";
}

function approvedProse(description: string): string {
  // The public renderer parses these importer metadata blocks separately. Keep only published prose.
  return description
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !/^(Duracao|Categoria|Inclusoes|Exclusoes):/i.test(block))
    .join("\n\n");
}

async function main() {
  const { getPublicTrips, LAUNCH_TRIP_IDS } = await import("../lib/catalog/public-trips");
  const { prisma } = await import("../lib/prisma");
  try {
    const rows = await getPublicTrips();
    if (rows.length !== LAUNCH_TRIP_IDS.length) {
      throw new Error(`Public gate returned ${rows.length}/${LAUNCH_TRIP_IDS.length} launch trips; refusing partial snapshot`);
    }
    const current = [];
    for (const trip of rows) {
      const title = explicitPt(trip.title);
      const description = approvedProse(explicitPt(trip.description));
      if (!title || !description) throw new Error(`Missing explicit PT title/description for ${trip.id}`);
      if (/R\$\s*\d|US\$\s*\d|€\s*\d|\b(?:preço|tarifa|valor|disponibilidade|vagas)\b|\boner\b|comprar viagem/i.test(`${title}\n${description}`)) {
        throw new Error(`Commercial/provider wording in projected public text for ${trip.id}; review before registration`);
      }
      const projection = {
        source_id: `public-tour-catalog:${trip.id}:pt`,
        source_class: "public-tour-catalog",
        locale: "pt",
        trip_id: trip.id,
        title,
        description,
        public_url: `/pt/tours/${trip.id}`,
        source_revision: trip.updatedAt.toISOString(),
      };
      const bytes = Buffer.from(`${JSON.stringify(projection, null, 2)}\n`, "utf8");
      const digest = createHash("sha256").update(bytes).digest("hex");
      const dir = path.join("knowledge", "concierge", "versions", "public-tour-catalog", trip.id);
      const file = path.join(dir, `${digest}.json`);
      mkdirSync(dir, { recursive: true });
      if (existsSync(file)) {
        if (!readFileSync(file).equals(bytes)) throw new Error(`Immutable catalog version changed: ${file}`);
      } else {
        writeFileSync(file, bytes, { flag: "wx" });
      }
      current.push({ source_id: projection.source_id, source_revision: projection.source_revision, snapshot_path: file.replace(/\\/g, "/"), sha256: digest });
      console.log(`${projection.source_id} ${digest} ${file}`);
    }
    // Mutable local pointer to the exact live-gate observation; immutable version files stay untouched.
    writeFileSync(path.join("knowledge", "concierge", "catalog-current.json"), `${JSON.stringify({ locale: "pt", entries: current }, null, 2)}\n`, "utf8");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
