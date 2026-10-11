// RT-46: measure WCAG 1.4.3 contrast of every gold text node (incl. :hover colour classes) against its effective
// background, on every public route and locale. Complements axe (Lighthouse), which skips hover states and pages
// Lighthouse was not run on. Usage: node scripts/rt-46-gold-contrast-audit.mjs <baseUrl> [out.json]
import fs from "node:fs";
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3200", out = ".tmp/rt-46-gold-contrast.json"] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${base}/pt/tours`);
const tour = await page.locator('a[href^="/pt/tours/"]').first().getAttribute("href");
const routes = [];
for (const l of ["pt", "en", "es"]) routes.push(`/${l}`, `/${l}/tours`, `/${l}/contato`, `/${l}/quem-somos`, tour.replace("/pt/", `/${l}/`));
routes.push("/pt/planeje-sua-viagem");

const GOLDS = { "#8a6a2b": "gold-deep", "#856629": "gold-text", "#c8a86b": "gold", "#e8c780": "gold-bright" };
const results = [];
for (const r of routes) {
  await page.goto(base + r, { waitUntil: "networkidle" });
  const found = await page.evaluate((GOLDS) => {
    const hex = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); return { hex: "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""), a }; };
    const lum = (h) => { const v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage !== "none" && s.backgroundImage) return { hex: null, image: true }; const c = hex(s.backgroundColor); if (c && c.a > 0.95) return c; } return { hex: "#ffffff" }; };
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(el);
      if (s.visibility === "hidden" || s.display === "none" || el.closest("[hidden]")) continue;
      const fg = hex(s.color);
      const hoverGold = [...el.classList].find((c) => /^hover:text-\[(#[0-9a-fA-F]{6}|var\(--site-gold[^\]]*\))\]$/.test(c));
      const isGold = fg && GOLDS[fg.hex];
      if (!isGold && !hoverGold) continue;
      const size = parseFloat(s.fontSize), weight = Number(s.fontWeight);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const bg = bgOf(el);
      const states = [];
      if (isGold) states.push({ state: "default", fg: fg.hex });
      if (hoverGold) { const v = hoverGold.match(/#[0-9a-fA-F]{6}/)?.[0]?.toLowerCase() ?? (hoverGold.includes("gold-deep") ? "#8a6a2b" : hoverGold.includes("gold-text") ? "#856629" : hoverGold.includes("gold-bright") ? "#e8c780" : "#c8a86b"); states.push({ state: "hover", fg: v }); }
      for (const st of states) {
        const cr = bg.hex ? ratio(st.fg, bg.hex) : null;
        out.push({ text: el.textContent.trim().slice(0, 40), tag: el.tagName.toLowerCase(), state: st.state, fg: st.fg, token: GOLDS[st.fg] ?? st.fg, bg: bg.hex ?? "image", sizePx: size, weight, large, ratio: cr && Math.round(cr * 100) / 100, required: large ? 3 : 4.5, pass: cr == null ? null : cr >= (large ? 3 : 4.5) });
      }
    }
    return out;
  }, GOLDS);
  for (const f of found) results.push({ route: r, ...f });
}
fs.writeFileSync(out, JSON.stringify(results, null, 2));
const fails = results.filter((x) => x.pass === false);
const unknown = results.filter((x) => x.pass === null);
console.log(`checked ${results.length} gold text states on ${routes.length} routes; fail ${fails.length}; image-background (manual) ${unknown.length}`);
const groups = new Map();
for (const f of fails) {
  const key = `${f.state} ${f.token} on ${f.bg} ${f.sizePx}px "${f.text}" ratio ${f.ratio}`;
  groups.set(key, [...(groups.get(key) ?? []), f.route]);
}
for (const [key, routesOf] of groups) console.log(" FAIL", key, "routes:", [...new Set(routesOf)].join(" "));
await browser.close();
