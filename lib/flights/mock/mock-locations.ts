import type { PlaceOption, PlaceRef } from "@/lib/flights/types";

// MOCK location dataset (RT-37 §6, §21): a deliberately small, static list used only by the prototype. It is NOT a
// statement about which routes exist or are sold. The real data source (provider vs curated dataset) is
// EXTERNAL_DECISION_REQUIRED (RT-39 Q3).

type L10n = { pt: string; en: string; es: string };
type MockPlace = {
  code: string;
  kind: "METRO" | "AIRPORT";
  metro?: string;
  city: L10n;
  airport?: L10n; // airport name part (AIRPORT kind)
};

const ALL_AIRPORTS: L10n = { pt: "todos os aeroportos", en: "all airports", es: "todos los aeropuertos" };

const PLACES: MockPlace[] = [
  { code: "RIO", kind: "METRO", metro: "RIO", city: { pt: "Rio de Janeiro", en: "Rio de Janeiro", es: "Río de Janeiro" } },
  { code: "GIG", kind: "AIRPORT", metro: "RIO", city: { pt: "Rio de Janeiro", en: "Rio de Janeiro", es: "Río de Janeiro" }, airport: { pt: "Galeão", en: "Galeão", es: "Galeão" } },
  { code: "SDU", kind: "AIRPORT", metro: "RIO", city: { pt: "Rio de Janeiro", en: "Rio de Janeiro", es: "Río de Janeiro" }, airport: { pt: "Santos Dumont", en: "Santos Dumont", es: "Santos Dumont" } },
  { code: "SAO", kind: "METRO", metro: "SAO", city: { pt: "São Paulo", en: "São Paulo", es: "São Paulo" } },
  { code: "GRU", kind: "AIRPORT", metro: "SAO", city: { pt: "São Paulo", en: "São Paulo", es: "São Paulo" }, airport: { pt: "Guarulhos", en: "Guarulhos", es: "Guarulhos" } },
  { code: "CGH", kind: "AIRPORT", metro: "SAO", city: { pt: "São Paulo", en: "São Paulo", es: "São Paulo" }, airport: { pt: "Congonhas", en: "Congonhas", es: "Congonhas" } },
  { code: "BSB", kind: "AIRPORT", city: { pt: "Brasília", en: "Brasília", es: "Brasilia" }, airport: { pt: "Presidente Juscelino Kubitschek", en: "Presidente Juscelino Kubitschek", es: "Presidente Juscelino Kubitschek" } },
  { code: "SSA", kind: "AIRPORT", city: { pt: "Salvador", en: "Salvador", es: "Salvador" }, airport: { pt: "Luís Eduardo Magalhães", en: "Luís Eduardo Magalhães", es: "Luís Eduardo Magalhães" } },
  { code: "LIS", kind: "AIRPORT", city: { pt: "Lisboa", en: "Lisbon", es: "Lisboa" }, airport: { pt: "Humberto Delgado", en: "Humberto Delgado", es: "Humberto Delgado" } },
  { code: "MAD", kind: "AIRPORT", city: { pt: "Madri", en: "Madrid", es: "Madrid" }, airport: { pt: "Adolfo Suárez Madrid-Barajas", en: "Adolfo Suárez Madrid-Barajas", es: "Adolfo Suárez Madrid-Barajas" } },
  { code: "EZE", kind: "AIRPORT", city: { pt: "Buenos Aires", en: "Buenos Aires", es: "Buenos Aires" }, airport: { pt: "Ezeiza", en: "Ezeiza", es: "Ezeiza" } },
  { code: "MIA", kind: "AIRPORT", city: { pt: "Miami", en: "Miami", es: "Miami" }, airport: { pt: "Miami Internacional", en: "Miami International", es: "Miami Internacional" } },
  { code: "JFK", kind: "AIRPORT", city: { pt: "Nova York", en: "New York", es: "Nueva York" }, airport: { pt: "John F. Kennedy", en: "John F. Kennedy", es: "John F. Kennedy" } },
];

const pickLocale = (locale: string): keyof L10n => (locale === "en" || locale === "es" ? locale : "pt");

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function toOption(place: MockPlace, locale: string): PlaceOption {
  const l = pickLocale(locale);
  const label =
    place.kind === "METRO"
      ? `${place.city[l]} — ${ALL_AIRPORTS[l]} (${place.code})`
      : `${place.city[l]} – ${place.airport![l]} (${place.code})`;
  return { code: place.code, label, metro: place.metro, kind: place.kind };
}

/** Matches city, airport name and IATA code, accent- and case-insensitive; exact code first (RT-37 §6). */
export function searchMockPlaces(query: string, locale: string): PlaceOption[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const l = pickLocale(locale);

  const scored = PLACES.map((place) => {
    const code = place.code.toLowerCase();
    const city = normalize(place.city[l]);
    const airport = place.airport ? normalize(place.airport[l]) : "";
    let score = -1;
    if (code === q) score = 0;
    else if (code.startsWith(q)) score = 1;
    else if (city.startsWith(q) || airport.startsWith(q)) score = 2;
    else if (city.includes(q) || airport.includes(q)) score = 3;
    return { place, score };
  })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score || (a.place.kind === b.place.kind ? 0 : a.place.kind === "METRO" ? -1 : 1));

  return scored.slice(0, 8).map((x) => toOption(x.place, locale));
}

export function getMockPlace(code: string, locale: string): PlaceRef | null {
  const place = PLACES.find((p) => p.code === code.toUpperCase());
  if (!place) return null;
  const { code: c, label, metro } = toOption(place, locale);
  return { code: c, label, metro };
}
