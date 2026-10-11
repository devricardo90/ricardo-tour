// RT-45: capture the Home hero at fixed journey positions (after the WebGL globe is ready) so the build before and
// after a performance change can be compared frame by frame. Usage: node scripts/rt-45-hero-frames.mjs <baseUrl> <outDir>
import fs from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3200", outDir = ".tmp/hero-frames"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  await page.goto(`${base}/pt`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-testid=globe-journey][data-webgl=ready]", { timeout: 30000 });
  const travel = await page.evaluate(() => { const r = document.querySelector("[data-runway]"); const s = document.querySelector("[data-stage]"); return r.offsetHeight - s.offsetHeight; });
  for (const p of [0, 0.06, 0.2, 0.35, 0.5]) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(travel * p));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outDir}/${vp.name}-${String(p).replace(".", "_")}.png` });
  }
  await page.close();
}
await browser.close();
console.log("frames written to", outDir);
