/**
 * RT-27 production-media readiness gate.
 *
 * Reads hero-media-status.ts's HERO_MEDIA_STATUS and fails (exit 1) if any Hero scene
 * still references non-PRODUCTION_APPROVED / non-RIGHTS_VERIFIED media. Imports the
 * status-only module (not hero-media.ts) on purpose: hero-media.ts also statically
 * imports the .webp assets, which only resolve inside Next's webpack pipeline, not
 * under a plain tsx/Node run.
 *
 * This is intentionally NOT wired into `npm run build`, `preflight:staging`, or any
 * other normal development path — Owner direction (RT-24/RT-26) is explicit that final
 * media is a public-launch gate, not a development gate. This script exists for that
 * launch gate (RT-29), run on demand, never automatically.
 *
 *   npx tsx scripts/rt-27-media-readiness-check.ts
 */
import { HERO_MEDIA_STATUS } from "../app/[locale]/rebuild-lab/cinematic-3d-poc/hero-media-status";

const notReady = Object.entries(HERO_MEDIA_STATUS).filter(
  ([, status]) => status.productionStatus !== "PRODUCTION_APPROVED" || status.provenanceStatus !== "RIGHTS_VERIFIED",
);

if (notReady.length) {
  console.error("Hero media NOT ready for production launch:");
  for (const [mediaId, status] of notReady) {
    console.error(`  ${mediaId}: productionStatus=${status.productionStatus}, provenanceStatus=${status.provenanceStatus} (${status.sourceRef})`);
  }
  console.error(`\n${notReady.length}/${Object.keys(HERO_MEDIA_STATUS).length} scene(s) still reference prototype or unverified media.`);
  process.exitCode = 1;
} else {
  console.log(`All ${Object.keys(HERO_MEDIA_STATUS).length} Hero scenes are PRODUCTION_APPROVED / RIGHTS_VERIFIED.`);
}
