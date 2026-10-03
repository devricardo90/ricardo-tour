import { demoControlsEnabled } from "@/lib/flights/mock/demo-gate";
import type { FlightSource } from "@/lib/flights/source";
import {
  FlightSourceError,
  type FlightDirectionView,
  type FlightOfferView,
  type FlightSearchCriteria,
  type FlightSearchResult,
  type ValidationResultView,
} from "@/lib/flights/types";
import { totalPassengers } from "@/lib/flights/validation";
import { getMockPlace, searchMockPlaces } from "@/lib/flights/mock/mock-locations";
import { MOCK_PASSENGER_CONFIG } from "@/lib/flights/mock/mock-passenger-config";

// MOCK FlightSource (RT-38). Everything here is prototype data and is the ONLY place that builds offers:
//   - fictional carriers only (no real airline names, logos or flight numbers);
//   - deterministic: the same criteria always give the same sample offers;
//   - scripted scenarios exercise every state of RT-37 §11-§18;
//   - no network, no provider, no credentials, no persistence, no analytics.
// RT-41 deletes this folder's role by returning the provider gateway from getFlightSource().

export const MOCK_SCENARIOS = [
  "normal",
  "no_results",
  "slow",
  "timeout",
  "unavailable",
  "rate_limited",
  "network",
  "internal",
  "partial",
  "price_changed",
  "offer_unavailable",
  "offer_stale",
  "validation_failed",
] as const;
export type MockScenario = (typeof MOCK_SCENARIOS)[number];

/** IF_PROVIDER_SUPPORTED: the prototype renders a cabin control so the UI can be reviewed; real support is RT-39 Q18. */
export const MOCK_CABIN_SELECTOR_ENABLED = true;

const FICTIONAL_CARRIERS = ["Sample Air", "Demo Wings", "Example Jet"] as const;
const SLOW_SEARCH_MS = 12_000;

const pad = (n: number) => String(n).padStart(2, "0");

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h;
}

/** Local ISO date-time `minutes` after midnight of `ymd` (no timezone conversion). */
function isoAt(ymd: string, minutes: number): string {
  const base = Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) + minutes * 60_000;
  const d = new Date(base);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function buildDirection(from: string, to: string, ymd: string, index: number, seed: number, carrier: string, cabin?: string): FlightDirectionView {
  const depart = 6 * 60 + (Math.floor(((seed + index * 197) % (14 * 60)) / 5) * 5);
  const stops = index % 3 === 2 ? 1 : 0;
  if (stops === 0) {
    const duration = 70 + ((seed * 7 + index * 23) % 240);
    return {
      segments: [{ from: { code: from }, to: { code: to }, departAt: isoAt(ymd, depart), arriveAt: isoAt(ymd, depart + duration), carrierName: carrier, cabin }],
      durationMinutes: duration,
      stops: 0,
    };
  }
  const first = 60 + ((seed + index) % 90);
  const layover = 90;
  const second = 60 + ((seed * 3 + index) % 90);
  return {
    segments: [
      { from: { code: from }, to: { code: "HUB" }, departAt: isoAt(ymd, depart), arriveAt: isoAt(ymd, depart + first), carrierName: carrier, cabin },
      { from: { code: "HUB" }, to: { code: to }, departAt: isoAt(ymd, depart + first + layover), arriveAt: isoAt(ymd, depart + first + layover + second), carrierName: carrier, cabin },
    ],
    durationMinutes: first + layover + second,
    stops: 1,
    layovers: [{ airportCode: "HUB", minutes: layover }],
  };
}

function buildOffers(criteria: FlightSearchCriteria, count: number): FlightOfferView[] {
  const seed = hash(`${criteria.origin.code}-${criteria.destination.code}-${criteria.departDate}-${criteria.returnDate ?? ""}`);
  const pax = Math.max(1, totalPassengers(criteria.passengers));
  const round = criteria.tripType === "ROUND_TRIP" && !!criteria.returnDate;
  const offers: FlightOfferView[] = [];

  for (let i = 0; i < count; i += 1) {
    const carrier = FICTIONAL_CARRIERS[(seed + i) % FICTIONAL_CARRIERS.length];
    const directions = [buildDirection(criteria.origin.code, criteria.destination.code, criteria.departDate, i, seed, carrier, criteria.cabin)];
    if (round && criteria.returnDate) {
      directions.push(buildDirection(criteria.destination.code, criteria.origin.code, criteria.returnDate, i + 1, seed, carrier, criteria.cabin));
    }
    const base = 280 + ((seed + i * 53) % 260);
    const total = Math.round(base * pax * (round ? 1.85 : 1));
    const baggageKnown = i % 2 === 0;
    offers.push({
      offerRef: `mock-${seed.toString(36)}-${i}`,
      directions,
      price: { currency: "BRL", total },
      baggage: baggageKnown
        ? { known: true, perDirection: directions.map(() => ({ checked: "1 × 23 kg" })) }
        : { known: false, perDirection: [] },
      fareConditions: { source: "mock" },
      isSample: true,
    });
  }
  return offers;
}

export function createMockFlightSource(options: { timeScale?: number } = {}): FlightSource {
  const scale = options.timeScale ?? 1;
  let scenario: MockScenario = "normal";
  const store = new Map<string, FlightOfferView>();

  const searchLatency = () => 700 * scale;

  return {
    isMock: true,
    passengerConfig: MOCK_PASSENGER_CONFIG,
    cabinSelectorSupported: MOCK_CABIN_SELECTOR_ENABLED,

    ...(demoControlsEnabled() ? { demo: {
      scenarios: MOCK_SCENARIOS,
      get: () => scenario,
      set: (id: string) => {
        if ((MOCK_SCENARIOS as readonly string[]).includes(id)) scenario = id as MockScenario;
      },
    } } : {}),

    async searchPlaces(query, locale) {
      await wait(120 * scale);
      return searchMockPlaces(query, locale);
    },

    async getPlace(code, locale) {
      return getMockPlace(code, locale);
    },

    async searchOffers(criteria, opts = {}): Promise<FlightSearchResult> {
      const { signal } = opts;
      switch (scenario) {
        case "slow":
          await wait(SLOW_SEARCH_MS * scale, signal);
          break;
        case "timeout":
          await wait(1500 * scale, signal);
          throw new FlightSourceError("PROVIDER_TIMEOUT");
        case "unavailable":
          await wait(900 * scale, signal);
          throw new FlightSourceError("PROVIDER_UNAVAILABLE");
        case "rate_limited":
          await wait(600 * scale, signal);
          throw new FlightSourceError("PROVIDER_RATE_LIMITED");
        case "network":
          await wait(400 * scale, signal);
          throw new FlightSourceError("NETWORK_ERROR");
        case "internal":
          await wait(500 * scale, signal);
          throw new FlightSourceError("INTERNAL_ERROR", "DEMO-0000");
        default:
          await wait(searchLatency(), signal);
      }

      if (scenario === "no_results") return { offers: [], partial: false };
      const partial = scenario === "partial";
      const offers = buildOffers(criteria, partial ? 3 : 6);
      store.clear();
      for (const offer of offers) store.set(offer.offerRef, offer);
      return { offers, partial };
    },

    async validateOffer(offerRef, opts = {}): Promise<ValidationResultView> {
      await wait(900 * scale, opts.signal);
      const offer = store.get(offerRef);
      if (!offer) return { status: "STALE" };

      switch (scenario) {
        case "price_changed": {
          const newTotal = Math.round(offer.price.total * 1.08);
          return { status: "PRICE_CHANGED", validatedOfferRef: `${offerRef}-v`, previousTotal: offer.price.total, newTotal, currency: offer.price.currency };
        }
        case "offer_unavailable":
          return { status: "UNAVAILABLE" };
        case "offer_stale":
          return { status: "STALE" };
        case "validation_failed":
          return { status: "FAILED" };
        default:
          return { status: "VALID", validatedOfferRef: `${offerRef}-v`, previousTotal: offer.price.total, newTotal: offer.price.total, currency: offer.price.currency };
      }
    },
  };
}
