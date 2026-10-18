import { prisma } from "../lib/prisma";
import { assertDatabaseAccess } from "../lib/db/guard-runtime.mjs";

assertDatabaseAccess({ operation: "read", label: "scripts/list-trips.ts" }); // RT-104: deny by default

async function main() {
  const trips = await prisma.trip.findMany();
  console.log("TRIPS_LIST_START");
  console.log(JSON.stringify(trips, null, 2));
  console.log("TRIPS_LIST_END");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
