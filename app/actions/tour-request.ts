"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPublicTripById } from "@/lib/catalog/public-trips";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedText } from "@/lib/types";
import { sendTourRequestNotification } from "@/lib/services/tour-request-notification";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/security/rate-limit";
import { buildStoredRequestMessage, normalizeValues, validateTourRequest, type TourRequestErrors } from "@/lib/tour-request";

// Guest tour request (RT-55): no account, no payment, no availability confirmation. It reuses the existing
// ContactSubmission table (no schema change): the tour context travels in the structured message, and the
// admin contacts view and the notification e-mail read it from there.
//
// Abuse protection (honest summary): server-side validation, Next's same-origin check for Server Actions, a hidden
// honeypot field, and a best-effort in-memory rate limit per IP. The rate limit is per server instance (not durable
// across serverless instances), so a shared store is launch debt if abuse appears.

export type TourRequestState =
  | { ok: true }
  | { ok: false; reason: "invalid"; errors: TourRequestErrors }
  | { ok: false; reason: "rate_limited" | "not_found" | "unavailable" };

const LOCALES = ["pt", "en", "es"] as const;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function submitTourRequest(formData: FormData): Promise<TourRequestState> {
  // Honeypot: real visitors never see or fill this field. Pretend success and store nothing.
  if (String(formData.get("company_website") ?? "").trim() !== "") return { ok: true };

  const h = await headers();
  if (limiter.isLimited(clientKeyFromHeaders(h))) return { ok: false, reason: "rate_limited" };

  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale = (LOCALES as readonly string[]).includes(rawLocale) ? rawLocale : "pt";
  const tripId = String(formData.get("tripId") ?? "");

  const values = normalizeValues({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    party: formData.get("party"),
    notes: formData.get("notes"),
  });
  const errors = validateTourRequest(values);
  if (Object.keys(errors).length > 0) return { ok: false, reason: "invalid", errors };

  // Visibility is decided by the shared public catalog gate; the title comes from the database, never from the client.
  const trip = await getPublicTripById(tripId);
  if (!trip) return { ok: false, reason: "not_found" };
  const tripTitle = getLocalizedField<string>(asLocalizedText(trip.title), "pt").trim();

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  const pageUrl = `${host ? `${proto}://${host}` : ""}/${locale}/tours/${trip.id}`;
  const message = buildStoredRequestMessage(values, { tripId: trip.id, tripTitle, locale, pageUrl });

  let submissionId: string;
  try {
    // ContactSubmission.email is required by the existing schema; it is "" when the visitor gave only a phone/WhatsApp.
    const created = await prisma.contactSubmission.create({
      data: { name: values.name, email: values.email, phone: values.phone || null, message },
    });
    submissionId = created.id;
  } catch (error) {
    console.error("[tour-request] could not store the request", error instanceof Error ? error.message : error);
    return { ok: false, reason: "unavailable" };
  }

  // The request is stored; notification problems are logged and never reported to the visitor as a failed request.
  await sendTourRequestNotification({ submissionId, tripTitle, message, replyTo: values.email || undefined });
  return { ok: true };
}
