/**
 * RT-54 validation — public tour detail (/{locale}/tours/[id]) in the (site) group.
 * Requires a dev server on :3218 and the local Postgres.
 *
 *   node scripts/rt-54-tour-detail-validation.mjs
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const outDir = path.resolve(".tmp/rt-54-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

// Approved launch catalog (canonical ids) with expected public facts.
const TRIPS = [
  { id: "cmljo0s1u0000t0zqa0bpd23p", title: "Tour Privado Premium Rio de Janeiro", price: "R$ 900,00", durationPt: "8 horas" },
  { id: "cmlibniq40000z4zqkbujnutt", title: "Confeitaria Colombo + City Tour Rio", price: "R$ 245,00", durationPt: "5 horas" },
  { id: "cmli1a6im000034zqqzc9sppb", title: "Tour Favela Rocinha com Guia Local", price: "R$ 120,00", durationPt: "3–4 horas" },
  { id: "cmlhxkpy9000028zq27rhytew", title: "Cristo Redentor + Pão de Açúcar", price: "R$ 385,00", durationPt: "5–6 horas" },
];
const EXCLUDED = ["cmljpnazn0001t0zq92ywd6xk", "cmljpsn0j0002t0zqsv6g1los", "cmlibqq5g0001z4zqopyzqlpz", "cmoa70dy400002kzqugm2oulu", "doesnotexist"];

const copy = {
  pt: { back: "Voltar para os passeios", facts: "INFORMAÇÕES DO PASSEIO", price: "Preço por pessoa", duration: "Duração", about: "Sobre o passeio", schedule: "PRÓXIMAS DATAS", noSchedule: "As datas são combinadas diretamente com a equipe.", slot: "Solicite este passeio", cta: "Falar com a equipe", foreign: /(Back to|Tour details|Price per person|Duration|About this tour|Upcoming dates|Talk to the team|Volver a|Información del tour|Precio por|Habla con)/ },
  en: { back: "Back to all tours", facts: "TOUR DETAILS", price: "Price per person", duration: "Duration", about: "About this tour", schedule: "UPCOMING DATES", noSchedule: "Dates are arranged directly with the team.", slot: "Request this tour", cta: "Contact the team", foreign: /(Voltar para|Informações do passeio|Preço por pessoa|Duração|Sobre o passeio|Próximas datas|Fale com|Volver a|Información del tour|Precio por|Habla con)/ },
  es: { back: "Volver a los tours", facts: "INFORMACIÓN DEL TOUR", price: "Precio por persona", duration: "Duración", about: "Sobre este tour", schedule: "PRÓXIMAS FECHAS", noSchedule: "Las fechas se coordinan directamente con el equipo.", slot: "Solicita este tour", cta: "Contactar al equipo", foreign: /(Voltar para|Informações do passeio|Preço por pessoa|Duração|Sobre o passeio|Próximas datas|Fale com|Back to|Tour details|Price per person|Talk to the team)/ },
};

const rawMetadata = /(Duracao:|Duração:|Categoria:|Inclusoes:|Inclusões:|Exclusoes:|Exclusões:)/;
const defaults = /(\b1 dia\b|\b1 day\b|\b1 día\b|\bL Leve\b|undefined|\[object|null\b)/;
const cancellation = /(cancel|reembols|refund|gr[aá]tis|free of charge|free cancel|\b24\s?h\b|\b48\s?h\b|24 horas|48 horas|24 hours|48 hours)/i;
const trust = /(credenciad|accredit|acreditad|certific|verificad|verified|oficial\b|official\b|segur[oa]\b|\bsecure\b|\bsafe\b|garant)/i;
const accountEntry = /(entrar|login|log in|sign in|criar conta|create account|iniciar sesión|cuenta)/i;
const accentDebt = /(Informacoes|confirmacao|selecao|Orientacao|Pre-reserva)/;

const viewports = [
  { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
];
// Full viewport matrix for the first trip; every trip at 1440 and 390 in every locale.
const runs = [];
for (const locale of ["pt", "en", "es"]) {
  for (const vp of viewports) runs.push({ locale, vp, trip: TRIPS[3] });
  for (const trip of TRIPS.slice(0, 3)) for (const vp of [viewports[0], viewports[3]]) runs.push({ locale, vp, trip });
}

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
const dataClaims = new Set();

// ---- static: backend preserved, /api/trips untouched ----
const untouched = execSync("git diff --name-only HEAD -- app/api lib/services/booking.service.ts components/trips/tour-actions.tsx", { encoding: "utf8" }).trim();
check(untouched === "", `booking backend / /api changed (lib/whatsapp.ts is intentionally updated by RT-55): ${untouched}`);
notes.push("booking backend (app/api/bookings, booking.service) and /api/trips unchanged; API_TRIPS_GATE: DEFERRED_TO_RT57");

// ---- excluded ids -> 404 in every locale ----
for (const locale of ["pt", "en", "es"]) {
  for (const id of EXCLUDED) {
    const ctx = await browser.newContext();
    const r = await ctx.request.get(`${BASE}/${locale}/tours/${id}`, { timeout: 120000 });
    const body = await r.text();
    check(r.status() === 404, `${locale}: excluded/unknown id ${id} -> HTTP ${r.status()} (expected 404)`);
    check(!/Duracao|Tour Praias|Morro da Urca|TESTE E2E|Passeio de Barco/.test(body), `${locale}: 404 for ${id} still contains trip content`);
    await ctx.close();
  }
}
notes.push(`excluded ids ${JSON.stringify(EXCLUDED.slice(0, 4))} + unknown id -> 404 in pt/en/es`);

for (const { locale, vp, trip } of runs) {
  const tag = `${locale}@${vp.name}/${trip.id.slice(-6)}`;
  const c = copy[locale];
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch });
  const page = await context.newPage();
  const errors = [];
  const conciergeRequests = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => { if (r.url().includes("/api/ai-concierge")) conciergeRequests.push(r.url()); });

  const resp = await page.goto(`${BASE}/${locale}/tours/${trip.id}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForTimeout(800);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: "instant" }); });
  await page.waitForFunction(() => { const i = document.querySelector("main article img"); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 20000 }).catch(() => {});

  const d = await page.evaluate(() => {
    const main = document.querySelector("main");
    const rect = (e) => e.getBoundingClientRect();
    const contentSel = ["#tour-about-heading", "#tour-highlights-heading", "#tour-included-heading", "#tour-excluded-heading"];
    const contentSections = contentSel.map((s) => document.querySelector(s)?.closest("section")).filter(Boolean);
    const contentText = contentSections.map((s) => s.innerText).join("\n");
    const clone = document.body.cloneNode(true);
    contentSel.forEach((s) => clone.querySelector(s)?.closest("section")?.remove());
    clone.querySelectorAll("script, style, noscript").forEach((n) => n.remove());
    const chromeText = clone.innerText ?? clone.textContent;
    const back = [...main.querySelectorAll("a")].find((a) => /\/tours$/.test(a.getAttribute("href") || ""));
    const backCs = back && getComputedStyle(back);
    const lum = (rgb) => { const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const bgOf = (el) => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== "rgba(0, 0, 0, 0)" && !c.endsWith(", 0)")) return c; } return "rgb(255,255,255)"; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const links = [...main.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), t: a.textContent.trim().slice(0, 40), target: a.getAttribute("target"), rel: a.getAttribute("rel"), h: Math.round(rect(a).height), w: Math.round(rect(a).width) }));
    const imgs = [...main.querySelectorAll("img")].map((i) => ({ alt: i.alt, src: i.currentSrc || i.src, loaded: i.complete && i.naturalWidth > 0, optimized: (i.currentSrc || i.src).includes("/_next/image"), loading: i.getAttribute("loading") }));
    const place = main.querySelector("header p:nth-of-type(2) span")?.textContent.trim();
    const aside = main.querySelector("aside > div");
    const dt = [...main.querySelectorAll("dt")].map((e) => e.textContent.trim());
    return {
      siteTheme: document.querySelectorAll(".site-theme").length, headers: document.querySelectorAll("header").length, headerRole: document.querySelector("header")?.getAttribute("role"),
      footer: !!document.querySelector("footer[role='contentinfo']"), legacyHeader: [...document.querySelectorAll("header")].some((h) => h.getAttribute("role") !== "banner" && !h.closest("article")),
      aiWidget: document.querySelectorAll("[data-testid='ai-concierge-entry'], [data-testid='ai-concierge-panel']").length,
      h1s: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()), h2s: [...main.querySelectorAll("h2")].map((h) => h.textContent.trim()),
      canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href"), metaDesc: document.querySelector("meta[name='description']")?.getAttribute("content") ?? "",
      title: document.title, mainText: main.innerText, chromeText, contentText, links, imgs, place,
      // Location elements (not the title text): the city/place must be shown once, never as repeated chips.
      cityOccurrencesInHeader: [...(main.querySelector("article header")?.querySelectorAll("p, span, li") ?? [])].filter((e) => e.children.length === 0 && e.textContent.trim() === "Rio de Janeiro").length,
      back: back && { text: back.textContent.trim(), href: back.getAttribute("href"), h: Math.round(rect(back).height), contrast: +ratio(backCs.color, bgOf(back)).toFixed(2) },
      slot: !!main.querySelector("[data-conversion-slot='rt-55']"), formCount: main.querySelectorAll("form").length, formsPostingToBookings: [...main.querySelectorAll("form")].filter((f) => /bookings|login|register/.test(f.getAttribute("action") || "")).length, buttons: [...main.querySelectorAll("button")].map((b) => b.textContent.trim()),
      price: main.querySelector("article header .text-\\[30px\\]")?.textContent.trim() ?? (main.innerText.match(/R\$ \d+,\d{2}/) || [])[0],
      dt, dl: !!main.querySelector("dl"), ulCount: main.querySelectorAll("ul").length,
      asidePosition: aside && getComputedStyle(aside).position, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      interactive: [...main.querySelectorAll("a, button")].filter((e) => e.getClientRects().length > 0).map((e) => ({ h: Math.round(rect(e).height), w: Math.round(rect(e).width), t: e.textContent.trim().slice(0, 28) })),
      h1Font: getComputedStyle(main.querySelector("h1")).fontFamily, bg: getComputedStyle(main.firstElementChild).backgroundColor,
    };
  });

  check(resp.status() === 200, `${tag}: HTTP ${resp.status()}`);
  check(d.siteTheme === 1 && d.headers >= 1 && d.headerRole === "banner" && d.footer, `${tag}: SiteHeader/SiteFooter missing (theme ${d.siteTheme}, role ${d.headerRole}, footer ${d.footer})`);
  check(!d.legacyHeader && !d.aiWidget && conciergeRequests.length === 0, `${tag}: legacy header or AI widget present`);
  check(d.h1s.length === 1 && d.h1s[0] === trip.title, `${tag}: H1 ${JSON.stringify(d.h1s)} (expected "${trip.title}")`);
  check(d.canonical && d.canonical.endsWith(`/${locale}/tours/${trip.id}`), `${tag}: canonical ${d.canonical}`);
  check(!rawMetadata.test(d.metaDesc) && d.metaDesc.length > 20, `${tag}: meta description leaks metadata or is empty ("${d.metaDesc.slice(0, 60)}")`);
  check(!rawMetadata.test(d.mainText) && !rawMetadata.test(d.chromeText), `${tag}: raw metadata visible (${(d.mainText.match(rawMetadata) || [])[0]})`);
  check(!defaults.test(d.mainText), `${tag}: malformed/default string "${(d.mainText.match(defaults) || [])[0]}"`);
  check(d.cityOccurrencesInHeader <= 1, `${tag}: city repeated ${d.cityOccurrencesInHeader}x in the detail header`);
  check(!cancellation.test(d.mainText) && !cancellation.test(d.chromeText), `${tag}: cancellation/refund claim "${(d.chromeText.match(cancellation) || d.mainText.match(cancellation) || [])[0]}"`);
  check(!trust.test(d.chromeText), `${tag}: unsupported trust/credential claim in the interface "${(d.chromeText.match(trust) || [])[0]}"`);
  (d.contentText.match(new RegExp(trust.source, "gi")) || []).forEach((m) => dataClaims.add(`${trip.id.slice(-6)}: "${m}"`));
  check(!accentDebt.test(d.mainText), `${tag}: unaccented legacy copy "${(d.mainText.match(accentDebt) || [])[0]}"`);
  check(!accountEntry.test(d.mainText) && !d.links.some((l) => /login|register|\/api\/bookings/.test(l.href || "")) && d.formsPostingToBookings === 0, `${tag}: login-gated or booking action on the page`); // RT-55 added the guest request form (validated by scripts/rt-55-guest-conversion-validation.mjs)
  check(d.slot && d.links.some((l) => l.href === "#tour-contact"), `${tag}: conversion slot / shortcut missing`);
  const wa = d.links.find((l) => /wa\.me/.test(l.href || ""));
  const mail = d.links.find((l) => (l.href || "").startsWith("mailto:"));
  check(wa && wa.href.startsWith("https://wa.me/5522998461906?text=") && wa.target === "_blank" && /noopener/.test(wa.rel || ""), `${tag}: WhatsApp link ${JSON.stringify(wa)}`);
  check(mail && mail.href === "mailto:contato@ricardotour.com", `${tag}: mailto ${JSON.stringify(mail)}`);
  check(!/(travelrick|\+?55\s?21|96681|97116)/i.test(d.mainText + d.chromeText), `${tag}: stale contact value`);
  check(d.back && d.back.text === c.back && d.back.href === `/${locale}/tours` && d.back.h >= 44 && d.back.contrast >= 4.5, `${tag}: back link ${JSON.stringify(d.back)}`);
  check(d.price === trip.price, `${tag}: price "${d.price}" (expected ${trip.price})`);
  check(d.imgs.length === 1 && d.imgs[0].loaded && d.imgs[0].optimized && !/placeholder/.test(d.imgs[0].src) && d.imgs[0].alt.includes(trip.title), `${tag}: images ${JSON.stringify(d.imgs)}`);
  check(d.dl && d.dt.includes(c.duration) && d.mainText.includes(c.price) && d.mainText.includes(c.about.replace(/^./, (x) => x)), `${tag}: structured facts/labels (dt ${JSON.stringify(d.dt)})`);
  check(d.mainText.toUpperCase().includes(c.facts) && d.mainText.toUpperCase().includes(c.schedule) && d.mainText.includes(c.noSchedule) && d.mainText.includes(c.slot) && d.mainText.includes(c.cta), `${tag}: localized labels/schedule neutral state missing`);
  check(d.h2s.length >= 4 && d.ulCount >= 2, `${tag}: semantic structure (h2 ${d.h2s.length}, ul ${d.ulCount})`);
  check(!/(dispon[ií]vel|available|disponible|vagas|spots left)/i.test(d.mainText), `${tag}: availability claim`);
  check(!c.foreign.test(d.chromeText.replace(d.contentText, "")), `${tag}: mixed-language interface "${(d.chromeText.match(c.foreign) || [])[0]}"`);
  check(/siteDisplay|cormorant/i.test(d.h1Font) && d.bg === "rgb(243, 239, 230)", `${tag}: design foundation (font ${d.h1Font}, bg ${d.bg})`);
  check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
  if (vp.touch) {
    check(d.interactive.every((e) => e.h >= 44 && e.w >= 44), `${tag}: touch targets below 44px ${JSON.stringify(d.interactive.filter((e) => e.h < 44 || e.w < 44))}`);
    check(d.asidePosition === "static", `${tag}: conversion panel is ${d.asidePosition} on a small screen (must not be sticky)`);
  }
  if (locale === "pt") check(d.mainText.includes(trip.durationPt), `${tag}: duration "${trip.durationPt}" missing`);

  if (vp.name === "1440x900" && trip.id === TRIPS[3].id) {
    await page.keyboard.press("Tab"); await page.waitForTimeout(250); // skip link
    const seen = [];
    for (let i = 0; i < 30 && seen.length < 40; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); return { href: e.getAttribute("href"), inMain: !!e.closest("main"), ow: parseFloat(cs.outlineWidth), os: cs.outlineStyle }; });
      if (f.inMain) seen.push(f);
      if (!f.inMain && seen.length > 0) break;
    }
    check(seen.length >= 4 && seen.every((f) => f.os !== "none" && f.ow >= 2), `${tag}: keyboard focus ring missing on ${JSON.stringify(seen.filter((f) => f.os === "none" || f.ow < 2).slice(0, 2))} (${seen.length} stops)`);
    check(seen[0]?.href === `/${locale}/tours`, `${tag}: first focusable in main is not the back link (${seen[0]?.href})`);
  }

  check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
  notes.push(`${tag}: ok, doc ${await page.evaluate(() => document.body.scrollHeight)}px`);
  if (vp.name === "1440x900" && trip.id === TRIPS[3].id || vp.name === "390x844" && trip.id === TRIPS[3].id) await page.screenshot({ path: path.join(outDir, `detail-${locale}-${vp.name}.png`), fullPage: true });
  await context.close();
}

await browser.close();
notes.push(`DATA_CONTENT_CLAIMS (trip content from the database, NOT edited; Owner decision pending): ${[...dataClaims].join("; ") || "none"}`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-54 tour detail validation");
