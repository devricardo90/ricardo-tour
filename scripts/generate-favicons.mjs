// RT-RB-S9-01 — builds the Ricardo Tour favicon set from the official logo (RT-94).
// Usage: node scripts/generate-favicons.mjs
// Uses the "RT" monogram (the full wordmark is illegible at 16px) on the approved
// charcoal token (#0B0E11, RT-14 spec). Outputs follow the App Router file convention.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "public/images/ricardo-tour-logo.png";
const CHARCOAL = { r: 11, g: 14, b: 17, alpha: 1 };
// Monogram bounding box in the 2172x724 source (includes the Christ arc and wave).
const CROP = { left: 70, top: 100, width: 620, height: 510 };

const meta = await sharp(SRC).metadata();
if (meta.width !== 2172 || meta.height !== 724) {
  throw new Error(`Logo is ${meta.width}x${meta.height}; CROP was tuned for 2172x724 - re-tune CROP.`);
}
const mark = await sharp(SRC).extract(CROP).toBuffer();

async function tile(size, { rounded }) {
  const small = size <= 48;
  const inner = Math.round(size * (small ? 0.92 : 0.8)); // larger fill at tiny sizes
  const fitted = await sharp(mark)
    .resize({ width: inner, height: inner, fit: "inside" })
    .toBuffer();
  const base = sharp({
    create: { width: size, height: size, channels: 4, background: CHARCOAL },
  });
  let out = await base
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toBuffer();
  if (rounded) {
    const r = Math.round(size * 0.18);
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`,
    );
    out = await sharp(out)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  }
  return out;
}

// PNG-in-ICO container (valid for all modern browsers).
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dirs = [];
  for (const { size, data } of entries) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);
    d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(data.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += data.length;
    dirs.push(d);
  }
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]);
}

const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({ size, data: await tile(size, { rounded: true }) });
}
writeFileSync("app/favicon.ico", buildIco(icoEntries));
writeFileSync("app/icon.png", await tile(512, { rounded: true }));
writeFileSync("app/apple-icon.png", await tile(180, { rounded: false }));
console.log("favicon.ico (16/32/48), icon.png (512), apple-icon.png (180) written to app/");
