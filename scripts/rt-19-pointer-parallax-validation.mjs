/**
 * RT-19 validation — subtle initial pointer parallax on Version C.
 *
 * Proves that pointer input is visual depth only: it moves the rendered camera and the
 * star field by a bounded amount during the Globe hold, fades out with scroll, returns
 * to neutral on leave, and never changes scroll progress, stage or the RT-18 rail.
 * Uses the same browser flags as scripts/rt-17-3d-poc-validation.mjs.
 *
 *   node scripts/rt-19-pointer-parallax-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const origin = process.env.RT19_ORIGIN || "http://127.0.0.1:3218";
const outDir = path.resolve(process.env.RT19_OUT_DIR || ".tmp/rt-19-pointer-parallax-review");
fs.mkdirSync(outDir, { recursive: true });

const ROUTE = "/pt/rebuild-lab/cinematic-3d-poc";
const HOST = "[data-testid='globe-journey']";
const MAX_STARS = { x: 6, y: 4 };
const boundaries = [0, 0.12, 0.28, 0.44, 0.62, 0.78];
const expectedStage = p => boundaries.reduce((active, boundary, index) => p >= boundary ? index : active, 0);

const launchBrowser = () => chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
// A fresh browser per block, as in the RT-17 runner: SwiftShader can retain readback work
// from a screenshot-heavy block and stall hydration of the next page.
let browser = await launchBrowser();
const failures = [];
const report = {};
const check = (condition, message) => { if (!condition) failures.push(message); };

function watch(page) {
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  return errors;
}

async function open(contextOptions, reducedMotion) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = watch(page);
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForSelector("[data-mode='motion'], [data-mode='static']", { timeout: 120000 });
  await page.waitForFunction(() => {
    const runway = document.querySelector("[data-runway]");
    const stage = document.querySelector("[data-stage]");
    const host = document.querySelector("[data-testid='globe-journey']");
    return host?.getAttribute("data-mode") === "static" || Boolean(runway && stage && runway.offsetHeight - stage.offsetHeight > 100);
  }, null, { timeout: 20000 });
  await page.waitForTimeout(400);
  const dims = await page.evaluate(() => {
    const runway = document.querySelector("[data-runway]");
    const stage = document.querySelector("[data-stage]");
    return { start: runway.getBoundingClientRect().top + window.scrollY, distance: runway.offsetHeight - stage.offsetHeight };
  });
  return { context, page, errors, dims };
}

const snapshot = page => page.evaluate(selector => {
  const host = document.querySelector(selector);
  const stars = host.querySelector("[data-layer='stars']");
  const marker = host.querySelector("[data-rio-marker]");
  const bar = host.querySelector("[data-journey-progress]");
  const [x = "0", y = "0"] = (stars.style.translate || "").split(" ");
  return {
    mode: host.getAttribute("data-mode"),
    webgl: host.getAttribute("data-webgl"),
    pointerDepth: host.getAttribute("data-pointer-depth"),
    progress: Number(host.getAttribute("data-progress")),
    state: Number(host.getAttribute("data-state")),
    railStage: Number(host.querySelector("[data-progress-step][data-status='current']")?.getAttribute("data-progress-step") ?? -1),
    railProgress: Number.parseFloat(bar?.style.getPropertyValue("--journey-progress") || "NaN") / 100,
    ariaNow: Number(bar?.getAttribute("aria-valuenow") ?? -1),
    readout: host.querySelector("output")?.textContent,
    scrollY: window.scrollY,
    starsX: Number.parseFloat(x) || 0,
    starsY: Number.parseFloat(y) || 0,
    marker: marker?.style.transform || "",
    markerVisible: marker?.getAttribute("data-visible"),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
}, HOST);

const scrollTo = (page, dims, p) => page.evaluate(({ start, distance, p }) =>
  window.scrollTo({ top: start + distance * p, left: 0, behavior: "instant" }), { ...dims, p });

const sameJourney = (a, b) => a.progress === b.progress && a.state === b.state && a.railStage === b.railStage
  && a.railProgress === b.railProgress && a.ariaNow === b.ariaNow && a.readout === b.readout && a.scrollY === b.scrollY;

try {
  // Warm up the dev compiler.
  { const { context } = await open({ viewport: { width: 1440, height: 900 } }); await context.close(); }

  // ---------------- Desktop, fine pointer ----------------
  {
    const { context, page, errors, dims } = await open({ viewport: { width: 1440, height: 900 } });
    await scrollTo(page, dims, 0);
    await page.mouse.move(720, 450);
    await page.waitForTimeout(1500);
    const neutral = await snapshot(page);
    await page.screenshot({ path: path.join(outDir, "desktop-000-centre.png") });
    check(neutral.webgl === "ready", `desktop: WebGL not exercised (${neutral.webgl})`);
    check(neutral.pointerDepth === "on", "desktop: pointer depth not enabled on a fine pointer");

    // TEST 1 / 2 / 3 — depth at the initial state without touching the journey.
    await page.mouse.move(1430, 890, { steps: 25 });
    await page.waitForTimeout(2500);
    const corner = await snapshot(page);
    await page.screenshot({ path: path.join(outDir, "desktop-000-corner.png") });
    await page.mouse.move(10, 60, { steps: 25 });
    await page.waitForTimeout(2500);
    const opposite = await snapshot(page);
    await page.screenshot({ path: path.join(outDir, "desktop-000-opposite.png") });
    report.initial = { neutral, corner, opposite };
    check(corner.starsX > 4 && corner.starsY > 2.5, `T1: no perceptible depth at corner (${corner.starsX}, ${corner.starsY})`);
    check(opposite.starsX < -4 && opposite.starsY < -2.5, `T1: no perceptible depth at opposite corner (${opposite.starsX}, ${opposite.starsY})`);
    check(corner.marker !== neutral.marker && opposite.marker !== corner.marker, "T1: rendered camera did not respond (Rio anchor unchanged)");
    for (const s of [corner, opposite]) {
      check(Math.abs(s.starsX) <= MAX_STARS.x + 1e-6 && Math.abs(s.starsY) <= MAX_STARS.y + 1e-6, `T1: offset exceeds bound (${s.starsX}, ${s.starsY})`);
      check(sameJourney(neutral, s), `T2/T3: pointer changed journey state ${JSON.stringify({ neutral, s })}`);
    }

    // Bounded / no accumulated drift: many circles, then back to centre == original neutral.
    for (let i = 0; i < 6; i += 1) {
      for (const [x, y] of [[1400, 100], [1400, 880], [40, 880], [40, 100]]) await page.mouse.move(x, y, { steps: 6 });
    }
    await page.mouse.move(720, 450, { steps: 20 });
    await page.waitForTimeout(3000);
    const recentred = await snapshot(page);
    check(Math.abs(recentred.starsX) < 0.05 && Math.abs(recentred.starsY) < 0.05, `T1: drift accumulated (${recentred.starsX}, ${recentred.starsY})`);
    check(sameJourney(neutral, recentred), "T2/T3: pointer circling changed journey state");

    // TEST 6 — leave the stage (into the review bar above it): smooth return to neutral.
    // The bar is only on screen at the very top of the page, still progress 0.
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await page.mouse.move(1430, 890, { steps: 20 });
    await page.waitForTimeout(2500);
    const beforeLeave = await snapshot(page);
    const barHeight = await page.evaluate(() => document.querySelector("[data-stage]").getBoundingClientRect().top);
    check(barHeight > 12 && beforeLeave.progress === 0, `T6: review bar not reachable (${barHeight})`);
    await page.mouse.move(1430, Math.floor(barHeight / 2));
    const leaveSamples = [];
    for (let i = 0; i < 12; i += 1) { leaveSamples.push((await snapshot(page)).starsX); await page.waitForTimeout(120); }
    await page.waitForTimeout(2500);
    const left = await snapshot(page);
    report.leave = { samples: leaveSamples, final: left };
    const decreasing = leaveSamples.every((v, i) => i === 0 || v <= leaveSamples[i - 1] + 1e-6);
    const intermediate = leaveSamples.some(v => v > 0.3 && v < 5.5);
    check(decreasing && intermediate, `T6: return to neutral is not smooth ${JSON.stringify(leaveSamples)}`);
    check(left.starsX === 0 && left.starsY === 0, `T6: did not settle at neutral (${left.starsX}, ${left.starsY})`);
    check(sameJourney(beforeLeave, left), "T6: leaving changed journey state");

    // TEST 4 / 5 — scroll authority with the pointer parked in a corner and moving.
    await page.mouse.move(1430, 890, { steps: 10 });
    await page.waitForTimeout(2000);
    const scroll = [];
    for (const p of [0.04, 0.1, 0.12, 0.2, 0.28, 0.44, 0.62, 0.78, 1, 0.62, 0.28, 0.1, 0]) {
      await scrollTo(page, dims, p);
      await page.waitForTimeout(250);
      const before = await snapshot(page);
      await page.mouse.move(40, 120, { steps: 8 });
      await page.mouse.move(1400, 860, { steps: 8 });
      await page.waitForTimeout(2200);
      const after = await snapshot(page);
      scroll.push({ p, before, after });
      check(sameJourney(before, after), `T4: pointer moved journey at ${p} ${JSON.stringify({ before, after })}`);
      check(Math.abs(after.progress - p) <= 0.01, `T4/T5: progress ${after.progress} != ${p}`);
      check(after.state === expectedStage(p) && after.railStage === after.state, `T9: rail stage ${after.railStage}/${after.state} at ${p}`);
      check(Math.abs(after.railProgress - after.progress) < 2e-5 && after.ariaNow === Math.round(after.progress * 100), `T9: rail progress out of sync at ${p}`);
      if (after.progress >= 0.12 - 1e-3) check(after.starsX === 0 && after.starsY === 0, `activation: influence not zero at ${p} (${after.starsX}, ${after.starsY})`);
      if (p === 0.1) check(after.starsX > 0.3 && after.starsX < 5.5, `activation: no gradual fade at 10% (${after.starsX})`);
      if (after.overflow) failures.push(`T10: overflow at ${p}`);
      if (p === 0.1 || p === 0.2) await page.screenshot({ path: path.join(outDir, `desktop-${String(Math.round(p * 100)).padStart(3, "0")}-corner.png`) });
    }
    report.scroll = scroll.map(({ p, after }) => ({ p, progress: after.progress, state: after.state, rail: after.railStage, starsX: after.starsX, starsY: after.starsY }));
    const back = scroll.at(-1).after;
    check(back.starsX > 4, `T5: depth did not return after reverse scroll to 0 (${back.starsX})`);
    report.desktopErrors = errors;
    check(errors.length === 0, `T10: desktop errors ${errors.join("; ")}`);
    await context.close();
  }

  // ---------------- Mobile, touch ----------------
  await browser.close();
  browser = await launchBrowser();
  {
    const { context, page, errors, dims } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const start = await snapshot(page);
    check(start.mode === "motion", `T7: mobile lost motion mode (${start.mode})`);
    check(start.pointerDepth === null, "T7: pointer depth enabled on a coarse/touch device");
    await page.touchscreen.tap(360, 800);
    await page.touchscreen.tap(30, 200);
    await page.waitForTimeout(1500);
    const tapped = await snapshot(page);
    check(tapped.starsX === 0 && tapped.starsY === 0 && tapped.marker === start.marker, "T7: touch produced parallax");
    check(sameJourney(start, tapped), "T7: taps changed journey state");
    const mobile = [];
    for (const p of [0, 0.12, 0.28, 0.44, 0.62, 0.78, 1, 0]) {
      await scrollTo(page, dims, p);
      await page.waitForTimeout(350);
      const s = await snapshot(page);
      mobile.push({ p, progress: s.progress, state: s.state, rail: s.railStage });
      check(Math.abs(s.progress - p) <= 0.01 && s.state === expectedStage(p) && s.railStage === s.state, `T7/T9: mobile sync at ${p}`);
      if (s.overflow) failures.push(`T10: mobile overflow at ${p}`);
    }
    report.mobile = mobile;
    check(errors.length === 0, `T10: mobile errors ${errors.join("; ")}`);
    await context.close();
  }

  // ---------------- Reduced motion ----------------
  await browser.close();
  browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, true);
    await page.mouse.move(720, 450);
    await page.mouse.move(1430, 890, { steps: 20 });
    await page.waitForTimeout(1500);
    const s = await snapshot(page);
    report.reduced = s;
    check(s.mode === "static", `T8: reduced motion not static (${s.mode})`);
    check(s.pointerDepth === null && s.starsX === 0 && s.starsY === 0, "T8: pointer depth active under reduced motion");
    if (s.overflow) failures.push("T10: reduced-motion overflow");
    check(errors.length === 0, `T10: reduced-motion errors ${errors.join("; ")}`);
    await context.close();
  }
} finally {
  await browser.close();
}

fs.writeFileSync(path.join(outDir, "validation.json"), JSON.stringify({ date: new Date().toISOString(), origin, report, failures }, null, 2));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS RT-19 pointer parallax (T1–T10); evidence written to ${outDir}`);
}
