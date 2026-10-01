// Guest tour request (RT-55): shared by the client form and the server action, so both validate the same way.
// This is a REQUEST flow: nothing here confirms availability, a reservation or a payment.
import { buildPublicWhatsAppUrl } from "@/lib/public-contact";

export const PARTY_MIN = 1;
export const PARTY_MAX = 20;
export const NOTES_MAX = 1000;
export const NAME_MAX = 120;

export type TourRequestValues = {
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  party: string;
  notes: string;
};

export type TourRequestField = "name" | "email" | "phone" | "contact" | "date" | "party" | "notes";
export type TourRequestErrorCode =
  | "name_required"
  | "name_too_long"
  | "email_invalid"
  | "phone_invalid"
  | "contact_required"
  | "date_required"
  | "date_invalid"
  | "date_past"
  | "party_invalid"
  | "notes_too_long";
export type TourRequestErrors = Partial<Record<TourRequestField, TourRequestErrorCode>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BRAZIL_TZ = "America/Sao_Paulo";

/** Today's date in Rio (YYYY-MM-DD): "from today" is evaluated in the operating time zone, not the visitor's. */
export function todayInRio(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return parts; // en-CA formats as YYYY-MM-DD
}

function digitsOf(value: string) {
  return value.replace(/\D/g, "");
}

/** One definition of a valid contact e-mail / phone, shared by every public form (tour request, contact message). */
export function isValidEmail(value: string) {
  return EMAIL_RE.test(value);
}

export function isValidPhone(value: string) {
  const digits = digitsOf(value).length;
  return digits >= 8 && digits <= 15;
}

export function normalizeValues(input: Partial<Record<keyof TourRequestValues, unknown>>): TourRequestValues {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return { name: text(input.name), email: text(input.email), phone: text(input.phone), date: text(input.date), party: text(input.party), notes: text(input.notes) };
}

/** Pure validation. At least one of e-mail or phone/WhatsApp is required (not both). */
export function validateTourRequest(values: TourRequestValues, today: string = todayInRio()): TourRequestErrors {
  const errors: TourRequestErrors = {};
  if (!values.name) errors.name = "name_required";
  else if (values.name.length > NAME_MAX) errors.name = "name_too_long";

  const hasEmail = values.email.length > 0;
  const hasPhone = values.phone.length > 0;
  if (hasEmail && !isValidEmail(values.email)) errors.email = "email_invalid";
  if (hasPhone && !isValidPhone(values.phone)) errors.phone = "phone_invalid";
  if (!hasEmail && !hasPhone) errors.contact = "contact_required";

  if (!values.date) errors.date = "date_required";
  else if (!ISO_DATE_RE.test(values.date) || Number.isNaN(Date.parse(`${values.date}T12:00:00Z`))) errors.date = "date_invalid";
  else if (values.date < today) errors.date = "date_past";

  const party = Number(values.party);
  if (!values.party || !Number.isInteger(party) || party < PARTY_MIN || party > PARTY_MAX) errors.party = "party_invalid";
  if (values.notes.length > NOTES_MAX) errors.notes = "notes_too_long";
  return errors;
}

const INTL_LOCALE = { pt: "pt-BR", en: "en-GB", es: "es" } as const;

/** "20 de outubro de 2026" / "20 October 2026" for display (date-only, no time-zone shift). */
export function formatRequestDate(iso: string, locale: string) {
  if (!ISO_DATE_RE.test(iso)) return iso;
  const intl = INTL_LOCALE[locale as keyof typeof INTL_LOCALE] ?? INTL_LOCALE.pt;
  return new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

type WhatsAppMessageInput = { locale: string; title: string; date?: string; party?: string; scheduleLabel?: string };

/**
 * Prefilled WhatsApp message (PT/EN/ES). It asks to check availability; it never states availability, a confirmed price
 * or a payment. Date and party size are included only when the visitor already entered them.
 */
export function buildTourWhatsAppMessage({ locale, title, date, party, scheduleLabel }: WhatsAppMessageInput) {
  const partyNumber = Number(party);
  const hasParty = Number.isInteger(partyNumber) && partyNumber >= PARTY_MIN && partyNumber <= PARTY_MAX;
  const when = date && ISO_DATE_RE.test(date) ? formatRequestDate(date, locale) : null;
  const schedule = scheduleLabel?.trim();
  if (locale === "en") {
    return `Hello, I'm interested in the tour "${title}". I'd like to ask about availability${when ? ` for ${when}` : ""}${hasParty ? ` for ${partyNumber} ${partyNumber === 1 ? "person" : "people"}` : ""}.${schedule ? ` Date option: ${schedule}.` : ""}`;
  }
  if (locale === "es") {
    return `Hola, me interesa el tour "${title}". Quisiera consultar la disponibilidad${when ? ` para el ${when}` : ""}${hasParty ? ` para ${partyNumber} ${partyNumber === 1 ? "persona" : "personas"}` : ""}.${schedule ? ` Opción de fecha: ${schedule}.` : ""}`;
  }
  return `Olá, tenho interesse no passeio "${title}". Gostaria de consultar disponibilidade${when ? ` para ${when}` : ""}${hasParty ? ` para ${partyNumber} ${partyNumber === 1 ? "pessoa" : "pessoas"}` : ""}.${schedule ? ` Opção de data: ${schedule}.` : ""}`;
}

export function buildTourWhatsAppUrl(input: WhatsAppMessageInput) {
  return buildPublicWhatsAppUrl(buildTourWhatsAppMessage(input));
}

export type StoredRequestContext = {
  tripId: string;
  tripTitle: string;
  locale: string;
  pageUrl: string;
  scheduleLabel?: string | null;
};

/**
 * Structured text stored in the existing ContactSubmission.message (no schema change). Labels are Portuguese on purpose:
 * it is read by the Rick Travel team in the admin contacts view and in the notification e-mail.
 */
export function buildStoredRequestMessage(values: TourRequestValues, ctx: StoredRequestContext) {
  const contact = [values.email && `e-mail ${values.email}`, values.phone && `telefone/WhatsApp ${values.phone}`].filter(Boolean).join(" · ");
  const lines = [
    "[Solicitação de passeio — formulário do site]",
    `Passeio: ${ctx.tripTitle} (ID ${ctx.tripId})`,
    `Idioma da página: ${ctx.locale}`,
    `Data preferida: ${values.date}`,
    `Pessoas: ${values.party}`,
    ...(ctx.scheduleLabel ? [`Data/horário selecionado: ${ctx.scheduleLabel}`] : []),
    `Contato: ${contact}`,
    `Página: ${ctx.pageUrl}`,
    ...(values.notes ? ["", "Observações:", values.notes] : []),
  ];
  return lines.join("\n");
}
