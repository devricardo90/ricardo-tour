// Copy and anchors shared by the public-site header and footer (RT-35 Home chrome, generalized in RT-52).
// PT / EN / ES only. SV stays technical infrastructure: any other locale resolves to PT, and no SV control is shown.

export const PLAN_HASH = "globe-next";

/** Home section hashes. On inner routes they resolve to `/{locale}#hash`; on the Home they scroll in-page. */
export const navHashes = {
  experiences: "experiences",
  plan: PLAN_HASH,
  rio: "rio-story",
  about: "about-rick-travel",
} as const;

export const siteChromeCopy = {
  pt: {
    skip: "Pular para o conteúdo",
    logoAria: "Ricardo Tour, início",
    nav: { label: "Navegação principal", experiences: "Experiências", rio: "Sobre o Rio", concierge: "AI Concierge", about: "Quem somos" },
    cta: "Planeje sua viagem",
    // Live travel planner (RT-91) exists in PT only; EN/ES keep the Home anchor until provider localization is confirmed.
    planPath: "/planeje-sua-viagem" as string | null,
    menu: { open: "Abrir menu de navegação", close: "Fechar menu de navegação" },
    language: { label: "Idioma" },
    footer: {
      description: "Passeios e experiências no Rio com orientação personalizada.",
      navTitle: "Navegação",
      plan: "Planeje sua viagem",
      contactTitle: "Contato e redes",
      contactForm: "Formulário de contato",
      contactPage: "Página de contato",
      emailAria: "contato@ricardotour.com, enviar e-mail para a Ricardo Tour",
      whatsappLabel: "WhatsApp",
      whatsappAria: "WhatsApp +55 22 99846-1906, Ricardo Tour (abre em nova aba)",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Instagram · @ricktravelbrasil, perfil da Ricardo Tour (abre em nova aba)",
      institutionalTitle: "Referência institucional",
      city: "Rio de Janeiro, Brasil",
      terms: "Termos de Uso",
      privacy: "Política de Privacidade",
      legalAria: "Documentos legais",
    },
  },
  en: {
    skip: "Skip to content",
    logoAria: "Ricardo Tour, home",
    nav: { label: "Main navigation", experiences: "Experiences", rio: "About Rio", concierge: "AI Concierge", about: "About us" },
    cta: "Plan your trip",
    planPath: null as string | null,
    menu: { open: "Open navigation menu", close: "Close navigation menu" },
    language: { label: "Language" },
    footer: {
      description: "Tours and experiences in Rio with personalized guidance.",
      navTitle: "Navigation",
      plan: "Plan your trip",
      contactTitle: "Contact and social",
      contactForm: "Contact form",
      contactPage: "Contact page",
      emailAria: "contato@ricardotour.com, email Ricardo Tour",
      whatsappLabel: "WhatsApp",
      whatsappAria: "WhatsApp +55 22 99846-1906, Ricardo Tour (opens in a new tab)",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Instagram · @ricktravelbrasil, Ricardo Tour profile (opens in a new tab)",
      institutionalTitle: "Institutional reference",
      city: "Rio de Janeiro, Brazil",
      terms: "Terms of Use",
      privacy: "Privacy Policy",
      legalAria: "Legal documents",
    },
  },
  es: {
    skip: "Saltar al contenido",
    logoAria: "Ricardo Tour, inicio",
    nav: { label: "Navegación principal", experiences: "Experiencias", rio: "Sobre Río", concierge: "AI Concierge", about: "Quiénes somos" },
    cta: "Planifica tu viaje",
    planPath: null as string | null,
    menu: { open: "Abrir menú de navegación", close: "Cerrar menú de navegación" },
    language: { label: "Idioma" },
    footer: {
      description: "Paseos y experiencias en Río con orientación personalizada.",
      navTitle: "Navegación",
      plan: "Planifica tu viaje",
      contactTitle: "Contacto y redes",
      contactForm: "Formulario de contacto",
      contactPage: "Página de contacto",
      emailAria: "contato@ricardotour.com, enviar un correo a Ricardo Tour",
      whatsappLabel: "WhatsApp",
      whatsappAria: "WhatsApp +55 22 99846-1906, Ricardo Tour (se abre en una pestaña nueva)",
      instagram: "Instagram · @ricktravelbrasil",
      instagramAria: "Instagram · @ricktravelbrasil, perfil de Ricardo Tour (se abre en una pestaña nueva)",
      institutionalTitle: "Referencia institucional",
      city: "Río de Janeiro, Brasil",
      terms: "Términos de Uso",
      privacy: "Política de Privacidad",
      legalAria: "Documentos legales",
    },
  },
} as const;

export type SiteChromeCopy = (typeof siteChromeCopy)[keyof typeof siteChromeCopy];

export function resolveSiteChromeCopy(locale: string): SiteChromeCopy {
  return siteChromeCopy[locale as keyof typeof siteChromeCopy] ?? siteChromeCopy.pt;
}

/** How Home section links are rendered: `page` = in-page hash (the Home itself), `home` = locale-aware link to `/{locale}#hash`. */
export type AnchorMode = "page" | "home";
