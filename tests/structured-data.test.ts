import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, buildTouristTripJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

const SITE = "https://www.ricardotour.com";

describe("structured data (RT-47)", () => {
  it("describes the agency with canonical contact data and no unproven claims", () => {
    const org = buildOrganizationJsonLd(SITE, "desc");
    expect(org["@type"]).toBe("TravelAgency");
    expect(org.url).toBe(SITE);
    expect(org.email).toBe(PUBLIC_CONTACT.email);
    const text = JSON.stringify(org);
    expect(text).not.toMatch(/cadastur|certif|award|aggregateRating|review|guarantee/i);
    expect(text).not.toMatch(/travelrick\.com/i);
  });

  it("builds a tour with an absolute image and a BRL offer, omitting the offer when there is no price", () => {
    const trip = buildTouristTripJsonLd({ siteUrl: SITE, url: `${SITE}/pt/tours/x`, name: "Tour", image: "/images/trips/a.jpg", priceCents: 25000 });
    expect(trip.image).toBe(`${SITE}/images/trips/a.jpg`);
    expect(trip.offers).toMatchObject({ price: "250.00", priceCurrency: "BRL" });
    expect(buildTouristTripJsonLd({ siteUrl: SITE, url: SITE, name: "T", priceCents: 0 }).offers).toBeUndefined();
  });

  it("escapes < so content cannot close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toContain("</script>");
  });
});
