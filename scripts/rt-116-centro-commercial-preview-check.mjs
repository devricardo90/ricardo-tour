import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.RT116_PREVIEW_URL ?? "http://127.0.0.1:3248";
const tourId = "cmlibniq40000z4zqkbujnutt";
const outputDir = path.join(process.cwd(), "docs/baseline/rt-116-centro-commercial-preview");
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
const results = [];

try {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    page.on("pageerror", (error) => errors.push(`${viewport.name}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${viewport.name}: ${message.text()}`);
    });

    const response = await page.goto(`${baseUrl}/pt/rebuild-lab/tour-content-preview/${tourId}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    assert.equal(response?.status(), 200, `${viewport.name}: preview response`);
    await page.getByTestId("tour-approved-prices").waitFor();
    assert.equal(await page.getByTestId("tour-approved-prices").locator("table").count(), 2, `${viewport.name}: 4h and 6h tables`);
    assert.equal(await page.getByTestId("centro-route-options").locator("article").count(), 2, `${viewport.name}: both routes`);
    assert.equal(await page.getByTestId("image-gallery").getAttribute("data-count"), "7", `${viewport.name}: approved media count`);
    await page.waitForFunction(() => {
      const image = document.querySelector('[data-testid="gallery-main-image"]');
      return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
    }, null, { timeout: 20000 });
    await page.evaluate(async () => {
      const image = document.querySelector('[data-testid="gallery-main-image"]');
      if (!(image instanceof HTMLImageElement)) throw new Error("gallery main image is missing");
      await image.decode();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const style = window.getComputedStyle(image);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        throw new Error("gallery main image is not visually available");
      }
    });
    const cta = page.getByTestId(viewport.name === "mobile" ? "tour-cta-mobile" : "tour-cta");
    const ctaHref = await cta.getAttribute("href");
    assert.ok(ctaHref, `${viewport.name}: CTA has a destination`);
    const ctaUrl = new URL(ctaHref);
    assert.equal(ctaUrl.hostname, "wa.me", `${viewport.name}: CTA uses canonical WhatsApp inquiry flow`);
    assert.equal(ctaUrl.pathname, "/5522998461906", `${viewport.name}: CTA uses canonical commercial number`);
    assert.ok(ctaUrl.searchParams.get("text"), `${viewport.name}: CTA includes localized inquiry text`);

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      mainImageLoaded: (() => {
        const image = document.querySelector('[data-testid="gallery-main-image"]');
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      })(),
      tableWidths: [...document.querySelectorAll('[data-testid="tour-approved-prices"] table')].map((table) => Math.ceil(table.getBoundingClientRect().width)),
    }));
    assert.ok(layout.documentWidth <= layout.viewportWidth, `${viewport.name}: horizontal overflow ${layout.documentWidth}>${layout.viewportWidth}`);
    assert.ok(layout.mainImageLoaded, `${viewport.name}: hero image loaded`);

    await page.screenshot({ path: path.join(outputDir, `${viewport.name}.png`) });
    assert.equal(await page.locator('[data-testid="tour-request"] form').count(), 0, `${viewport.name}: preview has no live reservation form`);

    results.push({ viewport: viewport.name, status: "PASS", ...layout, routeCards: 2, pricingTables: 2, cta: "canonical WhatsApp inquiry", liveSubmission: false });

    for (const locale of ["en", "es"]) {
      const localized = await page.goto(`${baseUrl}/${locale}/rebuild-lab/tour-content-preview/${tourId}?precos=ocultos`, { waitUntil: "domcontentloaded", timeout: 60000 });
      assert.equal(localized?.status(), 200, `${viewport.name}/${locale}: preview response`);
      const body = await page.locator("body").innerText();
      assert.doesNotMatch(body, /R\$\s*\d/, `${viewport.name}/${locale}: hidden prices in text`);
      assert.equal(await page.getByTestId("tour-approved-prices").count(), 0, `${viewport.name}/${locale}: hidden price table`);
      assert.ok(body.toLowerCase().includes(locale === "en" ? "draft" : "borrador"), `${viewport.name}/${locale}: owner review gate disclosed`);
      assert.ok(body.includes(locale === "en" ? "Rio Historic and Cultural Center" : "Centro Histórico y Cultural de Río"), `${viewport.name}/${locale}: localized tour title`);
      const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(width.document <= width.viewport, `${viewport.name}/${locale}: horizontal overflow`);
      results.push({ viewport: `${viewport.name}/${locale}`, status: "PASS", ...width, pricesHidden: true, routesVisible: (await page.getByTestId("centro-route-options").count()) === 1 });
    }

    await page.close();
  }

  assert.deepEqual(errors, [], `browser errors: ${errors.join(" | ")}`);
  fs.writeFileSync(path.join(outputDir, "results.json"), `${JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, results, browserErrors: errors }, null, 2)}\n`);
  console.log(JSON.stringify({ results, browserErrors: errors, outputDir }, null, 2));
} finally {
  await browser.close();
}
