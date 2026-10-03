import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { flightsCopy, fill, resolveFlightsCopy } from "@/components/site/flights/flights-copy";
import { getFlightsMetadata } from "@/lib/flights/metadata";
import { MOCK_SCENARIOS } from "@/lib/flights/mock/mock-flight-source";
import { parseCriteria, serializeCriteria } from "@/lib/flights/query";
import type { FlightSearchForm } from "@/lib/flights/types";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
function walk(dir: string): string[] {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = path.posix.join(dir, e.name);
    return e.isDirectory() ? walk(rel) : [rel];
  });
}
const strings = (value: unknown): string[] =>
  typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];

describe("flight copy (RT-37 §0 terminology, §23 locales)", () => {
  const locales = ["pt", "en", "es"] as const;

  it("has the same key structure in PT, EN and ES", () => {
    const shape = (value: unknown): unknown =>
      value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)])) : "string";
    expect(shape(flightsCopy.en)).toEqual(shape(flightsCopy.pt));
    expect(shape(flightsCopy.es)).toEqual(shape(flightsCopy.pt));
  });

  it("labels every mock scenario in every locale", () => {
    for (const locale of locales) {
      for (const id of MOCK_SCENARIOS) expect(flightsCopy[locale].demo.scenarios[id], `${locale}:${id}`).toBeTruthy();
    }
  });

  it("never uses booking/reservation wording or claims confirmation/issuance for flights", () => {
    const forbidden = {
      pt: /(reserv(a|ar|ado|ada|as)|bilhete emitido|passagem emitida|compra confirmada|pedido confirmado|voo confirmado|passagem confirmada|oferta confirmada)/i,
      en: /(booking|booked|book now|ticket issued|order confirmed|booking confirmed|flight confirmed|ticket confirmed|offer confirmed)/i,
      es: /(reserv(a|ar|ado|ada|as)|billete emitido|compra confirmada|pedido confirmado|vuelo confirmado|billete confirmado|oferta confirmada)/i,
    } as const;
    for (const locale of locales) {
      for (const text of strings(flightsCopy[locale])) expect(text, `${locale}: ${text}`).not.toMatch(forbidden[locale]);
    }
  });

  it("states that the page is a demo with sample data, never that flights are live", () => {
    for (const locale of locales) {
      const t = flightsCopy[locale];
      expect(t.demo.bannerBody.length).toBeGreaterThan(20);
      expect(t.demo.sampleBadge.length).toBeGreaterThan(2);
      for (const text of strings(t)) expect(text).not.toMatch(/(live flights|voos reais dispon|vuelos reales dispon|real-time|tempo real|tiempo real)/i);
    }
  });

  it("contains no passenger age bands", () => {
    for (const locale of locales) {
      for (const text of strings(flightsCopy[locale].passengers)) expect(text).not.toMatch(/\d+\s*[–-]\s*\d+|\b\d+\s*\+|(under|menos de|menores de|até|hasta)\s+\d+/i);
    }
  });

  it("resolves SV and unknown locales to PT, and fills placeholders", () => {
    expect(resolveFlightsCopy("sv")).toBe(flightsCopy.pt);
    expect(resolveFlightsCopy("fr")).toBe(flightsCopy.pt);
    expect(resolveFlightsCopy("en")).toBe(flightsCopy.en);
    expect(fill("Total for {n} passengers", { n: 3 })).toBe("Total for 3 passengers");
  });
});

describe("noindex and exposure (RT-37 §21.1)", () => {
  it("is noindex/nofollow with no canonical, alternates or Open Graph", () => {
    for (const locale of ["pt", "en", "es", "sv"]) {
      const metadata = getFlightsMetadata(locale);
      expect(metadata.robots).toMatchObject({ index: false, follow: false });
      expect(metadata.alternates).toBeUndefined();
      expect(metadata.openGraph).toBeUndefined();
      expect(metadata.title).toBeTruthy();
    }
  });

  it("is not in the sitemap or robots rules", () => {
    expect(read("app/sitemap.ts")).not.toMatch(/voos|flights/i);
  });

  it("is not linked from the Home, header, footer, mobile menu or tour pages (HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED)", () => {
    const chrome = [
      "components/site/site-header.tsx",
      "components/site/site-header-controls.tsx",
      "components/site/site-footer.tsx",
      "components/site/site-chrome-copy.ts",
      "app/[locale]/(site)/layout.tsx",
      "app/[locale]/(site)/page.tsx",
      "app/[locale]/(site)/tours/page.tsx",
      "app/[locale]/(site)/tours/[id]/page.tsx",
      "app/[locale]/(site)/contato/page.tsx",
      "app/[locale]/(site)/quem-somos/page.tsx",
    ];
    for (const file of chrome) expect(read(file), file).not.toMatch(/\/voos|FlightPlanner|lib\/flights/);
  });
});

describe("mock boundary (RT-38)", () => {
  const uiFiles = walk("components/site/flights").concat(["app/[locale]/(site)/voos/page.tsx"]);
  const flightLib = walk("lib/flights");
  const DEMO_GATE = "lib/flights/mock/demo-gate.ts";

  it("UI code depends on the FlightSource interface and never imports the mock", () => {
    for (const file of uiFiles) expect(read(file), file).not.toMatch(/lib\/flights\/mock/);
    expect(read("lib/flights/source.ts")).toMatch(/lib\/flights\/mock\/mock-flight-source/);
    const importers = flightLib.filter((f) => !f.startsWith("lib/flights/mock/") && f !== "lib/flights/source.ts").filter((f) => /flights\/mock/.test(read(f)));
    expect(importers).toEqual([]);
  });

  it("makes no network call and touches no provider, payment, database or Prisma code", () => {
    for (const file of [...uiFiles, ...flightLib]) {
      const text = file === DEMO_GATE ? "" : read(file);
      expect(text, file).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|axios|navigator\.sendBeacon|WebSocket|EventSource/);
      expect(text, file).not.toMatch(/@prisma|@\/lib\/prisma|from ["']pg["']|process\.env/);
      expect(text, file).not.toMatch(/mercado|MP_ACCESS|stripe|resend|flytour|maisfly/i);
    }
  });

  it("the demo gate is the only env reader and reads only NODE_ENV and the demo-controls flag", () => {
    const envReads = flightLib.filter((f) => /process\.env/.test(read(f)));
    expect(envReads).toEqual([DEMO_GATE]);
    const vars = [...read(DEMO_GATE).matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]).sort();
    expect([...new Set(vars)]).toEqual(["NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS", "NODE_ENV"]);
  });

  it("emits no analytics from the prototype", () => {
    for (const file of [...uiFiles, ...flightLib]) expect(read(file), file).not.toMatch(/lib\/analytics|trackEvent|AnalyticsEvent/);
  });

  it("does not use the word booking for flight commerce in code identifiers or UI", () => {
    for (const file of uiFiles) expect(read(file).replace(/\/\/.*$/gm, ""), file).not.toMatch(/\bbooking\b/i);
  });
});

describe("search criteria in the URL (RT-37 §3, §11)", () => {
  const form: FlightSearchForm = {
    origin: { code: "GIG", label: "x" },
    destination: { code: "LIS", label: "y" },
    tripType: "ROUND_TRIP",
    departDate: "2026-11-10",
    returnDate: "2026-11-17",
    passengers: { adult: 2, child: 1, infant: 0 },
    cabin: "economy",
  };

  it("round-trips criteria only", () => {
    const params = serializeCriteria(form);
    expect(params.toString()).toBe("o=GIG&d=LIS&trip=rt&dep=2026-11-10&ret=2026-11-17&pax=adult%3A2%2Cchild%3A1");
    expect(parseCriteria(params, ["adult", "child", "infant"])).toEqual({
      originCode: "GIG",
      destinationCode: "LIS",
      tripType: "ROUND_TRIP",
      departDate: "2026-11-10",
      returnDate: "2026-11-17",
      passengers: { adult: 2, child: 1 },
    });
  });

  it("never serializes cabin, prices, offers or passenger data, and omits return for one-way", () => {
    const keys = [...serializeCriteria({ ...form, tripType: "ONE_WAY" }).keys()];
    expect(keys).toEqual(["o", "d", "trip", "dep", "pax"]);
  });

  it("ignores malformed or unknown input", () => {
    const parsed = parseCriteria(new URLSearchParams("o=gi&d=<script>&dep=tomorrow&pax=alien:3,adult:abc,adult:-1&trip=x"), ["adult", "child"]);
    expect(parsed).toEqual({});
  });
});
