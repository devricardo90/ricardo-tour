/**
 * RT-27 Hero media contract.
 *
 * SOURCE MASTER -> RT-26 DERIVATIVES -> HERO SCENE -> HERO LAYERS.
 *
 * This file is the runtime side of that chain. `scripts/media-pipeline/manifest.json`
 * (RT-26) is a build-time tool config — it uses Node file-system paths and sharp-specific
 * fields, and has no business in a client bundle. Rather than importing it directly (a
 * poor fit for "use client" code), the provenance/production status itself lives in the
 * sibling `hero-media-status.ts` (zero imports, Node/tsx-safe) and is re-exported here;
 * each scene's `mediaId` is the shared key with the RT-26 manifest's own asset id.
 * See docs/architecture/rt-27-hero-media-architecture.md.
 *
 * This file itself is NOT Node/tsx-safe — it statically imports the .webp assets, which
 * only resolve inside Next's webpack pipeline. scripts/rt-27-media-readiness-check.ts
 * imports `hero-media-status.ts` directly instead, for exactly this reason.
 *
 * IMPORTANT — no fabricated layers: every scene below has exactly one real image layer
 * ("base"), because that is the only real image that exists per scene today. The "rio"
 * scene additionally has a code-only "bridge" layer (a CSS gradient, no image) for the
 * Brazil->Rio handoff (RT-23 SS8). Nothing here claims foreground/atmosphere photo
 * layers that were never extracted from source imagery — RT-24/RT-25 supply those
 * later, as additional `layers` entries, without any change to this file's shape.
 */
import rioArrival from "./assets/rio-aerial-arrival.webp";
import rioFlight from "./assets/rio-helicopter-cockpit.webp";
import rioFinale from "./assets/rio-christ-finale.webp";
import { HERO_MEDIA_STATUS, type MediaStatus } from "./hero-media-status";

export type { ProductionStatus, ProvenanceStatus, MediaStatus } from "./hero-media-status";
export { HERO_MEDIA_STATUS } from "./hero-media-status";

/** Loading-priority category. RT-27 only labels layers; RT-28 decides what to do with
 *  the label (preload/lazy-load/defer). No loading behavior changes here. */
export type LoadPriority = "immediate" | "near" | "later";

export type LayerKeyframe = {
  /** Absolute position on the shared RT-17 timeline (0-1), identical in meaning to
   *  every other `.to(..., position)` call already in that timeline. */
  at: number;
  vars: Record<string, number | string>;
};

export type HeroLayer = {
  id: string;
  type: "base" | "bridge" | "atmosphere" | "foreground";
  /** Static image src, or omitted for a code/CSS-only layer (e.g. the bridge). */
  src?: string;
  focal: { x: number; y: number };
  initial: Record<string, number>;
  keyframes: LayerKeyframe[];
  loadPriority: LoadPriority;
};

export type HeroScene = {
  /** Matches the existing `data-scene` DOM contract (`rio` | `flight` | `finale`).
   *  Left as-is: renamed identifiers would also require updating the mobile CSS
   *  `[data-scene=...]` selectors for no architectural benefit. */
  id: "rio" | "flight" | "finale";
  /** RT-26 manifest asset id (scripts/media-pipeline/manifest.json) — the shared key
   *  between this scene and its build-time derivative pipeline entry. */
  mediaId: "rio-04" | "helicopter-05" | "christ-06";
  stage: number;
  mediaStatus: MediaStatus;
  layers: HeroLayer[];
};

/**
 * Builds the three photo-scene definitions the RT-17 timeline consumes. `mobile` is the
 * same boolean the caller already resolves from gsap.matchMedia; every value below is
 * copied byte-for-byte from the timeline this replaces, so behavior does not change —
 * only where the numbers live does.
 */
export function buildHeroScenes(mobile: boolean): HeroScene[] {
  return [
    {
      id: "rio", mediaId: "rio-04", stage: 3,
      mediaStatus: HERO_MEDIA_STATUS["rio-04"],
      layers: [
        {
          id: "base", type: "base", src: rioArrival.src, focal: { x: 0.62, y: 0.4 }, loadPriority: "near",
          initial: { scale: 1.12, xPercent: 0, yPercent: 0, opacity: 0 },
          keyframes: [
            { at: 0.44, vars: { opacity: 1, duration: 0.1 } },
            { at: 0.44, vars: { scale: mobile ? 1.03 : 1.01, xPercent: mobile ? 0 : 1.5, yPercent: -1.2, duration: 0.2, ease: "sine.inOut" } },
            { at: 0.58, vars: { opacity: 0, duration: 0.08 } },
          ],
        },
        // Brazil -> Rio handoff (RT-23 SS8): a brief, code-only golden pulse that
        // overlaps the WebGL fade-out and the Rio fade-in, so the cut reads as one
        // continuous atmosphere rather than "3D ended, a photo appeared". No new
        // imagery; reuses the same gold already established by the globe's Fresnel rim.
        {
          id: "bridge", type: "bridge", focal: { x: 0.5, y: 0.5 }, loadPriority: "immediate",
          initial: { opacity: 0 },
          keyframes: [
            { at: 0.4, vars: { opacity: 0.5, duration: 0.04, ease: "sine.in" } },
            { at: 0.44, vars: { opacity: 0, duration: 0.09, ease: "sine.out" } },
          ],
        },
      ],
    },
    {
      id: "flight", mediaId: "helicopter-05", stage: 4,
      mediaStatus: HERO_MEDIA_STATUS["helicopter-05"],
      layers: [
        {
          id: "base", type: "base", src: rioFlight.src, focal: { x: 0.5, y: 0.38 }, loadPriority: "later",
          initial: { scale: 1.12, xPercent: 0, yPercent: 0, opacity: 0 },
          keyframes: [
            { at: 0.58, vars: { opacity: 1, duration: 0.09 } },
            { at: 0.58, vars: { scale: mobile ? 1.08 : 1.04, xPercent: mobile ? 0 : -1.2, yPercent: -1.8, duration: 0.2, ease: "sine.inOut" } },
            { at: 0.75, vars: { opacity: 0, duration: 0.1 } },
          ],
        },
      ],
    },
    {
      id: "finale", mediaId: "christ-06", stage: 5,
      mediaStatus: HERO_MEDIA_STATUS["christ-06"],
      layers: [
        {
          id: "base", type: "base", src: rioFinale.src, focal: { x: 0.68, y: 0.55 }, loadPriority: "later",
          initial: { scale: 1.1, xPercent: 0, yPercent: 0, opacity: 0 },
          keyframes: [
            { at: 0.75, vars: { opacity: 1, duration: 0.12 } },
            { at: 0.75, vars: { scale: mobile ? 1.05 : 1.02, xPercent: mobile ? -1 : 0.8, yPercent: -0.8, duration: 0.2, ease: "sine.inOut" } },
            { at: 0.88, vars: { scale: 1.08, yPercent: -1.4, duration: 0.12, ease: "sine.inOut" } },
          ],
        },
      ],
    },
  ];
}
