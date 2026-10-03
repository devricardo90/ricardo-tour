import type { PassengerTypeConfig } from "@/lib/flights/types";

// MOCK passenger-type configuration (RT-37 §9). Passenger age bands, infant/child rules and limits are
// provider/airline rules (IF_PROVIDER_SUPPORTED, EXTERNAL_DECISION_REQUIRED until RT-39). So the mock declares:
//   - type ids only (labels come from copy; NO age text),
//   - NO age band, NO infant-per-adult ratio, NO maximum, NO per-type limits,
//   - only the generic requirement that a Search has at least one passenger.
// `isPlaceholder: true` makes the UI say that passenger categories/limits are confirmed with the provider.
export const MOCK_PASSENGER_CONFIG: PassengerTypeConfig = {
  isPlaceholder: true,
  minTotal: 1,
  types: [
    { id: "adult", defaultCount: 1 },
    { id: "child", defaultCount: 0 },
    { id: "infant", defaultCount: 0 },
  ],
  rules: [],
};
