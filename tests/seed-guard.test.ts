import { describe, expect, it } from "vitest";
import { isLocalDatabaseUrl } from "@/lib/db/local-database";

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
      "postgresql://localhost@evil.example.com/db", // 'localhost' is only the user name here
      "not a url",
      "",
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(false);
    }
  });

  it("rejects a local-looking URL whose query string redirects the connection (verified pg behaviour: ?host= overrides the host)", () => {
    for (const url of [
      "postgresql://u:p@localhost/db?host=db.example.com",
      "postgresql://u:p@localhost/db?hostaddr=203.0.113.9",
      "postgresql://u:p@127.0.0.1/db?service=remote",
      "postgresql://u:p@localhost/db?schema=public&host=ep-example.neon.tech",
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(false);
    }
  });

  it("has no remote override: the seed cannot be pointed at a hosted database by any environment variable", async () => {
    const mod = await import("@/lib/db/local-database");
    expect(Object.keys(mod)).toEqual(["isLocalDatabaseUrl"]);
  });
});
