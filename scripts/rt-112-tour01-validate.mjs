#!/usr/bin/env node
/** Local RT-112/RT-115 evidence: TOUR-01 Cristo Redentor + Pão de Açúcar in the production-hidden rebuild lab (PT/EN/ES,
 *  desktop + mobile). Checks rendering, gallery, video, WhatsApp, absence of any price, overflow, console errors, a11y basics. */
import fs from "node:fs";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:3251";
const out = process.argv[3] ?? "docs/baseline/rt-112-tour01-cristo-pao";
const id = "cmlhxkpy9000028zq27rhytew";
const titles = { pt: "Cristo Redentor, Escadaria Selarón e Pão de Açúcar — Tour Privativo", en: "Christ the Redeemer + Sugarloaf Mountain — Private Tour", es: "Cristo Redentor + Pan de Azúcar — Tour Privado" };
const expectedPhotos = ["IMG_1162", "IMG_1171", "IMG_1163", "IMG_1181"];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const results = [];
try {
  for (const locale of ["pt", "en", "es"]) {
    for (const [device, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      page.setDefaultTimeout(120_000);
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      const response = await page.goto(`${base}/${locale}/rebuild-lab/tour-content-preview/${id}?precos=ocultos`, { waitUntil: "load" });
      await page.locator('[data-testid="image-gallery"]').waitFor();
      await page.locator('[data-testid="gallery-main-image"]').evaluate((img) => img.decode());
      const thumbs = page.locator('[data-testid="gallery-thumbs"] button');
      const photos = [];
      for (let i = 0; i < (await thumbs.count()); i += 1) {
        await thumbs.nth(i).click();
        await page.locator('[data-testid="gallery-main-image"]').evaluate((img) => img.decode());
        photos.push(await page.locator('[data-testid="gallery-main-image"]').evaluate((img) => ({ src: decodeURIComponent(img.currentSrc), alt: img.alt, loaded: img.naturalWidth > 0, fit: getComputedStyle(img).objectFit })));
      }
      const checks = await page.evaluate(() => {
        const text = document.body.innerText;
        const wa = [...document.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => a.getAttribute("href"));
        // Desktop: the booking-card CTA; mobile: the sticky bottom bar (RT-114 pattern).
        const ctaEl = window.innerWidth < 1024 ? document.querySelector('[data-testid="tour-cta-mobile"]') : document.querySelector('[data-testid="tour-cta"]');
        const cta = ctaEl?.getBoundingClientRect();
        const unnamed = [...document.querySelectorAll("button, a[href]")].filter((el) => !(el.getAttribute("aria-label") || el.textContent?.trim() || el.getAttribute("title"))).length;
        const video = document.querySelector("video");
        return {
          h1: [...document.querySelectorAll("h1")].map((h) => h.textContent?.trim()),
          price: /R\$\s?\d/.test(text),
          priceLabel: document.querySelector('[data-testid="tour-price"]')?.textContent?.trim(),
          whatsappLinks: wa.length,
          whatsappHasTitle: wa.every((h) => /Cristo|Christ/.test(decodeURIComponent(h ?? ""))),
          ctaInViewport: cta ? cta.top < window.innerHeight && cta.bottom > 0 : false,
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          unnamedControls: unnamed,
          videoAutoplay: video ? video.autoplay : null,
          videoPreload: video ? video.preload : null,
          sections: ["tour-itinerary", "tour-includes", "tour-faq", "tour-request", "tour-request-whatsapp", "tour-booking-card"].filter((t) => !document.querySelector(`[data-testid="${t}"]`)),
          thirdParty: [...document.images].some((i) => i.currentSrc.includes("terceiros-")),
        };
      });
      // Keyboard: first Tab stops reach a focusable control with a visible name.
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.tagName ?? null);
      const shot = `${out}/${locale}-${device}-viewport.png`;
      await page.screenshot({ path: shot });
      if (locale === "pt") await page.screenshot({ path: `${out}/pt-${device}-full.png`, fullPage: true });
      const ok =
        response?.status() === 200 && checks.h1.length === 1 && checks.h1[0] === titles[locale] && !checks.price &&
        checks.whatsappLinks >= 2 && checks.whatsappHasTitle && checks.ctaInViewport && !checks.overflowX && checks.unnamedControls === 0 &&
        checks.videoAutoplay === false && checks.sections.length === 0 && !checks.thirdParty && errors.length === 0 &&
        photos.length === expectedPhotos.length && photos.every((p, i) => p.loaded && p.alt && p.fit === "contain" && p.src.includes(expectedPhotos[i]));
      results.push({ locale, device, ok, status: response?.status(), checks, photos, focused, errors, screenshot: shot });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
fs.writeFileSync(`${out}/results.json`, JSON.stringify({ ok: results.every((r) => r.ok), date: new Date().toISOString(), results }, null, 2));
for (const r of results) console.log(`${r.locale} ${r.device}: ${r.ok ? "OK" : "FAIL"} status=${r.status} price=${r.checks.price} label="${r.checks.priceLabel}" wa=${r.checks.whatsappLinks} overflow=${r.checks.overflowX} photos=${r.photos.length} errors=${r.errors.length} missing=${r.checks.sections.join(",")}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
