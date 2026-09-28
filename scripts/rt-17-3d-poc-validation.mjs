/**
 * RT-17 Version C validation — compares Version B (2.5D layers) against Version C
 * (real WebGL 3D globe) at the same RT-16 checkpoints, then exercises the fallbacks.
 *
 * Mirrors scripts/rt-17-depth-poc-validation.mjs so the numbers are comparable. It does
 * not use the project's E2E globalSetup and never touches the database.
 *
 * Headless Chromium has no usable GPU here (see debug.log), so WebGL runs on SwiftShader.
 * If WebGL is nonetheless unavailable the run fails loudly rather than reporting a pass
 * that never exercised the 3D path.
 *
 *   node scripts/rt-17-3d-poc-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const origin = process.env.RT17_ORIGIN || "http://127.0.0.1:3218";
const outDir = path.resolve(process.env.RT17_OUT_DIR || ".tmp/rt-17-3d-poc-review");
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];
const locales = ["pt", "en", "es"];
const variants = [
  { name: "B-depth-poc", route: "cinematic-depth-poc", expect3d: false },
  { name: "C-3d-poc", route: "cinematic-3d-poc", expect3d: true },
];
const checkpoints = [0, 0.12, 0.28, 0.44, 0.62, 0.78, 1];
const JOURNEY = "[data-testid='depth-journey'],[data-testid='globe-journey']";

// Measured on this machine: --disable-gpu still yields a SwiftShader WebGL2 context while
// keeping page compositing fast (~1.4s per screenshot). Forcing --use-angle=swiftshader
// also works but composites the blurred/blended layers ~6x slower, which pushed
// screenshots past their timeout.
const launchBrowser = () => chromium.launch({
  args: ["--disable-gpu", "--enable-unsafe-swiftshader"],
});
const SHOT_TIMEOUT = 60000;
// The refined C globe uploads three authored texture layers and SwiftShader can still be
// draining a prior screenshot when the next page hydrates. This only widens the hydration
// wait; checkpoint, overflow, WebGL and fallback assertions remain unchanged.
const HYDRATION_TIMEOUT = 120000;
let browser = await launchBrowser();

const results = [];
const fallbacks = [];

async function newInstrumentedPage(viewport, options = {}) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    ...options,
  });
  await page.addInitScript(() => {
    window.__rt17LongTasks = [];
    if ("PerformanceObserver" in window) {
      try {
        new PerformanceObserver(list => {
          window.__rt17LongTasks.push(...list.getEntries().map(entry => entry.duration));
        }).observe({ type: "longtask", buffered: true });
      } catch { /* Long Task API is optional. */ }
    }
  });
  return page;
}

function watch(page) {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  return errors;
}

try {
  // Next's dev server compiles client chunks on the first real browser visit. Without a
  // warmup the first measured case races the compiler and times out waiting to hydrate.
  for (const variant of variants) {
    const warmup = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await warmup.goto(`${origin}/pt/rebuild-lab/${variant.route}`, { waitUntil: "domcontentloaded" });
    await warmup.waitForSelector("[data-mode='motion'], [data-mode='static']", { timeout: 120000 });
    await warmup.close();
  }

  for (const [viewportIndex, viewport] of viewports.entries()) {
    // Chromium's SwiftShader compositor can retain readback work from a screenshot-heavy
    // viewport. A fresh browser keeps desktop and mobile evidence independent without
    // changing the journey or any pass/fail assertion.
    if (viewportIndex > 0) {
      await browser.close();
      browser = await launchBrowser();
    }
    for (const locale of locales) {
      for (const variant of variants) {
        const page = await newInstrumentedPage(viewport);
        const errors = watch(page);
        const url = `${origin}/${locale}/rebuild-lab/${variant.route}`;
        const started = Date.now();
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForSelector("[data-mode='motion'], [data-mode='static']", { timeout: HYDRATION_TIMEOUT });
        await page.waitForTimeout(250);
        const navigationMs = Date.now() - started;

        const webgl = await page.evaluate(() => {
          const host = document.querySelector("[data-testid='globe-journey']");
          let supported = null;
          try {
            supported = Boolean(document.createElement("canvas").getContext("webgl2"));
          } catch { supported = false; }
          return { supported, mode: host ? host.getAttribute("data-webgl") : null };
        });

        const performanceReport = await page.evaluate(() => {
          const resources = performance.getEntriesByType("resource");
          return {
            transferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
            encodedBytes: resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
            longTaskCount: window.__rt17LongTasks?.length || 0,
            longTaskTotalMs: (window.__rt17LongTasks || []).reduce((sum, duration) => sum + duration, 0),
            jsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
          };
        });

        // Next's dev server can still be laying out when data-mode appears; measuring the
        // travel distance too early yields 0 and every checkpoint then reads as progress 0.
        await page.waitForFunction(() => {
          const runway = document.querySelector("[data-runway]");
          const stage = document.querySelector("[data-stage]");
          return Boolean(runway && stage && runway.offsetHeight - stage.offsetHeight > 100);
        }, null, { timeout: 20000 });
        await page.waitForTimeout(150);

        const dimensions = await page.evaluate(() => {
          const runway = document.querySelector("[data-runway]");
          const stage = document.querySelector("[data-stage]");
          return {
            start: runway ? runway.getBoundingClientRect().top + window.scrollY : 0,
            distance: runway && stage ? runway.offsetHeight - stage.offsetHeight : 0,
            section: runway?.offsetHeight || 0,
            stage: stage?.offsetHeight || 0,
          };
        });

        const checkpointsResult = [];
        for (const target of checkpoints) {
          await page.evaluate(({ start, distance, target }) => window.scrollTo({ top: start + distance * target, left: 0, behavior: "instant" }), { ...dimensions, target });
          await page.waitForTimeout(400);
          const state = await page.evaluate(selector => {
            const host = document.querySelector(selector);
            const marker = document.querySelector("[data-rio-marker]");
            return {
              progress: Number(host?.getAttribute("data-progress") || 0),
              state: Number(host?.getAttribute("data-state") ?? -1),
              indicatorStage: Number(host?.querySelector("[data-progress-step][data-status='current']")?.getAttribute("data-progress-step") ?? -1),
              indicatorProgress: Number.parseFloat(host?.querySelector("[data-journey-progress]")?.style.getPropertyValue("--journey-progress") || "NaN") / 100,
              indicatorValue: Number(host?.querySelector("[data-journey-progress]")?.getAttribute("aria-valuenow") ?? -1),
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
              rioMarkerVisible: marker ? marker.getAttribute("data-visible") === "true" : null,
              scrollY: window.scrollY,
            };
          }, JOURNEY);
          checkpointsResult.push({ target, ...state });
          if (locale === "pt") {
            await page.screenshot({
              path: path.join(outDir, `${viewport.name}-${variant.name}-${String(Math.round(target * 100)).padStart(3, "0")}.png`),
              fullPage: false,
              timeout: SHOT_TIMEOUT,
            });
          }
        }

        await page.evaluate(({ start, distance }) => window.scrollTo({ top: start + distance, left: 0, behavior: "instant" }), dimensions);
        await page.waitForTimeout(400);
        const end = await page.evaluate(selector => ({
          progress: Number(document.querySelector(selector)?.getAttribute("data-progress") || 0),
          scrollY: window.scrollY,
        }), JOURNEY);
        const release = await page.evaluate(() => {
          const next = document.querySelector("section[id$='next']");
          return Boolean(next && next.getBoundingClientRect().top <= window.innerHeight + 20);
        });
        if (locale === "pt") {
          await page.screenshot({ path: path.join(outDir, `${viewport.name}-${variant.name}-100.png`), fullPage: false, timeout: SHOT_TIMEOUT });
        }

        await page.evaluate(({ start }) => window.scrollTo({ top: start, left: 0, behavior: "instant" }), dimensions);
        await page.waitForTimeout(400);
        const reverse = await page.evaluate(selector => Number(document.querySelector(selector)?.getAttribute("data-progress") || 0), JOURNEY);

        // Rapidly jump across the same canonical bands, then ensure the visual rail has
        // settled on the active stage exposed by the cinematic timeline itself.
        for (const target of [0.78, 0.12, 0.62, 0.28, 1, 0.44, 0.62]) {
          await page.evaluate(({ start, distance, target }) => window.scrollTo({ top: start + distance * target, left: 0, behavior: "instant" }), { ...dimensions, target });
        }
        await page.waitForTimeout(250);
        const rapidSync = await page.evaluate(selector => {
          const host = document.querySelector(selector);
          const progress = Number(host?.getAttribute("data-progress") || 0);
          return {
            progress,
            state: Number(host?.getAttribute("data-state") ?? -1),
            indicatorStage: Number(host?.querySelector("[data-progress-step][data-status='current']")?.getAttribute("data-progress-step") ?? -1),
            indicatorProgress: Number.parseFloat(host?.querySelector("[data-journey-progress]")?.style.getPropertyValue("--journey-progress") || "NaN") / 100,
          };
        }, JOURNEY);

        results.push({ viewport, locale, variant: variant.name, expect3d: variant.expect3d, url, dimensions, navigationMs, webgl, performance: performanceReport, checkpoints: checkpointsResult, end, reverse, rapidSync, release, errors });
        await page.close();
      }
    }
  }

  // Fallback matrix: reduced motion, no JavaScript and the static release path.
  await browser.close();
  browser = await launchBrowser();
  for (const viewport of viewports) {
    for (const variant of variants) {
      // Keep each fallback pair independent too: reduced-motion and no-JS deliberately
      // exercise different browser execution modes, and neither needs a shared GPU state.
      await browser.close();
      browser = await launchBrowser();
      const reducedPage = await newInstrumentedPage(viewport);
      const reducedErrors = watch(reducedPage);
      await reducedPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedPage.goto(`${origin}/pt/rebuild-lab/${variant.route}`, { waitUntil: "domcontentloaded" });
      await reducedPage.waitForSelector("[data-mode='static']", { timeout: HYDRATION_TIMEOUT });
      const reduced = await reducedPage.evaluate(selector => ({
        mode: document.querySelector(selector)?.getAttribute("data-mode") || null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        nextReachable: Boolean(document.querySelector("section[id$='next']")),
        // Version C renders the static six-stage list in the rail's place ([data-stage-list]);
        // Version B still renders it in its next section. Both must total exactly 6.
        labelCount: document.querySelectorAll("[data-stage-list] li, section[id$='next'] ol li").length,
        labelsVisible: [...document.querySelectorAll("[data-stage-list] li, section[id$='next'] ol li")].every(li => li.getClientRects().length > 0),
      }), JOURNEY);
      fallbacks.push({ kind: "reduced-motion", viewport: viewport.name, variant: variant.name, ...reduced, errors: reducedErrors });
      await reducedPage.close();

      const noJsPage = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, javaScriptEnabled: false });
      const noJsErrors = watch(noJsPage);
      await noJsPage.goto(`${origin}/pt/rebuild-lab/${variant.route}`, { waitUntil: "domcontentloaded" });
      const noJs = await noJsPage.evaluate(selector => ({
        mode: document.querySelector(selector)?.getAttribute("data-mode") || null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        nextReachable: Boolean(document.querySelector("section[id$='next']")),
        labelCount: document.querySelectorAll("[data-stage-list] li, section[id$='next'] ol li").length,
        labelsVisible: [...document.querySelectorAll("[data-stage-list] li, section[id$='next'] ol li")].every(li => li.getClientRects().length > 0),
        headline: (document.querySelector("h1")?.textContent || "").replace(/\s+/g, " ").trim(),
      }), JOURNEY);
      fallbacks.push({ kind: "no-javascript", viewport: viewport.name, variant: variant.name, ...noJs, errors: noJsErrors });
      await noJsPage.close();
    }
  }
} finally {
  await browser.close();
}

const summary = { date: new Date().toISOString(), origin, viewports, locales, variants, checkpoints, results, fallbacks };
fs.writeFileSync(path.join(outDir, "validation.json"), JSON.stringify(summary, null, 2));

const failures = [];
for (const result of results) {
  const tag = `${result.variant} ${result.locale} ${result.viewport.name}`;
  if (result.errors.length) failures.push(`${tag}: ${result.errors.join("; ")}`);
  if (result.checkpoints.some(check => check.overflow)) failures.push(`${tag}: horizontal overflow`);
  for (const checkpoint of result.checkpoints) {
    if (Math.abs(checkpoint.progress - checkpoint.target) > 0.04) {
      failures.push(`${tag}: checkpoint ${Math.round(checkpoint.target * 100)}% mismatch (${checkpoint.progress})`);
    }
    const expectedStage = checkpoints.slice(0, -1).reduce((active, boundary, index) => checkpoint.target >= boundary ? index : active, 0);
    if (result.expect3d && (checkpoint.state !== expectedStage || checkpoint.indicatorStage !== expectedStage || Math.abs(checkpoint.indicatorProgress - checkpoint.progress) > 0.00002 || checkpoint.indicatorValue !== Math.round(checkpoint.progress * 100))) {
      failures.push(`${tag}: progress indicator mismatch at ${Math.round(checkpoint.target * 100)}% (stage ${checkpoint.indicatorStage}/${checkpoint.state}, expected ${expectedStage}, progress ${checkpoint.indicatorProgress}/${checkpoint.progress}, aria ${checkpoint.indicatorValue})`);
    }
  }
  if (result.expect3d && (result.rapidSync.indicatorStage !== result.rapidSync.state || Math.abs(result.rapidSync.indicatorProgress - result.rapidSync.progress) > 0.00002)) {
    failures.push(`${tag}: rapid scroll left progress indicator out of sync (${result.rapidSync.indicatorStage}/${result.rapidSync.state}, ${result.rapidSync.indicatorProgress}/${result.rapidSync.progress})`);
  }
  if (result.reverse > 0.03) failures.push(`${tag}: reverse scroll did not return to start (${result.reverse})`);
  if (!result.release) failures.push(`${tag}: sticky did not release to the next section`);
  if (result.expect3d && result.webgl.mode !== "ready") {
    failures.push(`${tag}: WebGL unavailable, 3D path NOT exercised (data-webgl=${result.webgl.mode}, context=${result.webgl.supported})`);
  }
}
for (const fallback of fallbacks) {
  const tag = `${fallback.kind} ${fallback.variant} ${fallback.viewport}`;
  if (fallback.errors.length) failures.push(`${tag}: ${fallback.errors.join("; ")}`);
  if (fallback.overflow) failures.push(`${tag}: horizontal overflow`);
  if (!fallback.nextReachable) failures.push(`${tag}: next section unreachable`);
  if (fallback.labelCount !== 6) failures.push(`${tag}: expected 6 labels, found ${fallback.labelCount}`);
  if (!fallback.labelsVisible) failures.push(`${tag}: six-stage labels present but not visible`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS ${results.length} comparison cases + ${fallbacks.length} fallback cases; evidence written to ${outDir}`);
}
