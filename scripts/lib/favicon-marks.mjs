// Shared helpers for the Ricardo Tour favicon set (RT-RB-S9-01 / RT-97).
// Two renderings of the official logo (public/images/ricardo-tour-logo.png, RT-94):
//   - full mark   : the "RT" monogram with the Christ and the wave (used for 32px and above)
//   - letters mark: only the "RT" letterforms in flat gold (used for 16px, where the full mark turns into noise)
// Both are cut from the official artwork; nothing is redrawn.
import sharp from "sharp";

export const SRC = "public/images/ricardo-tour-logo.png";
export const CHARCOAL = { r: 11, g: 14, b: 17, alpha: 1 }; // approved charcoal token (#0B0E11, RT-14 spec)
const GOLD = { r: 226, g: 170, b: 58 };

// Crop tuned for the 2172x724 source (monogram with arc and wave).
const CROP = { left: 70, top: 100, width: 620, height: 510 };

// Regions (in source-image coordinates) removed to isolate the letters: the Christ, mountain line and ring,
// and the wave under the letters. Measured on a calibration grid of the source art.
const REMOVE = [
  [392, 60, 740, 333], // Christ + mountain line + ring, right of the R and above the T crossbar
  [330, 60, 740, 208], // ring arc above the R bowl
  [40, 443, 418, 740], // wave under the R (clips only the R leg tip)
  [40, 538, 740, 740], // wave under the T serif base
  [506, 392, 740, 740], // wave + mountain tail right of the T stem
  [589, 300, 740, 740], // mountain tail touching the T crossbar end
];

export async function assertSourceSize() {
  const meta = await sharp(SRC).metadata();
  if (meta.width !== 2172 || meta.height !== 724) {
    throw new Error(`Logo is ${meta.width}x${meta.height}; CROP/REMOVE were tuned for 2172x724 - re-tune them.`);
  }
}

export async function fullMark() {
  return sharp(SRC).extract(CROP).toBuffer();
}

export async function lettersMark() {
  const mark = await fullMark();
  const { width: W, height: H } = CROP;
  const rects = REMOVE.map(([x1, y1, x2, y2]) => {
    const x = x1 - CROP.left;
    const y = y1 - CROP.top;
    return `<rect x="${x}" y="${y}" width="${x2 - x1}" height="${y2 - y1}" fill="#000"/>`;
  }).join("");
  const keepSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/>${rects}</svg>`,
  );
  const keep = await sharp(keepSvg).greyscale().toBuffer();
  const alpha = await sharp(mark).ensureAlpha().extractChannel(3).toBuffer();
  const lettersAlpha = await sharp(alpha).composite([{ input: keep, blend: "multiply" }]).png().toBuffer();
  const mask = await sharp(lettersAlpha).extractChannel(0).blur(2.5).threshold(120).png().toBuffer();
  const flat = await sharp({ create: { width: W, height: H, channels: 3, background: GOLD } })
    .joinChannel(mask)
    .png()
    .toBuffer();
  const trimmed = await sharp(flat).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 }).toBuffer();
  return trimmed;
}

/** Square icon tile: artwork centred on charcoal, optionally with rounded corners. */
export async function tile(artwork, size, { fill, rounded }) {
  const inner = Math.round(size * fill);
  const fitted = await sharp(artwork).resize({ width: inner, height: inner, fit: "inside", kernel: "lanczos3" }).toBuffer();
  let out = await sharp({ create: { width: size, height: size, channels: 4, background: CHARCOAL } })
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toBuffer();
  if (rounded) {
    const r = Math.round(size * 0.18);
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`,
    );
    out = await sharp(out).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  }
  return out;
}
