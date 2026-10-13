import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// RT-100: static guards over the migration SQL (no database needed). The real behaviour is proven against isolated
// throw-away databases by scripts/rt-100-validate-migration.mjs; these tests keep the migration additive and data-free.
const dir = readdirSync(join(process.cwd(), "prisma", "migrations")).find((d) => d.includes("rt100_operation_type_partner_commercial"));
const raw = dir ? readFileSync(join(process.cwd(), "prisma", "migrations", dir, "migration.sql"), "utf8") : "";
const sql = raw.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const withoutFkActions = sql.replace(/ON (DELETE|UPDATE) (RESTRICT|CASCADE|SET NULL|NO ACTION)/gi, "");

describe("RT-100 migration shape", () => {
  it("exists", () => {
    expect(dir).toBeTruthy();
    expect(sql.length).toBeGreaterThan(500);
  });

  it("is additive: no drop, rename, retype, update, delete or truncate", () => {
    expect(withoutFkActions).not.toMatch(/\b(DROP|RENAME|TRUNCATE|DELETE\s+FROM|UPDATE\s+"|ALTER\s+COLUMN|SET\s+DATA\s+TYPE)\b/i);
  });

  it("registers no data: no INSERT statements (tariffs, partners and rates are not created by the migration)", () => {
    expect(sql).not.toMatch(/\bINSERT\s+INTO\b/i);
  });

  it("existing trips become UNCLASSIFIED by the column default, never OWN or PARTNER", () => {
    expect(sql).toContain(`ADD COLUMN     "operationType" "OperationType" NOT NULL DEFAULT 'UNCLASSIFIED'`);
    expect(sql).toContain(`"partnerId" TEXT`);
  });

  it("enforces PARTNER <=> partner in the database and restricts deletion", () => {
    expect(sql).toContain(`CHECK (("operationType" = 'PARTNER') = ("partnerId" IS NOT NULL))`);
    expect(sql).toMatch(/Trip_partnerId_fkey[^;]*ON DELETE RESTRICT/);
    expect(sql).toMatch(/TripCommercial_tripId_fkey[^;]*ON DELETE RESTRICT/);
  });

  it("keeps partners inactive by default and gives commercial records no presumed commission/markup", () => {
    expect(sql).toContain(`"status" "PartnerStatus" NOT NULL DEFAULT 'INACTIVE'`);
    expect(sql).toContain(`"remunerationModel" "RemunerationModel",`); // nullable, no DEFAULT
    expect(sql).not.toMatch(/"remunerationModel"[^\n]*DEFAULT/);
  });

  it("prepares child rates, seasonality and price categories without registering a rate", () => {
    for (const col of [`"category" TEXT NOT NULL`, `"ageMin" INTEGER`, `"ageMax" INTEGER`, `"seasonLabel" TEXT`, `"validFrom" TIMESTAMP(3)`, `"validTo" TIMESTAMP(3)`, `"netAmountCents" INTEGER`]) {
      expect(sql).toContain(col);
    }
    expect(sql).toContain(`CHECK ("netAmountCents" IS NULL OR "currency" IS NOT NULL)`);
  });
});
