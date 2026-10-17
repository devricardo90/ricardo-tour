#!/usr/bin/env node
/**
 * RT-116: 4G validation of the Rocinha preview on a LOCAL production build (no publication needed).
 * Network profiles follow Chrome DevTools presets; mobile runs add a 4× CPU slowdown. For each profile and run:
 *  - page: TTFB, FCP, LCP, CLS, long-task time, transferred bytes, video bytes before play;
 *  - video (after play): start time (play → first frame), stalls ("waiting" after start) and stalled time,
 *    playback completed, bytes downloaded.
 * The local server has no CDN latency: absolute numbers are a lower bound for production.
 * Usage: node scripts/rt-116-video-perf.mjs http://localhost:3234 [runs]
 */
import fs from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3234";
const RUNS = Number(process.argv[3] ?? 2);
const URL = process.env.RT116_URL ?? `${BASE}/pt/rebuild-lab/tour-content-preview/cmli1a6im000034zqqzc9sppb`;
const mbps = (n) => (n * 1024 * 1024) / 8;
const PROFILES = [
  { name: "4G rápido (9 Mbps, 60 ms)", down: mbps(9), up: mbps(1.5), latency: 60, cpu: 4 },
  { name: "4G lento (1,6 Mbps, 150 ms)", down: mbps(1.6), up: mbps(0.75), latency: 150, cpu: 4 },
];

const WIDTH = Number(process.env.RT116_WIDTH ?? 390); // ≥ 768 makes the browser pick the full (desktop) clip
const ONLY = process.env.RT116_PROFILE; // "fast" | "slow" to run one profile
const browser = await chromium.launch();
const rows = [];
for (const profile of PROFILES.filter((p) => !ONLY || p.name.includes(ONLY === "slow" ? "lento" : "rápido"))) {
  for (let run = 1; run <= RUNS; run += 1) {
    const context = await browser.newContext({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: profile.latency, downloadThroughput: profile.down, uploadThroughput: profile.up });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    // Bytes on the wire per finished request (loadingFinished.encodedDataLength); video requests counted apart.
    const bytes = { total: 0, video: 0, videoRequests: 0 };
    const videoReq = new Set();
    cdp.on("Network.requestWillBeSent", (e) => { if (e.request.url.includes(".mp4")) { videoReq.add(e.requestId); bytes.videoRequests += 1; } });
    const account = (id, n) => { bytes.total += n; if (videoReq.has(id)) bytes.video += n; };
    cdp.on("Network.loadingFinished", (e) => account(e.requestId, e.encodedDataLength));
    // Media requests are often cancelled/replaced mid-stream: count what they received before failing.
    const partial = new Map();
    cdp.on("Network.dataReceived", (e) => { if (videoReq.has(e.requestId)) partial.set(e.requestId, (partial.get(e.requestId) ?? 0) + (e.encodedDataLength || 0)); });
    cdp.on("Network.loadingFailed", (e) => account(e.requestId, partial.get(e.requestId) ?? 0));
    await page.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, longTasks: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.longTasks += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(URL, { waitUntil: "load", timeout: 180_000 });
    await page.waitForTimeout(3000);
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      return { ttfb: n.responseStart, load: n.loadEventEnd, fcp: fcp?.startTime ?? 0, ...window.__m };
    });
    const pageBytes = bytes.total;
    const videoBeforePlay = bytes.video;

    // Video: press play like a visitor (tap on the player), then follow it to the end.
    const player = page.locator('[data-testid="tour-video-player"]');
    const hasVideo = (await player.count()) > 0;
    if (hasVideo) await player.scrollIntoViewIfNeeded();
    const video = !hasVideo ? { startMs: null, stalls: null, stalledMs: null, ended: null, totalMs: null, error: "no video on page" } : await player.evaluate(async (v) => {
      const r = { startMs: null, stalls: 0, stalledMs: 0, ended: false, error: null, src: null };
      let waitingAt = null;
      let started = false;
      const t0 = performance.now();
      v.addEventListener("playing", () => {
        if (!started) { started = true; r.startMs = Math.round(performance.now() - t0); }
        if (waitingAt !== null) { r.stalledMs += performance.now() - waitingAt; waitingAt = null; }
      });
      v.addEventListener("waiting", () => { if (started) { r.stalls += 1; waitingAt = performance.now(); } });
      try { await v.play(); } catch (e) { r.error = String(e); return r; }
      const limit = (v.duration || 16) * 1000 + 45_000; // clip length + generous margin
      await new Promise((resolve) => {
        const done = () => resolve();
        v.addEventListener("ended", done, { once: true });
        setTimeout(done, limit);
      });
      if (waitingAt !== null) r.stalledMs += performance.now() - waitingAt;
      r.ended = v.ended;
      r.src = v.currentSrc.split("/").pop();
      r.stalledMs = Math.round(r.stalledMs);
      r.totalMs = Math.round(performance.now() - t0);
      return r;
    });
    rows.push({
      profile: profile.name,
      run,
      ttfbMs: Math.round(nav.ttfb),
      fcpMs: Math.round(nav.fcp),
      lcpMs: Math.round(nav.lcp),
      cls: Number(nav.cls.toFixed(3)),
      longTaskMs: Math.round(nav.longTasks),
      pageKB: Math.round(pageBytes / 1024),
      videoKBBeforePlay: Math.round(videoBeforePlay / 1024),
      videoStartMs: video.startMs,
      stalls: video.stalls,
      stalledMs: video.stalledMs,
      playedToEnd: video.ended,
      playbackWallMs: video.totalMs,
      videoKB: Math.round((bytes.video - videoBeforePlay) / 1024),
      videoRequests: bytes.videoRequests,
      error: video.error,
      width: WIDTH,
      file: video.src,
    });
    await context.close();
  }
}
await browser.close();
const out = process.argv[4];
if (out) fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.table(rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "error"))));
