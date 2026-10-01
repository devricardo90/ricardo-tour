/**
 * RT-35 validation — rebuilt Home navbar + footer (re-pointed at the public Home /{locale} by RT-57; chrome now comes from the (site) layout).
 * Requires a dev server on :3218 and the local Postgres (the Home renders the real Experiences query).
 *
 *   node scripts/rt-35-chrome-validation.mjs
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-35-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const copy = {
  pt: { nav: ["Experiências", "Sobre o Rio", "AI Concierge", "Quem somos"], cta: "Planeje sua viagem", foreign: /(Experiences|About Rio|About us|Plan your trip|Quiénes|Planifica|Sobre Río|Contact form|Formulario)/ },
  en: { nav: ["Experiences", "About Rio", "AI Concierge", "About us"], cta: "Plan your trip", foreign: /(Experiências|Sobre o Rio|Quem somos|Planeje|Quiénes|Planifica|Sobre Río|Formulário|Formulario)/ },
  es: { nav: ["Experiencias", "Sobre Río", "AI Concierge", "Quiénes somos"], cta: "Planifica tu viaje", foreign: /(Experiências|Sobre o Rio|Quem somos|Planeje|About us|Plan your trip|Formulário|Contact form)/ },
};
const anchors = ["#experiences", "#rio-story", "#ai-concierge", "#about-rick-travel"];
const expectedOrder = ["globe-next-title", "experiences-in-rio-heading", "why-rick-travel-heading", "rio-story-heading", "ai-concierge-heading", "about-rick-travel-heading"];
// Stale/unapproved contact data and legal placeholders that must NOT appear. Since RT-52 the Owner-approved canonical
// contact (contato@ricardotour.com, +55 22 99846-1906, wa.me/5522998461906) is allowed; see lib/public-contact.ts.
const forbidden = /(travelrick|\+?55\s?21|96681|97116|tel:|\d{2}\.\d{3}\.\d{3}|cnpj|privacidade|privacy|termos|terms)/i;
const approved = { email: "contato@ricardotour.com", wa: "https://wa.me/5522998461906" };

const viewports = [
  { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
];
const runs = [];
for (const vp of viewports) runs.push({ locale: "pt", vp });
runs.push({ locale: "en", vp: viewports[0] }, { locale: "en", vp: viewports[3] }, { locale: "es", vp: viewports[0] }, { locale: "es", vp: viewports[1] }, { locale: "es", vp: viewports[3] }, { locale: "es", vp: viewports[4] });

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
const externalChecked = new Map();

for (const { locale, vp } of runs) {
  const tag = `${locale}@${vp.name}`;
  const c = copy[locale];
  const desktop = vp.w >= 1024;
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch });
  const page = await context.newPage();
  const errors = [];
  const conciergeRequests = [];
  const cadasturRequests = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => {
    if (r.url().includes("/api/ai-concierge")) conciergeRequests.push(r.url());
    if (decodeURIComponent(r.url()).includes("cadastro/cadastur")) cadasturRequests.push(r.url());
  });

  await page.goto(`${BASE}/${locale}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const cadasturAtLoad = cadasturRequests.length;

  // ---- Header at rest ----
  const h = await page.evaluate(() => {
    const header = document.querySelector("header[role='banner']");
    const r = header.getBoundingClientRect();
    const cs = getComputedStyle(header);
    const logo = header.querySelector("a[aria-label] svg");
    const lr = logo?.getBoundingClientRect();
    const vis = (el) => el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
    const nav = header.querySelector("nav[aria-label]");
    const navLinks = [...header.querySelectorAll("nav[aria-label] a")].filter((a) => a.closest("nav") === nav).map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href"), visible: vis(a) }));
    const cta = [...header.querySelectorAll("a")].find((a) => a.getAttribute("href") === "#globe-next");
    const ctaRect = cta?.getBoundingClientRect();
    const menuBtn = header.querySelector("button[aria-controls='site-mobile-navigation']");
    const langLinks = [...header.querySelectorAll("nav[aria-label] a[hreflang]")].filter(vis).map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href"), cur: a.getAttribute("aria-current") }));
    const root = document.getElementById("top-of-home");
    return {
      position: cs.position, bg: cs.backgroundColor, height: Math.round(r.height), top: Math.round(r.top), width: Math.round(r.width),
      role: header.getAttribute("role"), firstChild: header.parentElement.classList.contains("site-theme") && document.querySelectorAll("header[role='banner']").length === 1 && header.nextElementSibling?.id === "main-content",
      logoRatio: lr ? +(lr.width / lr.height).toFixed(3) : null, logoH: lr ? Math.round(lr.height) : null,
      logoLabel: header.querySelector("a[aria-label]")?.getAttribute("aria-label"),
      navLabel: nav?.getAttribute("aria-label"), navLinks, desktopNavVisible: vis(nav),
      cta: cta && { text: cta.textContent.trim(), visible: vis(cta), w: Math.round(ctaRect.width), h: Math.round(ctaRect.height), right: Math.round(ctaRect.right) },
      menu: menuBtn && { visible: vis(menuBtn), expanded: menuBtn.getAttribute("aria-expanded"), label: menuBtn.getAttribute("aria-label"), w: Math.round(menuBtn.getBoundingClientRect().width), h: Math.round(menuBtn.getBoundingClientRect().height) },
      panelHidden: document.getElementById("site-mobile-navigation")?.hidden,
      langLinks, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hrefHash: [...document.querySelectorAll("header a[href], footer a[href]")].filter((a) => a.getAttribute("href") === "#" || a.getAttribute("href") === "").length,
      inheadImgs: header.querySelectorAll("img").length,
      order: [...document.querySelectorAll("section[aria-labelledby]")].map((n) => n.getAttribute("aria-labelledby")).filter((x) => x !== undefined),
      targets: Object.fromEntries(["#globe-next", "#experiences", "#rio-story", "#ai-concierge", "#about-rick-travel", "#top-of-home"].map((id) => [id, !!document.querySelector(id)])),
      headerText: header.innerText,
    };
  });
  check(h.position === "sticky" && h.top === (await page.evaluate(() => Math.round(document.querySelector("header[role='banner']").getBoundingClientRect().top))), `${tag}: header not sticky (${h.position})`);
  check(h.bg === "rgb(11, 14, 17)", `${tag}: header bg ${h.bg}`);
  check(h.height >= 56 && h.height <= 72, `${tag}: header height ${h.height}px (compact 56–72)`);
  check(h.firstChild, `${tag}: header is not the first element of the Home`);
  check(h.role === "banner" && h.navLabel && h.logoLabel, `${tag}: header a11y (role ${h.role}, nav label ${h.navLabel}, logo label ${h.logoLabel})`);
  check(h.logoRatio && Math.abs(h.logoRatio - 520 / 170) / (520 / 170) < 0.03, `${tag}: logo distorted (ratio ${h.logoRatio})`);
  check(h.inheadImgs === 0, `${tag}: header loads raster images`);
  check(h.overflow <= 0, `${tag}: horizontal overflow ${h.overflow}px`);
  check(Object.values(h.targets).every(Boolean), `${tag}: missing anchor targets ${JSON.stringify(h.targets)}`);
  check(h.order.join(",") === expectedOrder.join(","), `${tag}: section order ${h.order.join(",")}`);
  check(h.hrefHash === 0, `${tag}: ${h.hrefHash} placeholder href="#"`);
  check(h.cta && h.cta.visible && h.cta.text === c.cta && h.cta.h >= 40 && h.cta.right <= vp.w, `${tag}: CTA ${JSON.stringify(h.cta)}`);
  check(!forbidden.test(h.headerText), `${tag}: forbidden contact/legal text in header`);
  check(!c.foreign.test(h.headerText), `${tag}: mixed-language header text: "${(h.headerText.match(c.foreign) || [])[0]}"`);
  if (desktop) {
    check(h.desktopNavVisible && h.navLinks.length === 4 && h.navLinks.every((l) => l.visible), `${tag}: desktop nav links ${JSON.stringify(h.navLinks)}`);
    check(JSON.stringify(h.navLinks.map((l) => l.text)) === JSON.stringify(c.nav), `${tag}: nav labels ${JSON.stringify(h.navLinks.map((l) => l.text))}`);
    check(JSON.stringify(h.navLinks.map((l) => l.href)) === JSON.stringify(anchors), `${tag}: nav destinations ${JSON.stringify(h.navLinks.map((l) => l.href))}`);
    check(h.menu && !h.menu.visible, `${tag}: menu button visible on desktop`);
    check(h.langLinks.length === 3 && h.langLinks.filter((l) => l.cur === "true").length === 1 && h.langLinks.find((l) => l.cur === "true").t === locale.toUpperCase() && h.langLinks.every((l) => l.href === `/${l.t.toLowerCase()}`), `${tag}: language links ${JSON.stringify(h.langLinks)}`);
  } else {
    check(!h.desktopNavVisible, `${tag}: desktop nav visible on small screen`);
    check(h.menu && h.menu.visible && h.menu.expanded === "false" && h.panelHidden === true && h.menu.w >= 44 && h.menu.h >= 44 && h.menu.label, `${tag}: menu trigger ${JSON.stringify(h.menu)} panelHidden ${h.panelHidden}`);
  }

  // ---- Anchor landing (desktop header links / CTA) ----
  const settle = async () => { let last = -1, same = 0; for (let i = 0; i < 60 && same < 4; i++) { await page.waitForTimeout(120); const y = await page.evaluate(() => Math.round(scrollY)); same = y === last ? same + 1 : 0; last = y; } };
  const landing = async (clickFn, selector, label) => {
    await clickFn();
    await settle();
    const l = await page.evaluate((s) => { const t = document.querySelector(s).getBoundingClientRect(); const hd = document.querySelector("header[role='banner']").getBoundingClientRect(); return { top: Math.round(t.top), headerBottom: Math.round(hd.bottom), hash: location.hash, atBottom: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2 }; }, selector);
    // Near the end of the page the target cannot reach the ideal offset; then it must be at max scroll and fully below the header.
    check((l.top >= l.headerBottom - 4 && l.top <= l.headerBottom + 8) || (l.atBottom && l.top >= l.headerBottom - 4), `${tag}: ${label} lands at ${l.top}px, header bottom ${l.headerBottom}px (hidden behind header or far off)`);
    check(l.hash === selector, `${tag}: ${label} hash ${l.hash}`);
    return l;
  };
  if (desktop) {
    for (const a of anchors) await landing(() => page.locator(`header nav[aria-label]:visible a[href='${a}']`).click(), a, `nav ${a}`);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await settle();
    await landing(() => page.locator(`header a[href='#globe-next']`).click(), "#globe-next", "CTA");
  } else {
    // Mobile disclosure: open → links visible → Escape closes and restores focus → re-open → link closes + lands.
    const btn = page.locator("button[aria-controls='site-mobile-navigation']");
    await btn.click();
    await page.waitForTimeout(250);
    const open = await page.evaluate(() => { const p = document.getElementById("site-mobile-navigation"); const b = document.querySelector("button[aria-controls='site-mobile-navigation']"); const r = p.getBoundingClientRect(); return { hidden: p.hidden, expanded: b.getAttribute("aria-expanded"), label: b.getAttribute("aria-label"), links: [...p.querySelector("nav").querySelectorAll("a")].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute("href"), h: Math.round(a.getBoundingClientRect().height) })), lang: p.querySelectorAll("a[hreflang]").length, allTargets: [...p.querySelectorAll("a")].map((a) => { const r = a.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }), inView: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, scrollLocked: getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.documentElement).overflow === "hidden", role: p.querySelector("[role=menu]") !== null }; });
    check(!open.hidden && open.expanded === "true" && open.label !== h.menu.label, `${tag}: menu did not open / state not announced (${JSON.stringify({ h: open.hidden, e: open.expanded, l: open.label })})`);
    check(JSON.stringify(open.links.map((l) => l.t)) === JSON.stringify(c.nav) && JSON.stringify(open.links.map((l) => l.href)) === JSON.stringify(anchors), `${tag}: menu links ${JSON.stringify(open.links)}`);
    check(open.allTargets.every(([w, h]) => w >= 44 && h >= 44), `${tag}: menu touch targets below 44x44 ${JSON.stringify(open.allTargets)}`);
    check(open.lang === 3, `${tag}: language links in menu ${open.lang}`);
    check(open.inView && !open.scrollLocked && !open.role, `${tag}: menu panel not contained / scroll locked / role=menu (${JSON.stringify({ inView: open.inView, locked: open.scrollLocked, role: open.role })})`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    const closed = await page.evaluate(() => ({ hidden: document.getElementById("site-mobile-navigation").hidden, expanded: document.querySelector("button[aria-controls='site-mobile-navigation']").getAttribute("aria-expanded"), focusOnBtn: document.activeElement === document.querySelector("button[aria-controls='site-mobile-navigation']") }));
    check(closed.hidden && closed.expanded === "false" && closed.focusOnBtn, `${tag}: Escape did not close/return focus (${JSON.stringify(closed)})`);
    await btn.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `menu-${locale}-${vp.name}.png`), clip: { x: 0, y: 0, width: vp.w, height: Math.min(vp.h, 460) } });
    await landing(() => page.locator(`#site-mobile-navigation a[href='#ai-concierge']`).click(), "#ai-concierge", "menu #ai-concierge");
    const afterLink = await page.evaluate(() => document.getElementById("site-mobile-navigation").hidden);
    check(afterLink, `${tag}: menu stayed open after activating a link`);
    // outside click closes
    await btn.click(); await page.waitForTimeout(150);
    await page.mouse.click(vp.w / 2, vp.h - 20); await page.waitForTimeout(200);
    check(await page.evaluate(() => document.getElementById("site-mobile-navigation").hidden), `${tag}: outside click did not close the menu`);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await settle();
    await landing(() => page.locator(`header a[href='#globe-next']`).click(), "#globe-next", "CTA");
  }

  // Header stays put while scrolling (sticky) and keyboard focus is visible on a nav link.
  await page.evaluate(() => scrollTo(0, 1500)); await page.waitForTimeout(400);
  const stuck = await page.evaluate(() => Math.round(document.querySelector("header[role='banner']").getBoundingClientRect().top));
  check(stuck === 0, `${tag}: header not stuck at top while scrolled (${stuck})`);
  const focusSel = desktop ? "header nav[aria-label]:visible a" : `header a[href='#globe-next']`;
  await page.keyboard.press("Tab").catch(() => {});
  await page.locator(focusSel).first().focus();
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { tag: e.tagName, outline: cs.outlineStyle, w: parseFloat(cs.outlineWidth) }; });
  check(ring.outline !== "none" && ring.w >= 2, `${tag}: no visible focus ring on header link (${JSON.stringify(ring)})`);

  // ---- Footer ----
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, document.body.scrollHeight); });
  await page.waitForTimeout(600);
  await page.waitForFunction(() => { const i = document.querySelector("footer[role='contentinfo'] img"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
  const f = await page.evaluate(() => {
    const footer = document.querySelector("footer[role='contentinfo']");
    const about = document.querySelector("section[aria-labelledby='about-rick-travel-heading']");
    const root = document.getElementById("top-of-home");
    const r = footer.getBoundingClientRect();
    const links = [...footer.querySelectorAll("a[href]")].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel"), aria: a.getAttribute("aria-label"), h: Math.round(a.getBoundingClientRect().height) }));
    const cadastur = [...footer.querySelectorAll("img")].map((i) => ({ alt: i.alt, w: i.naturalWidth, complete: i.complete, ratio: +(i.getBoundingClientRect().width / i.getBoundingClientRect().height).toFixed(2) }));
    const txt = footer.innerText;
    const hs = [...footer.querySelectorAll("h1,h2,h3")].map((x) => x.tagName);
    const navs = [...footer.querySelectorAll("nav")].map((n) => n.getAttribute("aria-labelledby") || n.getAttribute("aria-label"));
    return {
      bg: getComputedStyle(footer).backgroundColor, aboutBg: getComputedStyle(about).backgroundColor, seam: Math.round(r.top - about.getBoundingClientRect().bottom),
      height: Math.round(r.height), last: footer.parentElement.classList.contains("site-theme") && footer.nextElementSibling === null, links, cadastur, text: txt, headings: hs, navs,
      minLinkFont: Math.min(...[...footer.querySelectorAll("a")].map((a) => parseFloat(getComputedStyle(a).fontSize))),
      minFont: Math.min(...[...footer.querySelectorAll("*")].filter((e) => e.childElementCount === 0 && e.textContent.trim() && e.getClientRects().length).map((e) => parseFloat(getComputedStyle(e).fontSize))),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      contentinfo: document.querySelectorAll("footer").length,
      gold: getComputedStyle(footer).borderTopColor,
    };
  });
  check(f.bg === "rgb(11, 14, 17)" && f.aboutBg === "rgb(251, 248, 242)" && f.seam === 0, `${tag}: rhythm wrong (About ${f.aboutBg} → Footer ${f.bg}, gap ${f.seam})`);
  check(f.last && f.contentinfo === 1, `${tag}: footer not last / duplicated (${f.contentinfo})`);
  check(f.height <= (vp.w >= 768 ? 380 : 600), `${tag}: footer too tall (${f.height}px)`);
  check(f.overflow <= 0, `${tag}: footer overflow ${f.overflow}px`);
  check(f.minLinkFont >= 14, `${tag}: footer link text ${f.minLinkFont}px < 14px`);
  check(f.minFont >= 12, `${tag}: footer text ${f.minFont}px < 12px`);
  check(!forbidden.test(f.text) && !f.links.some((l) => forbidden.test(l.href)), `${tag}: stale/unapproved contact or legal content in footer`);
  check(f.links.filter((l) => l.href.startsWith("mailto:")).every((l) => l.href === `mailto:${approved.email}`) && f.links.filter((l) => /wa.me/.test(l.href)).every((l) => l.href === approved.wa), `${tag}: footer mailto/wa.me not the approved values`);
  check(!c.foreign.test(f.text), `${tag}: mixed-language footer text "${(f.text.match(c.foreign) || [])[0]}"`);
  check(f.links.every((l) => l.href !== "#" && l.href !== ""), `${tag}: placeholder href in footer`);
  check(f.headings.length >= 2 && f.headings.every((x) => x === "H2") && f.navs.length === 1, `${tag}: footer heading/nav structure ${JSON.stringify({ h: f.headings, n: f.navs })}`);
  check(f.cadastur.length === 1 && f.cadastur[0].alt === "Cadastur" && f.cadastur[0].complete && f.cadastur[0].w > 0 && Math.abs(f.cadastur[0].ratio - 490 / 110) < 0.1, `${tag}: Cadastur mark ${JSON.stringify(f.cadastur)}`);
  check(cadasturAtLoad === 0, `${tag}: Cadastur image fetched at initial load (${cadasturAtLoad})`);
  check(!/(\b\d{2}\.\d{3}|\d{6,})/.test(f.text), `${tag}: number that looks like a registration id in footer`);
  check(conciergeRequests.length === 0, `${tag}: ${conciergeRequests.length} request(s) to /api/ai-concierge`);

  // ---- Link classification (PT @ desktop + each locale once) ----
  const internal = f.links.filter((l) => l.href.startsWith("/") && !l.href.startsWith("//") && !l.href.includes("#"));
  const external = f.links.filter((l) => /^https?:/.test(l.href));
  const anchorsF = f.links.filter((l) => l.href.includes("#")).map((l) => ({ ...l, href: l.href.slice(l.href.indexOf("#")) }));
  for (const l of anchorsF) check(await page.evaluate((s) => !!document.querySelector(s), l.href), `${tag}: footer anchor ${l.href} has no target`);
  for (const l of internal) {
    const code = await page.request.get(`${BASE}${l.href}`, { timeout: 120000 }).then((r) => r.status()).catch(() => 0);
    check(code === 200, `${tag}: footer route ${l.href} → HTTP ${code}`);
    check(l.href.startsWith(`/${locale}/`), `${tag}: footer route ${l.href} not localized`);
  }
  for (const l of external) {
    check(l.target === "_blank" && /noopener/.test(l.rel || "") && l.aria, `${tag}: external link ${l.href} missing target/rel/aria`);
    if (!externalChecked.has(l.href)) {
      const code = await page.request.get(l.href, { timeout: 25000, headers: { "user-agent": "Mozilla/5.0" } }).then((r) => r.status()).catch(() => 0);
      externalChecked.set(l.href, code);
      check(code > 0 && code < 400, `external ${l.href} → HTTP ${code}`);
    }
  }
  check(f.links.every((l) => l.h >= 24), `${tag}: footer link target < 24px`);

  check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
  notes.push(`${tag}: header ${h.height}px (nav ${desktop ? h.navLinks.length + " links" : "menu"}; CTA ${h.cta?.w}x${h.cta?.h}; logo ${h.logoH}px), footer ${f.height}px; footer links: ${f.links.length} (${anchorsF.length} anchor, ${internal.length} route, ${external.length} external)`);
  await page.locator("footer[role='contentinfo']").screenshot({ path: path.join(outDir, `footer-${locale}-${vp.name}.png`) });
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `top-${locale}-${vp.name}.png`), clip: { x: 0, y: 0, width: vp.w, height: Math.min(vp.h, 360) } });
  await context.close();
}

await browser.close();
notes.push(`external links: ${JSON.stringify([...externalChecked])}`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-35 navbar + footer validation");
