// RT-RB-S9-01 — builds the Ricardo Tour favicon set from the official logo (RT-94).
// Usage: node scripts/generate-favicons.mjs
// Sizes >= 32px use the full "RT" monogram; the 16px entry uses the letters-only variant (the full mark is
// illegible at 16px). All on the approved charcoal token. Outputs follow the App Router file convention.
import { writeFileSync } from "node:fs";
import { assertSourceSize, fullMark, lettersMark, tile } from "./lib/favicon-marks.mjs";

await assertSourceSize();
const full = await fullMark();
const letters = await lettersMark();

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

const icoEntries = [
  { size: 16, data: await tile(letters, 16, { fill: 0.84, rounded: true }) },
  { size: 32, data: await tile(full, 32, { fill: 0.92, rounded: true }) },
  { size: 48, data: await tile(full, 48, { fill: 0.92, rounded: true }) },
];
writeFileSync("app/favicon.ico", buildIco(icoEntries));
writeFileSync("app/icon.png", await tile(full, 512, { fill: 0.8, rounded: true }));
writeFileSync("app/apple-icon.png", await tile(full, 180, { fill: 0.8, rounded: false }));
console.log("favicon.ico (16 letters / 32 / 48 full), icon.png (512), apple-icon.png (180) written to app/");
