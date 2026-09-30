// Copy and destinations shared by the rebuilt Home header and footer (RT-35).
// Every destination is either an in-page anchor that exists on the rebuilt Home or an existing route.
// Contact data: only Instagram and the contact-form route are shown. Phone/WhatsApp and e-mail are omitted on
// purpose: the approved-values register (+55 21 96681-9928, contact@travelrick.com) conflicts with the WhatsApp
// number used by lib/whatsapp.ts (+55 21 97116-8114), and the travelrick.com domain is flagged as possibly stale.
// They return once the Owner confirms the current values.

export const PLAN_ANCHOR = "#globe-next";

export const INSTAGRAM_URL = "https://www.instagram.com/ricktravelbrasil/";

export const navAnchors = {
  experiences: "#experiences",
  plan: PLAN_ANCHOR,
  concierge: "#ai-concierge",
  rio: "#rio-story",
  about: "#about-rick-travel",
} as const;

export const chromeCopy = {
  pt: {
    logoAria: "Rick Travel, início",
    nav: { label: "Navegação principal", experiences: "Experiências", rio: "Sobre o Rio", concierge: "AI Concierge", about: "Quem somos" },
    cta: "Planeje sua viagem",
    menu: { open: "Abrir menu de navegação", close: "Fechar menu de navegação" },
    language: { label: "Idioma" },
    footer: {
      description: "Passeios e experiências no Rio com orientação personalizada.",
      navTitle: "Navegação",
      plan: "Planeje sua viagem",
      contactTitle: "Contato e redes",
      contactForm: "Formulário de contato",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Instagram da Rick Travel (abre em nova aba)",
      institutionalTitle: "Referência institucional",
      city: "Rio de Janeiro, Brasil",
    },
  },
  en: {
    logoAria: "Rick Travel, home",
    nav: { label: "Main navigation", experiences: "Experiences", rio: "About Rio", concierge: "AI Concierge", about: "About us" },
    cta: "Plan your trip",
    menu: { open: "Open navigation menu", close: "Close navigation menu" },
    language: { label: "Language" },
    footer: {
      description: "Tours and experiences in Rio with personalized guidance.",
      navTitle: "Navigation",
      plan: "Plan your trip",
      contactTitle: "Contact and social",
      contactForm: "Contact form",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Rick Travel on Instagram (opens in a new tab)",
      institutionalTitle: "Institutional reference",
      city: "Rio de Janeiro, Brazil",
    },
  },
  es: {
    logoAria: "Rick Travel, inicio",
    nav: { label: "Navegación principal", experiences: "Experiencias", rio: "Sobre Río", concierge: "AI Concierge", about: "Quiénes somos" },
    cta: "Planifica tu viaje",
    menu: { open: "Abrir menú de navegación", close: "Cerrar menú de navegación" },
    language: { label: "Idioma" },
    footer: {
      description: "Paseos y experiencias en Río con orientación personalizada.",
      navTitle: "Navegación",
      plan: "Planifica tu viaje",
      contactTitle: "Contacto y redes",
      contactForm: "Formulario de contacto",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Rick Travel en Instagram (se abre en una pestaña nueva)",
      institutionalTitle: "Referencia institucional",
      city: "Río de Janeiro, Brasil",
    },
  },
} as const;

export type ChromeCopy = (typeof chromeCopy)[keyof typeof chromeCopy];

export function resolveChromeCopy(locale: string): ChromeCopy {
  return chromeCopy[locale as keyof typeof chromeCopy] ?? chromeCopy.pt;
}
