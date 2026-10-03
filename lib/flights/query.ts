import type { FlightSearchForm, PassengerCounts, TripType } from "@/lib/flights/types";

// Search criteria <-> URL query (RT-37 §3, §11). CRITERIA ONLY: never passenger data, offer handles, prices or tokens.

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const CODE = /^[A-Z]{3}$/;

export type ParsedQuery = {
  originCode?: string;
  destinationCode?: string;
  tripType?: TripType;
  departDate?: string;
  returnDate?: string;
  passengers?: PassengerCounts;
};

export function serializeCriteria(form: FlightSearchForm): URLSearchParams {
  const params = new URLSearchParams();
  if (form.origin) params.set("o", form.origin.code);
  if (form.destination) params.set("d", form.destination.code);
  params.set("trip", form.tripType === "ONE_WAY" ? "ow" : "rt");
  if (form.departDate) params.set("dep", form.departDate);
  if (form.tripType === "ROUND_TRIP" && form.returnDate) params.set("ret", form.returnDate);
  const pax = Object.entries(form.passengers)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${id}:${n}`)
    .join(",");
  if (pax) params.set("pax", pax);
  return params;
}

export function parseCriteria(params: URLSearchParams, knownTypeIds: string[]): ParsedQuery {
  const out: ParsedQuery = {};
  const o = params.get("o")?.toUpperCase();
  const d = params.get("d")?.toUpperCase();
  if (o && CODE.test(o)) out.originCode = o;
  if (d && CODE.test(d)) out.destinationCode = d;
  const trip = params.get("trip");
  if (trip === "ow") out.tripType = "ONE_WAY";
  else if (trip === "rt") out.tripType = "ROUND_TRIP";
  const dep = params.get("dep");
  const ret = params.get("ret");
  if (dep && YMD.test(dep)) out.departDate = dep;
  if (ret && YMD.test(ret)) out.returnDate = ret;
  const pax = params.get("pax");
  if (pax) {
    const counts: PassengerCounts = {};
    for (const part of pax.split(",")) {
      const [id, raw] = part.split(":");
      const n = Number(raw);
      if (knownTypeIds.includes(id) && Number.isInteger(n) && n >= 0 && n <= 99) counts[id] = n;
    }
    if (Object.keys(counts).length > 0) out.passengers = counts;
  }
  return out;
}
