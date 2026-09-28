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
    pillars: ["Orientação personalizada", "Turismo local no Rio", "Atendimento em três idiomas"],
    foreign: /\b(Local tourism|Service in|Turismo local en|Atención|Orientación)\b/,
  },
  en: {
    heading: "Local tourism, with human guidance.",
    pillars: ["Personalized orientation", "Local tourism in Rio", "Service in three languages"],
    foreign: /(ção|ções|Turismo local|Atendimento|Atención|Orientación|Português|Portugués)/,
  },
  es: {
    heading: "Turismo local, con orientación humana.",
    pillars: ["Orientación personalizada", "Turismo local en Río", "Atención en tres idiomas"],
    foreign: /(ção|ções|Atendimento|Local tourism|Service in|Português|Portuguese)/,
  },
};

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
    await page.goto(`${BASE}/${locale}/rebuild-lab/cinematic-3d-poc`, { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.waitForLoadState("load", { timeout: 180000 }).catch(() => {});

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
      const img = sec.querySelector("img");
      const ir = img.getBoundingClientRect();
      const plate = img.parentElement;
      return {
        bg,
        prevBg: getComputedStyle(exp).backgroundColor,
        seamGap: Math.round(sec.getBoundingClientRect().top - exp.getBoundingClientRect().bottom),
        height: Math.round(sec.getBoundingClientRect().height),
        heading: sec.querySelector("h2")?.textContent,
        h2Count: sec.querySelectorAll("h2").length,
        h3s: [...sec.querySelectorAll("h3")].map(h => h.textContent),
        text: sec.innerText,
        imgs: sec.querySelectorAll("img").length,
        imgSrc: img.getAttribute("src"),
        imgAlt: img.alt,
        imgLoaded: img.complete && img.naturalWidth > 0,
        imgNatural: [img.naturalWidth, img.naturalHeight],
        imgRendered: [Math.round(ir.width), Math.round(ir.height)],
        imgFilter: getComputedStyle(img).filter,
        plateBg: getComputedStyle(plate).backgroundColor,
        plateWidthRatio: +(plate.getBoundingClientRect().width / sec.getBoundingClientRect().width).toFixed(2),
        caption: sec.querySelector("figcaption")?.textContent,
        decorativeHidden: [...sec.querySelectorAll("ol li > span")].every(s => s.getAttribute("aria-hidden") === "true"),
        minFont: Math.min(...textEls.map(el => parseFloat(getComputedStyle(el).fontSize))),
        lowContrast: textEls.filter(el => !el.closest("figure > div")).map(el => ({ t: el.textContent.trim().slice(0, 24), r: +ratio(getComputedStyle(el).color, bg).toFixed(2) })).filter(x => x.r < 4.5),
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
    check(d.imgs === 1 && (d.imgSrc.includes("cadastro%2Fcadastur.png") || d.imgSrc.endsWith("/cadastro/cadastur.png")),`${tag}: unexpected Cadastur image ${d.imgSrc} (${d.imgs} imgs)`);
    check(d.imgAlt === "Cadastur" && d.imgLoaded, `${tag}: Cadastur image alt/load (${d.imgAlt}, loaded ${d.imgLoaded})`);
    const natural = d.imgNatural[0] / d.imgNatural[1], rendered = d.imgRendered[0] / d.imgRendered[1];
    check(Math.abs(rendered - natural) / natural < 0.03, `${tag}: Cadastur mark distorted (natural ${natural.toFixed(2)}, rendered ${rendered.toFixed(2)})`);
    check(d.imgFilter === "none", `${tag}: Cadastur mark recolored (filter ${d.imgFilter})`);
    check(d.caption?.includes("Cadastur"), `${tag}: Cadastur not present as text (${d.caption})`);
    check(d.plateWidthRatio <= 0.7, `${tag}: Cadastur block oversized (${d.plateWidthRatio} of section width)`);
    check(d.decorativeHidden, `${tag}: decorative pillar numerals exposed to AT`);
    check(d.minFont >= 12, `${tag}: text below 12px (${d.minFont})`);
    check(d.lowContrast.length === 0, `${tag}: low-contrast text ${JSON.stringify(d.lowContrast)}`);
    check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
    check(d.links === 0, `${tag}: unexpected interactive elements (${d.links})`);
    check(d.height <= (vp.w >= 1024 ? 700 : 1000), `${tag}: section too tall (${d.height}px)`);
    await page.waitForTimeout(500);
    check(errors.length === 0, `${tag}: errors -> ${errors.join(" | ")}`);

    notes.push(`${tag}: ${d.height}px, cadastur ${d.imgRendered.join("x")} (plate ${Math.round(d.plateWidthRatio * 100)}% width), minFont ${d.minFont}px`);
    await section.screenshot({ path: path.join(outDir, `why-${locale}-${vp.name}.png`) });
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
