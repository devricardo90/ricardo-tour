#!/usr/bin/env node
/**
 * RT-26 Hero media derivative pipeline.
 *
 * SOURCE MASTER -> PRODUCTION DERIVATIVES (desktop, mobile, optional preview/layers).
 *
 * Tooling decision (RT-26): sharp, not FFmpeg. The Hero has no pre-rendered video
 * baseline (0-44% WebGL, 44-100% layered stills/2.5D), sharp is already a project
 * dependency (see scripts/optimize-images.js), and it is deployment-portable in a way a
 * system FFmpeg binary is not. See docs/architecture/rt-26-media-pipeline.md.
 *
 * Placeholder contract: a derivative NEVER receives a higher production/provenance
 * status than its master. A PROTOTYPE_ONLY / RIGHTS_NOT_VERIFIED master only ever
 * produces PROTOTYPE_ONLY / RIGHTS_NOT_VERIFIED derivatives, reported as such in the
 * output manifest report. Promoting an asset to production-approved is a manifest edit
 * (changing the master's own status), never something the pipeline infers from pixels.
 *
 * Determinism: same master + same manifest settings always produce byte-identical
 * output (no timestamps, no random ids in the encoded bytes). Re-running after editing
 * `master.path` to point at a verified final file is the entire "replace before
 * production" workflow described in RT-26 — no change to this script is required.
 *
 *   node scripts/media-pipeline/run.mjs [--manifest <path>] [--out <dir>]
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const manifestPath = path.resolve(repoRoot, flag("manifest", "scripts/media-pipeline/manifest.json"));
const outDir = path.resolve(repoRoot, flag("out", ".tmp/rt-26-media-pipeline"));

// Pipeline-wide defaults. Any asset can override desktop/mobile sizing in the manifest;
// these exist so the manifest itself stays lean (RT-26: "do not over-engineer").
const DEFAULTS = {
  desktop: { maxWidth: 1920, quality: 82 },
  mobile: { targetWidth: 720, aspect: [4, 5], quality: 78 },
  preview: { targetWidth: 24, quality: 40 },
};

const PRODUCTION_STATUSES = ["PROTOTYPE_ONLY", "CANDIDATE", "PRODUCTION_APPROVED"];
const PROVENANCE_STATUSES = ["RIGHTS_NOT_VERIFIED", "RIGHTS_VERIFIED"];

function assertKnownStatus(list, value, label) {
  if (!list.includes(value)) {
    throw new Error(`invalid ${label} "${value}" — expected one of ${list.join(", ")}`);
  }
}

/**
 * Computes a cover-style crop rectangle (in source pixels) for `targetAspect`
 * (width/height) that keeps `focal` (normalized 0-1 point) as close to centred as the
 * source bounds allow. This is the "focal point, not automatic center-crop" behaviour
 * RT-26 asked for: two assets with the same aspect ratio can crop completely
 * differently because their focal points differ.
 */
function focalCrop(meta, targetAspectRatio, focal) {
  const sourceAspect = meta.width / meta.height;
  let cropWidth;
  let cropHeight;
  if (sourceAspect > targetAspectRatio) {
    cropHeight = meta.height;
    cropWidth = Math.round(cropHeight * targetAspectRatio);
  } else {
    cropWidth = meta.width;
    cropHeight = Math.round(cropWidth / targetAspectRatio);
  }
  const focalX = focal.x * meta.width;
  const focalY = focal.y * meta.height;
  const left = Math.max(0, Math.min(meta.width - cropWidth, Math.round(focalX - cropWidth / 2)));
  const top = Math.max(0, Math.min(meta.height - cropHeight, Math.round(focalY - cropHeight / 2)));
  return { left, top, width: cropWidth, height: cropHeight };
}

async function encode(pipeline, hasAlpha, quality) {
  // WebP is the format already used for every Hero layer in this repo; PNG is reserved
  // for the rare case a layer genuinely needs an alpha cutout (RT-26: "PNG where
  // transparency is genuinely required" — not introduced merely because it exists).
  return hasAlpha
    ? pipeline.png({ quality, compressionLevel: 9 })
    : pipeline.webp({ quality });
}

async function buildDerivative({ sourcePath, meta, crop, targetWidth, quality, outPath }) {
  let pipeline = sharp(sourcePath);
  let effectiveWidth = targetWidth;
  if (crop) {
    pipeline = pipeline.extract(crop);
    // Never upscale: cap the resize target at the crop's own native width.
    effectiveWidth = Math.min(targetWidth, crop.width);
  } else {
    effectiveWidth = Math.min(targetWidth, meta.width);
  }
  pipeline = pipeline.resize({ width: effectiveWidth, withoutEnlargement: true });
  pipeline = await encode(pipeline, meta.hasAlpha, quality);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const info = await pipeline.toFile(outPath);
  const bytes = fs.statSync(outPath).size;
  return { path: path.relative(repoRoot, outPath), width: info.width, height: info.height, bytes, format: info.format };
}

async function processAsset(asset) {
  const sourcePath = path.resolve(repoRoot, asset.master.path);
  assertKnownStatus(PRODUCTION_STATUSES, asset.master.productionStatus, "productionStatus");
  assertKnownStatus(PROVENANCE_STATUSES, asset.master.provenanceStatus, "provenanceStatus");

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`master not found: ${asset.master.path}`);
  }
  let meta;
  try {
    meta = await sharp(sourcePath).metadata();
    if (!meta.width || !meta.height) throw new Error("no usable dimensions");
  } catch (error) {
    throw new Error(`master is not a valid image: ${asset.master.path} (${error.message})`);
  }

  const desktopCfg = { ...DEFAULTS.desktop, ...(asset.desktop || {}) };
  const mobileCfg = { ...DEFAULTS.mobile, ...(asset.mobile || {}) };
  const previewCfg = { ...DEFAULTS.preview, ...(asset.preview || {}) };
  const focal = asset.focal || { x: 0.5, y: 0.5 };
  const mobileAspect = mobileCfg.aspect[0] / mobileCfg.aspect[1];

  const assetOutDir = path.join(outDir, asset.id);

  const desktop = await buildDerivative({
    sourcePath, meta, crop: null,
    targetWidth: desktopCfg.maxWidth, quality: desktopCfg.quality,
    outPath: path.join(assetOutDir, `desktop.${meta.hasAlpha ? "png" : "webp"}`),
  });

  const mobileCrop = focalCrop(meta, mobileAspect, focal);
  const mobile = await buildDerivative({
    sourcePath, meta, crop: mobileCrop,
    targetWidth: mobileCfg.targetWidth, quality: mobileCfg.quality,
    outPath: path.join(assetOutDir, `mobile.${meta.hasAlpha ? "png" : "webp"}`),
  });

  // Optional low-quality placeholder for progressive loading (RT-26: "poster" renamed to
  // "preview" — it is not a video frame). Not required for pipeline completion; RT-28
  // decides whether/how to actually consume it.
  let preview = null;
  if (asset.preview !== false) {
    preview = await buildDerivative({
      sourcePath, meta, crop: null,
      targetWidth: previewCfg.targetWidth, quality: previewCfg.quality,
      outPath: path.join(assetOutDir, `preview.${meta.hasAlpha ? "png" : "webp"}`),
    });
  }

  const layers = [];
  for (const layer of asset.layers || []) {
    const layerSourcePath = path.resolve(repoRoot, layer.path);
    if (!fs.existsSync(layerSourcePath)) throw new Error(`layer source not found: ${layer.path} (asset ${asset.id})`);
    const layerMeta = await sharp(layerSourcePath).metadata();
    const derivative = await buildDerivative({
      sourcePath: layerSourcePath, meta: layerMeta, crop: null,
      targetWidth: layer.targetWidth || desktopCfg.maxWidth, quality: layer.quality || desktopCfg.quality,
      outPath: path.join(assetOutDir, `layer-${layer.id}.${layerMeta.hasAlpha ? "png" : "webp"}`),
    });
    layers.push({ id: layer.id, ...derivative, hasAlpha: layerMeta.hasAlpha });
  }

  // Provenance inheritance: every derivative entry in the report carries the master's
  // own status, verbatim. The pipeline has no code path that upgrades this.
  return {
    id: asset.id,
    scene: asset.scene,
    master: { path: asset.master.path, ...meta && { sourceWidth: meta.width, sourceHeight: meta.height } },
    provenanceStatus: asset.master.provenanceStatus,
    productionStatus: asset.master.productionStatus,
    replaceBeforeProduction: asset.master.replaceBeforeProduction !== false,
    focal,
    derivatives: { desktop, mobile: { ...mobile, crop: mobileCrop }, preview, layers },
  };
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error(`manifest not found: ${manifestPath}`);
    process.exitCode = 1;
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.mkdirSync(outDir, { recursive: true });

  const results = [];
  const failures = [];
  for (const asset of manifest.assets) {
    try {
      results.push(await processAsset(asset));
      console.log(`ok    ${asset.id} (${asset.scene})`);
    } catch (error) {
      failures.push({ id: asset.id, error: error.message });
      console.error(`FAIL  ${asset.id}: ${error.message}`);
    }
  }

  const report = { generatedAt: new Date().toISOString(), manifest: path.relative(repoRoot, manifestPath), outDir: path.relative(repoRoot, outDir), assets: results, failures };
  const reportPath = path.join(outDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${path.relative(repoRoot, reportPath)}`);

  if (failures.length) {
    console.error(`\n${failures.length} asset(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`\nOK — ${results.length} asset(s) processed.`);
  }
}

main();
