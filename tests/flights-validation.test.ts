import { describe, expect, it } from "vitest";
import { MOCK_PASSENGER_CONFIG } from "@/lib/flights/mock/mock-passenger-config";
import { toCriteria, totalPassengers, validateFlightForm, validatePassengers } from "@/lib/flights/validation";
import type { FlightSearchForm, PassengerTypeConfig, PlaceRef } from "@/lib/flights/types";

const GIG: PlaceRef = { code: "GIG", label: "Rio de Janeiro – Galeão (GIG)", metro: "RIO" };
const SDU: PlaceRef = { code: "SDU", label: "Rio de Janeiro – Santos Dumont (SDU)", metro: "RIO" };
const RIO: PlaceRef = { code: "RIO", label: "Rio de Janeiro — todos os aeroportos (RIO)", metro: "RIO" };
const GRU: PlaceRef = { code: "GRU", label: "São Paulo – Guarulhos (GRU)", metro: "SAO" };
const TODAY = "2026-10-03";
const noText = { origin: { text: "" }, destination: { text: "" } };

const base: FlightSearchForm = {
  origin: GIG,
  destination: GRU,
  tripType: "ROUND_TRIP",
  departDate: "2026-11-10",
  returnDate: "2026-11-17",
  passengers: { adult: 1, child: 0, infant: 0 },
  cabin: "",
};

const run = (form: Partial<FlightSearchForm>, typed = noText, config: PassengerTypeConfig = MOCK_PASSENGER_CONFIG) =>
  validateFlightForm({ ...base, ...form }, config, TODAY, typed);

describe("flight search validation (RT-37 §11)", () => {
  it("accepts a complete round-trip search", () => {
    expect(run({})).toEqual({});
  });

  it("requires origin and destination, and distinguishes typed-but-unselected text", () => {
    expect(run({ origin: null, destination: null }).origin).toBe("ORIGIN_REQUIRED");
    expect(run({ origin: null, destination: null }).destination).toBe("DESTINATION_REQUIRED");
    const typed = { origin: { text: "rio" }, destination: { text: "sao" } };
    expect(run({ origin: null, destination: null }, typed).origin).toBe("ORIGIN_NOT_SELECTED");
    expect(run({ origin: null, destination: null }, typed).destination).toBe("DESTINATION_NOT_SELECTED");
  });

  it("rejects identical places and places in the same metropolitan area", () => {
    expect(run({ destination: GIG }).destination).toBe("SAME_PLACE");
    expect(run({ origin: RIO, destination: SDU }).destination).toBe("SAME_PLACE");
    expect(run({ origin: GIG, destination: SDU }).destination).toBe("SAME_PLACE");
  });

  it("validates dates against today and against each other", () => {
    expect(run({ departDate: "" }).departDate).toBe("DEPART_REQUIRED");
    expect(run({ departDate: "2026-10-02" }).departDate).toBe("DEPART_PAST");
    expect(run({ departDate: TODAY, returnDate: TODAY })).toEqual({});
    expect(run({ returnDate: "" }).returnDate).toBe("RETURN_REQUIRED");
    expect(run({ returnDate: "2026-11-09" }).returnDate).toBe("RETURN_BEFORE_DEPART");
  });

  it("does not require or validate a return date for one-way trips", () => {
    expect(run({ tripType: "ONE_WAY", returnDate: "" })).toEqual({});
    expect(run({ tripType: "ONE_WAY", returnDate: "2020-01-01" })).toEqual({});
  });

  it("produces criteria with no return date for one-way and an empty cabin as undefined", () => {
    const criteria = toCriteria({ ...base, tripType: "ONE_WAY" });
    expect(criteria.returnDate).toBeUndefined();
    expect(criteria.cabin).toBeUndefined();
    expect(toCriteria({ ...base, cabin: "economy" }).cabin).toBe("economy");
  });
});

describe("passenger validation is driven only by the active configuration (RT-37 §9)", () => {
  it("the mock configuration declares no age band, ratio, maximum or per-type limit", () => {
    expect(MOCK_PASSENGER_CONFIG.isPlaceholder).toBe(true);
    expect(MOCK_PASSENGER_CONFIG.rules).toEqual([]);
    expect(MOCK_PASSENGER_CONFIG.maxTotal).toBeUndefined();
    for (const type of MOCK_PASSENGER_CONFIG.types) {
      expect(type.ageHint).toBeUndefined();
      expect(type.min).toBeUndefined();
      expect(type.max).toBeUndefined();
    }
  });

  it("only requires at least one passenger and imposes no infant/child rule", () => {
    expect(validatePassengers({ adult: 0, child: 0, infant: 0 }, MOCK_PASSENGER_CONFIG)).toBe("PASSENGERS_REQUIRED");
    expect(validatePassengers({ adult: 1, child: 0, infant: 5 }, MOCK_PASSENGER_CONFIG)).toBeNull();
    expect(validatePassengers({ adult: 0, child: 3, infant: 0 }, MOCK_PASSENGER_CONFIG)).toBeNull();
    expect(validatePassengers({ adult: 40, child: 40, infant: 40 }, MOCK_PASSENGER_CONFIG)).toBeNull();
  });

  it("enforces limits and rules only when the configuration declares them", () => {
    const provider: PassengerTypeConfig = {
      isPlaceholder: false,
      minTotal: 1,
      maxTotal: 4,
      types: [
        { id: "adult", defaultCount: 1, min: 0, max: 3 },
        { id: "infant", defaultCount: 0 },
      ],
      rules: [{ id: "infant-per-adult", isViolated: (c) => (c.infant ?? 0) > (c.adult ?? 0) }],
    };
    expect(validatePassengers({ adult: 1, infant: 1 }, provider)).toBeNull();
    expect(validatePassengers({ adult: 1, infant: 2 }, provider)).toBe("PASSENGER_RULE");
    expect(validatePassengers({ adult: 4, infant: 0 }, provider)).toBe("PASSENGER_LIMIT");
    expect(validatePassengers({ adult: 3, infant: 2 }, provider)).toBe("PASSENGER_LIMIT");
  });

  it("sums passengers", () => {
    expect(totalPassengers({ adult: 2, child: 1, infant: 0 })).toBe(3);
  });
});
