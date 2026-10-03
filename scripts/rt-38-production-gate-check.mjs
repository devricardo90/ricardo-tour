/**
 * RT-38 production gate: against a DEFAULT production build (no NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS), the prototype
 * scenario selector must not exist and `?scenario=` must not change behavior. Page stays a labelled demo, noindex.
 *
 *   RT38_BASE=http://127.0.0.1:3218 node scripts/rt-38-production-gate-check.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.RT38_BASE ?? "http://127.0.0.1:3218";
const search = { pt: "Buscar voos", en: "Search flights", es: "Buscar vuelos" };
const failures = [];
let checks = 0;
const check = (c, m) => {
  checks += 1;
  if (!c) failures.push(m);
};

const browser = await chromium.launch();
for (const locale of ["pt", "en", "es"]) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/${locale}/voos?scenario=server_error`, { waitUntil: "load", timeout: 90000 });
  await page.waitForSelector("#flight-form");
  check((await page.locator('[data-testid="demo-panel"], #fp-scenario').count()) === 0, `${locale}: no scenario selector in production`);
  check(!/Prototype Scenarios|Cenários do protótipo|Escenarios del prototipo/i.test(await page.content()), `${locale}: no scenario selector text in DOM`);
  check(await page.locator('[data-testid="demo-banner"]').isVisible(), `${locale}: page still labelled as demo`);
  check(/noindex/.test((await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""), `${locale}: noindex`);
  // ?scenario=server_error must be ignored: a normal search returns normal sample offers, not an error state.
  await page.fill("#fp-origin", "GIG");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.fill("#fp-destination", "GRU");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  const d = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  await page.fill("#fp-depart", d);
  await page.locator('input[type="radio"]').nth(1).check({ force: true }).catch(() => {});
  await page.getByRole("button", { name: search[locale] }).click();
  await page.waitForSelector('[data-testid="results"], [data-testid="error-state"], [data-testid="error-summary"]', { timeout: 10000 });
  check((await page.locator('[data-testid="error-state"]').count()) === 0, `${locale}: ?scenario= ignored in production (no error state)`);
  check((await page.locator('[data-testid="offer-card"]').count()) > 0 || (await page.locator('[data-testid="error-summary"]').count()) > 0, `${locale}: normal flow renders`);
  check(errors.length === 0, `${locale}: no page errors (${errors.join("; ")})`);
  await page.close();
}
await browser.close();
console.log(`RT-38 production gate: ${checks} checks, ${failures.length} failures`);
for (const f of failures) console.log(`FAIL: ${f}`);
process.exit(failures.length ? 1 : 0);
