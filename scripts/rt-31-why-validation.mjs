/**
 * RT-31 validation — Why Rick Travel + Cadastur section on the rebuild-lab cinematic route.
 * Requires a dev server on :3218.
 *
 *   node scripts/rt-31-why-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-31-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const canonical = {
  pt: {
    heading: "Turismo local, com orientação humana.",
    intro: "Passeios guiados, orientação personalizada e atendimento em português, espanhol e inglês.",
    pillars: ["Orientação personalizada", "Turismo local no Rio", "Atendimento em três idiomas"],
    references: "Referências institucionais",
    foreign: /\b(Local tourism|Service in|Turismo local en|Atención|Orientación)\b/,
  },
  en: {
    heading: "Local tourism, with human guidance.",
    intro: "Guided tours, personalized travel orientation, and service in Portuguese, Spanish, and English.",
    pillars: ["Personalized orientation", "Local tourism in Rio", "Service in three languages"],
    references: "Institutional references",
    foreign: /(ção|ções|Turismo local|Atendimento|Atención|Orientación|Português|Portugués)/,
  },
  es: {
    heading: "Turismo local, con orientación humana.",
    intro: "Tours guiados, orientación personalizada y atención en portugués, español e inglés.",
    pillars: ["Orientación personalizada", "Turismo local en Río", "Atención en tres idiomas"],
    references: "Referencias institucionales",
    foreign: /(ção|ções|Atendimento|Local tourism|Service in|Português|Portuguese)/,
  },
};

// Owner-authorized institutional marks, in order, framed from the unmodified composite.
const MARK_NAMES = ["Cadastur", "ABAV", "TripAdvisor", "Visit Rio", "Visit Brasil"];
const MARKS_SRC = "/logos/logo-turismo.webp";

// Claims the approved-values register blocks or leaves pending (PT/EN/ES stems).
const forbidden = /(melhor|best\b|mejor|garant|guarant|24\s*\/\s*7|24h|premiad|award|premio|certific|licen[cs]|seguro|insurance|oficial|official|minist|credenciad|accredit|acreditad|avalia|rating|review|reseña|estrelas|stars|estrellas|anos de|years of|años de|clientes|customers|exclusiv|parceir|partner|socio|embratur|abav|tripadvisor|visit rio|visit brasil|registro n|n[º°o]\s*\d)/i;

const viewports = [
  { name: "1440x900", w: 1440, h: 900, touch: false },
  { name: "1024x768", w: 1024, h: 768, touch: false },
  { name: "768x1024", w: 768, h: 1024, touch: true },
  { name: "390x844", w: 390, h: 844, touch: true },
  { name: "360x800", w: 360, h: 800, touch: true },
];

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });

for (const locale of ["pt", "en", "es"]) {
  for (const vp of viewports) {
    if (locale !== "pt" && !["1440x900", "390x844"].includes(vp.name)) continue;
    const tag = `${locale}@${vp.name}`;
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.touch, isMobile: vp.touch });
    const page = await context.newPage();
    const errors = [];
    page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
    const markRequests = [];
    page.on("request", r => { if (r.url().includes("logo-turismo")) markRequests.push(r.url()); });
    await page.goto(`${BASE}/${locale}/rebuild-lab/cinematic-3d-poc`, { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForLoadState("load", { timeout: 180000 }).catch(() => {});
    await page.waitForTimeout(2000);
    check(markRequests.length === 0, `${tag}: institutional marks fetched at initial load (${markRequests.length})`);

    const section = page.locator("section[aria-labelledby='why-rick-travel-heading']");
    check(await section.count() === 1, `${tag}: section missing`);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const d = await section.evaluate((sec) => {
      const lum = (rgb) => {
        const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
      const bg = getComputedStyle(sec).backgroundColor;
      const textEls = [...sec.querySelectorAll("*")].filter(el => el.childElementCount === 0 && el.textContent.trim() && !el.closest("[aria-hidden='true']") && el.getClientRects().length);
      const exp = document.querySelector("section[aria-labelledby='experiences-in-rio-heading']");
      const marks = [...sec.querySelectorAll("[data-mark-frame]")].map(frame => {
        const r = frame.getBoundingClientRect();
        const [x, y, vw, vh] = frame.dataset.markFrame.split(/\s+/).map(Number);
        const img = frame.querySelector("img");
        const ir = img.getBoundingClientRect();
        const scale = ir.width / 1324;
        return {
          name: frame.getAttribute("aria-label"),
          role: frame.getAttribute("role"),
          imgAlt: img.getAttribute("alt"),
          src: img.getAttribute("src"),
          natural: [img.naturalWidth, img.naturalHeight],
          loading: img.getAttribute("loading"),
          // Rendered framing must reproduce the approved viewBox: offset and window size in source pixels.
          offset: [(r.left - ir.left) / scale, (r.top - ir.top) / scale].map(v => Math.round(v)),
          window: [r.width / scale, r.height / scale].map(v => Math.round(v)),
          expected: { x, y, w: vw, h: vh },
          imageRatio: ir.width / ir.height,
          viewRatio: vw / vh,
          renderRatio: r.width / r.height,
          rendered: [Math.round(r.width), Math.round(r.height)],
          filter: [getComputedStyle(frame).filter, getComputedStyle(img).filter],
          transform: [getComputedStyle(frame).transform, getComputedStyle(img).transform],
        };
      });
      const pillarsBottom = sec.querySelector("ol").getBoundingClientRect().bottom;
      const strip = sec.querySelector("ul").getBoundingClientRect();
      return {
        bg,
        prevBg: getComputedStyle(exp).backgroundColor,
        seamGap: Math.round(sec.getBoundingClientRect().top - exp.getBoundingClientRect().bottom),
        height: Math.round(sec.getBoundingClientRect().height),
        heading: sec.querySelector("h2")?.textContent,
        h2Count: sec.querySelectorAll("h2").length,
        h3s: [...sec.querySelectorAll("h3")].map(h => h.textContent),
        text: sec.innerText,
        intro: sec.querySelector("h2").parentElement.nextElementSibling?.textContent,
        imgs: sec.querySelectorAll("img").length,
        marks,
        referencesLabel: document.getElementById(sec.querySelector("ul").getAttribute("aria-labelledby") ?? "")?.textContent,
        stripBelowPillars: strip.top >= pillarsBottom - 1,
        maxMarkHeight: Math.max(...marks.map(m => m.rendered[1])),
        h3Px: parseFloat(getComputedStyle(sec.querySelector("h3")).fontSize),
        decorativeHidden: [...sec.querySelectorAll("ol li > span")].every(s => s.getAttribute("aria-hidden") === "true"),
        minFont: Math.min(...textEls.map(el => parseFloat(getComputedStyle(el).fontSize))),
        lowContrast: textEls.map(el => ({ t: el.textContent.trim().slice(0, 24), r: +ratio(getComputedStyle(el).color, bg).toFixed(2) })).filter(x => x.r < 4.5),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        links: sec.querySelectorAll("a, button").length,
      };
    });

    const c = canonical[locale];
    check(d.bg === "rgb(243, 239, 230)", `${tag}: section not off-white (${d.bg})`);
    check(d.prevBg === "rgb(11, 14, 17)" && d.seamGap === 0, `${tag}: does not follow charcoal Experiences directly (prev ${d.prevBg}, gap ${d.seamGap})`);
    check(d.heading === c.heading && d.h2Count === 1, `${tag}: heading "${d.heading}"`);
    check(JSON.stringify(d.h3s) === JSON.stringify(c.pillars), `${tag}: pillars ${JSON.stringify(d.h3s)}`);
    check(!forbidden.test(d.text), `${tag}: forbidden/unsupported claim term: "${(d.text.match(forbidden) || [])[0]}"`);
    check(!c.foreign.test(d.text), `${tag}: mixed-language text: "${(d.text.match(c.foreign) || [])[0]}"`);
    check(!/\d{2}\.\d{3}|\d{6,}/.test(d.text), `${tag}: number that looks like a registration id in section text`);
    check(d.intro === c.intro, `${tag}: intro "${d.intro}"`);
    check(d.referencesLabel === c.references, `${tag}: references label "${d.referencesLabel}"`);
    check(d.imgs === MARK_NAMES.length, `${tag}: expected ${MARK_NAMES.length} mark images, found ${d.imgs}`);
    check(JSON.stringify(d.marks.map(m => m.name)) === JSON.stringify(MARK_NAMES), `${tag}: marks ${JSON.stringify(d.marks.map(m => m.name))}`);
    for (const m of d.marks) {
      check(m.role === "img" && m.imgAlt === "", `${tag}: ${m.name} accessible name not on its frame (role ${m.role}, img alt "${m.imgAlt}")`);
      check(m.src === MARKS_SRC && m.natural[0] === 1324 && m.natural[1] === 122, `${tag}: ${m.name} not drawn from the unmodified composite (${m.src} ${m.natural})`);
      check(m.loading === "lazy", `${tag}: ${m.name} not lazy-loaded (${m.loading})`);
      check(Math.abs(m.imageRatio - 1324 / 122) / (1324 / 122) < 0.01, `${tag}: ${m.name} composite distorted (ratio ${m.imageRatio.toFixed(3)})`);
      check(Math.abs(m.renderRatio - m.viewRatio) / m.viewRatio < 0.02, `${tag}: ${m.name} frame distorted (frame ${m.viewRatio.toFixed(2)}, rendered ${m.renderRatio.toFixed(2)})`);
      check(Math.abs(m.offset[0] - m.expected.x) <= 2 && Math.abs(m.offset[1] - m.expected.y) <= 2 && Math.abs(m.window[0] - m.expected.w) <= 2 && Math.abs(m.window[1] - m.expected.h) <= 2,
        `${tag}: ${m.name} framing differs from the approved box (offset ${m.offset}, window ${m.window}, expected ${JSON.stringify(m.expected)})`);
      check(m.filter.every(f => f === "none") && m.transform.every(t => t === "none"), `${tag}: ${m.name} recolored/transformed (${m.filter} / ${m.transform})`);
      check(m.rendered[1] >= 24, `${tag}: ${m.name} too small (${m.rendered.join("x")})`);
    }
    const cadastur = d.marks.find(m => m.name === "Cadastur");
    check(cadastur && cadastur.rendered[1] >= (vp.w >= 768 ? 34 : 30), `${tag}: Cadastur not prominent enough to stay legible (${cadastur?.rendered.join("x")})`);
    check(d.stripBelowPillars, `${tag}: institutional strip not placed after the pillars`);
    check(d.maxMarkHeight <= 60, `${tag}: logos dominate the section (tallest mark ${d.maxMarkHeight}px)`);
    check(d.decorativeHidden, `${tag}: decorative pillar numerals exposed to AT`);
    check(d.minFont >= 12, `${tag}: text below 12px (${d.minFont})`);
    check(d.lowContrast.length === 0, `${tag}: low-contrast text ${JSON.stringify(d.lowContrast)}`);
    check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
    check(d.links === 0, `${tag}: unexpected interactive elements (${d.links})`);
    check(d.height <= (vp.w >= 1024 ? 440 : 720), `${tag}: section too tall (${d.height}px)`);
    const src = await page.request.get(BASE + MARKS_SRC).catch(() => page.request.get(BASE + MARKS_SRC));
    check(src.status() === 200 && (src.headers()["content-type"] ?? "").includes("image/webp"), `${tag}: marks source not served (${src.status()})`);
    await page.waitForTimeout(500);
    check(errors.length === 0, `${tag}: errors -> ${errors.join(" | ")}`);

    notes.push(`${tag}: ${d.height}px, marks ${d.marks.map(m => `${m.name} ${m.rendered.join("x")}`).join(", ")}, minFont ${d.minFont}px`);
    await section.screenshot({ path: path.join(outDir, `why-${locale}-${vp.name}.png`) });
    await context.close();
  }
}

// Reduced motion and data saver must not pull the institutional marks before the section is near.
for (const mode of ["reduced-motion", "save-data"]) {
  for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844, touch: true }]) {
    const tag = `${mode}@${vp.w}`;
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch, reducedMotion: mode === "reduced-motion" ? "reduce" : "no-preference" });
    if (mode === "save-data") {
      await context.addInitScript(() => Object.defineProperty(Navigator.prototype, "connection", { get: () => ({ saveData: true, effectiveType: "4g" }), configurable: true }));
    }
    const page = await context.newPage();
    const markRequests = [];
    page.on("request", r => { if (r.url().includes("logo-turismo")) markRequests.push(r.url()); });
    await page.goto(`${BASE}/pt/rebuild-lab/cinematic-3d-poc`, { waitUntil: "load", timeout: 180000 });
    await page.waitForTimeout(2500);
    const initial = markRequests.length;
    check(initial === 0, `${tag}: institutional marks fetched at initial load (${initial})`);
    await page.locator("section[aria-labelledby='why-rick-travel-heading'] ul").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const loaded = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("[data-mark-frame] img")];
      return imgs.length === 5 && imgs.every(i => i.complete && i.naturalWidth === 1324);
    });
    check(markRequests.length === 1 && loaded, `${tag}: marks did not load exactly once when the section was reached (${markRequests.length} req, loaded ${loaded})`);
    notes.push(`${tag}: marks requests at initial load ${initial}, after reaching the section ${markRequests.length}`);
    await context.close();
  }
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.error("\nFAILURES:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nPASS RT-31 Why Rick Travel validation");
}
