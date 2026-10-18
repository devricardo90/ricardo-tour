#!/usr/bin/env node
/** RT-112/RT-114 TOUR-01 gallery check (local lab only): captures the main gallery frame for the 4 real photos and for
 *  synthetic test images of other proportions (16:9, 1:1, 9:16, injected only into this test through request
 *  interception), on desktop, tablet and mobile. Measures that the photo is never cropped or distorted and how much of
 *  the frame is flat (low-detail) background. Usage: node scripts/rt-114-gallery-backdrop-check.mjs <base> <outDir> */
import fs from "node:fs";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:3251";
const out = process.argv[3] ?? "docs/baseline/rt-114-tour01-gallery/after";
const id = "cmlhxkpy9000028zq27rhytew";
fs.mkdirSync(out, { recursive: true });

// Synthetic test images (never shipped): coloured gradient with a centred "subject" block, so cropping is detectable.
async function synthetic(w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f6fb2"/><stop offset="1" stop-color="#e8b04a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="${w * 0.02}" y="${h * 0.02}" width="${w * 0.96}" height="${h * 0.96}" fill="none" stroke="#ffffff" stroke-width="${Math.max(6, w * 0.01)}"/><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.18}" fill="#c0392b"/></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer();
}
const SYNTH = { "landscape-16x9": await synthetic(1600, 900), "square-1x1": await synthetic(1200, 1200), "tall-9x16": await synthetic(900, 1600) };

const viewports = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1180 }, mobile: { width: 390, height: 844 } };
const browser = await chromium.launch();
const results = [];
try {
  for (const [device, viewport] of Object.entries(viewports)) {
    for (const variant of ["photos", ...Object.keys(SYNTH)]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      page.setDefaultTimeout(120_000);
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      if (variant !== "photos") {
        // Replace every gallery photo request by the synthetic image of this proportion.
        await page.route(/\/_next\/image\?url=%2Fmedia%2Ftours%2Fcristo-pao-selaron%2Fpao-0/, (route) => route.fulfill({ status: 200, contentType: "image/webp", body: SYNTH[variant] }));
      }
      await page.goto(`${base}/pt/rebuild-lab/tour-content-preview/${id}?precos=ocultos`, { waitUntil: "load" });
      const frame = page.locator('[data-testid="image-gallery"] > div').first();
      await frame.waitFor();
      const shots = variant === "photos" ? [0, 1, 2, 3] : [0];
      for (const i of shots) {
        if (i > 0) await page.locator('[data-testid="gallery-thumbs"] button').nth(i).click();
        const main = page.locator('[data-testid="gallery-main-image"]');
        await main.evaluate((img) => img.decode());
        await page.waitForTimeout(150);
        const m = await main.evaluate((img) => {
          const box = img.getBoundingClientRect();
          const ratio = img.naturalWidth / img.naturalHeight;
          const w = Math.min(box.width, box.height * ratio);
          const h = Math.min(box.height, box.width / ratio);
          return { fit: getComputedStyle(img).objectFit, natural: [img.naturalWidth, img.naturalHeight], frame: [Math.round(box.width), Math.round(box.height)], shown: [Math.round(w), Math.round(h)], cropped: w > box.width + 1 || h > box.height + 1, distorted: Math.abs(w / h - ratio) > 0.01, sideBandRatio: Number(((box.width - w) / box.width).toFixed(3)) };
        });
        const file = `${out}/${device}-${variant}${variant === "photos" ? `-${i + 1}` : ""}.png`;
        const buf = await frame.screenshot({ path: file });
        // Flatness of the side bands: low standard deviation = flat grey area (what the Owner rejected).
        const meta = await sharp(buf).metadata();
        const bandW = Math.max(1, Math.floor((meta.width * m.sideBandRatio) / 2) - 4);
        let bandStd = null;
        if (bandW > 8) {
          const stats = await sharp(buf).extract({ left: 2, top: Math.floor(meta.height * 0.1), width: bandW, height: Math.floor(meta.height * 0.8) }).stats();
          bandStd = Number((stats.channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3).toFixed(1));
          const mean = stats.channels.slice(0, 3).map((c) => Math.round(c.mean));
          m.bandMeanRGB = mean;
        }
        results.push({ device, variant, photo: i + 1, ...m, bandStd, errors: errors.length, file });
      }
      await page.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
for (const r of results) console.log(`${r.device.padEnd(7)} ${r.variant.padEnd(15)} #${r.photo} frame=${r.frame} shown=${r.shown} band=${r.sideBandRatio} bandStd=${r.bandStd} rgb=${r.bandMeanRGB ?? "-"} cropped=${r.cropped} distorted=${r.distorted} fit=${r.fit} err=${r.errors}`);
