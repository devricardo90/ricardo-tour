// RT-97 evidence: side-by-side of the 16px (and 32px) favicon entries before/after the 16px letters-only variant.
// Usage: node scripts/render-favicon-16-comparison.mjs <before.ico> [after.ico]   (after defaults to app/favicon.ico)
import sharp from "sharp";
import { readFileSync } from "node:fs";

const [beforePath, afterPath = "app/favicon.ico"] = process.argv.slice(2);
if (!beforePath) throw new Error("usage: node scripts/render-favicon-16-comparison.mjs <before.ico> [after.ico]");

function entries(path) {
  const ico = readFileSync(path);
  const out = {};
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const size = ico[6 + i * 16];
    const len = ico.readUInt32LE(6 + i * 16 + 8);
    const off = ico.readUInt32LE(6 + i * 16 + 12);
    out[size] = ico.subarray(off, off + len);
  }
  return out;
}
const before = entries(beforePath);
const after = entries(afterPath);

const rows = [
  { size: 16, zoom: 10, label: "16 px" },
  { size: 32, zoom: 5, label: "32 px (same)" },
];
const cols = [
  { name: "BEFORE", set: before },
  { name: "AFTER", set: after },
];
const W = 860, H = 560, PAD = 20;
const bgs = [
  { fill: "#FFFFFF", text: "#222", x: 0 },
  { fill: "#1F2125", text: "#EEE", x: W / 2 },
];
let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
const comps = [];
for (const bg of bgs) {
  svg += `<rect x="${bg.x}" y="0" width="${W / 2}" height="${H}" fill="${bg.fill}"/>`;
  let y = 30;
  svg += `<text x="${bg.x + PAD}" y="20" font-family="Arial" font-size="13" font-weight="bold" fill="${bg.text}">${bg.fill === "#FFFFFF" ? "Light background" : "Dark background"}  (AFTER: 16 px uses letters-only variant)</text>`;
  for (const row of rows) {
    let x = bg.x + PAD;
    for (const col of cols) {
      svg += `<text x="${x}" y="${y + 12}" font-family="Arial" font-size="11" fill="${bg.text}">${col.name} - ${row.label}</text>`;
      comps.push({ input: await sharp(col.set[row.size]).toBuffer(), left: x, top: y + 20 });
      comps.push({
        input: await sharp(col.set[row.size]).resize(row.size * row.zoom, row.size * row.zoom, { kernel: "nearest" }).toBuffer(),
        left: x,
        top: y + 20 + row.size + 8,
      });
      x += 200;
    }
    y += row.size + 20 + row.size * row.zoom + 36;
  }
}
svg += "</svg>";
await sharp({ create: { width: W, height: H, channels: 4, background: "#fff" } })
  .composite([{ input: Buffer.from(svg), left: 0, top: 0 }, ...comps])
  .png()
  .toFile("docs/validation/rt-97-favicon-16px-variant-comparison.png");
console.log("wrote docs/validation/rt-97-favicon-16px-variant-comparison.png");
