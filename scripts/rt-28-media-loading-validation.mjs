/**
 * RT-28 validation — Hero media loading/preload/lazy-load architecture.
 *
 * Covers the 14 RT-28 acceptance checks: later media not loaded at initial state, Rio
 * ready before entry, Helicopter ready before 62%, Christ ready before 78%, mobile uses
 * the lighter derivative, saveData/reduced-motion never fetch cinematic media, a failed
 * request never produces a blank/broken frame, reverse/fast scroll remain valid, no
 * duplicate requests, no new console/page errors, no overflow, sticky always releases.
 *
 *   node scripts/rt-28-media-loading-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const origin = process.env.RT28_ORIGIN || "http://127.0.0.1:3218";
const outDir = path.resolve(process.env.RT28_OUT_DIR || ".tmp/rt-28-media-loading-review");
fs.mkdirSync(outDir, { recursive: true });

const ROUTE = "/pt";
const HOST = "[data-testid='globe-journey']";
const boundaries = [0, 0.12, 0.28, 0.44, 0.62, 0.78];
const expectedStage = p => boundaries.reduce((a, b, i) => p >= b ? i : a, 0);

const launchBrowser = () => chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
let browser = await launchBrowser();
const failures = [];
const evidence = {};
const check = (condition, message) => { if (!condition) failures.push(message); };

function watchWebp(page) {
  const requests = [];
  page.on("request", r => { if (r.url().endsWith(".webp")) requests.push({ url: r.url(), file: r.url().split("/").pop(), time: Date.now() }); });
  return requests;
}
function watchErrors(page, ignorePattern) {
  const errors = [];
  page.on("console", m => { if (m.type() === "error" && !(ignorePattern && ignorePattern.test(m.text()))) errors.push(`console: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  return errors;
}

async function open(contextOptions, setup, attempt = 1) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const requests = watchWebp(page);
  const errors = watchErrors(page, setup?.ignoreErrorPattern);
  try {
    if (setup?.route) await page.route(setup.route.pattern, setup.route.handler);
    if (setup?.emulateMedia) await page.emulateMedia(setup.emulateMedia);
    if (setup?.initScript) await page.addInitScript(setup.initScript);
    await page.goto(`${origin}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForSelector("[data-mode]", { timeout: 90000 });
    await page.waitForTimeout(400);
    return { context, page, requests, errors };
  } catch (error) {
    await context.close().catch(() => {});
    if (attempt >= 3) throw error;
    await browser.close();
    browser = await launchBrowser();
    return open(contextOptions, setup, attempt + 1);
  }
}

const dims = page => page.evaluate(() => {
  const r = document.querySelector("[data-runway]"), s = document.querySelector("[data-stage]");
  return { start: r.getBoundingClientRect().top + window.scrollY, distance: r.offsetHeight - s.offsetHeight };
});
const scrollTo = (page, d, p) => page.evaluate(({ start, distance, p }) =>
  window.scrollTo({ top: start + distance * p, left: 0, behavior: "instant" }), { ...d, p });

const snapshot = page => page.evaluate(sel => {
  const host = document.querySelector(sel);
  const stateOf = id => document.querySelector(`[data-scene='${id}'][data-layer='base']`)?.getAttribute("data-media-state") ?? null;
  return {
    progress: Number(host.getAttribute("data-progress")),
    state: Number(host.getAttribute("data-state")),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    rio: stateOf("rio"), flight: stateOf("flight"), finale: stateOf("finale"),
  };
}, HOST);

try {
  // Warm the dev compiler.
  { const { context } = await open({ viewport: { width: 1440, height: 900 } }); await context.close(); }

  // ---- #1-#4, #9, #10, #11, #12, #13, #14: full journey, request timing ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, requests, errors } = await open({ viewport: { width: 1440, height: 900 } });
    const d = await dims(page);
    // #1: nothing photographic loaded at initial state.
    check(requests.length === 0, `#1: media requested at initial load: ${JSON.stringify(requests.map(r => r.file))}`);

    for (const p of [0.1, 0.2, 0.29]) { await scrollTo(page, d, p); await page.waitForTimeout(150); }
    check(requests.length === 0, `#1: media requested before Rio's prepare threshold (0.30): ${JSON.stringify(requests.map(r => r.file))}`);

    // #2: Rio ready before entry (0.44).
    await scrollTo(page, d, 0.31); await page.waitForTimeout(300);
    check(requests.length === 1, `#2: Rio not requested at 0.31 (prepareAt 0.30): got ${requests.length}`);
    await scrollTo(page, d, 0.43); await page.waitForTimeout(300);
    let s = await snapshot(page);
    check(s.rio === "loaded", `#2: Rio not ready before its 0.44 entry: state=${s.rio}`);
    check(s.flight === null || s.flight === "idle", `#2: Helicopter requested too early: state=${s.flight}`);

    // #3: Helicopter ready before entry (0.58 first use / 0.62 boundary).
    await scrollTo(page, d, 0.49); await page.waitForTimeout(300);
    await scrollTo(page, d, 0.57); await page.waitForTimeout(300);
    s = await snapshot(page);
    check(s.flight === "loaded", `#3: Helicopter not ready before its 0.58 entry: state=${s.flight}`);
    check(s.finale === null || s.finale === "idle", `#3: Christ requested too early: state=${s.finale}`);

    // #4: Christ ready before entry (0.75 first use / 0.78 boundary).
    await scrollTo(page, d, 0.66); await page.waitForTimeout(300);
    await scrollTo(page, d, 0.74); await page.waitForTimeout(300);
    s = await snapshot(page);
    check(s.finale === "loaded", `#4: Christ not ready before its 0.75 entry: state=${s.finale}`);

    // #11: exactly one request per scene across the whole journey so far.
    const counts = requests.reduce((m, r) => (m[r.file] = (m[r.file] || 0) + 1, m), {});
    check(Object.values(counts).every(n => n === 1), `#11: duplicate media request(s): ${JSON.stringify(counts)}`);
    check(requests.length === 3, `#11: expected exactly 3 media requests total, got ${requests.length}: ${JSON.stringify(requests.map(r => r.file))}`);

    // Forward through the rest + #9 reverse + #10 fast scroll, all on the RT-16 contract.
    for (const p of [0.78, 0.9, 1]) {
      await scrollTo(page, d, p); await page.waitForTimeout(200);
      const st = await snapshot(page);
      check(st.state === expectedStage(p), `state mismatch forward at ${p}: ${st.state}`);
      check(!st.overflow, `#13: overflow at ${p}`);
    }
    // #14 sticky release
    const released = await page.evaluate(() => {
      const next = document.querySelector("section[id$='next']");
      return Boolean(next && next.getBoundingClientRect().top <= window.innerHeight + 20);
    });
    check(released, "#14: sticky section did not release at 100%");

    // #9 reverse scroll
    for (const p of [0.78, 0.44, 0.12, 0]) {
      await scrollTo(page, d, p); await page.waitForTimeout(200);
      const st = await snapshot(page);
      check(st.state === expectedStage(p), `#9: reverse scroll state mismatch at ${p}: ${st.state}`);
    }
    // No new requests should appear on reverse scroll (everything already loaded).
    check(requests.length === 3, `#11: reverse scroll caused extra media requests: ${requests.length}`);

    check(errors.length === 0, `#12: console/page errors: ${errors.join("; ")}`);
    await page.screenshot({ path: path.join(outDir, "desktop-loading.png") });
    evidence.timing = requests.map(r => r.file);
    await context.close();
  }

  // ---- #10 fast scroll: jump straight past every threshold in one go ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, requests, errors } = await open({ viewport: { width: 1440, height: 900 } });
    const d = await dims(page);
    for (const p of [1, 0.5, 1]) await scrollTo(page, d, p);
    await page.waitForTimeout(600);
    const s = await snapshot(page);
    check(s.state === expectedStage(1), `#10: fast scroll left stage out of sync: ${s.state}`);
    check(!s.overflow, "#10: overflow after fast scroll");
    const counts = requests.reduce((m, r) => (m[r.file] = (m[r.file] || 0) + 1, m), {});
    check(Object.values(counts).every(n => n === 1), `#11: duplicate requests after fast scroll: ${JSON.stringify(counts)}`);
    check(errors.length === 0, `#12: console/page errors on fast scroll: ${errors.join("; ")}`);
    await context.close();
  }

  // ---- #5: mobile uses the lighter derivative ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, requests, errors } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const d = await dims(page);
    for (const p of [0.35, 0.55, 0.72]) { await scrollTo(page, d, p); await page.waitForTimeout(300); }
    check(requests.length === 3, `#5: expected 3 mobile media requests, got ${requests.length}`);
    check(requests.every(r => r.file.startsWith("mobile.")), `#5: mobile viewport did not use the mobile derivative: ${JSON.stringify(requests.map(r => r.file))}`);
    const s = await snapshot(page);
    check(!s.overflow, "#13: overflow on mobile");
    check(errors.length === 0, `#12: console/page errors on mobile: ${errors.join("; ")}`);
    evidence.mobileRequests = requests.map(r => r.file);
    await context.close();
  }

  // ---- #6: saveData never loads cinematic media ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, requests, errors } = await open({ viewport: { width: 1440, height: 900 } }, {
      initScript: () => { try { Object.defineProperty(window.navigator, "connection", { value: { saveData: true }, configurable: true }); } catch { /* ignore */ } },
    });
    const mode = await page.evaluate(sel => document.querySelector(sel).getAttribute("data-mode"), HOST);
    check(mode === "static", `#6: saveData did not take the static path (${mode})`);
    check(requests.length === 0, `#6: saveData loaded cinematic media: ${JSON.stringify(requests.map(r => r.file))}`);
    check(errors.length === 0, `#12: console/page errors under saveData: ${errors.join("; ")}`);
    await context.close();
  }

  // ---- #7: reduced motion never loads cinematic/motion media ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, requests, errors } = await open({ viewport: { width: 1440, height: 900 } }, { emulateMedia: { reducedMotion: "reduce" } });
    const mode = await page.evaluate(sel => document.querySelector(sel).getAttribute("data-mode"), HOST);
    check(mode === "static", `#7: reduced motion did not take the static path (${mode})`);
    check(requests.length === 0, `#7: reduced motion loaded cinematic media: ${JSON.stringify(requests.map(r => r.file))}`);
    check(errors.length === 0, `#12: console/page errors under reduced motion: ${errors.join("; ")}`);
    await context.close();
  }

  // ---- #8: failed media request never produces a blank/broken frame ----
  await browser.close(); browser = await launchBrowser();
  {
    const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, {
      route: { pattern: "**/*.webp", handler: route => (/rio-aerial|rio-helicopter/.test(route.request().url()) ? route.abort("failed") : route.continue()) },
      ignoreErrorPattern: /net::ERR_FAILED/,
    });
    const d = await dims(page);
    for (const p of [0.5, 0.7, 1]) { await scrollTo(page, d, p); await page.waitForTimeout(300); }
    const s = await snapshot(page);
    check(s.rio === "failed" && s.flight === "failed", `#8: failed layers did not report failed state: rio=${s.rio}, flight=${s.flight}`);
    check(s.finale === "loaded", `#8: an unrelated (non-aborted) layer failed to load: ${s.finale}`);
    const bgOfFailed = await page.evaluate(() => getComputedStyle(document.querySelector("[data-scene='rio'][data-layer='base']")).backgroundImage);
    check(bgOfFailed === "none", `#8: a failed layer still shows a stale/broken background-image: ${bgOfFailed}`);
    check(s.state === expectedStage(1), `#8: journey progress broke under media failure: ${s.state}`);
    check(!s.overflow, "#8: overflow under media failure");
    // #12: only the expected net::ERR_FAILED resource-load messages, no thrown exceptions.
    check(errors.length === 0, `#12: unexpected console/page errors under media failure: ${errors.join("; ")}`);
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
  console.log(`PASS RT-28 media loading validation; evidence written to ${outDir}`);
}
