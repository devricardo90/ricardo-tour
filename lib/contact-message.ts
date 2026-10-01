// General contact message (RT-56, /contato): validation and the stored message text. It deliberately builds on the
// same primitives as the RT-55 tour request (contact-method rules, honeypot, rate limit, ContactSubmission storage and
// notification), so there is one contact architecture, not two. Nothing here promises a reply time, a booking or availability.
import { NAME_MAX, isValidEmail, isValidPhone } from "@/lib/tour-request";

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

export type ContactMessageValues = { name: string; email: string; phone: string; message: string };
export type ContactMessageField = "name" | "email" | "phone" | "contact" | "message";
export type ContactMessageErrorCode =
  | "name_required"
  | "name_too_long"
  | "email_invalid"
  | "phone_invalid"
  | "contact_required"
  | "message_required"
  | "message_too_short"
  | "message_too_long";
export type ContactMessageErrors = Partial<Record<ContactMessageField, ContactMessageErrorCode>>;

export function normalizeContactValues(input: Partial<Record<keyof ContactMessageValues, unknown>>): ContactMessageValues {
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return { name: text(input.name), email: text(input.email), phone: text(input.phone), message: text(input.message) };
}

/** Pure validation: name, at least one contact method (e-mail and/or phone/WhatsApp), and a message. */
export function validateContactMessage(values: ContactMessageValues): ContactMessageErrors {
  const errors: ContactMessageErrors = {};
  if (!values.name) errors.name = "name_required";
  else if (values.name.length > NAME_MAX) errors.name = "name_too_long";

  if (values.email && !isValidEmail(values.email)) errors.email = "email_invalid";
  if (values.phone && !isValidPhone(values.phone)) errors.phone = "phone_invalid";
  if (!values.email && !values.phone) errors.contact = "contact_required";

  if (!values.message) errors.message = "message_required";
  else if (values.message.length < MESSAGE_MIN) errors.message = "message_too_short";
  else if (values.message.length > MESSAGE_MAX) errors.message = "message_too_long";
  return errors;
}

/** Structured text stored in ContactSubmission.message; labels are Portuguese on purpose (read by the Rick Travel team). */
export function buildStoredContactMessage(values: ContactMessageValues, ctx: { locale: string; pageUrl: string }) {
  const contact = [values.email && `e-mail ${values.email}`, values.phone && `telefone/WhatsApp ${values.phone}`].filter(Boolean).join(" · ");
  return [
    "[Mensagem — formulário de contato do site]",
    `Idioma da página: ${ctx.locale}`,
    `Contato: ${contact}`,
    `Página: ${ctx.pageUrl}`,
    "",
    "Mensagem:",
    values.message,
  ].join("\n");
}
