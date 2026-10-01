/**
 * RT-52 validation — public site foundation and shared shell ((site) route group).
 * Requires a dev server on :3218 and the local Postgres (legacy routes render real data).
 *
 *   node scripts/rt-52-site-shell-validation.mjs
 *   RT52_BASELINE=.tmp/rt52-before node scripts/rt-52-site-shell-validation.mjs   # also pixel-diffs legacy routes
 *
 * The (site) group has no pages yet, so this script creates a TEMPORARY probe page at
 * app/[locale]/(site)/site-probe/page.tsx, validates the shell through it, and always removes it (finally block).
 * The committed architecture does not depend on the probe.
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-52-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const probeDir = path.resolve("app/[locale]/(site)/site-probe");
const probeFile = path.join(probeDir, "page.tsx");
const probeSource = `// TEMPORARY RT-52 validation probe. Created and removed by scripts/rt-52-site-shell-validation.mjs; never committed.
export const metadata = { robots: { index: false, follow: false } };

export default function SiteProbe() {
  return (
    <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-10 lg:px-12">
      <h1 className="site-display text-[40px] leading-[1.05]" data-probe="display">Site shell probe</h1>
      <p className="mt-4 text-[16px]" data-probe="body">Body copy rendered with the public body font.</p>
      <div style={{ height: 7000 }} aria-hidden="true" />
      <p data-probe="end">End of probe.</p>
    </div>
  );
}
`;

const copy = {
  pt: { nav: ["Experiências", "Sobre o Rio", "AI Concierge", "Quem somos"], cta: "Planeje sua viagem", skip: "Pular para o conteúdo", foreign: /(Experiences|About Rio|About us|Plan your trip|Quiénes|Planifica|Sobre Río|Contact form|Formulario)/ },
  en: { nav: ["Experiences", "About Rio", "AI Concierge", "About us"], cta: "Plan your trip", skip: "Skip to content", foreign: /(Experiências|Sobre o Rio|Quem somos|Planeje|Quiénes|Planifica|Sobre Río|Formulário|Formulario)/ },
  es: { nav: ["Experiencias", "Sobre Río", "AI Concierge", "Quiénes somos"], cta: "Planifica tu viaje", skip: "Saltar al contenido", foreign: /(Experiências|Sobre o Rio|Quem somos|Planeje|About us|Plan your trip|Formulário|Contact form)/ },
};
const hashes = ["experiences", "rio-story", "ai-concierge", "about-rick-travel"];
const approved = { email: "contato@ricardotour.com", display: "+55 22 99846-1906", wa: "https://wa.me/5522998461906", ig: "https://www.instagram.com/ricktravelbrasil/" };
const stale = /(travelrick|\+?55\s?21|96681|97116|5521966819928|5521971168114)/i;
const legalPlaceholders = /(privacidade|privacy|termos de uso|terms of|términos|politica de|política de)/i;
const accountEntry = /(entrar|login|log in|sign in|criar conta|create account|conta\b|account|registrar|register|iniciar sesión|cuenta)/i;
const globalTokens = { "--primary": "#123a28", "--background": "#f4f5f7", "--foreground": "#102033", "--ring": "#2b7869", "--radius": "1rem" };

const viewports = [
  { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
];
const runs = viewports.map((vp) => ({ locale: "pt", vp }));
runs.push({ locale: "en", vp: viewports[0] }, { locale: "en", vp: viewports[3] }, { locale: "es", vp: viewports[0] }, { locale: "es", vp: viewports[1] }, { locale: "es", vp: viewports[3] }, { locale: "es", vp: viewports[4] });

let browser;
try {
  // ---------- static checks (no browser) ----------
  const adminPaths = ["app/globals.css", "components/ui", "app/[locale]/admin", "app/[locale]/layout.tsx"];
  const adminDiff = execSync(`git diff --name-only 1da2abd -- ${adminPaths.map((p) => `"${p}"`).join(" ")}`, { encoding: "utf8" }).trim();
  check(adminDiff === "", `ADMIN/global files changed vs RT-35 baseline: ${adminDiff}`);
  const layoutSrc = fs.readFileSync("app/[locale]/(site)/layout.tsx", "utf8");
  check(!/AIConciergeWidget|ai-concierge-widget/.test(layoutSrc), "(site) layout imports the AI widget");
  const fontsSrc = fs.readFileSync("app/[locale]/(site)/fonts.ts", "utf8");
  const fontSrcValues = [...fontsSrc.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]);
  check(fontSrcValues.length === 2 && fontSrcValues.every((v) => !/docs/.test(v) && /fonts\//.test(v)) && /--site-display/.test(fontsSrc) && /--site-body/.test(fontsSrc), `(site) font sources ${JSON.stringify(fontSrcValues)} depend on docs/ or lack --site-* variables`);
  check(fs.existsSync("app/fonts/cormorant-garamond/latin.woff2") && fs.existsSync("app/fonts/inter/latin.woff2"), "application-owned font files missing");
  const cssSrc = fs.readFileSync("app/[locale]/(site)/site-theme.css", "utf8");
  check(!/^\s*:root\s*[{,]/m.test(cssSrc) && /\.site-theme\s*\{/.test(cssSrc), "site-theme.css is not scoped to .site-theme");
  const legacyHolders = execSync("git grep -l -i -E \"travelrick|96681-9928|97116-8114|5521971168114|5521966819928\" -- app components lib messages", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const newSurface = legacyHolders.filter((f) => /^(components\/site\/|app\/\[locale\]\/\(site\)\/|components\/home-(header|footer)\.tsx)/.test(f));
  check(newSurface.length === 0, `superseded contact values in NEW public surfaces: ${newSurface.join(", ")}`);
  notes.push(`legacy code still holding superseded contact values (left for RT-55/RT-56, not touched): ${legacyHolders.filter((f) => !newSurface.includes(f)).join(", ") || "none"}`);

  // ---------- probe ----------
  fs.mkdirSync(probeDir, { recursive: true });
  fs.writeFileSync(probeFile, probeSource);
  browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
  const warm = await browser.newContext();
  let status = 0;
  for (let i = 0; i < 40 && status !== 200; i++) {
    status = await warm.request.get(`${BASE}/pt/site-probe`, { timeout: 120000 }).then((r) => r.status()).catch(() => 0);
    if (status !== 200) await new Promise((r) => setTimeout(r, 3000));
  }
  check(status === 200, `probe page did not compile (HTTP ${status})`);
  await warm.close();

  const externalChecked = new Map();
  for (const { locale, vp } of runs) {
    const tag = `${locale}@${vp.name}`;
    const c = copy[locale];
    const desktop = vp.w >= 1024;
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch });
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("request", (r) => requests.push(decodeURIComponent(r.url())));

    await page.goto(`${BASE}/${locale}/site-probe`, { waitUntil: "load", timeout: 180000 });
    await page.waitForTimeout(1200);
    const atLoad = { cadastur: requests.filter((u) => u.includes("cadastro/cadastur")).length };

    // ---------- foundations ----------
    const found = await page.evaluate(() => {
      const theme = document.querySelector(".site-theme");
      const cs = theme && getComputedStyle(theme);
      const h1 = document.querySelector("[data-probe='display']");
      const body = document.querySelector("[data-probe='body']");
      const root = getComputedStyle(document.documentElement);
      const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
      const vars = Object.fromEntries(["--site-display", "--site-body", "--site-charcoal", "--site-cream", "--site-cream-soft", "--site-gold", "--site-gold-bright", "--site-on-dark", "--site-focus", "--journey-display"].map((v) => [v, cs?.getPropertyValue(v).trim()]));
      return {
        themeCount: document.querySelectorAll(".site-theme").length, vars,
        h1Font: h1 && getComputedStyle(h1).fontFamily, bodyFont: body && getComputedStyle(body).fontFamily,
        loadedFamilies: loaded, rootSiteVar: root.getPropertyValue("--site-charcoal").trim(), bodyFontGlobal: getComputedStyle(document.body).fontFamily,
        globals: Object.fromEntries(Object.keys({ "--primary": 1, "--background": 1, "--foreground": 1, "--ring": 1, "--radius": 1 }).map((v) => [v, root.getPropertyValue(v).trim()])),
        siteTheme: cs && { bg: cs.backgroundColor, display: cs.display },
      };
    });
    check(found.themeCount === 1, `${tag}: expected one .site-theme wrapper (${found.themeCount})`);
    for (const [v, val] of Object.entries(found.vars)) check(!!val, `${tag}: CSS variable ${v} missing on .site-theme`);
    check(found.vars["--site-charcoal"].toLowerCase() === "#0b0e11" && found.vars["--site-gold"].toLowerCase() === "#c8a86b", `${tag}: token values ${found.vars["--site-charcoal"]} / ${found.vars["--site-gold"]}`);
    check(/siteDisplay|site_?display|cormorant/i.test(found.h1Font || "") && /siteBody|site_?body|inter/i.test(found.bodyFont || ""), `${tag}: public fonts not applied (h1 ${found.h1Font} | body ${found.bodyFont})`);
    check(found.loadedFamilies.length >= 2, `${tag}: fewer than 2 loaded fonts (${JSON.stringify(found.loadedFamilies)})`);
    check(found.rootSiteVar === "", `${tag}: --site-* tokens leaked to :root`);
    check(Object.entries(globalTokens).every(([k, v]) => found.globals[k] === v), `${tag}: global tokens changed ${JSON.stringify(found.globals)}`);
    check(!/Cormorant|Inter\b/i.test(found.bodyFontGlobal) || found.bodyFontGlobal.includes("Segoe"), `${tag}: global body font altered (${found.bodyFontGlobal})`);
    const fontUrls = requests.filter((u) => /\.woff2/.test(u));
    check(!requests.some((u) => /docs[\\/]baseline|docs%2Fbaseline/.test(u)), `${tag}: a request touches docs/baseline`);
    check(fontUrls.length >= 2 && fontUrls.every((u) => u.includes("/_next/static/media/")), `${tag}: font runtime paths ${JSON.stringify(fontUrls)}`);

    // ---------- header ----------
    const h = await page.evaluate(() => {
      const theme = document.querySelector(".site-theme");
      const header = theme.querySelector("header[role='banner']");
      const nav = header.querySelector("nav[aria-label]");
      const vis = (el) => el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
      const desktopLinks = [...nav.querySelectorAll("a")].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href"), v: vis(a) }));
      const cta = [...header.querySelectorAll("a")].find((a) => /#globe-next$/.test(a.getAttribute("href") || ""));
      const logo = header.querySelector("a[aria-label]");
      const lang = [...header.querySelectorAll("a[hreflang]")].filter(vis).map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href"), cur: a.getAttribute("aria-current"), h: Math.round(a.getBoundingClientRect().height) }));
      const hr = header.getBoundingClientRect(); const lr = logo.querySelector("svg").getBoundingClientRect();
      const btn = header.querySelector("button[aria-controls='site-mobile-navigation']");
      const mainEls = document.querySelectorAll("main").length; const footer = theme.querySelector("footer");
      return {
        order: [...theme.children].map((e) => e.tagName.toLowerCase()), position: getComputedStyle(header).position, height: Math.round(hr.height), bg: getComputedStyle(header).backgroundColor,
        navLabel: nav.getAttribute("aria-label"), desktopLinks, desktopVisible: vis(nav), cta: cta && { t: cta.textContent.trim(), href: cta.getAttribute("href"), w: Math.round(cta.getBoundingClientRect().width), h: Math.round(cta.getBoundingClientRect().height), v: vis(cta) },
        logoHref: logo.getAttribute("href"), logoLabel: logo.getAttribute("aria-label"), logoRatio: +(lr.width / lr.height).toFixed(3),
        lang, text: header.innerText, hrefLangSv: !!header.querySelector("a[hreflang='sv']"),
        menu: btn && { v: vis(btn), expanded: btn.getAttribute("aria-expanded"), w: Math.round(btn.getBoundingClientRect().width), h: Math.round(btn.getBoundingClientRect().height), label: btn.getAttribute("aria-label") },
        panelHidden: document.getElementById("site-mobile-navigation")?.hidden, mainEls, footerInsideMain: !!footer?.closest("main"), skip: theme.querySelector("a[href='#main-content']")?.textContent.trim(),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, aiWidget: document.querySelectorAll("[data-testid='ai-concierge-entry'], [data-testid='ai-concierge-panel']").length,
      };
    });
    check(h.order.join(",") === "a,header,main,footer", `${tag}: shell order ${h.order.join(",")}`);
    check(h.position === "sticky" && h.bg === "rgb(11, 14, 17)" && h.height >= 56 && h.height <= 72, `${tag}: header ${h.position} ${h.bg} ${h.height}px`);
    check(h.skip === c.skip, `${tag}: skip link "${h.skip}"`);
    check(h.mainEls === 1 && !h.footerInsideMain, `${tag}: landmark structure (main ${h.mainEls}, footerInsideMain ${h.footerInsideMain})`);
    const hrefRe = new RegExp(`^/${locale}/?#`);
    check(h.cta && h.cta.t === c.cta && new RegExp(`^/${locale}/?#globe-next$`).test(h.cta.href) && h.cta.h >= 40 && h.cta.v, `${tag}: CTA ${JSON.stringify(h.cta)}`);
    check(JSON.stringify(h.desktopLinks.map((l) => l.t)) === JSON.stringify(c.nav), `${tag}: nav labels ${JSON.stringify(h.desktopLinks.map((l) => l.t))}`);
    check(h.desktopLinks.length === 4 && h.desktopLinks.every((l, i) => hrefRe.test(l.href) && l.href.endsWith(`#${hashes[i]}`)), `${tag}: nav hrefs ${JSON.stringify(h.desktopLinks.map((l) => l.href))} (expected /${locale}#...)`);
    check(new RegExp(`^/${locale}/?$`).test(h.logoHref) && h.logoLabel, `${tag}: logo link ${h.logoHref}`);
    check(Math.abs(h.logoRatio - 520 / 170) / (520 / 170) < 0.03, `${tag}: logo distorted ${h.logoRatio}`);
    check(!accountEntry.test(h.text) && !/contato|contact|contacto/i.test(h.desktopLinks.map((l) => l.t).join(" ")), `${tag}: account entry or Contato in header ("${(h.text.match(accountEntry) || [])[0]}")`);
    check(!h.hrefLangSv && !/\bSV\b/.test(h.text), `${tag}: SV control exposed`);
    check(!c.foreign.test(h.text), `${tag}: mixed-language header "${(h.text.match(c.foreign) || [])[0]}"`);
    check(h.overflow <= 0, `${tag}: horizontal overflow ${h.overflow}px`);
    check(h.aiWidget === 0, `${tag}: legacy AI widget mounted`);
    if (desktop) {
      check(h.desktopVisible && h.desktopLinks.every((l) => l.v), `${tag}: desktop nav not visible`);
      check(h.lang.length === 3 && h.lang.every((l) => l.href === `/${l.t.toLowerCase()}/site-probe`) && h.lang.filter((l) => l.cur === "true").map((l) => l.t).join() === locale.toUpperCase(), `${tag}: language links ${JSON.stringify(h.lang)}`);
      check(h.menu && !h.menu.v, `${tag}: menu button visible on desktop`);
    } else {
      check(!h.desktopVisible && h.menu && h.menu.v && h.menu.expanded === "false" && h.panelHidden === true && h.menu.w >= 44 && h.menu.h >= 44, `${tag}: menu trigger ${JSON.stringify(h.menu)} hidden ${h.panelHidden}`);
    }

    // keyboard: skip link first, visible focus ring on a nav/CTA link
    await page.keyboard.press("Tab");
    await page.waitForTimeout(350);
    const skipFocus = await page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { href: e.getAttribute("href"), visible: r.top >= 0 && r.bottom > 0 }; });
    check(skipFocus.href === "#main-content" && skipFocus.visible, `${tag}: skip link not first/visible on focus ${JSON.stringify(skipFocus)}`);
    await page.locator(desktop ? "header nav[aria-label]:visible a" : "header a[href$='#globe-next']").first().focus();
    const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { s: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }; });
    check(ring.s !== "none" && ring.w >= 2, `${tag}: no visible focus ring ${JSON.stringify(ring)}`);

    // behaviour
    if (desktop) {
      await page.locator("header nav[aria-label]:visible a").first().click();
      await page.waitForURL(new RegExp(`/${locale}/?#experiences$`), { timeout: 60000 }).catch(() => {});
      check(new RegExp(`/${locale}/?#experiences$`).test(page.url()), `${tag}: nav click went to ${page.url()}`);
      await page.goBack().catch(() => {});
      await page.waitForURL(new RegExp(`/${locale}/site-probe`), { timeout: 60000 }).catch(() => {});
    } else {
      const btn = page.locator("button[aria-controls='site-mobile-navigation']");
      await btn.click(); await page.waitForTimeout(250);
      const open = await page.evaluate(() => { const p = document.getElementById("site-mobile-navigation"); const b = document.querySelector("button[aria-controls='site-mobile-navigation']"); const r = p.getBoundingClientRect(); return { hidden: p.hidden, expanded: b.getAttribute("aria-expanded"), label: b.getAttribute("aria-label"), links: [...p.querySelector("nav").querySelectorAll("a")].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href") })), targets: [...p.querySelectorAll("a")].map((a) => { const q = a.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }), lang: p.querySelectorAll("a[hreflang]").length, inView: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, locked: getComputedStyle(document.body).overflow === "hidden", menuRole: !!p.querySelector("[role=menu]") }; });
      check(!open.hidden && open.expanded === "true" && open.label !== h.menu.label, `${tag}: menu did not open / state not announced`);
      check(JSON.stringify(open.links.map((l) => l.t)) === JSON.stringify(c.nav) && open.links.every((l, i) => hrefRe.test(l.href) && l.href.endsWith(`#${hashes[i]}`)), `${tag}: menu links ${JSON.stringify(open.links)}`);
      check(open.targets.every(([w, hh]) => w >= 44 && hh >= 44), `${tag}: menu touch targets below 44x44 ${JSON.stringify(open.targets)}`);
      check(open.lang === 3 && open.inView && !open.locked && !open.menuRole, `${tag}: menu panel (lang ${open.lang}, inView ${open.inView}, locked ${open.locked}, role=menu ${open.menuRole})`);
      await page.screenshot({ path: path.join(outDir, `menu-${locale}-${vp.name}.png`), clip: { x: 0, y: 0, width: vp.w, height: Math.min(vp.h, 460) } });
      await page.keyboard.press("Escape"); await page.waitForTimeout(200);
      const closed = await page.evaluate(() => ({ hidden: document.getElementById("site-mobile-navigation").hidden, exp: document.querySelector("button[aria-controls='site-mobile-navigation']").getAttribute("aria-expanded"), focus: document.activeElement === document.querySelector("button[aria-controls='site-mobile-navigation']") }));
      check(closed.hidden && closed.exp === "false" && closed.focus, `${tag}: Escape did not close/return focus ${JSON.stringify(closed)}`);
      await btn.click(); await page.waitForTimeout(150);
      await page.mouse.click(vp.w / 2, vp.h - 20); await page.waitForTimeout(250);
      check(await page.evaluate(() => document.getElementById("site-mobile-navigation").hidden), `${tag}: outside click did not close the menu`);
      await btn.click(); await page.waitForTimeout(150);
      await page.locator("#site-mobile-navigation a").first().click();
      await page.waitForURL(new RegExp(`/${locale}/?#experiences$`), { timeout: 60000 }).catch(() => {});
      check(new RegExp(`/${locale}/?#experiences$`).test(page.url()), `${tag}: menu link went to ${page.url()}`);
      await page.goBack().catch(() => {});
      await page.waitForURL(new RegExp(`/${locale}/site-probe`), { timeout: 60000 }).catch(() => {});
    }
    await page.waitForSelector("[data-probe='end']", { timeout: 60000 });

    // sticky while scrolling
    await page.evaluate(() => scrollTo({ top: 1500, behavior: "instant" })); await page.waitForTimeout(400);
    check(await page.evaluate(() => Math.round(document.querySelector("header[role='banner']").getBoundingClientRect().top)) === 0, `${tag}: header not stuck while scrolled`);

    // ---------- footer ----------
    const earlyCadastur = requests.filter((u) => u.includes("cadastro/cadastur")).length;
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await page.waitForFunction(() => { const i = document.querySelector("footer[role='contentinfo'] img"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 }).catch(() => {});
    const f = await page.evaluate(() => {
      const footer = document.querySelector("footer[role='contentinfo']");
      const links = [...footer.querySelectorAll("a[href]")].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel"), aria: a.getAttribute("aria-label"), h: Math.round(a.getBoundingClientRect().height) }));
      const imgs = [...footer.querySelectorAll("img")].map((i) => ({ alt: i.alt, w: i.naturalWidth, complete: i.complete, ratio: +(i.getBoundingClientRect().width / i.getBoundingClientRect().height).toFixed(2), loading: i.getAttribute("loading") }));
      return {
        bg: getComputedStyle(footer).backgroundColor, height: Math.round(footer.getBoundingClientRect().height), text: footer.innerText, links, imgs,
        headings: [...footer.querySelectorAll("h1,h2,h3")].map((x) => x.tagName), navs: footer.querySelectorAll("nav").length,
        minLinkFont: Math.min(...[...footer.querySelectorAll("a")].map((a) => parseFloat(getComputedStyle(a).fontSize))),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, footers: document.querySelectorAll("footer").length,
      };
    });
    check(f.bg === "rgb(11, 14, 17)" && f.footers === 1, `${tag}: footer surface ${f.bg} / count ${f.footers}`);
    check(f.height <= (vp.w >= 768 ? 380 : 600), `${tag}: footer too tall (${f.height}px)`);
    check(f.overflow <= 0, `${tag}: footer overflow ${f.overflow}px`);
    check(f.minLinkFont >= 14, `${tag}: footer link font ${f.minLinkFont}px`);
    const mail = f.links.find((l) => l.href.startsWith("mailto:"));
    const wa = f.links.find((l) => /wa\.me/.test(l.href));
    const ig = f.links.find((l) => /instagram\.com/.test(l.href));
    check(mail && mail.href === `mailto:${approved.email}` && mail.t === approved.email, `${tag}: email link ${JSON.stringify(mail)}`);
    check(wa && wa.href === approved.wa && wa.t.includes(approved.display) && wa.target === "_blank" && /noopener/.test(wa.rel || "") && wa.rel.includes("noreferrer") && wa.aria, `${tag}: WhatsApp link ${JSON.stringify(wa)}`);
    check(ig && ig.href === approved.ig && ig.target === "_blank" && /noopener/.test(ig.rel || "") && ig.aria, `${tag}: Instagram link ${JSON.stringify(ig)}`);
    check(!stale.test(f.text) && !f.links.some((l) => stale.test(l.href) || stale.test(l.t)), `${tag}: stale contact value in footer`);
    check(!legalPlaceholders.test(f.text) && !f.links.some((l) => legalPlaceholders.test(l.t)), `${tag}: legal placeholder in footer`);
    check(!accountEntry.test(f.text), `${tag}: account entry in footer ("${(f.text.match(accountEntry) || [])[0]}")`);
    check(f.links.every((l) => l.href !== "#" && l.href !== "" && l.h >= 24), `${tag}: placeholder href or small target in footer`);
    const footerAnchors = f.links.filter((l) => l.href.includes("#"));
    check(footerAnchors.length === 5 && footerAnchors.every((l) => new RegExp(`^/${locale}/?#`).test(l.href)), `${tag}: footer anchors ${JSON.stringify(footerAnchors.map((l) => l.href))}`);
    check(f.headings.length >= 2 && f.headings.every((x) => x === "H2") && f.navs === 1, `${tag}: footer structure ${JSON.stringify({ h: f.headings, n: f.navs })}`);
    check(f.imgs.length === 1 && f.imgs[0].alt === "Cadastur" && f.imgs[0].complete && f.imgs[0].w > 0 && Math.abs(f.imgs[0].ratio - 490 / 110) < 0.1, `${tag}: Cadastur mark ${JSON.stringify(f.imgs)}`);
    check(atLoad.cadastur === 0 && earlyCadastur === 0, `${tag}: Cadastur fetched before the footer was approached (${atLoad.cadastur}/${earlyCadastur})`);
    check(!/\d{2}\.\d{3}|\d{6,}/.test(f.text.replace(approved.display, "")), `${tag}: registration-looking number in footer`);
    const contact = f.links.find((l) => /\/contato$/.test(l.href));
    check(contact && new RegExp(`^/${locale}/contato$`).test(contact.href), `${tag}: /contato link ${JSON.stringify(contact)}`);
    check(!c.foreign.test(f.text), `${tag}: mixed-language footer "${(f.text.match(c.foreign) || [])[0]}"`);
    if (contact) { const code = await page.request.get(`${BASE}${contact.href}`, { timeout: 120000 }).then((r) => r.status()).catch(() => 0); check(code === 200, `${tag}: ${contact.href} → HTTP ${code}`); }
    for (const l of [wa, ig].filter(Boolean)) {
      if (!externalChecked.has(l.href)) {
        const code = await page.request.get(l.href, { timeout: 25000, headers: { "user-agent": "Mozilla/5.0" } }).then((r) => r.status()).catch(() => 0);
        externalChecked.set(l.href, code); check(code > 0 && code < 400, `external ${l.href} → HTTP ${code}`);
      }
    }

    // ---------- AI ----------
    check(!requests.some((u) => u.includes("/api/ai-concierge")), `${tag}: request to /api/ai-concierge`);
    check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
    notes.push(`${tag}: header ${h.height}px (${desktop ? "4 links" : "menu"}; CTA ${h.cta?.w}x${h.cta?.h}; links ${h.desktopLinks[0]?.href}), footer ${f.height}px, fonts ${found.loadedFamilies.length}, probe ok`);
    await page.locator("footer[role='contentinfo']").screenshot({ path: path.join(outDir, `footer-${locale}-${vp.name}.png`) });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `top-${locale}-${vp.name}.png`), clip: { x: 0, y: 0, width: vp.w, height: Math.min(vp.h, 360) } });
    await context.close();
  }
  notes.push(`external links: ${JSON.stringify([...externalChecked])}`);

  // ---------- SV safe fallback ----------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage(); const errors = [];
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    const r = await page.goto(`${BASE}/sv/site-probe`, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(800);
    const sv = await page.evaluate(() => { const hd = document.querySelector("header[role='banner']"); return { links: [...hd.querySelector("nav[aria-label]").querySelectorAll("a")].map((a) => a.textContent.trim()), svControl: !!hd.querySelector("a[hreflang='sv']"), current: hd.querySelectorAll("a[aria-current='true']").length, lang: document.documentElement.lang, langLinks: [...hd.querySelectorAll("a[hreflang]")].filter((a) => a.getClientRects().length > 0).map((a) => a.textContent.trim()) }; });
    check(r.status() === 200 && JSON.stringify(sv.links) === JSON.stringify(copy.pt.nav) && !sv.svControl && JSON.stringify(sv.langLinks) === JSON.stringify(["PT", "EN", "ES"]) && sv.current === 0 && errors.length === 0, `sv: fallback ${JSON.stringify({ status: r.status(), sv, errors })}`);
    notes.push(`sv: HTTP ${r.status()}, labels fall back to PT, no SV control, no errors`);
    await context.close();
  }

  // ---------- legacy routes + admin isolation ----------
  // RT-52 must not change any legacy route. Evidence per route:
  //  (A) design tokens/typography unchanged and nothing from the new shell mounted;
  //  (B) structural assertions: HTTP 200, no console/page errors, no horizontal overflow, expected legacy structure/H1;
  //  (C) pixel comparison against the pre-change baseline (RT52_BASELINE dir), SCOPED to the region that is
  //      deterministic (pages with lazy, nondeterministic content are compared on their stable regions only).
  //      Note: /pt/tours was part of this list in RT-52 (its card area differed ~4.5% between two captures of the
  //      same unchanged route) and was migrated by RT-53, which now has its own validator.
  const legacy = [
    { name: "login", path: "/pt/login", h1: "Entre para acompanhar suas reservas", pixels: { top: 0, height: 900 } },
    { name: "register", path: "/pt/register", h1: "Crie sua conta para reservar com mais clareza", pixels: { top: 0, height: 900 } },
    // /pt/tours was migrated to the (site) group by RT-53 and is validated by scripts/rt-53-tours-listing-validation.mjs.
    { name: "home-legacy", path: "/pt", h1: "Passeios guiados no Rio de Janeiro", pixels: { top: 0, height: 900 }, legacyHeader: true },
    { name: "contato", path: "/pt/contato", h1: "Fale com a Rick Travel sobre sua viagem no Rio", pixels: { top: 0, height: 900 }, legacyHeader: true },
    { name: "admin-guard", path: "/pt/admin", h1: "Entre para acompanhar suas reservas" },
  ];
  let publishedTrips = null;
  try { publishedTrips = Number(execSync("docker exec ricktravel-db psql -U postgres -d ricktravel -tA -c \"select count(*) from \\\"Trip\\\" where \\\"isPublished\\\" = true\"", { encoding: "utf8" }).trim()); } catch { publishedTrips = null; }
  for (const L of legacy) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const lerrors = [];
    page.on("console", (m) => { if (m.type() === "error") lerrors.push(m.text()); });
    page.on("pageerror", (e) => lerrors.push(e.message));
    const resp = await page.goto(`${BASE}${L.path}`, { waitUntil: "load", timeout: 180000 });
    await page.waitForTimeout(2500);
    const t = await page.evaluate(() => {
      const r = getComputedStyle(document.documentElement);
      const hdr = document.querySelector("header");
      const tripLinks = new Set([...document.querySelectorAll("a[href*='/tours/']")].map((a) => a.getAttribute("href")));
      return {
        primary: r.getPropertyValue("--primary").trim(), background: r.getPropertyValue("--background").trim(), foreground: r.getPropertyValue("--foreground").trim(), ring: r.getPropertyValue("--ring").trim(), radius: r.getPropertyValue("--radius").trim(),
        rootSite: r.getPropertyValue("--site-charcoal").trim(), bodySite: getComputedStyle(document.body).getPropertyValue("--site-charcoal").trim(),
        siteTheme: document.querySelectorAll(".site-theme").length, shellIds: document.querySelectorAll("#site-mobile-navigation, #site-footer-nav-title").length,
        bodyFont: getComputedStyle(document.body).fontFamily, finalPath: location.pathname, h1: document.querySelector("h1")?.textContent?.trim(),
        legacyHeader: !!hdr && !!hdr.querySelector("nav a[href$='/tours']") && hdr.getAttribute("role") !== "banner", newFooter: !!document.querySelector("footer[role='contentinfo']"),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, tripCards: tripLinks.size,
      };
    });
    check(resp.status() === 200, `legacy ${L.name}: HTTP ${resp.status()}`);
    check(Object.entries(globalTokens).every(([k, v]) => t[k.slice(2)] === v) && t.rootSite === "" && t.bodySite === "" && t.siteTheme === 0, `legacy ${L.name}: tokens/scope changed ${JSON.stringify(t)}`);
    check(t.shellIds === 0 && !t.newFooter, `legacy ${L.name}: RT-52 public shell mounted on a legacy route`);
    check(t.bodyFont.includes("Segoe UI") && !/siteDisplay|siteBody/.test(t.bodyFont), `legacy ${L.name}: typography changed (${t.bodyFont})`);
    check(t.h1 === L.h1, `legacy ${L.name}: H1 "${t.h1}" (expected "${L.h1}")`);
    check(t.overflow <= 0, `legacy ${L.name}: horizontal overflow ${t.overflow}px`);
    check(lerrors.length === 0, `legacy ${L.name}: errors ${lerrors.join(" | ")}`);
    if (L.legacyHeader) check(t.legacyHeader, `legacy ${L.name}: legacy header structure missing`);
    if (L.tripCards) {
      check(publishedTrips === null || t.tripCards === publishedTrips, `legacy ${L.name}: ${t.tripCards} trip cards vs ${publishedTrips} published trips in the database (query behavior changed?)`);
      notes.push(`legacy ${L.name}: ${t.tripCards} trip cards = ${publishedTrips} published trips in the database`);
    }
    const shot = path.join(outDir, `legacy-${L.name}.png`);
    await page.screenshot({ path: shot });
    const baseFile = process.env.RT52_BASELINE && path.join(process.env.RT52_BASELINE, `${L.name}.png`);
    if (L.pixels && baseFile && fs.existsSync(baseFile)) {
      const sharp = (await import("sharp")).default;
      const regions = L.pixels.regions ?? [{ left: 0, top: L.pixels.top, width: 1440, height: L.pixels.height }];
      let diff = 0, total = 0;
      for (const region of regions) {
        const crop = (file) => sharp(file).extract(region).raw().toBuffer({ resolveWithObject: true });
        const [a, b2] = await Promise.all([crop(baseFile), crop(shot)]);
        const n = Math.min(a.data.length, b2.data.length);
        for (let i = 0; i < n; i += 4) if (Math.abs(a.data[i] - b2.data[i]) + Math.abs(a.data[i + 1] - b2.data[i + 1]) + Math.abs(a.data[i + 2] - b2.data[i + 2]) > 24) diff++;
        total += n / 4;
      }
      const ratio = diff / total;
      const label = regions.map((r) => `${r.width}x${r.height}@${r.left},${r.top}`).join(" + ");
      check(ratio < 0.005, `legacy ${L.name}: stable-region pixel diff (${label}) vs baseline ${(ratio * 100).toFixed(3)}%`);
      notes.push(`legacy ${L.name}: tokens/structure unchanged; stable-region pixel diff (${label}) ${(ratio * 100).toFixed(3)}%`);
    } else notes.push(`legacy ${L.name}: tokens/structure unchanged (HTTP ${resp.status()}, landed ${t.finalPath}${L.pixels ? "" : ", no pixel baseline (auth guard redirect)"})`);
    await context.close();
  }
} finally {
  try { fs.rmSync(probeDir, { recursive: true, force: true }); } catch { /* ignore */ }
  if (browser) await browser.close();
}

check(!fs.existsSync(probeFile), "temporary probe page was not removed");
notes.push(`probe page removed: ${!fs.existsSync(probeFile)}`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-52 public site foundation + shared shell validation");
