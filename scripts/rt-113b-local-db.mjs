#!/usr/bin/env node
/**
 * RT-113 complement — helper for LOCAL THROW-AWAY databases only (Docker container ricktravel-db, localhost:5433).
 * Reads the local admin URL from a temp JSON file (never printed), refuses anything that is not localhost:5433 or a
 * database not named rt113b_*, rt119_* or rt104_*. Commands:
 *   url <db>              → prints the connection URL of <db> (for an inline DATABASE_URL; do not log it)
 *   create <db> | drop <db>
 *   dump <db> <file>      → schema-only dump (pg_dump inside the container) to <file>
 *   sql <db> <file>       → runs a SQL file inside a single transaction (ON_ERROR_STOP)
 * Usage: RT113B_ADMIN_FILE=<temp json> node scripts/rt-113b-local-db.mjs <command> ...
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const [cmd, db, file] = process.argv.slice(2);
const adminFile = process.env.RT113B_ADMIN_FILE;
if (!adminFile) throw new Error("RT113B_ADMIN_FILE not set");
const admin = new URL(JSON.parse(fs.readFileSync(adminFile, "utf8")).admin);
if (!["localhost", "127.0.0.1"].includes(admin.hostname) || admin.port !== "5433" || /neon|aws|vercel|supabase/i.test(admin.href)) {
  throw new Error("Refusing: admin URL is not the local Docker Postgres localhost:5433");
}
if (!db || !/^(rt113b|rt119|rt104)_[a-z0-9_]+$/.test(db)) throw new Error("Refusing: database name must match rt113b_*, rt119_* or rt104_*");

const user = decodeURIComponent(admin.username);
const pass = decodeURIComponent(admin.password);
// The password goes through the child environment (`-e PGPASSWORD` copies it from there), never on the command line.
const dockerPsql = (args, input) =>
  execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD", "ricktravel-db", ...args], { input, env: { ...process.env, PGPASSWORD: pass }, stdio: ["pipe", "pipe", "inherit"] }).toString();

switch (cmd) {
  case "url": {
    const u = new URL(admin.href);
    u.pathname = `/${db}`;
    u.hostname = "127.0.0.1"; // RT-104: the guard requires a literal loopback address and an explicit port
    if (!u.port) u.port = "5433";
    process.stdout.write(u.toString());
    break;
  }
  case "create":
    dockerPsql(["psql", "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE "${db}"`]);
    dockerPsql(["psql", "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `ALTER DATABASE "${db}" SET rt.environment = 'local-isolated'`]); // RT-104 marker
    console.log(`created ${db}`);
    break;
  case "drop":
    dockerPsql(["psql", "-U", user, "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE IF EXISTS "${db}" WITH (FORCE)`]);
    console.log(`dropped ${db}`);
    break;
  case "dump": {
    const out = dockerPsql(["pg_dump", "-U", user, "-d", db, "--schema-only", "--no-owner", "--no-privileges"]);
    fs.writeFileSync(file, out.replace(/^\\(un)?restrict .*$/gm, "").replace(/^-- Dumped (from|by) .*$/gm, ""));
    console.log(`schema of ${db} written to ${file}`);
    break;
  }
  case "sql":
    dockerPsql(["psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1", "--single-transaction", "-q"], fs.readFileSync(file));
    console.log(`applied ${file} to ${db}`);
    break;
  default:
    throw new Error(`unknown command ${cmd}`);
}
