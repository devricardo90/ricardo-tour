/**
 * RT-119 (local preparation): prints the fingerprint of every Trip row (all business columns incl. prices and updatedAt)
 * of a LOCAL throw-away database, to prove that the content loader never touches Trip.
 * Usage: DATABASE_URL=<local rt119_*> npx tsx scripts/rt-119-trips-hash.ts
 */
import { prisma } from "@/lib/prisma";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5433" || !url.pathname.startsWith("/rt119_") || url.searchParams.has("host") || url.searchParams.has("hostaddr")) {
  throw new Error("Refusing to run: only a local throw-away database localhost:5433/rt119_* is allowed");
}
assertDatabaseAccess({ operation: "read", label: "scripts/rt-119-trips-hash.ts" }); // RT-104: deny by default

const sql = `select md5(string_agg(concat_ws('|', id, city, "priceCents", "imageUrl", title::text, coalesce(description::text,'∅'), highlights::text, "isPublished", "childrenAllowed", "durationDays", "physicalLevel", coalesce("maxGuests"::text,'∅'), "operationType", coalesce("partnerId",'∅'), "updatedAt"), '#' order by id)) as h from "Trip"`;

prisma
  .$queryRawUnsafe<Array<{ h: string }>>(sql)
  .then((rows) => process.stdout.write(rows[0].h))
  .finally(() => prisma.$disconnect());
