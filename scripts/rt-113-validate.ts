/**
 * RT-113 (RT-RB-S10-03): validation of the additive tour-content migration and of the publication gate, against a
 * LOCAL THROW-AWAY database only. Refuses any DATABASE_URL that is not localhost:5433/rt113_* (never the hosted DB).
 * Usage: DATABASE_URL=postgresql://…@localhost:5433/rt113_check npx tsx scripts/rt-113-validate.ts
 */
import { prisma } from "@/lib/prisma";
import { getTourContent } from "@/lib/catalog/tour-content";
import { MOCK_TOUR_CONTENT } from "@/lib/catalog/mock/tour-content.mock";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt113_") || /neon/i.test(url.href)) {
  throw new Error("Refusing to run: DATABASE_URL must be a local throw-away database localhost:5433/rt113_*");
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};
async function rejects(sql: string, label: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
    check(false, `${label} (statement was accepted)`);
  } catch {
    check(true, label);
  }
}

const TRIP = "cmlhxkpy9000028zq27rhytew";
const LEGACY_HASH = process.env.RT113_LEGACY_TRIP_HASH;

async function main() {
  // 1. Legacy data untouched (hash of the pre-existing Trip columns, computed on the source DB before migrating).
  const [{ hash }] = await prisma.$queryRawUnsafe<Array<{ hash: string }>>(
    `select md5(string_agg(concat_ws('|', id, city, "priceCents", "imageUrl", title::text, description::text, highlights::text, "isPublished", "childrenAllowed", "durationDays", "physicalLevel", "maxGuests"), '#' order by id)) as hash from "Trip"`,
  );
  check(Boolean(LEGACY_HASH) && hash === LEGACY_HASH, `pre-existing Trip columns byte-identical after migration (${hash})`);
  check((await prisma.tripContent.count()) === 0 && (await prisma.tripImage.count()) === 0 && (await prisma.tripItineraryStop.count()) === 0, "new tables start empty");

  // 2. Database rules.
  await rejects(`insert into "TripContent"("tripId","status","updatedAt") values ('${TRIP}','OWNER_APPROVED',now())`, "OWNER_APPROVED without approvedAt is rejected");
  await rejects(`insert into "TripContent"("tripId","status","approvedAt","updatedAt") values ('${TRIP}','DRAFT',now(),now())`, "DRAFT with approvedAt is rejected");
  await rejects(`insert into "TripItineraryStop"("id","tripId","position","title","updatedAt") values ('x1','${TRIP}',-1,'{}',now())`, "negative itinerary position is rejected");
  await rejects(`insert into "TripItineraryStop"("id","tripId","position","title","durationMinutes","updatedAt") values ('x2','${TRIP}',0,'{}',0,now())`, "zero duration is rejected");
  await rejects(`insert into "TripImage"("id","tripId","position","src","alt","updatedAt") values ('x3','${TRIP}',0,'  ','{}',now())`, "blank image src is rejected");
  await rejects(`insert into "TripContent"("tripId","updatedAt") values ('no-such-trip',now())`, "content for a non-existent trip is rejected (FK)");
  await prisma.$executeRawUnsafe(`insert into "TripItineraryStop"("id","tripId","position","title","updatedAt") values ('x4','${TRIP}',0,'{}',now())`);
  await rejects(`insert into "TripItineraryStop"("id","tripId","position","title","updatedAt") values ('x5','${TRIP}',0,'{}',now())`, "duplicate itinerary position is rejected");
  await prisma.$executeRawUnsafe(`delete from "TripItineraryStop" where id='x4'`);

  // 3. Cascade only affects the new tables of a deleted (throw-away) trip.
  await prisma.trip.create({ data: { id: "rt113-cascade-probe", city: "Rio de Janeiro", priceCents: 1, title: { pt: "probe" }, highlights: {}, isPublished: false } });
  await prisma.tripContent.create({ data: { tripId: "rt113-cascade-probe", source: "MOCK probe" } });
  await prisma.tripImage.create({ data: { tripId: "rt113-cascade-probe", position: 0, src: "/x.jpg", alt: { pt: "x" } } });
  await prisma.trip.delete({ where: { id: "rt113-cascade-probe" } });
  check((await prisma.tripContent.count({ where: { tripId: "rt113-cascade-probe" } })) === 0 && (await prisma.tripImage.count({ where: { tripId: "rt113-cascade-probe" } })) === 0, "deleting a trip removes only its own content/images (cascade)");

  // 4. Publication gate against the database, with the MOCK record of a launch trip.
  const mock = MOCK_TOUR_CONTENT[TRIP];
  await prisma.tripContent.create({
    data: {
      tripId: TRIP, status: "DRAFT", source: mock.source, meetingPoint: mock.meetingPoint ?? undefined, startTimeNote: mock.startTimeNote ?? undefined,
      languages: mock.languages, requirements: mock.requirements ?? undefined, accessibility: mock.accessibility ?? undefined, weatherPolicy: mock.weatherPolicy ?? undefined,
    },
  });
  for (const stop of mock.itinerary) await prisma.tripItineraryStop.create({ data: { tripId: TRIP, position: stop.position, title: stop.title, description: stop.description ?? undefined, durationMinutes: stop.durationMinutes ?? undefined } });
  for (const img of mock.images) await prisma.tripImage.create({ data: { tripId: TRIP, position: img.position, src: img.src, alt: img.alt, isCover: img.isCover, rightsStatus: img.rightsStatus } });
  check((await getTourContent(TRIP, "pt", "public")) === null, "DRAFT/MOCK content is hidden from the public audience");
  const preview = await getTourContent(TRIP, "en", "preview");
  check(preview?.isMock === true && preview.itinerary.length === 3 && preview.gallery.length === 3, "preview audience sees the mock content (3 stops, 3 images)");

  // Simulate a real approval (non-mock source, all locales) and one image without recorded rights.
  await prisma.tripContent.update({ where: { tripId: TRIP }, data: { status: "OWNER_APPROVED", approvedAt: new Date(), source: "validation probe (not mock)" } });
  await prisma.tripImage.update({ where: { tripId_position: { tripId: TRIP, position: 2 } }, data: { rightsStatus: "UNVERIFIED" } });
  const pub = await getTourContent(TRIP, "es", "public");
  check(pub !== null && pub.gallery.length === 2 && pub.gallery.every((g) => g.rightsStatus !== "UNVERIFIED"), "approved content is public, and an image without recorded rights is hidden");
  await prisma.tripContent.update({ where: { tripId: TRIP }, data: { source: "MOCK again" } });
  check((await getTourContent(TRIP, "pt", "public")) === null, "a MOCK source is never public even with OWNER_APPROVED");

  // Clean the probe rows (throw-away DB anyway).
  await prisma.tripImage.deleteMany({ where: { tripId: TRIP } });
  await prisma.tripItineraryStop.deleteMany({ where: { tripId: TRIP } });
  await prisma.tripContent.delete({ where: { tripId: TRIP } });

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
