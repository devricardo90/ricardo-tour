// RT-45: behavioural check of the WebGL hero after the worker/ResizeObserver changes, desktop + mobile, host GPU.
// Steps: first load -> resize -> client-side navigation away and back -> full navigation away + history back
// (bfcache or reload). At each step: data-mode/data-webgl, canvas backing store == round(css size * min(dpr,2)),
// globe actually painted (non-empty pixels in a canvas screenshot), page errors, worker count.
// Usage: node scripts/rt-45-globe-behaviour.mjs <baseUrl>
import { chromium, devices } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:3200";
const browser = await chromium.launch({ headless: true, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const failures = [];
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) failures.push(msg); };

async function state(page) {
  await page.waitForFunction(() => { const h = document.querySelector("[data-testid=globe-journey]"); return h && (h.dataset.mode === "static" || h.dataset.webgl); }, null, { timeout: 30000 });
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const h = document.querySelector("[data-testid=globe-journey]");
    const c = h.querySelector("[data-globe-canvas]");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    return { mode: h.dataset.mode, webgl: h.dataset.webgl, backing: [c.width, c.height], expected: [Math.max(1, Math.round(c.clientWidth * ratio)), Math.max(1, Math.round(c.clientHeight * ratio))], css: [c.clientWidth, c.clientHeight] };
  });
}
async function painted(page) {
  const shot = await page.locator("[data-globe-canvas]").screenshot();
  // PNG bytes of a fully transparent/black canvas compress to almost nothing; a drawn globe does not.
  return shot.length;
}
async function check(page, label) {
  const s = await state(page);
  log(s.mode === "motion" && s.webgl === "ready", `${label}: mode=${s.mode} webgl=${s.webgl}`);
  log(s.backing[0] === s.expected[0] && s.backing[1] === s.expected[1], `${label}: backing ${s.backing.join("x")} == expected ${s.expected.join("x")} (css ${s.css.join("x")})`);
  const bytes = await painted(page);
  log(bytes > 20000, `${label}: globe painted (canvas screenshot ${bytes} B)`);
}

for (const profile of [{ name: "desktop", opts: { viewport: { width: 1440, height: 900 } } }, { name: "mobile", opts: { ...devices["Pixel 7"] } }]) {
  const context = await browser.newContext(profile.opts);
  const page = await context.newPage();
  // First-frame handover check (review finding #1): when data-webgl flips to "ready", sample the canvas backing store
  // in the next 3 animation frames. A 1x1 (or 0x0) backing store on any of them means a stretched first frame.
  await page.addInitScript(() => {
    window.__handover = [];
    new MutationObserver((records, observer) => {
      const host = document.querySelector("[data-testid=globe-journey]");
      if (!host || host.dataset.webgl !== "ready") return;
      observer.disconnect();
      const canvas = host.querySelector("[data-globe-canvas]");
      let n = 0;
      const sample = () => { window.__handover.push([canvas.width, canvas.height]); if (++n < 3) requestAnimationFrame(sample); };
      requestAnimationFrame(sample);
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-webgl"] });
  });
  const errors = [];
  let workers = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("worker", () => workers++);
  const p = profile.name;

  await page.goto(`${base}/pt`, { waitUntil: "load" });
  await check(page, `${p} first load`);
  const handover = await page.evaluate(() => window.__handover);
  log(handover.length === 3 && handover.every(([w, h]) => w > 1 && h > 1), `${p} first frames after ready have a real backing store (${JSON.stringify(handover)})`);

  const resized = p === "desktop" ? { width: 1024, height: 700 } : { width: 360, height: 740 };
  await page.setViewportSize(resized);
  await page.waitForTimeout(800);
  await check(page, `${p} after resize to ${resized.width}x${resized.height}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.goto(`${base}/pt/tours`, { waitUntil: "load" });
  await page.goBack({ waitUntil: "load" });
  await check(page, `${p} history back from /pt/tours`);

  // Client-side navigation through the header (Next Link) and back via the logo.
  if (p === "desktop") {
    await page.getByRole("banner").getByRole("link", { name: "Quem somos", exact: true }).click();
    await page.waitForURL(/\/pt\/quem-somos$/);
    await page.getByRole("banner").getByRole("link", { name: /Ricardo Tour/ }).first().click();
    await page.waitForURL(/\/pt$/);
    await check(page, `${p} client-side navigation away and back`);
  }

  await page.reload({ waitUntil: "load" });
  await check(page, `${p} reload`);

  log(errors.length === 0, `${p}: no page errors (${errors.join(" | ") || "none"})`);
  log(workers >= 1, `${p}: texture worker used (${workers} worker(s) created across ${p === "desktop" ? 5 : 4} hero mounts)`);
  await context.close();
}
await browser.close();
console.log(failures.length ? `\n${failures.length} FAILURE(S)` : "\nALL PASS");
process.exit(failures.length ? 1 : 0);
