import type { FlightSearchCriteria, FlightSearchForm, PassengerCounts, PassengerTypeConfig } from "@/lib/flights/types";

// Pure Search validation (RT-37 §11). No passenger AGE rules live here: passenger limits and rules come only from the
// active PassengerTypeConfig (provider-driven, RT-37 §9). Messages are chosen by the UI from these codes (copy modules).

export type FlightFieldKey = "origin" | "destination" | "departDate" | "returnDate" | "passengers";

export type FlightValidationCode =
  | "ORIGIN_REQUIRED"
  | "ORIGIN_NOT_SELECTED"
  | "DESTINATION_REQUIRED"
  | "DESTINATION_NOT_SELECTED"
  | "SAME_PLACE"
  | "DEPART_REQUIRED"
  | "DEPART_PAST"
  | "RETURN_REQUIRED"
  | "RETURN_BEFORE_DEPART"
  | "PASSENGERS_REQUIRED"
  | "PASSENGER_LIMIT"
  | "PASSENGER_RULE";

export type FlightFormErrors = Partial<Record<FlightFieldKey, FlightValidationCode>>;

/** Free text typed into a place field that was never resolved to a suggestion. */
export type PlaceInputState = { text: string };

export function totalPassengers(counts: PassengerCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0);
}

export function validatePassengers(counts: PassengerCounts, config: PassengerTypeConfig): FlightValidationCode | null {
  const total = totalPassengers(counts);
  if (total < config.minTotal) return "PASSENGERS_REQUIRED";
  if (config.maxTotal !== undefined && total > config.maxTotal) return "PASSENGER_LIMIT";
  for (const type of config.types) {
    const n = counts[type.id] ?? 0;
    if (type.min !== undefined && n < type.min) return "PASSENGERS_REQUIRED";
    if (type.max !== undefined && n > type.max) return "PASSENGER_LIMIT";
  }
  if (config.rules.some((rule) => rule.isViolated(counts))) return "PASSENGER_RULE";
  return null;
}

export function validateFlightForm(
  form: FlightSearchForm,
  config: PassengerTypeConfig,
  today: string,
  typed: { origin: PlaceInputState; destination: PlaceInputState },
): FlightFormErrors {
  const errors: FlightFormErrors = {};

  if (!form.origin) errors.origin = typed.origin.text.trim() ? "ORIGIN_NOT_SELECTED" : "ORIGIN_REQUIRED";
  if (!form.destination) errors.destination = typed.destination.text.trim() ? "DESTINATION_NOT_SELECTED" : "DESTINATION_REQUIRED";

  if (form.origin && form.destination) {
    const sameCode = form.origin.code === form.destination.code;
    const sameMetro = !!form.origin.metro && form.origin.metro === form.destination.metro;
    if (sameCode || sameMetro) errors.destination = "SAME_PLACE";
  }

  if (!form.departDate) errors.departDate = "DEPART_REQUIRED";
  else if (form.departDate < today) errors.departDate = "DEPART_PAST";

  if (form.tripType === "ROUND_TRIP") {
    if (!form.returnDate) errors.returnDate = "RETURN_REQUIRED";
    else if (form.departDate && form.returnDate < form.departDate) errors.returnDate = "RETURN_BEFORE_DEPART";
  }

  const paxError = validatePassengers(form.passengers, config);
  if (paxError) errors.passengers = paxError;

  return errors;
}

/** Only call with a form that produced no errors. */
export function toCriteria(form: FlightSearchForm): FlightSearchCriteria {
  if (!form.origin || !form.destination) throw new Error("toCriteria requires a validated form");
  return {
    origin: form.origin,
    destination: form.destination,
    tripType: form.tripType,
    departDate: form.departDate,
    returnDate: form.tripType === "ROUND_TRIP" ? form.returnDate : undefined,
    passengers: form.passengers,
    cabin: form.cabin || undefined,
  };
}

/** Order the error summary follows (matches visual order). */
export const FIELD_ORDER: FlightFieldKey[] = ["origin", "destination", "departDate", "returnDate", "passengers"];

/** Local calendar date as YYYY-MM-DD (the customer's today). */
export function todayYmd(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
