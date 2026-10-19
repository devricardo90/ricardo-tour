#!/usr/bin/env node
/** Local-only visual evidence for the approved TOUR-03 gallery refinement. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = process.env.RT116_PREVIEW_URL ?? "http://127.0.0.1:3248";
const output = path.join(process.cwd(), "docs/baseline/rt-116-centro-visual-final");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const results = [];

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`${base}/pt/rebuild-lab/tour-content-preview/cmlibniq40000z4zqkbujnutt?precos=ocultos`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200);
    const gallery = page.getByTestId("image-gallery");
    const frame = gallery.locator("div.relative.overflow-hidden").first();
    const image = page.getByTestId("gallery-main-image");
    const thumbs = page.getByTestId("gallery-thumbs").locator("button");
    assert.equal(await thumbs.count(), 7);
    await image.evaluate((element) => element.decode());
    const portraitRatio = await frame.evaluate((element) => element.clientWidth / element.clientHeight);
    assert.ok(Math.abs(portraitRatio - 0.75) < 0.01);
    await page.screenshot({ path: path.join(output, `${viewport.name}-viewport.png`) });
    await page.screenshot({ path: path.join(output, `${viewport.name}-full.png`), fullPage: true });

    await thumbs.last().click();
    await image.evaluate((element) => element.decode());
    const museum = await image.evaluate((element) => ({
      source: decodeURIComponent(element.currentSrc),
      naturalRatio: element.naturalWidth / element.naturalHeight,
      fit: getComputedStyle(element).objectFit,
    }));
    assert.ok(museum.source.includes("centro-historico-museu-do-amanha.webp"));
    assert.equal(museum.fit, "contain");
    const museumRatio = await frame.evaluate((element) => element.clientWidth / element.clientHeight);
    assert.ok(Math.abs(museumRatio - museum.naturalRatio) < 0.01);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    // Recreate the previous 3:4 frame in the browser for a direct visual comparison.
    await frame.evaluate((element) => { element.style.aspectRatio = "3 / 4"; });
    await frame.screenshot({ path: path.join(output, `${viewport.name}-museum-before-frame.png`) });
    await frame.evaluate((element) => { element.style.removeProperty("aspect-ratio"); });
    await frame.screenshot({ path: path.join(output, `${viewport.name}-museum-after-frame.png`) });
    await page.screenshot({ path: path.join(output, `${viewport.name}-museum-viewport.png`) });
    assert.deepEqual(errors, []);
    results.push({ viewport: viewport.name, http: response.status(), count: await thumbs.count(), portraitRatio, museumRatio, museumNaturalRatio: museum.naturalRatio, museumFit: museum.fit, museumSource: museum.source, overflow: false, errors });
    await page.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(output, "results.json"), `${JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2)}\n`);
console.log(JSON.stringify({ output, results }, null, 2));
