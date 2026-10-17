/**
 * RT-113 complement (17/10/2026) — integration checks against a LOCAL THROW-AWAY database only.
 * Refuses any DATABASE_URL that is not localhost:5433/rt113b_* (never the hosted database).
 * Expects: the database holds the fixtures of scripts/rt-113b-fixtures.sql loaded BEFORE the complement migration, and
 * RT113B_HASH_BEFORE (path) holds the output of scripts/rt-113b-data-hash.sql taken before migrating.
 * Usage: DATABASE_URL=<local rt113b_check> RT113B_HASH_BEFORE=<file> npx tsx scripts/rt-113b-validate.ts
 */
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { approvalFor, getTourContent, loadTourContentRecord } from "@/lib/catalog/tour-content";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt113b_") || url.searchParams.has("host") || url.searchParams.has("hostaddr") || /neon|aws|vercel|supabase/i.test(url.href)) {
  throw new Error("Refusing to run: DATABASE_URL must be a local throw-away database localhost:5433/rt113b_*");
}

let failures = 0;
let passes = 0;
const check = (ok: boolean, label: string) => {
  if (ok) passes += 1;
  else failures += 1;
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

const tri = (pt: string, en: string, es: string) => JSON.stringify({ pt, en, es });
const A = "fixture_trip_a"; // OWNER_APPROVED content
const B = "fixture_trip_b"; // DRAFT content

async function main() {
  // 1. Existing rows unchanged (only pre-existing columns are fingerprinted).
  const hashSql = fs.readFileSync("scripts/rt-113b-data-hash.sql", "utf8");
  const rows = await prisma.$queryRawUnsafe<Array<{ t: string; h: string }>>(hashSql);
  const after = rows.map((r) => `${r.t} ${r.h}`).join("\n");
  const before = fs.readFileSync(process.env.RT113B_HASH_BEFORE ?? "", "utf8").trim().replace(/\r\n/g, "\n");
  check(after === before, "rows of Trip/TripContent/TripItineraryStop/TripImage identical before and after the migration");
  const media = await prisma.tripImage.findMany({ orderBy: { id: "asc" } });
  check(media.length === 2 && media.every((m) => m.mediaType === "IMAGE" && !m.posterSrc && !m.mobileSrc && m.durationSeconds === null && m.credit === null), "existing media rows became IMAGE with empty video fields");
  check((await prisma.tripFaqItem.count()) === 0, "FAQ table starts empty");

  // 2. Database rules.
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"mediaType","updatedAt") values ('v_noposter','${A}',10,'/v.mp4','{}','VIDEO',now())`, "CHECK: video without poster rejected");
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"posterSrc","updatedAt") values ('i_poster','${A}',11,'/i.jpg','{}','/p.jpg',now())`, "CHECK: image with poster rejected");
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"durationSeconds","updatedAt") values ('i_dur','${A}',12,'/i.jpg','{}',5,now())`, "CHECK: image with duration rejected");
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"mediaType","posterSrc","isCover","updatedAt") values ('v_cover','${A}',13,'/v.mp4','{}','VIDEO','/p.jpg',true,now())`, "CHECK: video as cover rejected");
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"mediaType","posterSrc","durationSeconds","updatedAt") values ('v_dur','${A}',14,'/v.mp4','{}','VIDEO','/p.jpg',0,now())`, "CHECK: non-positive duration rejected");
  await rejects(`insert into "TripImage" (id,"tripId",position,src,alt,"mediaType","posterSrc","updatedAt") values ('v_blank','${A}',15,'/v.mp4','{}','VIDEO','  ',now())`, "CHECK: blank poster rejected");
  await rejects(`insert into "TripFaqItem" (id,"tripId",position,question,answer,"updatedAt") values ('f_neg','${A}',-1,'{}','{}',now())`, "CHECK: negative FAQ position rejected");
  await rejects(`insert into "TripFaqItem" (id,"tripId",position,question,answer,"updatedAt") values ('f_orphan','no_such_trip',0,'{}','{}',now())`, "FK: FAQ for a missing trip rejected");

  // 3. Write real-shaped data through Prisma (fixtures only) and read it back through the publication gate.
  await prisma.tripContent.update({ where: { tripId: A }, data: { operationalConditions: JSON.parse(tri("Percurso pode mudar.", "Route may change.", "El recorrido puede cambiar.")), optionalServicesNote: JSON.parse(tri("Opcional.", "Optional.", "Opcional.")) } });
  await prisma.tripFaqItem.createMany({
    data: [
      { tripId: A, position: 1, question: JSON.parse(tri("P2?", "Q2?", "P2?")), answer: JSON.parse(tri("R2.", "A2.", "R2.")) },
      { tripId: A, position: 0, question: JSON.parse(tri("P1?", "Q1?", "P1?")), answer: JSON.parse(tri("R1.", "A1.", "R1.")) },
      { tripId: B, position: 0, question: JSON.parse(tri("Rascunho?", "Draft?", "Borrador?")), answer: JSON.parse(tri("Sim.", "Yes.", "Sí.")) },
    ],
  });
  await rejects(`insert into "TripFaqItem" (id,"tripId",position,question,answer,"updatedAt") values ('f_dup','${A}',0,'{}','{}',now())`, "UNIQUE: duplicate FAQ position per tour rejected");
  await prisma.tripImage.createMany({
    data: [
      { tripId: A, position: 2, src: "/fixtures/v.mp4", alt: JSON.parse(tri("vídeo", "video", "video")), mediaType: "VIDEO", posterSrc: "/fixtures/v.jpg", mobileSrc: "/fixtures/v-m.mp4", durationSeconds: 15.5, rightsStatus: "OWNER_ATTESTED" },
      { tripId: A, position: 3, src: "/fixtures/w.mp4", alt: JSON.parse(tri("w", "w", "w")), mediaType: "VIDEO", posterSrc: "/fixtures/w.jpg", rightsStatus: "UNVERIFIED", credit: JSON.parse(tri("Crédito", "Credit", "Crédito")) },
    ],
  });
  await prisma.tripImage.update({ where: { id: "fixture_img_2" }, data: { credit: JSON.parse(tri("Foto de terceiros", "Third-party photo", "Foto de terceros")) } });

  // RT-119: approvals are bound to the content fingerprint. The fixture row was approved before the fingerprint
  // existed (status only) → never public; re-approve explicitly after loading the new content.
  check((await getTourContent(A, "en", "public")) === null, "status-only approval (no fingerprint) is never public");
  await prisma.tripContent.update({ where: { tripId: A }, data: approvalFor((await loadTourContentRecord(A))!, new Date("2026-10-17T00:00:00Z")) });
  const pub = await getTourContent(A, "en", "public");
  check(pub?.faq.map((f) => f.question).join(",") === "Q1?,Q2?", "public FAQ read back in position order, in the requested locale");
  check(pub?.operationalConditions === "Route may change." && pub?.optionalServicesNote === "Optional.", "public operating conditions and optional services read back (EN)");
  check(pub?.gallery.map((g) => g.src).join(",") === "/fixtures/a1.jpg", "gallery: images only, UNVERIFIED image hidden even with a credit");
  check(pub?.videos.length === 1 && pub.videos[0].src === "/fixtures/v.mp4" && pub.videos[0].poster === "/fixtures/v.jpg" && pub.videos[0].mobileSrc === "/fixtures/v-m.mp4" && pub.videos[0].durationSeconds === 15.5, "videos: attested video public with poster/mobile/duration; UNVERIFIED video hidden");
  const preview = await getTourContent(A, "pt", "preview");
  check(preview?.videos.length === 2 && preview?.gallery.length === 2, "lab preview sees every media item (with flags)");
  check((await getTourContent(B, "pt", "public")) === null, "DRAFT content (with FAQ) is never public");
  check((await getTourContent(B, "pt", "preview"))?.faq.length === 1, "DRAFT FAQ visible only in the lab preview");

  // 4. No price/cost columns in the content tables; Trip prices untouched.
  const cols = await prisma.$queryRawUnsafe<Array<{ c: string }>>(
    `select table_name || '.' || column_name as c from information_schema.columns where table_schema='public' and table_name in ('TripContent','TripFaqItem','TripImage','TripItineraryStop') and column_name ~* '(price|cost|margin|fee|supplier|commission)'`,
  );
  check(cols.length === 0, `no price/cost/margin/supplier columns in content tables (${cols.map((c) => c.c).join(", ") || "none"})`);
  const prices = await prisma.trip.findMany({ select: { id: true, priceCents: true }, orderBy: { id: "asc" } });
  check(prices.map((p) => p.priceCents).join(",") === "10000,20000,30000,40000", "Trip.priceCents untouched");

  // 5. Cascade limited to the deleted trip's own rows.
  await prisma.trip.delete({ where: { id: B } });
  check((await prisma.tripFaqItem.count({ where: { tripId: A } })) === 2 && (await prisma.tripFaqItem.count()) === 2, "deleting a trip removes only its own FAQ rows");

  console.log(`\n${passes} passed, ${failures} failed`);
  await prisma.$disconnect();
  process.exit(failures ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
