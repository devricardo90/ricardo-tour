#!/usr/bin/env node
/** Local RT-116 visual evidence: the Owner-selected Centro gallery in the production-hidden rebuild lab. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? process.env.RT116_PREVIEW_URL ?? "http://127.0.0.1:3248";
const out = process.argv[3] ?? "docs/baseline/rt-116-centro-commercial-gallery-validation";
const id = "cmlibniq40000z4zqkbujnutt";
const expected = ["img-1337", "img-1802", "img-1328", "img-1321", "img-1332", "img-1136"]; // Museu do Amanha photo removed 28/10/2026 (licence unverified)
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const results = [];
try {
  for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    page.setDefaultTimeout(120_000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(`${base}/pt/rebuild-lab/tour-content-preview/${id}?precos=ocultos`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 60_000 });
    await page.locator('[data-testid="image-gallery"]').waitFor();
    await page.locator('[data-testid="gallery-main-image"]').evaluate((img) => img.decode());
    const initialImageTransferBytes = await page.evaluate(() => performance.getEntriesByType("resource").filter((entry) => entry.name.includes("/_next/image")).reduce((sum, entry) => sum + entry.transferSize, 0));
    const gallery = page.locator('[data-testid="image-gallery"]');
    const frame = gallery.locator("div.relative.overflow-hidden").first();
    const main = page.locator('[data-testid="gallery-main-image"]');
    const thumbs = page.locator('[data-testid="gallery-thumbs"] button');
    const actual = [];
    for (let i = 0; i < expected.length; i += 1) {
      await thumbs.nth(i).click();
      await page.waitForFunction((assetName) => {
        const image = document.querySelector('[data-testid="gallery-main-image"]');
        return image instanceof HTMLImageElement && decodeURIComponent(image.currentSrc).includes(assetName);
      }, expected[i], { timeout: 15_000 });
      await main.evaluate((img) => img.decode());
      actual.push(await main.evaluate((img) => {
        const { width, height } = img.getBoundingClientRect();
        const imageRatio = img.naturalWidth / img.naturalHeight;
        const renderedWidth = Math.min(width, height * imageRatio);
        return {
          src: decodeURIComponent(img.currentSrc), alt: img.alt, loaded: img.naturalWidth > 0, fit: getComputedStyle(img).objectFit,
          horizontalGapRatio: Number(((width - renderedWidth) / width).toFixed(3)),
        };
      }));
    }
    await thumbs.first().click();
    await gallery.locator('button').nth(1).focus();
    await page.keyboard.press("ArrowRight");
    const keyboard = await main.getAttribute("alt");
    await thumbs.first().click();
    await main.evaluate((img) => img.decode());
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const cta = page.locator(device === "mobile" ? '[data-testid="tour-cta-mobile"]' : '[data-testid="tour-cta"]');
    const ctaHref = await cta.getAttribute("href");
    const ctaUrl = ctaHref ? new URL(ctaHref) : null;
    const result = {
      device, http: response?.status(), count: Number(await gallery.getAttribute("data-count")), thumbs: await thumbs.count(),
      title: await page.locator("h1").innerText(),
      h1Count: await page.locator("h1").count(),
      unnamedButtons: await page.locator("button").evaluateAll((buttons) => buttons.filter((button) => !button.textContent?.trim() && !button.getAttribute("aria-label")).length),
      galleryFrame: await frame.evaluate((el) => { const { width, height } = el.getBoundingClientRect(); return { width: Math.round(width), height: Math.round(height), ratio: Number((width / height).toFixed(3)) }; }),
      maxHorizontalGapRatio: Math.max(...actual.map((img) => img.horizontalGapRatio)),
      initialImageTransferBytes,
      ctaHref,
      ctaUsesCanonicalWhatsApp: ctaUrl?.hostname === "wa.me" && ctaUrl.pathname === "/5522998461906" && Boolean(ctaUrl.searchParams.get("text")),
      ctaAboveFold: await cta.evaluate((el) => { const rect = el.getBoundingClientRect(); return rect.height > 0 && rect.top >= 0 && rect.bottom <= innerHeight; }),
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      keyboardMoved: keyboard === actual[1].alt,
      images: actual.map((item, i) => ({ ...item, expected: expected[i], matches: item.src.includes(expected[i]) })),
      errors,
    };
    await page.screenshot({ path: path.join(out, `${device}-viewport.png`) });
    await page.screenshot({ path: path.join(out, `${device}.png`), fullPage: true });
    results.push(result);
    await page.close();
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
const ok = results.length === 2 && results.every((r) => r.http === 200 && r.count === 7 && r.thumbs === 7 && r.title === "Centro Histórico e Cultural do Rio" && r.h1Count === 1 && r.unnamedButtons === 0 && Math.abs(r.galleryFrame.ratio - 0.75) <= 0.01 && r.maxHorizontalGapRatio <= 0.01 && r.ctaUsesCanonicalWhatsApp && r.ctaAboveFold && !r.overflow && r.keyboardMoved && r.errors.length === 0 && r.images.every((img) => img.loaded && img.fit === "contain" && img.alt && img.matches));
console.log(JSON.stringify({ ok, results: results.map(({ device, http, count, thumbs, galleryFrame, maxHorizontalGapRatio, ctaUsesCanonicalWhatsApp, ctaAboveFold, overflow, keyboardMoved, errors }) => ({ device, http, count, thumbs, galleryFrame, maxHorizontalGapRatio, ctaUsesCanonicalWhatsApp, ctaAboveFold, overflow, keyboardMoved, errors })) }, null, 2));
if (!ok) process.exitCode = 1;
