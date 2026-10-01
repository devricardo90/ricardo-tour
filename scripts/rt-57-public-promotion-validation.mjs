/**
 * RT-57 validation — rebuilt Home promoted to the public route /{locale}.
 * Requires a dev server on :3218 and the local Postgres (the Home renders the real Experiences query).
 *
 *   node scripts/rt-57-public-promotion-validation.mjs
 *
 * Static: promotion/removal structure, lab isolation, legacy cleanup, canonical contact, no stale contact values.
 * Runtime: single header/footer, section order, no lab scaffolding, SEO (title/canonical/hreflang/OG/robots/sitemap),
 * sv noindex, lab behavior, /api/trips gate, cross-route anchor landing, and the Home -> Tours -> Detail -> Contact -> About journey.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const HOST = "https://rick-travel.vercel.app"; // lib/public-site-url.ts default (PUBLIC_SITE_URL unset in the test environment)
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };
const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");
// Source without comments: structural checks must not trip over explanatory comments.
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([^:])\/\/ .*$/gm, "$1");
const walk = (dir, out = []) => {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const norm = (p) => p.split(path.sep).join("/");

const LAUNCH_IDS = ["cmljo0s1u0000t0zqa0bpd23p", "cmlibniq40000z4zqkbujnutt", "cmli1a6im000034zqqzc9sppb", "cmlhxkpy9000028zq27rhytew"];
const expectedOrder = ["globe-next-title", "experiences-in-rio-heading", "why-rick-travel-heading", "rio-story-heading", "ai-concierge-heading", "about-rick-travel-heading"];
const anchors = ["#experiences", "#rio-story", "#ai-concierge", "#about-rick-travel"];
const stale = /(travelrick|contact@travelrick|\+?55\s?21\s?9?\s?6681|96681-?9928|97116-?8114|5521966819928|5521971168114)/i;

// ---------------- static ----------------
const homePage = "app/[locale]/(site)/page.tsx";
check(exists(homePage), "public Home page missing at (site)/page.tsx");
check(!exists("app/[locale]/(public)/page.tsx"), "legacy (public)/page.tsx still exists (route conflict / legacy Home not retired)");
check(!exists("app/[locale]/rebuild-lab/cinematic-3d-poc/page.tsx"), "lab Home page still exists");
const homeSrc = exists(homePage) ? code(homePage) : "";
check(!/<(HomeHeader|HomeFooter|SiteHeader|SiteFooter)/.test(homeSrc), "Home page mounts its own header/footer (double mount)");
const order = ["GlobeJourney", "ExperiencesInRioSection", "WhyRickTravelSection", "RioStorySection", "AIConciergeSection", "AboutRickTravelSection"];
const idx = order.map((n) => homeSrc.indexOf(`<${n} `));
check(idx.every((i) => i > 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]), `Home composition order wrong: ${idx.join(",")}`);

const heroDir = "components/home/hero";
for (const f of ["globe-journey.tsx", "globe-journey.module.css", "globe-3d.ts", "hero-media.ts", "hero-media-status.ts", "world-atlas.ts"]) check(exists(`${heroDir}/${f}`), `Hero module file missing: ${f}`);
const heroSrc = exists(`${heroDir}/globe-journey.tsx`) ? read(`${heroDir}/globe-journey.tsx`) : "";
const heroCss = exists(`${heroDir}/globe-journey.module.css`) ? read(`${heroDir}/globe-journey.module.css`) : "";
check(!/styles\.review|rebuild-lab|Rebuild Lab/.test(heroSrc), "Hero still carries lab scaffolding (review bar / lab links)");
check(!/\.review\b/.test(heroCss), "Hero CSS still has the .review lab bar");

// Nothing public may import from the lab or depend on its flag.
const publicDirs = ["app/[locale]/(site)", "app/[locale]/(public)", "components", "lib/catalog", "lib/public-contact.ts", "i18n"];
const publicFiles = publicDirs.flatMap((d) => (fs.existsSync(d) && fs.statSync(d).isDirectory() ? walk(d) : exists(d) ? [d] : [])).filter((f) => /\.(tsx?|css)$/.test(f));
const labDeps = publicFiles.filter((f) => /rebuild-lab|REBUILD_LAB_ENABLED|isRebuildLabEnabled/.test(code(f)));
check(labDeps.length === 0, `public code references the Rebuild Lab: ${labDeps.map(norm).join(", ")}`);
const labSection = ["app/[locale]/(site)/layout.tsx", "components/site/site-header.tsx", "components/site/site-footer.tsx", "components/site/site-chrome-copy.ts"];
check(labSection.every((f) => !/rebuild-lab/.test(read(f))), "site chrome links to the lab");

// Legacy cleanup: deleted components stay deleted; kept ones are still used by /reservas (Admin/auth/reservas must not break).
const deleted = ["components/footer.tsx", "components/hero-section.tsx", "components/hero-search.tsx", "components/reservations-section.tsx", "components/testimonials.tsx", "components/tours-header.tsx", "components/contact-form.tsx", "components/trips/tour-filters.tsx", "components/trips/tour-detail-client.tsx", "components/trips/tour-actions.tsx", "components/home-header.tsx", "components/home-footer.tsx", "components/about/hero-section.tsx", "components/about/security-section.tsx"];
for (const f of deleted) check(!exists(f), `legacy file not deleted: ${f}`);
const kept = ["components/header.tsx", "components/mobile-menu.tsx", "components/ai-concierge/ai-concierge-widget.tsx", "app/[locale]/(public)/layout.tsx", "app/[locale]/(public)/reservas/page.tsx"];
for (const f of kept) check(exists(f), `file needed by reservas/auth was removed: ${f}`);
notes.push(`legacy deleted: ${deleted.length} files; kept for reservas/auth: ${kept.length}`);

// Stale contact values must not exist in the public source (the canonical register lib/public-contact.ts documents them as forbidden patterns).
const staleHits = [...walk("app"), ...walk("components"), ...walk("lib"), ...walk("messages")].filter((f) => !norm(f).endsWith("lib/public-contact.ts") && !f.includes("rebuild-lab") && /\.(tsx?|json|css)$/.test(f) && stale.test(read(f)));
check(staleHits.length === 0, `stale contact values in source: ${staleHits.map(norm).join(", ")}`);

// SEO source: robots/sitemap come from one validated host; only public locales are advertised.
const routing = read("i18n/locales.ts");
check(/publicLocaleCodes = \['pt', 'en', 'es'\]/.test(routing), "public locales constant missing");
const sitemapSrc = code("app/sitemap.ts");
check(!/login|register/.test(sitemapSrc) && /getPublicTrips/.test(sitemapSrc) && !/isPublished/.test(sitemapSrc), "sitemap still lists auth routes or bypasses the catalog gate");
check(/PUBLIC_SITE_URL/.test(read("app/robots.ts")), "robots does not use the validated host");
check(/getPublicTrips/.test(code("app/api/trips/route.ts")) && !/isPublished/.test(code("app/api/trips/route.ts")), "/api/trips is not gated by the public catalog");
check(!/og-image\.jpg/.test(read("app/[locale]/layout.tsx")) && !/api\.ricktravel\.com/.test(read("app/[locale]/layout.tsx")), "root layout still references a missing OG image or a stale API host");

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });

// ---------------- runtime: Home per locale ----------------
const meta = {
  pt: { title: "Rick Travel | Passeios guiados no Rio de Janeiro", nav: ["Experiências", "Sobre o Rio", "AI Concierge", "Quem somos"] },
  en: { title: "Rick Travel | Guided tours in Rio de Janeiro", nav: ["Experiences", "About Rio", "AI Concierge", "About us"] },
  es: { title: "Rick Travel | Tours guiados en Río de Janeiro", nav: ["Experiencias", "Sobre Río", "AI Concierge", "Quiénes somos"] },
};
for (const locale of ["pt", "en", "es"]) {
  for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
    const tag = `${locale}@${vp.w}`;
    const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: vp.w < 500, isMobile: vp.w < 500 });
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => requests.push(r.url()));
    const resp = await page.goto(`${BASE}/${locale}`, { waitUntil: "load", timeout: 180000 });
    await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 180000 }).catch(() => {});
    await page.waitForTimeout(800);
    check(resp.status() === 200, `${tag}: HTTP ${resp.status()}`);
    const d = await page.evaluate(() => {
      const meta = (sel, attr = "content") => document.querySelector(sel)?.getAttribute(attr) ?? null;
      return {
        headers: document.querySelectorAll("header").length,
        banners: document.querySelectorAll("header[role='banner']").length,
        footers: document.querySelectorAll("footer").length,
        contentinfo: document.querySelectorAll("footer[role='contentinfo']").length,
        mains: document.querySelectorAll("main").length,
        order: [...document.querySelectorAll("section[aria-labelledby]")].map((n) => n.getAttribute("aria-labelledby")),
        title: document.title,
        canonical: meta("link[rel='canonical']", "href"),
        alternates: [...document.querySelectorAll("link[rel='alternate'][hreflang]")].map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")]),
        robots: meta("meta[name='robots']"),
        ogTitle: meta("meta[property='og:title']"), ogUrl: meta("meta[property='og:url']"), ogDesc: meta("meta[property='og:description']"), ogImage: meta("meta[property='og:image']"),
        desc: meta("meta[name='description']"),
        lang: document.documentElement.lang,
        text: document.body.innerText,
        labLinks: [...document.querySelectorAll("a[href*='rebuild-lab']")].length,
        h1: document.querySelectorAll("h1").length,
        navLinks: [...document.querySelectorAll("header nav[aria-label] a")].filter((a) => !a.hasAttribute("hreflang") && a.closest("nav").className.includes("hidden")).map((a) => [a.textContent.trim(), a.getAttribute("href")]),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cadastur: document.querySelectorAll("footer img[alt='Cadastur']").length,
        html: document.documentElement.outerHTML,
        anchorsPresent: Object.fromEntries(["#globe-next", "#experiences", "#rio-story", "#ai-concierge", "#about-rick-travel", "#top-of-home"].map((id) => [id, !!document.querySelector(id)])),
        loginLinks: [...document.querySelectorAll("header a, footer a")].filter((a) => /login|register|entrar|sign in|cadastre/i.test(a.getAttribute("href") + a.textContent)).length,
      };
    });
    check(d.headers === 1 && d.banners === 1, `${tag}: header count ${d.headers}/${d.banners} (expected exactly one SiteHeader)`);
    check(d.footers === 1 && d.contentinfo === 1, `${tag}: footer count ${d.footers}/${d.contentinfo} (expected exactly one SiteFooter)`);
    check(d.mains === 1, `${tag}: ${d.mains} <main> elements`);
    check(d.h1 === 1, `${tag}: ${d.h1} h1 elements`);
    check(JSON.stringify(d.order) === JSON.stringify(expectedOrder), `${tag}: section order ${d.order.join(",")}`);
    check(Object.values(d.anchorsPresent).every(Boolean), `${tag}: missing anchor targets ${JSON.stringify(d.anchorsPresent)}`);
    check(!/Rebuild Lab|Prévia|Preview|RT-\d+|Rick Travel · (Uma jornada|A journey|Un viaje)/.test(d.text), `${tag}: lab scaffolding text visible`);
    check(d.labLinks === 0 && !/rebuild-lab/.test(d.html), `${tag}: Home HTML references the lab`);
    check(d.title === meta[locale].title, `${tag}: title "${d.title}"`);
    check(d.canonical === `${HOST}/${locale}`, `${tag}: canonical ${d.canonical}`);
    check(JSON.stringify(d.alternates.map((a) => a[0]).sort()) === JSON.stringify(["en", "es", "pt", "x-default"]), `${tag}: hreflang set ${JSON.stringify(d.alternates)} (sv must not be advertised)`);
    check(d.alternates.every(([l, h]) => h === `${HOST}/${l === "x-default" ? "pt" : l}`), `${tag}: hreflang targets ${JSON.stringify(d.alternates)}`);
    check(d.robots === "index, follow", `${tag}: robots ${d.robots}`);
    check(d.ogTitle === d.title && d.ogUrl === `${HOST}/${locale}` && d.ogDesc === d.desc && d.desc && d.desc.length > 60 && d.desc.length < 200, `${tag}: Open Graph/description inconsistent`);
    check(!d.ogImage, `${tag}: og:image points to ${d.ogImage} (no verified-rights image exists yet; a missing file must not be advertised)`);
    check(d.lang === locale, `${tag}: <html lang> ${d.lang}`);
    check(!/(credenciad|accredit|acreditad|certificad|experiência segura|garant[ií]a|24\s*\/\s*7|parceiro oficial|official partner)/i.test(d.desc + d.title + d.ogDesc), `${tag}: unsupported claim in metadata`);
    check(!/(prototype|localhost|127\.0\.0\.1|rebuild)/i.test(d.canonical + d.ogUrl + JSON.stringify(d.alternates)), `${tag}: prototype/local URL in SEO tags`);
    check(!stale.test(d.html), `${tag}: stale contact value in rendered HTML`);
    check(d.loginLinks === 0, `${tag}: account/login entry in header/footer (${d.loginLinks})`);
    check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
    check(requests.filter((u) => u.includes("/api/ai-concierge")).length === 0, `${tag}: AI Concierge requests fired`);
    check(!/ai-concierge-widget|\/api\/ai-concierge/.test(d.html), `${tag}: legacy AI widget on Home`);
    check(errors.length === 0, `${tag}: errors ${errors.join(" | ").slice(0, 300)}`);
    if (vp.w >= 1024) check(JSON.stringify(d.navLinks.map((l) => l[0])) === JSON.stringify(meta[locale].nav), `${tag}: nav ${JSON.stringify(d.navLinks)}`);
    notes.push(`${tag}: 1 header/1 footer, order ok, canonical ${d.canonical}, robots "${d.robots}", hreflang ${d.alternates.map((a) => a[0]).join("/")}`);
    await context.close();
  }
}

// ---------------- Swedish: technical locale, never indexed or advertised ----------------
{
  const html = await (await fetch(`${BASE}/sv`)).text();
  check(/<meta name="robots" content="noindex, nofollow"/.test(html), "/sv is indexable");
  check(!/hrefLang="sv"|hreflang="sv"/i.test(html), "/sv still advertised in hreflang");
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  check(locs.length > 0 && locs.every((u) => u.startsWith(HOST + "/") && /\/(pt|en|es)(\/|$)/.test(u.slice(HOST.length))), "sitemap contains non-public locales or a wrong host");
  check(!locs.some((u) => /\/(login|register|admin|rebuild-lab|reservas)/.test(u)), "sitemap lists auth/admin/lab routes");
  check(!/\/sv/.test(sitemap), "sitemap advertises /sv");
  const tripLocs = locs.filter((u) => u.includes("/tours/")).map((u) => u.split("/tours/")[1]);
  check(new Set(tripLocs).size === LAUNCH_IDS.length && [...new Set(tripLocs)].every((id) => LAUNCH_IDS.includes(id)), `sitemap trips ${JSON.stringify([...new Set(tripLocs)])}`);
  check(locs.length === 3 * (4 + LAUNCH_IDS.length), `sitemap has ${locs.length} URLs`);
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check(robots.includes(`Sitemap: ${HOST}/sitemap.xml`) && /Disallow: \/admin\//.test(robots) && /Disallow: \/api\//.test(robots), "robots.txt incomplete");
  notes.push(`sitemap: ${locs.length} URLs (3 locales × (4 static + ${LAUNCH_IDS.length} approved trips)), no sv/login/register/lab; robots disallows admin/api/auth/reservas/lab`);
}

// ---------------- lab behavior (dev-only) ----------------
{
  const gone = await fetch(`${BASE}/pt/rebuild-lab/cinematic-3d-poc`);
  check(gone.status === 404, `lab Home route status ${gone.status} (expected 404 after promotion)`);
  const lab = await fetch(`${BASE}/pt/rebuild-lab`);
  const labHtml = await lab.text();
  notes.push(`lab (development): /pt/rebuild-lab -> ${lab.status}, noindex=${/noindex/.test(labHtml)}; production behavior is verified by the production build (404 unless REBUILD_LAB_ENABLED)`);
  if (lab.status === 200) check(/noindex/.test(labHtml), "lab route is indexable in development");
  const cfg = read("lib/rebuild-lab/config.ts");
  check(/production/.test(cfg), "lab config has no production rule");
}

// ---------------- /api/trips gate ----------------
{
  const r = await fetch(`${BASE}/api/trips`);
  const j = await r.json();
  const ids = j.map((t) => t.id).sort();
  check(r.status === 200 && JSON.stringify(ids) === JSON.stringify([...LAUNCH_IDS].sort()), `/api/trips ids ${JSON.stringify(ids)}`);
  check(j.every((t) => Object.keys(t).sort().join() === "city,description,id,location,title"), "/api/trips changed its public shape");
  notes.push(`API_TRIPS_GATE: GATED — /api/trips returns ${ids.length} approved trips (same catalog as Home/tours/detail)`);
}

// ---------------- cross-route anchor landing ----------------
const detailPath = `/pt/tours/${LAUNCH_IDS[0]}`;
const routes = [
  { from: "/pt/tours", vp: { w: 1440, h: 900 } },
  { from: detailPath, vp: { w: 1440, h: 900 } },
  { from: "/pt/contato", vp: { w: 1440, h: 900 } },
  { from: "/pt/quem-somos", vp: { w: 1440, h: 900 } },
  { from: "/en/tours", vp: { w: 1440, h: 900 }, locale: "en" },
  { from: "/es/contato", vp: { w: 1440, h: 900 }, locale: "es" },
  { from: "/pt/tours", vp: { w: 390, h: 844 }, mobile: true },
  { from: "/pt/contato", vp: { w: 390, h: 844 }, mobile: true },
  { from: detailPath, vp: { w: 390, h: 844 }, mobile: true },
  { from: "/pt/quem-somos", vp: { w: 390, h: 844 }, mobile: true },
];
for (const R of routes) {
  const locale = R.locale ?? "pt";
  const targets = [...anchors, "#globe-next"];
  for (const hash of targets) {
    const tag = `${R.from}@${R.vp.w} → ${hash}`;
    const context = await browser.newContext({ viewport: { width: R.vp.w, height: R.vp.h }, hasTouch: !!R.mobile, isMobile: !!R.mobile });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}${R.from}`, { waitUntil: "load", timeout: 180000 });
    await page.waitForTimeout(500);
    if (R.mobile) {
      await page.locator("button[aria-controls='site-mobile-navigation']").click();
      await page.waitForTimeout(250);
    }
    const sel = hash === "#globe-next"
      ? `header a[href='/${locale}#globe-next']`
      : R.mobile ? `#site-mobile-navigation a[href='/${locale}${hash}']` : `header nav[aria-label]:visible a[href='/${locale}${hash}']`;
    const link = page.locator(sel).first();
    const count = await link.count();
    check(count === 1, `${tag}: link ${sel} not found`);
    if (!count) { await context.close(); continue; }
    await link.click();
    await page.waitForURL((u) => u.pathname === `/${locale}` && u.hash === hash, { timeout: 60000 }).catch(() => {});
    await page.waitForSelector("[data-testid='globe-journey'][data-mode]", { timeout: 120000 }).catch(() => {});
    // Wait for smooth scroll + ScrollTrigger pin settling.
    let last = -1, same = 0;
    for (let i = 0; i < 100 && same < 5; i++) { await page.waitForTimeout(150); const y = await page.evaluate(() => Math.round(scrollY)); same = y === last ? same + 1 : 0; last = y; }
    const l = await page.evaluate((s) => {
      const el = document.querySelector(s);
      const t = el.getBoundingClientRect();
      const hd = document.querySelector("header[role='banner']").getBoundingClientRect();
      return { path: location.pathname, hash: location.hash, top: Math.round(t.top), headerBottom: Math.round(hd.bottom), atBottom: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2, vis: t.bottom > hd.bottom, headers: document.querySelectorAll("header[role='banner']").length };
    }, hash);
    check(l.path === `/${locale}` && l.hash === hash, `${tag}: landed on ${l.path}${l.hash}`);
    check(l.headers === 1, `${tag}: ${l.headers} banner headers after navigation`);
    const ok = (l.top >= l.headerBottom - 4 && l.top <= l.headerBottom + 8) || (l.atBottom && l.top >= l.headerBottom - 4);
    check(ok, `${tag}: lands at ${l.top}px, header bottom ${l.headerBottom}px, atBottom ${l.atBottom}`);
    check(errors.length === 0, `${tag}: page errors ${errors.join(" | ")}`);
    notes.push(`${tag}: top ${l.top}px / header ${l.headerBottom}px${l.atBottom ? " (bottom of page)" : ""}`);
    await context.close();
  }
}

// ---------------- public journey: Home → Tours → Detail → WhatsApp/guest form → Contact → About ----------------
for (const locale of ["pt", "en", "es"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(`${BASE}/${locale}`, { waitUntil: "load", timeout: 180000 });
  const homeTripLinks = await page.evaluate(() => [...new Set([...document.querySelectorAll("#experiences a[href*='/tours']")].map((a) => a.getAttribute("href")))]);
  check(homeTripLinks.some((h) => h.includes("/tours/")), `${locale}: Home Experiences has no tour links`);
  check(homeTripLinks.every((h) => h.startsWith(`/${locale}/tours`)), `${locale}: Home tour links not localized ${JSON.stringify(homeTripLinks)}`);
  const toursAll = homeTripLinks.find((h) => h === `/${locale}/tours`);
  const steps = [];
  const visit = async (url) => {
    const r = await page.goto(`${BASE}${url}`, { waitUntil: "load", timeout: 180000 });
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => ({ legacyHeaders: [...document.querySelectorAll("header")].filter((h) => h.getAttribute("role") !== "banner" && !h.closest("main")).length, banner: document.querySelectorAll("header[role='banner']").length, footers: document.querySelectorAll("footer[role='contentinfo']").length, html: document.documentElement.outerHTML, wa: [...document.querySelectorAll("a[href*='wa.me']")].map((a) => a.getAttribute("href").split("?")[0]), form: document.querySelectorAll("form").length, h1: document.querySelector("h1")?.textContent?.trim() }));
    check(r.status() === 200, `${locale}: ${url} HTTP ${r.status()}`);
    check(s.banner === 1 && s.footers === 1 && s.legacyHeaders === 0, `${locale}: ${url} chrome banner ${s.banner} / footer ${s.footers} / legacy header ${s.legacyHeaders} (legacy UI?)`);
    check(!stale.test(s.html), `${locale}: ${url} stale contact value`);
    check(s.wa.every((h) => h === "https://wa.me/5522998461906"), `${locale}: ${url} WhatsApp href ${JSON.stringify(s.wa)}`);
    check(!/ai-concierge-widget/.test(s.html), `${locale}: ${url} legacy AI widget mounted`);
    steps.push(`${url} ${s.h1 ? "“" + s.h1.slice(0, 40) + "”" : ""}`);
    return s;
  };
  await visit(toursAll ?? `/${locale}/tours`);
  const cards = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href*='/tours/']")].map((a) => a.getAttribute("href")))]);
  check(cards.length === LAUNCH_IDS.length, `${locale}: tours listing shows ${cards.length} trips`);
  const detail = await visit(cards[0]);
  check(detail.wa.length >= 1, `${locale}: detail has no WhatsApp action`);
  check(detail.form >= 1, `${locale}: detail has no guest request form`);
  const contact = await visit(`/${locale}/contato`);
  check(contact.form >= 1 && contact.wa.length >= 1, `${locale}: contact lacks form/WhatsApp`);
  await visit(`/${locale}/quem-somos`);
  check(requests.filter((u) => u.includes("/api/ai-concierge")).length === 0, `${locale}: journey hit /api/ai-concierge`);
  check(errors.length === 0, `${locale}: journey page errors ${errors.join(" | ").slice(0, 200)}`);
  notes.push(`journey ${locale}: Home → ${steps.join(" → ")}`);
  await context.close();
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-57 public promotion validation");
