import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { PUBLIC_DESIGN_TRIP_IDS } from "@/lib/catalog/public-tour-presentation";

/**
 * Owner 01/11/2026: a launch tour page whose approved content cannot be validated never falls back to the old catalog
 * offer. The legacy rows below are what production holds today (HTTP audit 01/11/2026): TOUR-03 is still titled
 * "Confeitaria Colombo + City Tour Rio" and TOUR-01 lacks the Selaron Steps, with old prices and covers.
 */
const LEGACY = {
  cmlibniq40000z4zqkbujnutt: { title: "Confeitaria Colombo + City Tour Rio", description: "Explore o principal cartão-postal do Brasil com visita a confeitaria colombo", priceCents: 24500, imageUrl: "/images/trips/imagem-cristo-redentor.jpg" },
  cmlhxkpy9000028zq27rhytew: { title: "Cristo Redentor + Pão de Açúcar", description: "Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos.", priceCents: 38500, imageUrl: "/images/trips/imagem-pao-de-acucar.jpg" },
  cmli1a6im000034zqqzc9sppb: { title: "Tour Favela Rocinha com Guia Local", description: "Conheça a cultura local da maior favela do Brasil com guia especializado", priceCents: 12000, imageUrl: "/images/trips/imagem-rocinha.jpg" },
} as const;

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
  getLanguageAlternates: () => ({}),
}));
vi.mock("@/lib/catalog/public-trips", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog/public-trips")>()),
  getPublicTripById: async (id: string) => {
    const row = LEGACY[id as keyof typeof LEGACY];
    return row ? { id, city: "Rio de Janeiro", title: { pt: row.title, en: row.title, es: row.title }, description: { pt: row.description, en: row.description, es: row.description }, priceCents: row.priceCents, imageUrl: row.imageUrl, highlights: { pt: ["Ingresso Cristo Redentor"] }, schedules: [] } : null;
  },
}));
// Approved content missing (e.g. RT-113 tables not migrated or RT-119 load incomplete): the presentation gate is null.
vi.mock("@/lib/catalog/public-tour-presentation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog/public-tour-presentation")>()),
  getPublicTourPresentation: async () => null,
}));

const params = (id: string, locale: string) => ({ params: Promise.resolve({ id, locale }) });

describe("Owner 01/11/2026: no old offer as fallback on the three launch tours", () => {
  it("the launch catalog is exactly the three tours of the approved design", () => {
    expect(new Set(LAUNCH_TRIP_IDS)).toEqual(PUBLIC_DESIGN_TRIP_IDS);
  });

  it("without validated content each tour shows the neutral state with WhatsApp, in PT/EN/ES, and nothing from the old row", async () => {
    const { default: Page } = await import("@/app/[locale]/(site)/tours/[id]/page");
    const headings = { pt: "Passeio em atualização", en: "Tour being updated", es: "Tour en actualización" };
    for (const [id, row] of Object.entries(LEGACY)) {
      for (const [locale, heading] of Object.entries(headings)) {
        const html = renderToStaticMarkup(await Page(params(id, locale)));
        expect(html).toContain('data-testid="tour-unavailable"');
        expect(html).toContain(heading);
        expect(html).toContain(`href="${PUBLIC_CONTACT.whatsappUrl}"`);
        expect(html).toContain(`href="${PUBLIC_CONTACT.mailto}"`);
        for (const legacy of [row.title, row.description, row.imageUrl, "Ingresso Cristo Redentor", "/images/trips/"]) expect(html).not.toContain(legacy);
        expect(html).not.toMatch(/R\$|application\/ld\+json|<form|<input/);
      }
    }
  });

  it("metadata of the neutral state: not indexed, neutral title, no old description or image", async () => {
    const { generateMetadata } = await import("@/app/[locale]/(site)/tours/[id]/page");
    for (const [id, row] of Object.entries(LEGACY)) {
      const meta = await generateMetadata(params(id, "en"));
      expect(meta.title).toBe("Tour being updated | Ricardo Tour");
      expect(meta.robots).toEqual({ index: false, follow: true });
      const text = JSON.stringify(meta);
      for (const legacy of [row.title, row.description, row.imageUrl]) expect(text).not.toContain(legacy);
    }
  });

  it("the public tour route no longer renders the legacy layout at all; ids outside the catalog stay 404", async () => {
    const source = readFileSync(resolve(process.cwd(), "app/[locale]/(site)/tours/[id]/page.tsx"), "utf8");
    expect(source).not.toContain("TourDetailView");
    const { default: Page } = await import("@/app/[locale]/(site)/tours/[id]/page");
    await expect(Page(params("cmljo0s1u0000t0zqa0bpd23p", "pt"))).rejects.toThrow(); // TOUR-04: notFound()
  });
});
