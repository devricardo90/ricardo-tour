// Flight Planner view model (RT-37 §21.2). These are RICK TRAVEL's own browser-facing shapes, not provider shapes:
// a provider gateway (RT-41) must map INTO them, and UI code must never import provider field names.
// Terminology follows RT-37 §0 / RT-65 §0: Search, Offer, Selected Offer, Validated Offer. "Booking" is reserved for tours.

export type TripType = "ONE_WAY" | "ROUND_TRIP";

/** A resolved place (airport or metropolitan area) chosen from the suggestions list. */
export type PlaceRef = { code: string; label: string; metro?: string };

/** Passenger counts keyed by passenger-type id from the active PassengerTypeConfig (never hard-coded age bands). */
export type PassengerCounts = Record<string, number>;

/** Form state: values may be incomplete. */
export type FlightSearchForm = {
  origin: PlaceRef | null;
  destination: PlaceRef | null;
  tripType: TripType;
  departDate: string; // YYYY-MM-DD or ""
  returnDate: string; // YYYY-MM-DD or ""
  passengers: PassengerCounts;
  cabin: string; // "" = any / provider default
};

/** A valid Search. Contains criteria only: no credentials, tokens or provider identifiers (RT-65 §15). */
export type FlightSearchCriteria = {
  origin: PlaceRef;
  destination: PlaceRef;
  tripType: TripType;
  departDate: string;
  returnDate?: string;
  passengers: PassengerCounts;
  cabin?: string;
};

/**
 * Passenger rules are provider/airline rules (IF_PROVIDER_SUPPORTED, EXTERNAL_DECISION_REQUIRED until RT-39). The UI
 * only enforces what the ACTIVE configuration declares. The mock configuration declares no age band and no ratio rule.
 */
export type PassengerTypeConfig = {
  /** True while the values are placeholders (mock). The UI says so. */
  isPlaceholder: boolean;
  /** Minimum total passengers for a Search to make sense (generic, not an age rule). */
  minTotal: number;
  maxTotal?: number;
  types: Array<{ id: string; defaultCount: number; min?: number; max?: number; ageHint?: string }>;
  rules: Array<{ id: string; isViolated: (counts: PassengerCounts) => boolean }>;
};

export type FlightSegmentView = {
  from: { code: string; name?: string };
  to: { code: string; name?: string };
  departAt: string; // ISO local date-time at the origin airport (no timezone conversion)
  arriveAt: string; // ISO local date-time at the destination airport
  carrierName: string;
  carrierLogoRef?: string; // only if rights are cleared (RT-79)
  flightNumber?: string; // IF_PROVIDER_SUPPORTED
  aircraft?: string; // IF_PROVIDER_SUPPORTED
  cabin?: string; // IF_PROVIDER_SUPPORTED
};

export type FlightDirectionView = {
  segments: FlightSegmentView[];
  durationMinutes: number;
  stops: number;
  layovers?: Array<{ airportCode: string; minutes: number }>; // IF_PROVIDER_SUPPORTED
};

export type FlightOfferView = {
  /** Opaque, server-signed, short-lived handle. NOT a provider id. */
  offerRef: string;
  directions: FlightDirectionView[];
  price: {
    currency: string;
    total: number; // total for ALL passengers; indicative until validated
    breakdown?: Array<{ passengerType: string; amount: number; taxesIncluded?: boolean }>; // IF_PROVIDER_SUPPORTED
  };
  baggage?: { perDirection: Array<{ cabin?: string; checked?: string; note?: string }>; known: boolean }; // IF_PROVIDER_SUPPORTED
  fareConditions?: { text?: string; language?: string; source: "provider" | "mock" }; // IF_PROVIDER_SUPPORTED
  validity?: { expiresAt?: string }; // IF_PROVIDER_SUPPORTED
  /** True in mock mode. Every sample offer is labelled as such in the UI. */
  isSample: boolean;
};

export type FlightSearchResult = {
  offers: FlightOfferView[];
  /** Some sources failed but offers exist (IF_PROVIDER_SUPPORTED). Never presented as complete. */
  partial: boolean;
};

export type ValidationStatus = "VALID" | "PRICE_CHANGED" | "UNAVAILABLE" | "STALE" | "FAILED";

export type ValidationResultView = {
  status: ValidationStatus;
  validatedOfferRef?: string;
  previousTotal?: number;
  newTotal?: number;
  currency?: string;
};

/** Error classes the browser may see (RT-37 §14 = RT-65 §21). Never provider codes or provider text. */
export type FlightErrorClass =
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "INTERNAL_ERROR";

export class FlightSourceError extends Error {
  readonly errorClass: FlightErrorClass;
  readonly referenceId?: string;
  constructor(errorClass: FlightErrorClass, referenceId?: string) {
    super(errorClass);
    this.name = "FlightSourceError";
    this.errorClass = errorClass;
    this.referenceId = referenceId;
  }
}

export type FlightSort = "RECOMMENDED" | "LOWEST_PRICE" | "SHORTEST" | "EARLIEST";

export type PlaceOption = PlaceRef & { kind: "METRO" | "AIRPORT" };
