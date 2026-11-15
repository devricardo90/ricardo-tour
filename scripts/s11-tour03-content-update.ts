/**
 * A1b (Owner 15/11/2026) — TOUR-03 diff-only correction of the stored content (lib/catalog/content-diff-update.ts):
 * writes only what differs from the approved content in code, then re-approves, in ONE transaction.
 * TOUR-03 ONLY (any other --trip is refused) and only inside the authorized scope (TOUR03_SCOPE below): any other
 * difference refuses the whole run.
 * Default is a DRY RUN (reads only: shows each difference, stored vs code, and the plan; no write).
 * Writing needs `--apply --allow-replace-approved --confirm-owner-approval`, plus the Owner's explicit confirmation of
 * the two commercial texts when they are part of the change: `--confirm-own-vehicle` (inclusions / operationalConditions)
 * and `--confirm-cancellation-72h` (FAQ 6 / weatherPolicy). Nothing is changed by assumption.
 * Target: a local throw-away database by default; the isolated preview database only as described in
 * lib/catalog/content-script-target.ts (declared twice, allowlisted, TOUR-03). Production is always refused.
 * Every preview run needs the Owner's written authorization. Never writes other tours or Trip.
 * Usage: DATABASE_URL=<local rt_s11_*> npx tsx scripts/s11-tour03-content-update.ts --trip=cmlibniq40000z4zqkbujnutt [--apply …]
 */
import { prisma } from "@/lib/prisma";
import { LAUNCH_LOAD_TRIP_IDS, launchLoadRecord } from "@/lib/catalog/content-load";
import { contentFingerprint, loadTourContentRecord } from "@/lib/catalog/tour-content";
import { resolveContentScriptTarget } from "@/lib/catalog/content-script-target";
import { applyContentDiffUpdate, launchTripFieldsHash, planContentDiffUpdate } from "@/lib/catalog/content-diff-update";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const TOUR03 = "cmlibniq40000z4zqkbujnutt";
/** Owner 15/11/2026: the differences found on the preview (A2) and authorized for correction; nothing else. */
const TOUR03_SCOPE = ["meetingPoint", "inclusions", "weatherPolicy", "operationalConditions", "faq[5]", "media["] as const;
/** Changes that carry a commercial text the Owner confirms explicitly at apply time. */
const CONFIRMATIONS = [
  { flag: "--confirm-own-vehicle", covers: ["inclusions", "operationalConditions"], what: "own vehicle driven by the guide (not a rented vehicle)" },
  { flag: "--confirm-cancellation-72h", covers: ["weatherPolicy", "faq[5] changed"], what: "72-hour cancellation policy and rain/closure rule" },
] as const;

const { target, trip } = resolveContentScriptTarget({ env: process.env, argv: process.argv, launchTripIds: LAUNCH_LOAD_TRIP_IDS, script: "scripts/s11-tour03-content-update.ts" });
if (trip !== TOUR03) throw new Error(`Refusing to run scripts/s11-tour03-content-update.ts: --trip=${TOUR03} (TOUR-03) is required and is the only tour this script updates`);
const apply = process.argv.includes("--apply");
if (apply && !(process.argv.includes("--allow-replace-approved") && process.argv.includes("--confirm-owner-approval"))) {
  throw new Error("--apply requires --allow-replace-approved and --confirm-owner-approval (the update re-approves TOUR-03 as an explicit Owner act)");
}
assertDatabaseAccess({ operation: apply ? "write" : "read", label: "scripts/s11-tour03-content-update.ts" }); // RT-104

const file = (src: string) => src.split("/").pop();

async function main() {
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", target, trip: TOUR03, scope: TOUR03_SCOPE }));
  const next = launchLoadRecord(TOUR03);
  const exists = Boolean(await prisma.trip.findUnique({ where: { id: TOUR03 }, select: { id: true } }));
  const current = await loadTourContentRecord(TOUR03);
  const plan = planContentDiffUpdate(current, next, { tripExists: exists, allowedChanges: TOUR03_SCOPE });
  const stored = await prisma.tripImage.findMany({ where: { tripId: TOUR03 }, orderBy: { position: "asc" }, select: { position: true, src: true, isCover: true, rightsStatus: true, publicationApprovedAt: true } });
  const textDiffs = Object.fromEntries(plan.contentFields.map((f) => [f, { stored: current?.[f as keyof typeof current] ?? null, code: next[f as keyof typeof next] ?? null }]));
  const faqDiffs = Object.fromEntries([...plan.faq.update, ...plan.faq.create, ...plan.faq.delete].map((i) => [`faq[${i}]`, { stored: current?.faq?.[i] ?? null, code: next.faq?.[i] ?? null }]));
  console.log(JSON.stringify({
    status: current?.status ?? null,
    approvedAt: current?.approvedAt ?? null,
    storedFingerprint: current?.approvedContentHash ?? null,
    mediaBefore: stored.map((m) => ({ position: m.position, file: file(m.src), cover: m.isCover, rights: m.rightsStatus, published: Boolean(m.publicationApprovedAt) })),
    mediaAfter: next.images.map((m) => ({ position: m.position, file: file(m.src), cover: m.isCover, rights: m.rightsStatus })),
    plan,
    textDiffs,
    faqDiffs,
    fingerprintAfter: contentFingerprint(next),
    launchTripFieldsHash: await launchTripFieldsHash(prisma),
  }, null, 2));
  if (plan.action !== "update") {
    console.log(plan.action === "noop" ? "nothing to change" : "refused: nothing applied");
    if (plan.action === "refused") process.exitCode = 2;
    return;
  }
  const needed = CONFIRMATIONS.filter((c) => plan.changes.some((change) => c.covers.some((k) => change === k)));
  for (const c of needed) console.log(`Owner confirmation required at apply: ${c.flag} (${c.what})`);
  if (!apply) {
    console.log("dry-run: nothing written");
    return;
  }
  const missing = needed.filter((c) => !process.argv.includes(c.flag));
  if (missing.length) throw new Error(`Refusing to apply: the Owner has not confirmed ${missing.map((c) => `${c.flag} (${c.what})`).join("; ")}`);
  const result = await applyContentDiffUpdate(prisma, next, plan, { allowedChanges: TOUR03_SCOPE });
  console.log(`applied ${TOUR03}: ${JSON.stringify(result)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
