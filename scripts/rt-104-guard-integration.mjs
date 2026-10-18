#!/usr/bin/env node
/**
 * RT-104 — integration checks of the database guard through the REAL execution paths (npx prisma …, tsx/node scripts).
 * Uses only: two throw-away LOCAL databases (rt104_*) created through scripts/rt-113b-local-db.mjs (Docker container
 * ricktravel-db), and FICTITIOUS hosted URLs on the reserved ".invalid" TLD (they can never resolve). It never connects
 * to a hosted database. The databases are dropped at the end.
 * Usage: RT113B_ADMIN_FILE=<temp json with the local admin URL> node scripts/rt-104-guard-integration.mjs
 */
import { spawnSync } from "node:child_process";

const isWin = process.platform === "win32";
const HELPER = "scripts/rt-113b-local-db.mjs";
const MARKED = "rt104_marked";
const UNMARKED = "rt104_unmarked";
const HOSTED = "postgresql://u:p@ep-fictitious-000.eu-west-2.aws.neon.tech.invalid/neondb?sslmode=require";
const UNKNOWN = "postgresql://u:p@db.unknown-host.invalid:5432/app";

let passes = 0;
let failures = 0;
const check = (ok, label, detail = "") => {
  if (ok) passes += 1;
  else failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? ` — ${detail}` : ""}`);
};

// Base environment: no inherited connection variables (the guard must decide from what each case sets).
const baseEnv = () => {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^(DATABASE_URL|DIRECT_URL|SHADOW_DATABASE_URL|POSTGRES_|PG(HOST|HOSTADDR|SERVICE|SERVICEFILE)$|RT_DB_TARGET|RT_PROD_MIGRATION_ACK|VERCEL_ENV|NEON_DATABASE_URL|PRISMA_DATABASE_URL|DATABASE_URL_UNPOOLED)/.test(k)) delete env[k];
  return env;
};
const run = (cmd, args, extraEnv = {}) => {
  const started = Date.now();
  const viaNode = cmd === "node";
  const exe = viaNode ? process.execPath : isWin ? `${cmd}.cmd` : cmd;
  const r = spawnSync(exe, args, { env: { ...baseEnv(), ...extraEnv }, encoding: "utf8", shell: isWin && !viaNode, timeout: 180_000 });
  return { status: r.status, out: `${r.stdout ?? ""}${r.stderr ?? ""}`, ms: Date.now() - started };
};
const helper = (...args) => run("node", [HELPER, ...args]);
const prisma = (args, env) => run("npx", ["prisma", ...args], env);
const denied = (r) => r.status !== 0 && /\[db-guard\] DENIED/.test(r.out);

if (!process.env.RT113B_ADMIN_FILE) throw new Error("RT113B_ADMIN_FILE is required (local admin URL in a temp file)");

helper("drop", MARKED);
helper("drop", UNMARKED);
check(helper("create", MARKED).status === 0, `throw-away ${MARKED} created (helper marks it local-isolated inside the container)`);
check(helper("create", UNMARKED).status === 0 && run("node", ["scripts/db/mark-local-database.mjs", UNMARKED, "--unmark"]).status === 0, `throw-away ${UNMARKED} created and its marker removed (simulates a tunnelled/unknown server on localhost)`);
const markedUrl = helper("url", MARKED).out.trim();
const unmarkedUrl = helper("url", UNMARKED).out.trim();

try {
  // 1. Local, positively identified: allowed — including destructive commands.
  const dep = prisma(["migrate", "deploy"], { DATABASE_URL: markedUrl });
  check(dep.status === 0 && /successfully applied|No pending migrations/.test(dep.out), "1. marked local DB: prisma migrate deploy allowed", dep.out.slice(-300));
  check(prisma(["migrate", "status"], { DATABASE_URL: markedUrl }).status === 0, "1. marked local DB: prisma migrate status allowed");
  const diff = prisma(["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"], { DATABASE_URL: markedUrl });
  check(diff.status === 0, "1. marked local DB: migrate diff --from-config-datasource allowed (no drift)", diff.out.slice(-300));
  const seed = run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: markedUrl });
  check(seed.status === 0, "1. marked local DB: development seed allowed", seed.out.slice(-300));
  const reset = prisma(["migrate", "reset", "--force"], { DATABASE_URL: markedUrl });
  check(reset.status === 0 || !/\[db-guard\] DENIED/.test(reset.out), "1. marked local DB: destructive migrate reset not blocked by the guard", reset.out.slice(-300));

  // 1b. Loopback without the marker (tunnel case): refused, even on port 5433.
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: unmarkedUrl })), "1b. loopback DB WITHOUT marker: prisma migrate status DENIED (localhost/5433 is not proof)");
  check(denied(run("npx", ["tsx", "scripts/list-trips.ts"], { DATABASE_URL: unmarkedUrl })), "1b. loopback DB WITHOUT marker: repository script DENIED");
  check(denied(run("npx", ["tsx", "prisma/seed.ts"], { DATABASE_URL: unmarkedUrl })), "1b. loopback DB WITHOUT marker: seed DENIED");
  // Independent review (18/10): the marker cannot be injected from the client, and the check cannot be pointed elsewhere.
  const sep = unmarkedUrl.includes("?") ? "&" : "?";
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: `${unmarkedUrl}${sep}options=-c%20rt.environment%3Dlocal-isolated` })), "1c. marker injected via ?options=-c rt.environment=… : DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: unmarkedUrl, PGOPTIONS: "-c rt.environment=local-isolated" })), "1c. marker injected via PGOPTIONS: DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: `${markedUrl}${sep}port=6000` })), "1c. ?port= override (check and connection on different ports): DENIED");
  check(denied(run("npx", ["tsx", "scripts/list-trips.ts"], { DATABASE_URL: markedUrl, PGPORT: "6000" })), "1c. PGPORT set: DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: markedUrl.replace("127.0.0.1", "localhost") })), '1c. "localhost" instead of a literal loopback address: DENIED');

  // 2–3. Hosted / unknown: refused before any connection (fast, no DNS needed).
  for (const args of [["migrate", "deploy"], ["migrate", "status"], ["db", "pull", "--print"], ["db", "seed"]]) {
    const r = prisma(args, { DATABASE_URL: HOSTED });
    check(denied(r) && /hosted provider/.test(r.out), `2. hosted URL: prisma ${args.join(" ")} DENIED`, r.out.slice(-200));
  }
  const prodAck = prisma(["migrate", "deploy"], { DATABASE_URL: HOSTED, RT_DB_TARGET: "production", RT_PROD_MIGRATION_ACK: "RT-104" });
  check(denied(prodAck) && /not in the committed allowlist/.test(prodAck.out), "2. hosted URL even with RT_DB_TARGET=production + ack: DENIED (allowlist empty)");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: UNKNOWN })), "3. unknown destination: DENIED");
  for (const [script, runner] of [["scripts/test-db.ts", "tsx"], ["scripts/list-trips.ts", "tsx"], ["scripts/cleanup-trips.ts", "tsx"], ["scripts/import-real-trips.mjs", "node"], ["scripts/rt-119-load-content.ts", "tsx"]]) {
    const r = runner === "node" ? run("node", [script], { DATABASE_URL: HOSTED }) : run("npx", ["tsx", script], { DATABASE_URL: HOSTED });
    check(r.status !== 0 && /DENIED|Refusing/.test(r.out), `2. hosted URL: ${script} refused before connecting`, r.out.slice(-200));
  }

  // 4. Missing connection variable.
  check(denied(prisma(["migrate", "deploy"], {})), "4. no DATABASE_URL: prisma migrate deploy DENIED");
  check(denied(run("npx", ["tsx", "scripts/list-trips.ts"], {})), "4. no DATABASE_URL: script DENIED");

  // 5. Conflicting configuration.
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: markedUrl, DIRECT_URL: HOSTED })), "5. DATABASE_URL local but DIRECT_URL hosted: DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: markedUrl, RT_DB_TARGET: "production" })), "5. RT_DB_TARGET=production with a local URL: DENIED");

  // 6. Override attempts.
  check(denied(prisma(["db", "execute", "--url", HOSTED, "--stdin"], { DATABASE_URL: markedUrl })), "6. prisma db execute --url <hosted>: DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: `${markedUrl}${markedUrl.includes("?") ? "&" : "?"}host=db.unknown-host.invalid` })), "6. ?host= override in the URL: DENIED");
  check(denied(prisma(["migrate", "status"], { DATABASE_URL: markedUrl, PGHOST: "db.unknown-host.invalid" })), "6. PGHOST set: DENIED");

  // 7. Destructive on hosted (even if it were allowlisted the guard refuses; here also not allowlisted).
  for (const args of [["db", "push"], ["migrate", "reset", "--force"], ["db", "execute", "--stdin"]]) {
    check(denied(prisma(args, { DATABASE_URL: HOSTED, RT_DB_TARGET: "preview" })), `7. destructive prisma ${args.join(" ")} on a non-local target: DENIED`);
  }

  // 9. Commands without a connection are not blocked.
  check(prisma(["validate"], {}).status === 0, "9. prisma validate without DATABASE_URL: allowed");
  check(prisma(["validate"], { DATABASE_URL: HOSTED }).status === 0, "9. prisma validate with a hosted URL: allowed (no connection)");
  check(prisma(["format", "--check"], {}).status === 0 || !/\[db-guard\]/.test(prisma(["format", "--check"], {}).out), "9. prisma format: not blocked by the guard");

  // 10. Validation failure stops execution: marker check cannot connect (closed loopback port) → refused.
  check(denied(prisma(["migrate", "deploy"], { DATABASE_URL: "postgresql://u:p@127.0.0.1:1/rt104_closed" })), "10. local URL that cannot be verified (closed port): DENIED, nothing executed");
} finally {
  helper("drop", MARKED);
  helper("drop", UNMARKED);
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
