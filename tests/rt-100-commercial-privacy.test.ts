import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// RT-100 guards for the Owner's conditions 4 and 11:
//  4. the internal UNCLASSIFIED / operationType state is never shown to a visitor;
// 11. private financial data (TripCommercial / TripCommercialRate) is never exposed by public APIs or pages.
// These are static guards over the source tree. When a later sprint deliberately adds an authenticated ADMIN use of the
// commercial tables, that file must be added to the explicit allow-lists below in the same reviewed change.
const ROOT = process.cwd();

function walk(dir: string, exts: RegExp, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name) || entry.name.startsWith(".next")) continue;
      walk(full, exts, acc);
    } else if (exts.test(entry.name)) acc.push(full);
  }
  return acc;
}
const rel = (f: string) => relative(ROOT, f).replaceAll("\\", "/");
const read = (f: string) => readFileSync(f, "utf8");
// Comments may explain the model; only executable code counts for the guards below.
const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const PRIVATE_TOKENS = /\b(tripCommercial|TripCommercial|TripCommercialRate|tripCommercialRate|netAmountCents|remunerationModel|tariffReference|tariffConfirmedAt|tariffConfirmedBy|priceSource)\b/;
// Files allowed to mention the private commercial model (none yet: it is a schema-only structure in RT-100).
const PRIVATE_ALLOWLIST: string[] = [];
// Files allowed to mention the internal classification outside the UI (the gate and the pure helper).
const CLASSIFICATION_ALLOWLIST = ["lib/catalog/public-trips.ts", "lib/catalog/operation-type.ts"];

describe("private commercial data never reaches public code (Owner condition 11)", () => {
  const files = ["app", "components", "lib"].flatMap((d) => walk(join(ROOT, d), /\.(ts|tsx)$/));

  it("scans a meaningful number of source files", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("no application source references TripCommercial, TripCommercialRate or their private fields", () => {
    const offenders = files.map(rel).filter((f) => !PRIVATE_ALLOWLIST.includes(f) && PRIVATE_TOKENS.test(code(join(ROOT, f))));
    expect(offenders).toEqual([]);
  });

  it("the public catalog gate selects only the partner status, never a commercial relation", () => {
    const src = code(join(ROOT, "lib/catalog/public-trips.ts"));
    expect(src).toMatch(/partner:\s*\{\s*select:\s*\{\s*status:\s*true\s*\}\s*\}/);
    expect(src).not.toMatch(/\bcommercial\??\s*:/);
    expect(src).not.toMatch(/\brates\s*:/);
  });

  it("the public trips API still maps explicit public fields only", () => {
    const src = read(join(ROOT, "app/api/trips/route.ts"));
    expect(src).toContain("trips.map(({ id, title, description, city, location }) => ({ id, title, description, city, location }))");
  });
});

describe("the internal classification is never rendered or returned (Owner condition 4)", () => {
  it("no page, component or API route mentions operationType or UNCLASSIFIED", () => {
    const files = ["app", "components"].flatMap((d) => walk(join(ROOT, d), /\.(ts|tsx)$/));
    const offenders = files
      .map(rel)
      .filter((f) => !CLASSIFICATION_ALLOWLIST.includes(f) && /\b(operationType|UNCLASSIFIED)\b/.test(read(join(ROOT, f))));
    expect(offenders).toEqual([]);
  });

  it("only the gate and the pure helper (lib/catalog) know the classification", () => {
    const libFiles = walk(join(ROOT, "lib"), /\.(ts|tsx)$/).map(rel);
    const mentions = libFiles.filter((f) => /\b(operationType|UNCLASSIFIED)\b/.test(read(join(ROOT, f))));
    expect(mentions.sort()).toEqual([...CLASSIFICATION_ALLOWLIST].sort());
  });
});
