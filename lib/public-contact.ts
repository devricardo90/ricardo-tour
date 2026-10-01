// Canonical public contact values (Owner-confirmed, RT-52). Single source for every NEW public surface:
// SiteFooter, the guest pre-booking block (RT-55), /contato and /quem-somos (RT-56) and tour detail.
//
// Superseded values that must NOT appear in new public UI:
//   contact@travelrick.com (and any travelrick.com address), +55 21 96681-9928, +55 21 97116-8114.
// lib/whatsapp.ts now reads the WhatsApp number from here (RT-55); other legacy holders (components/about/*) are
// migrated by their own ticket (RT-56).

export const PUBLIC_CONTACT = {
  email: "contato@ricardotour.com",
  mailto: "mailto:contato@ricardotour.com",
  whatsappDisplay: "+55 22 99846-1906",
  whatsappDigits: "5522998461906",
  whatsappUrl: "https://wa.me/5522998461906",
  instagramHandle: "@ricktravelbrasil",
  instagramUrl: "https://www.instagram.com/ricktravelbrasil/",
} as const;

/** wa.me link for the canonical number, optionally with a prefilled message. */
export function buildPublicWhatsAppUrl(message?: string) {
  const text = message?.trim();
  return text ? `${PUBLIC_CONTACT.whatsappUrl}?text=${encodeURIComponent(text)}` : PUBLIC_CONTACT.whatsappUrl;
}

/** Strings that identify superseded contact data; used by tests and validators to guard new public surfaces. */
export const SUPERSEDED_CONTACT_PATTERNS = [
  /travelrick\.com/i,
  /\+?55\s?21\s?9?6681[-\s]?9928/,
  /5521966819928/,
  /\+?55\s?21\s?9?7116[-\s]?8114/,
  /5521971168114/,
] as const;
