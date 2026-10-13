import { describe, expect, it } from "vitest";
import { REMOTE_SEED_OVERRIDE, isLocalDatabaseUrl } from "@/lib/db/local-database";

describe("seed guard (Owner decision 2026-10-13: the seed is development-only)", () => {
  it("accepts only local database hosts", () => {
    for (const url of [
      "postgresql://u:p@localhost:5433/ricktravel",
      "postgresql://u:p@127.0.0.1:5432/db?schema=public",
      "postgresql://u:p@[::1]:5432/db",
      "postgresql://u:p@host.docker.internal:5432/db",
      "postgresql://u:p@LOCALHOST/db",
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(true);
    }
  });

  it("rejects hosted databases and anything it cannot parse", () => {
    for (const url of [
      "postgresql://u:p@ep-example-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require",
      "postgresql://u:p@db.example.com:5432/app",
      "postgresql://u:p@10.0.0.5:5432/app",
      "postgresql://u:p@localhost.evil.example.com/db",
      "not a url",
      "",
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(false);
    }
  });

  it("the override must be spelled out, never a plain truthy value", () => {
    expect(REMOTE_SEED_OVERRIDE).toBe("I_HAVE_OWNER_AUTHORIZATION");
  });
});
