import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
});
