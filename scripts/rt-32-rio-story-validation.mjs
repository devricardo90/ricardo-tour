/**
 * RT-32 validation — Rio Story editorial section (poster-first video + two stills).
 * Requires a dev server on :3218.
 *
 *   node scripts/rt-32-rio-story-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const ROUTE = (locale) => `${BASE}/${locale}/rebuild-lab/cinematic-3d-poc`;
const SECTION = "section[aria-labelledby='rio-story-heading']";
const DESKTOP_MP4 = "/media/rio-story/rio-story-desktop.mp4";
const MOBILE_MP4 = "/media/rio-story/rio-story-mobile.mp4";
const outDir = path.resolve(".tmp/rt-32-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const canonical = {
  pt: { heading: "Rio de Janeiro, em foco.", titles: ["Cenas do Rio", "Luz de fim de tarde", "Arquitetura e patrimônio"], play: "Reproduzir vídeo: Cenas do Rio" },
  en: { heading: "Rio de Janeiro, in focus.", titles: ["Scenes of Rio", "Late-afternoon light", "Architecture and heritage"], play: "Play video: Scenes of Rio" },
  es: { heading: "Río de Janeiro, en foco.", titles: ["Imágenes de Río", "Luz del atardecer", "Arquitectura y patrimonio"], play: "Reproducir vídeo: Imágenes de Río" },
};

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });

async function open({ viewport = { width: 1440, height: 900 }, touch = false, reducedMotion = "no-preference", connection, abortVideo = false, locale = "pt" } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion });
  if (connection) {
    await context.addInitScript((c) => Object.defineProperty(Navigator.prototype, "connection", { get: () => c, configurable: true }), connection);
  }
  if (abortVideo) await context.route("**/*.mp4", (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  const media = [];
  page.on("console", (m) => { if (m.type() === "error" && !(abortVideo && /ERR_FAILED/.test(m.text()))) errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes(".mp4") || u.includes("rio-story-poster")) media.push({ url: u.includes(DESKTOP_MP4) ? "desktop" : u.includes(MOBILE_MP4) ? "mobile" : u.includes("poster") ? "poster" : u, t: Date.now() });
  });
  await page.goto(ROUTE(locale), { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForLoadState("load", { timeout: 180000 }).catch(() => {});
  await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
  return { context, page, errors, media };
}

const videoCount = (media, kind) => media.filter((m) => (kind ? m.url === kind : m.url === "desktop" || m.url === "mobile")).length;
const sectionTop = (page) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, SECTION);
const scrollToDistance = async (page, distance) => {
  // distance = gap between the viewport bottom and the section top (negative = inside the viewport)
  const top = await sectionTop(page);
  const vh = await page.evaluate(() => innerHeight);
  await page.evaluate((y) => scrollTo(0, y), Math.max(0, top - vh - distance));
  await page.waitForTimeout(900);
};
const scrollVideoIntoView = async (page) => {
  await page.evaluate(() => document.querySelector("[data-video-state]").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(2500);
};
const video = (page) => page.evaluate(() => {
  const host = document.querySelector("[data-video-state]");
  const v = host.querySelector("video");
  const btn = host.querySelector("button");
  return { state: host.dataset.videoState, src: v.currentSrc || v.getAttribute("src"), time: v.currentTime, paused: v.paused, muted: v.muted, opacity: getComputedStyle(v).opacity, button: btn?.getAttribute("aria-label") ?? null, posterAlt: host.querySelector("img")?.alt, posterVisible: host.querySelector("img")?.getBoundingClientRect().height > 0 };
});

try {
  // Warm the dev compiler.
  { const { context } = await open(); await context.close(); }

  // ---- A. Desktop: poster-first, lazy attach near section, autoplay when visible, pause offscreen, resume ----
  {
    const { context, page, errors, media } = await open();
    await page.waitForTimeout(2000);
    check(videoCount(media) === 0, `A1: video requested on initial load (${JSON.stringify(media)})`);
    await scrollToDistance(page, 1400);
    check(videoCount(media) === 0, "A2: video requested while Rio Story is still far from the viewport (1400px)");
    await scrollToDistance(page, 900);
    check(videoCount(media) === 0, "A3: video requested before the 600px approach margin");
    await scrollToDistance(page, 300);
    check(videoCount(media, "desktop") >= 1, "A4: desktop derivative not requested as Rio Story approaches");
    check(videoCount(media, "mobile") === 0, "A5: mobile derivative requested on desktop");
    const firstPoster = media.find((m) => m.url === "poster")?.t ?? Infinity;
    const firstVideo = media.find((m) => m.url === "desktop")?.t ?? -Infinity;
    check(firstPoster <= firstVideo, "A6: video requested before the poster");

    await scrollVideoIntoView(page);
    let v = await video(page);
    check(v.state === "playing" && !v.paused && v.muted, `A7: not autoplaying muted when visible (${JSON.stringify(v)})`);
    const t1 = v.time; await page.waitForTimeout(1200); v = await video(page);
    check(v.time > t1, `A8: playback not advancing (${t1} → ${v.time})`);
    check(v.src.includes(DESKTOP_MP4), `A9: desktop not playing desktop derivative (${v.src})`);
    check(v.button && v.button.includes(canonical.pt.play.split(":")[1].trim()), `A10: control lacks a named label (${v.button})`);

    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1200);
    v = await video(page);
    check(v.paused && v.state === "paused", `A11: video not paused offscreen (${JSON.stringify(v)})`);
    const requestsBeforeReturn = media.filter((m) => m.url === "desktop").length;
    await scrollVideoIntoView(page);
    v = await video(page);
    check(v.state === "playing" || v.state === "ended", `A12: video did not resume on return (${v.state})`);
    const distinctVideoUrls = new Set(media.filter((m) => m.url === "desktop" || m.url === "mobile").map((m) => m.url));
    check(distinctVideoUrls.size === 1, `A13: more than one video file requested (${[...distinctVideoUrls]})`);
    notes.push(`A: desktop — initial video requests 0; attach near section; ${requestsBeforeReturn} request(s) for 1 file (range requests), autoplay muted, paused offscreen, resumed`);

    // Manual pause stays paused across scroll; manual play resumes.
    await page.evaluate(() => { const v = document.querySelector("[data-video-state] video"); if (v.ended) v.currentTime = 0; });
    const btn = page.locator("[data-video-state] button");
    if ((await video(page)).state !== "playing") { await btn.click(); await page.waitForTimeout(800); }
    await btn.click(); await page.waitForTimeout(600);
    check((await video(page)).state === "paused", "A14: pause button did not pause");
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);
    await scrollVideoIntoView(page);
    check((await video(page)).state === "paused", "A15: video auto-resumed after a manual pause");
    await btn.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
    check((await video(page)).state === "playing", "A16: keyboard Enter did not start playback");

    // Ends once (no loop) and offers replay.
    await page.evaluate(() => { const v = document.querySelector("[data-video-state] video"); v.currentTime = Math.max(0, v.duration - 0.3); });
    await page.waitForFunction(() => document.querySelector("[data-video-state]")?.dataset.videoState === "ended", null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    v = await video(page);
    check(v.state === "ended" && /novamente/i.test(v.button ?? ""), `A17: clip loops or lacks replay (${JSON.stringify(v)})`);
    await page.locator(SECTION).screenshot({ path: path.join(outDir, "A-desktop-playing.png") });
    check(errors.length === 0, `A: errors ${errors.join(" | ")}`);
    await context.close();
  }

  // ---- B. Mobile: mobile derivative only ----
  {
    const { context, page, errors, media } = await open({ viewport: { width: 390, height: 844 }, touch: true });
    await page.waitForTimeout(1500);
    check(videoCount(media) === 0, "B1: video requested on initial mobile load");
    await scrollVideoIntoView(page);
    const v = await video(page);
    check(videoCount(media, "mobile") >= 1 && videoCount(media, "desktop") === 0, `B2: mobile got wrong derivative (${JSON.stringify(media.map((m) => m.url))})`);
    check(v.state === "playing" && v.src.includes(MOBILE_MP4), `B3: mobile not playing inline muted derivative (${JSON.stringify(v)})`);
    const inline = await page.evaluate(() => document.querySelector("[data-video-state] video").playsInline);
    check(inline, "B4: playsInline missing");
    check(errors.length === 0, `B: errors ${errors.join(" | ")}`);
    notes.push("B: mobile — only rio-story-mobile.mp4 requested, playing inline");
    await context.close();
  }

  // ---- C. Reduced motion: poster only until the user asks ----
  {
    const { context, page, errors, media } = await open({ reducedMotion: "reduce" });
    await scrollVideoIntoView(page);
    let v = await video(page);
    check(videoCount(media) === 0 && v.state === "idle" && v.posterVisible, `C1: reduced motion loaded/played video (${JSON.stringify(v)}, ${media.length} req)`);
    await page.locator("[data-video-state] button").click(); await page.waitForTimeout(2000);
    v = await video(page);
    check(v.state === "playing", `C2: user-initiated play failed under reduced motion (${v.state})`);
    check(errors.length === 0, `C: errors ${errors.join(" | ")}`);
    notes.push("C: reduced motion — 0 video requests until the play button; user-initiated play works");
    await context.close();
  }

  // ---- D. Data saver: no video until requested; then the light derivative ----
  {
    const { context, page, errors, media } = await open({ connection: { saveData: true, effectiveType: "4g" } });
    await scrollVideoIntoView(page);
    check(videoCount(media) === 0 && (await video(page)).state === "idle", "D1: saveData downloaded video without user action");
    await page.locator("[data-video-state] button").click(); await page.waitForTimeout(2000);
    check(videoCount(media, "mobile") >= 1 && videoCount(media, "desktop") === 0, `D2: saveData play did not use the light derivative (${JSON.stringify(media.map((m) => m.url))})`);
    check(errors.length === 0, `D: errors ${errors.join(" | ")}`);
    notes.push("D: saveData — 0 video requests until play; then mobile derivative only (desktop master never fetched)");
    await context.close();
  }

  // ---- E. Slow 3G on desktop: light derivative ----
  {
    const { context, page, errors, media } = await open({ connection: { saveData: false, effectiveType: "3g" } });
    await scrollVideoIntoView(page);
    check(videoCount(media, "mobile") >= 1 && videoCount(media, "desktop") === 0, `E1: 3g desktop did not use the light derivative (${JSON.stringify(media.map((m) => m.url))})`);
    check(errors.length === 0, `E: errors ${errors.join(" | ")}`);
    notes.push("E: 3g — light derivative on desktop");
    await context.close();
  }

  // ---- F. Video failure: poster stays, section intact ----
  {
    const { context, page, errors } = await open({ abortVideo: true });
    await scrollVideoIntoView(page);
    await page.waitForTimeout(1500);
    const v = await video(page);
    check(v.state === "failed" && v.posterVisible && v.button === null && v.opacity === "0", `F1: failure not handled gracefully (${JSON.stringify(v)})`);
    const pageErrors = errors.filter((e) => e.startsWith("pageerror"));
    check(pageErrors.length === 0, `F2: page errors on video failure ${pageErrors.join(" | ")}`);
    await page.locator(SECTION).screenshot({ path: path.join(outDir, "F-video-failed.png") });
    notes.push("F: aborted video → state failed, poster kept, control removed, no page errors");
    await context.close();
  }

  // ---- H. Browser blocks autoplay: falls back to click-to-play without errors ----
  {
    const strict = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader", "--autoplay-policy=document-user-activation-required"] });
    const context = await strict.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException("blocked", "NotAllowedError")); };
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(ROUTE("pt"), { waitUntil: "load", timeout: 180000 });
    await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
    await scrollVideoIntoView(page);
    await page.waitForFunction(() => document.querySelector("[data-video-state]")?.dataset.videoState !== "idle", null, { timeout: 15000 }).catch(() => {});
    const v = await video(page);
    check(v.state === "paused" && v.button === canonical.pt.play && v.posterVisible, `H1: blocked autoplay did not fall back to click-to-play (${JSON.stringify(v)})`);
    check(errors.length === 0, `H2: page errors when autoplay is blocked ${errors.join(" | ")}`);
    notes.push("H: autoplay rejected by policy → paused poster with play control, no errors");
    await strict.close();
  }

  // ---- G. Layout / i18n matrix ----
  const viewports = [
    { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
    { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
  ];
  for (const locale of ["pt", "en", "es"]) {
    for (const vp of viewports) {
      if (locale !== "pt" && !["1440x900", "390x844"].includes(vp.name)) continue;
      const tag = `${locale}@${vp.name}`;
      const { context, page, errors } = await open({ viewport: { width: vp.w, height: vp.h }, touch: vp.touch, locale, reducedMotion: "reduce" });
      await page.locator(SECTION).scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
      const d = await page.evaluate((s) => {
        const sec = document.querySelector(s);
        const figs = [...sec.querySelectorAll("figure")].map((f) => { const r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), title: f.querySelector("figcaption span:last-child")?.textContent, alt: f.querySelector("img")?.alt }; });
        const why = document.querySelector("section[aria-labelledby='why-rick-travel-heading']");
        const inner = sec.firstElementChild;
        return {
          heading: sec.querySelector("h2")?.textContent, h2s: sec.querySelectorAll("h2").length,
          figs, height: Math.round(sec.getBoundingClientRect().height),
          bg: getComputedStyle(sec).backgroundColor, whyBg: getComputedStyle(why).backgroundColor,
          seam: Math.round(sec.getBoundingClientRect().top - why.getBoundingClientRect().bottom),
          rule: getComputedStyle(inner).borderTopWidth + " " + getComputedStyle(inner).borderTopStyle,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          links: sec.querySelectorAll("a").length,
          videoHidden: sec.querySelector("video").getAttribute("aria-hidden"),
          minCaptionPx: Math.min(...[...sec.querySelectorAll("figcaption span")].map((e) => parseFloat(getComputedStyle(e).fontSize))),
        };
      }, SECTION);
      const c = canonical[locale];
      check(d.heading === c.heading && d.h2s === 1, `${tag}: heading "${d.heading}"`);
      check(JSON.stringify(d.figs.map((f) => f.title)) === JSON.stringify(c.titles), `${tag}: media titles ${JSON.stringify(d.figs.map((f) => f.title))}`);
      check(d.figs.every((f) => f.alt && f.alt.length > 10), `${tag}: missing media alt text`);
      check(d.bg === "rgb(243, 239, 230)" && d.whyBg === d.bg && d.seam === 0, `${tag}: light-to-light seam wrong (${d.bg}/${d.whyBg}, gap ${d.seam})`);
      check(d.rule.startsWith("1px solid"), `${tag}: no separating rule between Why Rick Travel and Rio Story (${d.rule})`);
      check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
      check(d.links === 0, `${tag}: unexpected link/CTA (${d.links})`);
      check(d.videoHidden === "true", `${tag}: raw video element exposed to AT`);
      check(d.minCaptionPx >= 12, `${tag}: caption text below 12px`);
      const [primary, a, b] = d.figs;
      if (vp.w >= 768) {
        check(primary.top === a.top && a.top === b.top, `${tag}: desktop/tablet media not on one row`);
        check(primary.w >= a.w * 1.3 && primary.w >= b.w * 1.3, `${tag}: primary not dominant (${primary.w} vs ${a.w}/${b.w})`);
        check(d.height <= 640, `${tag}: section too tall (${d.height}px)`);
      } else {
        check(primary.top < a.top && a.top === b.top, `${tag}: mobile order not primary → two stills`);
        check(primary.w > a.w * 1.8, `${tag}: mobile primary not full width (${primary.w} vs ${a.w})`);
      }
      check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
      notes.push(`G ${tag}: ${d.height}px, media ${d.figs.map((f) => `${f.w}x${f.h}`).join(" / ")}`);
      await page.locator(SECTION).screenshot({ path: path.join(outDir, `G-${locale}-${vp.name}.png`) });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(notes.join("\n"));
if (failures.length) {
  console.error("\nFAILURES:\n" + failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("\nPASS RT-32 Rio Story validation");
}
