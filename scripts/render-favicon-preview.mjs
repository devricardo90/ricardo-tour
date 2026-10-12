// RT-97 evidence: renders the favicon set (16/32/48 from favicon.ico, 180 apple-touch-icon) at real size and 4x
// on light and dark backgrounds. Usage: node scripts/render-favicon-preview.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const ico = readFileSync("app/favicon.ico");
const icoEntries = {};
for (let i = 0; i < ico.readUInt16LE(4); i++) {
  const size = ico[6 + i * 16];
  const len = ico.readUInt32LE(6 + i * 16 + 8);
  const off = ico.readUInt32LE(6 + i * 16 + 12);
  icoEntries[size] = ico.subarray(off, off + len);
}
const items = [
  { size: 16, buf: icoEntries[16], label: "16 px (favicon.ico)" },
  { size: 32, buf: icoEntries[32], label: "32 px (favicon.ico)" },
  { size: 48, buf: icoEntries[48], label: "48 px (favicon.ico)" },
  { size: 180, buf: readFileSync("app/apple-icon.png"), label: "180 px (apple-touch-icon)" },
];

const W = 1180, H = 620, PAD = 24;
const label = (text, x, y, fill) =>
  `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="13" fill="${fill}">${text}</text>`;

const panels = [
  { bg: "#FFFFFF", fg: "#222", top: 0, name: "Light background" },
  { bg: "#1F2125", fg: "#EEE", top: H / 2, name: "Dark background" },
];
const base = sharp({ create: { width: W, height: H, channels: 4, background: "#FFFFFF" } });
const comps = [];
let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
for (const p of panels) {
  svg += `<rect x="0" y="${p.top}" width="${W}" height="${H / 2}" fill="${p.bg}"/>`;
  svg += label(p.name + " - real size (top row) and 4x nearest-neighbour (below)", PAD, p.top + 22, p.fg);
  let x = PAD;
  for (const it of items) {
    const realY = p.top + 40;
    const bigSize = Math.min(it.size * 4, 160);
    comps.push({ input: await sharp(it.buf).resize(it.size, it.size).toBuffer(), left: x, top: realY });
    if (it.size < 180) {
      comps.push({
        input: await sharp(it.buf).resize(bigSize, bigSize, { kernel: "nearest" }).toBuffer(),
        left: x,
        top: realY + 70,
      });
    }
    svg += label(it.label, x, p.top + H / 2 - 8, p.fg);
    x += Math.max(bigSize, 180) + 40;
  }
}
svg += "</svg>";
await base
  .composite([{ input: Buffer.from(svg), left: 0, top: 0 }, ...comps])
  .png()
  .toFile("docs/validation/rt-97-favicon-preview.png");
console.log("wrote docs/validation/rt-97-favicon-preview.png");
