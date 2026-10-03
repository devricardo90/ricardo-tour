import type {
  FlightSearchCriteria,
  FlightSearchResult,
  PassengerTypeConfig,
  PlaceOption,
  PlaceRef,
  ValidationResultView,
} from "@/lib/flights/types";
import { createMockFlightSource } from "@/lib/flights/mock/mock-flight-source";

// THE MOCK BOUNDARY (RT-38 / RT-37 §21.1).
//
// The Flight Planner UI depends ONLY on this interface and on `getFlightSource()`. It never imports anything from
// `lib/flights/mock/*` and never builds provider-shaped objects itself. RT-41 replaces the implementation returned by
// `getFlightSource()` with the server-side provider gateway (RT-65 §6) and the UI needs no change.
//
// Contract notes for the real implementation:
//   - criteria in, Rick Travel view models out (types.ts); provider field names/codes/text never cross this line;
//   - failures are thrown as FlightSourceError with one of the fixed error classes;
//   - a missing/unsupported capability is expressed through the flags below (IF_PROVIDER_SUPPORTED), not assumed.

export type DemoControls = {
  /** Scenario ids; the UI shows a label from its copy module for each. Only present on the mock source. */
  scenarios: readonly string[];
  get(): string;
  set(id: string): void;
};

export interface FlightSource {
  /** True for the mock. Drives the persistent demo banner, the "Sample" badge and noindex wording. */
  readonly isMock: boolean;
  /** Passenger types, limits and rules as the active source defines them (provider-driven, RT-37 §9). */
  readonly passengerConfig: PassengerTypeConfig;
  /** IF_PROVIDER_SUPPORTED: render the cabin control only when the source supports it. */
  readonly cabinSelectorSupported: boolean;
  /** Present only on the mock: a prototype scenario switch so every state can be reviewed. */
  readonly demo?: DemoControls;

  searchPlaces(query: string, locale: string): Promise<PlaceOption[]>;
  getPlace(code: string, locale: string): Promise<PlaceRef | null>;
  searchOffers(criteria: FlightSearchCriteria, options?: { signal?: AbortSignal }): Promise<FlightSearchResult>;
  /** Re-confirms availability and price for one Selected Offer (RT-65 §12). */
  validateOffer(offerRef: string, options?: { signal?: AbortSignal }): Promise<ValidationResultView>;
}

let source: FlightSource | null = null;

/** The single switch: today the mock; RT-41 returns the provider gateway here. */
export function getFlightSource(): FlightSource {
  if (!source) source = createMockFlightSource();
  return source;
}
