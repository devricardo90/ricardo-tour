/**
 * RT-55 validation — guest tour conversion (WhatsApp + request form) on /{locale}/tours/[id].
 *
 * Requires a dev server on :3218 started with CONTACT_EMAIL_MODE=log (outbound email is MUTED: the action stores the
 * request and logs a one-line summary instead of sending) and its output in .tmp/dev55.log, plus the local Postgres.
 *
 *   CONTACT_EMAIL_MODE=log npx next dev --webpack -p 3218 > .tmp/dev55.log 2>&1
 *   node scripts/rt-55-guest-conversion-validation.mjs
 *
 * Test submissions are named "RT55 TEST ..." and are deleted at the end (only those rows).
 */
import { chromium } from "@playwright/test";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:3218";
const LOG = path.resolve(".tmp/dev55.log");
const outDir = path.resolve(".tmp/rt-55-evidence");
fs.mkdirSync(outDir, { recursive: true });
const failures = [];
const notes = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); };

const TRIPS = [
  { id: "cmljo0s1u0000t0zqa0bpd23p", title: "Tour Privado Premium Rio de Janeiro" },
  { id: "cmlibniq40000z4zqkbujnutt", title: "Confeitaria Colombo + City Tour Rio" },
  { id: "cmli1a6im000034zqqzc9sppb", title: "Tour Favela Rocinha com Guia Local" },
  { id: "cmlhxkpy9000028zq27rhytew", title: "Cristo Redentor + Pão de Açúcar" },
];
const CRISTO = TRIPS[3];
const WA_BASE = "https://wa.me/5522998461906";
const copy = {
  pt: { heading: "Solicite este passeio", submit: "Enviar solicitação", whatsapp: "Falar pelo WhatsApp", success: "Solicitação recebida", failure: "Não foi possível enviar agora.", rate: "Muitas solicitações em pouco tempo", errName: "Informe seu nome.", errContact: "Informe um e-mail ou um telefone/WhatsApp para retorno.", errDate: "Escolha uma data.", errParty: "Informe de 1 a 20 pessoas.", errPast: "Escolha uma data a partir de hoje.", waStart: "Olá, tenho interesse no passeio", foreign: /(Request this tour|Send request|Message on WhatsApp|Solicita este tour|Enviar solicitud|Escribir por WhatsApp)/ },
  en: { heading: "Request this tour", submit: "Send request", whatsapp: "Message on WhatsApp", success: "Request received", failure: "We couldn't send your request right now.", rate: "Too many requests in a short time", errName: "Enter your name.", errContact: "Enter an email or a phone/WhatsApp so we can reply.", errDate: "Choose a date.", errParty: "Enter between 1 and 20 people.", errPast: "Choose a date from today onward.", waStart: "Hello, I'm interested in the tour", foreign: /(Solicite este passeio|Enviar solicitação|Falar pelo WhatsApp|Solicita este tour|Enviar solicitud|Escribir por WhatsApp)/ },
  es: { heading: "Solicita este tour", submit: "Enviar solicitud", whatsapp: "Escribir por WhatsApp", success: "Solicitud recibida", failure: "No pudimos enviar tu solicitud ahora.", rate: "Demasiadas solicitudes en poco tiempo", errName: "Indica tu nombre.", errContact: "Indica un correo o un teléfono/WhatsApp para responderte.", errDate: "Elige una fecha.", errParty: "Indica entre 1 y 20 personas.", errPast: "Elige una fecha desde hoy en adelante.", waStart: "Hola, me interesa el tour", foreign: /(Solicite este passeio|Enviar solicitação|Falar pelo WhatsApp|Request this tour|Send request|Message on WhatsApp)/ },
};
const confirmationClaims = /(reserva (confirmada|garantida)|vaga garantida|reservation (is )?confirmed|booking (is )?confirmed|spot (is )?(secured|reserved|guaranteed)|reserva confirmada|plaza (garantizada|reservada)|pagamento (recebido|confirmado)|payment (received|confirmed))/i;
const paymentUi = /(pagamento|payment|pago\b|cart[aã]o|credit card|tarjeta|\bpix\b|checkout|stripe)/i;
const accountEntry = /(entrar|login|log in|sign in|criar conta|create account|iniciar sesión|cuenta)/i;
const stale = /(travelrick|\+?55\s?21|96681|97116)/i;
const unsupportedClaims = /(credenciad|accredit|acreditad|experi[eê]ncia segura|experiencia segura|safe experience)/i;

const plusDays = (n) => new Date(Date.now() + n * 86400e3).toISOString().slice(0, 10);
const q = '"';
// SQL goes through stdin, so no shell quoting is involved.
const psql = (sql) => execSync('docker exec -i ricktravel-db psql -U postgres -d ricktravel -tA', { input: sql, encoding: 'utf8' }).trim();
const testRows = () => JSON.parse(psql(`select coalesce(json_agg(t order by t.${q}createdAt${q}), '[]'::json) from (select id, name, email, phone, status, message, ${q}createdAt${q} from ${q}ContactSubmission${q} where name like 'RT55 TEST%') t`) || '[]');
const rowCount = () => Number(psql(`select count(*) from ${q}ContactSubmission${q}`));
const serverLog = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8") : "");
let ipCounter = 0;
const nextIp = () => `10.55.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

const browser = await chromium.launch({ args: ["--disable-gpu", "--enable-unsafe-swiftshader"] });
const baselineRows = rowCount();

async function open(locale, trip, vp, { ip = nextIp(), touch = false } = {}) {
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, hasTouch: touch, isMobile: touch, extraHTTPHeaders: { "x-forwarded-for": ip } });
  // Never leave the app: WhatsApp / mailto targets are intercepted.
  await context.route("https://wa.me/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>wa</title>" }));
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => requests.push({ url: r.url(), method: r.method(), body: r.method() === "POST" ? r.postData() ?? "" : "" }));
  const resp = await page.goto(`${BASE}/${locale}/tours/${trip.id}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForSelector("[data-testid='tour-request-form']", { timeout: 60000 });
  await page.waitForTimeout(500);
  return { context, page, errors, requests, resp };
}
async function fillValid(page, { name, email, phone, date = plusDays(14), party = "3", notes: n = "Prefiro manhã." }) {
  await page.fill("input[name=name]", name);
  if (email) await page.fill("input[name=email]", email);
  if (phone) await page.fill("input[name=phone]", phone);
  await page.fill("input[name=date]", date);
  await page.fill("input[name=party]", party);
  if (n) await page.fill("textarea[name=notes]", n);
}

// ---------- static guarantees ----------
const staticFiles = ["lib/tour-request.ts", "lib/services/tour-request-notification.ts", "app/actions/tour-request.ts", "components/site/tour/tour-request-form.tsx", "components/site/tour/tour-request-copy.ts", "components/site/tour/tour-conversion-slot.tsx", "lib/whatsapp.ts"];
for (const f of staticFiles) {
  const text = fs.readFileSync(f, "utf8");
  check(!stale.test(text.replace(/travelrick\.com|96681|97116|5521971168114|5521966819928/g, (m) => (f === "lib/whatsapp.ts" ? "" : m))), `stale contact value in ${f}`);
}
check(!/5521971168114/.test(fs.readFileSync("lib/whatsapp.ts", "utf8")) && /PUBLIC_CONTACT\.whatsappDigits/.test(fs.readFileSync("lib/whatsapp.ts", "utf8")), "lib/whatsapp.ts does not read the canonical number");
const untouched = execSync("git diff --name-only HEAD -- app/api prisma/schema.prisma prisma/migrations lib/services/booking.service.ts lib/services/email.service.ts app/[locale]/login app/[locale]/register app/[locale]/(public)/reservas", { encoding: "utf8" }).trim();
check(untouched === "", `booking backend / schema / email service / auth routes changed: ${untouched}`);
notes.push("static: no schema change, booking backend + email service + auth routes untouched; lib/whatsapp.ts reads PUBLIC_CONTACT");

// ---------- page-level checks: every approved trip (PT) and every locale/viewport for the Cristo trip ----------
const runs = [];
for (const trip of TRIPS) runs.push({ locale: "pt", trip, vp: { name: "1440x900", w: 1440, h: 900 } });
for (const locale of ["pt", "en", "es"]) for (const vp of [{ name: "1440x900", w: 1440, h: 900 }, { name: "390x844", w: 390, h: 844, touch: true }, { name: "360x800", w: 360, h: 800, touch: true }]) if (!(locale === "pt" && vp.w === 1440)) runs.push({ locale, trip: CRISTO, vp });

for (const { locale, trip, vp } of runs) {
  const tag = `${locale}@${vp.name}/${trip.id.slice(-6)}`;
  const c = copy[locale];
  const { context, page, errors, requests, resp } = await open(locale, trip, vp, { touch: !!vp.touch });
  const d = await page.evaluate(() => {
    const slot = document.querySelector("[data-conversion-slot='rt-55']");
    const form = slot.querySelector("form");
    const rect = (e) => e.getBoundingClientRect();
    const labelsOk = ["name", "email", "phone", "date", "party", "notes"].map((n) => { const i = form.querySelector(`[name='${n}']`); return { n, label: !!i && !!document.querySelector(`label[for='${i.id}']`), type: i?.type }; });
    const links = [...slot.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel"), t: a.textContent.trim() }));
    const interactive = [...slot.querySelectorAll("a, button, input, textarea")].filter((e) => e.getClientRects().length > 0 && e.tabIndex >= 0).map((e) => ({ tag: e.tagName, h: Math.round(rect(e).height), w: Math.round(rect(e).width), n: e.getAttribute("name") || e.textContent.trim().slice(0, 24) }));
    return {
      status: !!slot, heading: slot.querySelector("h2")?.textContent.trim(), text: slot.innerText, labelsOk, links, interactive,
      required: ["name", "date", "party"].map((n) => form.querySelector(`[name='${n}']`)?.getAttribute("aria-required")),
      hasHoneypot: !!form.querySelector("input[name='company_website']"), hpHidden: !!form.querySelector("input[name='company_website']")?.closest("[aria-hidden='true']"),
      position: getComputedStyle(slot.closest("aside")?.firstElementChild ?? slot).position, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pageText: document.body.innerText, mainText: document.querySelector("main").innerText,
      loginLinks: [...document.querySelectorAll("main a")].filter((a) => /login|register|reservas/.test(a.getAttribute("href") || "")).length,
    };
  });
  check(resp.status() === 200, `${tag}: HTTP ${resp.status()}`);
  check(d.heading === c.heading && d.labelsOk.every((l) => l.label), `${tag}: form heading/labels ${JSON.stringify(d.labelsOk.filter((l) => !l.label))} "${d.heading}"`);
  check(d.required.every((v) => v === "true") && d.hasHoneypot && d.hpHidden, `${tag}: required flags/honeypot ${JSON.stringify(d.required)}`);
  check(!c.foreign.test(d.text), `${tag}: mixed-language form "${(d.text.match(c.foreign) || [])[0]}"`);
  check(!paymentUi.test(d.text) && !confirmationClaims.test(d.text) && !accountEntry.test(d.text), `${tag}: payment/confirmation/account wording in the conversion block`);
  check(d.loginLinks === 0 && !requests.some((r) => /\/api\/bookings|\/login|\/register/.test(r.url)), `${tag}: auth/booking path touched`);
  check(!stale.test(d.pageText), `${tag}: stale contact value on the page`);
  check(!unsupportedClaims.test(d.mainText), `${tag}: unsupported claim visible ("${(d.mainText.match(unsupportedClaims) || [])[0]}")`);
  const wa = d.links.find((l) => (l.href || "").startsWith(WA_BASE));
  check(wa && wa.href.startsWith(`${WA_BASE}?text=`) && wa.target === "_blank" && /noopener/.test(wa.rel || ""), `${tag}: WhatsApp link ${JSON.stringify(wa)}`);
  const msg = wa ? decodeURIComponent(wa.href.split("?text=")[1] || "") : "";
  check(msg.startsWith(c.waStart) && msg.includes(trip.title) && !/(confirmad|confirmed|garantid|guarantee|pago|paid|payment)/i.test(msg), `${tag}: WhatsApp message "${msg}"`);
  check(d.links.some((l) => l.href === "mailto:contato@ricardotour.com"), `${tag}: email fallback missing`);
  check(d.overflow <= 0, `${tag}: horizontal overflow ${d.overflow}px`);
  check(d.interactive.every((e) => e.h >= (vp.touch ? 44 : 40) && e.w >= 44), `${tag}: small targets ${JSON.stringify(d.interactive.filter((e) => e.h < 44 || e.w < 44))}`);
  if (vp.touch) check(d.position === "static", `${tag}: conversion block is ${d.position} on a small screen`);
  check(errors.length === 0, `${tag}: errors ${errors.join(" | ")}`);
  if (vp.name !== "1440x900" || trip.id === CRISTO.id) await page.screenshot({ path: path.join(outDir, `form-${locale}-${vp.name}.png`), fullPage: true });
  await context.close();
}
notes.push(`page checks: ${runs.length} loads (all 4 approved trips in PT, Cristo in PT/EN/ES at 1440/390/360)`);

// ---------- behaviour (PT, plus message checks in EN/ES) ----------
{
  // validation: empty submit
  const { context, page } = await open("pt", CRISTO, { w: 1440, h: 900 });
  const c = copy.pt;
  await page.click("button[type=submit]");
  await page.waitForTimeout(300);
  const v = await page.evaluate(() => {
    const form = document.querySelector("[data-testid='tour-request-form']");
    const invalid = [...form.querySelectorAll("[aria-invalid='true']")].map((i) => ({ n: i.name, desc: (i.getAttribute("aria-describedby") || "").split(" ").filter(Boolean).every((id) => !!document.getElementById(id)) }));
    return { invalid, text: form.innerText, focused: document.activeElement?.getAttribute("name"), alert: !!form.querySelector("p[role='alert']"), nSuccess: document.querySelectorAll("[data-testid='tour-request-success']").length };
  });
  check(["name", "date", "party"].every((n) => v.invalid.some((i) => i.n === n)) && v.invalid.some((i) => i.n === "email") && v.invalid.every((i) => i.desc), `validation: invalid fields/aria ${JSON.stringify(v.invalid)}`);
  check(v.text.includes(c.errName) && v.text.includes(c.errContact) && v.text.includes(c.errDate) && v.text.includes(c.errParty) && v.alert && v.nSuccess === 0, "validation: localized errors/alert missing or fake success");
  check(v.focused === "name", `validation: focus moved to "${v.focused}" (expected first invalid field "name")`);
  // past date + bad email/phone + party bounds
  await fillValid(page, { name: "RT55 TEST validation", email: "not-an-email", phone: "12", date: "2020-01-01", party: "0", notes: "" });
  await page.click("button[type=submit]"); await page.waitForTimeout(300);
  const v2 = await page.evaluate(() => document.querySelector("[data-testid='tour-request-form']").innerText);
  check(v2.includes(c.errPast) && v2.includes("Informe um e-mail válido.") && v2.includes("Informe um telefone válido") && v2.includes(c.errParty), "validation: past date / bad email / bad phone / party 0 not all rejected");
  await page.fill("input[name=party]", "21"); await page.click("button[type=submit]");
  check((await page.evaluate(() => document.querySelector("[data-testid='tour-request-form']").innerText)).includes(c.errParty), "validation: party 21 accepted");
  check(rowCount() === baselineRows, "validation: a row was stored for invalid input");
  await context.close();
  notes.push("validation: required fields, contact-method rule, past date, email/phone format, party bounds, aria + focus");
}
for (const locale of ["en", "es"]) {
  const c = copy[locale];
  const { context, page } = await open(locale, CRISTO, { w: 1440, h: 900 });
  await page.click("button[type=submit]"); await page.waitForTimeout(300);
  const t = await page.evaluate(() => document.querySelector("[data-testid='tour-request-form']").innerText);
  check(t.includes(c.errName) && t.includes(c.errContact) && t.includes(c.errDate) && t.includes(c.errParty), `${locale}: localized validation errors missing`);
  await context.close();
}

// WhatsApp message follows the form + analytics click event carries no personal data
{
  const { context, page, requests } = await open("pt", CRISTO, { w: 1440, h: 900 });
  await page.fill("input[name=name]", "RT55 TEST privacy-name");
  await page.fill("input[name=date]", plusDays(20)); await page.fill("input[name=party]", "4");
  const href = await page.getAttribute("[data-testid='tour-whatsapp']", "href");
  const msg = decodeURIComponent(href.split("?text=")[1]);
  check(/para \d{1,2} de [a-zç]+ de \d{4}/.test(msg) && msg.includes("para 4 pessoas"), `whatsapp message does not include the entered date/party: "${msg}"`);
  const popup = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);
  await page.click("[data-testid='tour-whatsapp']");
  const pop = await popup; if (pop) await pop.close();
  await page.waitForTimeout(800);
  const analytics = requests.filter((r) => r.url.includes("/api/analytics") && r.method === "POST").map((r) => r.body);
  const click = analytics.find((b) => b.includes("TOUR_WHATSAPP_CLICKED"));
  check(click && click.includes("RESERVE_CLICKED") && !click.includes("RT55 TEST") && !/@|privacy-name/.test(click), `analytics click event missing or carries personal data: ${click}`);
  await page.fill("input[name=email]", "rt55-analytics@example.com");
  await page.waitForTimeout(500);
  const started = requests.filter((r) => r.url.includes("/api/analytics")).some((r) => r.body.includes("TOUR_REQUEST_STARTED"));
  check(started, "analytics TOUR_REQUEST_STARTED not sent");
  check(!requests.some((r) => r.url.includes("/api/analytics") && /rt55-analytics|RT55 TEST/.test(r.body)), "analytics payload contains form contents");
  await context.close();
  notes.push("whatsapp: message follows the typed date/party; click + started events use RESERVE_CLICKED metadata without personal data");
}

// ---------- keyboard: every control in the form shows a visible focus ring (the native date input included) ----------
{
  const { context, page } = await open("pt", CRISTO, { w: 1440, h: 900 });
  await page.focus("input[name=name]");
  const stops = [];
  for (let i = 0; i < 9; i++) {
    stops.push(await page.evaluate(() => { const e = document.activeElement; const cs = getComputedStyle(e); const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2; const within = e.closest("input, textarea, button, a"); return { name: e.getAttribute("name") || e.textContent.trim().slice(0, 16), ring, visible: ring || (within && getComputedStyle(within).outlineStyle !== "none") }; }));
    await page.keyboard.press("Tab");
  }
  const missing = stops.filter((s) => !s.visible);
  check(missing.length === 0 && stops.some((s) => s.name === "date"), `keyboard: controls without a visible focus ring ${JSON.stringify(missing)}`);
  await context.close();
  notes.push(`keyboard: ${stops.length} stops in the form all show a focus ring (date input included)`);
}

// ---------- successful submissions: every locale (email + phone-only) ----------
const created = [];
for (const [locale, email, phone] of [["pt", "rt55-pt@example.com", "+55 21 91234-5678"], ["en", "rt55-en@example.com", ""], ["es", "", "+55 21 98765-4321"]]) {
  const c = copy[locale];
  const { context, page, requests, errors } = await open(locale, CRISTO, { w: 1440, h: 900 });
  const date = plusDays(15);
  await fillValid(page, { name: `RT55 TEST ${locale}`, email, phone, date, party: "2", notes: "Nota de teste." });
  await page.keyboard.press("Tab"); // focus leaves the last field; submit with Enter from the name field below
  await page.focus("input[name=name]"); await page.keyboard.press("Enter");
  await page.waitForSelector("[data-testid='tour-request-success']", { timeout: 60000 }).catch(() => {});
  const ok = await page.evaluate(() => ({ success: !!document.querySelector("[data-testid='tour-request-success']"), text: document.querySelector("[data-conversion-slot]").innerText, form: !!document.querySelector("[data-testid='tour-request-form']"), role: document.querySelector("[data-testid='tour-request-success']")?.getAttribute("role"), focused: document.activeElement?.getAttribute("data-testid") }));
  check(ok.success && ok.text.includes(c.success) && ok.role === "status" && !ok.form, `${locale}: success state missing ${JSON.stringify({ s: ok.success, f: ok.form })}`);
  check(!confirmationClaims.test(ok.text) && !paymentUi.test(ok.text), `${locale}: success state implies confirmation/payment ("${ok.text.slice(0, 160)}")`);
  check(ok.focused === "tour-request-success", `${locale}: success message not focused for assistive tech`);
  check(!requests.some((r) => /\/api\/bookings|\/login|\/register/.test(r.url)) && page.url().includes(`/${locale}/tours/${CRISTO.id}`), `${locale}: success path touched auth/booking or navigated away`);
  check(errors.length === 0, `${locale}: errors ${errors.join(" | ")}`);
  created.push({ locale, email, phone, date });
  await context.close();
}
await new Promise((r) => setTimeout(r, 1500));
const rows = testRows();
for (const { locale, email, phone, date } of created) {
  const row = rows.find((r) => r.name === `RT55 TEST ${locale}`);
  check(!!row, `${locale}: no ContactSubmission stored`);
  if (!row) continue;
  const m = row.message;
  check(row.status === "PENDING" && row.email === email && (row.phone ?? "") === (phone ? phone : ""), `${locale}: stored contact fields ${JSON.stringify({ e: row.email, p: row.phone, s: row.status })}`);
  check(m.includes(`ID ${CRISTO.id}`) && m.includes(CRISTO.title) && m.includes(`Idioma da página: ${locale}`) && m.includes(`Data preferida: ${date}`) && m.includes("Pessoas: 2") && m.includes(`/${locale}/tours/${CRISTO.id}`) && m.includes("Nota de teste."), `${locale}: tour context missing from stored message:\n${m}`);
  const logLine = serverLog().split("\n").find((l) => l.includes(`submission=${row.id}`));
  check(!!logLine && logLine.includes("email muted") && logLine.includes("to=contato@ricardotour.com") && logLine.includes(email ? "replyTo=set" : "replyTo=none"), `${locale}: muted notification log missing/incorrect for ${row.id}: ${logLine}`);
}
notes.push(`success: stored in ContactSubmission with tour id/title/locale/date/party/page URL; notification recipient contato@ricardotour.com (muted, replyTo ${"set when an email was given"}); no real email sent`);

// ---------- every approved trip can be requested (PT) ----------
for (const trip of TRIPS.slice(0, 3)) {
  const { context, page } = await open("pt", trip, { w: 1440, h: 900 });
  await fillValid(page, { name: `RT55 TEST trip-${trip.id.slice(-6)}`, email: "rt55-trip@example.com" });
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid='tour-request-success']", { timeout: 60000 }).catch(() => {});
  check(await page.$("[data-testid='tour-request-success']"), `trip ${trip.id}: submission did not succeed`);
  await context.close();
}
await new Promise((r) => setTimeout(r, 800));
for (const trip of TRIPS.slice(0, 3)) {
  const row = testRows().find((r) => r.name === `RT55 TEST trip-${trip.id.slice(-6)}`);
  check(row && row.message.includes(`ID ${trip.id}`) && row.message.includes(trip.title), `trip ${trip.id}: stored message lacks the correct tour context`);
}

// ---------- failure: server action unreachable -> calm error, values kept, no fake success, fallbacks present ----------
{
  const { context, page } = await open("pt", CRISTO, { w: 1440, h: 900 });
  const before = testRows().length;
  await page.route((url) => url.pathname.includes("/tours/"), (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await fillValid(page, { name: "RT55 TEST failure", email: "rt55-fail@example.com" });
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid='tour-request-failure']", { timeout: 30000 }).catch(() => {});
  const f = await page.evaluate(() => ({ failure: document.querySelector("[data-testid='tour-request-failure']")?.innerText ?? "", role: document.querySelector("[data-testid='tour-request-failure']")?.getAttribute("role"), success: !!document.querySelector("[data-testid='tour-request-success']"), name: document.querySelector("input[name=name]")?.value, party: document.querySelector("input[name=party]")?.value, wa: !!document.querySelector("[data-testid='tour-whatsapp']"), mail: !!document.querySelector("[data-conversion-slot] a[href='mailto:contato@ricardotour.com']") }));
  check(f.failure.includes(copy.pt.failure) && f.role === "alert" && !f.success, `failure: not shown or fake success ${JSON.stringify({ role: f.role, s: f.success })}`);
  check(f.name === "RT55 TEST failure" && f.party === "3" && f.wa && f.mail, `failure: values not preserved or fallbacks missing ${JSON.stringify(f)}`);
  await new Promise((r) => setTimeout(r, 500));
  check(testRows().length === before && !testRows().some((r) => r.name === "RT55 TEST failure"), "failure: a request was stored although submission failed");
  await context.close();
  notes.push("failure: aborted submission shows a calm alert, keeps values, keeps WhatsApp/email fallbacks, never shows success");
}

// ---------- honeypot ----------
{
  const { context, page } = await open("pt", CRISTO, { w: 1440, h: 900 });
  await fillValid(page, { name: "RT55 TEST honeypot", email: "rt55-bot@example.com" });
  await page.evaluate(() => { const i = document.querySelector("input[name='company_website']"); i.value = "http://spam.example"; });
  await page.click("button[type=submit]");
  await page.waitForSelector("[data-testid='tour-request-success']", { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 500));
  check(!testRows().some((r) => r.name === "RT55 TEST honeypot"), "honeypot: a bot submission was stored");
  await context.close();
  notes.push("honeypot: filled hidden field is silently ignored (nothing stored)");
}

// ---------- best-effort rate limit (per IP): the 6th request in the window is refused ----------
{
  const ip = nextIp();
  let sixth = "";
  for (let i = 1; i <= 6; i++) {
    const { context, page } = await open("pt", CRISTO, { w: 1440, h: 900 }, { ip });
    await fillValid(page, { name: `RT55 TEST rate-${i}`, email: "rt55-rate@example.com" });
    await page.click("button[type=submit]");
    await page.waitForSelector("[data-testid='tour-request-success'], [data-testid='tour-request-failure']", { timeout: 30000 }).catch(() => {});
    if (i === 6) sixth = await page.evaluate(() => document.querySelector("[data-testid='tour-request-failure']")?.innerText ?? "");
    await context.close();
  }
  check(sixth.includes(copy.pt.rate), `rate limit: 6th request from one IP was not refused ("${sixth.slice(0, 80)}")`);
  notes.push("rate limit: 5 requests per IP per 10 minutes (per server instance), 6th refused with a calm message");
}

// ---------- content cleanup holds on every public tour page in every locale ----------
{
  const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": nextIp() } });
  for (const locale of ["pt", "en", "es"]) for (const trip of TRIPS) {
    const r = await ctx.request.get(`${BASE}/${locale}/tours/${trip.id}`, { timeout: 120000 });
    const html = await r.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
    check(r.status() === 200 && !unsupportedClaims.test(text), `${locale}/${trip.id.slice(-6)}: unsupported claim in the page ("${(text.match(unsupportedClaims) || [])[0]}")`);
  }
  await ctx.close();
  notes.push("content: no 'credenciado' / 'experiência segura' on any approved tour page in PT/EN/ES");
}

// ---------- cleanup: only the rows this run created ----------
psql(`delete from ${q}ContactSubmission${q} where name like 'RT55 TEST%'`);
check(rowCount() === baselineRows, `cleanup: ContactSubmission count ${rowCount()} != baseline ${baselineRows}`);
await browser.close();
notes.push(`cleanup: test rows deleted (ContactSubmission count back to ${baselineRows})`);
console.log(notes.join("\n"));
if (failures.length) { console.error("\nFAILURES:\n" + failures.join("\n")); process.exitCode = 1; }
else console.log("\nPASS RT-55 guest conversion validation");
