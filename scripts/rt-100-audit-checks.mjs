// RT-100 independent-audit evidence on THROW-AWAY databases of a LOCAL Postgres only.
//
//   RT100_ADMIN_URL=postgresql://user:pass@localhost:5433/postgres node scripts/rt-100-audit-checks.mjs
//
// R. ROLLBACK: apply the whole migration chain + RT-100 on legacy-shaped data, then execute the rollback statements
//    EXACTLY as written in the migration header and prove (a) the previous schema is restored (zero Prisma diff against
//    origin/main's schema), (b) the legacy rows are unchanged, (c) none of the new objects remain.
// G. GATE: run the real public gate through the real Prisma client on a migrated database
//    (scripts/rt-100-gate-integration.ts): inactive partner, incomplete operator label, full label, private-data leakage.
//
// SAFETY: refuses non-local hosts and host-overriding URL parameters; only creates/drops "rt100_audit_*" databases.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const ADMIN_URL = process.env.RT100_ADMIN_URL;
if (!ADMIN_URL) throw new Error("Set RT100_ADMIN_URL to a LOCAL Postgres admin connection string (database 'postgres').");
function assertLocal(urlString) {
  const u = new URL(urlString);
  if (["host", "hostaddr", "service"].some((p) => u.searchParams.has(p))) throw new Error("REFUSING: host-overriding parameter.");
  const host = u.hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) || /neon|vercel|supabase|amazonaws/.test(urlString.toLowerCase())) {
    throw new Error(`REFUSING to run: host "${host}" is not a local Postgres.`);
  }
  return u;
}
const adminUrl = assertLocal(ADMIN_URL);
assertDatabaseAccess({ operation: "destructive", label: "scripts/rt-100-audit-checks.mjs", url: ADMIN_URL, urlVar: "RT100_ADMIN_URL" }); // RT-104: deny by default
const suffix = randomBytes(3).toString("hex");
const DB_R = `rt100_audit_rollback_${suffix}`;
const DB_G = `rt100_audit_gate_${suffix}`;
const DB_O = `rt100_audit_oldonly_${suffix}`;
const urlFor = (db) => {
  const u = new URL(adminUrl.toString());
  u.pathname = `/${db}`;
  u.search = "";
  return u.toString();
};

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");
const NEW = readdirSync(MIGRATIONS).filter((d) => d.includes("rt100_operation_type_partner_commercial"));
if (NEW.length !== 1) throw new Error("RT-100 migration folder not found.");
const OLD = readdirSync(MIGRATIONS).filter((d) => /^\d{14}_/.test(d) && d !== NEW[0]).sort();
const sql = (dir) => readFileSync(join(MIGRATIONS, dir, "migration.sql"), "utf8");
const isWin = process.platform === "win32";
const run = (cmd, args, env) => spawnSync(isWin ? `${cmd}.cmd` : cmd, args, { cwd: process.cwd(), env, encoding: "utf8", shell: isWin });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
};

const admin = new pg.Client({ connectionString: ADMIN_URL });
await admin.connect();
const created = [];
try {
  for (const db of [DB_R, DB_G]) {
    await admin.query(`CREATE DATABASE "${db}"`);
    await admin.query(`ALTER DATABASE "${db}" SET rt.environment = 'local-isolated'`); // RT-104 local marker
    created.push(db);
  }

  // ------------------------------------------------------------------ R. rollback
  console.log(`\n== R. rollback of the RT-100 migration (db ${DB_R})`);
  const r = new pg.Client({ connectionString: urlFor(DB_R) });
  await r.connect();
  for (const dir of OLD) await r.query(sql(dir));
  const IDS = ["cmljo0s1u0000t0zqa0bpd23p", "cmlibniq40000z4zqkbujnutt", "cmli1a6im000034zqqzc9sppb", "cmlhxkpy9000028zq27rhytew"];
  for (const [i, id] of IDS.entries()) {
    await r.query(
      `INSERT INTO "Trip" (id, city, "priceCents", "updatedAt", title, description, highlights, "imageUrl") VALUES ($1,'Rio de Janeiro',$2,now(),$3::jsonb,$4::jsonb,'{"pt":[]}'::jsonb,'/images/trips/x.jpg')`,
      [id, 10000 * (i + 1), JSON.stringify({ pt: `T${i}` }), JSON.stringify({ pt: `D${i}` })],
    );
  }
  const COLS = `id, city, "priceCents", "createdAt", "endDate", "imageUrl", location, "maxGuests", "startDate", "updatedAt", title, description, highlights, "isPublished", "childrenAllowed", "durationDays", "physicalLevel"`;
  const snap = async () => JSON.stringify((await r.query(`SELECT row_to_json(t) AS r FROM (SELECT ${COLS} FROM "Trip" ORDER BY id) t`)).rows);
  const before = await snap();

  await r.query(sql(NEW[0]));
  // add private rows so the rollback is exercised with the new tables populated
  await r.query(`INSERT INTO "Partner" (id, name, slug, "updatedAt") VALUES ('p1','Fixture','fixture',now())`);
  await r.query(`INSERT INTO "TripCommercial" (id, "tripId", "updatedAt") VALUES ('tc1','${IDS[0]}',now())`);
  await r.query(`INSERT INTO "TripCommercialRate" (id, "tripCommercialId", category, "updatedAt") VALUES ('r1','tc1','adult',now())`);
  check("after the migration the legacy Trip columns are unchanged", (await snap()) === before);

  // execute the rollback EXACTLY as documented in the migration header
  const header = sql(NEW[0]).split("\n");
  const start = header.findIndex((l) => l.startsWith("-- Rollback"));
  const stmts = [];
  for (const l of header.slice(start + 1)) {
    if (!l.startsWith("--   ")) break;
    const text = l.slice(5).trim();
    if (text.startsWith("(")) continue; // prose note about _prisma_migrations
    stmts.push(text);
  }
  const rollbackSql = stmts.join(" ");
  check("the documented rollback statements were extracted from the migration header", rollbackSql.includes('DROP TABLE "Partner"') && rollbackSql.includes('DROP TYPE "OperationType"'), `${stmts.length} lines`);
  let rolled = true;
  try {
    await r.query(rollbackSql);
  } catch (e) {
    rolled = false;
    console.log(`   rollback error: ${e.message}`);
  }
  check("the documented rollback runs without error, even with the new tables populated", rolled);

  check("legacy Trip rows are byte-identical after the rollback (no data lost)", (await snap()) === before);
  const gone = (await r.query(`SELECT
    (SELECT count(*)::int FROM information_schema.tables WHERE table_name IN ('Partner','TripCommercial','TripCommercialRate')) AS tables,
    (SELECT count(*)::int FROM information_schema.columns WHERE table_name='Trip' AND column_name IN ('operationType','partnerId')) AS cols,
    (SELECT count(*)::int FROM pg_type WHERE typname IN ('OperationType','PartnerStatus','PriceSource','RemunerationModel','CommercialRecordStatus')) AS types,
    (SELECT count(*)::int FROM pg_constraint WHERE conname LIKE 'Trip_partner%' OR conname LIKE 'TripCommercial%' OR conname LIKE 'Partner_%') AS constraints`)).rows[0];
  check("no RT-100 table, column, type or constraint remains", gone.tables === 0 && gone.cols === 0 && gone.types === 0 && gone.constraints === 0, JSON.stringify(gone));
  await r.end();

  // The strongest structural proof, independent of Prisma: the complete SQL schema (tables, columns, types, constraints,
  // indexes) of the rolled-back database must equal that of a database built from the pre-RT-100 migrations only.
  const CONTAINER = process.env.RT100_DOCKER_CONTAINER || "ricktravel-db";
  const dump = (db) => spawnSync("docker", ["exec", CONTAINER, "pg_dump", "-U", "postgres", "-s", "--no-owner", "--no-privileges", db], { encoding: "utf8" });
  await admin.query(`CREATE DATABASE "${DB_O}"`);
  await admin.query(`ALTER DATABASE "${DB_O}" SET rt.environment = 'local-isolated'`); // RT-104 local marker
  created.push(DB_O);
  const o = new pg.Client({ connectionString: urlFor(DB_O) });
  await o.connect();
  for (const dir of OLD) await o.query(sql(dir));
  await o.end();
  // "\restrict" / "\unrestrict" lines carry a random token generated by every pg_dump run; they are not schema.
  const norm = (s) => s.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("--") && !/^SET |^SELECT pg_catalog\.set_config|^\\(un)?restrict /.test(l)).join("\n");
  const dr = dump(DB_R);
  const dO = dump(DB_O);
  check("the schema dumps could be taken", dr.status === 0 && dO.status === 0 && dr.stdout.length > 1000, `${dr.stdout.length}/${dO.stdout.length} bytes`);
  const la = norm(dr.stdout).split("\n");
  const lb = norm(dO.stdout).split("\n");
  const different = [];
  for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) different.push(`line ${i + 1}: after-rollback=${JSON.stringify(la[i])} | old-only=${JSON.stringify(lb[i])}`);
  check("the full SQL schema after the rollback is IDENTICAL to a database built from the pre-RT-100 migrations only", different.length === 0, `${la.length} lines compared, ${different.length} differ`);
  for (const d of different.slice(0, 8)) console.log(`   ${d}`);

  // ------------------------------------------------------------------ G. real gate through real Prisma
  console.log(`\n== G. the real public gate on a migrated database (db ${DB_G})`);
  const envG = { ...process.env, DATABASE_URL: urlFor(DB_G) };
  assertLocal(envG.DATABASE_URL);
  const dep = run("npx", ["prisma", "migrate", "deploy"], envG);
  check("scratch database migrated with the full chain", dep.status === 0, `exit ${dep.status}`);
  const gate = run("npx", ["tsx", "scripts/rt-100-gate-integration.ts"], envG);
  process.stdout.write(`${gate.stdout}`.split("\n").map((l) => (l ? `   ${l}` : l)).join("\n"));
  if (gate.stderr.trim()) console.log(gate.stderr.split("\n").filter((l) => !/DEP0190|trace-deprecation/.test(l)).slice(0, 8).join("\n"));
  check("gate integration: every scenario passed", gate.status === 0 && /GATE-RESULT (\d+)\/\1/.test(gate.stdout), `exit ${gate.status}`);
} finally {
  for (const db of created) {
    if (db.startsWith("rt100_audit_")) await admin.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);
  }
  await admin.end();
  console.log(`\nscratch databases dropped: ${created.join(", ")}`);
}
const failed = results.filter((x) => !x.ok);
console.log(`\nRESULT: ${results.length - failed.length}/${results.length} checks passed${failed.length ? ` — FAILED: ${failed.map((f) => f.name).join(" | ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
