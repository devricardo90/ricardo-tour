import type { TourRequestErrorCode } from "@/lib/tour-request";

// Copy for the guest tour request block (PT / EN / ES). Plain strings only (safe to import from a client component).
// Wording is "request / the team will get back to you": nothing here confirms availability, a reservation or a payment.
type RequestCopy = {
  heading: string;
  intro: string;
  name: string;
  email: string;
  phone: string;
  contactHint: string;
  date: string;
  party: string;
  notes: string;
  optional: string;
  submit: string;
  sending: string;
  whatsapp: string;
  whatsappAria: string;
  emailFallback: string;
  summary: string;
  failureTitle: string;
  failureBody: string;
  rateLimited: string;
  successTitle: string;
  successBody: string;
  errors: Record<TourRequestErrorCode, string>;
};

export const tourRequestCopy: Record<"pt" | "en" | "es", RequestCopy> = {
  pt: {
    heading: "Solicite este passeio",
    intro: "Envie uma solicitação ou fale pelo WhatsApp. Nossa equipe retorna para combinar data e detalhes do passeio.",
    name: "Nome",
    email: "E-mail",
    phone: "Telefone / WhatsApp",
    contactHint: "Informe pelo menos um: e-mail ou telefone/WhatsApp.",
    date: "Data preferida",
    party: "Número de pessoas",
    notes: "Observações",
    optional: "(opcional)",
    submit: "Enviar solicitação",
    sending: "Enviando...",
    whatsapp: "Falar pelo WhatsApp",
    whatsappAria: "Falar pelo WhatsApp (abre em nova aba)",
    emailFallback: "Ou escreva para",
    summary: "Revise os campos destacados.",
    failureTitle: "Não foi possível enviar agora.",
    failureBody: "Seus dados continuam preenchidos. Tente novamente ou fale com a equipe pelo WhatsApp ou por e-mail.",
    rateLimited: "Muitas solicitações em pouco tempo. Tente novamente em alguns minutos ou fale pelo WhatsApp.",
    successTitle: "Solicitação recebida",
    successBody: "Recebemos sua solicitação. Nossa equipe vai analisar e entrar em contato para combinar os detalhes.",
    errors: {
      name_required: "Informe seu nome.",
      name_too_long: "O nome está muito longo.",
      email_invalid: "Informe um e-mail válido.",
      phone_invalid: "Informe um telefone válido (com DDD).",
      contact_required: "Informe um e-mail ou um telefone/WhatsApp para retorno.",
      date_required: "Escolha uma data.",
      date_invalid: "Escolha uma data válida.",
      date_past: "Escolha uma data a partir de hoje.",
      party_invalid: "Informe de 1 a 20 pessoas.",
      notes_too_long: "As observações estão muito longas (máximo de 1000 caracteres).",
    },
  },
  en: {
    heading: "Request this tour",
    intro: "Send a request or message us on WhatsApp. Our team will get back to you to arrange the date and details of the tour.",
    name: "Name",
    email: "Email",
    phone: "Phone / WhatsApp",
    contactHint: "Provide at least one: email or phone/WhatsApp.",
    date: "Preferred date",
    party: "Number of people",
    notes: "Notes",
    optional: "(optional)",
    submit: "Send request",
    sending: "Sending...",
    whatsapp: "Message on WhatsApp",
    whatsappAria: "Message on WhatsApp (opens in a new tab)",
    emailFallback: "Or write to",
    summary: "Please review the highlighted fields.",
    failureTitle: "We couldn't send your request right now.",
    failureBody: "Your details are still filled in. Try again or reach the team on WhatsApp or by email.",
    rateLimited: "Too many requests in a short time. Please try again in a few minutes or message us on WhatsApp.",
    successTitle: "Request received",
    successBody: "We received your request. Our team will review it and get in touch to arrange the details.",
    errors: {
      name_required: "Enter your name.",
      name_too_long: "The name is too long.",
      email_invalid: "Enter a valid email.",
      phone_invalid: "Enter a valid phone number (with area code).",
      contact_required: "Enter an email or a phone/WhatsApp so we can reply.",
      date_required: "Choose a date.",
      date_invalid: "Choose a valid date.",
      date_past: "Choose a date from today onward.",
      party_invalid: "Enter between 1 and 20 people.",
      notes_too_long: "The notes are too long (maximum 1000 characters).",
    },
  },
  es: {
    heading: "Solicita este tour",
    intro: "Envía una solicitud o escríbenos por WhatsApp. Nuestro equipo te responderá para coordinar la fecha y los detalles del tour.",
    name: "Nombre",
    email: "Correo electrónico",
    phone: "Teléfono / WhatsApp",
    contactHint: "Indica al menos uno: correo o teléfono/WhatsApp.",
    date: "Fecha preferida",
    party: "Número de personas",
    notes: "Observaciones",
    optional: "(opcional)",
    submit: "Enviar solicitud",
    sending: "Enviando...",
    whatsapp: "Escribir por WhatsApp",
    whatsappAria: "Escribir por WhatsApp (se abre en una pestaña nueva)",
    emailFallback: "O escribe a",
    summary: "Revisa los campos resaltados.",
    failureTitle: "No pudimos enviar tu solicitud ahora.",
    failureBody: "Tus datos siguen completos. Inténtalo de nuevo o habla con el equipo por WhatsApp o por correo.",
    rateLimited: "Demasiadas solicitudes en poco tiempo. Inténtalo en unos minutos o escríbenos por WhatsApp.",
    successTitle: "Solicitud recibida",
    successBody: "Recibimos tu solicitud. Nuestro equipo la revisará y se pondrá en contacto para coordinar los detalles.",
    errors: {
      name_required: "Indica tu nombre.",
      name_too_long: "El nombre es demasiado largo.",
      email_invalid: "Indica un correo válido.",
      phone_invalid: "Indica un teléfono válido (con código de área).",
      contact_required: "Indica un correo o un teléfono/WhatsApp para responderte.",
      date_required: "Elige una fecha.",
      date_invalid: "Elige una fecha válida.",
      date_past: "Elige una fecha desde hoy en adelante.",
      party_invalid: "Indica entre 1 y 20 personas.",
      notes_too_long: "Las observaciones son demasiado largas (máximo 1000 caracteres).",
    },
  },
};

export function resolveTourRequestCopy(locale: string): RequestCopy {
  return tourRequestCopy[locale as keyof typeof tourRequestCopy] ?? tourRequestCopy.pt;
}
