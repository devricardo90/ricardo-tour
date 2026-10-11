// RT-45: bytes transferred per page (encoded body + headers via Content-Length/size), split by type, plus every
// request for the logo, for before/after comparison. Usage: node scripts/rt-45-transfer-bytes.mjs <baseUrl> <out.json>
import fs from "node:fs";
import { chromium, devices } from "@playwright/test";

const [base = "http://127.0.0.1:3200", out = ".tmp/transfer.json"] = process.argv.slice(2);
const paths = ["/pt", "/pt/tours", "/pt/contato", "/pt/quem-somos", "/pt/planeje-sua-viagem"];
const browser = await chromium.launch();
const report = {};
for (const profile of ["desktop", "mobile"]) {
  for (const p of paths) {
    const context = await browser.newContext(profile === "mobile" ? { ...devices["Pixel 7"] } : { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const rows = [];
    page.on("requestfinished", async (req) => {
      try {
        const sizes = await req.sizes();
        rows.push({ url: req.url(), type: req.resourceType(), bytes: sizes.responseBodySize + sizes.responseHeadersSize });
      } catch { /* request closed */ }
    });
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const byType = {};
    for (const r of rows) byType[r.type] = (byType[r.type] ?? 0) + r.bytes;
    const logo = rows.filter((r) => r.url.includes("ricardo-tour-logo"));
    report[`${profile} ${p}`] = {
      sameOriginBytes: rows.filter((r) => r.url.startsWith(base)).reduce((a, r) => a + r.bytes, 0),
      totalBytes: rows.reduce((a, r) => a + r.bytes, 0), requests: rows.length, byType,
      logo: logo.map((r) => ({ url: r.url.replace(base, ""), bytes: r.bytes })),
    };
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(report, null, 2));
for (const [k, v] of Object.entries(report)) console.log(k.padEnd(32), "total", v.totalBytes, "same-origin", v.sameOriginBytes, "logo", v.logo.map((l) => `${l.bytes}B ${l.url.slice(0, 70)}`).join(" | "));
