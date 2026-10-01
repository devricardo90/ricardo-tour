import { describe, expect, it } from "vitest";
import { getAbsoluteLanguageAlternates, getLanguageAlternates, isPublicLocale, publicLocaleCodes } from "@/i18n/locales";

describe("public locales and hreflang (RT-57)", () => {
  it("launches pt, en and es only", () => {
    expect([...publicLocaleCodes]).toEqual(["pt", "en", "es"]);
    expect(isPublicLocale("sv")).toBe(false);
    expect(isPublicLocale("pt")).toBe(true);
  });

  it("never advertises Swedish and keeps pt as x-default", () => {
    const alternates = getLanguageAlternates("/tours");
    expect(Object.keys(alternates).sort()).toEqual(["en", "es", "pt", "x-default"]);
    expect(alternates["x-default"]).toBe("/pt/tours");
    expect(Object.values(alternates).some((href) => href.includes("/sv"))).toBe(false);
  });

  it("builds absolute alternates from the validated host", () => {
    const absolute = getAbsoluteLanguageAlternates("", "https://example.com/");
    expect(absolute.en).toBe("https://example.com/en");
    expect(absolute["x-default"]).toBe("https://example.com/pt");
  });
});
