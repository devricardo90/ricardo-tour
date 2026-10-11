// RT-45: pixel diff of hero frames captured before/after a change (same viewport, same scroll positions).
// Counts pixels whose max channel delta exceeds a tolerance. Usage: node scripts/rt-45-frame-diff.mjs <dirA> <dirB> [tol=16]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [a, b, tolArg = "16"] = process.argv.slice(2);
const tol = Number(tolArg);
const rows = [];
for (const file of fs.readdirSync(a).filter((f) => f.endsWith(".png"))) {
  const [x, y] = await Promise.all([a, b].map((d) => sharp(path.join(d, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (x.info.width !== y.info.width || x.info.height !== y.info.height) { rows.push({ file, error: "size mismatch" }); continue; }
  let over = 0, maxDelta = 0, identical = 0;
  const px = x.info.width * x.info.height;
  for (let i = 0; i < x.data.length; i += 4) {
    const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]));
    if (d === 0) identical++;
    if (d > tol) over++;
    if (d > maxDelta) maxDelta = d;
  }
  rows.push({ file, pixels: px, identicalPct: +(100 * identical / px).toFixed(3), overTolPct: +(100 * over / px).toFixed(3), maxDelta });
}
console.log(JSON.stringify({ tolerance: tol, rows }, null, 1));
