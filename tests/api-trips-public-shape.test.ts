import { describe, expect, it, vi } from "vitest";

// RT-100 (Owner condition 11): the PUBLIC trips API returns exactly the five public fields, whatever the gate hands it.
// The mocked rows deliberately carry the internal classification and private-looking fields to prove none of them can leak.
vi.mock("@/lib/catalog/public-trips", () => ({
  getPublicTrips: vi.fn(async () => [
    {
      id: "trip-1",
      title: { pt: "Passeio" },
      description: { pt: "Descrição" },
      city: "Rio de Janeiro",
      location: "Centro",
      priceCents: 12345,
      imageUrl: "/x.jpg",
      isPublished: true,
      operationType: "UNCLASSIFIED",
      partnerId: "p1",
      partner: { status: "ACTIVE" },
      commercial: { costCents: 1, remunerationModel: "MARKUP", rates: [{ netAmountCents: 1 }] },
    },
  ]),
}));
vi.mock("@/lib/observability/report", () => ({ reportServerError: vi.fn() }));

describe("GET /api/trips (public)", () => {
  it("exposes only id, title, description, city and location", async () => {
    const { GET } = await import("@/app/api/trips/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(Object.keys(body[0]).sort()).toEqual(["city", "description", "id", "location", "title"]);
    const serialized = JSON.stringify(body);
    for (const forbidden of ["UNCLASSIFIED", "operationType", "partnerId", "commercial", "remuneration", "netAmountCents", "costCents", "priceCents"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
