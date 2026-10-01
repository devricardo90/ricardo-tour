// Copy for the public /quem-somos page (PT / EN / ES). Every statement comes from the approved evidence register
// (docs/product/ai-concierge-approved-public-business-evidence-values.md: short description, general services, service
// languages, institutional text) or from the public Home About copy approved in RT-34. EN/ES are conservative
// translations of the PT source; final copy polish is deferred to the Home polish pass.
// Deliberately absent: years in business, customer counts, ratings, awards, insurance, 24/7 support, accredited/certified
// guide or operation, official-partner wording, guaranteed safety, and any mission/vision/values/security grid.
export type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heading: string;
  intro: string;
  storyHeading: string;
  paragraphs: readonly string[];
  signatureName: string;
  signatureRole: string;
  imageAlt: string;
  servicesHeading: string;
  services: readonly string[];
  languages: string;
  ctaTours: string;
  ctaContact: string;
  ctaWhatsApp: string;
  ctaWhatsAppAria: string;
  whatsappMessage: string;
};

export const aboutCopy: Record<"pt" | "en" | "es", AboutCopy> = {
  pt: {
    metaTitle: "Quem somos | Rick Travel",
    metaDescription: "Conheça a Rick Travel: turismo local no Rio de Janeiro, com passeios guiados, orientação personalizada e atendimento em português, espanhol e inglês.",
    eyebrow: "QUEM SOMOS",
    heading: "Uma agência de turismo local no Rio de Janeiro.",
    intro: "A Rick Travel ajuda viajantes a planejar experiências de turismo local no Rio de Janeiro, com atendimento próximo, orientação personalizada e suporte em português, espanhol e inglês.",
    storyHeading: "Por trás de cada experiência, uma pessoa.",
    paragraphs: [
      "A Rick Travel nasceu da paixão pelo Rio de Janeiro e do desejo de oferecer experiências autênticas aos visitantes.",
      "Somos uma agência focada em turismo local: conectamos viajantes a passeios guiados e experiências no Rio, unindo conhecimento prático do destino e atendimento humano.",
      "Nosso foco é facilitar a jornada do viajante, com informações claras e organização, até a combinação final dos detalhes com a equipe.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador da Rick Travel",
    imageAlt: "Ricardo, fundador da Rick Travel, em um mirante com a Baía de Guanabara e o Pão de Açúcar ao fundo.",
    servicesHeading: "O que fazemos",
    services: [
      "Passeios guiados",
      "Experiências turísticas no Rio de Janeiro",
      "Visitas aos principais pontos turísticos",
      "Orientação personalizada de viagem",
      "Apoio inicial a viajantes interessados em passeios e experiências",
    ],
    languages: "Atendimento em português, espanhol e inglês.",
    ctaTours: "Ver os passeios",
    ctaContact: "Fale com a equipe",
    ctaWhatsApp: "WhatsApp",
    ctaWhatsAppAria: "Falar pelo WhatsApp (abre em nova aba)",
    whatsappMessage: "Olá! Gostaria de falar com a equipe da Rick Travel.",
  },
  en: {
    metaTitle: "About us | Rick Travel",
    metaDescription: "Meet Rick Travel: local tourism in Rio de Janeiro, with guided tours, personalized orientation and support in Portuguese, Spanish and English.",
    eyebrow: "ABOUT US",
    heading: "A local travel agency in Rio de Janeiro.",
    intro: "Rick Travel helps travelers plan local tourism experiences in Rio de Janeiro, with close service, personalized orientation and support in Portuguese, Spanish and English.",
    storyHeading: "Behind every experience, a person.",
    paragraphs: [
      "Rick Travel was born from a passion for Rio de Janeiro and the desire to offer authentic experiences to visitors.",
      "We are a travel agency focused on local tourism: we connect travelers with guided tours and experiences in Rio, combining practical knowledge of the destination with human service.",
      "Our focus is to make the traveler's journey easier, with clear information and organization, up to settling the final details with the team.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Founder of Rick Travel",
    imageAlt: "Ricardo, founder of Rick Travel, at a viewpoint with Guanabara Bay and Sugarloaf Mountain behind him.",
    servicesHeading: "What we do",
    services: [
      "Guided tours",
      "Tourist experiences in Rio de Janeiro",
      "Visits to the main tourist attractions",
      "Personalized travel orientation",
      "Initial support for travelers interested in tours and experiences",
    ],
    languages: "Service in Portuguese, Spanish and English.",
    ctaTours: "Browse the tours",
    ctaContact: "Talk to the team",
    ctaWhatsApp: "WhatsApp",
    ctaWhatsAppAria: "Message on WhatsApp (opens in a new tab)",
    whatsappMessage: "Hello! I'd like to talk to the Rick Travel team.",
  },
  es: {
    metaTitle: "Quiénes somos | Rick Travel",
    metaDescription: "Conoce Rick Travel: turismo local en Río de Janeiro, con tours guiados, orientación personalizada y atención en portugués, español e inglés.",
    eyebrow: "QUIÉNES SOMOS",
    heading: "Una agencia de turismo local en Río de Janeiro.",
    intro: "Rick Travel ayuda a los viajeros a planificar experiencias de turismo local en Río de Janeiro, con atención cercana, orientación personalizada y soporte en portugués, español e inglés.",
    storyHeading: "Detrás de cada experiencia, una persona.",
    paragraphs: [
      "Rick Travel nació de la pasión por Río de Janeiro y del deseo de ofrecer experiencias auténticas a los visitantes.",
      "Somos una agencia enfocada en turismo local: conectamos a los viajeros con tours guiados y experiencias en Río, uniendo conocimiento práctico del destino y atención humana.",
      "Nuestro enfoque es facilitar el recorrido del viajero, con información clara y organización, hasta acordar los detalles finales con el equipo.",
    ],
    signatureName: "Ricardo",
    signatureRole: "Fundador de Rick Travel",
    imageAlt: "Ricardo, fundador de Rick Travel, en un mirador con la Bahía de Guanabara y el Pan de Azúcar al fondo.",
    servicesHeading: "Qué hacemos",
    services: [
      "Tours guiados",
      "Experiencias turísticas en Río de Janeiro",
      "Visitas a los principales atractivos turísticos",
      "Orientación personalizada de viaje",
      "Apoyo inicial a viajeros interesados en tours y experiencias",
    ],
    languages: "Atención en portugués, español e inglés.",
    ctaTours: "Ver los tours",
    ctaContact: "Habla con el equipo",
    ctaWhatsApp: "WhatsApp",
    ctaWhatsAppAria: "Escribir por WhatsApp (se abre en una pestaña nueva)",
    whatsappMessage: "¡Hola! Me gustaría hablar con el equipo de Rick Travel.",
  },
};

export function resolveAboutCopy(locale: string): AboutCopy {
  return aboutCopy[locale as keyof typeof aboutCopy] ?? aboutCopy.pt;
}
