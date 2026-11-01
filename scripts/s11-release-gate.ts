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
 * Exit code 0 = GO for these checks; 1 = NO-GO (every failure is listed). The gate does not replace the Owner's visual
 * check of the design; it blocks the release when any automatic condition fails.
 */
import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { buildPublicOffer } from "@/lib/catalog/public-tour-presentation";
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

/** Old offer markers: legacy product names, old prices and old media (production audit 30/10 and 01/11/2026). */
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
const OLD_PRICE = /R\$\s*\d/;

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
      const offer = source ? buildPublicOffer(source, l, view, { pricePublicationAuthorized: false }) : null;
      if (!offer) {
        const titleStatus = source?.titleStatusByLocale?.[l] ?? source?.titleStatus;
        const pitchStatus = (source as { pitchStatusByLocale?: Record<string, string>; pitchStatus?: string } | undefined)?.pitchStatusByLocale?.[l] ?? (source as { pitchStatus?: string } | undefined)?.pitchStatus;
        fail(`${label} ${l}: approved design refused (title ${titleStatus ?? "?"}, pitch ${pitchStatus ?? "?"}) -> neutral state would be shown`);
        continue;
      }
      for (const p of MUST_NAME[id]?.patterns ?? []) if (!p.test(offer.title)) fail(`${label} ${l}: title "${offer.title}" does not name ${p}`);
      const text = JSON.stringify({ offer, view });
      if (OLD_PRICE.test(text)) fail(`${label} ${l}: a price in R$ is shown while price publication is not authorized`);
      for (const m of LEGACY_MARKERS) if (text.includes(m)) fail(`${label} ${l}: old offer marker "${m}"`);
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

function noOldOffer(where: string, html: string) {
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, (s) => (s.includes("application/ld+json") ? s : ""));
  if (OLD_PRICE.test(visible)) fail(`${where}: old/unauthorized price in R$`);
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
      noOldOffer(label, body);
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
      noOldOffer(page, body);
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
