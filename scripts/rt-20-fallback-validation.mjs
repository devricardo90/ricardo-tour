/**
 * RT-20 validation — mobile fallback + prefers-reduced-motion on Version C.
 *
 * RT-20 is an audit-and-close ticket: RT-17/RT-19 already built most of this fallback
 * architecture (static branch for reduced-motion/data-saver, WebGL-unavailable static
 * globe, touch excluded from pointer parallax). This script proves the one real gap
 * found — a frozen "0% / stage 1" readout shown outside motion mode — is fixed, and
 * exercises the fallback matrix (A-G) end to end so the fix has real evidence.
 *
 *   node scripts/rt-20-fallback-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const origin = process.env.RT20_ORIGIN || "http://127.0.0.1:3218";
const outDir = path.resolve(process.env.RT20_OUT_DIR || ".tmp/rt-20-fallback-review");
fs.mkdirSync(outDir, { recursive: true });

const ROUTE = "/pt";
const HOST = "[data-testid='globe-journey']";
const boundaries = [0, 0.12, 0.28, 0.44, 0.62, 0.78];
const expectedStage = p => boundaries.reduce((active, boundary, index) => p >= boundary ? index : active, 0);

const launchBrowser = () => chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
let browser = await launchBrowser();
const failures = [];
const evidence = {};
const check = (condition, message) => { if (!condition) failures.push(message); };

function watch(page) {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  return errors;
}

// Forces WebGL2 unavailable before any script on the page runs, so createGlobe() takes
// its documented null path instead of the real SwiftShader context.
function disableWebgl2() {
  var proto = window.HTMLCanvasElement.prototype;
  var original = proto.getContext;
  proto.getContext = function (type) {
    if (type === "webgl2") return null;
    return original.apply(this, arguments);
  };
}

function forceSaveData() {
  try {
    Object.defineProperty(window.navigator, "connection", { value: { saveData: true }, configurable: true });
  } catch { /* some engines expose connection as non-configurable; addInitScript still runs before app code either way. */ }
}

// SwiftShader/dev-server hydration can stall unpredictably under sustained sequential
// load (see scripts/rt-19-pointer-parallax-validation.mjs); one retry with a fresh
// browser absorbs that without masking a real regression, since a genuine break in the
// fallback code would fail identically on the retry too.
async function open(contextOptions, opts = {}, attempt = 1) {
  const { reducedMotion, webglUnavailable, saveData } = opts;
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = watch(page);
  try {
    if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    if (webglUnavailable) await page.addInitScript(disableWebgl2);
    if (saveData) await page.addInitScript(forceSaveData);
    await page.goto(`${origin}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForSelector("[data-mode='motion'], [data-mode='static']", { timeout: 60000 });
    // RT-45: in motion mode the globe textures load asynchronously (worker); until then data-webgl is unset and the
    // static frame shows. Wait for the outcome (ready | unavailable) before snapshotting.
    await page.waitForFunction(() => { const h = document.querySelector("[data-testid='globe-journey']"); return h && (h.dataset.mode === "static" || h.dataset.webgl); }, null, { timeout: 60000 });
    await page.waitForTimeout(400);
    return { context, page, errors };
  } catch (error) {
    await context.close().catch(() => {});
    if (attempt >= 3) throw error;
    await browser.close();
    browser = await launchBrowser();
    return open(contextOptions, opts, attempt + 1);
  }
}

const snapshot = page => page.evaluate(selector => {
  const host = document.querySelector(selector);
  const runway = document.querySelector("[data-runway]");
  const stage = document.querySelector("[data-stage]");
  const readout = host.querySelector("[data-journey-progress]")?.closest("div")?.previousElementSibling
    || document.querySelector("output")?.closest("div");
  const bar = host.querySelector("[data-journey-progress]");
  const staticGlobe = host.querySelector("[data-static-globe]");
  const globeCanvas = host.querySelector("[data-globe-canvas]");
  return {
    mode: host.getAttribute("data-mode"),
    webgl: host.getAttribute("data-webgl"),
    pointerDepth: host.getAttribute("data-pointer-depth"),
    progress: Number(host.getAttribute("data-progress")),
    state: Number(host.getAttribute("data-state")),
    stagePosition: getComputedStyle(stage).position,
    runwayHeight: runway.getBoundingClientRect().height,
    stageHeight: stage.getBoundingClientRect().height,
    progressBarVisible: Boolean(bar) && getComputedStyle(bar).display !== "none",
    progressBarInA11yTree: Boolean(bar) && bar.offsetParent !== null,
    readoutVisible: readout ? getComputedStyle(readout).display !== "none" : null,
    staticGlobeVisible: staticGlobe ? getComputedStyle(staticGlobe).display !== "none" : null,
    globeCanvasVisible: globeCanvas ? getComputedStyle(globeCanvas.parentElement).display !== "none" : null,
    // CSS Modules hash class names, so the fallback note is located by its known PT
    // copy (this script always loads the /pt/ route) rather than a literal ".fallbackNote".
    fallbackNoteVisible: Array.from(host.querySelectorAll("p")).some(p =>
      p.textContent.includes("vista estática da jornada") && getComputedStyle(p).display !== "none"),
    nextReachable: Boolean(document.querySelector("section[id$='next']")),
    // The static six-stage list now sits in the rail's place inside the stage.
    labelCount: document.querySelectorAll("[data-stage-list] li").length,
    labelsVisible: [...document.querySelectorAll("[data-stage-list] li")].every(li => li.getClientRects().length > 0),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
}, HOST);

const dims = page => page.evaluate(() => {
  const runway = document.querySelector("[data-runway]");
  const stage = document.querySelector("[data-stage]");
  return { start: runway.getBoundingClientRect().top + window.scrollY, distance: runway.offsetHeight - stage.offsetHeight };
});
const scrollTo = (page, d, p) => page.evaluate(({ start, distance, p }) =>
  window.scrollTo({ top: start + distance * p, left: 0, behavior: "instant" }), { ...d, p });

try {
  // Warm the dev compiler.
  { const { context } = await open({ viewport: { width: 1440, height: 900 } }); await context.close(); }

  // ---- A. Desktop + normal motion + WebGL ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } });
    const d = await dims(page);
    const s0 = await snapshot(page);
    check(s0.mode === "motion" && s0.webgl === "ready", `A: expected motion+ready, got ${s0.mode}/${s0.webgl}`);
    check(s0.fallbackNoteVisible === false, "A: fallback note wrongly shown while WebGL is ready");
    check(s0.labelCount === 6 && !s0.labelsVisible, "A: static six-stage list should be hidden while the rail is shown");
    check(s0.progressBarVisible && s0.readoutVisible !== false, "A: progress rail should be visible in full motion mode");
    for (const p of [0, 0.12, 0.44, 0.78, 1]) {
      await scrollTo(page, d, p);
      await page.waitForTimeout(200);
      const s = await snapshot(page);
      check(s.state === expectedStage(p), `A: stage mismatch at ${p} (${s.state})`);
      check(!s.overflow, `A: overflow at ${p}`);
    }
    check(errors.length === 0, `A: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "A-desktop-motion.png") });
    evidence.A = { ...s0 };
    await context.close();
  }

  // ---- B. Desktop + prefers-reduced-motion ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, { reducedMotion: true });
    const s = await snapshot(page);
    check(s.mode === "static", `B: expected static mode, got ${s.mode}`);
    check(s.fallbackNoteVisible === false, "B: fallback note wrongly shown under reduced motion (staticNote already covers this)");
    check(s.stagePosition !== "sticky", `B: stage still sticky under reduced motion (${s.stagePosition})`);
    check(Math.abs(s.runwayHeight - s.stageHeight) < 4, `B: runway is not collapsed to a single frame (${s.runwayHeight} vs ${s.stageHeight})`);
    check(!s.progressBarVisible, "B: fake frozen progress bar is still visible under reduced motion");
    check(s.readoutVisible === false, "B: frozen readout ('0% / stage 1') is still visible under reduced motion");
    check(s.nextReachable && s.labelCount === 6 && s.labelsVisible, "B: six-stage list not reachable/visible as the accessible equivalent");
    check(!s.overflow, "B: overflow under reduced motion");
    check(errors.length === 0, `B: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "B-desktop-reduced-motion.png") });
    evidence.B = s;
    await context.close();
  }

  // ---- C. Mobile/touch + normal motion ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const d = await dims(page);
    const finePointer = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
    check(finePointer === false, "C: a touch device reported a fine hover pointer");
    const before = await snapshot(page);
    check(before.mode === "motion", `C: mobile lost motion mode (${before.mode})`);
    check(before.fallbackNoteVisible === false, "C: fallback note wrongly shown while WebGL is ready on mobile");
    check(before.pointerDepth === null, "C: pointer depth enabled on a touch device");
    await page.touchscreen.tap(200, 600);
    await page.waitForTimeout(300);
    const tapped = await snapshot(page);
    check(tapped.progress === before.progress && tapped.state === before.state, "C: a tap moved the journey");
    for (const p of [0, 0.12, 0.28, 0.62, 1]) {
      await scrollTo(page, d, p);
      await page.waitForTimeout(200);
      const s = await snapshot(page);
      check(s.state === expectedStage(p), `C: mobile stage mismatch at ${p} (${s.state})`);
      check(s.progressBarVisible, `C: progress rail hidden in mobile motion mode at ${p}`);
      check(!s.overflow, `C: mobile overflow at ${p}`);
    }
    check(errors.length === 0, `C: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "C-mobile-motion.png") });
    evidence.C = tapped;
    await context.close();
  }

  // ---- D. Mobile + prefers-reduced-motion ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { reducedMotion: true });
    const s = await snapshot(page);
    check(s.mode === "static", `D: expected static mode, got ${s.mode}`);
    check(s.fallbackNoteVisible === false, "D: fallback note wrongly shown on mobile reduced motion");
    check(!s.progressBarVisible && s.readoutVisible === false, "D: frozen progress rail visible on mobile reduced motion");
    check(s.nextReachable && s.labelCount === 6 && s.labelsVisible, "D: six-stage list not reachable/visible on mobile reduced motion");
    check(!s.overflow, "D: overflow on mobile reduced motion");
    check(errors.length === 0, `D: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "D-mobile-reduced-motion.png") });
    evidence.D = s;
    await context.close();
  }

  // ---- E. WebGL unavailable ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, { webglUnavailable: true });
    const d = await dims(page);
    const s0 = await snapshot(page);
    check(s0.mode === "motion", `E: timeline should still run without WebGL (${s0.mode})`);
    check(s0.webgl === "unavailable", `E: expected data-webgl=unavailable, got ${s0.webgl}`);
    check(s0.staticGlobeVisible === true, "E: static SVG globe not shown when WebGL is unavailable");
    check(s0.globeCanvasVisible === false, "E: WebGL canvas layer still visible with no context");
    check(s0.fallbackNoteVisible === true, "E: fallback note not shown when WebGL is unavailable");
    for (const p of [0, 0.12, 0.44, 1]) {
      await scrollTo(page, d, p);
      await page.waitForTimeout(200);
      const s = await snapshot(page);
      check(s.state === expectedStage(p), `E: journey progress broke without WebGL at ${p} (${s.state})`);
    }
    check(!(await snapshot(page)).overflow, "E: overflow without WebGL");
    check(errors.length === 0, `E: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "E-webgl-unavailable.png") });
    evidence.E = s0;
    await context.close();
  }

  // ---- F. Data saver ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, { saveData: true });
    const s = await snapshot(page);
    check(s.mode === "static", `F: data saver did not take the intentional static path (${s.mode})`);
    check(s.fallbackNoteVisible === false, "F: fallback note wrongly shown under data saver");
    check(!s.progressBarVisible, "F: frozen progress rail visible under data saver");
    check(!s.overflow, "F: overflow under data saver");
    check(errors.length === 0, `F: console/page errors ${errors.join("; ")}`);
    evidence.F = s;
    await context.close();
  }

  // ---- G. Touch/coarse pointer independent of viewport width ----
  await browser.close(); browser = await launchBrowser();
  {
    // A desktop-sized viewport with only touch input: capability, not width, must gate
    // pointer depth. isMobile is intentionally left false.
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 }, hasTouch: true });
    const finePointer = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
    check(finePointer === false, "G: a large touch-capable viewport reported a fine hover pointer");
    const s = await snapshot(page);
    check(s.pointerDepth === null, "G: pointer depth enabled on a coarse pointer at desktop width");
    check(s.fallbackNoteVisible === false, "G: fallback note wrongly shown while WebGL is ready");
    check(errors.length === 0, `G: console/page errors ${errors.join("; ")}`);
    evidence.G = { finePointer, ...s };
    await context.close();
  }

  // ---- Extra responsive widths: 360x800 (small mobile), 768x1024 (tablet) ----
  await browser.close(); browser = await launchBrowser();
  for (const viewport of [{ width: 360, height: 800 }, { width: 768, height: 1024 }]) {
    const { context, page, errors } = await open({ viewport, isMobile: viewport.width < 768, hasTouch: true });
    const d = await dims(page);
    for (const p of [0, 0.44, 1]) {
      await scrollTo(page, d, p);
      await page.waitForTimeout(200);
      const s = await snapshot(page);
      check(!s.overflow, `width ${viewport.width}: overflow at ${p}`);
      check(s.state === expectedStage(p), `width ${viewport.width}: stage mismatch at ${p} (${s.state})`);
    }
    check(errors.length === 0, `width ${viewport.width}: console/page errors ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, `width-${viewport.width}.png`) });
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, "validation.json"), JSON.stringify({ date: new Date().toISOString(), origin, evidence, failures }, null, 2));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS RT-20 fallback matrix (A-G) + 360/768 widths; evidence written to ${outDir}`);
}
