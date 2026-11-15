/**
 * Target check of the launch-content scripts (scripts/rt-119-load-content.ts, scripts/s11-approve-launch-content.ts).
 * Pure: no connection, never returns or prints credentials.
 *
 * Default (no RT_DB_TARGET, or RT_DB_TARGET=local): only a local throw-away database 127.0.0.1|localhost:5433/rt119_* or
 * rt_s11_* — the same rule the scripts always had.
 * Preview (Owner 15/11/2026, A1): allowed ONLY when it is declared twice (RT_DB_TARGET=preview AND --target=preview), the
 * host is in the committed RT-104 preview allowlist (lib/db/target-guard.mjs, Neon "ricardotour-preview-pg17") and the run
 * is limited to ONE launch tour (--trip=<id>). Declaring it does not authorize anything: every run against the preview
 * still needs the Owner's written authorization (dry run first; --apply only after the Owner reviewed the dry run).
 * The preview exception covers ONLY the tours in PREVIEW_UPDATE_TRIP_IDS (today TOUR-03, Owner 15/11/2026): any other tour,
 * TOUR-01 and TOUR-02 included, is refused on the preview. Widening it is a reviewed code change with the Owner's approval.
 * Production is ALWAYS refused here, whatever the environment says.
 * The RT-104 runtime guard (assertDatabaseAccess) still runs after this check in both scripts.
 */
import { HOSTED_TARGETS } from "@/lib/db/target-guard.mjs";

/** Tours the preview exception may touch (Owner 15/11/2026: TOUR-03 gallery/cover update only). */
export const PREVIEW_UPDATE_TRIP_IDS: readonly string[] = Object.freeze(["cmlibniq40000z4zqkbujnutt"]);

export type ContentScriptTarget = { target: "local" | "preview"; trip: string | undefined };

export function resolveContentScriptTarget(input: {
  env: Record<string, string | undefined>;
  argv: readonly string[];
  launchTripIds: readonly string[];
  script: string;
  previewHosts?: readonly string[];
  previewTripIds?: readonly string[];
}): ContentScriptTarget {
  const { env, argv, launchTripIds, script, previewHosts = HOSTED_TARGETS.preview, previewTripIds = PREVIEW_UPDATE_TRIP_IDS } = input;
  const refuse = (why: string): never => {
    throw new Error(`Refusing to run ${script}: ${why}`);
  };
  const trip = argv.find((a) => a.startsWith("--trip="))?.slice("--trip=".length);
  if (trip !== undefined && !launchTripIds.includes(trip)) refuse(`--trip=${trip} is not a launch tour`);

  const declared = env.RT_DB_TARGET?.trim() ?? "";
  const flag = argv.find((a) => a.startsWith("--target="))?.slice("--target=".length) ?? "";
  if (declared === "production" || flag === "production") refuse("production is never a target of this script");
  if (declared && !["local", "preview"].includes(declared)) refuse(`RT_DB_TARGET="${declared}" is not local | preview`);
  if (flag && !["local", "preview"].includes(flag)) refuse(`--target=${flag} is not local | preview`);

  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? "");
  } catch {
    return refuse("DATABASE_URL is missing or cannot be parsed");
  }

  const wantsPreview = declared === "preview" || flag === "preview";
  if (!wantsPreview) {
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !/^\/(rt119_|rt_s11_)/.test(url.pathname) || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
      refuse("only a local throw-away database localhost:5433/rt119_* or rt_s11_* is allowed by default (hosted databases need the preview declaration)");
    }
    return { target: "local", trip };
  }

  if (declared !== "preview" || flag !== "preview") refuse("the preview must be declared twice: RT_DB_TARGET=preview and --target=preview");
  if (env.RT_PROD_MIGRATION_ACK?.trim()) refuse("RT_PROD_MIGRATION_ACK must not be set for a preview run");
  if (!previewHosts.map((h) => h.toLowerCase()).includes(url.hostname.toLowerCase())) refuse(`host ${url.hostname} is not the allowlisted preview database`);
  if (url.searchParams.has("host") || url.searchParams.has("hostaddr")) refuse("the connection string must not redirect the host");
  if (!trip) return refuse("a preview run is limited to one tour: pass --trip=<launch tour id>");
  if (!previewTripIds.includes(trip)) refuse(`--trip=${trip} is not covered by the preview exception (only ${previewTripIds.join(", ")})`);
  return { target: "preview", trip };
}
