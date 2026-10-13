// RT-100 audit evidence: the REAL public gate (lib/catalog/public-trips.ts) running through the REAL Prisma client against a
// MIGRATED, THROW-AWAY local database. Run only through scripts/rt-100-audit-checks.mjs (it sets DATABASE_URL and refuses
// non-local hosts). This file refuses to run against a non-local database as well.
import { isLocalDatabaseUrl } from "../lib/db/local-database";

const url = process.env.DATABASE_URL ?? "";
if (!isLocalDatabaseUrl(url)) {
  console.error("REFUSING: DATABASE_URL is not a local database.");
  process.exit(2);
}

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { LAUNCH_TRIP_IDS, getPublicTripById, getPublicTrips } = await import("../lib/catalog/public-trips");

  const results: { name: string; ok: boolean }[] = [];
  const check = (name: string, ok: boolean) => {
    results.push({ name, ok });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  };

  // fixtures: the four launch trips with valid public data (all UNCLASSIFIED, as in the real catalog)
  for (const [i, id] of LAUNCH_TRIP_IDS.entries()) {
    await prisma.trip.create({
      data: {
        id,
        city: "Rio de Janeiro",
        priceCents: 10000 * (i + 1),
        imageUrl: "/images/trips/imagem-pao-de-acucar.jpg",
        title: { pt: `Passeio panorâmico ${i + 1}` },
        description: { pt: `Descrição do passeio panorâmico ${i + 1}.` },
        highlights: { pt: [] },
      },
    });
  }
  const A = LAUNCH_TRIP_IDS[0];
  const publicIds = async () => (await getPublicTrips()).map((t) => t.id);
  const detail = async () => (await getPublicTripById(A)) !== null;

  check("baseline: the four UNCLASSIFIED launch trips are public (list)", (await publicIds()).length === 4);
  check("baseline: tour detail resolves", await detail());

  const partner = await prisma.partner.create({
    data: { name: "Fixture Partner", slug: "fixture-partner", status: "INACTIVE", publicLabel: { pt: "Operado por Exemplo", en: "Operated by Example", es: "Operado por Ejemplo" } },
  });
  await prisma.trip.update({ where: { id: A }, data: { operationType: "PARTNER", partnerId: partner.id } });

  check("PARTNER trip + INACTIVE partner (full label): hidden from the list", !(await publicIds()).includes(A) && (await publicIds()).length === 3);
  check("PARTNER trip + INACTIVE partner: detail is null (404)", !(await detail()));

  await prisma.partner.update({ where: { id: partner.id }, data: { status: "ACTIVE", publicLabel: { pt: "Operado por Exemplo", en: "Operated by Example" } } });
  check("ACTIVE partner but the operator is NOT identified in ES: hidden (list and detail)", !(await publicIds()).includes(A) && !(await detail()));
  await prisma.partner.update({ where: { id: partner.id }, data: { publicLabel: { pt: "Operado por Exemplo", en: "Operated by Example", es: "   " } } });
  check("ACTIVE partner with a blank ES operator: hidden", !(await publicIds()).includes(A) && !(await detail()));
  await prisma.$executeRawUnsafe(`UPDATE "Partner" SET "publicLabel" = NULL WHERE id = '${partner.id}'`);
  check("ACTIVE partner with NO label at all: hidden", !(await publicIds()).includes(A) && !(await detail()));

  await prisma.partner.update({ where: { id: partner.id }, data: { publicLabel: { pt: "Operado por Exemplo", en: "Operated by Example", es: "Operado por Ejemplo" } } });
  check("ACTIVE partner + operator identified in PT/EN/ES: the trip is public again", (await publicIds()).includes(A) && (await detail()));

  // acceptance criterion: the classification is queryable and filterable on the server
  const partnerRows = await prisma.trip.findMany({ where: { operationType: "PARTNER" }, select: { id: true } });
  check("server-side filter by operationType = PARTNER returns exactly the classified trip", partnerRows.length === 1 && partnerRows[0].id === A);
  check("server-side count of UNCLASSIFIED trips is the other three", (await prisma.trip.count({ where: { operationType: "UNCLASSIFIED" } })) === 3);
  check("server-side filter by partner returns the same trip", (await prisma.trip.findMany({ where: { partnerId: partner.id }, select: { id: true } })).map((x) => x.id).join() === A);

  // private commercial fixtures must never reach the public gate output
  const tc = await prisma.tripCommercial.create({
    data: { tripId: A, priceSource: "PARTNER_TARIFF", tariffReference: "FIXTURE-TARIFF-REF-ZZ", currency: "BRL", remunerationModel: "MARKUP", recordStatus: "UNCONFIRMED", notes: "SECRET-NOTE-XYZ" },
  });
  await prisma.tripCommercialRate.create({ data: { tripCommercialId: tc.id, category: "adult", netAmountCents: 987654321, currency: "BRL" } });
  const listJson = JSON.stringify(await getPublicTrips());
  const detailJson = JSON.stringify(await getPublicTripById(A));
  const markers = ["987654321", "SECRET-NOTE-XYZ", "FIXTURE-TARIFF-REF-ZZ", "netAmountCents", "remunerationModel", "tariffReference", "TripCommercial", "recordStatus"];
  check("private commercial fixtures (amount, notes, tariff ref, model, status) never appear in the gate's list output", markers.every((m) => !listJson.includes(m)));
  check("... nor in the gate's detail output", markers.every((m) => !detailJson.includes(m)));
  check("the gate rows carry no 'commercial' or 'rates' property", !("commercial" in (JSON.parse(detailJson) ?? {})) && !listJson.includes('"rates"'));

  await prisma.partner.update({ where: { id: partner.id }, data: { status: "INACTIVE" } });
  check("deactivating the partner hides the trip immediately", !(await publicIds()).includes(A));
  await prisma.trip.update({ where: { id: A }, data: { operationType: "UNCLASSIFIED", partnerId: null } });
  check("back to UNCLASSIFIED: the trip is public again, exactly as an unclassified tour", (await publicIds()).includes(A) && (await publicIds()).length === 4);

  await prisma.$disconnect();
  const failed = results.filter((r) => !r.ok);
  console.log(`GATE-RESULT ${results.length - failed.length}/${results.length}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
