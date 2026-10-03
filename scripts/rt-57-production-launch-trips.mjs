/**
 * RT-57 — guarded production data script: create ONLY the four approved launch trips, with their canonical IDs.
 *
 * Why: the public catalog is an explicit ID allowlist (lib/catalog/public-trips.ts LAUNCH_TRIP_IDS). The production
 * database holds legacy/seed rows and none of these IDs, so the public catalog is empty. This script creates the four
 * missing rows and touches nothing else. It is NOT scripts/import-real-trips.mjs (which matches by title and upserts everything).
 *
 * Content comes from the tracked canonical source data/real-trips.json (wording corrected by commit 024d705), built with the
 * same rules as scripts/import-real-trips.mjs, and is cross-checked against the verified local database rows.
 *
 * Modes (never prints credentials, logs IDs only):
 *   node scripts/rt-57-production-launch-trips.mjs --offline
 *       Build + validate the four rows and compare them with the local database. No production connection.
 *   RT57_TARGET_DATABASE_URL=... node scripts/rt-57-production-launch-trips.mjs
 *       DRY RUN (default): connects READ ONLY, reports existing rows, collisions and the rows that would be created.
 *   RT57_TARGET_DATABASE_URL=... node scripts/rt-57-production-launch-trips.mjs --apply --confirm-production=<host>/<database>
 *       Creates the missing approved rows inside one transaction, then verifies and checks that no other row changed.
 *
 * Safety: the URL must come from RT57_TARGET_DATABASE_URL (the repo .env is never loaded); localhost and any host/database other
 * than the allow-listed production target are refused; existing approved IDs are never overwritten (the run aborts instead).
 */
import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

const ALLOWED_HOST = "ep-silent-forest-abhp9s19-pooler.eu-west-2.aws.neon.tech";
const ALLOWED_DB = "neondb";
const SOURCE_FILE = "data/real-trips.json";
const APPROVED = [
  { id: "cmljo0s1u0000t0zqa0bpd23p", title: "Tour Privado Premium Rio de Janeiro" },
  { id: "cmlibniq40000z4zqkbujnutt", title: "Confeitaria Colombo + City Tour Rio" },
  { id: "cmli1a6im000034zqqzc9sppb", title: "Tour Favela Rocinha com Guia Local" },
  { id: "cmlhxkpy9000028zq27rhytew", title: "Cristo Redentor + Pão de Açúcar" },
];
const UNSUPPORTED = /(credenciad|experi[eê]ncia segura)/i;

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const offline = args.has("--offline");
const confirm = process.argv.find((a) => a.startsWith("--confirm-production="))?.split("=")[1];

// ---- build the four rows exactly like import-real-trips.mjs does ----
const text = (v) => { const t = String(v || "").trim(); return { pt: t, en: t, es: t, sv: t }; };
const list = (items) => { const l = Array.isArray(items) ? items.map((i) => String(i).trim()).filter(Boolean) : []; return { pt: l, en: l, es: l, sv: l }; };
const describe = (t) => [
  t.descricao && String(t.descricao).trim(),
  t.duracao && `Duracao: ${String(t.duracao).trim()}.`,
  t.categoria && `Categoria: ${String(t.categoria).trim()}.`,
  Array.isArray(t.inclusoes) && t.inclusoes.length > 0 && `Inclusoes: ${t.inclusoes.join(", ")}.`,
  Array.isArray(t.exclusoes) && t.exclusoes.length > 0 && `Exclusoes: ${t.exclusoes.join(", ")}.`,
].filter(Boolean).join("\n\n");

const source = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf8"));
const rows = APPROVED.map(({ id, title }) => {
  const t = source.find((s) => s.nome === title);
  if (!t) throw new Error(`approved trip missing from ${SOURCE_FILE}: ${title}`);
  return {
    id,
    title: text(t.nome),
    description: text(describe(t)),
    highlights: list(t.highlights),
    city: String(t.local || "Rio de Janeiro").trim(),
    location: t.location ? String(t.location).trim() : String(t.local || "").trim(),
    priceCents: Math.round(Number(t.preco_base || 0) * 100),
    imageUrl: String(t.imageUrl || "/images/placeholder.svg").trim(),
    isPublished: true,
    startDate: null,
    endDate: null,
    maxGuests: null,
    // defaults left to the schema: childrenAllowed true, durationDays 1, physicalLevel LIGHT, createdAt/updatedAt now
  };
});
for (const r of rows) {
  if (UNSUPPORTED.test(JSON.stringify(r))) throw new Error(`unsupported claim in canonical content for ${r.id}`);
  if (!fs.existsSync(`public${r.imageUrl}`)) throw new Error(`image missing for ${r.id}: ${r.imageUrl}`);
}

// jsonb returns object keys in its own order; compare with sorted keys.
const canon = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([p], [q]) => p.localeCompare(q))) : x));
const mask = (url) => { const u = new URL(url); return { host: u.hostname, port: u.port || "(default)", database: u.pathname.slice(1) }; };
const printRows = () => {
  for (const r of rows) {
    console.log(`  ${r.id} | ${r.title.pt} | ${r.city} / ${r.location} | ${r.priceCents} cents | image ${r.imageUrl} | published ${r.isPublished}`);
    console.log(`    highlights(${r.highlights.pt.length}): ${r.highlights.pt.join("; ")}`);
    console.log(`    description: ${JSON.stringify(r.description.pt).slice(0, 160)}...`);
  }
};

if (offline) {
  // Compare with the verified LOCAL database (dev), never with production.
  const env = dotenv.parse(fs.readFileSync(".env.local"));
  const local = mask(env.DATABASE_URL);
  if (!["localhost", "127.0.0.1"].includes(local.host)) throw new Error("--offline compares against the local database only");
  const c = new pg.Client({ connectionString: env.DATABASE_URL });
  await c.connect();
  const res = await c.query('select * from "Trip" where id = any($1)', [APPROVED.map((a) => a.id)]);
  await c.end();
  let ok = true;
  for (const r of rows) {
    const l = res.rows.find((x) => x.id === r.id);
    const same = l && canon([l.title, l.description, l.highlights, l.city, l.location, l.priceCents, l.imageUrl, l.isPublished]) === canon([r.title, r.description, r.highlights, r.city, r.location, r.priceCents, r.imageUrl, r.isPublished]);
    console.log(`  ${r.id}: ${same ? "matches local verified row" : "DIFFERS from local row"}`);
    ok = ok && !!same;
  }
  console.log(`OFFLINE VALIDATION: ${ok ? "PASS" : "FAIL"} | rows: ${rows.length} | source: ${SOURCE_FILE} | unsupported claims: 0 | images present: ${rows.length}/${rows.length}`);
  printRows();
  process.exit(ok ? 0 : 1);
}

const url = process.env.RT57_TARGET_DATABASE_URL;
if (!url) throw new Error("RT57_TARGET_DATABASE_URL is required (the repo .env is intentionally not loaded)");
const target = mask(url);
console.log(`target: ${target.host} | port ${target.port} | database ${target.database} | mode ${apply ? "APPLY" : "DRY RUN (read only)"}`);
if (["localhost", "127.0.0.1"].includes(target.host)) throw new Error("refusing a local database");
if (target.host !== ALLOWED_HOST || target.database !== ALLOWED_DB) throw new Error(`refusing unknown target ${target.host}/${target.database}`);
if (apply && confirm !== `${target.host}/${target.database}`) throw new Error(`--apply requires --confirm-production=${target.host}/${target.database}`);

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(apply ? "BEGIN" : "BEGIN READ ONLY");
  const before = (await client.query('select id, "updatedAt" from "Trip" order by id')).rows;
  const present = APPROVED.filter((a) => before.some((b) => b.id === a.id));
  const titles = (await client.query('select id, title->>\'pt\' as t from "Trip"')).rows;
  const collisions = rows.filter((r) => titles.some((x) => x.t === r.title.pt && x.id !== r.id));
  console.log(`existing rows: ${before.length} | approved ids already present: ${present.length} | title collisions with other rows: ${collisions.length}`);
  for (const c of collisions) console.log(`  title collision (legacy row stays untouched, hidden by the allowlist): ${c.title.pt}`);
  if (present.length) throw new Error("approved IDs already exist; refusing to overwrite. Inspect them manually.");
  console.log(`rows to create: ${rows.length}`);
  printRows();
  if (!apply) { await client.query("ROLLBACK"); console.log("DRY RUN complete: nothing written."); process.exit(0); }

  for (const r of rows) {
    await client.query(
      'insert into "Trip" (id, title, description, highlights, city, location, "priceCents", "imageUrl", "isPublished", "updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())',
      [r.id, r.title, r.description, r.highlights, r.city, r.location, r.priceCents, r.imageUrl, r.isPublished],
    );
  }
  const after = (await client.query('select id, "updatedAt" from "Trip" order by id')).rows;
  const unchanged = before.every((b) => { const a = after.find((x) => x.id === b.id); return a && +a.updatedAt === +b.updatedAt; });
  if (after.length !== before.length + rows.length || !unchanged) throw new Error("post-insert check failed; rolling back");
  const back = (await client.query('select id, title->>\'pt\' as t, description::text as d from "Trip" where id = any($1)', [APPROVED.map((a) => a.id)])).rows;
  if (back.length !== rows.length || UNSUPPORTED.test(back.map((b) => b.d).join(" "))) throw new Error("verification failed; rolling back");
  await client.query("COMMIT");
  console.log(`APPLIED: created ${rows.length} rows (${rows.map((r) => r.id).join(", ")}); total rows ${before.length} -> ${after.length}; existing rows unchanged: ${unchanged}`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(`ABORTED: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
