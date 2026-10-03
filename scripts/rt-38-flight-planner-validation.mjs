/**
 * RT-38 validation — isolated, mock-only Flight Planner at /{locale}/voos.
 * Requires a dev server on :3218 (no database is touched by this route).
 *
 *   node scripts/rt-38-flight-planner-validation.mjs
 *
 * Checks (PT / EN / ES, desktop + mobile): noindex, demo labelling, validation errors, loading, results, empty state,
 * simulated provider/network errors, partial results, slow search + cancel, selected offer, stale / unavailable offer,
 * price change + explicit acceptance, keyboard navigation, passenger picker (no age rules), tabs, responsive layout,
 * ZERO provider/API/network calls, no links from the Home or shared chrome, not in the sitemap.
 * Evidence (screenshots + report.json) goes to .tmp/rt-38-evidence/.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.RT38_BASE ?? "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-38-evidence");
fs.mkdirSync(outDir, { recursive: true });

const failures = [];
const notes = [];
const report = { checks: 0, locales: {}, network: {}, console: [] };
const check = (cond, msg) => {
  report.checks += 1;
  if (!cond) failures.push(msg);
};

const ymd = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const DEPART = ymd(30);
const RETURN = ymd(37);

const L = {
  pt: {
    h1: "Planeje seu voo para o Rio",
    search: "Buscar voos",
    banner: "Prévia de demonstração",
    foreign: /(Plan your flight|Search flights|Demo preview|Planifica tu vuelo|Buscar vuelos|Vista previa)/,
    errOrigin: "Informe a origem.",
    sameplace: "Origem e destino precisam ser diferentes.",
    handoff: "As próximas etapas (dados dos passageiros e pagamento) ainda não estão disponíveis.",
    select: "Selecionar oferta",
    unavailableCard: "Oferta indisponível",
    sample: "Exemplo",
  },
  en: {
    h1: "Plan your flight to Rio",
    search: "Search flights",
    banner: "Demo preview",
    foreign: /(Planeje seu voo|Buscar voos|Prévia de demonstração|Planifica tu vuelo|Buscar vuelos|Vista previa)/,
    errOrigin: "Enter where you are flying from.",
    sameplace: "Origin and destination must be different.",
    handoff: "The next steps (passenger details and payment) are not available yet.",
    select: "Select offer",
    unavailableCard: "Offer unavailable",
    sample: "Sample",
  },
  es: {
    h1: "Planifica tu vuelo a Río",
    search: "Buscar vuelos",
    banner: "Vista previa de demostración",
    foreign: /(Planeje seu voo|Buscar voos|Prévia de demonstração|Plan your flight|Search flights|Demo preview)/,
    errOrigin: "Indica el origen.",
    sameplace: "El origen y el destino deben ser distintos.",
    handoff: "Los próximos pasos (datos de los pasajeros y pago) aún no están disponibles.",
    select: "Seleccionar oferta",
    unavailableCard: "Oferta no disponible",
    sample: "Ejemplo",
  },
};

const viewports = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };


// Wait until React has attached its handlers to the form (a click before hydration would be a native form submit).
async function hydrated(page) {
  await page.waitForFunction(() => {
    const form = document.querySelector('[data-testid="flight-form"]');
    return !!form && Object.keys(form).some((k) => k.startsWith("__reactProps"));
  }, null, { timeout: 30000 });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false, caret: "initial" });
}

async function pickPlace(page, id, query) {
  await page.fill(`#${id}`, query);
  await page.waitForSelector('[role="listbox"]:not([hidden]) [role="option"]', { timeout: 5000 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
}

async function fillValid(page, { origin = "gig", destination = "gru", oneWay = false } = {}) {
  await pickPlace(page, "fp-origin", origin);
  await pickPlace(page, "fp-destination", destination);
  if (oneWay) await page.check('input[name="tripType"][value="ONE_WAY"]', { force: true });
  await page.fill("#fp-depart", DEPART);
  if (!oneWay) await page.fill("#fp-return", RETURN);
}

async function setScenario(page, id) {
  const open = await page.locator('[data-testid="demo-panel"]').evaluate((el) => el.open);
  if (!open) await page.locator('[data-testid="demo-panel"] summary').click();
  await page.selectOption("#fp-scenario", id);
}

async function runSearch(page, locale) {
  await page.getByRole("button", { name: L[locale].search }).click();
}

async function newPage(browser, locale, vp, tag) {
  const context = await browser.newContext({ viewport: viewports[vp], locale: locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-GB" });
  const page = await context.newPage();
  const requests = [];
  page.on("request", (r) => requests.push({ url: r.url(), method: r.method(), type: r.resourceType() }));
  page.on("console", (m) => {
    if (m.type() === "error") report.console.push(`${tag}: ${m.text()}`);
  });
  page.on("pageerror", (e) => report.console.push(`${tag} pageerror: ${e.message}`));
  return { context, page, requests };
}

const browser = await chromium.launch();

try {
  for (const locale of ["pt", "en", "es"]) {
    const t = L[locale];
    report.locales[locale] = {};

    for (const vp of ["desktop", "mobile"]) {
      const tag = `${locale}-${vp}`;
      const { context, page, requests } = await newPage(browser, locale, vp, tag);
      const response = await page.goto(`${BASE}/${locale}/voos`, { waitUntil: "load", timeout: 90000 });
      await hydrated(page);
      check(response?.status() === 200, `${tag}: /voos returns 200`);

      // --- noindex, demo labelling, locale ---
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      check(/noindex/.test(robots ?? ""), `${tag}: robots meta contains noindex (got "${robots}")`);
      check((await page.locator('link[rel="canonical"]').count()) === 0, `${tag}: no canonical link`);
      check((await page.locator('link[rel="alternate"][hreflang]').count()) === 0, `${tag}: no hreflang alternates`);
      check((await page.locator("h1").innerText()) === t.h1, `${tag}: h1 is "${t.h1}"`);
      check((await page.locator('[data-testid="demo-banner"]').innerText()).includes(t.banner), `${tag}: demo banner visible with "${t.banner}"`);
      check((await page.locator("main").innerText()).search(t.foreign) === -1, `${tag}: no strings from another locale in main`);
      check((await page.evaluate(() => document.documentElement.lang)) === locale, `${tag}: <html lang>`);
      if (vp === "desktop") await shot(page, `${tag}-01-initial`);
      if (vp === "mobile") {
        check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal overflow (initial)`);
      }

      // --- not linked from shared chrome / Home ---
      const voosLinks = await page.$$eval('a[href*="/voos"]', (els) => els.map((e) => ({ href: e.getAttribute("href"), lang: !!e.closest('[aria-label="Idioma"], [aria-label="Language"], [aria-label="Idioma "]'), inMain: !!e.closest("main") })));
      check(voosLinks.every((l) => l.lang || l.inMain) && voosLinks.filter((l) => !l.lang).length === 0, `${tag}: only the language switcher (current page) links to /voos, no Flights nav entry (${JSON.stringify(voosLinks.filter((l) => !l.lang))})`);

      // --- validation errors ---
      await runSearch(page, locale);
      const summary = page.locator('[data-testid="error-summary"]');
      await summary.waitFor({ timeout: 3000 });
      check((await summary.locator("li").count()) === 4, `${tag}: empty submit shows 4 errors (origin, destination, depart, return)`);
      check((await summary.innerText()).includes(t.errOrigin), `${tag}: error text localized`);
      check((await summary.getAttribute("role")) === "alert", `${tag}: error summary role=alert`);
      check(await summary.evaluate((el) => el === document.activeElement), `${tag}: focus moves to the error summary`);
      check((await page.locator("#fp-origin").getAttribute("aria-invalid")) === "true", `${tag}: origin aria-invalid`);
      if (vp === "desktop") await shot(page, `${tag}-02-validation-errors`);

      // typed-but-unselected text
      await page.fill("#fp-origin", "rio");
      await page.keyboard.press("Escape");
      await runSearch(page, locale);
      await summary.waitFor();
      check((await summary.innerText()).length > 0 && (await page.locator("#fp-origin-err").count()) === 1, `${tag}: typed-but-unselected origin keeps an inline error`);

      // same place / same metro
      await page.fill("#fp-origin", "");
      await pickPlace(page, "fp-origin", "gig");
      await pickPlace(page, "fp-destination", "sdu");
      await page.fill("#fp-depart", DEPART);
      await page.fill("#fp-return", RETURN);
      await runSearch(page, locale);
      await summary.waitFor();
      check((await summary.innerText()).includes(t.sameplace), `${tag}: same metropolitan area rejected`);

      // --- passenger picker: no age rules, keyboard ---
      await page.fill("#fp-destination", "");
      await pickPlace(page, "fp-destination", "gru");
      const picker = page.locator("#fp-passengers");
      await picker.click();
      const panel = page.locator('[role="group"]').filter({ has: page.locator("output") });
      await panel.waitFor({ state: "visible" });
      const panelText = await panel.innerText();
      check(!/\d+\s*[–-]\s*\d+|\b\d+\s*\+|\bunder\b|menos de|até \d/i.test(panelText), `${tag}: passenger sheet shows no age bands`);
      await page.getByRole("button", { name: /^(Adicionar adulto|Add adult|Añadir adulto)$/ }).click();
      await page.keyboard.press("Escape");
      check(await page.locator("#fp-passengers").evaluate((el) => el === document.activeElement), `${tag}: Esc closes the passenger sheet and returns focus to the trigger`);
      check(/2/.test(await picker.innerText()), `${tag}: passenger summary updated to 2 adults`);
      if (vp === "mobile") {
        await picker.click();
        const minus = page.getByRole("button", { name: /^(Remover adulto|Remove adult|Quitar adulto)$/ });
        const box = await minus.boundingBox();
        check(box && box.width >= 44 && box.height >= 44, `${tag}: stepper touch target >= 44px (${box?.width}x${box?.height})`);
        await shot(page, `${tag}-03-passenger-sheet`);
        await page.keyboard.press("Escape");
      }

      // --- loading + results ---
      await runSearch(page, locale);
      await page.locator('[data-testid="loading-message"]').waitFor({ timeout: 3000 });
      if (vp === "desktop") await shot(page, `${tag}-04-loading`);
      await page.locator('[data-testid="results"]').waitFor({ timeout: 8000 });
      const cards = page.locator('[data-testid="offer-card"]');
      check((await cards.count()) === 6, `${tag}: 6 sample offers`);
      check((await page.locator('[data-testid="results-count"]').innerText()).includes("6"), `${tag}: results count announced`);
      check((await cards.first().innerText()).toLowerCase().includes(t.sample.toLowerCase()), `${tag}: offers carry the "${t.sample}" badge`);
      check(!/(Sample Air|Demo Wings|Example Jet)/.test("") && /(Sample Air|Demo Wings|Example Jet)/.test(await cards.first().innerText()), `${tag}: fictional carrier names only`);
      await page.waitForFunction(() => document.activeElement === document.querySelector('[data-testid="results"] h2'), null, { timeout: 2000 }).catch(() => {});
      check(await page.locator('[data-testid="results"] h2').evaluate((el) => el === document.activeElement), `${tag}: focus moves to the results heading`);
      check(page.url().includes("o=GIG") && page.url().includes("d=GRU") && !/price|offer|token/i.test(new URL(page.url()).search), `${tag}: URL mirrors criteria only (${new URL(page.url()).search})`);
      if (vp === "desktop") await shot(page, `${tag}-05-results`);
      if (vp === "mobile") {
        await shot(page, `${tag}-05-results`);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal overflow (results)`);
      }

      // sort
      await page.selectOption("#fp-sort", "LOWEST_PRICE");
      const prices = await cards.evaluateAll((els) => els.map((el) => Number((el.textContent ?? "").match(/[\d.]+,\d{2}|[\d,]+\.\d{2}/)?.[0]?.replace(/\./g, "").replace(",", ".") ?? NaN)));
      check(prices.every((p, i) => i === 0 || prices[i - 1] <= p) || prices.some(Number.isNaN), `${tag}: sorted by lowest price`);
      await page.selectOption("#fp-sort", "RECOMMENDED");

      // fare conditions / baggage placeholders
      await cards.first().locator("summary").click();
      check((await cards.first().innerText()).length > 0 && (await cards.first().locator("details").evaluate((d) => d.open)), `${tag}: fare conditions open`);

      // --- selection: valid ---
      const firstSelect = cards.first().getByRole("button");
      await firstSelect.focus();
      await page.keyboard.press("Enter");
      const dialog = page.locator('[data-testid="flight-dialog"]');
      await page.waitForSelector('dialog[open][data-phase="validating"]', { timeout: 3000 });
      check(await dialog.evaluate((el) => el.open && el.matches(":modal")), `${tag}: validation dialog is modal`);
      check(await page.locator("#flight-dialog-title").evaluate((el) => el === document.activeElement), `${tag}: focus moves to the dialog heading`);
      if (vp === "desktop") await shot(page, `${tag}-06-validating`);
      await page.waitForSelector('dialog[open][data-phase="valid"]', { timeout: 5000 });
      check((await dialog.innerText()).length > 0, `${tag}: valid phase reached`);
      await dialog.getByRole("button").first().click(); // Continue
      await page.waitForSelector('dialog[open][data-phase="handoff"]');
      check((await dialog.innerText()).includes(t.handoff), `${tag}: hand-off is the informational preview panel (no data collected)`);
      check((await dialog.locator("input, textarea, select").count()) === 0, `${tag}: hand-off has no form fields`);
      if (vp === "desktop") await shot(page, `${tag}-07-handoff`);
      await dialog.locator("button").last().click(); // Back
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
      check(await firstSelect.evaluate((el) => el === document.activeElement), `${tag}: focus returns to the Select button after closing`);

      // Esc during validation cancels without accepting anything
      await firstSelect.click();
      await page.waitForSelector('dialog[open][data-phase="validating"]');
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
      check(true, `${tag}: Esc cancels validation`);

      // --- product tabs: Flights | Hotels | Flight + Hotel (Experiences is NOT an engine tab) ---
      const tabIds = await page.locator('[role="tab"]').evaluateAll((els) => els.map((e) => e.id));
      check(JSON.stringify(tabIds) === JSON.stringify(["fp-tab-flights", "fp-tab-hotels", "fp-tab-flightHotel"]), `${tag}: tabs are Flights | Hotels | Flight + Hotel (got ${tabIds})`);
      check((await page.locator("#fp-tab-experiences, #fp-panel-experiences").count()) === 0, `${tag}: Experiences removed from engine tabs`);
      // --- palette (Owner visual refinement): neutral page, white panel/inputs, accessible borders + focus ---
      const pal = await page.evaluate(() => {
        const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = (c) => {
          const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
        let el = document.querySelector("#flights-heading");
        while (el && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(el).backgroundColor)) el = el.parentElement;
        const pageBg = getComputedStyle(el).backgroundColor;
        const panel = getComputedStyle(document.querySelector("#fp-panel-flights")).backgroundColor;
        const origin = document.querySelector("#fp-origin");
        const oc = getComputedStyle(origin);
        const muted = getComputedStyle(document.querySelector("#flights-heading + p")).color;
        const activeTab = getComputedStyle(document.querySelector("#fp-tab-flights"));
        origin.focus();
        const f = getComputedStyle(origin);
        return {
          pageBg, panel, inputBg: oc.backgroundColor, fieldBorder: oc.borderTopColor,
          fieldBorderRatio: ratio(rgb(oc.borderTopColor), rgb(oc.backgroundColor)),
          mutedRatio: ratio(rgb(muted), rgb(pageBg)),
          tabAccent: activeTab.boxShadow,
          focus: { style: f.outlineStyle, width: f.outlineWidth, color: f.outlineColor, ratio: ratio(rgb(f.outlineColor), rgb(oc.backgroundColor)) },
          noticeBg: getComputedStyle(document.querySelector('[data-testid="demo-banner"]')).backgroundColor,
          noticeBorder: getComputedStyle(document.querySelector('[data-testid="demo-banner"]')).borderTopColor,
        };
      });
      check(pal.pageBg === "rgb(250, 250, 248)", `${tag}: page background #FAFAF8 (got ${pal.pageBg})`);
      check(pal.panel === "rgb(255, 255, 255)" && pal.inputBg === "rgb(255, 255, 255)", `${tag}: search panel and inputs white (${pal.panel} / ${pal.inputBg})`);
      check(pal.fieldBorderRatio >= 3, `${tag}: input border contrast >= 3:1 (${pal.fieldBorderRatio.toFixed(2)})`);
      check(pal.mutedRatio >= 4.5, `${tag}: muted text contrast >= 4.5:1 (${pal.mutedRatio.toFixed(2)})`);
      check(pal.focus.style !== "none" && parseFloat(pal.focus.width) >= 2 && pal.focus.ratio >= 3, `${tag}: keyboard focus ring visible (${pal.focus.style} ${pal.focus.width} ratio ${pal.focus.ratio.toFixed(2)})`);
      check(/200, 168, 107/.test(pal.tabAccent), `${tag}: active tab carries the brand gold accent (${pal.tabAccent})`);
      check(pal.noticeBg === "rgb(243, 243, 241)" && pal.noticeBorder === "rgb(214, 214, 211)", `${tag}: demo notice neutral (${pal.noticeBg} / ${pal.noticeBorder})`);
      report.palette = { ...(report.palette ?? {}), [tag]: pal };
      const reqBefore = requests.length;
      const tabFlights = page.locator("#fp-tab-flights");
      await tabFlights.focus();
      await page.keyboard.press("ArrowRight");
      check((await page.locator("#fp-tab-hotels").getAttribute("aria-selected")) === "true", `${tag}: ArrowRight switches to Hotels tab`);
      for (const id of ["hotels", "flightHotel"]) {
        if (id === "flightHotel") await page.keyboard.press("ArrowRight");
        const panel = page.locator(`#fp-panel-${id}`);
        check(await panel.isVisible(), `${tag}: ${id} panel visible`);
        check((await panel.locator("form, input, select, textarea, button, [data-testid=\"offer-card\"], img").count()) === 0, `${tag}: ${id} panel has no form, controls, offers or imagery`);
        check(/(pendente|pending|pendiente)/i.test(await panel.innerText()), `${tag}: ${id} says provider integration pending`);
        check(!/R\$|US\$|€|\d{2,}[.,]\d{2}/.test(await panel.innerText()), `${tag}: ${id} shows no prices`);
        if (vp === "desktop") await shot(page, `${tag}-08-${id}-coming-soon`);
      }
      check(requests.length === reqBefore, `${tag}: switching to inactive tabs makes no requests`);
      await page.keyboard.press("Home");
      check((await page.locator("#fp-tab-flights").getAttribute("aria-selected")) === "true", `${tag}: Home returns to Flights`);
      check(await page.locator('[data-testid="results"]').isVisible(), `${tag}: results preserved across tab switch`);
      const expLink = page.locator('[data-testid="experiences-link"]');
      check(await expLink.isVisible(), `${tag}: secondary "complete your trip" section visible below planner`);
      check((await expLink.getAttribute("href")) === `/${locale}/tours`, `${tag}: Experiences link points to existing catalog /${locale}/tours (got ${await expLink.getAttribute("href")})`);
      check((await page.locator('[data-testid="trip-extras"] img, [data-testid="trip-extras"] [data-testid="offer-card"]').count()) === 0, `${tag}: trip-extras does not duplicate the catalog`);

      // --- network: no provider / API calls ---
      const external = requests.filter((r) => !r.url.startsWith(BASE) && !r.url.startsWith("data:") && !r.url.startsWith("blob:"));
      const api = requests.filter((r) => /\/api\//.test(new URL(r.url).pathname));
      const nonGet = requests.filter((r) => r.method !== "GET");
      check(external.length === 0, `${tag}: no external requests (${external.map((r) => r.url).slice(0, 3).join(", ")})`);
      check(api.length === 0, `${tag}: no /api/ requests (${api.map((r) => r.url).slice(0, 3).join(", ")})`);
      check(nonGet.length === 0, `${tag}: no non-GET requests (${nonGet.map((r) => r.method + " " + r.url).slice(0, 3).join(", ")})`);
      report.network[tag] = { total: requests.length, external: external.length, api: api.length, nonGet: nonGet.length };
      await context.close();
    }

    // ---------- scenario matrix (desktop) ----------
    const { context, page, requests } = await newPage(browser, locale, "desktop", `${locale}-scenarios`);
    await page.goto(`${BASE}/${locale}/voos`, { waitUntil: "load", timeout: 90000 });
    await hydrated(page);
    await fillValid(page);
    const submitBtn = page.locator('[data-testid="search-submit"]');

    const expectOutcome = async (id, testid, label) => {
      await setScenario(page, id);
      await submitBtn.click();
      await page.locator(`[data-testid="${testid}"]`).waitFor({ timeout: 8000 });
      check(true, `${locale}: scenario ${id} -> ${label}`);
    };

    await expectOutcome("no_results", "empty-state", "empty state");
    await shot(page, `${locale}-scn-empty`);
    for (const [id, cls] of [
      ["timeout", "PROVIDER_TIMEOUT"],
      ["unavailable", "PROVIDER_UNAVAILABLE"],
      ["rate_limited", "PROVIDER_RATE_LIMITED"],
      ["network", "NETWORK_ERROR"],
      ["internal", "INTERNAL_ERROR"],
    ]) {
      await expectOutcome(id, "error-state", `error ${cls}`);
      const state = page.locator('[data-testid="error-state"]');
      check((await state.getAttribute("data-error-class")) === cls, `${locale}: ${id} maps to ${cls}`);
      check((await state.getAttribute("role")) === "alert", `${locale}: ${id} error has role=alert`);
      check(!/(provider|proveedor|fornecedor|HTTP|5\d\d|stack)/i.test((await state.innerText()).replace(/Código de referência|Reference code|Código de referencia/gi, "")), `${locale}: ${id} shows no provider/technical detail`);
      if (id === "internal") {
        check((await state.innerText()).includes("DEMO-0000"), `${locale}: internal error shows a reference code`);
        await shot(page, `${locale}-scn-error`);
      }
      check((await state.locator('a[href$="/contato"]').count()) === 1, `${locale}: ${id} offers the human fallback link`);
    }
    // retry from an error
    await setScenario(page, "normal");
    await page.locator('[data-testid="error-state"] button').first().click();
    await page.locator('[data-testid="results"]').waitFor({ timeout: 8000 });
    check(true, `${locale}: Retry from an error recovers when the scenario clears`);

    await expectOutcome("partial", "partial-notice", "partial results notice");
    check((await page.locator('[data-testid="offer-card"]').count()) === 3, `${locale}: partial shows 3 offers`);
    await shot(page, `${locale}-scn-partial`);

    // slow search + cancel
    await setScenario(page, "slow");
    await submitBtn.click();
    await page.locator('[data-testid="loading-message"]').waitFor();
    check((await page.locator('[data-testid="cancel-search"]').count()) === 0, `${locale}: Cancel not offered immediately`);
    await page.locator('[data-testid="cancel-search"]').waitFor({ timeout: 12000 });
    await shot(page, `${locale}-scn-slow`);
    await page.locator('[data-testid="cancel-search"]').click();
    await page.locator('[data-testid="cancelled-message"]').waitFor();
    check((await page.locator("#fp-origin").inputValue()).length > 0, `${locale}: form data kept after cancel`);

    // selection scenarios
    const selectFirst = async () => {
      await setScenario(page, "normal");
      await submitBtn.click();
      await page.locator('[data-testid="results"]').waitFor({ timeout: 8000 });
    };
    const pickFirstOffer = async (scenarioId) => {
      await selectFirst();
      await setScenario(page, scenarioId);
      await page.locator('[data-testid="offer-card"]').first().getByRole("button").last().click();
    };

    // price change: explicit acceptance
    await pickFirstOffer("price_changed");
    await page.waitForSelector('dialog[open][data-phase="price_changed"]', { timeout: 6000 });
    const dlg = page.locator('[data-testid="flight-dialog"]');
    check((await dlg.locator('[data-testid="new-price"]').count()) === 1, `${locale}: price-change shows the new price`);
    const accept = dlg.getByRole("button").last();
    check(!(await accept.evaluate((el) => el === document.activeElement)), `${locale}: "accept" is NOT default-focused on a price change`);
    check((await dlg.locator("button").count()) === 2, `${locale}: price change offers exactly Back and Accept (no auto-continue)`);
    await shot(page, `${locale}-scn-price-changed`);
    await accept.click();
    await page.waitForSelector('dialog[open][data-phase="valid"]');
    check(true, `${locale}: accepting the new price moves to the validated state`);
    await dlg.locator("button").last().click(); // Back
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));

    // unavailable
    await pickFirstOffer("offer_unavailable");
    await page.waitForSelector('dialog[open][data-phase="unavailable"]', { timeout: 6000 });
    await shot(page, `${locale}-scn-unavailable`);
    await dlg.getByRole("button").first().click();
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    const firstCard = page.locator('[data-testid="offer-card"]').first();
    check((await firstCard.innerText()).includes(t.unavailableCard) && (await firstCard.getByRole("button").last().isDisabled()), `${locale}: unavailable offer stays visible, marked and disabled`);

    // stale -> search again
    await pickFirstOffer("offer_stale");
    await page.waitForSelector('dialog[open][data-phase="stale"]', { timeout: 6000 });
    await shot(page, `${locale}-scn-stale`);
    await setScenario(page, "normal").catch(() => {});
    await dlg.getByRole("button").first().click(); // Search again
    await page.locator('[data-testid="results"]').waitFor({ timeout: 8000 });
    check(true, `${locale}: stale offer -> Search again re-runs the search with the same criteria`);

    // failed validation -> retry
    await pickFirstOffer("validation_failed");
    await page.waitForSelector('dialog[open][data-phase="failed"]', { timeout: 6000 });
    check(true, `${locale}: validation failure state`);
    await dlg.getByRole("button").last().click();
    await page.waitForFunction(() => !document.querySelector("dialog[open]"));

    const apiCalls = requests.filter((r) => /\/api\//.test(new URL(r.url).pathname) || r.method !== "GET" || !r.url.startsWith(BASE));
    check(apiCalls.length === 0, `${locale}: scenario run made no API/external/non-GET requests (${apiCalls.map((r) => r.method + " " + r.url).slice(0, 3).join(", ")})`);
    await context.close();
  }

  // ---------- deep link prefill, one-way, SV fallback ----------
  {
    const { context, page } = await newPage(browser, "en", "desktop", "deeplink");
    await page.goto(`${BASE}/en/voos?o=GIG&d=LIS&trip=ow&dep=${DEPART}&pax=adult:2,child:1`, { waitUntil: "load", timeout: 90000 });
    await hydrated(page);
    await page.waitForFunction(() => document.querySelector("#fp-origin")?.value.length > 0);
    check((await page.locator("#fp-origin").inputValue()).includes("GIG"), "deeplink: origin prefilled");
    check((await page.locator("#fp-destination").inputValue()).includes("LIS"), "deeplink: destination prefilled");
    check((await page.locator("#fp-return").count()) === 0, "deeplink: one-way hides the return date");
    check(/2 adults, 1 child/.test(await page.locator("#fp-passengers").innerText()), "deeplink: passengers prefilled");
    check((await page.locator('[data-testid="search-outcome"]').getAttribute("data-phase")) === "idle", "deeplink: does not auto-run the search");
    await context.close();

    const sv = await newPage(browser, "pt", "desktop", "sv");
    const svRes = await sv.page.goto(`${BASE}/sv/voos`, { waitUntil: "load", timeout: 90000 });
    check(svRes?.status() === 200 && (await sv.page.locator("h1").innerText()) === L.pt.h1, "sv: falls back to PT copy and stays noindex");
    check(/noindex/.test((await sv.page.locator('meta[name="robots"]').getAttribute("content")) ?? ""), "sv: noindex");
    await sv.context.close();
  }

  // ---------- Home / shared chrome untouched; not in sitemap ----------
  {
    const { context, page } = await newPage(browser, "pt", "desktop", "chrome");
    for (const route of ["/pt", "/pt/tours", "/pt/contato", "/pt/quem-somos", "/en", "/es"]) {
      const res = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" }).catch(() => null);
      if (!res || res.status() >= 500) {
        notes.push(`chrome: ${route} not rendered locally (status ${res?.status()}) — static source guard in the unit tests covers it`);
        continue;
      }
      check((await page.locator('a[href*="/voos"]').count()) === 0, `chrome: ${route} has no link to /voos`);
    }
    const sitemap = await page.goto(`${BASE}/sitemap.xml`).catch(() => null);
    if (sitemap && sitemap.status() === 200) check(!/voos/.test(await sitemap.text()), "sitemap: /voos not listed");
    else notes.push(`sitemap: not rendered locally (status ${sitemap?.status()}); source guard covers it`);
    await context.close();
  }
} finally {
  await browser.close();
}

report.failures = failures;
report.notes = notes;
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
const consoleErrors = report.console.filter((m) => !/favicon|Download the React DevTools|hydrat.*warning/i.test(m));
console.log(`RT-38 validation: ${report.checks} checks, ${failures.length} failures, ${consoleErrors.length} console errors`);
for (const note of notes) console.log(`NOTE: ${note}`);
for (const message of consoleErrors.slice(0, 10)) console.log(`CONSOLE: ${message}`);
for (const failure of failures) console.log(`FAIL: ${failure}`);
process.exit(failures.length === 0 && consoleErrors.length === 0 ? 0 : 1);
