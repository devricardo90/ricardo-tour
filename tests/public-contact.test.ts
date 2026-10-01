import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPublicWhatsAppUrl, PUBLIC_CONTACT, SUPERSEDED_CONTACT_PATTERNS } from "@/lib/public-contact";

const root = path.resolve(__dirname, "..");

// NEW public surfaces introduced by RT-52. Legacy code that still holds superseded values (for example
// lib/whatsapp.ts, components/about/*) is migrated by its own tickets and is intentionally NOT scanned here.
const NEW_SURFACES = [
  "components/site",
  "components/home-header.tsx",
  "components/home-footer.tsx",
  "app/[locale]/(site)",
];

function filesUnder(rel: string): string[] {
  const abs = path.join(root, rel);
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(path.join(rel, entry.name)) : [path.join(abs, entry.name)]
  );
}

describe("public contact source (RT-52)", () => {
  it("holds the Owner-approved canonical values", () => {
    expect(PUBLIC_CONTACT.email).toBe("contato@ricardotour.com");
    expect(PUBLIC_CONTACT.mailto).toBe("mailto:contato@ricardotour.com");
    expect(PUBLIC_CONTACT.whatsappDisplay).toBe("+55 22 99846-1906");
    expect(PUBLIC_CONTACT.whatsappDigits).toBe("5522998461906");
    expect(PUBLIC_CONTACT.whatsappUrl).toBe("https://wa.me/5522998461906");
    expect(PUBLIC_CONTACT.instagramUrl).toBe("https://www.instagram.com/ricktravelbrasil/");
  });

  it("keeps the display number, digits and wa.me URL consistent", () => {
    expect(PUBLIC_CONTACT.whatsappDisplay.replace(/\D/g, "")).toBe(PUBLIC_CONTACT.whatsappDigits);
    expect(PUBLIC_CONTACT.whatsappUrl).toBe(`https://wa.me/${PUBLIC_CONTACT.whatsappDigits}`);
    expect(PUBLIC_CONTACT.mailto).toBe(`mailto:${PUBLIC_CONTACT.email}`);
  });

  it("builds a wa.me URL with an encoded prefilled message", () => {
    expect(buildPublicWhatsAppUrl()).toBe("https://wa.me/5522998461906");
    expect(buildPublicWhatsAppUrl("  ")).toBe("https://wa.me/5522998461906");
    expect(buildPublicWhatsAppUrl("Olá! Tour: Cristo + Pão de Açúcar")).toBe(
      `https://wa.me/5522998461906?text=${encodeURIComponent("Olá! Tour: Cristo + Pão de Açúcar")}`
    );
  });

  it("flags every superseded value and none of the canonical ones", () => {
    const stale = ["contact@travelrick.com", "+55 21 96681-9928", "5521966819928", "+55 21 97116-8114", "5521971168114"];
    for (const value of stale) {
      expect(SUPERSEDED_CONTACT_PATTERNS.some((pattern) => pattern.test(value)), value).toBe(true);
    }
    const current = [PUBLIC_CONTACT.email, PUBLIC_CONTACT.whatsappDisplay, PUBLIC_CONTACT.whatsappDigits, PUBLIC_CONTACT.whatsappUrl];
    for (const value of current) {
      expect(SUPERSEDED_CONTACT_PATTERNS.some((pattern) => pattern.test(value)), value).toBe(false);
    }
  });

  it("keeps superseded contact values out of the new public surfaces", () => {
    const offenders: string[] = [];
    for (const rel of NEW_SURFACES) {
      for (const file of filesUnder(rel)) {
        if (!/\.(tsx?|css)$/.test(file)) continue;
        const text = readFileSync(file, "utf8");
        for (const pattern of SUPERSEDED_CONTACT_PATTERNS) {
          if (pattern.test(text)) offenders.push(`${path.relative(root, file)} matches ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("does not mount the legacy AI widget in the (site) layout", () => {
    const layout = readFileSync(path.join(root, "app/[locale]/(site)/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/AIConciergeWidget|ai-concierge-widget/);
  });
});
