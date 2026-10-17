/**
 * RT-119 (LOCAL PREPARATION ONLY) — verifies the Rocinha load on a local throw-away database, then exercises the
 * approval fingerprint: approve → public; edit a FAQ → approval invalidated (not public); identical reload keeps the
 * approval; a different reload is refused without --allow-replace-approved.
 * Expects the trips fixture (scripts/rt-119-trips-fixture.sql) and one `--apply` load already done.
 * Usage: DATABASE_URL=<local rt119_*> RT119_TRIPS_HASH_BEFORE=<file> npx tsx scripts/rt-119-verify-load.ts
 */
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { approvalFor, getTourContent, loadTourContentRecord, validateTourContent } from "@/lib/catalog/tour-content";
import { planLoad, rocinhaLoadRecord } from "@/lib/catalog/content-load";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt119_") || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt119_* is allowed");
}

const ROC = "cmli1a6im000034zqqzc9sppb";
const OTHERS = ["cmlhxkpy9000028zq27rhytew", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];
let passes = 0;
let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) passes += 1;
  else failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};
const tripsHash = async () =>
  (await prisma.$queryRawUnsafe<Array<{ h: string }>>(`select md5(string_agg(concat_ws('|', id, city, "priceCents", "imageUrl", title::text, coalesce(description::text,'∅'), highlights::text, "isPublished", "childrenAllowed", "durationDays", "physicalLevel", coalesce("maxGuests"::text,'∅'), "operationType", coalesce("partnerId",'∅'), "updatedAt"), '#' order by id)) as h from "Trip"`))[0].h;

async function main() {
  // 1. Loaded content (after the first --apply).
  check((await prisma.tripContent.count()) === 1 && (await prisma.tripContent.count({ where: { tripId: ROC } })) === 1, "exactly one content record, for the Rocinha only");
  const stored = await loadTourContentRecord(ROC);
  check(stored?.status === "DRAFT" && !stored.approvedAt && !stored.approvedContentHash, "loaded as DRAFT with no approval (loading is not approval)");
  check((await getTourContent(ROC, "pt", "public")) === null, "DRAFT Rocinha content is not public");
  for (const l of ["pt", "en", "es"] as const) {
    const v = await getTourContent(ROC, l, "preview");
    check(Boolean(v) && v!.missingLocale.length === 0 && v!.faq.length === 7 && v!.itinerary.length === 8, `${l}: complete translation, 7 FAQs, 8 itinerary stops`);
  }
  const pt = await getTourContent(ROC, "pt", "preview");
  check(pt?.itinerary.map((s) => s.position).join(",") === "0,1,2,3,4,5,6,7" && pt?.itinerary[2].title === "Subida de mototáxi" && pt?.itinerary[6].title === "Descida de mototáxi", "itinerary order preserved (motorcycle taxi up = step 3, down = step 7)");
  check(pt?.inclusions.length === 6 && pt.inclusions.includes("Mototáxi de subida e descida") && pt.exclusions.length === 7, "inclusions (6, motorcycle taxi both ways) and exclusions (7)");
  check(/não têm data garantida/.test(pt?.optionalServicesNote ?? "") && /Nenhuma compra ou atividade opcional é obrigatória/.test(pt?.optionalServicesNote ?? ""), "optional services stated as not guaranteed and not mandatory");
  const media = await prisma.tripImage.findMany({ where: { tripId: ROC }, orderBy: { position: "asc" } });
  check(media.length === 6 && media.filter((m) => m.mediaType === "IMAGE").length === 5 && media[0].isCover && media[5].mediaType === "VIDEO" && media[5].posterSrc?.endsWith("rocinha-praca-movimento-poster.jpg") === true && media[5].mobileSrc?.endsWith("-mobile.mp4") === true, "media: 5 photos (cover first) + 1 video with poster and mobile rendition");
  check(media.every((m) => m.rightsStatus === "OWNER_ATTESTED" && /Owner, 17\/10\/2026/.test(m.rightsNote ?? "")), "media rights recorded (OWNER_ATTESTED with the Owner's declaration)");
  const allText = JSON.stringify(await prisma.tripContent.findUnique({ where: { tripId: ROC } })) + JSON.stringify(await prisma.tripFaqItem.findMany({ where: { tripId: ROC } })) + JSON.stringify(media.map((m) => [m.alt, m.credit]));
  check(!/R\$|\b(45000|58000|75000|88000|29000|25000|22000)\b|tarifa do operador|operator fee|remunera|custo interno|margem/i.test(allText), "no provisional price, internal cost or operator fee in the loaded content");
  check(await tripsHash() === fs.readFileSync(process.env.RT119_TRIPS_HASH_BEFORE ?? "", "utf8").trim(), "Trip rows (incl. prices, updatedAt) byte-identical: the loader never touches Trip");
  for (const id of OTHERS) check((await prisma.tripContent.count({ where: { tripId: id } })) === 0 && (await prisma.tripImage.count({ where: { tripId: id } })) === 0, `other tour ${id}: no content written`);

  // 2. Idempotency: an identical reload plans no change.
  const next = rocinhaLoadRecord();
  check(planLoad(await loadTourContentRecord(ROC), next, { tripExists: true }).action === "noop", "identical reload → noop (no write)");

  // 3. Approval fingerprint: approve (explicit Owner act, simulated here) → public.
  const record = await loadTourContentRecord(ROC);
  await prisma.tripContent.update({ where: { tripId: ROC }, data: approvalFor(record!, new Date("2026-10-17T12:00:00Z")) });
  const approved = await loadTourContentRecord(ROC);
  check(validateTourContent(approved!).length === 0, "approved record validates (fingerprint matches)");
  const pub = await getTourContent(ROC, "en", "public");
  check(pub?.faq.length === 7 && pub.gallery.length === 5 && pub.videos.length === 1, "approved → public (EN): 7 FAQs, 5 photos, 1 video");
  check(planLoad(approved, next, { tripExists: true }).action === "noop" && planLoad(approved, next, { tripExists: true }).approvalKept, "identical reload on approved content → noop, approval kept");

  // 4. Edit after approval → approval invalidated, not public.
  await prisma.tripFaqItem.update({ where: { tripId_position: { tripId: ROC, position: 6 } }, data: { answer: { pt: "Editado", en: "Edited", es: "Editado" } } });
  check((await getTourContent(ROC, "en", "public")) === null, "FAQ edited after approval → not public (fingerprint mismatch)");
  check(validateTourContent((await loadTourContentRecord(ROC))!).some((i) => i.field === "approvedContentHash"), "validation reports: approval does not match the current content — new review required");
  const edited = await loadTourContentRecord(ROC);
  check(planLoad(edited, next, { tripExists: true }).action === "refused", "reload over approved-but-edited content refused without --allow-replace-approved");
  const forced = planLoad(edited, next, { tripExists: true, allowReplaceApproved: true });
  check(forced.action === "update" && forced.reasons.some((r) => /approval invalidated/.test(r)), "with --allow-replace-approved: update planned and approval explicitly invalidated");

  // 5. Media rights: an UNVERIFIED item is hidden even when the content is approved.
  await prisma.tripFaqItem.update({ where: { tripId_position: { tripId: ROC, position: 6 } }, data: { answer: next.faq![6].answer } });
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 4 } }, data: { rightsStatus: "UNVERIFIED" } });
  const pub2 = await getTourContent(ROC, "pt", "public");
  check(pub2 !== null && pub2.gallery.length === 4, "restored FAQ → public again; a photo set to UNVERIFIED is hidden by the rights gate");

  console.log(`\n${passes} passed, ${failures} failed`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
