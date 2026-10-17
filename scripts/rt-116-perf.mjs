#!/usr/bin/env node
/**
 * RT-116: cold first-visit weight and LCP of the Rocinha preview on a LOCAL production build (fresh browser context
 * per device, no cache). Also simulates a mid-range 4G link (Chrome DevTools: 9 Mbps down, 150 ms RTT) on mobile.
 * Usage: node scripts/rt-116-perf.mjs http://localhost:3234
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3234";
const URL = `${BASE}/pt/rebuild-lab/tour-content-preview/cmli1a6im000034zqqzc9sppb`;
const browser = await chromium.launch();
const out = [];
for (const [name, viewport, dpr, throttle] of [["desktop", { width: 1440, height: 900 }, 1, false], ["mobile", { width: 390, height: 844 }, 2, false], ["mobile-4g", { width: 390, height: 844 }, 2, true]]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
  const page = await context.newPage();
  if (throttle) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
  }
  const reqs = [];
  page.on("requestfinished", async (req) => {
    const s = await req.sizes().catch(() => ({ responseBodySize: 0 }));
    const res = await req.response();
    reqs.push({ url: req.url(), type: req.resourceType(), bytes: s.responseBodySize, ctype: res?.headers()["content-type"] ?? "" });
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await page.goto(URL, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(2500);
  const images = reqs.filter((r) => r.type === "image");
  const cover = images.find((r) => r.url.includes("rocinha-01-panorama-bandeira") && !r.url.includes("w%3D") && /w=(\d+)/.test(r.url) && Number(r.url.match(/w=(\d+)/)[1]) > 200);
  out.push({
    device: name,
    lcpMs: Math.round(await page.evaluate(() => window.__lcp)),
    totalKB: Math.round(reqs.reduce((a, r) => a + r.bytes, 0) / 1024),
    imageKB: Math.round(images.reduce((a, r) => a + r.bytes, 0) / 1024),
    imageRequests: images.length,
    coverServed: cover ? `${cover.ctype} w=${cover.url.match(/w=(\d+)/)[1]} ${Math.round(cover.bytes / 1024)} KB` : null,
    videoKBBeforePlay: Math.round(reqs.filter((r) => r.url.includes(".mp4")).reduce((a, r) => a + r.bytes, 0) / 1024),
  });
  await context.close();
}
await browser.close();
console.table(out);
