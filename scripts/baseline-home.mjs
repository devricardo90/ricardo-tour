/**
 * RT-RB-S0-05 (RT-9) - performance and screenshot baseline of the CURRENT public Home.
 *
 * Captures runtime evidence from a production build so later rebuild work has a
 * fixed point of comparison. Measurement only: it renders the existing Home and
 * records what it observes. It changes no application behaviour, is not imported
 * by the app, and is not part of any build.
 *
 * Usage:
 *   npm run build
 *   npx next start -p 3200
 *   node scripts/baseline-home.mjs --base-url http://127.0.0.1:3200
 *
 * Outputs metrics.json + PNG screenshots into docs/baseline/rt-9-current-home/.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE_URL = argOf("--base-url", "http://127.0.0.1:3200").replace(/\/$/, "");
const OUT_DIR = argOf("--out", "docs/baseline/rt-9-current-home");
const RUNS = Number(argOf("--runs", "3"));
const SETTLE_MS = 3000;

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

/** Metric targets: locale x viewport. runs > 1 reports a median. */
const TARGETS = [
  { locale: "pt", viewport: "desktop", runs: RUNS, shots: ["fold", "full"] },
  { locale: "pt", viewport: "mobile", runs: RUNS, shots: ["fold", "full"] },
  { locale: "pt", viewport: "tablet", runs: 1, shots: ["fold", "full"] },
  { locale: "en", viewport: "desktop", runs: 1, shots: ["fold"] },
  { locale: "es", viewport: "desktop", runs: 1, shots: ["fold"] },
  { locale: "sv", viewport: "desktop", runs: 1, shots: ["fold"] },
];

const median = (xs) => {
  const s = xs.filter((x) => typeof x === "number" && !Number.isNaN(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/**
 * Installed before navigation so LCP and CLS are observed from the first frame.
 * Runs inside the page.
 */
function installObservers() {
  window.__cls = 0;
  window.__lcp = 0;
  window.__lcpEl = null;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__lcp = e.startTime;
        const el = e.element;
        if (el) {
          const cls = typeof el.className === "string" && el.className.trim()
            ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
            : "";
          window.__lcpEl = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + cls;
        }
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* observer unsupported in this browser */ }
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) window.__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch { /* observer unsupported in this browser */ }
}

/** Reads Navigation Timing, paint, LCP and CLS. Runs inside the page. */
function readMetrics() {
  const nav = performance.getEntriesByType("navigation")[0] || {};
  const paint = {};
  for (const e of performance.getEntriesByType("paint")) paint[e.name] = Math.round(e.startTime);
  return {
    ttfbMs: nav.responseStart ? Math.round(nav.responseStart - nav.requestStart) : null,
    domContentLoadedMs: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : null,
    loadEventMs: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : null,
    firstPaintMs: paint["first-paint"] != null ? paint["first-paint"] : null,
    firstContentfulPaintMs: paint["first-contentful-paint"] != null ? paint["first-contentful-paint"] : null,
    largestContentfulPaintMs: window.__lcp ? Math.round(window.__lcp) : null,
    largestContentfulPaintElement: window.__lcpEl || null,
    cumulativeLayoutShift: window.__cls != null ? Number(window.__cls.toFixed(4)) : null,
    domNodes: document.getElementsByTagName("*").length,
    imgElements: document.images.length,
    scriptElements: document.scripts.length,
    documentTitle: document.title,
    htmlLang: document.documentElement.lang,
    pageHeightPx: document.documentElement.scrollHeight,
  };
}

async function measureOnce(browser, url, viewport, opts) {
  const options = opts || {};
  const shots = options.shots || [];
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(installObservers);

  // CDP gives authoritative on-the-wire byte counts, including the document itself.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  const byId = new Map();
  cdp.on("Network.requestWillBeSent", (e) => {
    byId.set(e.requestId, { url: e.request.url, type: e.type, bytes: 0, status: null });
  });
  cdp.on("Network.responseReceived", (e) => {
    const r = byId.get(e.requestId);
    if (r) {
      r.type = e.type || r.type;
      r.status = e.response.status;
      r.mimeType = e.response.mimeType;
    }
  });
  cdp.on("Network.loadingFinished", (e) => {
    const r = byId.get(e.requestId);
    if (r) r.bytes = e.encodedDataLength || 0;
  });

  const response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
  const httpStatus = response ? response.status() : null;
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch { /* idle not reached; the settle wait below still applies */ }
  await page.waitForTimeout(SETTLE_MS);

  const metrics = await page.evaluate(readMetrics);

  const requests = Array.from(byId.values()).filter((r) => r.status !== null);
  const byType = {};
  let totalBytes = 0;
  for (const r of requests) {
    const t = (r.type || "Other").toLowerCase();
    if (!byType[t]) byType[t] = { requests: 0, bytes: 0 };
    byType[t].requests += 1;
    byType[t].bytes += r.bytes;
    totalBytes += r.bytes;
  }
  const heaviest = requests
    .slice()
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)
    .map((r) => ({ bytes: r.bytes, type: r.type, status: r.status, url: r.url.replace(BASE_URL, "") }));

  const screenshots = {};

  // Above-the-fold shot is taken first, before any scrolling, so it reflects
  // exactly what a visitor sees on arrival.
  if (options.screenshotBase && shots.includes("fold")) {
    const f = options.screenshotBase + "-fold.png";
    await page.screenshot({ path: path.join(OUT_DIR, f), fullPage: false });
    screenshots.fold = f;
  }

  // The Home wraps sections in FadeInSection (motion `whileInView`, initial
  // opacity 0), so a full-page screenshot taken without scrolling captures
  // those sections invisible. Scrolling through first lets the in-view
  // animations settle, so the full-page shot shows the real rendered Home.
  // This runs AFTER metrics are read, so it cannot pollute CLS or load timings.
  if (options.screenshotBase && shots.includes("full")) {
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      const total = document.documentElement.scrollHeight;
      for (let y = 0; y < total; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, total);
      await new Promise((r) => setTimeout(r, 600));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.waitForTimeout(800);
    const f = options.screenshotBase + "-full.png";
    await page.screenshot({ path: path.join(OUT_DIR, f), fullPage: true });
    screenshots.full = f;
  }

  await context.close();

  return Object.assign({}, metrics, {
    httpStatus,
    totalRequests: requests.length,
    totalTransferBytes: totalBytes,
    byType,
    heaviest,
    screenshots,
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const t of TARGETS) {
    const url = BASE_URL + "/" + t.locale;
    const viewport = VIEWPORTS[t.viewport];
    const base = "home-" + t.locale + "-" + t.viewport;
    process.stdout.write("measuring " + url + " @ " + t.viewport + " (" + t.runs + " run(s))\n");

    const runs = [];
    for (let i = 0; i < t.runs; i++) {
      const opts = i === 0 ? { screenshotBase: base, shots: t.shots } : {};
      runs.push(await measureOnce(browser, url, viewport, opts));
    }
    const first = runs[0];
    const clsSorted = runs.map((r) => r.cumulativeLayoutShift).sort((a, b) => a - b);

    results.push({
      route: "/" + t.locale,
      locale: t.locale,
      viewport: t.viewport,
      viewportPx: viewport,
      runs: t.runs,
      httpStatus: first.httpStatus,
      documentTitle: first.documentTitle,
      htmlLang: first.htmlLang,
      medians: {
        ttfbMs: median(runs.map((r) => r.ttfbMs)),
        firstContentfulPaintMs: median(runs.map((r) => r.firstContentfulPaintMs)),
        largestContentfulPaintMs: median(runs.map((r) => r.largestContentfulPaintMs)),
        domContentLoadedMs: median(runs.map((r) => r.domContentLoadedMs)),
        loadEventMs: median(runs.map((r) => r.loadEventMs)),
        cumulativeLayoutShift: clsSorted[Math.floor(runs.length / 2)],
        totalTransferBytes: median(runs.map((r) => r.totalTransferBytes)),
        totalRequests: median(runs.map((r) => r.totalRequests)),
      },
      perRun: runs.map((r) => ({
        ttfbMs: r.ttfbMs,
        fcpMs: r.firstContentfulPaintMs,
        lcpMs: r.largestContentfulPaintMs,
        cls: r.cumulativeLayoutShift,
        loadMs: r.loadEventMs,
        totalTransferBytes: r.totalTransferBytes,
        totalRequests: r.totalRequests,
      })),
      lcpElement: first.largestContentfulPaintElement,
      domNodes: first.domNodes,
      imgElements: first.imgElements,
      scriptElements: first.scriptElements,
      pageHeightPx: first.pageHeightPx,
      byType: first.byType,
      heaviestRequests: first.heaviest,
      screenshots: first.screenshots,
    });
  }

  await browser.close();

  const payload = {
    task: "RT-9 / RT-RB-S0-05",
    subject: "current public Home",
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    environment: {
      nodeEnv: "production",
      buildCommand: "next build --webpack",
      serveCommand: "next start",
      note: "AI_CONCIERGE_ENABLED and REBUILD_LAB_ENABLED left unset; both default to disabled in production.",
    },
    settleMs: SETTLE_MS,
    screenshotMethod: {
      fold: "captured on arrival, before any scrolling",
      full: "captured after a scroll-through pass so FadeInSection (motion whileInView, initial opacity 0) sections are settled; taken after metrics were read, so load timings and CLS are unaffected",
    },
    results,
  };
  writeFileSync(path.join(OUT_DIR, "metrics.json"), JSON.stringify(payload, null, 2) + "\n", "utf8");
  process.stdout.write("\nwrote " + path.join(OUT_DIR, "metrics.json") + "\n");
}

main();
