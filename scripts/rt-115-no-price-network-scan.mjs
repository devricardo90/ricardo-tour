#!/usr/bin/env node
/**
 * RT-115: proves the visual-review mode (?precos=ocultos) never delivers the internal provisional prices to the browser.
 * Loads the Rocinha preview in PT/EN/ES with a real browser and scans EVERY response body (HTML, RSC/flight data, JSON,
 * scripts, CSS) plus the final DOM for price values or the internal price label. The internal version (no flag) is
 * scanned as a positive control. Local server only.
 * Usage: node scripts/rt-115-no-price-network-scan.mjs http://localhost:3234
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://localhost:3234";
const PATH = "rebuild-lab/tour-content-preview/cmli1a6im000034zqqzc9sppb";
const PRICE = /R\$(?:&nbsp;|\s| |\\u00a0)?\d|\b(?:45000|58000|75000|88000|29000|25000|22000)\b|provisionalPricing|perPersonCents|PREÇOS PROVISÓRIOS|PROVISIONAL PRICES|PRECIOS PROVISIONALES/;
const browser = await chromium.launch();
const rows = [];
for (const [mode, query] of [["visual (no prices)", "?precos=ocultos"], ["internal (control)", ""]]) {
  for (const locale of ["pt", "en", "es"]) {
    const page = await browser.newPage();
    const hits = [];
    let scanned = 0;
    page.on("response", async (res) => {
      const type = res.headers()["content-type"] ?? "";
      if (/image|video|font/.test(type)) return;
      try {
        const body = await res.text();
        scanned += 1;
        if (PRICE.test(body)) hits.push(`${new URL(res.url()).pathname} (${type.split(";")[0]})`);
      } catch {
        /* redirects/aborted bodies */
      }
    });
    await page.goto(`${BASE}/${locale}/${PATH}${query}`, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1500);
    const domHit = PRICE.test(await page.content());
    rows.push({ mode, locale, responsesScanned: scanned, responsesWithPrices: hits.length, domHasPrices: domHit, sample: hits.slice(0, 2).join(" | ") });
    await page.close();
  }
}
await browser.close();
console.table(rows);
const leak = rows.filter((r) => r.mode.startsWith("visual") && (r.responsesWithPrices > 0 || r.domHasPrices));
const control = rows.filter((r) => r.mode.startsWith("internal") && r.domHasPrices);
console.log(leak.length === 0 && control.length === 3 ? "PASS: no prices in the visual mode; control shows them" : "FAIL");
process.exit(leak.length === 0 && control.length === 3 ? 0 : 1);
