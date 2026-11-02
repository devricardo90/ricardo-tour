/**
 * RT-S11 release gate B (Owner 01/11/2026) — MANDATORY before any catalog release. Read-only: never writes anything.
 *
 *   npx tsx scripts/s11-release-gate.ts code
 *     No database. Takes the approved content records of the three launch tours, simulates the Owner's approval act in
 *     memory and runs the same public gates as the tour page, per locale. Answers: "if this content is loaded and
 *     approved, does each tour render the approved design in PT/EN/ES?"
 *
 *   npx tsx scripts/s11-release-gate.ts http <baseUrl>
 *     GET requests only, against a running site: a local server or the Vercel Preview of the release candidate BEFORE
 *     promotion. Checks what visitors would actually see.
 *
 * Prices (Owner 01/11/2026): public display of the approved group fares is authorized. The gate no longer requires the
 * absence of prices; it requires the right ones: every group total per size and duration equal to the Owner's table
 * below (typed from the decision, not read from the code it checks), no other amount than the approved ones, no legacy
 * Trip.priceCents, no JSON-LD Offer, no payment method named and no public booking form while the legal documents are
 * unpublished (prices do not open bookings or payments). Video (Owner 01/11/2026): the Pão de Açúcar clip must be on
 * the TOUR-01 page.
 *
 * Exit code 0 = GO for these checks; 1 = NO-GO (every failure is listed). The gate does not replace the Owner's visual
 * check of the design; it blocks the release when any automatic condition fails.
 */
import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { buildPublicOffer, PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS } from "@/lib/catalog/public-tour-presentation";
import { PAYMENT_METHOD_TEXT } from "@/lib/catalog/payment-text";
import { approveRecord, isMockRecord, toTourContentView, type TourContentRecord } from "@/lib/catalog/tour-content";
import { launchLoadRecord } from "@/lib/catalog/content-load";

const LOCALES = ["pt", "en", "es"] as const;
const TOUR_04 = "cmljo0s1u0000t0zqa0bpd23p";

/** What each launch tour must be about (Owner 31/10/2026), checked on the approved title in every locale. */
const MUST_NAME: Record<string, { label: string; patterns: RegExp[] }> = {
  cmlhxkpy9000028zq27rhytew: { label: "TOUR-01", patterns: [/Cristo|Christ/i, /Selar[oó]n/i, /P[ãa]o de A[çc][úu]car|Sugarloaf|Pan de Az[úu]car/i] },
  cmli1a6im000034zqqzc9sppb: { label: "TOUR-02", patterns: [/Rocinha/i] },
  cmlibniq40000z4zqkbujnutt: { label: "TOUR-03", patterns: [/Centro|Center/i, /Hist[óo]ric/i] },
};

/**
 * Owner 01/11/2026, verbatim: group totals for 1, 2, 3 and 4 people (approved 28/10/2026), in cents. Totals per private
 * group, never per person × N. TOUR-03 has two durations (4 h, 6 h), in this order.
 */
const OWNER_GROUP_TOTALS: Record<string, number[][]> = {
  cmlhxkpy9000028zq27rhytew: [[120000, 170000, 220000, 260000]],
  cmli1a6im000034zqqzc9sppb: [[45000, 58000, 69000, 78000]],
  cmlibniq40000z4zqkbujnutt: [
    [65000, 76000, 90000, 104000],
    [89000, 100000, 114000, 128000],
  ],
};
/** Legacy Trip.priceCents of production (audit 30/10/2026) that no approved text uses: R$ 385 (TOUR-01), R$ 245 (TOUR-03). */
const LEGACY_ONLY_AMOUNTS = [38500, 24500];
const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_01_VIDEO = "/media/tours/cristo-pao-selaron/pao-bondinho-41-58.mp4";
const LAB_NOTICE = /prévia local|local preview|vista previa local|laboratório local|local review lab|laboratorio local/i;
/** Visible words only (tags removed), for the payment-method check on whole pages. */
const words = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");

/** Every "R$" amount of a text, in cents ("R$ 1.040,00", "R$ 2,600", "R$ 650/pessoa", "R$ 733,33"). */
function amounts(text: string): number[] {
  return [...text.matchAll(/R\$\s*(\d{1,3}(?:[.,]\d{3})*)(?:,(\d{2}))?(?!\d)/g)].map((m) => Number(m[1].replace(/[.,]/g, "")) * 100 + Number(m[2] ?? 0));
}

/** Amounts a tour's public page may show: its approved table (totals, per person, extra hour) and its approved price texts. */
function allowedAmounts(id: string): Set<number> {
  const source = PROTOTYPE_OFFER[id];
  const allowed = new Set<number>();
  for (const d of source?.approvedPricing?.durations ?? []) for (const row of d.prices) allowed.add(row.totalCents).add(row.perPersonCents);
  if (source?.approvedPricing?.additionalHourPerGroupCents) allowed.add(source.approvedPricing.additionalHourPerGroupCents);
  for (const a of amounts(JSON.stringify({ s: source?.priceSummary, c: source?.priceCondition, m: source?.mobilePriceLines, n: source?.pricingNote }))) allowed.add(a);
  return allowed;
}

/** The approved compact fare line of a card (e.g. "R$ 650/pessoa"). */
const cardFare = (id: string, l: (typeof LOCALES)[number]) => PROTOTYPE_OFFER[id]?.mobilePriceLines?.value[l] ?? "";

function checkTotals(where: string, id: string, totals: number[][]) {
  const expected = OWNER_GROUP_TOTALS[id];
  if (JSON.stringify(totals) !== JSON.stringify(expected)) fail(`${where}: group totals ${JSON.stringify(totals)} differ from the Owner's table ${JSON.stringify(expected)}`);
}

/** Old offer markers: legacy product names, old price label and old media (production audit 30/10 and 01/11/2026). */
const LEGACY_MARKERS = [
  "Confeitaria Colombo",
  "City Tour Rio",
  "Cristo Redentor + Pão de Açúcar",
  "Tour Favela Rocinha com Guia Local",
  "Preço por pessoa",
  "Morro da Urca",
  "Tour Praias",
  "Búzios",
  "/images/trips/",
  "/videos/",
  "/avatars/",
  "testimonial",
];

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

/** The same record the release load writes (scripts/rt-119-load-content.ts), or null when it cannot be built. */
function contentRecord(id: string): TourContentRecord | null {
  try {
    return launchLoadRecord(id);
  } catch {
    return null;
  }
}

function codeGate() {
  for (const id of LAUNCH_TRIP_IDS) {
    const label = MUST_NAME[id]?.label ?? id;
    const record = contentRecord(id);
    if (!record || isMockRecord(record)) {
      fail(`${label}: no real content record (mock or missing)`);
      continue;
    }
    let approved: TourContentRecord;
    try {
      approved = approveRecord(record);
    } catch (error) {
      fail(`${label}: content cannot be approved: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const source = PROTOTYPE_OFFER[id];
    for (const l of LOCALES) {
      const view = toTourContentView(approved, l, "public");
      if (!view) {
        fail(`${label} ${l}: public content view refused`);
        continue;
      }
      if (view.gallery.length === 0) fail(`${label} ${l}: no publishable photo`);
      for (const m of [...view.gallery, ...view.videos]) if (m.rightsStatus === "UNVERIFIED") fail(`${label} ${l}: media without verified rights ${m.src}`);
      const offer = source ? buildPublicOffer(source, l, view, { pricePublicationAuthorized: PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(id), paymentMethodsPublic: false }) : null;
      if (!offer) {
        const titleStatus = source?.titleStatusByLocale?.[l] ?? source?.titleStatus;
        const pitchStatus = (source as { pitchStatusByLocale?: Record<string, string>; pitchStatus?: string } | undefined)?.pitchStatusByLocale?.[l] ?? (source as { pitchStatus?: string } | undefined)?.pitchStatus;
        fail(`${label} ${l}: approved design refused (title ${titleStatus ?? "?"}, pitch ${pitchStatus ?? "?"}) -> neutral state would be shown`);
        continue;
      }
      for (const p of MUST_NAME[id]?.patterns ?? []) if (!p.test(offer.title)) fail(`${label} ${l}: title "${offer.title}" does not name ${p}`);
      const text = JSON.stringify({ offer, view });
      for (const m of LEGACY_MARKERS) if (text.includes(m)) fail(`${label} ${l}: old offer marker "${m}"`);
      // Prices: authorized, public, exactly the Owner's totals, only approved amounts, no payment method.
      if (!PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.has(id) || !offer.approvedPricingPublic || !offer.approvedPricing) fail(`${label} ${l}: approved price table not public`);
      else checkTotals(`${label} ${l}`, id, offer.approvedPricing.durations.map((d) => d.prices.map((row) => row.totalCents)));
      const allowed = allowedAmounts(id);
      for (const a of amounts(text)) if (!allowed.has(a)) fail(`${label} ${l}: amount ${a / 100} is not an approved price of this tour`);
      // What the page renders: the offer texts (not the internal table fields) and the FAQ after the page's own filter.
      const shown = { ...offer, approvedPricing: undefined };
      const shownFaq = view.faq.filter((item) => !PAYMENT_METHOD_TEXT.test(item.answer));
      const named = JSON.stringify({ shown, faq: shownFaq }).match(PAYMENT_METHOD_TEXT);
      if (named) fail(`${label} ${l}: payment method named ("${named[0]}") while paid bookings are closed`);
      if (id === TOUR_01 && offer.video?.src !== TOUR_01_VIDEO) fail(`${label} ${l}: Pão de Açúcar video not published`);
      console.log(`ok   ${label} ${l}: ${offer.title}`);
    }
  }
}

async function get(base: string, path: string) {
  const res = await fetch(new URL(path, base), { redirect: "manual", headers: { "user-agent": "rt-s11-release-gate" } });
  return { status: res.status, body: res.status < 400 || res.status === 404 ? await res.text() : "" };
}

const tourIds = (html: string) => new Set([...html.matchAll(/\/tours\/(c[a-z0-9]{20,})/g)].map((m) => m[1]));
const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));
const assets = (html: string) => [...html.matchAll(/(?:src|href|poster|srcSet|srcset)="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => decodeURIComponent(s.trim().split(" ")[0])));

/** Visible text plus JSON-LD (other scripts dropped), with non-breaking spaces normalized. */
const visibleText = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, (s) => (s.includes("application/ld+json") ? s : "")).replace(/&nbsp;|&#160;|\u00a0|\u202f/g, " ");

function noOldOffer(where: string, html: string, allowed: Set<number>) {
  const visible = visibleText(html);
  for (const a of amounts(visible)) {
    if (LEGACY_ONLY_AMOUNTS.includes(a)) fail(`${where}: legacy Trip price R$ ${a / 100}`);
    else if (!allowed.has(a)) fail(`${where}: amount R$ ${a / 100} is not an approved price here`);
  }
  for (const ld of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) if (/"offers"|"price"/.test(ld[1])) fail(`${where}: JSON-LD carries an Offer price`);
  if (LAB_NOTICE.test(visible)) fail(`${where}: review-lab notice visible`);
  if (/data-status="(CONFIRMED|PROVISIONAL|PENDING|MOCK)"/.test(html)) fail(`${where}: review status badge visible`);
  const payment = words(html).match(PAYMENT_METHOD_TEXT);
  if (payment) fail(`${where}: payment method named ("${payment[0]}") while paid bookings are closed`);
  for (const m of LEGACY_MARKERS) if (visible.includes(m)) fail(`${where}: old offer marker "${m}"`);
  for (const a of assets(html)) if (/\/images\/trips\/|\/videos\/|\/avatars\/|testimonial/i.test(a)) fail(`${where}: old media ${a}`);
}

async function httpGate(base: string) {
  const launch = new Set<string>(LAUNCH_TRIP_IDS);
  for (const l of LOCALES) {
    for (const id of LAUNCH_TRIP_IDS) {
      const label = `${MUST_NAME[id]?.label ?? id} ${l}`;
      const { status, body } = await get(base, `/${l}/tours/${id}`);
      if (status !== 200) {
        fail(`${label}: HTTP ${status}`);
        continue;
      }
      if (body.includes('data-testid="tour-unavailable"')) fail(`${label}: neutral state shown (approved content missing or not valid)`);
      if (!body.includes('data-testid="tour-page-surface"')) fail(`${label}: approved design not rendered`);
      if (body.includes('data-testid="mock-banner"')) fail(`${label}: mock banner visible`);
      const title = PROTOTYPE_OFFER[id]?.titleByLocale?.[l] ?? PROTOTYPE_OFFER[id]?.title;
      if (title && !body.includes(title)) fail(`${label}: approved title "${title}" not found`);
      noOldOffer(label, body, allowedAmounts(id));
      // Prices: the approved table with exactly the Owner's totals; no payment method; no booking form (bookings closed).
      const pricing = visibleText(body).match(/data-testid="tour-pricing-section"[\s\S]*?<\/section>/)?.[0];
      if (!pricing) fail(`${label}: approved price table not shown`);
      else {
        const totals = [...pricing.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].map((t) => [...t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) => amounts([...row[1].matchAll(/<td[^>]*>([^<]+)<\/td>/g)].at(-1)?.[1] ?? "")[0] ?? 0));
        checkTotals(label, id, totals);
        if (PAYMENT_METHOD_TEXT.test(pricing.replace(/<[^>]+>/g, " "))) fail(`${label}: payment method named while bookings are closed`);
      }
      const summary = PROTOTYPE_OFFER[id]?.priceSummary?.[l];
      if (summary && !visibleText(body).includes(summary)) fail(`${label}: approved price summary "${summary}" not found`);
      if (body.includes('data-testid="booking-request-form"')) fail(`${label}: public booking form shown while the legal documents are unpublished`);
      if (id === TOUR_01 && !(body.includes('data-testid="tour-video"') && body.includes(TOUR_01_VIDEO))) fail(`${label}: Pão de Açúcar video not on the page`);
      if (!body.includes('data-testid="tour-unavailable"') && body.includes('data-testid="tour-page-surface"')) console.log(`ok   ${label}`);
    }
    const t4 = await get(base, `/${l}/tours/${TOUR_04}`);
    if (t4.status !== 404) fail(`TOUR-04 ${l}: expected 404, got ${t4.status}`);
    for (const page of [`/${l}`, `/${l}/tours`]) {
      const { status, body } = await get(base, page);
      if (status !== 200) {
        fail(`${page}: HTTP ${status}`);
        continue;
      }
      const ids = tourIds(body);
      if (!sameSet(ids, launch)) fail(`${page}: tours linked ${JSON.stringify([...ids])}, expected exactly the three launch tours`);
      // Cards: each launch tour shows its approved fare line; no other amount.
      const cardAllowed = new Set<number>(LAUNCH_TRIP_IDS.flatMap((id) => amounts(cardFare(id, l))));
      noOldOffer(page, body, cardAllowed);
      for (const id of LAUNCH_TRIP_IDS) if (!visibleText(body).includes(cardFare(id, l))) fail(`${page}: approved fare "${cardFare(id, l)}" of ${MUST_NAME[id]?.label ?? id} not shown`);
      // The card fare is the per-person price of a group of 4: × 4 must equal the Owner's 4-person total (first duration).
      for (const id of LAUNCH_TRIP_IDS) {
        const [fare] = amounts(cardFare(id, l));
        if (fare === undefined || fare * 4 !== OWNER_GROUP_TOTALS[id]?.[0]?.[3]) fail(`${page}: card fare of ${MUST_NAME[id]?.label ?? id} (${(fare ?? 0) / 100}) × 4 differs from the Owner's 4-person total`);
      }
    }
  }
  const sitemap = await get(base, "/sitemap.xml");
  if (sitemap.status !== 200) fail(`/sitemap.xml: HTTP ${sitemap.status}`);
  else if (!sameSet(tourIds(sitemap.body), launch)) fail(`/sitemap.xml: tours ${JSON.stringify([...tourIds(sitemap.body)])}, expected exactly the three launch tours`);
}

async function main() {
  const [mode, base] = process.argv.slice(2);
  if (mode === "code") codeGate();
  else if (mode === "http" && base) await httpGate(base);
  else {
    console.error("usage: npx tsx scripts/s11-release-gate.ts code | http <baseUrl>");
    process.exit(2);
  }
  if (failures.length) {
    console.log(`\nNO-GO: ${failures.length} failure(s)`);
    for (const f of failures) console.log(`FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nGO: every automatic check passed (the Owner's visual check of the design is still required).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
