import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockFlightSource, MOCK_SCENARIOS } from "@/lib/flights/mock/mock-flight-source";
import { FlightSourceError, type FlightSearchCriteria } from "@/lib/flights/types";
import { dayOffset, formatClock } from "@/lib/flights/format";

const criteria: FlightSearchCriteria = {
  origin: { code: "GIG", label: "Rio de Janeiro – Galeão (GIG)", metro: "RIO" },
  destination: { code: "GRU", label: "São Paulo – Guarulhos (GRU)", metro: "SAO" },
  tripType: "ROUND_TRIP",
  departDate: "2026-11-10",
  returnDate: "2026-11-17",
  passengers: { adult: 2, child: 1, infant: 0 },
};

const make = () => createMockFlightSource({ timeScale: 0 });

describe("mock flight source (RT-38 mock boundary)", () => {
  it("is flagged as mock, exposes demo controls and a placeholder passenger configuration", () => {
    const source = make();
    expect(source.isMock).toBe(true);
    expect(source.passengerConfig.isPlaceholder).toBe(true);
    expect(source.demo?.scenarios).toEqual(MOCK_SCENARIOS);
    expect(source.demo?.get()).toBe("normal");
  });

  it("returns deterministic, clearly sample offers with fictional carriers and no real flight numbers", async () => {
    const a = await make().searchOffers(criteria);
    const b = await make().searchOffers(criteria);
    expect(a.offers.length).toBe(6);
    expect(a.partial).toBe(false);
    expect(a.offers.map((o) => o.offerRef)).toEqual(b.offers.map((o) => o.offerRef));
    for (const offer of a.offers) {
      expect(offer.isSample).toBe(true);
      expect(offer.price.total).toBeGreaterThan(0);
      expect(offer.directions).toHaveLength(2);
      expect(offer.fareConditions?.source).toBe("mock");
      for (const direction of offer.directions) {
        for (const segment of direction.segments) {
          expect(["Sample Air", "Demo Wings", "Example Jet"]).toContain(segment.carrierName);
          expect(segment.flightNumber).toBeUndefined();
          expect(segment.carrierLogoRef).toBeUndefined();
          expect(formatClock(segment.departAt)).toMatch(/^\d{2}:\d{2}$/);
          expect(dayOffset(segment.departAt, segment.arriveAt)).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("returns a single direction for one-way searches", async () => {
    const result = await make().searchOffers({ ...criteria, tripType: "ONE_WAY", returnDate: undefined });
    expect(result.offers.every((o) => o.directions.length === 1)).toBe(true);
  });

  it("scales the total with passenger count", async () => {
    const one = await make().searchOffers({ ...criteria, passengers: { adult: 1, child: 0, infant: 0 } });
    const three = await make().searchOffers(criteria);
    expect(three.offers[0].price.total).toBeGreaterThan(one.offers[0].price.total);
  });

  it("covers every search-side scenario", async () => {
    const expectError = async (id: string, errorClass: string, referenceId?: string) => {
      const source = make();
      source.demo?.set(id);
      const error = await source.searchOffers(criteria).catch((e) => e);
      expect(error).toBeInstanceOf(FlightSourceError);
      expect(error.errorClass).toBe(errorClass);
      if (referenceId) expect(error.referenceId).toBe(referenceId);
    };
    await expectError("timeout", "PROVIDER_TIMEOUT");
    await expectError("unavailable", "PROVIDER_UNAVAILABLE");
    await expectError("rate_limited", "PROVIDER_RATE_LIMITED");
    await expectError("network", "NETWORK_ERROR");
    await expectError("internal", "INTERNAL_ERROR", "DEMO-0000");

    const empty = make();
    empty.demo?.set("no_results");
    expect(await empty.searchOffers(criteria)).toEqual({ offers: [], partial: false });

    const partial = make();
    partial.demo?.set("partial");
    const result = await partial.searchOffers(criteria);
    expect(result.partial).toBe(true);
    expect(result.offers).toHaveLength(3);
  });

  it("the slow scenario is abortable", async () => {
    const source = createMockFlightSource();
    source.demo?.set("slow");
    const controller = new AbortController();
    const pending = source.searchOffers(criteria, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  it("covers every validation scenario against a previously returned offer", async () => {
    const run = async (id: string) => {
      const source = make();
      const { offers } = await source.searchOffers(criteria);
      source.demo?.set(id);
      return { offer: offers[0], result: await source.validateOffer(offers[0].offerRef) };
    };

    const ok = await run("normal");
    expect(ok.result.status).toBe("VALID");
    expect(ok.result.newTotal).toBe(ok.offer.price.total);

    const changed = await run("price_changed");
    expect(changed.result.status).toBe("PRICE_CHANGED");
    expect(changed.result.previousTotal).toBe(changed.offer.price.total);
    expect(changed.result.newTotal).toBeGreaterThan(changed.result.previousTotal ?? 0);

    expect((await run("offer_unavailable")).result.status).toBe("UNAVAILABLE");
    expect((await run("offer_stale")).result.status).toBe("STALE");
    expect((await run("validation_failed")).result.status).toBe("FAILED");
  });

  it("treats an unknown offer reference as stale and ignores unknown scenario ids", async () => {
    const source = make();
    expect((await source.validateOffer("not-an-offer")).status).toBe("STALE");
    source.demo?.set("nonsense");
    expect(source.demo?.get()).toBe("normal");
  });

  it("resolves places accent-insensitively with metropolitan options and exact-code priority", async () => {
    const source = make();
    const sp = await source.searchPlaces("sao paulo", "pt");
    expect(sp.map((p) => p.code)).toEqual(expect.arrayContaining(["SAO", "GRU", "CGH"]));
    expect(sp[0].kind).toBe("METRO");
    const code = await source.searchPlaces("gig", "en");
    expect(code[0].code).toBe("GIG");
    expect(await source.searchPlaces("r", "pt")).toEqual([]);
    expect(await source.searchPlaces("zzzz", "pt")).toEqual([]);
    expect((await source.getPlace("lis", "es"))?.label).toContain("Lisboa");
    expect(await source.getPlace("XXX", "pt")).toBeNull();
  });
});

describe("demo controls gating", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("exposes the scenario switch outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(createMockFlightSource().demo?.scenarios).toEqual(MOCK_SCENARIOS);
  });

  it("hides the scenario switch in production unless explicitly opted in at build time", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS", "");
    expect(createMockFlightSource().demo).toBeUndefined();
    vi.stubEnv("NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS", "1");
    expect(createMockFlightSource().demo).toBeDefined();
  });
});
