// RT-100 migration validation in ISOLATED, THROW-AWAY databases on a LOCAL Postgres only.
//
//   RT100_ADMIN_URL=postgresql://user:pass@localhost:5433/postgres node scripts/rt-100-validate-migration.mjs
//
// SAFETY (Owner condition 12: the hosted Neon database must never be modified):
//  - refuses any host that is not localhost / 127.0.0.1 / ::1, and any host containing "neon" or "vercel"
//  - only ever creates and drops databases whose names start with "rt100_scratch_"
//  - never reads .env files; the connection string comes only from RT100_ADMIN_URL
//
// What it proves:
//  A. UPGRADE: apply every pre-existing migration, insert legacy-shaped data (the four public trip ids), apply the RT-100
//     migration, and verify every pre-existing column of every row is unchanged, the new columns are
//     UNCLASSIFIED/NULL, and the new private tables are empty.
//  B. RULES: each CHECK / FK behaviour (PARTNER<=>partner, Restrict, rate checks, cascade of rates, slug format).
//  D. SEED: the development-only seed refuses a non-local database, is idempotent on a local one, creates the C2Rio partner
//     INACTIVE with no tour and registers nothing commercial.
//  C. PRISMA: `prisma migrate deploy` accepts the migration directory on a second scratch DB, there is no schema drift,
//     and the generated client works against it.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const ADMIN_URL = process.env.RT100_ADMIN_URL;
if (!ADMIN_URL) throw new Error("Set RT100_ADMIN_URL to a LOCAL Postgres admin connection string (database 'postgres').");

function assertLocal(urlString) {
  const u = new URL(urlString);
  const host = u.hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host) || /neon|vercel|supabase|amazonaws/.test(urlString.toLowerCase())) {
    throw new Error(`REFUSING to run: host "${host}" is not a local Postgres.`);
  }
  return u;
}
const adminUrl = assertLocal(ADMIN_URL);
const suffix = randomBytes(3).toString("hex");
const DB_A = `rt100_scratch_legacy_${suffix}`;
const DB_B = `rt100_scratch_prisma_${suffix}`;
const DB_C = `rt100_scratch_seed_${suffix}`;
const urlFor = (db) => {
  const u = new URL(adminUrl.toString());
  u.pathname = `/${db}`;
  u.search = "";
  return u.toString();
};

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");
const NEW = readdirSync(MIGRATIONS).filter((d) => d.includes("rt100_operation_type_partner_commercial"));
if (NEW.length !== 1) throw new Error("RT-100 migration folder not found (or ambiguous).");
const OLD = readdirSync(MIGRATIONS).filter((d) => /^\d{14}_/.test(d) && d !== NEW[0]).sort();
const sql = (dir) => readFileSync(join(MIGRATIONS, dir, "migration.sql"), "utf8");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
};
async function expectFail(client, name, text, codes) {
  await client.query("BEGIN");
  try {
    await client.query(text);
    await client.query("ROLLBACK");
    check(name, false, "statement unexpectedly succeeded");
  } catch (e) {
    await client.query("ROLLBACK");
    check(name, codes.includes(e.code), `sqlstate ${e.code}`);
  }
}
async function expectOk(client, name, text) {
  await client.query("BEGIN");
  try {
    await client.query(text);
    await client.query("ROLLBACK");
    check(name, true);
  } catch (e) {
    await client.query("ROLLBACK");
    check(name, false, `${e.code}: ${e.message.slice(0, 80)}`);
  }
}

const admin = new pg.Client({ connectionString: ADMIN_URL });
await admin.connect();
const created = [];
try {
  for (const db of [DB_A, DB_B, DB_C]) {
    if (!db.startsWith("rt100_scratch_")) throw new Error("bad scratch name");
    await admin.query(`CREATE DATABASE "${db}"`);
    created.push(db);
  }

  // ---------------------------------------------------------------- A. upgrade of legacy data
  console.log(`\n== A. upgrade of legacy-shaped data (db ${DB_A})`);
  const a = new pg.Client({ connectionString: urlFor(DB_A) });
  await a.connect();
  for (const dir of OLD) await a.query(sql(dir));
  check(`applied ${OLD.length} pre-existing migrations`, true);

  const LAUNCH = ["cmljo0s1u0000t0zqa0bpd23p", "cmlibniq40000z4zqkbujnutt", "cmli1a6im000034zqqzc9sppb", "cmlhxkpy9000028zq27rhytew"];
  for (const [i, id] of LAUNCH.entries()) {
    await a.query(
      `INSERT INTO "Trip" (id, city, "priceCents", "updatedAt", title, description, highlights, "imageUrl", "isPublished")
       VALUES ($1, 'Rio de Janeiro', $2, now(), $3::jsonb, $4::jsonb, '{"pt":[]}'::jsonb, '/images/trips/x.jpg', true)`,
      [id, 10000 * (i + 1), JSON.stringify({ pt: `Legacy tour ${i}` }), JSON.stringify({ pt: `Legacy description ${i}` })],
    );
    await a.query(`INSERT INTO "TripSchedule" (id, "tripId", "startAt", capacity, "pricePerPersonCents", "updatedAt") VALUES ($1, $2, now() + interval '30 days', 10, $3, now())`, [`sched${i}`, id, 10000 * (i + 1)]);
  }
  const OLD_COLS = `id, city, "priceCents", "createdAt", "endDate", "imageUrl", location, "maxGuests", "startDate", "updatedAt", title, description, highlights, "isPublished", "childrenAllowed", "durationDays", "physicalLevel"`;
  const before = (await a.query(`SELECT row_to_json(t) AS r FROM (SELECT ${OLD_COLS} FROM "Trip" ORDER BY id) t`)).rows.map((x) => JSON.stringify(x.r));
  const schedBefore = JSON.stringify((await a.query(`SELECT * FROM "TripSchedule" ORDER BY id`)).rows);

  await a.query(sql(NEW[0]));
  check("RT-100 migration applied on top of existing data without error", true);

  const after = (await a.query(`SELECT row_to_json(t) AS r FROM (SELECT ${OLD_COLS} FROM "Trip" ORDER BY id) t`)).rows.map((x) => JSON.stringify(x.r));
  check("every pre-existing Trip column of every row is byte-identical after the migration", JSON.stringify(before) === JSON.stringify(after), `${before.length} rows`);
  check("TripSchedule rows unchanged", schedBefore === JSON.stringify((await a.query(`SELECT * FROM "TripSchedule" ORDER BY id`)).rows));
  const cls = (await a.query(`SELECT "operationType"::text AS t, "partnerId" AS p, count(*)::int AS n FROM "Trip" GROUP BY 1,2`)).rows;
  check("all 4 existing trips are UNCLASSIFIED with no partner (nothing presumed OWN/PARTNER)", cls.length === 1 && cls[0].t === "UNCLASSIFIED" && cls[0].p === null && cls[0].n === 4, JSON.stringify(cls));
  for (const t of ["Partner", "TripCommercial", "TripCommercialRate"]) {
    check(`new private/partner table "${t}" is created EMPTY`, (await a.query(`SELECT count(*)::int AS n FROM "${t}"`)).rows[0].n === 0);
  }

  // ---------------------------------------------------------------- B. rules
  console.log("\n== B. database rules");
  const T = LAUNCH[0];
  await a.query(`INSERT INTO "Partner" (id, name, slug, "updatedAt") VALUES ('p1', 'Test Partner (fixture)', 'test-partner', now())`);
  check("Partner defaults to INACTIVE", (await a.query(`SELECT status::text AS s FROM "Partner" WHERE id='p1'`)).rows[0].s === "INACTIVE");
  await expectFail(a, "Partner slug with invalid format is rejected", `INSERT INTO "Partner" (id, name, slug, "updatedAt") VALUES ('p2','x','Bad Slug!',now())`, ["23514"]);
  await expectFail(a, "Partner slug must be unique", `INSERT INTO "Partner" (id, name, slug, "updatedAt") VALUES ('p3','x','test-partner',now())`, ["23505"]);

  await expectOk(a, "PARTNER trip WITH a partner is accepted", `UPDATE "Trip" SET "operationType"='PARTNER', "partnerId"='p1' WHERE id='${T}'`);
  await expectFail(a, "PARTNER trip WITHOUT a partner is rejected", `UPDATE "Trip" SET "operationType"='PARTNER' WHERE id='${T}'`, ["23514"]);
  await expectFail(a, "OWN trip WITH a partner is rejected", `UPDATE "Trip" SET "operationType"='OWN', "partnerId"='p1' WHERE id='${T}'`, ["23514"]);
  await expectFail(a, "UNCLASSIFIED trip WITH a partner is rejected", `UPDATE "Trip" SET "partnerId"='p1' WHERE id='${T}'`, ["23514"]);
  await expectOk(a, "OWN trip without a partner is accepted", `UPDATE "Trip" SET "operationType"='OWN' WHERE id='${T}'`);

  // Restrict semantics (committed fixtures, undone below)
  await a.query(`UPDATE "Trip" SET "operationType"='PARTNER', "partnerId"='p1' WHERE id='${T}'`);
  await expectFail(a, "deleting a Partner that still has trips is blocked (Restrict)", `DELETE FROM "Partner" WHERE id='p1'`, ["23001", "23503"]);
  await a.query(`UPDATE "Trip" SET "operationType"='UNCLASSIFIED', "partnerId"=NULL WHERE id='${T}'`);

  await a.query(`INSERT INTO "TripCommercial" (id, "tripId", "updatedAt") VALUES ('tc1', '${T}', now())`);
  check("TripCommercial created empty; recordStatus defaults to UNCONFIRMED; remunerationModel has no default", (await a.query(`SELECT "recordStatus"::text AS s, "remunerationModel" AS m FROM "TripCommercial" WHERE id='tc1'`)).rows.every((r) => r.s === "UNCONFIRMED" && r.m === null));
  await expectFail(a, "deleting a Trip that has private commercial data is blocked (Restrict)", `DELETE FROM "Trip" WHERE id='${T}'`, ["23001", "23503"]);
  await expectFail(a, "only one TripCommercial per Trip", `INSERT INTO "TripCommercial" (id, "tripId", "updatedAt") VALUES ('tc2', '${T}', now())`, ["23505"]);
  await expectFail(a, "TripCommercial currency must be an upper-case ISO code", `UPDATE "TripCommercial" SET currency='brl' WHERE id='tc1'`, ["23514"]);

  const rate = (cols, vals) => `INSERT INTO "TripCommercialRate" (id, "tripCommercialId", "updatedAt", ${cols}) VALUES ('r' || md5(random()::text), 'tc1', now(), ${vals})`;
  await expectOk(a, "a coherent rate row (category, age range, season, amount + currency) is accepted — using a FIXTURE number inside a rolled-back transaction", rate(`category, "ageMin", "ageMax", "seasonLabel", "validFrom", "validTo", "netAmountCents", currency`, `'child', 3, 10, 'low', '2026-03-01', '2026-12-19', 1, 'BRL'`));
  await expectOk(a, "a rate row with no amount is accepted (structure only)", rate(`category`, `'adult'`));
  await expectFail(a, "an amount without a currency is rejected", rate(`category, "netAmountCents"`, `'adult', 1`), ["23514"]);
  await expectFail(a, "a negative amount is rejected", rate(`category, "netAmountCents", currency`, `'adult', -1, 'BRL'`), ["23514"]);
  await expectFail(a, "age range with min > max is rejected", rate(`category, "ageMin", "ageMax"`, `'child', 10, 3`), ["23514"]);
  await expectFail(a, "negative minimum age is rejected", rate(`category, "ageMin"`, `'child', -1`), ["23514"]);
  await expectFail(a, "validity window with from > to is rejected", rate(`category, "validFrom", "validTo"`, `'adult', '2026-12-19', '2026-03-01'`), ["23514"]);
  await expectFail(a, "blank category is rejected", rate(`category`, `'   '`), ["23514"]);
  await expectFail(a, "lower-case currency on a rate is rejected", rate(`category, currency`, `'adult', 'brl'`), ["23514"]);

  await a.query(rate(`category`, `'adult'`));
  await a.query(`DELETE FROM "TripCommercial" WHERE id='tc1'`);
  check("rates are removed with their TripCommercial (cascade), Trip untouched", (await a.query(`SELECT count(*)::int AS n FROM "TripCommercialRate"`)).rows[0].n === 0 && (await a.query(`SELECT count(*)::int AS n FROM "Trip"`)).rows[0].n === 4);
  await a.end();

  // ---------------------------------------------------------------- C. Prisma
  console.log(`\n== C. Prisma deploy, drift and client (db ${DB_B})`);
  const env = { ...process.env, DATABASE_URL: urlFor(DB_B) };
  assertLocal(env.DATABASE_URL);
  const prisma = (args) => spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", ...args], { cwd: process.cwd(), env, encoding: "utf8", shell: process.platform === "win32" });
  const dep = prisma(["migrate", "deploy"]);
  check("`prisma migrate deploy` applies the whole chain including RT-100", dep.status === 0 && /have been successfully applied|No pending migrations/.test(dep.stdout + dep.stderr), `exit ${dep.status}`);
  const drift = prisma(["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"]);
  check("no drift between the migrated database and prisma/schema.prisma", drift.status === 0, `exit ${drift.status}`);

  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: urlFor(DB_B) }) });
  try {
    const trip = await client.trip.create({ data: { city: "Rio de Janeiro", priceCents: 1, title: { pt: "fixture" }, highlights: { pt: [] } } });
    check("Prisma client: a new Trip defaults to operationType UNCLASSIFIED", trip.operationType === "UNCLASSIFIED" && trip.partnerId === null);
    const partner = await client.partner.create({ data: { name: "Fixture Partner", slug: "fixture-partner" } });
    check("Prisma client: a new Partner defaults to INACTIVE with no public label", partner.status === "INACTIVE" && partner.publicLabel === null);
    let rejected = false;
    try { await client.trip.update({ where: { id: trip.id }, data: { operationType: "PARTNER" } }); } catch { rejected = true; }
    check("Prisma client: PARTNER without a partner is rejected by the database", rejected);
    const ok = await client.trip.update({ where: { id: trip.id }, data: { operationType: "PARTNER", partnerId: partner.id } });
    check("Prisma client: PARTNER with a partner is accepted", ok.operationType === "PARTNER");
  } finally {
    await client.$disconnect();
  }

  // ---------------------------------------------------------------- D. seed
  console.log(`
== D. development-only seed (db ${DB_C})`);
  const envC = { ...process.env, DATABASE_URL: urlFor(DB_C) };
  assertLocal(envC.DATABASE_URL);
  const runCmd = (cmd, args, env) => spawnSync(process.platform === "win32" ? `${cmd}.cmd` : cmd, args, { cwd: process.cwd(), env, encoding: "utf8", shell: process.platform === "win32" });
  const depC = runCmd("npx", ["prisma", "migrate", "deploy"], envC);
  check("scratch seed database migrated with the full chain", depC.status === 0, `exit ${depC.status}`);

  const REMOTE_LOOKING = "postgresql://someone:secret-password@db.example.com:5432/production_like";
  const refused = runCmd("npx", ["tsx", "prisma/seed.ts"], { ...process.env, DATABASE_URL: REMOTE_LOOKING });
  const refusedOut = `${refused.stdout}${refused.stderr}`;
  check("the seed REFUSES a non-local DATABASE_URL (exit 1, nothing connected)", refused.status === 1 && /REFUSING to run/.test(refusedOut), `exit ${refused.status}`);
  check("the refusal never prints the connection string or its password", !/secret-password|db.example.com/.test(refusedOut));

  const seed1 = runCmd("npx", ["tsx", "prisma/seed.ts"], envC);
  check("the seed runs on a LOCAL database", seed1.status === 0, `exit ${seed1.status}`);
  const c = new pg.Client({ connectionString: urlFor(DB_C) });
  await c.connect();
  const snap = async () => ({
    trips: (await c.query(`SELECT count(*)::int AS n FROM "Trip"`)).rows[0].n,
    unclassified: (await c.query(`SELECT count(*)::int AS n FROM "Trip" WHERE "operationType"='UNCLASSIFIED' AND "partnerId" IS NULL`)).rows[0].n,
    partners: (await c.query(`SELECT slug, status::text AS status, "publicLabel" IS NULL AS nolabel FROM "Partner" ORDER BY slug`)).rows,
    commercial: (await c.query(`SELECT (SELECT count(*)::int FROM "TripCommercial") + (SELECT count(*)::int FROM "TripCommercialRate") AS n`)).rows[0].n,
  });
  const s1 = await snap();
  check("the 6 development trips are all UNCLASSIFIED with no partner (nothing presumed OWN/PARTNER)", s1.trips === 6 && s1.unclassified === 6, JSON.stringify({ trips: s1.trips, unclassified: s1.unclassified }));
  check("C2Rio exists as its own partner structure: INACTIVE, no public label, and no partner tour", s1.partners.length === 1 && s1.partners[0].slug === "c2rio" && s1.partners[0].status === "INACTIVE" && s1.partners[0].nolabel === true);
  check("no commercial tariff, rate, cost, commission or markup is registered by the seed", s1.commercial === 0);
  const seed2 = runCmd("npx", ["tsx", "prisma/seed.ts"], envC);
  const s2 = await snap();
  check("the seed is idempotent (second run: same counts, still one partner)", seed2.status === 0 && JSON.stringify(s1) === JSON.stringify(s2));
  await c.end();
} finally {
  for (const db of created) {
    if (db.startsWith("rt100_scratch_")) await admin.query(`DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`);
  }
  await admin.end();
  console.log(`\nscratch databases dropped: ${created.join(", ")}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\nRESULT: ${results.length - failed.length}/${results.length} checks passed${failed.length ? ` — FAILED: ${failed.map((f) => f.name).join(" | ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
