import { PUBLIC_CONTACT } from "@/lib/public-contact";

// RT-55: the public WhatsApp number has a single source (lib/public-contact.ts); this legacy quote builder only
// formats its message, so no code path keeps sending visitors to a superseded number.
const WHATSAPP_PHONE = PUBLIC_CONTACT.whatsappDigits;

type WhatsAppSource = "home" | "tour_detail" | "bookings";

type BuildWhatsAppQuoteUrlInput = {
  locale: string;
  tripTitle?: string;
  city?: string;
  scheduleLabel?: string;
  source?: WhatsAppSource;
};

const whatsAppCopy = {
  pt: {
    intro: "Olá! Gostaria de solicitar um orçamento de passeio com a Rick Travel.",
    tripTitleLabel: "Passeio",
    cityLabel: "Cidade",
    scheduleLabel: "Data de interesse",
    sourceLabel: "Origem",
    sources: {
      home: "Página inicial",
      tour_detail: "Página do passeio",
      bookings: "Reservas",
    },
  },
  en: {
    intro: "Hello! I would like to request a quote for a tour with Rick Travel.",
    tripTitleLabel: "Tour",
    cityLabel: "City",
    scheduleLabel: "Date of interest",
    sourceLabel: "Source",
    sources: {
      home: "Home page",
      tour_detail: "Tour page",
      bookings: "Bookings",
    },
  },
  es: {
    intro: "Hola. Me gustaría solicitar un presupuesto para un paseo con Rick Travel.",
    tripTitleLabel: "Paseo",
    cityLabel: "Ciudad",
    scheduleLabel: "Fecha de interés",
    sourceLabel: "Origen",
    sources: {
      home: "Página inicial",
      tour_detail: "Página del paseo",
      bookings: "Reservas",
    },
  },
  sv: {
    intro: "Hej! Jag vill be om en offert för en tur med Rick Travel.",
    tripTitleLabel: "Tur",
    cityLabel: "Stad",
    scheduleLabel: "Önskat datum",
    sourceLabel: "Källa",
    sources: {
      home: "Startsida",
      tour_detail: "Tursida",
      bookings: "Bokningar",
    },
  },
} as const;

function getWhatsAppCopy(locale: string) {
  return whatsAppCopy[locale as keyof typeof whatsAppCopy] ?? whatsAppCopy.pt;
}

export function buildWhatsAppQuoteUrl({
  locale,
  tripTitle,
  city,
  scheduleLabel,
  source,
}: BuildWhatsAppQuoteUrlInput) {
  const copy = getWhatsAppCopy(locale);
  const lines: string[] = [copy.intro];

  if (tripTitle) {
    lines.push(`${copy.tripTitleLabel}: ${tripTitle}`);
  }

  if (city) {
    lines.push(`${copy.cityLabel}: ${city}`);
  }

  if (scheduleLabel) {
    lines.push(`${copy.scheduleLabel}: ${scheduleLabel}`);
  }

  if (source) {
    lines.push(`${copy.sourceLabel}: ${copy.sources[source]}`);
  }

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}
