import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PREVIEW_UPDATE_TRIP_IDS, resolveContentScriptTarget } from "@/lib/catalog/content-script-target";
import { HOSTED_TARGETS } from "@/lib/db/target-guard.mjs";

/**
 * Owner 15/11/2026 (A1): the launch-content scripts keep the default block on hosted databases; the isolated preview
 * database is reachable only when declared twice, allowlisted and limited to one tour; production is always refused.
 * Fictitious credentials only.
 */
const TOUR03 = "cmlibniq40000z4zqkbujnutt";
const IDS = ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", TOUR03];
const LOCAL = "postgresql://u:p@127.0.0.1:5433/rt_s11_tour03";
const PREVIEW_HOST = HOSTED_TARGETS.preview[0];
const PREVIEW = `postgresql://u:p@${PREVIEW_HOST}/neondb?sslmode=require`;
const TOUR01 = IDS[0];
const TOUR02 = IDS[1];
const OTHER_NEON = "postgresql://u:p@ep-other-endpoint-000000.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const run = (env: Record<string, string | undefined>, argv: string[] = []) =>
  resolveContentScriptTarget({ env, argv: ["node", "script", ...argv], launchTripIds: IDS, script: "test" });

describe("launch-content scripts: target check (Owner 15/11/2026, A1)", () => {
  it("default: a local throw-away database only, as before", () => {
    expect(run({ DATABASE_URL: LOCAL })).toEqual({ target: "local", trip: undefined });
    expect(run({ DATABASE_URL: LOCAL }, [`--trip=${TOUR03}`])).toEqual({ target: "local", trip: TOUR03 });
    expect(run({ DATABASE_URL: LOCAL, RT_DB_TARGET: "local" })).toMatchObject({ target: "local" });
    expect(() => run({ DATABASE_URL: "postgresql://u:p@127.0.0.1:5433/postgres" })).toThrow(/local throw-away/);
    expect(() => run({ DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/rt_s11_x" })).toThrow(/local throw-away/);
  });

  it("the default block on hosted databases is preserved: the preview host itself is refused without the double declaration", () => {
    expect(() => run({ DATABASE_URL: PREVIEW })).toThrow(/hosted databases need the preview declaration/);
    expect(() => run({ DATABASE_URL: PREVIEW }, [`--trip=${TOUR03}`])).toThrow(/Refusing/);
    expect(() => run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" }, [`--trip=${TOUR03}`])).toThrow(/declared twice/);
    expect(() => run({ DATABASE_URL: PREVIEW }, ["--target=preview", `--trip=${TOUR03}`])).toThrow(/declared twice/);
  });

  it("preview: declared twice, allowlisted host and exactly one tour", () => {
    expect(run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${TOUR03}`])).toEqual({ target: "preview", trip: TOUR03 });
    expect(() => run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" }, ["--target=preview"])).toThrow(/one tour/);
    expect(() => run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" }, ["--target=preview", "--trip=cmljo0s1u0000t0zqa0bpd23p"])).toThrow(/not a launch tour/);
    expect(() => run({ DATABASE_URL: OTHER_NEON, RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${TOUR03}`])).toThrow(/not the allowlisted preview/);
    expect(() => run({ DATABASE_URL: LOCAL, RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${TOUR03}`])).toThrow(/not the allowlisted preview/);
    expect(() => run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview", RT_PROD_MIGRATION_ACK: "RT-119" }, ["--target=preview", `--trip=${TOUR03}`])).toThrow(/RT_PROD_MIGRATION_ACK/);
    expect(() => run({ DATABASE_URL: `${PREVIEW}&host=evil`, RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${TOUR03}`])).toThrow(/redirect/);
  });

  it("the preview exception covers TOUR-03 only; TOUR-01 and TOUR-02 are refused there but stay available locally", () => {
    for (const id of [IDS[0], IDS[1]]) {
      expect(() => run({ DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${id}`])).toThrow(/not covered by the preview exception/);
      expect(run({ DATABASE_URL: LOCAL }, [`--trip=${id}`])).toEqual({ target: "local", trip: id });
    }
    expect(PREVIEW_UPDATE_TRIP_IDS).toEqual([TOUR03]);
  });

  it("production is always refused, whatever is declared", () => {
    for (const [env, argv] of [
      [{ DATABASE_URL: PREVIEW, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-119" }, ["--target=production", `--trip=${TOUR03}`]],
      [{ DATABASE_URL: OTHER_NEON, RT_DB_TARGET: "production" }, [`--trip=${TOUR03}`]],
      [{ DATABASE_URL: LOCAL }, ["--target=production"]],
    ] as const) {
      expect(() => run(env as Record<string, string>, [...argv])).toThrow(/production is never a target/);
    }
    // The committed RT-104 production allowlist stays empty.
    expect(HOSTED_TARGETS.production).toEqual([]);
  });

  it("both scripts use this check, honour --trip and no longer carry their own local-only test", () => {
    const root = path.resolve(__dirname, "..");
    for (const script of ["scripts/rt-119-load-content.ts", "scripts/s11-approve-launch-content.ts"]) {
      const src = readFileSync(path.join(root, script), "utf8");
      expect(src, script).toContain("resolveContentScriptTarget(");
      expect(src, script).toContain("assertDatabaseAccess(");
      expect(src, script).toMatch(/const ids[^=]*= only \? \[only\] : \[\.\.\.LAUNCH_LOAD_TRIP_IDS\]/);
    }
    const approve = readFileSync(path.join(root, "scripts/s11-approve-launch-content.ts"), "utf8");
    expect(approve).not.toMatch(/for \(const id of LAUNCH_LOAD_TRIP_IDS\)/);
  });
});

/**
 * Owner 15/11/2026 (A1, criteria 1 and 2): simulation of the two scripts against the Neon preview, with fictitious
 * credentials and a mocked Prisma client — no connection is ever opened. A correctly declared preview run passes BOTH the
 * new target check and the original RT-104 guard and reaches the write step for TOUR-03 only; TOUR-01 / TOUR-02 are
 * refused on the preview before any database call.
 */
const db = vi.hoisted(() => ({
  findUnique: vi.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
  findMany: vi.fn(async () => [] as unknown[]),
  transaction: vi.fn(async () => undefined),
  disconnect: vi.fn(async () => undefined),
  loadRecord: vi.fn(),
  approve: vi.fn<(prisma: unknown, tripId: string) => Promise<{ approvedAt: Date; fingerprint: string; authorizedMedia: number; unauthorizedMedia: number }>>(async () => ({ approvedAt: new Date(0), fingerprint: "sim", authorizedMedia: 5, unauthorizedMedia: 0 })),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { findUnique: db.findUnique, findMany: db.findMany }, $transaction: db.transaction, $disconnect: db.disconnect } }));
vi.mock("@/lib/catalog/tour-content", async (importOriginal) => ({ ...(await importOriginal<object>()), loadTourContentRecord: db.loadRecord }));
vi.mock("@/lib/catalog/content-approval", () => ({ approveTourContent: db.approve }));

const ENV_KEYS = ["DATABASE_URL", "RT_DB_TARGET", "RT_PROD_MIGRATION_ACK", "VERCEL_ENV", "DIRECT_URL", "SHADOW_DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL", "PRISMA_DATABASE_URL"];
let savedEnv: Record<string, string | undefined>;
let savedArgv: string[];
let logs: string[];

beforeEach(() => {
  savedEnv = Object.fromEntries([...ENV_KEYS, ...Object.keys(process.env).filter((k) => /^PG/.test(k))].map((k) => [k, process.env[k]]));
  for (const k of Object.keys(savedEnv)) delete process.env[k];
  savedArgv = process.argv;
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => void logs.push(args.map(String).join(" ")));
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  for (const fn of Object.values(db)) fn.mockClear();
  db.loadRecord.mockImplementation(async () => null);
  vi.resetModules();
});
afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  process.argv = savedArgv;
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

/** Runs a script the way `npx tsx scripts/<file> …` does (top-level checks, then main()) and waits for it to finish. */
async function runScript(file: string, args: string[], env: Record<string, string>) {
  Object.assign(process.env, env);
  process.argv = ["node", file, ...args];
  await SCRIPTS[file]();
  await vi.waitFor(() => expect(db.disconnect).toHaveBeenCalled(), { timeout: 20_000 });
}
const PREVIEW_ENV = { DATABASE_URL: PREVIEW, RT_DB_TARGET: "preview" };
const SCRIPTS: Record<string, () => Promise<unknown>> = {
  "rt-119-load-content.ts": () => import("../scripts/rt-119-load-content"),
  "s11-approve-launch-content.ts": () => import("../scripts/s11-approve-launch-content"),
};

describe("criterion 1: an authorized preview run passes the new check AND the RT-104 guard (simulated, no connection)", { timeout: 60_000 }, () => {
  it("the two guards in the scripts' order accept the declared preview for TOUR-03, read and write", async () => {
    const { resolveContentScriptTarget } = await import("@/lib/catalog/content-script-target");
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    const env = { ...PREVIEW_ENV };
    expect(resolveContentScriptTarget({ env, argv: ["node", "s", "--target=preview", `--trip=${TOUR03}`, "--apply"], launchTripIds: [TOUR01, TOUR02, TOUR03], script: "sim" })).toEqual({ target: "preview", trip: TOUR03 });
    const noMarker = vi.fn(() => ({ ok: false, reason: "must not be called for a hosted target" }));
    for (const operation of ["read", "write"]) {
      expect(assertDatabaseAccess({ operation, label: "sim", env, markerCheck: noMarker })).toEqual({ target: "preview", url: PREVIEW });
    }
    expect(noMarker).not.toHaveBeenCalled();
    // RT-104 still refuses what it always refused on the preview.
    expect(() => assertDatabaseAccess({ operation: "destructive", label: "sim", env })).toThrow(/destructive operations are allowed only on a local/);
    expect(() => assertDatabaseAccess({ operation: "write", label: "sim", env: { DATABASE_URL: PREVIEW } })).toThrow(/requires RT_DB_TARGET/);
  });

  it("load script: dry run then --apply on the preview reach the write step for TOUR-03 only", async () => {
    await runScript("rt-119-load-content.ts", ["--target=preview", `--trip=${TOUR03}`], PREVIEW_ENV);
    expect(logs[0]).toBe(JSON.stringify({ target: "preview", trips: [TOUR03] }));
    expect(db.findUnique.mock.calls.map(([q]) => q.where.id)).toEqual([TOUR03]);
    expect(db.transaction).not.toHaveBeenCalled(); // dry run: no write
    expect(process.exitCode ?? 0).toBe(0);

    vi.resetModules();
    db.disconnect.mockClear();
    db.findUnique.mockClear();
    await runScript("rt-119-load-content.ts", ["--target=preview", `--trip=${TOUR03}`, "--apply"], PREVIEW_ENV);
    expect(db.findUnique.mock.calls.map(([q]) => q.where.id)).toEqual([TOUR03]);
    expect(db.transaction).toHaveBeenCalledTimes(1); // the single write transaction (mocked: nothing is written)
    expect(logs.some((l) => l.startsWith(`applied ${TOUR03}`))).toBe(true);
    expect(logs.join("\n")).not.toMatch(new RegExp(`${TOUR01}|${TOUR02}`));
  });

  it("approval script: --apply --confirm-owner-approval on the preview approves TOUR-03 only", async () => {
    const { launchLoadRecord } = await import("@/lib/catalog/content-load");
    db.loadRecord.mockImplementation(async (id: string) => ({ ...launchLoadRecord(id), status: "DRAFT", approvedAt: null, approvedContentHash: null }));
    await runScript("s11-approve-launch-content.ts", ["--target=preview", `--trip=${TOUR03}`, "--apply", "--confirm-owner-approval"], PREVIEW_ENV);
    expect(logs[0]).toBe(JSON.stringify({ target: "preview", trips: [TOUR03] }));
    expect(logs.join("\n")).not.toMatch(/REFUSED/);
    expect(db.approve.mock.calls.map(([, id]) => id)).toEqual([TOUR03]);
    expect(db.loadRecord.mock.calls.map(([id]) => id)).toEqual([TOUR03]);
    expect(process.exitCode ?? 0).toBe(0);
  });
});

describe("criterion 2: the preview exception is limited to TOUR-03", { timeout: 60_000 }, () => {
  for (const [name, id] of [["TOUR-01", TOUR01], ["TOUR-02", TOUR02]] as const) {
    for (const [file, extra] of [["rt-119-load-content.ts", ["--apply", "--allow-replace-approved"]], ["s11-approve-launch-content.ts", ["--apply", "--confirm-owner-approval"]]] as const) {
      it(`${file}: ${name} on the preview is refused before any database call`, async () => {
        Object.assign(process.env, PREVIEW_ENV);
        process.argv = ["node", file, "--target=preview", `--trip=${id}`, ...extra];
        await expect(SCRIPTS[file]()).rejects.toThrow(/is not covered by the preview exception/);
        expect(db.findUnique).not.toHaveBeenCalled();
        expect(db.transaction).not.toHaveBeenCalled();
        expect(db.approve).not.toHaveBeenCalled();
      });
    }
  }

  it("the same scripts without --trip on the preview (all three tours) are refused too", async () => {
    Object.assign(process.env, PREVIEW_ENV);
    process.argv = ["node", "s11-approve-launch-content.ts", "--target=preview", "--apply", "--confirm-owner-approval"];
    await expect(import("../scripts/s11-approve-launch-content")).rejects.toThrow(/limited to one tour/);
    expect(db.approve).not.toHaveBeenCalled();
  });
});
