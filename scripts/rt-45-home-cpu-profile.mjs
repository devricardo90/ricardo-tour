// RT-45: attribute Home main-thread time. Loads a page in headless Chromium (Pixel 7 emulation, 4x CPU throttle like
// Lighthouse mobile), records a V8 sampling CPU profile for the first N seconds, and reports self time per function
// (url:line:col, so minified frames can be located in the built chunk), long tasks, and the WebGL renderer in use.
// Usage: node scripts/rt-45-home-cpu-profile.mjs <url> <out.json> [seconds=10] [throttle=4]
import fs from "node:fs";
import { chromium, devices } from "@playwright/test";

const [url = "http://127.0.0.1:3200/pt", out = ".tmp/home-cpu-profile.json", secArg = "10", thrArg = "4"] = process.argv.slice(2);
// PROFILE_GPU=1 asks headless Chromium for the host GPU (ANGLE/D3D11) instead of SwiftShader, to separate lab-only
// software-rendering cost from what a device with a GPU pays. The renderer actually used is recorded either way.
const gpuArgs = process.env.PROFILE_GPU === "1" ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-unsafe-swiftshader=false"] : [];
const browser = await chromium.launch({ headless: true, args: gpuArgs });
const context = await browser.newContext({ ...devices["Pixel 7"] });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(thrArg) });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
await page.addInitScript(() => {
  window.__longTasks = [];
  window.__lcp = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? e.element.tagName + (e.element.className ? "." + String(e.element.className).slice(0, 40) : "") : null, url: e.url || null }))).observe({ type: "largest-contentful-paint", buffered: true });
  window.__fonts = [];
  document.fonts?.addEventListener?.("loadingdone", (ev) => window.__fonts.push({ t: Math.round(performance.now()), n: ev.fontfaces.length }));
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longTasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) }))).observe({ type: "longtask", buffered: true });
});
await cdp.send("Profiler.start");
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(Number(secArg) * 1000);
const { profile } = await cdp.send("Profiler.stop");
const longTasks = await page.evaluate(() => window.__longTasks);
const lcp = await page.evaluate(() => window.__lcp);
const fonts = await page.evaluate(() => window.__fonts);
const renderer = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return "no-webgl2";
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
});
const heroState = await page.evaluate(() => { const el = document.querySelector("[data-webgl]"); return el ? { webgl: el.getAttribute("data-webgl"), mode: el.getAttribute("data-mode") } : null; });

// Self time per node = samples * interval; aggregate by function identity.
const dt = new Map();
profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) ?? 0) + (profile.timeDeltas[i + 1] ?? 0)));
const byFn = new Map();
let total = 0;
for (const n of profile.nodes) {
  const t = (dt.get(n.id) ?? 0) / 1000; total += t;
  const f = n.callFrame;
  const key = `${f.functionName || "(anonymous)"} ${f.url.replace(/^.*\/_next\//, "_next/")}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
  byFn.set(key, (byFn.get(key) ?? 0) + t);
}
const top = [...byFn].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, ms]) => ({ fn: k, selfMs: Math.round(ms) }));
const byUrl = new Map();
for (const n of profile.nodes) { const u = n.callFrame.url.replace(/^.*\/_next\//, "_next/") || n.callFrame.functionName; byUrl.set(u, (byUrl.get(u) ?? 0) + (dt.get(n.id) ?? 0) / 1000); }
const result = {
  url, gpuRequested: process.env.PROFILE_GPU === "1", seconds: Number(secArg), cpuThrottle: Number(thrArg), device: "Pixel 7", renderer, heroState,
  totalSampledMs: Math.round(total), lcp, fonts, longTasks, longTaskTotalMs: longTasks.reduce((a, t) => a + t.dur, 0),
  blockingMs: longTasks.reduce((a, t) => a + Math.max(0, t.dur - 50), 0),
  topSelf: top, byUrl: [...byUrl].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([u, ms]) => ({ url: u, selfMs: Math.round(ms) })),
};
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ renderer, heroState, lcp, fonts, longTaskTotalMs: result.longTaskTotalMs, blockingMs: result.blockingMs, longest: [...longTasks].sort((a, b) => b.dur - a.dur).slice(0, 5) }, null, 1));
await browser.close();
