import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACK_PATTERN, HOSTED_TARGETS, classifyPrismaCommand, evaluateDatabaseAccess, parseDatabaseUrl } from "@/lib/db/target-guard.mjs";
import { DatabaseAccessDenied, assertDatabaseAccess, guardPrismaCli, verifyLocalMarker } from "@/lib/db/guard-runtime.mjs";

// RT-104 (18/10/2026): fail-closed guard. Every URL below is FICTITIOUS (".invalid" hosts can never resolve); no test
// connects to a hosted database. The only real connection attempt is to a closed loopback port.
const LOCAL = "postgresql://dev:dev@127.0.0.1:5433/rt104_local";
const NEON_LIKE = "postgresql://u:p@ep-fictitious-000.eu-west-2.aws.neon.tech/neondb?sslmode=require";
const UNKNOWN = "postgresql://u:p@db.unknown-host.invalid:5432/app";
const PREVIEW_HOST = "ep-preview-fictitious.preview.invalid";
const PROD_HOST = "ep-production-fictitious.production.invalid";
const TARGETS = { preview: [PREVIEW_HOST], production: [PROD_HOST] };
const markerOk = () => ({ ok: true });
const markerMissing = () => ({ ok: false, reason: "database rt104_local is not marked as a local isolated database" });

const decide = (env: Record<string, string | undefined>, operation = "schema") => evaluateDatabaseAccess({ env, operation, hostedTargets: TARGETS });
const run = (env: Record<string, string | undefined>, operation = "schema", markerCheck = markerOk) => assertDatabaseAccess({ operation, label: "test", env, hostedTargets: TARGETS, markerCheck });

describe("RT-104 — required scenarios (fictitious URLs only)", () => {
  it("1. a positively identified local database is allowed (loopback + isolation marker)", () => {
    expect(decide({ DATABASE_URL: LOCAL })).toMatchObject({ allowed: true, target: "local", needsLocalMarker: true });
    expect(run({ DATABASE_URL: LOCAL }, "destructive").target).toBe("local");
    expect(run({ DATABASE_URL: LOCAL, RT_DB_TARGET: "local" }, "write").target).toBe("local");
  });

  it("1b. localhost alone is NOT proof (tunnel): without the marker the local database is refused, on any port", () => {
    expect(() => run({ DATABASE_URL: LOCAL }, "read", markerMissing)).toThrow(/not marked as a local isolated database/);
    expect(() => run({ DATABASE_URL: "postgresql://u:p@127.0.0.1:5433/neondb" }, "read", markerMissing)).toThrow(DatabaseAccessDenied);
  });

  it("2. a hosted database is refused (no target, wrong target, target without allowlist, production without ack)", () => {
    expect(decide({ DATABASE_URL: NEON_LIKE }).reasons.join()).toMatch(/hosted provider.*requires RT_DB_TARGET/);
    expect(decide({ DATABASE_URL: NEON_LIKE, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-104" }).reasons.join()).toMatch(/not in the committed allowlist/);
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PROD_HOST}/neondb`, RT_DB_TARGET: "production" }).reasons.join()).toMatch(/requires RT_PROD_MIGRATION_ACK/);
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PROD_HOST}/neondb`, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "yes" }).allowed).toBe(false);
    // The only production path: committed allowlist + declared target + Owner ticket ack (never destructive).
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PROD_HOST}/neondb`, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-123" })).toMatchObject({ allowed: true, target: "production" });
  });

  it("2b. the committed production allowlist is EMPTY; preview allows only the isolated Neon preview project", () => {
    // RT-106 (22/10/2026): only the isolated Neon preview project; production stays empty (no hosted production access).
    expect(HOSTED_TARGETS.preview).toEqual(["ep-crimson-river-zam6stkf.c-2.eu-west-2.aws.neon.tech"]);
    expect(HOSTED_TARGETS.production).toEqual([]);
    const PREVIEW_URL = "postgresql://u:p@ep-crimson-river-zam6stkf.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require";
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: PREVIEW_URL, RT_DB_TARGET: "preview" }, operation: "schema" }).allowed).toBe(true);
    // The preview host can never be used as a production target.
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: PREVIEW_URL, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-123" }, operation: "schema" }).allowed).toBe(false);
    // Without the declared target the preview host is still refused, and destructive operations stay local-only.
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: PREVIEW_URL }, operation: "read" }).allowed).toBe(false);
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: PREVIEW_URL, RT_DB_TARGET: "preview" }, operation: "destructive" }).allowed).toBe(false);
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: NEON_LIKE, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-123" }, operation: "read" }).allowed).toBe(false);
    expect(ACK_PATTERN.test("RT-123")).toBe(true);
  });

  it("3. an unknown destination is refused", () => {
    expect(decide({ DATABASE_URL: UNKNOWN }).reasons.join()).toMatch(/unknown destination/);
    expect(decide({ DATABASE_URL: "postgresql://u:p@10.0.0.5:5432/app" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: "postgresql://u:p@host.docker.internal:5432/app" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: "prisma+postgres://accelerate.prisma-data.net/?api_key=x" }).reasons.join()).toMatch(/unsupported protocol/);
  });

  it("4. a missing connection variable is refused when the operation needs a connection", () => {
    expect(decide({}).reasons.join()).toMatch(/DATABASE_URL: connection string is missing/);
    expect(decide({ DATABASE_URL: "   " }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: "not a url" }).reasons.join()).toMatch(/cannot be parsed/);
    expect(decide({ DATABASE_URL: "postgresql://u:p@127.0.0.1:5433/" }).reasons.join()).toMatch(/no database name/);
  });

  it("5. conflicting configuration is refused", () => {
    expect(decide({ DATABASE_URL: LOCAL, DIRECT_URL: NEON_LIKE }).reasons.join()).toMatch(/DIRECT_URL points to a different database/);
    expect(decide({ DATABASE_URL: LOCAL, POSTGRES_PRISMA_URL: UNKNOWN }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: LOCAL, RT_DB_TARGET: "production" }).reasons.join()).toMatch(/RT_DB_TARGET=production but the host is local/);
    expect(decide({ DATABASE_URL: NEON_LIKE, RT_DB_TARGET: "local" }).reasons.join()).toMatch(/RT_DB_TARGET=local but the host is not local/);
    expect(decide({ DATABASE_URL: LOCAL, VERCEL_ENV: "production" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: LOCAL, RT_PROD_MIGRATION_ACK: "RT-1" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PREVIEW_HOST}/db`, RT_DB_TARGET: "preview", VERCEL_ENV: "production" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: LOCAL, RT_DB_TARGET: "staging" }).reasons.join()).toMatch(/not one of local \| preview \| production/);
    // Same database repeated in another variable is not a conflict.
    expect(decide({ DATABASE_URL: LOCAL, DIRECT_URL: LOCAL }).allowed).toBe(true);
  });

  it("6. attempts to override the URL are refused (host params, PG* variables, CLI URL flags)", () => {
    expect(decide({ DATABASE_URL: `${LOCAL}?host=${"db.unknown-host.invalid"}` }).reasons.join()).toMatch(/"\?host="/);
    expect(decide({ DATABASE_URL: `${LOCAL}?hostaddr=10.0.0.5` }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: `${LOCAL}?service=prod` }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: LOCAL, PGHOST: "db.unknown-host.invalid" }).reasons.join()).toMatch(/PGHOST is set/);
    expect(decide({ DATABASE_URL: LOCAL, PGSERVICE: "prod" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: "postgresql://u:p@localhost,db.unknown-host.invalid/app" }).allowed).toBe(false);
    // Independent review (18/10): parameters/variables that make the check and the real connection diverge.
    expect(decide({ DATABASE_URL: `${LOCAL}?port=6000` }).reasons.join()).toMatch(/"\?port="/);
    expect(decide({ DATABASE_URL: `${LOCAL}?options=-c%20rt.environment%3Dlocal-isolated` }).reasons.join()).toMatch(/"\?options="/);
    expect(decide({ DATABASE_URL: `${LOCAL}?user=postgres` }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: `${LOCAL}?sslmode=disable&schema=public` }).allowed).toBe(true);
    // channel_binding (SCRAM hardening used by Neon URLs) cannot redirect: allowed; the host rules still decide.
    expect(decide({ DATABASE_URL: `${LOCAL}?sslmode=require&channel_binding=require` }).allowed).toBe(true);
    expect(decide({ DATABASE_URL: `${NEON_LIKE}&channel_binding=require` }).reasons.join()).not.toMatch(/channel_binding/);
    expect(decide({ DATABASE_URL: `${NEON_LIKE}&channel_binding=require` }).allowed).toBe(false);
    for (const name of ["PGPORT", "PGOPTIONS", "PGDATABASE", "PGUSER", "PGSSLMODE"]) expect(decide({ DATABASE_URL: LOCAL, [name]: "x" }).reasons.join(), name).toMatch(new RegExp(`${name} is set`));
    expect(decide({ DATABASE_URL: LOCAL, PGPASSWORD: "x" }).allowed).toBe(true);
    expect(decide({ DATABASE_URL: "postgresql://u:p@localhost:5433/rt104_local" }).reasons.join()).toMatch(/use 127\.0\.0\.1 instead of "localhost"/);
    expect(decide({ DATABASE_URL: "postgresql://u:p@127.0.0.1/rt104_local" }).reasons.join()).toMatch(/must state its port explicitly/);
    for (const args of [["db", "execute", "--url", NEON_LIKE, "--stdin"], ["migrate", "diff", `--from-url=${NEON_LIKE}`, "--to-schema", "x"], ["migrate", "dev", "--shadow-database-url", UNKNOWN]]) {
      expect(() => guardPrismaCli(args, { env: { DATABASE_URL: LOCAL }, markerCheck: markerOk })).toThrow(/would bypass the guarded DATABASE_URL/);
    }
  });

  it("7. an unauthorized destructive command is refused (never on hosted, even when allowlisted)", () => {
    const preview = { DATABASE_URL: `postgresql://u:p@${PREVIEW_HOST}/db`, RT_DB_TARGET: "preview" };
    const prod = { DATABASE_URL: `postgresql://u:p@${PROD_HOST}/db`, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-123" };
    for (const env of [preview, prod]) {
      for (const args of [["migrate", "reset", "--force"], ["db", "push"], ["db", "push", "--accept-data-loss"], ["db", "execute", "--stdin"], ["migrate", "dev"], ["studio"], ["something-new"]]) {
        expect(() => guardPrismaCli(args, { env, hostedTargets: TARGETS, markerCheck: markerOk }), args.join(" ")).toThrow(/destructive operations are allowed only on a local isolated database/);
      }
    }
    expect(guardPrismaCli(["migrate", "reset", "--force"], { env: { DATABASE_URL: LOCAL }, markerCheck: markerOk })).toMatchObject({ operation: "destructive", target: "local" });
  });

  it("8. Preview is not presumed to be production (no production ack needed; a production host is not Preview)", () => {
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PREVIEW_HOST}/db`, RT_DB_TARGET: "preview" })).toMatchObject({ allowed: true, target: "preview" });
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PREVIEW_HOST}/db`, RT_DB_TARGET: "preview", VERCEL_ENV: "preview" }).target).toBe("preview");
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PROD_HOST}/db`, RT_DB_TARGET: "preview" }).allowed).toBe(false);
    expect(decide({ DATABASE_URL: `postgresql://u:p@${PREVIEW_HOST}/db`, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-1" }).allowed).toBe(false);
  });

  it("9. commands without a connection are never blocked (even with no URL or a hosted URL)", () => {
    for (const args of [["generate"], ["validate"], ["format"], ["version"], ["-v"], [], ["migrate", "diff", "--from-schema", "a", "--to-schema", "b"]]) {
      expect(guardPrismaCli(args, { env: {} }).operation, args.join(" ")).toBe("none");
      expect(guardPrismaCli(args, { env: { DATABASE_URL: NEON_LIKE } }).operation).toBe("none");
    }
    expect(evaluateDatabaseAccess({ env: {}, operation: "none" }).allowed).toBe(true);
  });

  it("10. a failed validation stops execution (marker check failing or throwing, guard errors, unknown operation)", () => {
    expect(() => run({ DATABASE_URL: LOCAL }, "read", () => { throw new Error("boom"); })).toThrow(/marker check failed/);
    expect(() => run({ DATABASE_URL: LOCAL }, "read", () => ({ ok: false }))).toThrow(DatabaseAccessDenied);
    expect(evaluateDatabaseAccess({ env: { DATABASE_URL: LOCAL }, operation: "anything" }).allowed).toBe(false);
    // Real check against a closed loopback port: cannot verify → refused (no hosted connection is ever attempted).
    expect(verifyLocalMarker("postgresql://u:p@127.0.0.1:1/rt104_closed").ok).toBe(false);
    let executed = false;
    try {
      run({ DATABASE_URL: NEON_LIKE }, "schema");
      executed = true;
    } catch (error) {
      expect(error).toBeInstanceOf(DatabaseAccessDenied);
      expect(String((error as Error).message)).not.toMatch(/u:p@|password/);
    }
    expect(executed).toBe(false);
  }, 20_000);
});

describe("RT-104 — Prisma command classification", () => {
  it.each([
    [["migrate", "deploy"], "schema"],
    [["migrate", "resolve", "--applied", "x"], "schema"],
    [["migrate", "status"], "read"],
    [["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--script"], "read"],
    [["migrate", "dev"], "destructive"],
    [["migrate", "reset"], "destructive"],
    [["db", "push"], "destructive"],
    [["db", "execute", "--file", "x.sql"], "destructive"],
    [["db", "pull"], "read"],
    [["db", "seed"], "write"],
    [["studio"], "destructive"],
    [["--schema", "x", "migrate", "deploy"], "destructive"],
    [["generate"], "none"],
    [["generate", "--sql"], "read"],
  ])("prisma %j → %s", (args, operation) => {
    expect(classifyPrismaCommand(args as string[]).operation).toBe(operation);
  });

  it("never reports credentials when parsing", () => {
    const p = parseDatabaseUrl("postgresql://secret_user:secret_pass@localhost:5433/rt104");
    expect(JSON.stringify({ ...p, params: undefined })).not.toMatch(/secret_/);
  });
});

describe("RT-104 — repository execution paths", () => {
  const root = process.cwd();
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

  it("prisma.config.ts loads only .env.local and runs the guard before building the config", () => {
    const src = read("prisma.config.ts");
    expect(src).not.toMatch(/dotenv\/config/);
    expect(src).toMatch(/loadEnv\(\{ path: '\.env\.local'/);
    expect(src.indexOf("guardPrismaCli(process.argv.slice(2))")).toBeGreaterThan(-1);
    expect(src.indexOf("guardPrismaCli(process.argv.slice(2))")).toBeLessThan(src.indexOf("defineConfig({"));
  });

  it("build, postinstall, dev and start never migrate, push, reset, execute or seed", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    for (const name of ["build", "postinstall", "dev", "start", "preflight:staging"]) {
      expect(scripts[name] ?? "", name).not.toMatch(/migrate|db push|db execute|migrate reset|db seed|prisma\/seed/);
    }
    expect(scripts.postinstall).toBe("prisma generate");
  });

  it("every repository script that connects to a database calls the guard (or is an exempt, documented helper)", () => {
    const EXEMPT: Record<string, string> = {
      "scripts/db/check-local-marker.mjs": "the marker check itself (loopback only, read-only, called by the guard)",
      "scripts/db/mark-local-database.mjs": "runs inside the local Docker container (docker exec), cannot reach another server",
      "scripts/rt-113b-local-db.mjs": "runs inside the local Docker container (docker exec), throw-away rt113b_/rt119_/rt104_ names only",
      "scripts/rt-52-site-shell-validation.mjs": "read-only psql inside the local Docker container (docker exec)",
      "scripts/rt-53-tours-listing-validation.mjs": "read-only psql inside the local Docker container (docker exec)",
      "scripts/rt-55-guest-conversion-validation.mjs": "psql inside the local Docker container (docker exec)",
      "scripts/rt-56-contact-about-validation.mjs": "psql inside the local Docker container (docker exec)",
      "scripts/rt-104-guard-integration.mjs": "spawns npx prisma / guarded scripts only (each guarded); databases via rt-113b-local-db.mjs",
    };
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.(ts|mjs|cjs|js)$/.test(entry.name)) files.push(rel);
      }
    };
    walk("scripts");
    walk("e2e");
    files.push("prisma/seed.ts");
    const connects = /PrismaClient|PrismaPg|lib\/prisma|from "pg"|from 'pg'|require\(['"]pg['"]\)|docker",\s*\["exec"|docker exec|npx[^\n]{0,24}prisma|postgres(ql)?:\/\//;
    const offenders = files.filter((f) => connects.test(read(f)) && !EXEMPT[f] && !/assertDatabaseAccess\(/.test(read(f)));
    expect(offenders).toEqual([]);
    expect(files.filter((f) => connects.test(read(f))).length).toBeGreaterThan(20);
  });
});
