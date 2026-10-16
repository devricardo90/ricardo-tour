#!/usr/bin/env node
/**
 * RT-114: basic accessibility checks of the tour page prototype (rebuild lab, mock data), local server only.
 * Checks per page: one h1; every <img> has an alt attribute (empty only inside a labelled button = decorative thumb);
 * every button has an accessible name; exactly one current thumbnail; keyboard focus on a gallery button is visible
 * (outline); <html lang> matches the locale. Not a substitute for a full audit (no axe-core in the project).
 * Usage: node scripts/rt-114-a11y-check.mjs http://127.0.0.1:3233 > docs/baseline/rt-114-prototype/a11y.json
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3233";
const TOURS = ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const out = [];
for (const locale of ["pt", "en", "es"]) {
  for (const id of TOURS) {
    await page.goto(`${BASE}/${locale}/rebuild-lab/tour-content-preview/${id}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="image-gallery"]');
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll("main img")];
      const badImgs = imgs.filter((img) => !img.hasAttribute("alt") || (img.getAttribute("alt") === "" && !img.closest("button[aria-label]")));
      const buttons = [...document.querySelectorAll("main button")];
      const unnamed = buttons.filter((b) => !(b.getAttribute("aria-label") || b.textContent?.trim()));
      return {
        h1: document.querySelectorAll("main h1").length,
        images: imgs.length,
        imagesWithoutAlt: badImgs.length,
        buttons: buttons.length,
        buttonsWithoutName: unnamed.length,
        currentThumbs: document.querySelectorAll('[data-testid="image-gallery"] [aria-current="true"]').length,
        htmlLang: document.documentElement.lang,
        livePosition: Boolean(document.querySelector('[data-testid="image-gallery"] [aria-live="polite"]')),
      };
    });
    await page.locator('[data-testid="image-gallery"] button').first().focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    r.focusOutlineVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.tagName !== "BUTTON") return false;
      const s = getComputedStyle(el);
      return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
    });
    r.ok = r.h1 === 1 && r.imagesWithoutAlt === 0 && r.buttonsWithoutName === 0 && r.currentThumbs === 1 && r.livePosition && r.focusOutlineVisible && r.htmlLang.startsWith(locale);
    out.push({ locale, id, ...r });
  }
}
await browser.close();
console.log(JSON.stringify({ pages: out.length, failing: out.filter((r) => !r.ok).length, results: out }, null, 2));
process.exit(out.every((r) => r.ok) ? 0 : 1);
