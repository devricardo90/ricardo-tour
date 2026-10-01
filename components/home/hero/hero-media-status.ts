/**
 * RT-27 Hero media provenance/production status — split out from hero-media.ts so this
 * data is importable from a plain Node/tsx script (scripts/rt-27-media-readiness-check.ts)
 * without pulling in the .webp static imports, which only resolve inside Next's webpack
 * asset pipeline. This file has zero imports on purpose.
 */
export type ProductionStatus = "PROTOTYPE_ONLY" | "CANDIDATE" | "PRODUCTION_APPROVED";
export type ProvenanceStatus = "RIGHTS_NOT_VERIFIED" | "RIGHTS_VERIFIED";

export type MediaStatus = {
  productionStatus: ProductionStatus;
  provenanceStatus: ProvenanceStatus;
  replaceBeforeProduction: boolean;
  sourceRef: string;
};

/** Keyed by the RT-26 manifest asset id (scripts/media-pipeline/manifest.json) — the
 *  shared identity between a Hero scene and its build-time derivative pipeline entry. */
export const HERO_MEDIA_STATUS: Record<"rio-04" | "helicopter-05" | "christ-06", MediaStatus> = {
  "rio-04": {
    productionStatus: "PROTOTYPE_ONLY",
    provenanceStatus: "RIGHTS_NOT_VERIFIED",
    replaceBeforeProduction: true,
    sourceRef: "RT-17 prototype layer; RT-24 candidate audit: PENDING VERIFICATION, not promoted",
  },
  "helicopter-05": {
    productionStatus: "PROTOTYPE_ONLY",
    provenanceStatus: "RIGHTS_NOT_VERIFIED",
    replaceBeforeProduction: true,
    sourceRef: "RT-17 prototype layer; RT-24 candidate audit: PENDING VERIFICATION, not promoted",
  },
  "christ-06": {
    productionStatus: "PROTOTYPE_ONLY",
    provenanceStatus: "RIGHTS_NOT_VERIFIED",
    replaceBeforeProduction: true,
    sourceRef: "RT-17 prototype layer; RT-24 audit flags this as the highest provenance risk, not promoted",
  },
};
