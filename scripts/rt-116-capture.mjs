#!/usr/bin/env node
/**
 * RT-116: visual + behavioural evidence for the Favela Rocinha preview (rebuild lab, production-hidden, local only).
 * Desktop 1440×900 and mobile 390×844: page top, full page, each of the 5 gallery photos, the video block before and
 * while playing; checks order, credit, video duration/no autoplay/no video bytes before play, page weight and LCP.
 * Usage: node scripts/rt-116-capture.mjs http://127.0.0.1:3233 docs/baseline/rt-116-rocinha
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3233";
const OUT = process.argv[3] ?? "docs/baseline/rt-116-rocinha";
const ID = process.env.RT116_ID ?? "cmli1a6im000034zqqzc9sppb";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: "jpeg", quality: 82, ...opts });

for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: device === "mobile" ? 2 : 1 });
  context.setDefaultTimeout(120_000);
  for (const locale of device === "desktop" ? ["pt", "en", "es"] : ["pt"]) {
    const page = await context.newPage();
    const errors = [];
    const responses = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("requestfinished", async (req) => {
      const sizes = await req.sizes().catch(() => ({ responseBodySize: 0 }));
      responses.push({ url: req.url(), type: req.resourceType(), bytes: sizes.responseBodySize });
    });
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((list) => { for (const e of list.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    const url = `${BASE}/${locale}/rebuild-lab/tour-content-preview/${ID}`;
    // Warm-up load (dev server compiles on first hit), then a measured load.
    await page.goto(url, { waitUntil: "load" });
    responses.length = 0;
    const res = await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector('[data-testid="image-gallery"]');
    await page.waitForTimeout(2500);
    const r = { device, locale, status: res?.status() };
    r.lcpMs = Math.round(await page.evaluate(() => window.__lcp));
    r.videoBytesBeforePlay = responses.filter((x) => x.url.includes(".mp4")).reduce((a, x) => a + x.bytes, 0);
    r.imageRequestsOnLoad = responses.filter((x) => x.type === "image").length;
    r.imageBytesOnLoad = responses.filter((x) => x.type === "image").reduce((a, x) => a + x.bytes, 0);
    r.totalBytesOnLoad = responses.reduce((a, x) => a + x.bytes, 0);
    r.galleryCount = await page.locator('[data-testid="image-gallery"]').getAttribute("data-count");
    r.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const ctaSel = device === "mobile" ? '[data-testid="tour-cta-mobile"]' : '[data-testid="tour-cta"]';
    r.ctaAboveFold = await page.locator(ctaSel).evaluate((el) => { const b = el.getBoundingClientRect(); return b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight; });
    if (locale === "pt") await shot(page, `${device}-top`);
    else await shot(page, `${device}-top-${locale}`);

    if (locale === "pt") {
      await shot(page, `${device}-full`, { fullPage: true });
      // Gallery: walk through the 5 photos with the "next" button (retry the first click: hydration on a cold server).
      const main = page.locator('[data-testid="gallery-main-image"]');
      const position = page.locator('[data-testid="image-gallery"] [aria-live="polite"]');
      const next = page.locator('[data-testid="image-gallery"] button').nth(1);
      r.gallery = [];
      const count = Number(await page.locator('[data-testid="image-gallery"]').getAttribute("data-count"));
      for (let i = 0; i < count; i += 1) {
        const src = decodeURIComponent((await main.getAttribute("src")) ?? "");
        const file = (src.match(/url=([^&]+)/) ?? [])[1] ?? src;
        r.gallery.push({ position: await position.textContent(), file: path.basename(file.split("&")[0]), alt: await main.getAttribute("alt"), credit: (await page.locator('[data-testid="gallery-credit"]').count()) ? await page.locator('[data-testid="gallery-credit"]').textContent() : null });
        await page.locator('[data-testid="image-gallery"]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        await page.locator('[data-testid="image-gallery"]').screenshot({ path: path.join(OUT, `${device}-gallery-${i + 1}.jpg`), type: "jpeg", quality: 82 });
        const before = await position.textContent();
        for (let a = 0; a < 3 && (await position.textContent()) === before; a += 1) {
          await next.click();
          await page.waitForTimeout(400);
        }
      }
      // Video block: poster state, then play on request.
      const video = page.locator('[data-testid="tour-video-player"]');
      await page.locator('[data-testid="tour-video"]').scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      r.videoAutoplay = await video.evaluate((v) => v.autoplay || !v.paused);
      await page.locator('[data-testid="tour-video"]').screenshot({ path: path.join(OUT, `${device}-video-poster.jpg`), type: "jpeg", quality: 82 });
      await video.evaluate((v) => v.play());
      await page.waitForTimeout(3500);
      Object.assign(r, await video.evaluate((v) => ({ videoDuration: Math.round(v.duration * 10) / 10, videoPlaying: !v.paused && v.currentTime > 0, videoWidth: v.videoWidth, videoHeight: v.videoHeight, videoMuted: v.muted })));
      await page.locator('[data-testid="tour-video"]').screenshot({ path: path.join(OUT, `${device}-video-playing.jpg`), type: "jpeg", quality: 82 });
      r.videoBytesAfterPlay = responses.filter((x) => x.url.includes(".mp4")).length > 0;
      r.videoFile = await video.evaluate((v) => v.currentSrc.split("/").pop());
    }
    r.consoleErrors = errors.filter((e) => !/Download the React DevTools/.test(e));
    results.push(r);
    await page.close();
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
