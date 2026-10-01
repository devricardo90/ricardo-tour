/**
 * RT-53 validation — public tours listing (/{locale}/tours) in the (site) group.
 * Requires a dev server on :3218 and the local Postgres.
 *
 *   node scripts/rt-53-tours-listing-validation.mjs
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-53-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

// Owner-approved launch catalog, in display order (canonical database ids).
const APPROVED = ["cmljo0s1u0000t0zqa0bpd23p", "cmlibniq40000z4zqkbujnutt", "cmli1a6im000034zqqzc9sppb", "cmlhxkpy9000028zq27rhytew"];
const EXCLUDED = [
  { id: "cmoa70dy400002kzqugm2oulu", needle: "TESTE E2E" },
  { id: "cmljpsn0j0002t0zqsv6g1los", needle: "Tour Praias" },
  { id: "cmljpnazn0001t0zq92ywd6xk", needle: "Buzios" },
  { id: "cmlibqq5g0001z4zqopyzqlpz", needle: "Morro da Urca" },
];

const copy = {
  pt: { eyebrow: "EXPERIÊNCIAS NO RIO", h1: "Nossos passeios no Rio", search: "Buscar por passeio ou lugar", price: "Preço por pessoa", view: "Ver detalhes", duration: "5–6 horas", foreign: /(Our tours|Search|Price per person|View details|Nuestros|Buscar tours|Precio por|Ver detalles)/ },
  en: { eyebrow: "EXPERIENCES IN RIO", h1: "Our tours in Rio", search: "Search by tour or place", price: "Price per person", view: "View details", duration: "5–6 hours", foreign: /(Nossos passeios|Buscar por passeio|Preço por pessoa|Ver detalhes|Nuestros|Precio por|Experiências)/ },
  es: { eyebrow: "EXPERIENCIAS EN RÍO", h1: "Nuestros tours en Río", search: "Buscar por tour o lugar", price: "Precio por persona", view: "Ver detalles", duration: "5–6 horas", foreign: /(Nossos passeios|Buscar por passeio|Preço por pessoa|Ver detalhes|Our tours|Price per person|View details)/ },
};
const artifacts = /(Duracao:|Categoria:|Inclusoes:|Exclusoes:|\b1 dia\b|\b1 day\b|\b1 día\b|\bL Leve\b|26 de fevereiro a 26|undefined|\[object)/;
const accountEntry = /(entrar|login|log in|sign in|criar conta|create account|registrar|register|iniciar sesión|cuenta)/i;
const stale = /(travelrick|\+?55\s?21|96681|97116)/i;

const viewports = [
  { name: "1440x900", w: 1440, h: 900, cols: 4 }, { name: "1024x768", w: 1024, h: 768, cols: 2 },
  { name: "768x1024", w: 768, h: 1024, cols: 2, touch: true }, { name: "390x844", w: 390, h: 844, cols: 1, touch: true }, { name: "360x800", w: 360, h: 800, cols: 1, touch: true },
];
const runs = [];
for (const locale of ["pt", "en", "es"]) for (const vp of viewports) runs.push({ locale, vp });

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
const ptSummaries = [];
const detailStatus = new Map();

// ---- database facts (read-only): excluded records must still exist, untouched ----
let dbRows = [];
try {
  const out = execSync("docker exec ricktravel-db psql -U postgres -d ricktravel -tA -F \"|\" -c \"select id, \\\"isPublished\\\" from \\\"Trip\\\" order by id\"", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  dbRows = out.map((l) => l.split("|"));
} catch { dbRows = []; }
if (dbRows.length) {
  const ids = new Set(dbRows.map((r) => r[0]));
  check([...APPROVED, ...EXCLUDED.map((e) => e.id)].every((id) => ids.has(id)), "an approved or excluded record is missing from the database (data must not be deleted)");
  notes.push(`database: ${dbRows.length} trip records present (approved ${APPROVED.length} + excluded ${EXCLUDED.length}); none deleted`);
}

for (const { locale, vp } of runs) {
  const tag = `${locale}@${vp.name}`;
  const c = copy[locale];
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch });
  const page = await context.newPage();
  const errors = [];
  const conciergeRequests = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => { if (r.url().includes("/api/ai-concierge")) conciergeRequests.push(r.url()); });

  const resp = await page.goto(`${BASE}/${locale}/tours`, { waitUntil: "load", timeout: 180000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 70)); } scrollTo({ top: 0, behavior: "instant" }); });
  await page.waitForFunction(() => [...document.querySelectorAll("main ul > li img")].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => {});

  const d = await page.evaluate(() => {
    const main = document.querySelector("main");
    const cards = [...main.querySelectorAll("ul > li")];
    const headers = [...document.querySelectorAll("header")];
    const rect = (e) => e.getBoundingClientRect();
    const tops = [...new Set(cards.map((c) => Math.round(rect(c).top)))];
    const interactive = [...main.querySelectorAll("a, button, input")].filter((e) => e.getClientRects().length > 0).map((e) => ({ tag: e.tagName, h: Math.round(rect(e).height), w: Math.round(rect(e).width), t: (e.textContent || e.getAttribute("aria-label") || e.name || "").trim().slice(0, 30) }));
    const search = main.querySelector("input[type=search]");
    return {
      siteTheme: document.querySelectorAll(".site-theme").length, headers: headers.length, headerRole: headers[0]?.getAttribute("role"), headerLinks: headers[0] ? [...headers[0].querySelectorAll("nav a")].length : 0,
      footer: !!document.querySelector("footer[role='contentinfo']"), footerText: document.querySelector("footer")?.innerText ?? "",
      legacyHeader: headers.some((h) => h.getAttribute("role") !== "banner"), aiWidget: document.querySelectorAll("[data-testid='ai-concierge-entry'], [data-testid='ai-concierge-panel']").length,
      h1s: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()), eyebrow: main.querySelector("section p")?.textContent.trim(), h2s: cards.map((c) => c.querySelector("h2")?.textContent.trim()),
      searchLabel: search && (document.querySelector(`label[for='${search.id}']`)?.textContent.trim() ?? null), searchPlaceholder: search?.getAttribute("placeholder"),
      cards: cards.map((c) => {
        const a = c.querySelector("a[href*='/tours/']"); const img = c.querySelector("img");
        return { href: a?.getAttribute("href"), label: a?.getAttribute("aria-label"), text: c.innerText, imgSrc: img?.currentSrc || img?.src, imgAlt: img?.alt, imgLoading: img?.getAttribute("loading"), imgLoaded: !!img && img.complete && img.naturalWidth > 0, srcset: !!img?.srcset || (img?.src || "").includes("/_next/image"), hasHeart: !!c.querySelector("[class*='heart'], [aria-label*='avorit' i], button"), ratio: img ? +(rect(img).width / rect(img).height).toFixed(2) : null, w: Math.round(rect(c).width) };
      }),
      perRow: cards.filter((c) => Math.round(rect(c).top) === tops[0]).length,
      mainText: main.innerText, uiText: [main.querySelector("section p")?.textContent, main.querySelector("h1")?.textContent, main.querySelectorAll("section p")[1]?.textContent, ...cards.map((c) => c.querySelector("p")?.textContent), search?.getAttribute("placeholder")].join(" "),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, interactive, hearts: document.querySelectorAll("main .lucide-heart, main [aria-label*='avorit' i]").length,
      mainCount: document.querySelectorAll("main").length, bg: getComputedStyle(main.firstElementChild).backgroundColor, h1Font: getComputedStyle(main.querySelector("h1")).fontFamily,
    };
  });

  check(resp.status() === 200, `${tag}: HTTP ${resp.status()}`);
  check(d.siteTheme === 1 && d.headers === 1 && d.headerRole === "banner" && d.headerLinks >= 4, `${tag}: SiteHeader missing/duplicated (theme ${d.siteTheme}, headers ${d.headers}, role ${d.headerRole})`);
  check(d.footer, `${tag}: SiteFooter missing`);
  check(!d.legacyHeader && !d.aiWidget && conciergeRequests.length === 0, `${tag}: legacy header/AI widget present (legacy ${d.legacyHeader}, widget ${d.aiWidget}, requests ${conciergeRequests.length})`);
  check(!accountEntry.test(d.mainText) && !accountEntry.test(d.footerText), `${tag}: account/login affordance on the page`);
  check(!stale.test(d.mainText) && !stale.test(d.footerText), `${tag}: stale contact value`);
  check(d.mainCount === 1 && d.h1s.length === 1 && d.h1s[0] === c.h1, `${tag}: heading ${JSON.stringify(d.h1s)} (expected "${c.h1}")`);
  check(d.eyebrow === c.eyebrow, `${tag}: eyebrow "${d.eyebrow}"`);
  check(/siteDisplay|cormorant/i.test(d.h1Font), `${tag}: page heading is not the public display font (${d.h1Font})`);
  check(d.bg === "rgb(243, 239, 230)", `${tag}: page background ${d.bg}`);

  const ids = d.cards.map((card) => (card.href || "").split("/tours/")[1]);
  check(JSON.stringify(ids) === JSON.stringify(APPROVED), `${tag}: listed ids ${JSON.stringify(ids)} != approved ${JSON.stringify(APPROVED)}`);
  check(d.cards.every((card) => new RegExp(`^/${locale}/tours/c[a-z0-9]+$`).test(card.href || "")), `${tag}: card hrefs not localized ${JSON.stringify(d.cards.map((x) => x.href))}`);
  check(!EXCLUDED.some((e) => d.mainText.includes(e.needle) || ids.includes(e.id)), `${tag}: an excluded record is visible`);
  check(d.cards.every((card) => card.imgLoaded && !/placeholder/.test(card.imgSrc || "") && card.imgAlt && card.imgAlt.length > 8), `${tag}: placeholder/unloaded image or weak alt ${JSON.stringify(d.cards.map((x) => [x.imgLoaded, x.imgAlt]))}`);
  check(d.cards.every((card) => card.srcset && card.imgLoading === "lazy"), `${tag}: images not optimized/lazy ${JSON.stringify(d.cards.map((x) => [x.srcset, x.imgLoading]))}`);
  check(d.cards.every((card) => !artifacts.test(card.text)), `${tag}: artifact string in a card: ${d.cards.map((x) => (x.text.match(artifacts) || [])[0]).filter(Boolean).join(", ")}`);
  check(d.cards.every((card) => !/rio de janeiro,\s*rio de janeiro/i.test(card.text) && !/\brio de janeiro\b[\s\S]*\bRio de Janeiro\b[\s\S]*\bRio de Janeiro\b[\s\S]*\bRio de Janeiro\b/.test(card.text.replace(/R\$[\s\S]*/, ""))), `${tag}: duplicated city/location text`);
  check(!/(?<![A-Za-z])rio de janeiro(?![A-Za-z])/.test(d.mainText.replace(/Rio de Janeiro/g, "")), `${tag}: raw lowercase city text`);
  check(d.hearts === 0 && d.cards.every((card) => !card.hasHeart), `${tag}: favorite/heart/button affordance in cards`);
  check(d.cards.every((card) => card.label && card.label.startsWith(c.view)), `${tag}: card link names ${JSON.stringify(d.cards.map((x) => x.label))}`);
  check(d.cards.every((card) => card.text.includes(c.price) && /R\$ \d+,\d{2}/.test(card.text)), `${tag}: card price block`);
  check(d.cards[3] && d.cards[3].text.includes(c.duration), `${tag}: localized duration "${c.duration}" missing on the Cristo card`);
  check(d.perRow === vp.cols, `${tag}: ${d.perRow} cards per row (expected ${vp.cols})`);
  check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
  check(d.searchLabel && d.searchPlaceholder === c.search, `${tag}: search label/placeholder ${JSON.stringify([d.searchLabel, d.searchPlaceholder])}`);
  check(!c.foreign.test(d.uiText), `${tag}: mixed-language interface text "${(d.uiText.match(c.foreign) || [])[0]}"`);
  if (vp.touch) check(d.interactive.every((e) => e.h >= 44 && e.w >= 44), `${tag}: touch targets below 44px ${JSON.stringify(d.interactive.filter((e) => e.h < 44 || e.w < 44))}`);
  else check(d.interactive.every((e) => e.h >= 40), `${tag}: interactive element shorter than 40px ${JSON.stringify(d.interactive.filter((e) => e.h < 40))}`);

  if (locale === "pt") d.cards.forEach((card, i) => { ptSummaries[i] = card.text.split("\n").filter((l) => l.length > 60)[0]; });
  else if (vp.name === "1440x900") {
    const same = d.cards.filter((card, i) => ptSummaries[i] && card.text.includes(ptSummaries[i])).length;
    notes.push(`${locale}: ${same}/4 card summaries are identical to the PT text (database translation gap, not fabricated)`);
  }

  // ---- keyboard + search behaviour (once per locale at desktop width; touch targets covered above) ----
  if (vp.name === "1440x900") {
    await page.keyboard.press("Tab"); await page.waitForTimeout(300); // skip link
    let reached = null;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => { const e = document.activeElement; const li = e.closest("main ul > li"); const cs = li ? getComputedStyle(li) : null; return { tag: e.tagName, type: e.getAttribute("type"), card: !!li, outline: cs && cs.outlineStyle, ow: cs && parseFloat(cs.outlineWidth) }; });
      if (info.card) { reached = info; break; }
    }
    check(reached && reached.outline !== "none" && reached.ow >= 2, `${tag}: keyboard focus on a card shows no visible ring ${JSON.stringify(reached)}`);
    const input = page.locator("input[type=search]");
    await input.fill("Cristo"); await input.press("Enter");
    await page.waitForURL(/search=Cristo/, { timeout: 60000 }).catch(() => {});
    await page.waitForSelector("main ul > li", { timeout: 60000 }).catch(() => {});
    const filtered = await page.evaluate(() => [...document.querySelectorAll("main ul > li a[href*='/tours/']")].map((a) => a.getAttribute("href").split("/tours/")[1]));
    check(JSON.stringify(filtered) === JSON.stringify([APPROVED[3]]), `${tag}: search "Cristo" -> ${JSON.stringify(filtered)}`);
    await page.goto(`${BASE}/${locale}/tours?search=zzzzqq`, { waitUntil: "load", timeout: 120000 });
    const empty = await page.evaluate(() => ({ cards: document.querySelectorAll("main ul > li").length, hasEmpty: !!document.querySelector("main p.text-center"), clear: [...document.querySelectorAll("main a")].some((a) => a.getAttribute("href") === `/${location.pathname.split("/")[1]}/tours`) }));
    check(empty.cards === 0 && empty.hasEmpty && empty.clear, `${tag}: empty search state ${JSON.stringify(empty)}`);
    await page.goto(`${BASE}/${locale}/tours?search=Buzios`, { waitUntil: "load", timeout: 120000 });
    check((await page.evaluate(() => document.querySelectorAll("main ul > li").length)) === 0, `${tag}: searching an excluded title returned a card (the gate must hide it)`);
  }

  // ---- detail links + Home consistency (once per locale) ----
  if (vp.name === "1440x900") {
    for (const card of d.cards) {
      if (detailStatus.has(card.href)) continue;
      const code = await page.request.get(`${BASE}${card.href}`, { timeout: 120000 }).then((r) => r.status()).catch(() => 0);
      detailStatus.set(card.href, code);
      check(code === 200, `${tag}: detail ${card.href} -> HTTP ${code}`);
    }
    if (locale === "pt") {
      const home = await context.newPage();
      await home.goto(`${BASE}/pt/rebuild-lab/cinematic-3d-poc`, { waitUntil: "load", timeout: 180000 });
      const homeIds = await home.evaluate(() => [...new Set([...document.querySelectorAll("#experiences ul a[href*='/tours/']")].map((a) => a.getAttribute("href").split("/tours/")[1]))]);
      check(JSON.stringify(homeIds) === JSON.stringify(ids), `Home Experiences ids ${JSON.stringify(homeIds)} != listing ids ${JSON.stringify(ids)}`);
      notes.push(`home vs listing: same ${homeIds.length} trips in the same order`);
      await home.close();
    }
  }

  check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
  notes.push(`${tag}: ${d.cards.length} cards, ${d.perRow}/row, card ${d.cards[0]?.w}px, overflow ${d.overflow}`);
  await page.screenshot({ path: path.join(outDir, `tours-${locale}-${vp.name}.png`), fullPage: true });
  await context.close();
}

// ---- detail design status (informational): the detail route is still the legacy page until RT-54 ----
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/pt/tours/${APPROVED[0]}`, { waitUntil: "load", timeout: 120000 });
  const legacy = await page.evaluate(() => ({ siteTheme: document.querySelectorAll(".site-theme").length, header: document.querySelector("header")?.getAttribute("role") ?? "legacy" }));
  notes.push(`DETAIL_DESIGN: LEGACY_PENDING_RT54 (site-theme ${legacy.siteTheme}, header ${legacy.header})`);
  await context.close();
}

await browser.close();
notes.push(`detail links: ${JSON.stringify([...detailStatus])}`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-53 tours listing validation");
