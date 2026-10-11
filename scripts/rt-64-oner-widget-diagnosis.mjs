// RT-64 / RT-84 (planner): diagnose the "Script error." reports on /pt/planeje-sua-viagem and whether the Oner widget
// still works when they occur. Uses CDP Runtime.exceptionThrown, which carries the real message/URL/stack even for
// cross-origin scripts (the page itself only sees the opaque "Script error."). Records console errors, every network
// request grouped by origin with status/failures, the component status, and what the provider element rendered.
// Read-only: it never submits a search. Usage: node scripts/rt-64-oner-widget-diagnosis.mjs <baseUrl> <outDir> [profile=desktop|mobile]
import fs from "node:fs";
import { chromium, devices } from "@playwright/test";

const [base = "http://127.0.0.1:3200", outDir = ".tmp/oner-diagnosis", profile = "desktop"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext(profile === "mobile" ? { ...devices["Pixel 7"] } : { viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Runtime.enable");
const exceptions = [];
cdp.on("Runtime.exceptionThrown", ({ exceptionDetails: d }) => exceptions.push({
  text: d.text, message: d.exception?.description?.split("\n").slice(0, 3).join(" | "), url: d.url, line: d.lineNumber, col: d.columnNumber,
  stackTop: d.stackTrace?.callFrames?.slice(0, 3).map((f) => `${f.functionName || "(anon)"} ${f.url}:${f.lineNumber}`),
}));
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") consoleErrors.push({ type: m.type(), text: m.text().slice(0, 300), url: m.location()?.url }); });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 300)));
const requests = [];
page.on("requestfinished", async (r) => { const res = await r.response(); requests.push({ url: r.url(), status: res?.status(), type: r.resourceType() }); });
page.on("requestfailed", (r) => requests.push({ url: r.url(), failed: r.failure()?.errorText, type: r.resourceType() }));
const reported = [];
page.on("request", (r) => { if (r.url().includes("/api/observability/client")) reported.push(r.postData()?.slice(0, 400)); });

const t0 = Date.now();
await page.goto(`${base}/pt/planeje-sua-viagem`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector("[data-oner-status]")?.getAttribute("data-oner-status") !== "loading", null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(8000); // let the provider bootstrap and make its own calls
const status = await page.evaluate(() => document.querySelector("[data-oner-status]")?.getAttribute("data-oner-status"));
const widget = await page.evaluate(() => {
  const el = document.querySelector("befly-widget");
  if (!el) return { present: false };
  const root = el.shadowRoot ?? el;
  const box = el.getBoundingClientRect();
  const q = (s) => root.querySelectorAll(s).length;
  const visibleText = (root.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  return { present: true, shadow: Boolean(el.shadowRoot), width: Math.round(box.width), height: Math.round(box.height), children: root.children?.length ?? 0,
    inputs: q("input"), buttons: q("button"), selects: q("select"), iframes: q("iframe"), visibleText };
});
await page.screenshot({ path: `${outDir}/planner-${profile}.png`, fullPage: false });
const widgetBox = await page.locator("befly-widget").boundingBox().catch(() => null);
if (widgetBox) await page.locator("befly-widget").screenshot({ path: `${outDir}/widget-${profile}.png` }).catch(() => {});

const byOrigin = {};
for (const r of requests) {
  const o = new URL(r.url).origin;
  const g = (byOrigin[o] ??= { requests: 0, failed: 0, statuses: {} });
  g.requests++;
  if (r.failed) g.failed++;
  else g.statuses[r.status] = (g.statuses[r.status] ?? 0) + 1;
}
const result = {
  profile, loadMs: Date.now() - t0, componentStatus: status, widget, exceptions, pageErrors, consoleErrors,
  observabilityReports: reported, byOrigin,
  failedRequests: requests.filter((r) => r.failed || (r.status ?? 0) >= 400).map((r) => ({ url: r.url.slice(0, 160), status: r.status, failed: r.failed, type: r.type })),
};
fs.writeFileSync(`${outDir}/diagnosis-${profile}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 1));
await browser.close();
