// Interface copy for the public tour detail page (PT / EN / ES). Trip content itself (titles, prose, includes,
// highlights) comes from the database and is NOT translated here; its language gaps are a data matter.
// Deliberately absent: any cancellation-policy wording and any accreditation/certification/security claim, until
// the Owner approves a canonical policy and the evidence register supports such claims.
export const tourDetailCopy = {
  pt: {
    back: "Voltar para os passeios",
    eyebrow: "EXPERIÊNCIAS NO RIO",
    about: "Sobre o passeio",
    facts: "Informações do passeio",
    duration: "Duração",
    category: "Categoria",
    place: "Local",
    group: "Grupo",
    groupValue: (n: number) => `Até ${n} pessoas`,
    pricePerPerson: "Preço por pessoa",
    included: "Incluído",
    notIncluded: "Não incluído",
    highlights: "Destaques",
    schedule: "Próximas datas",
    noSchedule: "As datas são combinadas diretamente com a equipe.",
    slotTitle: "Fale com a equipe",
    slotBody: "Tire dúvidas e combine a data e os detalhes deste passeio.",
    slotCta: "Falar com a equipe",
    whatsapp: "WhatsApp",
    whatsappAria: "Falar pelo WhatsApp (abre em nova aba)",
    whatsappMessage: (title: string) => `Olá! Tenho interesse no passeio: ${title}.`,
    emailLabel: "E-mail",
    jumpToContact: "Falar com a equipe",
    imageAlt: (title: string, place: string) => `${title} — ${place}`,
  },
  en: {
    back: "Back to all tours",
    eyebrow: "EXPERIENCES IN RIO",
    about: "About this tour",
    facts: "Tour details",
    duration: "Duration",
    category: "Category",
    place: "Location",
    group: "Group",
    groupValue: (n: number) => `Up to ${n} guests`,
    pricePerPerson: "Price per person",
    included: "Included",
    notIncluded: "Not included",
    highlights: "Highlights",
    schedule: "Upcoming dates",
    noSchedule: "Dates are arranged directly with the team.",
    slotTitle: "Talk to the team",
    slotBody: "Ask questions and arrange the date and details of this tour.",
    slotCta: "Contact the team",
    whatsapp: "WhatsApp",
    whatsappAria: "Message us on WhatsApp (opens in a new tab)",
    whatsappMessage: (title: string) => `Hello! I'm interested in this tour: ${title}.`,
    emailLabel: "Email",
    jumpToContact: "Contact the team",
    imageAlt: (title: string, place: string) => `${title} — ${place}`,
  },
  es: {
    back: "Volver a los tours",
    eyebrow: "EXPERIENCIAS EN RÍO",
    about: "Sobre este tour",
    facts: "Información del tour",
    duration: "Duración",
    category: "Categoría",
    place: "Lugar",
    group: "Grupo",
    groupValue: (n: number) => `Hasta ${n} personas`,
    pricePerPerson: "Precio por persona",
    included: "Incluido",
    notIncluded: "No incluido",
    highlights: "Destacados",
    schedule: "Próximas fechas",
    noSchedule: "Las fechas se coordinan directamente con el equipo.",
    slotTitle: "Habla con el equipo",
    slotBody: "Haz preguntas y coordina la fecha y los detalles de este tour.",
    slotCta: "Contactar al equipo",
    whatsapp: "WhatsApp",
    whatsappAria: "Escríbenos por WhatsApp (se abre en una pestaña nueva)",
    whatsappMessage: (title: string) => `¡Hola! Me interesa este tour: ${title}.`,
    emailLabel: "Correo",
    jumpToContact: "Contactar al equipo",
    imageAlt: (title: string, place: string) => `${title} — ${place}`,
  },
} as const;

export type TourDetailCopy = (typeof tourDetailCopy)[keyof typeof tourDetailCopy];

export function resolveTourDetailCopy(locale: string): TourDetailCopy {
  return tourDetailCopy[locale as keyof typeof tourDetailCopy] ?? tourDetailCopy.pt;
}

const INTL_LOCALE = { pt: "pt-BR", en: "en", es: "es" } as const;
const SCHEDULE_TIME_ZONE = "America/Sao_Paulo";

/** "12 de out. de 2026, 09:00–13:00" (same-day window shown once, never as a "date a date" range). */
export function formatScheduleWindow(startAt: Date | string, endAt: Date | string | null | undefined, locale: string) {
  const intl = INTL_LOCALE[locale as keyof typeof INTL_LOCALE] ?? INTL_LOCALE.pt;
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : null;
  const day = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: SCHEDULE_TIME_ZONE });
  const time = new Intl.DateTimeFormat(intl, { hour: "2-digit", minute: "2-digit", timeZone: SCHEDULE_TIME_ZONE });
  const sameDay = end && day.format(start) === day.format(end);
  if (!end) return `${day.format(start)}, ${time.format(start)}`;
  if (sameDay) return `${day.format(start)}, ${time.format(start)}–${time.format(end)}`;
  return `${day.format(start)}, ${time.format(start)} → ${day.format(end)}, ${time.format(end)}`;
}
