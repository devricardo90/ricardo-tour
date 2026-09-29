/**
 * RT-33 validation — AI Concierge visual Home section (placeholder shell, no backend).
 * Requires a dev server on :3218.
 *
 *   node scripts/rt-33-concierge-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const SECTION = "section[aria-labelledby='ai-concierge-heading']";
const outDir = path.resolve(".tmp/rt-33-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const canonical = {
  pt: { heading: "Suas ideias para o Rio, organizadas.", status: "Em breve", foreign: /(Coming soon|Próximamente|Your Rio|Tus ideas)/ },
  en: { heading: "Your Rio ideas, organized.", status: "Coming soon", foreign: /(Em breve|Próximamente|ção|Suas ideias|Tus ideas)/ },
  es: { heading: "Tus ideas para Río, organizadas.", status: "Próximamente", foreign: /(Em breve|Coming soon|ção|Suas ideias|Your Rio)/ },
};

// Canned mock copy and capabilities the Concierge does not have today.
const canned = /(simulad|mocked|resposta inicial|initial mocked|respuesta inicial)/i;
const unsupported = /(reserv|book|compr|pay|pag[ao]|ingresso|ticket|dispon|availab|tempo real|real[- ]time|tiempo real|24\s*\/\s*7|garant|guarant|voo|flight|vuelo)/i;

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
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("request", (r) => { if (r.url().includes("/api/ai-concierge")) conciergeRequests.push(r.url()); });

    await page.goto(`${BASE}/${locale}/rebuild-lab/cinematic-3d-poc`, { waitUntil: "load", timeout: 180000 });
    await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
    // Walk the whole page so every section mounts, then settle on the Concierge.
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    const section = page.locator(SECTION);
    check(await section.count() === 1, `${tag}: section missing`);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    // Try every way a visitor could interact; nothing may reach the network.
    await page.locator(`${SECTION} input`).click({ force: true, timeout: 3000 }).catch(() => {});
    await page.keyboard.type("Quero conhecer o Rio").catch(() => {});
    await page.keyboard.press("Enter").catch(() => {});
    await page.locator(`${SECTION} button`).click({ force: true, timeout: 3000 }).catch(() => {});
    await page.locator(`${SECTION} ul li`).first().click({ force: true, timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const d = await page.evaluate((s) => {
      const sec = document.querySelector(s);
      const lum = (rgb) => {
        const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== "rgba(0, 0, 0, 0)" && !c.endsWith(", 0)")) return c; } return "rgb(255, 255, 255)"; };
      const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
      const texts = [...sec.querySelectorAll("*")].filter((el) => el.childElementCount === 0 && el.textContent.trim() && el.getClientRects().length && !el.closest("[aria-hidden='true']"));
      const rio = document.querySelector("section[aria-labelledby='rio-story-heading']");
      const input = sec.querySelector("input");
      const button = sec.querySelector("button");
      const status = document.getElementById(input.getAttribute("aria-describedby"));
      const shell = sec.querySelector("[data-concierge-shell]").getBoundingClientRect();
      return {
        heading: sec.querySelector("h2")?.textContent, h2s: sec.querySelectorAll("h2").length,
        bg: getComputedStyle(sec).backgroundColor, rioBg: getComputedStyle(rio).backgroundColor,
        seam: Math.round(sec.getBoundingClientRect().top - rio.getBoundingClientRect().bottom),
        height: Math.round(sec.getBoundingClientRect().height),
        text: sec.innerText,
        status: status?.textContent?.trim(),
        examples: sec.querySelectorAll("ul li").length,
        inputDisabled: input.disabled, inputValue: input.value, inputLabel: input.getAttribute("aria-label"),
        buttonDisabled: button.disabled, buttonLabel: button.getAttribute("aria-label"),
        forms: sec.querySelectorAll("form").length,
        interactive: [...sec.querySelectorAll("a, button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex='-1'])")].length,
        legacyWidget: document.querySelectorAll("[data-testid='ai-concierge-entry'], [data-testid='ai-concierge-panel']").length,
        shellFits: shell.left >= 0 && shell.right <= innerWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        minFont: Math.min(...texts.map((el) => parseFloat(getComputedStyle(el).fontSize))),
        lowContrast: texts.map((el) => ({ t: el.textContent.trim().slice(0, 24), r: +ratio(getComputedStyle(el).color, bgOf(el)).toFixed(2) })).filter((x) => x.r < 4.5),
        placeholderContrast: +ratio("rgb(157, 163, 165)", bgOf(input)).toFixed(2),
      };
    }, SECTION);

    const c = canonical[locale];
    check(conciergeRequests.length === 0, `${tag}: Home sent ${conciergeRequests.length} request(s) to /api/ai-concierge`);
    check(!canned.test(d.text), `${tag}: canned/mock response text visible`);
    check(!unsupported.test(d.text), `${tag}: unsupported capability wording: "${(d.text.match(unsupported) || [])[0]}"`);
    check(!c.foreign.test(d.text), `${tag}: mixed-language text: "${(d.text.match(c.foreign) || [])[0]}"`);
    check(d.heading === c.heading && d.h2s === 1, `${tag}: heading "${d.heading}"`);
    check(d.status === c.status, `${tag}: placeholder status "${d.status}"`);
    check(d.examples === 3, `${tag}: expected 3 example questions, found ${d.examples}`);
    check(d.inputDisabled && d.inputValue === "" && d.buttonDisabled && d.forms === 0, `${tag}: composer is operable (input disabled ${d.inputDisabled}, value "${d.inputValue}", button disabled ${d.buttonDisabled}, forms ${d.forms})`);
    check(d.interactive === 0, `${tag}: ${d.interactive} interactive element(s) in a placeholder section`);
    check(d.inputLabel?.includes(c.status.toLowerCase()) && d.buttonLabel?.includes(c.status.toLowerCase()), `${tag}: disabled controls do not announce the status (${d.inputLabel} / ${d.buttonLabel})`);
    check(d.legacyWidget === 0, `${tag}: legacy mock widget mounted on the rebuilt Home`);
    check(d.bg === "rgb(11, 14, 17)" && d.rioBg === "rgb(243, 239, 230)" && d.seam === 0, `${tag}: rhythm wrong (Concierge ${d.bg}, Rio Story ${d.rioBg}, gap ${d.seam})`);
    check(d.shellFits && d.overflow <= 0, `${tag}: shell/page overflow (fits ${d.shellFits}, overflow ${d.overflow})`);
    check(d.minFont >= 12, `${tag}: text below 12px (${d.minFont})`);
    check(d.lowContrast.length === 0, `${tag}: low-contrast text ${JSON.stringify(d.lowContrast)}`);
    check(d.placeholderContrast >= 4.5, `${tag}: placeholder contrast ${d.placeholderContrast}`);
    check(d.height <= (vp.w >= 1024 ? 700 : 1000), `${tag}: section too tall (${d.height}px)`);
    check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);

    notes.push(`${tag}: ${d.height}px, concierge requests ${conciergeRequests.length}, status "${d.status}", placeholder contrast ${d.placeholderContrast}`);
    await section.screenshot({ path: path.join(outDir, `concierge-${locale}-${vp.name}.png`) });
    await context.close();
  }
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.error("\nFAILURES:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nPASS RT-33 AI Concierge placeholder validation");
}
