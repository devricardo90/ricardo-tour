#!/usr/bin/env node
// RT-104 — marks a database of the LOCAL Docker container as an isolated local database:
//   ALTER DATABASE "<db>" SET rt.environment = 'local-isolated'
// Positive identification by construction: the statement runs INSIDE the container (`docker exec <container> psql`
// over the container's own socket, as the container's POSTGRES_USER), so it can never reach a hosted or tunnelled
// server, and no credential passes through this machine's command line.
// Usage: npm run db:mark-local -- <db> [--container ricktravel-db] [--unmark]
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const db = args.find((a) => !a.startsWith("--"));
const containerIdx = args.indexOf("--container");
const container = containerIdx >= 0 ? args[containerIdx + 1] : "ricktravel-db";
const unmark = args.includes("--unmark");
if (!db || !/^[a-z][a-z0-9_]{0,62}$/.test(db)) {
  console.error("Usage: npm run db:mark-local -- <database_name> [--container <name>] [--unmark]  (lowercase letters, digits, _)");
  process.exit(2);
}
if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(container)) {
  console.error("Invalid container name.");
  process.exit(2);
}
const sql = unmark ? `ALTER DATABASE "${db}" RESET rt.environment` : `ALTER DATABASE "${db}" SET rt.environment = 'local-isolated'`;
try {
  execFileSync("docker", ["exec", container, "sh", "-c", `psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 -qc "$1"`, "sh", sql], { stdio: ["ignore", "inherit", "inherit"] });
} catch {
  console.error(`[db-guard] could not ${unmark ? "unmark" : "mark"} ${db} inside container ${container}. Nothing changed.`);
  process.exit(1);
}
console.log(`[db-guard] ${db} ${unmark ? "unmarked" : "marked as local-isolated"} (container ${container}).`);
