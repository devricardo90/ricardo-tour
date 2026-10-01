import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const findFirst = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { findMany, findFirst } } }));

import {
  auditTrips,
  evaluatePublicTrip,
  filterPublicTrips,
  getPublicTripById,
  getPublicTrips,
  isLaunchApproved,
  LAUNCH_TRIP_IDS,
  type GateTrip,
} from "@/lib/catalog/public-trips";

const root = path.resolve(__dirname, "..");
const [PREMIUM, COLOMBO, ROCINHA, CRISTO] = LAUNCH_TRIP_IDS;

function trip(overrides: Partial<GateTrip> & { id: string }): GateTrip {
  return {
    title: { pt: "Passeio guiado real", en: "Real tour" },
    description: { pt: "Um passeio.\n\nDuracao: 5 horas." },
    city: "Rio de Janeiro",
    location: "Rio de Janeiro",
    priceCents: 10000,
    imageUrl: "/images/trips/imagem-pao-de-acucar.jpg",
    isPublished: true,
    ...overrides,
  };
}

// Records modelled on the audited database rows (ids are the canonical decision, never titles).
const database: GateTrip[] = [
  trip({ id: "cmoa70dy400002kzqugm2oulu", title: { pt: "TESTE E2E - NAO USAR" }, location: "Playwright Pier", isPublished: false, imageUrl: "/images/placeholder.svg" }),
  trip({ id: "cmljpsn0j0002t0zqsv6g1los", title: { pt: "Tour Praias " }, city: "rio de janeiro", location: "copacabana " }),
  trip({ id: "cmljpnazn0001t0zq92ywd6xk", title: { pt: "Passeio de Barco Sunset em Buzios" }, city: "Buzios", location: "Buzios" }),
  trip({ id: PREMIUM }),
  trip({ id: "cmlibqq5g0001z4zqopyzqlpz", title: { pt: "Morro da Urca" }, city: "rio de janeiro", location: "marina da gloria" }),
  trip({ id: COLOMBO }),
  trip({ id: ROCINHA }),
  trip({ id: CRISTO }),
];

describe("public catalog gate (RT-53)", () => {
  beforeEach(() => {
    findMany.mockReset();
    findFirst.mockReset();
  });

  it("approves exactly the four launch ids", () => {
    expect(LAUNCH_TRIP_IDS).toHaveLength(4);
    for (const id of LAUNCH_TRIP_IDS) expect(isLaunchApproved(id)).toBe(true);
    expect(isLaunchApproved("cmljpnazn0001t0zq92ywd6xk")).toBe(false);
  });

  it("includes the approved ids and excludes every other published record", () => {
    const audit = auditTrips(database);
    expect(audit.filter((a) => a.included).map((a) => a.id)).toEqual([PREMIUM, COLOMBO, ROCINHA, CRISTO]);
    const excluded = audit.filter((a) => !a.included);
    expect(excluded).toHaveLength(4);
    for (const entry of excluded) expect(entry.reasons).toContain("NOT_APPROVED_FOR_LAUNCH");
  });

  it("reports grounded reasons for each excluded record", () => {
    const byId = Object.fromEntries(auditTrips(database).map((a) => [a.id, a]));
    expect(byId["cmoa70dy400002kzqugm2oulu"].reasons).toEqual(expect.arrayContaining(["ARTIFACT_RECORD", "UNPUBLISHED", "PLACEHOLDER_MEDIA"]));
    expect(byId["cmljpnazn0001t0zq92ywd6xk"].primaryReason).toBe("NON_RIO");
    expect(byId["cmljpsn0j0002t0zqsv6g1los"].primaryReason).toBe("ARTIFACT_RECORD");
    expect(byId["cmlibqq5g0001z4zqopyzqlpz"].primaryReason).toBe("ARTIFACT_RECORD");
  });

  it("excludes an unpublished approved record", () => {
    expect(evaluatePublicTrip(trip({ id: CRISTO, isPublished: false })).reasons).toContain("UNPUBLISHED");
  });

  it("hides an approved record whose data became invalid (price, media, content, scope)", () => {
    expect(evaluatePublicTrip(trip({ id: PREMIUM, priceCents: 0 })).reasons).toContain("INVALID_PRICE");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, imageUrl: null })).reasons).toContain("PLACEHOLDER_MEDIA");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, imageUrl: "/images/placeholder.svg" })).reasons).toContain("PLACEHOLDER_MEDIA");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, title: { pt: "" } })).reasons).toContain("INCOMPLETE_DATA");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, description: null })).reasons).toContain("INCOMPLETE_DATA");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, city: "Buzios" })).reasons).toContain("NON_RIO");
    expect(evaluatePublicTrip(trip({ id: PREMIUM, city: "rio de janeiro" })).reasons).toContain("ARTIFACT_RECORD");
  });

  it("getPublicTrips queries only approved published ids and returns them in launch order", async () => {
    findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] }; isPublished: boolean } }) =>
      // shuffled, plus a corrupted approved row that must be filtered by the integrity checks
      [...database.filter((t) => where.id.in.includes(t.id) && t.isPublished === where.isPublished)].reverse()
    );
    const result = await getPublicTrips();
    expect(findMany).toHaveBeenCalledWith({ where: { id: { in: [...LAUNCH_TRIP_IDS] }, isPublished: true } });
    expect(result.map((t) => t.id)).toEqual([...LAUNCH_TRIP_IDS]);

    findMany.mockResolvedValueOnce([trip({ id: ROCINHA, priceCents: 0 }), trip({ id: CRISTO })]);
    expect((await getPublicTrips()).map((t) => t.id)).toEqual([CRISTO]);
  });

  it("getPublicTripById never queries or returns non-catalog ids (RT-54 detail guard)", async () => {
    expect(await getPublicTripById("cmljpnazn0001t0zq92ywd6xk")).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
    findFirst.mockResolvedValueOnce(trip({ id: CRISTO }));
    expect((await getPublicTripById(CRISTO))?.id).toBe(CRISTO);
    findFirst.mockResolvedValueOnce(trip({ id: CRISTO, imageUrl: null }));
    expect(await getPublicTripById(CRISTO)).toBeNull();
  });

  it("filters by accent-insensitive search without changing the catalog", () => {
    const rows = [
      { ...trip({ id: PREMIUM }), title: { pt: "Tour Privado Premium" }, durationDays: 1 },
      { ...trip({ id: CRISTO }), title: { pt: "Cristo Redentor + Pão de Açúcar" }, durationDays: 1 },
    ];
    expect(filterPublicTrips(rows, { search: "pao de acucar" }, "pt").map((t) => t.id)).toEqual([CRISTO]);
    expect(filterPublicTrips(rows, { search: "" }, "pt")).toHaveLength(2);
    expect(filterPublicTrips(rows, { minPrice: "999" }, "pt")).toHaveLength(0);
  });

  it("is the single source for both the Home Experiences section and the /tours listing", () => {
    const home = readFileSync(path.join(root, "components/experiences-in-rio-section.tsx"), "utf8");
    const tours = readFileSync(path.join(root, "app/[locale]/(site)/tours/page.tsx"), "utf8");
    for (const source of [home, tours]) {
      expect(source).toMatch(/from "@\/lib\/catalog\/public-trips"/);
      expect(source).toMatch(/getPublicTrips\(/);
      expect(source).not.toMatch(/prisma\.trip\./);
    }
  });
});
