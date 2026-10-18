// RT-104 — fail-closed database target guard: PURE decision logic (no I/O, no connection).
// Default: PRODUCTION DATABASE ACCESS = DENIED. A connection is allowed only when the target is positively identified:
//  - local: loopback host AND (checked at run time by guard-runtime.mjs) the database carries the isolation marker
//    `rt.environment = 'local-isolated'` — a loopback host alone is NOT proof (an SSH tunnel can expose a remote server
//    on localhost:5433);
//  - preview / production: RT_DB_TARGET declares it AND the host is in the committed allowlist below (empty today, so
//    every hosted database is refused); production additionally needs RT_PROD_MIGRATION_ACK=<Jira key>.
// Destructive operations (reset, db push, db execute, studio, migrate dev…) are allowed ONLY on a local database.
// Never put credentials in messages: only host, port and database name are ever reported.

/** Isolation marker that a LOCAL database must carry (set only inside the local Docker container). */
export const LOCAL_MARKER = Object.freeze({ setting: "rt.environment", value: "local-isolated" });

/**
 * Committed allowlist of hosted database hosts per target. EMPTY on purpose (RT-104, 18/10/2026): no hosted access is
 * authorized. Adding a host is a reviewed code change (RT-106 creates the Preview database; production only with the
 * Owner's written authorization, RT-100 runbook).
 */
export const HOSTED_TARGETS = Object.freeze({ preview: Object.freeze([]), production: Object.freeze([]) });

/** Production acknowledgement: the Jira key of the Owner-authorized release ticket. */
export const ACK_PATTERN = /^RT-\d+$/;

export const OPERATIONS = Object.freeze(["none", "read", "write", "schema", "destructive"]);

// Literal loopback addresses only: the name "localhost" may resolve differently for the marker check and for the real
// connection (IPv4/IPv6, hosts file), so it is refused with a hint to use 127.0.0.1.
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "[::1]"]);
const PROTOCOLS = new Set(["postgres:", "postgresql:"]);
// Query parameters that cannot redirect the connection nor change the session (allowlist). Everything else is refused:
// pg-connection-string lets e.g. ?port= / ?host= / ?user= override the URL and ?options=-c … set session settings
// (which could fake the isolation marker), and different drivers (pg vs Prisma's engine) may read them differently.
const ALLOWED_PARAMS = new Set(["schema", "sslmode", "sslcert", "sslkey", "sslrootcert", "sslaccept", "channel_binding", "connection_limit", "pool_timeout", "connect_timeout", "socket_timeout", "application_name", "pgbouncer", "statement_cache_size"]);
// libpq / pg fall back to PG* environment variables (PGPORT, PGHOST, PGOPTIONS, PGDATABASE, PGUSER…): all refused except
// the ones that cannot redirect the connection.
const HARMLESS_PG_ENV = new Set(["PGPASSWORD", "PGPASSFILE", "PGAPPNAME", "PGCONNECT_TIMEOUT"]);
// Other connection variables used by Prisma/Vercel/Neon integrations: if present they must point to the same database.
const OTHER_URL_VARS = ["DIRECT_URL", "SHADOW_DATABASE_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING", "NEON_DATABASE_URL", "PRISMA_DATABASE_URL"];
const KNOWN_HOSTED = /neon\.tech|neon\.build|amazonaws\.com|rds\.|supabase|vercel-storage|vercel\.app|render\.com|railway|azure|cloudsql|googleapis|aiven|digitalocean|heroku/i;

/**
 * Parses a PostgreSQL connection string without ever returning its credentials.
 * @param {string | undefined | null} raw
 * @returns {{ ok: true, host: string, port: string, database: string, params: URLSearchParams, loopback: boolean } | { ok: false, reason: string }}
 */
export function parseDatabaseUrl(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return { ok: false, reason: "connection string is missing" };
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return { ok: false, reason: "connection string cannot be parsed" };
  }
  if (!PROTOCOLS.has(url.protocol)) return { ok: false, reason: `unsupported protocol "${url.protocol}" (only postgres:// / postgresql://)` };
  const host = url.hostname.toLowerCase();
  if (!host) return { ok: false, reason: "connection string has no host" };
  if (host.includes(",")) return { ok: false, reason: "multiple hosts are not allowed" };
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) return { ok: false, reason: "connection string has no database name" };
  return { ok: true, host, port: url.port || "5432", explicitPort: Boolean(url.port), database, params: url.searchParams, loopback: LOOPBACK_HOSTS.has(host) };
}

const describe = (p) => `${p.host}:${p.port}/${p.database}`;

/**
 * Decides whether an operation may connect to the configured database. Pure: the caller supplies the environment.
 * A returned `allowed: true` with `needsLocalMarker: true` is only provisional: the runtime MUST then verify the marker.
 * @param {{ env?: Record<string, string | undefined>, operation: string, url?: string, urlVar?: string, hostedTargets?: { preview: readonly string[], production: readonly string[] } }} input
 * @returns {{ allowed: boolean, target: "local" | "preview" | "production" | null, needsLocalMarker: boolean, reasons: string[], destination: string | null }}
 */
export function evaluateDatabaseAccess(input) {
  const deny = (reasons, destination = null) => ({ allowed: false, target: null, needsLocalMarker: false, reasons, destination });
  try {
    const { env = {}, operation, urlVar = "DATABASE_URL", hostedTargets = HOSTED_TARGETS } = input;
    if (!OPERATIONS.includes(operation)) return deny([`unknown operation "${operation}"`]);
    if (operation === "none") return { allowed: true, target: null, needsLocalMarker: false, reasons: [], destination: null };

    const raw = input.url !== undefined ? input.url : env[urlVar];
    const parsed = parseDatabaseUrl(raw);
    if (!parsed.ok) return deny([`${urlVar}: ${parsed.reason}`]);
    const destination = describe(parsed);
    const reasons = [];

    for (const name of Object.keys(env)) if (/^PG/.test(name) && !HARMLESS_PG_ENV.has(name) && env[name]?.trim()) reasons.push(`${name} is set (it can redirect or alter the connection): unset it`);
    for (const name of new Set(parsed.params.keys())) if (!ALLOWED_PARAMS.has(name.toLowerCase())) reasons.push(`the connection string carries "?${name}=" (only ${[...ALLOWED_PARAMS].join(", ")} are allowed)`);
    if (parsed.host === "localhost") reasons.push('use 127.0.0.1 instead of "localhost" (name resolution may differ between the check and the connection)');
    for (const name of OTHER_URL_VARS) {
      if (name === urlVar || !env[name]?.trim()) continue;
      const other = parseDatabaseUrl(env[name]);
      if (!other.ok || describe(other) !== destination) reasons.push(`conflicting configuration: ${name} points to a different database than ${urlVar}`);
    }

    const declared = env.RT_DB_TARGET?.trim() || "";
    const ack = env.RT_PROD_MIGRATION_ACK?.trim() || "";
    const vercel = env.VERCEL_ENV?.trim() || "";
    if (declared && !["local", "preview", "production"].includes(declared)) reasons.push(`RT_DB_TARGET="${declared}" is not one of local | preview | production`);

    if (parsed.loopback) {
      if (!parsed.explicitPort) reasons.push("a local connection string must state its port explicitly (otherwise PGPORT or driver defaults decide)");
      if (declared && declared !== "local") reasons.push(`conflicting configuration: RT_DB_TARGET=${declared} but the host is local (${parsed.host})`);
      if (vercel) reasons.push(`conflicting configuration: VERCEL_ENV=${vercel} with a local database`);
      if (ack) reasons.push("conflicting configuration: RT_PROD_MIGRATION_ACK is set for a local database");
      if (reasons.length) return deny(reasons, destination);
      return { allowed: true, target: "local", needsLocalMarker: true, reasons: [], destination };
    }

    // Non-loopback = hosted or unknown: positive identification through the committed allowlist only.
    const hint = KNOWN_HOSTED.test(parsed.host) ? " (hosted provider)" : " (unknown destination)";
    if (!declared) reasons.push(`non-local database ${parsed.host}${hint}: requires RT_DB_TARGET=preview|production and an allowlisted host`);
    else if (declared === "local") reasons.push(`conflicting configuration: RT_DB_TARGET=local but the host is not local (${parsed.host})`);
    else {
      const allowed = (hostedTargets[declared] ?? []).map((h) => h.toLowerCase());
      if (!allowed.includes(parsed.host)) reasons.push(`host ${parsed.host} is not in the committed allowlist for "${declared}" (lib/db/target-guard.mjs HOSTED_TARGETS)`);
      if (vercel && vercel !== declared) reasons.push(`conflicting configuration: VERCEL_ENV=${vercel} but RT_DB_TARGET=${declared}`);
      if (declared === "production" && !ACK_PATTERN.test(ack)) reasons.push("production requires RT_PROD_MIGRATION_ACK=<Owner-authorized Jira key, e.g. RT-123>");
      if (declared === "preview" && ack) reasons.push("conflicting configuration: RT_PROD_MIGRATION_ACK is set for a preview database");
    }
    if (operation === "destructive") reasons.push(`destructive operations are allowed only on a local isolated database (target ${parsed.host})`);
    if (reasons.length) return deny(reasons, destination);
    return { allowed: true, target: /** @type {"preview" | "production"} */ (declared), needsLocalMarker: false, reasons: [], destination };
  } catch (error) {
    return deny([`guard failure (${error instanceof Error ? error.name : "unknown"}): denied`]);
  }
}

// Flags that would make Prisma connect to a URL other than the guarded DATABASE_URL.
const URL_OVERRIDE_FLAGS = ["--url", "--from-url", "--to-url", "--shadow-database-url", "--from-schema-datasource", "--to-schema-datasource"];
const NO_CONNECTION = new Set(["", "generate", "validate", "format", "version", "--version", "-v", "help", "--help", "-h", "init", "debug"]);

/**
 * Classifies a Prisma CLI invocation (the arguments after the prisma entry point). Unknown commands are destructive.
 * @param {string[]} args
 * @returns {{ command: string, operation: "none" | "read" | "write" | "schema" | "destructive", override: string | null }}
 */
export function classifyPrismaCommand(args) {
  const list = Array.isArray(args) ? args.map(String) : [];
  const override = list.find((a) => URL_OVERRIDE_FLAGS.some((f) => a === f || a.startsWith(`${f}=`))) ?? null;
  const [first = "", second = ""] = list;
  const group = first; // a leading unknown flag makes the command unknown → destructive (fail-closed)
  const sub = second.startsWith("-") ? "" : second;
  const uses = (flag) => list.some((a) => a === flag);
  let command = group;
  let operation = "destructive";
  if (group === "generate" && list.some((a) => a === "--sql" || a.startsWith("--sql="))) {
    command = "generate --sql";
    operation = "read"; // TypedSQL introspects the database
  } else if (NO_CONNECTION.has(group)) operation = "none";
  else if (group === "migrate") {
    command = `migrate ${sub}`.trim();
    if (sub === "deploy" || sub === "resolve") operation = "schema";
    else if (sub === "status") operation = "read";
    else if (sub === "diff") operation = uses("--from-config-datasource") || uses("--to-config-datasource") ? "read" : "none";
    else operation = "destructive"; // dev, reset, unknown
  } else if (group === "db") {
    command = `db ${sub}`.trim();
    if (sub === "pull") operation = "read";
    else if (sub === "seed") operation = "write";
    else operation = "destructive"; // push, execute, unknown
  } else operation = "destructive"; // studio, mcp, anything unknown
  return { command: command || "(none)", operation: /** @type {any} */ (operation), override };
}
