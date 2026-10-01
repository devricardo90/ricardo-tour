/**
 * RT-56 validation — public /contato and /quem-somos in the (site) group.
 *
 * Requires a dev server on :3218 started with CONTACT_EMAIL_MODE=log (outbound email is MUTED: the action stores the
 * message and logs a one-line summary instead of sending) with its output in .tmp/dev55.log, plus the local Postgres.
 *
 *   CONTACT_EMAIL_MODE=log npx next dev --webpack -p 3218 > .tmp/dev55.log 2>&1
 *   node scripts/rt-56-contact-about-validation.mjs
 *
 * Test messages are named "RT56 TEST ..." and are deleted at the end (only those rows).
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const LOG = path.resolve(".tmp/dev55.log");
const outDir = path.resolve(".tmp/rt-56-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const copy = {
  pt: { contactH1: "Fale com a Rick Travel", contactEyebrow: "CONTATO", aboutH1: "Uma agência de turismo local no Rio de Janeiro.", aboutEyebrow: "QUEM SOMOS", send: "Enviar mensagem", errName: "Informe seu nome.", errContact: "Informe um e-mail ou um telefone/WhatsApp para retorno.", errMsg: "Escreva sua mensagem.", success: "Mensagem recebida", failure: "Não foi possível enviar agora.", rate: "Muitas mensagens em pouco tempo", ctaTours: "Ver os passeios", foreign: /(Talk to Rick Travel|Habla con Rick Travel|Send message|Enviar mensaje|Browse the tours|Ver los tours|A local travel agency|Una agencia de turismo|About us\b)/ },
  en: { contactH1: "Talk to Rick Travel", contactEyebrow: "CONTACT", aboutH1: "A local travel agency in Rio de Janeiro.", aboutEyebrow: "ABOUT US", send: "Send message", errName: "Enter your name.", errContact: "Enter an email or a phone/WhatsApp so we can reply.", errMsg: "Write your message.", success: "Message received", failure: "We couldn't send your message right now.", rate: "Too many messages in a short time", ctaTours: "Browse the tours", foreign: /(Fale com a Rick Travel|Habla con Rick Travel|Enviar mensagem|Enviar mensaje|Ver os passeios|Ver los tours|Uma agência de turismo|Una agencia de turismo|Quem somos|Quiénes somos)/ },
  es: { contactH1: "Habla con Rick Travel", contactEyebrow: "CONTACTO", aboutH1: "Una agencia de turismo local en Río de Janeiro.", aboutEyebrow: "QUIÉNES SOMOS", send: "Enviar mensaje", errName: "Indica tu nombre.", errContact: "Indica un correo o un teléfono/WhatsApp para responderte.", errMsg: "Escribe tu mensaje.", success: "Mensaje recibido", failure: "No pudimos enviar tu mensaje ahora.", rate: "Demasiados mensajes en poco tiempo", ctaTours: "Ver los tours", foreign: /(Fale com a Rick Travel|Talk to Rick Travel|Enviar mensagem|Send message|Ver os passeios|Browse the tours|Uma agência de turismo|A local travel agency|Quem somos|About us\b)/ },
};
const stale = /(travelrick|\+?55\s?21|96681|97116)/i;
const unsupported = /(credenciad|accredit|acreditad|certific|experi[eê]ncia segura|experiencia segura|safe experience|contato seguro|contacto seguro|secure contact|opera[cç][aã]o credenciada|garant|guarant|parceir[oa] oficial|official partner|\d+\s*(anos|years|años) (de|of|en)|premiad|award|avalia[cç][aã]o|rating|24\s*\/\s*7|seguro de viagem|insurance)/i;
const invented = /(hor[aá]rio de atendimento|business hours|horario de atenci|segunda a|monday to|\bav\.|avenida|endere[cç]o|\baddress\b|direcci[oó]n)/i;
const oldStructure = /(miss[ãa]o|vis[ãa]o|\bvalores\b|mission|vision|\bvalues\b|misi[oó]n|visi[oó]n|seguran[cç]a|security|seguridad)/i;
const promises = /(imediat|instant|em at[eé]|dentro de|within|hoje mesmo|same day|\d+\s?(h|horas|hours|minutos|minutes)\b|garant|confirmad|reserva|booking|disponibilidade|availability|pagamento|payment)/i;
const accountEntry = /(\bentrar\b(?! em contato)|\blogin\b|log in|sign in|criar conta|create account|iniciar sesión|\bcuenta\b)/i;
const WA = "https://wa.me/5522998461906";

const q = '"';
const psql = (sql) => execSync("docker exec -i ricktravel-db psql -U postgres -d ricktravel -tA", { input: sql, encoding: "utf8" }).trim();
const testRows = () => JSON.parse(psql(`select coalesce(json_agg(t order by t.${q}createdAt${q}), '[]'::json) from (select id, name, email, phone, status, message, ${q}createdAt${q} from ${q}ContactSubmission${q} where name like 'RT56 TEST%') t`) || "[]");
const rowCount = () => Number(psql(`select count(*) from ${q}ContactSubmission${q}`));
const serverLog = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8") : "");
let ip = 0;
const nextIp = () => `10.56.${Math.floor(++ip / 250)}.${ip % 250}`;

const viewports = [
  { name: "1440x900", w: 1440, h: 900 }, { name: "1024x768", w: 1024, h: 768 },
  { name: "768x1024", w: 768, h: 1024, touch: true }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true },
];
const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
const baseline = rowCount();

async function open(locale, route, vp, address = nextIp()) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: !!vp.touch, isMobile: !!vp.touch, extraHTTPHeaders: { "x-forwarded-for": address } });
  await context.route("https://wa.me/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>" }));
  const page = await context.newPage();
  const errors = []; const requests = [];
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => requests.push({ url: decodeURIComponent(r.url()), method: r.method() }));
  const resp = await page.goto(`${BASE}/${locale}/${route}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForTimeout(700);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 60)); } scrollTo({ top: 0, behavior: "instant" }); });
  await page.waitForTimeout(600);
  return { context, page, errors, requests, resp };
}

// ---------- static guarantees ----------
const newFiles = ["app/[locale]/(site)/contato/page.tsx", "app/[locale]/(site)/quem-somos/page.tsx", "components/site/contact/contact-copy.ts", "components/site/contact/contact-message-form.tsx", "components/site/about/about-copy.ts", "lib/contact-message.ts", "app/actions/contact-message.ts"];
for (const f of newFiles) check(!stale.test(fs.readFileSync(f, "utf8")), `stale contact value in ${f}`);
check(!newFiles.some((f) => /components\/about\//.test(fs.readFileSync(f, "utf8"))), "a migrated file imports the legacy components/about/*");
const noticed = execSync("git diff --name-only HEAD -- app/api prisma/schema.prisma prisma/migrations lib/services/booking.service.ts lib/services/email.service.ts 'app/[locale]/admin' 'app/[locale]/login' 'app/[locale]/register'", { encoding: "utf8" }).trim();
check(noticed === "", `schema / booking / email service / admin / auth changed: ${noticed}`);
const notifier = fs.readFileSync("lib/services/tour-request-notification.ts", "utf8");
check(/NOTIFICATION_SENDER = "Rick Travel <reservas@ricktravel\.com\.br>"/.test(notifier) && /NOTIFICATION_RECIPIENT = PUBLIC_CONTACT\.email/.test(notifier), "notification sender/recipient configuration changed");
// RT-57 retired the unreferenced legacy About/contact components; the contact Server Action must remain.
check(fs.existsSync("app/actions/contact.ts"), "app/actions/contact.ts was deleted");
notes.push("static: no stale values in new files; no schema/booking/email-service/admin/auth change; sender reservas@ricktravel.com.br unchanged, recipient contato@ricardotour.com; legacy contact/about components kept (unreferenced by routes)");

// ---------- every route x locale x viewport ----------
for (const route of ["contato", "quem-somos"]) {
  for (const locale of ["pt", "en", "es"]) {
    const c = copy[locale];
    for (const vp of viewports) {
      const tag = `${locale}/${route}@${vp.name}`;
      const { context, page, errors, requests, resp } = await open(locale, route, vp);
      const d = await page.evaluate(() => {
        const main = document.querySelector("main");
        const rect = (e) => e.getBoundingClientRect();
        const headings = [...main.querySelectorAll("h1,h2,h3,h4")].map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim() }));
        const links = [...main.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), t: a.textContent.trim().slice(0, 40), target: a.getAttribute("target"), rel: a.getAttribute("rel") }));
        const interactive = [...main.querySelectorAll("a, button, input, textarea")].filter((e) => e.getClientRects().length > 0 && e.tabIndex >= 0).map((e) => ({ h: Math.round(rect(e).height), w: Math.round(rect(e).width), n: (e.getAttribute("name") || e.textContent.trim()).slice(0, 24) }));
        const imgs = [...main.querySelectorAll("img")].map((i) => ({ alt: i.alt, src: i.currentSrc || i.src, loaded: i.complete && i.naturalWidth > 0 }));
        return {
          siteTheme: document.querySelectorAll(".site-theme").length, headers: [...document.querySelectorAll("header")].filter((h) => !h.closest("main")).map((h) => h.getAttribute("role")), footer: !!document.querySelector("footer[role='contentinfo']"),
          aiWidget: document.querySelectorAll("[data-testid='ai-concierge-entry'], [data-testid='ai-concierge-panel']").length, h1s: headings.filter((h) => h.level === 1).map((h) => h.text), headings,
          eyebrow: main.querySelector("p")?.textContent.trim(), mainText: main.innerText, pageText: document.body.innerText, links, interactive, imgs,
          font: getComputedStyle(main.querySelector("h1")).fontFamily, bg: getComputedStyle(main.firstElementChild).backgroundColor, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          lists: main.querySelectorAll("ul").length, lang: document.documentElement.lang,
        };
      });
      check(resp.status() === 200, `${tag}: HTTP ${resp.status()}`);
      check(d.siteTheme === 1 && d.headers.length >= 1 && d.headers.every((r) => r === "banner") && d.footer, `${tag}: SiteHeader/SiteFooter/legacy header (${JSON.stringify(d.headers)})`);
      check(d.aiWidget === 0 && !requests.some((r) => r.url.includes("/api/ai-concierge")), `${tag}: AI widget / mock request`);
      const expectedH1 = route === "contato" ? c.contactH1 : c.aboutH1;
      const expectedEyebrow = route === "contato" ? c.contactEyebrow : c.aboutEyebrow;
      check(d.h1s.length === 1 && d.h1s[0] === expectedH1 && d.eyebrow === expectedEyebrow, `${tag}: heading ${JSON.stringify(d.h1s)} / eyebrow "${d.eyebrow}"`);
      check(d.headings.every((h, i) => i === 0 || h.level <= d.headings[i - 1].level + 1) && d.headings[0]?.level === 1, `${tag}: heading hierarchy ${JSON.stringify(d.headings.map((h) => h.level))}`);
      check(!stale.test(d.pageText), `${tag}: stale contact value`);
      check(!unsupported.test(d.mainText) && !unsupported.test(d.pageText), `${tag}: unsupported claim "${(d.pageText.match(unsupported) || [])[0]}"`);
      check(!invented.test(d.mainText), `${tag}: invented hours/address "${(d.mainText.match(invented) || [])[0]}"`);
      check(!accountEntry.test(d.mainText) && !d.links.some((l) => /login|register|reservas/.test(l.href || "")), `${tag}: account/login affordance`);
      check(!c.foreign.test(d.mainText), `${tag}: mixed-language text "${(d.mainText.match(c.foreign) || [])[0]}"`);
      check(/siteDisplay|cormorant/i.test(d.font) && /rgb\((243, 239, 230|251, 248, 242)\)/.test(d.bg), `${tag}: design foundation (font ${d.font}, bg ${d.bg})`);
      check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
      check(d.interactive.every((e) => e.h >= (vp.touch ? 44 : 40) && e.w >= 44), `${tag}: small targets ${JSON.stringify(d.interactive.filter((e) => e.h < 44 || e.w < 44))}`);
      check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);

      const mail = d.links.find((l) => (l.href || "").startsWith("mailto:"));
      const wa = d.links.find((l) => (l.href || "").startsWith(WA));
      if (route === "contato") {
        const ig = d.links.find((l) => /instagram\.com/.test(l.href || ""));
        check(mail && mail.href === "mailto:contato@ricardotour.com" && mail.t === "contato@ricardotour.com", `${tag}: email ${JSON.stringify(mail)}`);
        check(wa && wa.href === WA && wa.t === "+55 22 99846-1906" && wa.target === "_blank" && /noopener/.test(wa.rel || ""), `${tag}: WhatsApp ${JSON.stringify(wa)}`);
        check(ig && ig.href === "https://www.instagram.com/ricktravelbrasil/" && ig.target === "_blank" && /noopener/.test(ig.rel || ""), `${tag}: Instagram ${JSON.stringify(ig)}`);
        check(d.lists >= 1 && d.links.some((l) => new RegExp(`^/${locale}/tours$`).test(l.href || "")), `${tag}: contact list / tours link`);
      } else {
        check(!oldStructure.test(d.headings.map((h) => h.text).join(" | ")), `${tag}: old mission/vision/values/security heading present`);
        check(d.imgs.length === 1 && d.imgs[0].loaded && d.imgs[0].src.includes("/_next/image") && d.imgs[0].alt.length > 20, `${tag}: about image ${JSON.stringify(d.imgs)}`);
        check(!requests.some((r) => r.url.includes("ricardo-guia-cracha")), `${tag}: the 2.1 MB original image was requested`);
        check(d.links.some((l) => new RegExp(`^/${locale}/tours$`).test(l.href || "")) && d.links.some((l) => new RegExp(`^/${locale}/contato$`).test(l.href || "")) && wa && wa.target === "_blank", `${tag}: CTAs (tours/contact/WhatsApp) missing`);
        check(d.mainText.includes("Ricardo") && !/(fundador|founder).{0,40}(anos|years)/i.test(d.mainText), `${tag}: founder line`);
      }
      if (vp.name === "1440x900" || vp.name === "390x844") await page.screenshot({ path: path.join(outDir, `${route}-${locale}-${vp.name}.png`), fullPage: true });
      await context.close();
    }
  }
}
notes.push("pages: 30 route x locale x viewport loads (contato + quem-somos, pt/en/es, 1440/1024/768/390/360)");

// ---------- /contato behaviour ----------
{
  const { context, page } = await open("pt", "contato", viewports[0]);
  await page.click("[data-testid='contact-form'] button[type=submit]"); await page.waitForTimeout(300);
  const v = await page.evaluate(() => { const f = document.querySelector("[data-testid='contact-form']"); return { text: f.innerText, focused: document.activeElement?.getAttribute("name"), invalid: [...f.querySelectorAll("[aria-invalid='true']")].map((i) => ({ n: i.name, ok: (i.getAttribute("aria-describedby") || "").split(" ").filter(Boolean).every((id) => !!document.getElementById(id)) })), alert: !!f.querySelector("p[role='alert']") }; });
  check(v.text.includes(copy.pt.errName) && v.text.includes(copy.pt.errContact) && v.text.includes(copy.pt.errMsg) && v.alert && v.focused === "name" && v.invalid.every((i) => i.ok), `validation: ${JSON.stringify({ f: v.focused, a: v.alert, i: v.invalid })}`);
  await page.fill("input[name=name]", "RT56 TEST validation"); await page.fill("input[name=email]", "bad"); await page.fill("textarea[name=message]", "curto");
  await page.click("[data-testid='contact-form'] button[type=submit]"); await page.waitForTimeout(300);
  const v2 = await page.evaluate(() => document.querySelector("[data-testid='contact-form']").innerText);
  check(v2.includes("Informe um e-mail válido.") && v2.includes("Escreva pelo menos 10 caracteres."), "validation: bad email / short message not rejected");
  check(rowCount() === baseline, "validation: a row was stored for invalid input");
  await context.close();
  for (const locale of ["en", "es"]) {
    const o = await open(locale, "contato", viewports[0]);
    await o.page.click("[data-testid='contact-form'] button[type=submit]"); await o.page.waitForTimeout(300);
    const t = await o.page.evaluate(() => document.querySelector("[data-testid='contact-form']").innerText);
    check(t.includes(copy[locale].errName) && t.includes(copy[locale].errContact) && t.includes(copy[locale].errMsg), `${locale}: localized errors missing`);
    await o.context.close();
  }
  notes.push("validation: required fields, contact-method rule, email format, message length, aria + focus order, localized errors");
}

const created = [];
for (const [locale, email, phone] of [["pt", "rt56-pt@example.com", "+55 21 91234-5678"], ["en", "rt56-en@example.com", ""], ["es", "", "+55 21 98765-4321"]]) {
  const { context, page, requests, errors } = await open(locale, "contato", viewports[0]);
  await page.fill("input[name=name]", `RT56 TEST ${locale}`);
  if (email) await page.fill("input[name=email]", email);
  if (phone) await page.fill("input[name=phone]", phone);
  await page.fill("textarea[name=message]", `Mensagem de teste ${locale}: gostaria de saber mais sobre os passeios.`);
  await page.focus("input[name=name]"); await page.keyboard.press("Enter");
  await page.waitForSelector("[data-testid='contact-success']", { timeout: 60000 }).catch(() => {});
  const ok = await page.evaluate(() => ({ s: !!document.querySelector("[data-testid='contact-success']"), t: document.querySelector("[data-testid='contact-success']")?.innerText ?? "", role: document.querySelector("[data-testid='contact-success']")?.getAttribute("role"), f: !!document.querySelector("[data-testid='contact-form']"), focused: document.activeElement?.getAttribute("data-testid") }));
  check(ok.s && ok.t.includes(copy[locale].success) && ok.role === "status" && !ok.f && ok.focused === "contact-success", `${locale}: success state ${JSON.stringify({ s: ok.s, r: ok.role, f: ok.f })}`);
  check(!promises.test(ok.t), `${locale}: success wording promises something ("${(ok.t.match(promises) || [])[0]}")`);
  check(!requests.some((r) => /\/api\/bookings|\/login|\/register/.test(r.url)) && errors.length === 0, `${locale}: auth/booking touched or console errors ${errors.join("|")}`);
  created.push({ locale, email, phone });
  await context.close();
}
await new Promise((r) => setTimeout(r, 1200));
for (const { locale, email, phone } of created) {
  const row = testRows().find((r) => r.name === `RT56 TEST ${locale}`);
  check(!!row, `${locale}: message not stored`);
  if (!row) continue;
  check(row.status === "PENDING" && row.email === email && (row.phone ?? "") === phone, `${locale}: stored contact fields ${JSON.stringify({ e: row.email, p: row.phone, s: row.status })}`);
  check(row.message.includes("[Mensagem — formulário de contato do site]") && row.message.includes(`Idioma da página: ${locale}`) && row.message.includes(`/${locale}/contato`) && row.message.includes(`Mensagem de teste ${locale}`), `${locale}: stored message incomplete:\n${row.message}`);
  const line = serverLog().split("\n").find((l) => l.includes(`submission=${row.id}`));
  check(!!line && line.includes("[contact-message] email muted") && line.includes("to=contato@ricardotour.com") && line.includes(email ? "replyTo=set" : "replyTo=none"), `${locale}: muted notification log missing/incorrect: ${line}`);
}
notes.push("success: stored in ContactSubmission (email/phone/page/locale/message); notification muted to contato@ricardotour.com with Reply-To when an email was given; wording promises nothing");

// failure keeps values and shows fallbacks
{
  const { context, page } = await open("pt", "contato", viewports[0]);
  const before = rowCount();
  await page.route((url) => url.pathname.endsWith("/contato"), (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await page.fill("input[name=name]", "RT56 TEST failure"); await page.fill("input[name=email]", "rt56-fail@example.com"); await page.fill("textarea[name=message]", "Mensagem que não deve ser perdida.");
  await page.click("[data-testid='contact-form'] button[type=submit]");
  await page.waitForSelector("[data-testid='contact-failure']", { timeout: 30000 }).catch(() => {});
  const f = await page.evaluate(() => ({ t: document.querySelector("[data-testid='contact-failure']")?.innerText ?? "", role: document.querySelector("[data-testid='contact-failure']")?.getAttribute("role"), success: !!document.querySelector("[data-testid='contact-success']"), name: document.querySelector("input[name=name]")?.value, msg: document.querySelector("textarea[name=message]")?.value, wa: !!document.querySelector("[data-testid='contact-whatsapp-fallback']"), mail: !!document.querySelector("[data-testid='contact-form']")?.parentElement?.querySelector("a[href='mailto:contato@ricardotour.com']") }));
  check(f.t.includes(copy.pt.failure) && f.role === "alert" && !f.success && f.name === "RT56 TEST failure" && f.msg === "Mensagem que não deve ser perdida." && f.wa && f.mail, `failure: ${JSON.stringify({ r: f.role, s: f.success, n: f.name, w: f.wa, m: f.mail })}`);
  await new Promise((r) => setTimeout(r, 400));
  check(rowCount() === before, "failure: a message was stored although submission failed");
  await context.close();
  notes.push("failure: calm alert, values kept, WhatsApp/email fallbacks, no fake success, nothing stored");
}
// honeypot + rate limit
{
  const { context, page } = await open("pt", "contato", viewports[0]);
  await page.fill("input[name=name]", "RT56 TEST honeypot"); await page.fill("input[name=email]", "rt56-bot@example.com"); await page.fill("textarea[name=message]", "Mensagem de um robô qualquer.");
  await page.evaluate(() => { document.querySelector("input[name='company_website']").value = "http://spam.example"; });
  await page.click("[data-testid='contact-form'] button[type=submit]");
  await page.waitForSelector("[data-testid='contact-success']", { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
  check(!testRows().some((r) => r.name === "RT56 TEST honeypot"), "honeypot: a bot submission was stored");
  await context.close();
  const address = nextIp(); let sixth = "";
  for (let i = 1; i <= 6; i++) {
    const o = await open("pt", "contato", viewports[0], address);
    await o.page.fill("input[name=name]", `RT56 TEST rate-${i}`); await o.page.fill("input[name=email]", "rt56-rate@example.com"); await o.page.fill("textarea[name=message]", "Mensagem para o limite de envios.");
    await o.page.click("[data-testid='contact-form'] button[type=submit]");
    await o.page.waitForSelector("[data-testid='contact-success'], [data-testid='contact-failure']", { timeout: 30000 }).catch(() => {});
    if (i === 6) sixth = await o.page.evaluate(() => document.querySelector("[data-testid='contact-failure']")?.innerText ?? "");
    await o.context.close();
  }
  check(sixth.includes(copy.pt.rate), `rate limit: 6th message not refused ("${sixth.slice(0, 60)}")`);
  notes.push("protection: honeypot ignores bots (nothing stored); per-IP limit 5 per 10 min refuses the 6th (per server instance; durable limit = launch debt)");
}

psql(`delete from ${q}ContactSubmission${q} where name like 'RT56 TEST%'`);
check(rowCount() === baseline, `cleanup: ContactSubmission count ${rowCount()} != baseline ${baseline}`);
await browser.close();
notes.push(`cleanup: test rows deleted (count back to ${baseline})`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-56 contact + about validation");
