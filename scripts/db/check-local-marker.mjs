// RT-104 — child process used by lib/db/guard-runtime.mjs: connects to RT_GUARD_URL (a LOOPBACK database, already
// checked by the pure guard) and prints {"marker":…,"db":…} as one JSON line. Read-only (catalog read of the stored database setting).
// Never prints the connection string. Exit 1 with {"error":<code>} on any failure.
import pg from "pg";

const url = process.env.RT_GUARD_URL;
if (!url) {
  console.log(JSON.stringify({ error: "no_url" }));
  process.exit(1);
}
const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 8_000, statement_timeout: 5_000 });
try {
  await client.connect();
  // The STORED per-database setting (ALTER DATABASE … SET), never the session value: a session value can be injected
  // by the client (?options=-c …, PGOPTIONS) on any server without privileges.
  const { rows } = await client.query(
    `SELECT current_database() AS db,
            (SELECT split_part(cfg, '=', 2) FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase, unnest(s.setconfig) AS cfg
              WHERE d.datname = current_database() AND s.setrole = 0 AND split_part(cfg, '=', 1) = 'rt.environment' LIMIT 1) AS marker`,
  );
  console.log(JSON.stringify({ marker: rows[0]?.marker ?? null, db: rows[0]?.db ?? null }));
  await client.end();
} catch (error) {
  console.log(JSON.stringify({ error: typeof error?.code === "string" ? error.code : "connect_failed" }));
  await client.end().catch(() => {});
  process.exit(1);
}
