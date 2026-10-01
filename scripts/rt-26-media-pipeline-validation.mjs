/**
 * RT-26 validation — Hero media derivative pipeline (scripts/media-pipeline/run.mjs).
 *
 * Proves the pipeline itself, run against the three temporary WebPs as representative
 * test masters only. Never touches the Hero implementation and never promotes a
 * temporary asset — it only exercises scripts/media-pipeline/*.
 *
 *   node scripts/rt-26-media-pipeline-validation.mjs
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const repoRoot = path.resolve(import.meta.dirname, "..");
const outDir = path.join(repoRoot, ".tmp", "rt-26-media-pipeline");
const runScript = path.join(repoRoot, "scripts", "media-pipeline", "run.mjs");

const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const hash = buf => crypto.createHash("sha256").update(buf).digest("hex");
const sourceHashes = {};

function hashSourceAssets() {
  const dir = path.join(repoRoot, "components", "home", "hero", "assets");
  for (const file of fs.readdirSync(dir)) {
    // RT-28 added a `derivatives/` subdirectory alongside the source masters; this
    // fingerprint only covers the flat master files themselves.
    if (fs.statSync(path.join(dir, file)).isDirectory()) continue;
    sourceHashes[file] = hash(fs.readFileSync(path.join(dir, file)));
  }
  // Also fingerprint the Hero implementation itself, to prove RT-26 never touched it.
  const heroDir = path.join(repoRoot, "components", "home", "hero");
  for (const file of ["globe-journey.tsx", "globe-journey.module.css", "globe-3d.ts", "world-atlas.ts"]) {
    sourceHashes[`hero:${file}`] = hash(fs.readFileSync(path.join(heroDir, file)));
  }
}

function run(extraArgs = []) {
  return execFileSync("node", [runScript, ...extraArgs], { cwd: repoRoot, encoding: "utf8" });
}

try {
  hashSourceAssets();

  // ---- Run 1 ----
  fs.rmSync(outDir, { recursive: true, force: true });
  const out1 = run();
  check(out1.includes("OK — 3 asset(s) processed"), `run 1 did not report 3 successes:\n${out1}`);
  const report1 = JSON.parse(fs.readFileSync(path.join(outDir, "report.json"), "utf8"));
  check(report1.assets.length === 3 && report1.failures.length === 0, "run 1 report shape unexpected");

  for (const asset of report1.assets) {
    check(Boolean(asset.derivatives.desktop?.width && asset.derivatives.desktop?.height), `${asset.id}: missing desktop derivative dimensions`);
    check(Boolean(asset.derivatives.mobile?.width && asset.derivatives.mobile?.height), `${asset.id}: missing mobile derivative dimensions`);
    check(Boolean(asset.derivatives.desktop?.bytes) && Boolean(asset.derivatives.mobile?.bytes), `${asset.id}: missing byte-size report`);
    check(asset.derivatives.desktop.width <= asset.master.sourceWidth, `${asset.id}: desktop derivative upscaled (${asset.derivatives.desktop.width} > ${asset.master.sourceWidth})`);
    check(asset.derivatives.mobile.width <= asset.derivatives.mobile.crop.width, `${asset.id}: mobile derivative upscaled beyond its own crop`);
    // Mobile aspect must not be a plain centered crop for every asset with a different
    // focal point — the crop's `left` must track the focal x, not sit at the same
    // fraction of the source width for every asset.
    check(typeof asset.derivatives.mobile.crop.left === "number", `${asset.id}: mobile crop rectangle missing`);
    // Provenance inheritance: report status must equal the manifest master's status verbatim.
    check(asset.provenanceStatus === "RIGHTS_NOT_VERIFIED" && asset.productionStatus === "PROTOTYPE_ONLY",
      `${asset.id}: provenance/production status not inherited from master (${asset.provenanceStatus}/${asset.productionStatus})`);
    check(asset.replaceBeforeProduction === true, `${asset.id}: replaceBeforeProduction flag lost`);
  }

  // Focal points must actually differ in resulting crop position (proves "not a generic
  // center-crop strategy" — three different focal x values should not collapse to the
  // same crop.left after clamping, given these three assets share source dimensions).
  const lefts = report1.assets.map(a => a.derivatives.mobile.crop.left);
  check(new Set(lefts).size === lefts.length, `mobile crops collapsed to the same position despite different focal points: ${JSON.stringify(lefts)}`);

  // ---- Repeat-run stability: byte-identical outputs, not just matching dimensions ----
  const firstRunHashes = {};
  for (const asset of report1.assets) {
    for (const key of ["desktop", "mobile", "preview"]) {
      const derivative = asset.derivatives[key];
      if (!derivative) continue;
      firstRunHashes[`${asset.id}:${key}`] = hash(fs.readFileSync(path.join(repoRoot, derivative.path)));
    }
  }
  const out2 = run();
  check(out2.includes("OK — 3 asset(s) processed"), "run 2 (repeat) did not report 3 successes");
  const report2 = JSON.parse(fs.readFileSync(path.join(outDir, "report.json"), "utf8"));
  for (const asset of report2.assets) {
    for (const key of ["desktop", "mobile", "preview"]) {
      const derivative = asset.derivatives[key];
      if (!derivative) continue;
      const rehash = hash(fs.readFileSync(path.join(repoRoot, derivative.path)));
      check(rehash === firstRunHashes[`${asset.id}:${key}`], `${asset.id}:${key} was not byte-identical across repeat runs (non-deterministic)`);
    }
  }

  // ---- Missing/invalid source rejection ----
  const badManifestPath = path.join(repoRoot, ".tmp", "rt-26-bad-manifest.json");
  fs.writeFileSync(badManifestPath, JSON.stringify({
    version: 1,
    assets: [{
      id: "missing-test", scene: "TEST",
      master: { path: "components/home/hero/assets/does-not-exist.webp", provenanceStatus: "RIGHTS_NOT_VERIFIED", productionStatus: "PROTOTYPE_ONLY" },
    }],
  }));
  let badExitCode = 0;
  try {
    execFileSync("node", [runScript, "--manifest", badManifestPath, "--out", path.join(repoRoot, ".tmp", "rt-26-bad-out")], { cwd: repoRoot, encoding: "utf8" });
  } catch (error) {
    badExitCode = error.status;
  }
  check(badExitCode === 1, `missing-source manifest did not exit non-zero (got ${badExitCode})`);
  fs.rmSync(badManifestPath, { force: true });
  fs.rmSync(path.join(repoRoot, ".tmp", "rt-26-bad-out"), { recursive: true, force: true });

  // ---- Alpha preservation: synthetic fixture only, never a fabricated Hero asset ----
  const alphaFixtureDir = path.join(repoRoot, ".tmp", "rt-26-alpha-fixture");
  fs.mkdirSync(alphaFixtureDir, { recursive: true });
  const alphaSourcePath = path.join(alphaFixtureDir, "synthetic-alpha-source.png");
  await sharp({ create: { width: 400, height: 300, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0 } } })
    .composite([{ input: await sharp({ create: { width: 200, height: 150, channels: 4, background: { r: 220, g: 180, b: 90, alpha: 0.6 } } }).png().toBuffer(), left: 100, top: 75 }])
    .png()
    .toFile(alphaSourcePath);
  const alphaManifestPath = path.join(alphaFixtureDir, "manifest.json");
  fs.writeFileSync(alphaManifestPath, JSON.stringify({
    version: 1,
    assets: [{
      id: "alpha-fixture", scene: "PIPELINE-SELF-TEST",
      master: { path: path.relative(repoRoot, alphaSourcePath), provenanceStatus: "RIGHTS_NOT_VERIFIED", productionStatus: "PROTOTYPE_ONLY" },
      focal: { x: 0.5, y: 0.5 }, preview: false,
    }],
  }));
  const alphaOutDir = path.join(repoRoot, ".tmp", "rt-26-alpha-out");
  run(["--manifest", alphaManifestPath, "--out", alphaOutDir]);
  const alphaReport = JSON.parse(fs.readFileSync(path.join(alphaOutDir, "report.json"), "utf8"));
  const alphaDesktopPath = path.join(repoRoot, alphaReport.assets[0].derivatives.desktop.path);
  check(alphaReport.assets[0].derivatives.desktop.format === "png", "alpha source was not encoded as PNG");
  const alphaOutMeta = await sharp(alphaDesktopPath).metadata();
  check(alphaOutMeta.hasAlpha === true, "alpha channel was not preserved in the derivative");
  fs.rmSync(alphaFixtureDir, { recursive: true, force: true });
  fs.rmSync(alphaOutDir, { recursive: true, force: true });

  // ---- No source overwrite / no Hero regression ----
  const dir = path.join(repoRoot, "components", "home", "hero", "assets");
  for (const file of fs.readdirSync(dir)) {
    if (!(file in sourceHashes)) continue;
    const rehash = hash(fs.readFileSync(path.join(dir, file)));
    check(rehash === sourceHashes[file], `temporary source asset was modified: ${file}`);
  }
  const heroDir = path.join(repoRoot, "components", "home", "hero");
  for (const file of ["globe-journey.tsx", "globe-journey.module.css", "globe-3d.ts", "world-atlas.ts"]) {
    const rehash = hash(fs.readFileSync(path.join(heroDir, file)));
    check(rehash === sourceHashes[`hero:${file}`], `Hero implementation file changed: ${file}`);
  }

  // ---- Output location must not collide with tracked source/production paths ----
  const relOut = path.relative(repoRoot, outDir).replace(/\\/g, "/");
  check(relOut.startsWith(".tmp/"), `pipeline output directory is not clearly non-final: ${relOut}`);

} finally {
  // Leave .tmp/rt-26-media-pipeline in place as inspectable evidence; it is untracked.
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("PASS RT-26 media pipeline validation (desktop/mobile derivatives, focal-point crop, determinism, provenance inheritance, alpha preservation, missing-source rejection, no Hero regression)");
}
