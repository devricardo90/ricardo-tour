import type { ContactMessageErrorCode } from "@/lib/contact-message";

// Copy for the public /contato page (PT / EN / ES). Plain strings only (safe for client components).
// Deliberately absent: reply-time promises, business hours, a physical address, "secure contact" or any credential claim
// (none of these is in the approved evidence register).
export type ContactCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heading: string;
  intro: string;
  channels: string;
  email: string;
  whatsapp: string;
  instagram: string;
  whatsappAria: string;
  instagramAria: string;
  toursPrompt: string;
  toursLink: string;
  formHeading: string;
  formIntro: string;
  name: string;
  emailField: string;
  phone: string;
  contactHint: string;
  message: string;
  submit: string;
  sending: string;
  summary: string;
  failureTitle: string;
  failureBody: string;
  rateLimited: string;
  successTitle: string;
  successBody: string;
  whatsappMessage: string;
  errors: Record<ContactMessageErrorCode, string>;
};

export const contactCopy: Record<"pt" | "en" | "es", ContactCopy> = {
  pt: {
    metaTitle: "Contato | Ricardo Tour",
    metaDescription: "Fale com a equipe da Ricardo Tour sobre passeios e experiências no Rio de Janeiro: formulário, e-mail ou WhatsApp.",
    eyebrow: "CONTATO",
    heading: "Fale com a Ricardo Tour",
    intro: "Tire dúvidas sobre passeios e experiências no Rio de Janeiro. Escreva pelo formulário, por e-mail ou pelo WhatsApp.",
    channels: "Canais de contato",
    email: "E-mail",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    whatsappAria: "Falar pelo WhatsApp (abre em nova aba)",
    instagramAria: "Instagram da Ricardo Tour (abre em nova aba)",
    toursPrompt: "Procurando um passeio específico?",
    toursLink: "Ver os passeios",
    formHeading: "Envie uma mensagem",
    formIntro: "Conte como podemos ajudar. Nossa equipe lê sua mensagem e retorna pelo contato informado.",
    name: "Nome",
    emailField: "E-mail",
    phone: "Telefone / WhatsApp",
    contactHint: "Informe pelo menos um: e-mail ou telefone/WhatsApp.",
    message: "Mensagem",
    submit: "Enviar mensagem",
    sending: "Enviando...",
    summary: "Revise os campos destacados.",
    failureTitle: "Não foi possível enviar agora.",
    failureBody: "Sua mensagem continua preenchida. Tente novamente ou fale com a equipe pelo WhatsApp ou por e-mail.",
    rateLimited: "Muitas mensagens em pouco tempo. Tente novamente em alguns minutos ou fale pelo WhatsApp.",
    successTitle: "Mensagem recebida",
    successBody: "Recebemos sua mensagem. Nossa equipe vai lê-la e entrar em contato pelo contato informado.",
    whatsappMessage: "Olá! Gostaria de falar com a equipe da Ricardo Tour.",
    errors: {
      name_required: "Informe seu nome.",
      name_too_long: "O nome está muito longo.",
      email_invalid: "Informe um e-mail válido.",
      phone_invalid: "Informe um telefone válido (com DDD).",
      contact_required: "Informe um e-mail ou um telefone/WhatsApp para retorno.",
      message_required: "Escreva sua mensagem.",
      message_too_short: "Escreva pelo menos 10 caracteres.",
      message_too_long: "A mensagem está muito longa (máximo de 2000 caracteres).",
    },
  },
  en: {
    metaTitle: "Contact | Ricardo Tour",
    metaDescription: "Talk to the Ricardo Tour team about tours and experiences in Rio de Janeiro: contact form, email or WhatsApp.",
    eyebrow: "CONTACT",
    heading: "Talk to Ricardo Tour",
    intro: "Ask about tours and experiences in Rio de Janeiro. Write through the form, by email or on WhatsApp.",
    channels: "Ways to reach us",
    email: "Email",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    whatsappAria: "Message on WhatsApp (opens in a new tab)",
    instagramAria: "Ricardo Tour on Instagram (opens in a new tab)",
    toursPrompt: "Looking for a specific tour?",
    toursLink: "Browse the tours",
    formHeading: "Send a message",
    formIntro: "Tell us how we can help. Our team reads your message and replies using the contact you provide.",
    name: "Name",
    emailField: "Email",
    phone: "Phone / WhatsApp",
    contactHint: "Provide at least one: email or phone/WhatsApp.",
    message: "Message",
    submit: "Send message",
    sending: "Sending...",
    summary: "Please review the highlighted fields.",
    failureTitle: "We couldn't send your message right now.",
    failureBody: "Your message is still filled in. Try again or reach the team on WhatsApp or by email.",
    rateLimited: "Too many messages in a short time. Please try again in a few minutes or message us on WhatsApp.",
    successTitle: "Message received",
    successBody: "We received your message. Our team will read it and get in touch using the contact you provided.",
    whatsappMessage: "Hello! I'd like to talk to the Ricardo Tour team.",
    errors: {
      name_required: "Enter your name.",
      name_too_long: "The name is too long.",
      email_invalid: "Enter a valid email.",
      phone_invalid: "Enter a valid phone number (with area code).",
      contact_required: "Enter an email or a phone/WhatsApp so we can reply.",
      message_required: "Write your message.",
      message_too_short: "Write at least 10 characters.",
      message_too_long: "The message is too long (maximum 2000 characters).",
    },
  },
  es: {
    metaTitle: "Contacto | Ricardo Tour",
    metaDescription: "Habla con el equipo de Ricardo Tour sobre tours y experiencias en Río de Janeiro: formulario, correo o WhatsApp.",
    eyebrow: "CONTACTO",
    heading: "Habla con Ricardo Tour",
    intro: "Consulta sobre tours y experiencias en Río de Janeiro. Escribe por el formulario, por correo o por WhatsApp.",
    channels: "Cómo contactarnos",
    email: "Correo",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    whatsappAria: "Escribir por WhatsApp (se abre en una pestaña nueva)",
    instagramAria: "Ricardo Tour en Instagram (se abre en una pestaña nueva)",
    toursPrompt: "¿Buscas un tour específico?",
    toursLink: "Ver los tours",
    formHeading: "Envía un mensaje",
    formIntro: "Cuéntanos cómo podemos ayudar. Nuestro equipo lee tu mensaje y responde por el contacto que indiques.",
    name: "Nombre",
    emailField: "Correo electrónico",
    phone: "Teléfono / WhatsApp",
    contactHint: "Indica al menos uno: correo o teléfono/WhatsApp.",
    message: "Mensaje",
    submit: "Enviar mensaje",
    sending: "Enviando...",
    summary: "Revisa los campos resaltados.",
    failureTitle: "No pudimos enviar tu mensaje ahora.",
    failureBody: "Tu mensaje sigue completo. Inténtalo de nuevo o habla con el equipo por WhatsApp o por correo.",
    rateLimited: "Demasiados mensajes en poco tiempo. Inténtalo en unos minutos o escríbenos por WhatsApp.",
    successTitle: "Mensaje recibido",
    successBody: "Recibimos tu mensaje. Nuestro equipo lo leerá y se pondrá en contacto por el contacto que indicaste.",
    whatsappMessage: "¡Hola! Me gustaría hablar con el equipo de Ricardo Tour.",
    errors: {
      name_required: "Indica tu nombre.",
      name_too_long: "El nombre es demasiado largo.",
      email_invalid: "Indica un correo válido.",
      phone_invalid: "Indica un teléfono válido (con código de área).",
      contact_required: "Indica un correo o un teléfono/WhatsApp para responderte.",
      message_required: "Escribe tu mensaje.",
      message_too_short: "Escribe al menos 10 caracteres.",
      message_too_long: "El mensaje es demasiado largo (máximo 2000 caracteres).",
    },
  },
};

export function resolveContactCopy(locale: string): ContactCopy {
  return contactCopy[locale as keyof typeof contactCopy] ?? contactCopy.pt;
}
