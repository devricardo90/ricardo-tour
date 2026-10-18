/**
 * RT-119 (LOCAL PREPARATION ONLY) — verifies the Rocinha load on a local throw-away database, then exercises the
 * approval fingerprint: approve → public; edit a FAQ → approval invalidated (not public); identical reload keeps the
 * approval; a different reload is refused without --allow-replace-approved.
 * Then exercises the Owner decisions of 17/10/2026: durable invalidation (edit → DRAFT, revert does not restore, only a
 * new approval act does) and media rights separate from approval and publication (revocation hides at once, clearance never
 * publishes automatically), including direct SQL attempts.
 * Expects the trips fixture (scripts/rt-119-trips-fixture.sql) and one `--apply` load already done.
 * Usage: DATABASE_URL=<local rt119_*> RT119_TRIPS_HASH_BEFORE=<file> npx tsx scripts/rt-119-verify-load.ts
 */
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { getTourContent, loadTourContentRecord, validateTourContent } from "@/lib/catalog/tour-content";
import { approveTourContent } from "@/lib/catalog/content-approval";
import { applyLoad, planLoad, rocinhaLoadRecord } from "@/lib/catalog/content-load";
import { Client } from "pg";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt119_") || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt119_* is allowed");
}
assertDatabaseAccess({ operation: "destructive", label: "scripts/rt-119-verify-load.ts" }); // RT-104: deny by default

const ROC = "cmli1a6im000034zqqzc9sppb";
const OTHERS = ["cmlhxkpy9000028zq27rhytew", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"];
let passes = 0;
let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) passes += 1;
  else failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};
async function rejectsSql(sql: string, label: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    check(false, `${label} (statement was accepted)`);
  } catch {
    check(true, label);
  }
}
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
  check(media.every((m) => m.rightsStatus === "UNVERIFIED" && /^PENDING rights verification/.test(m.rightsNote ?? "")) && /mural artwork/.test(media[2]?.rightsNote ?? ""), "media rights kept PENDING (UNVERIFIED + note; mural authorship not verified)");
  const allText = JSON.stringify(await prisma.tripContent.findUnique({ where: { tripId: ROC } })) + JSON.stringify(await prisma.tripFaqItem.findMany({ where: { tripId: ROC } })) + JSON.stringify(media.map((m) => [m.alt, m.credit]));
  check(!/R\$|\b(45000|58000|75000|88000|29000|25000|22000)\b|tarifa do operador|operator fee|remunera|custo interno|margem/i.test(allText), "no provisional price, internal cost or operator fee in the loaded content");
  check(await tripsHash() === fs.readFileSync(process.env.RT119_TRIPS_HASH_BEFORE ?? "", "utf8").trim(), "Trip rows (incl. prices, updatedAt) byte-identical: the loader never touches Trip");
  for (const id of OTHERS) check((await prisma.tripContent.count({ where: { tripId: id } })) === 0 && (await prisma.tripImage.count({ where: { tripId: id } })) === 0, `other tour ${id}: no content written`);

  // 2. Idempotency: an identical reload plans no change.
  const next = rocinhaLoadRecord();
  check(planLoad(await loadTourContentRecord(ROC), next, { tripExists: true }).action === "noop", "identical reload → noop (no write)");

  // 3. Explicit approval act → public (content approval + media authorization for verified rights).
  const status = async () => prisma.tripContent.findUnique({ where: { tripId: ROC }, select: { status: true, approvedAt: true, approvedContentHash: true, approvalInvalidatedAt: true, approvalInvalidationReason: true } });
  const photosPublic = async () => (await getTourContent(ROC, "pt", "public"))?.gallery.length ?? -1;
  const approve = (iso: string) => approveTourContent(prisma, ROC, new Date(iso));
  const a0 = await approve("2026-10-17T11:00:00Z");
  const pub0 = await getTourContent(ROC, "en", "public");
  check(a0.authorizedMedia === 0 && a0.unauthorizedMedia === 6 && pub0?.gallery.length === 0 && pub0.videos.length === 0, "8. real state: media with rights pending is never authorized nor public, even after an approval act");
  const reload = planLoad(await loadTourContentRecord(ROC), next, { tripExists: true });
  check(reload.action === "noop" && reload.approvalKept && (await status())?.status === "OWNER_APPROVED", "12. identical reload on a valid approval → noop, approval kept");
  // Throwaway DB only: SIMULATED documentary rights verification, to exercise the publication rules.
  await prisma.tripImage.updateMany({ where: { tripId: ROC }, data: { rightsStatus: "LICENSED", rightsNote: "SIMULATED verification (throwaway test DB)" } });
  check((await photosPublic()) === 0 && (await status())?.status === "OWNER_APPROVED", "9. rights cleared later → still not public (no automatic publication)");
  const a1 = await approve("2026-10-17T12:00:00Z");
  check(a1.authorizedMedia === 6 && a1.unauthorizedMedia === 0, "approval act authorizes the 6 media items whose rights are verified now");
  check(validateTourContent((await loadTourContentRecord(ROC))!).length === 0, "1. approved record validates (fingerprint matches)");
  const pub = await getTourContent(ROC, "en", "public");
  check(pub?.faq.length === 7 && pub.gallery.length === 5 && pub.videos.length === 1, "1. approved, unedited content is public (EN): 7 FAQs, 5 photos, 1 video");
  await prisma.$executeRawUnsafe(`update "TripContent" set summary = summary, "updatedAt" = now() where "tripId" = '${ROC}'`);
  check((await status())?.status === "OWNER_APPROVED", "rewriting identical values does not invalidate the approval");
  const different = { ...next, summary: { pt: "Outro resumo", en: "Other summary", es: "Otro resumen" } };
  check(planLoad(await loadTourContentRecord(ROC), different, { tripExists: true }).action === "refused", "a different reload over approved content is refused without --allow-replace-approved");

  // 4. Durable invalidation: first edit invalidates; reverting does NOT restore; only a new approval does.
  const faq6 = next.faq![6].answer;
  await prisma.tripFaqItem.update({ where: { tripId_position: { tripId: ROC, position: 6 } }, data: { answer: { pt: "Editado", en: "Edited", es: "Editado" } } });
  const s1 = await status();
  check(s1?.status === "DRAFT" && !s1.approvedAt && !s1.approvedContentHash && Boolean(s1.approvalInvalidatedAt) && /TripFaqItem/.test(s1.approvalInvalidationReason ?? ""), "2/5. FAQ edit → DB sets DRAFT and records when/why (durable)");
  check((await getTourContent(ROC, "en", "public")) === null, "2. edited content is not public");
  await prisma.tripFaqItem.update({ where: { tripId_position: { tripId: ROC, position: 6 } }, data: { answer: faq6 } });
  check((await status())?.status === "DRAFT" && (await getTourContent(ROC, "en", "public")) === null, "3. reverting the edit does NOT restore the approval");
  await approve("2026-10-17T13:00:00Z");
  check((await status())?.status === "OWNER_APPROVED" && !(await status())?.approvalInvalidatedAt && (await photosPublic()) === 5, "4. a new explicit approval restores validity (and clears the invalidation record)");

  // 6. Translation edit (EN summary, direct SQL) invalidates.
  await prisma.$executeRawUnsafe(`update "TripContent" set summary = jsonb_set(summary, '{en}', '"Edited EN"') where "tripId" = '${ROC}'`);
  check((await status())?.status === "DRAFT" && /TripContent/.test((await status())?.approvalInvalidationReason ?? ""), "6. translation edit (direct SQL on TripContent) → DRAFT");
  await prisma.tripContent.update({ where: { tripId: ROC }, data: { summary: next.summary as object } });
  await approve("2026-10-17T14:00:00Z");

  // 7. Gallery change invalidates the approval and the item's authorization.
  const img1 = await prisma.tripImage.findUnique({ where: { tripId_position: { tripId: ROC, position: 1 } } });
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 1 } }, data: { src: "/media/tours/favela-rocinha/rocinha-05-panorama.jpg" } });
  const img1b = await prisma.tripImage.findUnique({ where: { tripId_position: { tripId: ROC, position: 1 } } });
  check((await status())?.status === "DRAFT" && img1b?.publicationApprovedAt === null, "7. gallery change → DRAFT and that item's publication authorization cleared");
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 1 } }, data: { src: img1!.src } });
  await approve("2026-10-17T15:00:00Z");
  check((await photosPublic()) === 5, "re-approved after restoring the photo → 5 photos public");

  // 8–10. Media rights: separate from editorial approval and from publication.
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 4 } }, data: { rightsStatus: "UNVERIFIED" } });
  check((await status())?.status === "OWNER_APPROVED" && (await photosPublic()) === 4, "10. revocation hides the photo immediately; the rest stays published");
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 4 } }, data: { rightsStatus: "LICENSED" } });
  check((await photosPublic()) === 4, "9. clearing the rights again does NOT publish the photo automatically");
  await approve("2026-10-17T16:00:00Z");
  check((await photosPublic()) === 5, "a new explicit approval authorizes the cleared photo");

  // 11. Direct data changes do not bypass the gates.
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 3 } }, data: { rightsStatus: "UNVERIFIED" } });
  await rejectsSql(`update "TripImage" set "publicationApprovedAt" = now() where "tripId" = '${ROC}' and position = 3`, "11a. CHECK: an UNVERIFIED item cannot be given a publication authorization by SQL");
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 3 } }, data: { rightsStatus: "LICENSED" } });
  await prisma.$executeRawUnsafe(`insert into "TripImage" (id, "tripId", position, src, alt, "rightsStatus", "rightsNote", "publicationApprovedAt", "updatedAt") values ('rt119_forged', '${ROC}', 9, '/media/tours/favela-rocinha/rocinha-02-beco.jpg', '{"pt":"x","en":"x","es":"x"}', 'LICENSED', 'forged', now(), now())`);
  const forged = await prisma.tripImage.findUnique({ where: { id: "rt119_forged" } });
  check(forged?.publicationApprovedAt === null && (await status())?.status === "DRAFT", "11b. inserting pre-authorized media: trigger clears the authorization and demotes the content");
  await prisma.tripImage.delete({ where: { id: "rt119_forged" } });
  await prisma.$executeRawUnsafe(`update "TripContent" set status = 'OWNER_APPROVED', "approvedAt" = now() where "tripId" = '${ROC}'`);
  check((await getTourContent(ROC, "pt", "public")) === null, "11c. forcing OWNER_APPROVED by SQL (no fingerprint, no media authorization) is never public");
  await approve("2026-10-17T17:00:00Z");
  await prisma.tripFaqItem.delete({ where: { tripId_position: { tripId: ROC, position: 6 } } });
  check((await status())?.status === "DRAFT" && (await getTourContent(ROC, "pt", "public")) === null, "11d. deleting a FAQ row directly → DRAFT, not public");

  // 12. Reload after the deletion restores the missing FAQ as DRAFT (never re-approves).
  const afterDelete = planLoad(await loadTourContentRecord(ROC), next, { tripExists: true });
  check(afterDelete.action === "update" && afterDelete.changes.includes("faq[6] added"), "reload after a direct deletion plans an update (DRAFT), never an approval");

  // 13. Independent review follow-ups: restore the loaded state, then cover the remaining direct-change paths.
  const restorePlan = planLoad(await loadTourContentRecord(ROC), next, { tripExists: true });
  await applyLoad(prisma, next, restorePlan);
  check(planLoad(await loadTourContentRecord(ROC), next, { tripExists: true }).action === "noop" && (await status())?.status === "DRAFT", "loaded state restored by the loader (DRAFT, rights pending again)");
  const simulateRights = () => prisma.tripImage.updateMany({ where: { tripId: ROC }, data: { rightsStatus: "LICENSED", rightsNote: "SIMULATED verification (throwaway test DB)" } });
  await simulateRights();
  await approve("2026-10-18T09:00:00Z");
  await prisma.$executeRawUnsafe(`update "TripItineraryStop" set "durationMinutes" = coalesce("durationMinutes", 0) + 5 where "tripId" = '${ROC}' and position = 0`);
  check((await status())?.status === "DRAFT" && /TripItineraryStop/.test((await status())?.approvalInvalidationReason ?? ""), "itinerary edit by direct SQL → DRAFT");
  await prisma.$executeRawUnsafe(`update "TripItineraryStop" set "durationMinutes" = nullif("durationMinutes" - 5, 0) where "tripId" = '${ROC}' and position = 0`);
  await approve("2026-10-18T09:05:00Z");
  await prisma.$executeRawUnsafe(`update "TripImage" set position = 99 where "tripId" = '${ROC}' and position = 3`);
  check((await status())?.status === "DRAFT", "media reorder by direct SQL → DRAFT");
  await prisma.$executeRawUnsafe(`update "TripImage" set position = 3 where "tripId" = '${ROC}' and position = 99`);
  await approve("2026-10-18T09:10:00Z");

  // A verified item whose authorization was cleared cannot be re-authorized by a SQL "fix-up" (only the approval act).
  await prisma.tripImage.update({ where: { tripId_position: { tripId: ROC, position: 0 } }, data: { rightsStatus: "OWNER_ATTESTED" } });
  await rejectsSql(`update "TripImage" set "publicationApprovedAt" = (select "approvedAt" from "TripContent" where "tripId" = '${ROC}') where "tripId" = '${ROC}' and position = 0`, "11e. forged authorization on a VERIFIED item (copying approvedAt) rejected by the trigger");
  check((await status())?.status === "OWNER_APPROVED" && (await photosPublic()) === 4, "11e. the item stays hidden until a new approval act; the rest stays published");
  await approve("2026-10-18T09:15:00Z");

  // Public Trip fields belong to what was approved (title/description/highlights/…); prices are not touched here.
  const titleBefore = (await prisma.trip.findUnique({ where: { id: ROC }, select: { title: true } }))!.title;
  await prisma.$executeRawUnsafe(`update "Trip" set title = jsonb_set(title, '{en}', '"Edited title"') where id = '${ROC}'`);
  check((await status())?.status === "DRAFT" && /Trip public field/.test((await status())?.approvalInvalidationReason ?? ""), "Trip title edit (translation) → DRAFT");
  await prisma.trip.update({ where: { id: ROC }, data: { title: titleBefore as object } });
  await approve("2026-10-18T09:20:00Z");

  // Concurrency: an uncommitted edit holds the content lock; the approval act waits and then approves what was committed.
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  await prisma.$executeRawUnsafe(`update "TripContent" set status = 'DRAFT', "approvedAt" = null, "approvedContentHash" = null where "tripId" = '${ROC}'`);
  await pg.query("BEGIN");
  await pg.query(`update "TripFaqItem" set answer = jsonb_set(answer, '{pt}', '"Resposta concorrente"') where "tripId" = $1 and position = 0`, [ROC]);
  let settled = false;
  const racing = approve("2026-10-18T09:25:00Z").finally(() => { settled = true; });
  await new Promise((r) => setTimeout(r, 1500));
  const waited = !settled;
  await pg.query("COMMIT");
  await racing;
  await pg.end();
  const raced = await loadTourContentRecord(ROC);
  check(waited && raced?.faq?.[0].answer.pt === "Resposta concorrente" && validateTourContent(raced!).length === 0 && (await getTourContent(ROC, "pt", "public")) !== null, "concurrency: approval waits for the in-flight edit and its fingerprint covers the committed content");

  // TRUNCATE skips row triggers → statement trigger demotes.
  await prisma.$executeRawUnsafe(`truncate "TripFaqItem"`);
  check((await status())?.status === "DRAFT" && /TripFaqItem truncated/.test((await status())?.approvalInvalidationReason ?? ""), "TRUNCATE of FAQ → DRAFT");

  // Loader replacing approved content (flag) records the invalidation; back to the real state (rights pending).
  const back = planLoad(await loadTourContentRecord(ROC), next, { tripExists: true });
  await applyLoad(prisma, next, back);
  await simulateRights();
  await approve("2026-10-18T09:30:00Z");
  const replacePlan = planLoad(await loadTourContentRecord(ROC), next, { tripExists: true, allowReplaceApproved: true });
  await applyLoad(prisma, next, replacePlan, { allowReplaceApproved: true });
  const replaced = await status();
  check(replaced?.status === "DRAFT" && Boolean(replaced.approvalInvalidatedAt) && Boolean(replaced.approvalInvalidationReason), "loader --allow-replace-approved → DRAFT with the invalidation recorded");
  check((await prisma.tripImage.count({ where: { tripId: ROC, rightsStatus: "UNVERIFIED", publicationApprovedAt: null } })) === 6, "final state = real state: 6 media rights pending, none authorized");
  check((await prisma.tripContent.count()) === 1, "other 3 tours still without content");

  console.log(`\n${passes} passed, ${failures} failed`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
