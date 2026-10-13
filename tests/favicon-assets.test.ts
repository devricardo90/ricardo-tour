import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

// RT-RB-S9-01: the Vercel default favicon must be gone; Ricardo Tour icon set in place.
const APP = join(process.cwd(), "app");
const VERCEL_DEFAULT_FAVICON_MD5 = "c30c7d42707a47a3f4591831641e50dc";
const PNG_SIGNATURE = "89504e470d0a1a0a";

function pngSize(buf: Buffer) {
  expect(buf.subarray(0, 8).toString("hex")).toBe(PNG_SIGNATURE);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("favicon assets (RT-RB-S9-01)", () => {
  it("favicon.ico is not the Vercel/Next default", () => {
    const ico = readFileSync(join(APP, "favicon.ico"));
    expect(createHash("md5").update(ico).digest("hex")).not.toBe(VERCEL_DEFAULT_FAVICON_MD5);
  });

  it("favicon.ico is a valid ICO with 16, 32 and 48 px entries", () => {
    const ico = readFileSync(join(APP, "favicon.ico"));
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16]);
    expect(sizes).toEqual([16, 32, 48]);
    // each entry must contain a real PNG payload within the file bounds
    for (let i = 0; i < count; i++) {
      const length = ico.readUInt32LE(6 + i * 16 + 8);
      const offset = ico.readUInt32LE(6 + i * 16 + 12);
      expect(offset + length).toBeLessThanOrEqual(ico.length);
      expect(pngSize(ico.subarray(offset, offset + length))).toEqual({
        width: sizes[i],
        height: sizes[i],
      });
    }
  });

  it("icon.png is 512x512 and apple-icon.png is 180x180", () => {
    expect(pngSize(readFileSync(join(APP, "icon.png")))).toEqual({ width: 512, height: 512 });
    expect(pngSize(readFileSync(join(APP, "apple-icon.png")))).toEqual({ width: 180, height: 180 });
  });

  it("the 16px ICO entry is the simplified letters-only variant (flat gold on dark, few tones)", async () => {
    const ico = readFileSync(join(APP, "favicon.ico"));
    expect(ico[6]).toBe(16); // first directory entry is the 16px one
    const length = ico.readUInt32LE(6 + 8);
    const offset = ico.readUInt32LE(6 + 12);
    const { data } = await sharp(ico.subarray(offset, offset + length)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let opaque = 0;
    let gold = 0;
    let dark = 0;
    const tones = new Set<string>();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 200) continue;
      opaque++;
      if (r > 150 && g > 100 && b < 110 && r > b + 60) gold++;
      if (r < 30 && g < 30 && b < 35) dark++;
      tones.add(`${r >> 5}${g >> 5}${b >> 5}`);
    }
    expect(gold / opaque).toBeGreaterThan(0.12);
    expect(dark / opaque).toBeGreaterThan(0.5);
    // the full multi-tone monogram at 16px used ~30 tone buckets; the flat letters variant uses far fewer
    expect(tones.size).toBeLessThanOrEqual(24);
  });

  it("icon.png carries the gold Ricardo Tour mark on a dark tile (not blank, not default)", async () => {
    const { data, info } = await sharp(join(APP, "icon.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let gold = 0;
    let dark = 0;
    const total = info.width * info.height;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 200) continue; // rounded corners
      if (r > 150 && g > 100 && b < 110 && r > b + 60) gold++;
      if (r < 30 && g < 30 && b < 35) dark++;
    }
    expect(gold / total).toBeGreaterThan(0.05);
    expect(dark / total).toBeGreaterThan(0.4);
  });
});
