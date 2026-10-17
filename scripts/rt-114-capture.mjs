#!/usr/bin/env node
/**
 * RT-114: captures the rebuild-lab tour page prototype (mock data) at desktop and mobile widths and checks the
 * gallery interaction. Local only: point it at a local dev/prod server. Writes PNGs + results.json to the out dir.
 * Usage: node scripts/rt-114-capture.mjs http://127.0.0.1:3233 docs/baseline/rt-114-prototype
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3233";
const OUT = process.argv[3] ?? "docs/baseline/rt-114-prototype";
const TOURS = ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];
for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  context.setDefaultTimeout(120_000); // cold dev-server compiles can exceed Playwright's 30s default
  for (const locale of ["pt", "en", "es"]) {
    for (const id of TOURS) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const url = `${BASE}/${locale}/rebuild-lab/tour-content-preview/${id}`;
      const res = await page.goto(url, { waitUntil: "load" }); // wait for full load so React has hydrated before clicking
      await page.waitForSelector('[data-testid="image-gallery"]');
      await page.waitForTimeout(2500);
      const r = { device, locale, id, status: res?.status(), mockBanner: await page.locator('[data-testid="mock-banner"]').count() };
      // Round 1: the primary CTA must be visible without scrolling (desktop: hero card; mobile: sticky bottom bar).
      const ctaSel = device === "mobile" ? '[data-testid="tour-cta-mobile"]' : '[data-testid="tour-cta"]';
      r.ctaAboveFold = await page.locator(ctaSel).evaluate((el) => { const b = el.getBoundingClientRect(); const st = getComputedStyle(el); return st.display !== "none" && b.height > 0 && b.top >= 0 && b.bottom <= window.innerHeight; });
      // Gallery: next button and keyboard.
      const position = page.locator('[data-testid="image-gallery"] [aria-live="polite"]');
      const before = await position.textContent();
      // The first click can land before React hydration finishes on a cold dev server: retry up to 3 times and record
      // how many attempts were needed (a real defect would fail all attempts).
      let afterClick = before;
      let clickAttempts = 0;
      while (afterClick === before && clickAttempts < 3) {
        clickAttempts += 1;
        await page.locator('[data-testid="image-gallery"] button').nth(1).click();
        await page.waitForTimeout(400);
        afterClick = await position.textContent();
      }
      r.clickAttempts = clickAttempts;
      await page.locator('[data-testid="image-gallery"] button').nth(1).focus();
      await page.keyboard.press("ArrowRight");
      const afterKey = await position.textContent();
      Object.assign(r, { galleryBefore: before, galleryAfterClick: afterClick, galleryAfterArrow: afterKey });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      Object.assign(r, { horizontalOverflow: overflow, consoleErrors: errors.filter((e) => !/Download the React DevTools/.test(e)) });
      if (locale === "pt" || id === TOURS[0]) {
        await page.reload({ waitUntil: "domcontentloaded" }); // capture the initial state (cover photo first)
        await page.waitForSelector('[data-testid="image-gallery"]');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(OUT, `${device}-${locale}-${id}.png`), fullPage: true });
      }
      results.push(r);
      await page.close();
    }
  }
  await context.close();
}
// Gallery quantity scenarios (RT-116 lab): 1, 3, 5 and 8 images, desktop and mobile.
const galleryResults = [];
for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  for (const n of [1, 3, 5, 8]) {
    const res = await page.goto(`${BASE}/pt/rebuild-lab/gallery-lab/${n}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="image-gallery"]');
    await page.waitForTimeout(1500);
    const g = await page.evaluate(() => ({
      count: Number(document.querySelector('[data-testid="image-gallery"]')?.getAttribute("data-count")),
      thumbs: document.querySelectorAll('[data-testid="gallery-thumbs"] button').length,
      controls: document.querySelectorAll('[data-testid="image-gallery"] button[aria-label]').length,
      mainFit: getComputedStyle(document.querySelector('[data-testid="gallery-main-image"]')).objectFit,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    galleryResults.push({ device, n, status: res?.status(), ...g });
    await page.screenshot({ path: path.join(OUT, `gallery-${n}-${device}.png`) });
  }
  await page.close();
}
await browser.close();
results.push(...galleryResults.map((g) => ({ gallery: true, ...g })));
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
const bad = results.filter((r) => r.gallery
  ? r.status !== 200 || r.count !== r.n || r.thumbs !== (r.n > 1 ? r.n : 0) || r.mainFit !== "contain" || r.overflow
  : r.status !== 200 || r.mockBanner !== 1 || !r.ctaAboveFold || r.horizontalOverflow || r.consoleErrors.length || r.galleryBefore === r.galleryAfterClick || r.galleryAfterClick === r.galleryAfterArrow);
console.log(`${results.length} page loads, ${bad.length} with problems`);
for (const b of bad) console.log(JSON.stringify(b));
process.exit(bad.length ? 1 : 0);
