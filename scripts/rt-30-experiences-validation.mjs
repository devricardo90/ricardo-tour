/**
 * RT-30 validation — Experiences in Rio section on the rebuild-lab cinematic route.
 * Requires a dev server on :3218 and DATABASE_URL (cards are compared against the live DB).
 *
 *   node scripts/rt-30-experiences-validation.mjs
 */
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: ".env.local" });
dotenv.config();

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-30-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dbTrips = await prisma.trip.findMany({
  where: { isPublished: true, city: "Rio de Janeiro" },
  orderBy: { createdAt: "desc" },
  select: { id: true, title: true, location: true, priceCents: true, durationDays: true, imageUrl: true, description: true },
});
await prisma.$disconnect();
const expectedDurations = dbTrips.map(t => {
  const block = (t.description?.pt ?? "").split("\n\n").map(b => b.trim()).find(b => b.startsWith("Duracao:"));
  return block ? block.slice("Duracao:".length).trim().replace(/\.$/, "") : null;
});
notes.push(`source durations: ${JSON.stringify(expectedDurations)}`);
notes.push(`DB published Rio trips: ${dbTrips.length} -> ${dbTrips.map(t => t.id).join(", ")}`);

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });

async function openPage(url, viewport, opts = {}) {
  const context = await browser.newContext({ viewport, hasTouch: opts.touch ?? false, isMobile: opts.touch ?? false });
  const page = await context.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
  const imageRequests = [];
  page.on("requestfinished", async r => { if (r.resourceType() === "image") { const sz = await r.sizes().catch(() => null); imageRequests.push({ url: r.url(), bytes: sz?.responseBodySize ?? 0, t: Date.now() }); } });
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForLoadState("load", { timeout: 180000 }).catch(() => {});
  return { context, page, errors, imageRequests, status: res?.status() };
}

async function stylingProbe(page) {
  return page.evaluate(() => {
    const sheets = [...document.styleSheets].length;
    const flexEls = [...document.querySelectorAll("[class]")].filter(el => el.classList.contains("flex"));
    const flexOk = flexEls.filter(el => getComputedStyle(el).display === "flex").length;
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return { sheets, flexTotal: flexEls.length, flexOk, bodyBg, docOverflow };
  });
}

// ---- Site-wide route recovery + styling ----
for (const route of ["/pt", "/pt/tours", "/pt/rebuild-lab", "/pt/rebuild-lab/cinematic-3d-poc"]) {
  const { context, page, errors, status } = await openPage(BASE + route, { width: 1440, height: 900 });
  const s = await stylingProbe(page);
  check(status === 200, `${route}: HTTP ${status}`);
  check(s.sheets > 0, `${route}: no stylesheets`);
  check(s.flexTotal === 0 || s.flexOk / s.flexTotal >= 0.9, `${route}: only ${s.flexOk}/${s.flexTotal} .flex elements computed display:flex (styles missing?)`);
  check(s.docOverflow <= 0, `${route}: horizontal overflow ${s.docOverflow}px`);
  await page.waitForTimeout(1500);
  check(errors.length === 0, `${route}: errors -> ${errors.join(" | ")}`);
  notes.push(`${route}: status ${status}, sheets ${s.sheets}, .flex ${s.flexOk}/${s.flexTotal}, body bg ${s.bodyBg}, overflow ${s.docOverflow}`);
  await page.screenshot({ path: path.join(outDir, `route${route.replace(/\//g, "_")}.png`) });
  await context.close();
}

// ---- RT-30 section ----
const viewports = [
  { name: "1440x900", w: 1440, h: 900, touch: false, expectCols: 4 },
  { name: "1024x768", w: 1024, h: 768, touch: false, expectCols: 2 },
  { name: "768x1024", w: 768, h: 1024, touch: true, expectCols: 2 },
  { name: "390x844", w: 390, h: 844, touch: true, expectCols: 0 },
  { name: "360x800", w: 360, h: 800, touch: true, expectCols: 0 },
];

for (const locale of ["pt", "en", "es"]) {
  for (const vp of viewports) {
    if (locale !== "pt" && !["1440x900", "390x844"].includes(vp.name)) continue;
    const url = `${BASE}/${locale}/rebuild-lab/cinematic-3d-poc`;
    const { context, page, errors, imageRequests } = await openPage(url, { width: vp.w, height: vp.h }, { touch: vp.touch });
    const tag = `${locale}@${vp.name}`;

    await page.waitForTimeout(3000);
    const early = imageRequests.filter(r => r.url.includes("images%2Ftrips") || r.url.includes("/images/trips/"));
    const earlyKB = Math.round(early.reduce((a, r) => a + r.bytes, 0) / 1024);
    const heroEarly = imageRequests.filter(r => r.url.includes("cinematic-3d-poc") || r.url.includes("rio-04") || r.url.includes("helicopter-05") || r.url.includes("christ-06")).length;
    check(heroEarly === 0, `${tag}: RT-28 regression — ${heroEarly} Hero photos fetched at initial load`);
    notes.push(`${tag}: before scroll — trip images fetched ${early.length} (${earlyKB} KB, native lazy threshold), Hero photos fetched ${heroEarly}`);
    const mode = await page.evaluate(() => document.querySelector("[data-testid=globe-journey]")?.dataset.mode);
    const secTop = await page.evaluate(() => Math.round(document.querySelector("section[aria-labelledby='experiences-in-rio-heading']").getBoundingClientRect().top + scrollY));
    notes.push(`${tag}: hero mode ${mode}, section top ${secTop}px`);

    const section = page.locator("section[aria-labelledby='experiences-in-rio-heading']");
    check(await section.count() === 1, `${tag}: section missing`);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);

    const data = await section.evaluate((sec) => {
      const cards = [...sec.querySelectorAll("ul > li")];
      const ul = sec.querySelector("ul");
      const ulRect = ul.getBoundingClientRect();
      const tops = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().top)))];
      const perRow = cards.filter(c => Math.round(c.getBoundingClientRect().top) === tops[0]).length;
      const smallText = [...sec.querySelectorAll("*")].filter(el => el.childElementCount === 0 && el.textContent.trim() && el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 11)
        .map(el => `${el.textContent.trim().slice(0, 30)}(${getComputedStyle(el).fontSize})`);
      return {
        heading: sec.querySelector("h2")?.textContent,
        eyebrow: sec.querySelector("p")?.textContent,
        h2Font: getComputedStyle(sec.querySelector("h2")).fontFamily,
        bg: getComputedStyle(sec).backgroundColor,
        cardCount: cards.length,
        titles: cards.map(c => c.querySelector("h3")?.textContent),
        links: cards.map(c => ({ href: c.querySelector("a")?.getAttribute("href"), label: c.querySelector("a")?.getAttribute("aria-label"), h: c.querySelector("a")?.getBoundingClientRect().height, w: c.querySelector("a")?.getBoundingClientRect().width })),
        nestedLinks: sec.querySelectorAll("a a").length,
        imgs: cards.map(c => { const i = c.querySelector("img"); return { alt: i?.alt, loading: i?.getAttribute("loading"), complete: i?.complete, natural: i?.naturalWidth }; }),
        cardTops: cards.map(c => Math.round(c.getBoundingClientRect().top)),
        cardWidths: cards.map(c => Math.round(c.getBoundingClientRect().width)),
        ulWidth: Math.round(ulRect.width),
        ulScrollable: ul.scrollWidth > ul.clientWidth,
        overflowX: getComputedStyle(ul).overflowX,
        perRow,
        viewAll: sec.querySelector("div.mt-12 a")?.getAttribute("href"),
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        clipped: cards.filter(c => { const t = c.querySelector("h3"); return t.scrollWidth > t.clientWidth + 1; }).length,
        smallText,
        heroH1Font: getComputedStyle(document.querySelector("[data-hero-copy] h1")).fontFamily,
        text: sec.innerText,
        durations: cards.map(c => [...c.querySelectorAll("span")].find(sp => sp.querySelector("svg"))?.textContent?.trim() ?? null),
        prices: cards.map(c => [...c.querySelectorAll("p")].find(p => p.textContent.startsWith("R$"))?.textContent),
        tabOrderOk: [...sec.querySelectorAll("a")].every(a => a.tabIndex === 0),
      };
    });

    check(data.cardCount === dbTrips.length, `${tag}: ${data.cardCount} cards vs ${dbTrips.length} DB trips`);
    dbTrips.forEach((t, i) => {
      const expectedTitle = t.title[locale] ?? t.title.pt;
      check(data.titles[i] === expectedTitle, `${tag}: card ${i} title "${data.titles[i]}" != DB "${expectedTitle}"`);
      check(data.links[i]?.href === `/${locale}/tours/${t.id}`, `${tag}: card ${i} href ${data.links[i]?.href}`);
      check(data.links[i]?.label?.includes(expectedTitle), `${tag}: card ${i} CTA accessible name lacks title`);
      check((data.links[i]?.h ?? 0) >= 24, `${tag}: card ${i} CTA height ${data.links[i]?.h} < 24`);
      check(data.imgs[i]?.alt?.includes(expectedTitle), `${tag}: card ${i} alt missing title`);
      check(data.imgs[i]?.loading === "lazy", `${tag}: card ${i} image not lazy (${data.imgs[i]?.loading})`);
    });
    check(data.nestedLinks === 0, `${tag}: nested links`);
    check(data.docOverflow <= 0, `${tag}: document horizontal overflow ${data.docOverflow}px`);
    check(data.clipped === 0, `${tag}: ${data.clipped} clipped titles`);
    check(data.smallText.length === 0, `${tag}: text below 11px: ${data.smallText.join(", ")}`);
    check(data.viewAll === `/${locale}/tours`, `${tag}: view-all href ${data.viewAll}`);
    check(/^display[ ,]|journey-display|Cormorant/i.test(data.h2Font), `${tag}: heading font ${data.h2Font}`);
    check(data.heroH1Font === data.h2Font, `${tag}: section heading font ${data.h2Font} differs from Hero h1 ${data.heroH1Font}`);
    check(!/Duracao:|Categoria:|Inclusoes:|Exclusoes:/.test(data.text), `${tag}: raw description metadata leaked into cards`);
    check(!/(^|[^0-9])1 (dia|day|día)[^s]/.test(data.text + " "), `${tag}: schema-default duration shown`);
    check(JSON.stringify(data.durations) === JSON.stringify(expectedDurations), `${tag}: durations ${JSON.stringify(data.durations)} != source ${JSON.stringify(expectedDurations)}`);
    check(JSON.stringify(data.prices) === JSON.stringify(dbTrips.map(t => "R$ " + (t.priceCents / 100).toFixed(2).replace(".", ","))), `${tag}: prices ${JSON.stringify(data.prices)}`);
    check(!vp.expectCols || data.cardCount % data.perRow === 0, `${tag}: orphan card(s): ${data.cardCount} cards, ${data.perRow} per row`);
    if (vp.expectCols) {
      check(data.perRow === vp.expectCols, `${tag}: ${data.perRow} cards per row, expected ${vp.expectCols}`);
    } else {
      check(data.overflowX === "auto" && data.ulScrollable, `${tag}: mobile rail not horizontally scrollable`);
      const ratio = data.cardWidths[0] / data.ulWidth;
      check(ratio > 0.78 && ratio < 0.86, `${tag}: mobile card width ratio ${ratio.toFixed(2)} (expected ~0.82)`);
    }

    // Load the images for the first visible cards
    const loadedImgs = data.imgs.filter(i => i.complete && i.natural > 0).length;
    notes.push(`${tag}: cards ${data.cardCount}, perRow ${data.perRow}, widths ${data.cardWidths.slice(0, 3).join("/")} of ${data.ulWidth}, imgs loaded ${loadedImgs}/${data.cardCount}, heading "${data.heading}", eyebrow "${data.eyebrow}", bg ${data.bg}`);

    await section.screenshot({ path: path.join(outDir, `rt30-${locale}-${vp.name}.png`) });
    if (locale === "pt") {
      await page.evaluate(() => { const s = document.querySelector("section[aria-labelledby='experiences-in-rio-heading']"); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.55); });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(outDir, `handoff-${vp.name}.png`) });
    }
    check(errors.length === 0, `${tag}: errors -> ${errors.join(" | ")}`);
    await context.close();
  }
}

// ---- Keyboard: Tab reaches card CTAs in order ----
{
  const { context, page } = await openPage(`${BASE}/pt/rebuild-lab/cinematic-3d-poc`, { width: 390, height: 844 });
  const section = page.locator("section[aria-labelledby='experiences-in-rio-heading']");
  await section.scrollIntoViewIfNeeded();
  const firstLink = section.locator("ul a").first();
  await firstLink.focus();
  const seen = [];
  for (let i = 0; i < dbTrips.length; i++) {
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      const r = a.getBoundingClientRect();
      const ul = a.closest("ul");
      const u = ul?.getBoundingClientRect();
      return { href: a.getAttribute("href"), visible: u ? r.left >= u.left - 1 && r.right <= u.right + 1 : false, outline: getComputedStyle(a).outlineStyle };
    });
    seen.push(info);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(400);
  }
  check(seen.every(s => s.href?.startsWith("/pt/tours/")), `keyboard: tab order left the card CTAs: ${JSON.stringify(seen)}`);
  check(seen.every(s => s.visible), `keyboard: focused CTA not scrolled into the rail viewport: ${JSON.stringify(seen)}`);
  check(seen.every(s => s.outline !== "none"), `keyboard: focus ring missing: ${JSON.stringify(seen.map(s => s.outline))}`);
  notes.push(`keyboard: ${seen.length} CTAs reached, all visible in rail when focused`);
  await context.close();
}

// ---- Links resolve ----
{
  const ctx = await browser.newContext();
  for (const t of dbTrips) {
    for (const locale of ["pt", "en", "es"]) {
      const r = await ctx.request.get(`${BASE}/${locale}/tours/${t.id}`, { timeout: 180000 });
      check(r.status() === 200, `link /${locale}/tours/${t.id} -> ${r.status()}`);
    }
  }
  for (const locale of ["pt", "en", "es"]) {
    const r = await ctx.request.get(`${BASE}/${locale}/tours`, { timeout: 180000 });
    check(r.status() === 200, `link /${locale}/tours -> ${r.status()}`);
  }
  notes.push(`links: ${dbTrips.length * 3 + 3} checked`);
  await ctx.close();
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.error("\nFAILURES:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nPASS RT-30 browser validation");
}
