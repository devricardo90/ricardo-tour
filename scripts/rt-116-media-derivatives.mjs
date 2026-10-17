#!/usr/bin/env node
/**
 * RT-116 — web derivatives for the Favela Rocinha selection (Owner decision 17/10/2026).
 * Reads the read-only originals (never writes there), writes optimized copies for LOCAL testing:
 *  - photos: HEIC (iPhone, Display P3) → sRGB → JPEG, long side 2000 px, mozjpeg q82, ALL metadata removed (EXIF/GPS/ICC);
 *  - video poster: frame of the already-encoded clip, JPEG, metadata removed.
 * The clip itself is encoded with ffmpeg (command recorded in docs/product/rt-116-rocinha-media-selection.md).
 * Usage: node scripts/rt-116-media-derivatives.mjs <ORIGINAIS dir> <work dir outside the repo>
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [originals, work] = process.argv.slice(2);
if (!originals || !work) throw new Error("usage: rt-116-media-derivatives.mjs <ORIGINAIS> <work dir>");
const out = path.resolve("public/media/tours/favela-rocinha");
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(work, { recursive: true });

// Owner-approved order (17/10/2026). Output names describe the content.
const PHOTOS = [
  ["IMG_1243.HEIC", "rocinha-01-panorama-bandeira.jpg"],
  ["IMG_1253.HEIC", "rocinha-02-beco.jpg"],
  ["IMG_1252.HEIC", "rocinha-03-mural.jpg"],
  ["img-favela-deck.HEIC", "rocinha-04-mirante-deck.jpg"],
  ["IMG_1247.HEIC", "rocinha-05-panorama.jpg"],
];

const sha = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const manifest = [];

for (const [src, name] of PHOTOS) {
  const original = path.join(originals, src);
  const decoded = path.join(work, `${path.parse(src).name}.p3.png`);
  const srgb = path.join(work, `${path.parse(src).name}.srgb.png`);
  ff("-i", original, "-frames:v", "1", decoded); // full tile grid, P3 values
  // Display P3 (ICC in the HEIC) → sRGB, so browsers that assume sRGB show the intended colours.
  ff("-i", decoded, "-vf", "format=gbrp,zscale=pin=smpte432:tin=iec61966-2-1:min=gbr:rin=full:p=709:t=iec61966-2-1:m=gbr:r=full,format=rgb24", srgb);
  const target = path.join(out, name);
  await sharp(srgb).resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0" }).toFile(target);
  const meta = await sharp(target).metadata();
  manifest.push({ original: src, originalSha256: sha(original), derivative: `/media/tours/favela-rocinha/${name}`, width: meta.width, height: meta.height, bytes: fs.statSync(target).size, exif: Boolean(meta.exif), icc: Boolean(meta.icc), xmp: Boolean(meta.xmp) });
}

const clip = path.join(out, "rocinha-praca-movimento.mp4");
if (fs.existsSync(clip)) {
  const frame = path.join(work, "poster.png");
  ff("-ss", "5.5", "-i", clip, "-frames:v", "1", frame); // 5.5 s into the clip = 12 s in the original
  const poster = path.join(out, "rocinha-praca-movimento-poster.jpg");
  await sharp(frame).jpeg({ quality: 80, mozjpeg: true }).toFile(poster);
  const meta = await sharp(poster).metadata();
  manifest.push({ original: "IMG_1256.MOV", derivative: "/media/tours/favela-rocinha/rocinha-praca-movimento-poster.jpg", width: meta.width, height: meta.height, bytes: fs.statSync(poster).size, exif: Boolean(meta.exif), icc: Boolean(meta.icc), xmp: Boolean(meta.xmp) });
  manifest.push({ original: "IMG_1256.MOV", derivative: "/media/tours/favela-rocinha/rocinha-praca-movimento.mp4", bytes: fs.statSync(clip).size, sha256: sha(clip) });
}

fs.writeFileSync(path.join(work, "derivatives-manifest.json"), JSON.stringify(manifest, null, 2));
console.table(manifest.map(({ derivative, width, height, bytes, exif, icc }) => ({ derivative, width, height, kb: Math.round(bytes / 1024), exif, icc })));
