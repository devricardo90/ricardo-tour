// RT-104 — runtime side of the database guard: reads the environment, verifies the LOCAL isolation marker on the
// server itself and throws before anything runs. Used by prisma.config.ts (every Prisma CLI command) and by every
// repository script that connects to a database. Protects the repository's execution paths only — it does not replace
// credential separation or database permissions (see docs/ops/rt-104-production-access-guard.md).
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LOCAL_MARKER, classifyPrismaCommand, evaluateDatabaseAccess, parseDatabaseUrl } from "./target-guard.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MARKER_SCRIPT = path.join(HERE, "..", "..", "scripts", "db", "check-local-marker.mjs");

export class DatabaseAccessDenied extends Error {
  constructor(label, reasons) {
    super(`[db-guard] DENIED (${label}): ${reasons.join("; ")}. Nothing was executed.`);
    this.name = "DatabaseAccessDenied";
    this.reasons = reasons;
  }
}

/**
 * Asks the server (through a short-lived child process, so this stays synchronous) for the isolation marker and the
 * current database name. Sanitized child environment: no PG* variables can redirect it. Never prints the URL.
 * @param {string} url
 * @returns {{ ok: boolean, reason?: string }}
 */
export function verifyLocalMarker(url) {
  const parsed = parseDatabaseUrl(url);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const env = { RT_GUARD_URL: url };
  for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "HOME", "USERPROFILE"]) if (process.env[key]) env[key] = process.env[key];
  let out;
  try {
    out = execFileSync(process.execPath, [MARKER_SCRIPT], { env, encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const text = String(error?.stdout ?? "");
    const code = /"error":"([^"]+)"/.exec(text)?.[1] ?? "unreachable";
    return { ok: false, reason: `could not verify the local isolation marker (${code})` };
  }
  let info;
  try {
    info = JSON.parse(out.trim().split("\n").pop() ?? "{}");
  } catch {
    return { ok: false, reason: "invalid answer from the marker check" };
  }
  if (info.marker !== LOCAL_MARKER.value) return { ok: false, reason: `database ${parsed.database} is not marked as a local isolated database (${LOCAL_MARKER.setting} ≠ '${LOCAL_MARKER.value}'; mark it with npm run db:mark-local -- <db>)` };
  if (info.db !== parsed.database) return { ok: false, reason: `the server answered for database "${info.db}", not "${parsed.database}"` };
  return { ok: true };
}

/**
 * Throws DatabaseAccessDenied unless the operation may connect. Returns the target and the URL to use.
 * @param {{ operation: string, label: string, url?: string, urlVar?: string, env?: Record<string, string | undefined>, hostedTargets?: any, markerCheck?: (url: string) => { ok: boolean, reason?: string } }} options
 * @returns {{ target: string | null, url: string | undefined }}
 */
export function assertDatabaseAccess(options) {
  const { operation, label, urlVar = "DATABASE_URL", env = process.env, markerCheck = verifyLocalMarker } = options;
  let decision;
  try {
    decision = evaluateDatabaseAccess({ env, operation, url: options.url, urlVar, hostedTargets: options.hostedTargets });
  } catch {
    decision = { allowed: false, reasons: ["guard failure: denied"] };
  }
  if (!decision.allowed) throw new DatabaseAccessDenied(label, decision.reasons);
  const url = options.url !== undefined ? options.url : env[urlVar];
  if (decision.needsLocalMarker) {
    let marker;
    try {
      marker = markerCheck(/** @type {string} */ (url));
    } catch {
      marker = { ok: false, reason: "marker check failed" };
    }
    if (!marker?.ok) throw new DatabaseAccessDenied(label, [marker?.reason ?? "local database not positively identified"]);
  }
  return { target: decision.target, url };
}

/**
 * Guard for the Prisma CLI, called from prisma.config.ts with the CLI arguments. Commands that need no connection
 * (generate, validate, format, schema-only diff…) are never blocked.
 * @param {string[]} args
 * @param {{ env?: Record<string, string | undefined>, hostedTargets?: any, markerCheck?: (url: string) => { ok: boolean, reason?: string } }} [options]
 */
export function guardPrismaCli(args, options = {}) {
  const cls = classifyPrismaCommand(args);
  const label = `prisma ${cls.command}`;
  if (cls.override) throw new DatabaseAccessDenied(label, [`"${cls.override.split("=")[0]}" would bypass the guarded DATABASE_URL (use --from-config-datasource / DATABASE_URL instead)`]);
  if (cls.operation === "none") return { operation: "none", target: null };
  const { target } = assertDatabaseAccess({ operation: cls.operation, label, ...options });
  return { operation: cls.operation, target };
}
