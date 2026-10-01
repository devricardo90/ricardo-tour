"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendContactNotification } from "@/lib/services/tour-request-notification";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/security/rate-limit";
import { buildStoredContactMessage, normalizeContactValues, validateContactMessage, type ContactMessageErrors } from "@/lib/contact-message";

// General contact message (RT-56, /contato). Same pipeline as the RT-55 tour request: the message is stored in the
// existing ContactSubmission table first (no schema change), then a notification goes to the approved recipient with the
// current technically safe sender; a notification problem never loses the message or turns it into a visible failure.
//
// Abuse protection: server validation, Next's same-origin check for Server Actions, a hidden honeypot and a best-effort
// per-IP rate limit (per server instance; a durable shared limit is launch debt).
//
// Replaces the legacy submitContactForm for the migrated page: that action required an e-mail, had no protection,
// sent no notification and returned raw error messages to the visitor. It stays in place (unused) until cleanup.

export type ContactMessageState =
  | { ok: true }
  | { ok: false; reason: "invalid"; errors: ContactMessageErrors }
  | { ok: false; reason: "rate_limited" | "unavailable" };

const LOCALES = ["pt", "en", "es"] as const;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function submitContactMessage(formData: FormData): Promise<ContactMessageState> {
  // Honeypot: real visitors never see this field. Pretend success and store nothing.
  if (String(formData.get("company_website") ?? "").trim() !== "") return { ok: true };

  const h = await headers();
  if (limiter.isLimited(clientKeyFromHeaders(h))) return { ok: false, reason: "rate_limited" };

  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale = (LOCALES as readonly string[]).includes(rawLocale) ? rawLocale : "pt";
  const values = normalizeContactValues({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    message: formData.get("message"),
  });
  const errors = validateContactMessage(values);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  const message = buildStoredContactMessage(values, { locale, pageUrl: `${host ? `${proto}://${host}` : ""}/${locale}/contato` });

  let submissionId: string;
  try {
    // ContactSubmission.email is required by the existing schema; it is "" when the visitor gave only a phone/WhatsApp.
    const created = await prisma.contactSubmission.create({ data: { name: values.name, email: values.email, phone: values.phone || null, message } });
    submissionId = created.id;
  } catch (error) {
    console.error("[contact-message] could not store the message", error instanceof Error ? error.message : error);
    return { ok: false, reason: "unavailable" };
  }

  await sendContactNotification({ submissionId, subject: `Nova mensagem de contato: ${values.name}`, message, replyTo: values.email || undefined, logTag: "contact-message" });
  return { ok: true };
}
