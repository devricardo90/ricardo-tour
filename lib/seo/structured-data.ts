import { PUBLIC_CONTACT } from "@/lib/public-contact";

// RT-47: schema.org JSON-LD builders. Only facts the site already states publicly are emitted: no ratings, no
// certifications, no guarantees. Cadastur is deliberately NOT asserted here (Source of Truth: describe it without
// unproven claims); the footer keeps the institutional reference.

type Json = Record<string, unknown>;

export function buildOrganizationJsonLd(siteUrl: string, description: string): Json {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${siteUrl}/#organization`,
    name: "Ricardo Tour",
    url: siteUrl,
    logo: `${siteUrl}/images/ricardo-tour-logo.png`,
    description,
    email: PUBLIC_CONTACT.email,
    telephone: PUBLIC_CONTACT.whatsappDisplay,
    areaServed: { "@type": "City", name: "Rio de Janeiro" },
    sameAs: [PUBLIC_CONTACT.instagramUrl],
  };
}

export function buildTouristTripJsonLd(input: {
  siteUrl: string;
  url: string;
  name: string;
  description?: string;
  image?: string | null;
  priceCents: number;
}): Json {
  const image = input.image ? (input.image.startsWith("http") ? input.image : `${input.siteUrl}${input.image}`) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(image ? { image } : {}),
    url: input.url,
    provider: { "@id": `${input.siteUrl}/#organization` },
    ...(input.priceCents > 0
      ? { offers: { "@type": "Offer", price: (input.priceCents / 100).toFixed(2), priceCurrency: "BRL", url: input.url } }
      : {}),
  };
}

/** JSON for a <script type="application/ld+json"> body; `<` is escaped so content can never close the tag. */
export function serializeJsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, () => "\\u003c");
}
