import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * V6 guard (audit 24/10/2026). Prisma 7.2.0–7.8.0 with a driver adapter (@prisma/adapter-pg) returns a pooled connection
 * INSIDE an open transaction when an interactive transaction hits maxWait while starting (prisma/orm issue #29719, fixed
 * in 7.9.0 by PR #29727). On 7.8.0 this lost writes that had been reported as successful. The three Prisma packages must
 * stay pinned to the same exact, stable version, never below 7.9.0. A move to Prisma 8 is a separate, reviewed decision.
 */
const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const lock = JSON.parse(readFileSync(path.join(root, "package-lock.json"), "utf8")) as {
  packages: Record<string, { version?: string }>;
};

const declared = {
  prisma: manifest.devDependencies.prisma,
  "@prisma/client": manifest.dependencies["@prisma/client"],
  "@prisma/adapter-pg": manifest.dependencies["@prisma/adapter-pg"],
};

function parse(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

describe("Prisma version guard (issue #29719)", () => {
  it("pins prisma, @prisma/client and @prisma/adapter-pg to one exact stable version", () => {
    const versions = new Set(Object.values(declared));
    expect(versions.size).toBe(1);
    const [version] = versions;
    expect(parse(version)).not.toBeNull(); // exact x.y.z: no range, no pre-release (no 8.0.0-rc)
  });

  it("is at least 7.9.0 (the release with the ROLLBACK fix) and still Prisma 7", () => {
    const [major, minor] = parse(declared.prisma)!;
    expect(major).toBe(7);
    expect(minor).toBeGreaterThanOrEqual(9);
  });

  it("the lockfile resolves the same version for all three packages", () => {
    for (const [name, version] of Object.entries(declared)) {
      expect(lock.packages[`node_modules/${name}`]?.version).toBe(version);
    }
  });
});
