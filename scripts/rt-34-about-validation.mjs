/**
 * RT-34 validation — About Rick Travel Home section.
 * Requires a dev server on :3218.   node scripts/rt-34-about-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const SECTION = "section[aria-labelledby='about-rick-travel-heading']";
const outDir = path.resolve(".tmp/rt-34-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const canonical = {
  pt: { heading: "Por trás de cada experiência, uma pessoa.", eyebrow: "SOBRE A RICK TRAVEL", foreign: /(Behind|Detrás|Explore|Conoce|Founder|Fundador de| the )/ },
  en: { heading: "Behind every experience, a person.", eyebrow: "ABOUT RICK TRAVEL", foreign: /(Por trás|Detrás|Conheça|Conoce|Fundador|ção)/ },
  es: { heading: "Detrás de cada experiencia, una persona.", eyebrow: "SOBRE RICK TRAVEL", foreign: /(Por trás|Behind|Conheça|Explore|Fundador da|ção| the )/ },
};
// Claims the evidence does not support.
const unsupported = /(\b\d{1,3}\s*(anos|years|años)|\d+\+|award|prêmio|premio|melhor|best|ranking|24\s*\/\s*7|exclusiv|garant|guarant|credenciad|accredited|acreditad|certific|cadastur|@|\.com)/i;

const viewports = [
  { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
];

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });

for (const locale of ["pt", "en", "es"]) {
  for (const vp of viewports) {
    if (locale !== "pt" && !["1440x900", "390x844"].includes(vp.name)) continue;
    const tag = `${locale}@${vp.name}`;
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch });
    const page = await context.newPage();
    const errors = [];
    const conciergeRequests = [];
    const imgRequests = [];
    let firstFetch = null;
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("request", (r) => {
      if (r.url().includes("/api/ai-concierge")) conciergeRequests.push(r.url());
      if (/ricardo-guia|images[/]about/.test(decodeURIComponent(r.url()))) {
        imgRequests.push(decodeURIComponent(r.url()));
        // Measure at the moment of the request, before later layout shifts move the section.
        if (!firstFetch) page.evaluate(() => { const r = document.querySelector("section[aria-labelledby='about-rick-travel-heading']").getBoundingClientRect(); return { scrollY: Math.round(scrollY), sectionTopBelowViewport: Math.round(r.top - innerHeight) }; }).then((v) => { firstFetch ??= v; }).catch(() => {});
      }
    });

    await page.goto(`${BASE}/${locale}`, { waitUntil: "load", timeout: 180000 });
    if (!process.env.RT34_ROUTE) await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
    await page.waitForTimeout(800);
    const imgBeforeScroll = imgRequests.length;
    // Scroll in half-viewport steps; note where the About image is first requested.
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 250) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(220);
    }
    await page.waitForTimeout(600);
    const section = page.locator(SECTION);
    check(await section.count() === 1, `${tag}: section missing`);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const d = await page.evaluate((s) => {
      const sec = document.querySelector(s);
      const lum = (rgb) => {
        const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== "rgba(0, 0, 0, 0)" && !c.endsWith(", 0)")) return c; } return "rgb(255, 255, 255)"; };
      const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
      const texts = [...sec.querySelectorAll("*")].filter((el) => el.childElementCount === 0 && el.textContent.trim() && el.getClientRects().length && !el.closest("[aria-hidden='true']"));
      const ai = document.querySelector("section[aria-labelledby='ai-concierge-heading']");
      const img = sec.querySelector("img");
      const link = sec.querySelector("a");
      const rect = sec.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      const tr = sec.querySelector("h2").getBoundingClientRect();
      const sections = [...document.querySelectorAll("section[aria-labelledby]")].map((n) => n.getAttribute("aria-labelledby"));
      return {
        heading: sec.querySelector("h2")?.textContent, h2s: sec.querySelectorAll("h2").length,
        eyebrow: sec.querySelector("p")?.textContent,
        bg: getComputedStyle(sec).backgroundColor, aiBg: getComputedStyle(ai).backgroundColor,
        seam: Math.round(rect.top - ai.getBoundingClientRect().bottom),
        height: Math.round(rect.height), viewportH: innerHeight, text: sec.innerText,
        imgAlt: img.getAttribute("alt"), imgLoaded: img.complete && img.naturalWidth > 0, imgLoading: img.getAttribute("loading"),
        frameRatio: +(img.closest("[role], div").getBoundingClientRect().width / img.closest("[role], div").getBoundingClientRect().height).toFixed(2),
        splitSideBySide: ir.right <= tr.left + 1,
        linkHref: link?.getAttribute("href"), linkCount: sec.querySelectorAll("a").length,
        listCount: sec.querySelectorAll("li, ol, ul").length,
        order: sections,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        minFont: Math.min(...texts.map((el) => parseFloat(getComputedStyle(el).fontSize))),
        lowContrast: texts.map((el) => ({ t: el.textContent.trim().slice(0, 24), r: +ratio(getComputedStyle(el).color, bgOf(el)).toFixed(2) })).filter((x) => x.r < 4.5),
      };
    }, SECTION);
    const linkOk = d.linkHref ? await page.request.get(`${BASE}${d.linkHref}`).then((r) => r.status()).catch(() => 0) : 0;

    const c = canonical[locale];
    check(d.heading === c.heading && d.h2s === 1, `${tag}: heading "${d.heading}"`);
    check(d.eyebrow === c.eyebrow, `${tag}: eyebrow "${d.eyebrow}"`);
    check(!c.foreign.test(d.text), `${tag}: mixed-language text: "${(d.text.match(c.foreign) || [])[0]}"`);
    check(!unsupported.test(d.text), `${tag}: unsupported claim wording: "${(d.text.match(unsupported) || [])[0]}"`);
    check(conciergeRequests.length === 0, `${tag}: ${conciergeRequests.length} request(s) to /api/ai-concierge`);
    check(d.bg === "rgb(251, 248, 242)" && d.aiBg === "rgb(11, 14, 17)" && d.seam === 0, `${tag}: rhythm wrong (About ${d.bg}, AI ${d.aiBg}, gap ${d.seam})`);
    const expectedOrder = ["globe-next-title", "experiences-in-rio-heading", "why-rick-travel-heading", "rio-story-heading", "ai-concierge-heading", "about-rick-travel-heading"];
    check(d.order.join(",") === expectedOrder.join(","), `${tag}: section order ${d.order.join(",")}`);
    check(d.imgAlt && d.imgAlt.length > 20 && d.imgLoaded && d.imgLoading === "lazy", `${tag}: image (alt ${!!d.imgAlt}, loaded ${d.imgLoaded}, loading ${d.imgLoading})`);
    check(imgBeforeScroll === 0, `${tag}: About image fetched before any scroll (${imgBeforeScroll}): ${imgRequests[0]}`);
    check(firstFetch !== null && firstFetch.scrollY > 0, `${tag}: About image never requested during scroll`);
    check(firstFetch === null || firstFetch.sectionTopBelowViewport <= 700, `${tag}: image fetched too early (${firstFetch && firstFetch.sectionTopBelowViewport}px below viewport)`);
    check(!imgRequests.some((u) => /ricardo-guia-cracha/.test(u)), `${tag}: 2.1 MB original requested`);
    check(imgRequests.length > 0 && imgRequests.every((u) => /ricardo-guia-home.webp/.test(u)), `${tag}: unexpected About image requests ${JSON.stringify([...new Set(imgRequests)])}`);
    check(d.listCount === 0, `${tag}: About contains list/grid structure (${d.listCount})`);
    check(d.linkCount === 1 && /\/tours$/.test(d.linkHref) && linkOk === 200, `${tag}: CTA (${d.linkCount}, ${d.linkHref}, HTTP ${linkOk})`);
    if (vp.w >= 768) check(d.splitSideBySide, `${tag}: expected side-by-side split`);
    else check(!d.splitSideBySide, `${tag}: expected stacked layout on mobile`);
    check(vp.w >= 768 ? d.frameRatio >= 1.45 && d.frameRatio <= 1.55 : d.frameRatio >= 1.55 && d.frameRatio <= 1.65, `${tag}: portrait frame not landscape 3:2 / 16:10 (ratio ${d.frameRatio})`);
    check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}`);
    check(d.minFont >= 12, `${tag}: text below 12px (${d.minFont})`);
    check(d.lowContrast.length === 0, `${tag}: low-contrast ${JSON.stringify(d.lowContrast)}`);
    check(d.height <= (vp.w >= 768 ? 520 : 760), `${tag}: section too tall (${d.height}px)`);
    check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
    await page.locator(`${SECTION} a`).focus();
    check(await page.evaluate((s) => document.activeElement?.closest(s) !== null, SECTION), `${tag}: CTA not keyboard focusable`);

    notes.push(`${tag}: first image fetch ${JSON.stringify(firstFetch)}, ${d.height}px, CTA ${d.linkHref} HTTP ${linkOk}, overflow ${d.overflow}, minFont ${d.minFont}`);
    await section.screenshot({ path: path.join(outDir, `about-${locale}-${vp.name}.png`) });
    await context.close();
  }
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-34 About Rick Travel validation");
