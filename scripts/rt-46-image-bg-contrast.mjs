// RT-46: contrast of gold text drawn over images/video (cases the computed-style audit cannot resolve). For each such
// text element: scroll it into view, wait for media, hide only its glyphs (color: transparent), screenshot its box,
// and compare the text colour with the background pixels actually behind it — worst case (brightest pixel) and median.
// Usage: node scripts/rt-46-image-bg-contrast.mjs <baseUrl> [out.json]
import fs from "node:fs";
import sharp from "sharp";
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3200", out = ".tmp/rt-46-image-bg-contrast.json"] = process.argv.slice(2);
const audit = JSON.parse(fs.readFileSync(".tmp/rt-46-gold-contrast-after.json", "utf8")).filter((x) => x.pass === null);
const lum = (r, g, b) => { const v = [r, g, b].map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const hexLum = (h) => lum(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const browser = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const rows = [];
for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
  for (const route of [...new Set(audit.map((a) => a.route))]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(base + route, { waitUntil: "networkidle" });
    for (const item of audit.filter((a) => a.route === route)) {
      const el = page.getByText(item.text, { exact: true }).first();
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2500); // lazy media + reveal transitions
      const fg = item.fg;
      await el.evaluate((n) => { n.dataset.prevColor = n.style.color; n.style.color = "transparent"; });
      const png = await el.screenshot();
      await el.evaluate((n) => { n.style.color = n.dataset.prevColor; });
      const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
      const ratios = [];
      const L = hexLum(fg);
      for (let i = 0; i < data.length; i += info.channels) {
        const bl = lum(data[i], data[i + 1], data[i + 2]);
        ratios.push((Math.max(L, bl) + 0.05) / (Math.min(L, bl) + 0.05));
      }
      ratios.sort((a, b) => a - b);
      rows.push({ viewport: vp.name, route, text: item.text, fg, sizePx: item.sizePx, worst: +ratios[0].toFixed(2), p5: +ratios[Math.floor(ratios.length * 0.05)].toFixed(2), median: +ratios[ratios.length >> 1].toFixed(2), pass: ratios[0] >= 4.5 });
    }
    await page.close();
  }
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
for (const r of rows) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.viewport.padEnd(7)} ${r.route.padEnd(4)} ${r.text.padEnd(18)} worst ${r.worst}  p5 ${r.p5}  median ${r.median}`);
