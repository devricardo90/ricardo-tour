"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { submitTourRequest } from "@/app/actions/tour-request";
import { trackClientEvent } from "@/lib/analytics/client";
import { PUBLIC_CONTACT } from "@/lib/public-contact";
import {
  NOTES_MAX,
  PARTY_MAX,
  PARTY_MIN,
  buildTourWhatsAppUrl,
  todayInRio,
  validateTourRequest,
  type TourRequestErrors,
  type TourRequestField,
  type TourRequestValues,
} from "@/lib/tour-request";
import { resolveTourRequestCopy } from "@/components/site/tour/tour-request-copy";

const empty: TourRequestValues = { name: "", email: "", phone: "", date: "", party: "", notes: "" };
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
const inputClass = `h-12 w-full rounded-md border bg-white px-3 text-[15px] text-[var(--site-ink)] placeholder:text-[var(--site-ink-muted)] ${focus}`;
const FIELD_ORDER: TourRequestField[] = ["name", "email", "phone", "date", "party", "notes"];

type Status = "idle" | "submitting" | "success" | "failed" | "rate_limited";

// Guest tour request (RT-55): WhatsApp or a short request form. No account, no payment, no availability promise.
// The server action is called inside try/catch (not via <form action>), so a network failure shows a calm error with
// fallbacks and never a fake success; entered values are kept.
export function TourRequestForm({ tripId, title, locale, formAvailable = true }: { tripId: string; title: string; locale: string; formAvailable?: boolean }) {
  const t = resolveTourRequestCopy(locale);
  const uid = useId();
  const [values, setValues] = useState<TourRequestValues>(empty);
  const [errors, setErrors] = useState<TourRequestErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const id = (name: string) => `${uid}-${name}`;

  useEffect(() => {
    if (status === "success" || status === "failed" || status === "rate_limited") resultRef.current?.focus();
  }, [status]);

  const whatsappUrl = buildTourWhatsAppUrl({ locale, title, date: values.date, party: values.party });
  // Analytics reuse the existing RESERVE_CLICKED event type (a new type would need a database enum migration);
  // metadata carries the action and never any of the visitor's entered data.
  const track = (action: string) => void trackClientEvent({ type: "RESERVE_CLICKED", tripId, metadata: { action, locale, channel: "guest_request" } });

  function update(field: keyof TourRequestValues, value: string) {
    if (!started.current) {
      started.current = true;
      track("TOUR_REQUEST_STARTED");
    }
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field as TourRequestField] || (errors.contact && (field === "email" || field === "phone"))) {
      setErrors((e) => ({ ...e, [field]: undefined, ...(field === "email" || field === "phone" ? { contact: undefined } : {}) }));
    }
  }

  function focusFirstError(next: TourRequestErrors) {
    // Visual order: name, contact (email/phone; the contact-method error points at the e-mail field), date, party, notes.
    const first = FIELD_ORDER.find((f) => (f === "email" ? next.email || next.contact : next[f]));
    if (first) formRef.current?.querySelector<HTMLElement>(`[name='${first}']`)?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const clientErrors = validateTourRequest(values, todayInRio());
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }
    setStatus("submitting");
    setErrors({});
    try {
      const data = new FormData(event.currentTarget);
      data.set("tripId", tripId);
      data.set("locale", locale);
      const result = await submitTourRequest(data);
      if (result.ok) {
        track("TOUR_REQUEST_SUBMITTED");
        setStatus("success");
      } else if (result.reason === "invalid") {
        setErrors(result.errors);
        setStatus("idle");
        focusFirstError(result.errors);
      } else {
        track("TOUR_REQUEST_FAILED");
        setStatus(result.reason === "rate_limited" ? "rate_limited" : "failed");
      }
    } catch {
      track("TOUR_REQUEST_FAILED");
      setStatus("failed");
    }
  }

  const fallback = (
    <div className="mt-4 flex flex-col gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsappAria}
        onClick={() => track("TOUR_WHATSAPP_CLICKED")}
        data-testid="tour-whatsapp"
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--site-cream)] ${focus}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {t.whatsapp} · {PUBLIC_CONTACT.whatsappDisplay}
      </a>
      <p className="flex flex-wrap items-center justify-center gap-x-2 text-[14px] text-[var(--site-ink-muted)]">
        <span>{t.emailFallback}</span>
        <a href={PUBLIC_CONTACT.mailto} className={`inline-flex min-h-11 items-center gap-1.5 text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
          <Mail className="h-4 w-4" aria-hidden="true" />
          {PUBLIC_CONTACT.email}
        </a>
      </p>
    </div>
  );

  // Owner 31/10/2026: without an available Privacy Policy, no fields at all; WhatsApp and e-mail stay.
  if (!formAvailable) {
    return (
      <div data-testid="tour-request-paused">
        <h2 className="site-display text-[28px] font-medium leading-[1.1]">{t.heading}</h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-[var(--site-ink-muted)]">{t.introNoForm}</p>
        {fallback}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" data-testid="tour-request-success" className="outline-none">
        <h2 className="site-display text-[28px] font-medium leading-[1.1]">{t.successTitle}</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.successBody}</p>
        {fallback}
      </div>
    );
  }

  const labelClass = "block text-[14px] font-medium text-[var(--site-ink)]";
  const errorText = (field: TourRequestField) => (errors[field] ? t.errors[errors[field]!] : null);
  const describe = (field: TourRequestField, extra?: string) => [errors[field] ? id(`${field}-err`) : null, extra].filter(Boolean).join(" ") || undefined;
  const border = (field: TourRequestField) => (errors[field] ? "border-[#B3261E]" : "border-[var(--site-rule-light)]");
  const contactErr = errors.contact ? t.errors.contact_required : null;

  return (
    <div>
      <h2 className="site-display text-[28px] font-medium leading-[1.1]">{t.heading}</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--site-ink-muted)]">{t.intro}</p>

      {status === "failed" || status === "rate_limited" ? (
        <div ref={resultRef} tabIndex={-1} role="alert" data-testid="tour-request-failure" className="mt-4 rounded-md border border-[#B3261E] bg-[#FBEAE8] p-4 text-[14px] leading-[1.55] text-[var(--site-ink)] outline-none">
          <p className="font-semibold">{t.failureTitle}</p>
          <p className="mt-1">{status === "rate_limited" ? t.rateLimited : t.failureBody}</p>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-5 space-y-4" data-testid="tour-request-form">
        {Object.keys(errors).length > 0 ? (
          <p role="alert" className="rounded-md border border-[#B3261E] bg-[#FBEAE8] px-3 py-2 text-[14px] text-[#7A1712]">{t.summary}</p>
        ) : null}

        {/* Honeypot: hidden from people and assistive tech; bots that fill it are ignored by the server. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor={id("name")} className={labelClass}>{t.name} <span aria-hidden="true">*</span></label>
          <input id={id("name")} name="name" type="text" autoComplete="name" required aria-required="true" aria-invalid={!!errors.name} aria-describedby={describe("name")} value={values.name} onChange={(e) => update("name", e.target.value)} className={`${inputClass} mt-1.5 ${border("name")}`} />
          {errorText("name") ? <p id={id("name-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("name")}</p> : null}
        </div>

        <div className="space-y-4" role="group" aria-labelledby={id("contact-hint")}>
          <p id={id("contact-hint")} className="text-[13px] text-[var(--site-ink-muted)]">{t.contactHint}</p>
          <div>
            <label htmlFor={id("email")} className={labelClass}>{t.email}</label>
            <input id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!(errors.email || errors.contact)} aria-describedby={[errors.email ? id("email-err") : null, errors.contact ? id("contact-err") : null].filter(Boolean).join(" ") || undefined} value={values.email} onChange={(e) => update("email", e.target.value)} className={`${inputClass} mt-1.5 ${errors.email || errors.contact ? "border-[#B3261E]" : "border-[var(--site-rule-light)]"}`} />
            {errorText("email") ? <p id={id("email-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("email")}</p> : null}
          </div>
          <div>
            <label htmlFor={id("phone")} className={labelClass}>{t.phone}</label>
            <input id={id("phone")} name="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!(errors.phone || errors.contact)} aria-describedby={[errors.phone ? id("phone-err") : null, errors.contact ? id("contact-err") : null].filter(Boolean).join(" ") || undefined} value={values.phone} onChange={(e) => update("phone", e.target.value)} className={`${inputClass} mt-1.5 ${errors.phone || errors.contact ? "border-[#B3261E]" : "border-[var(--site-rule-light)]"}`} />
            {errorText("phone") ? <p id={id("phone-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("phone")}</p> : null}
          </div>
          {contactErr ? <p id={id("contact-err")} className="text-[13px] text-[#B3261E]">{contactErr}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={id("date")} className={labelClass}>{t.date} <span aria-hidden="true">*</span></label>
            <input id={id("date")} name="date" type="date" required aria-required="true" min={todayInRio()} suppressHydrationWarning aria-invalid={!!errors.date} aria-describedby={describe("date")} value={values.date} onChange={(e) => update("date", e.target.value)} className={`${inputClass} mt-1.5 ${border("date")} focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--site-gold-deep)]`} />
            {errorText("date") ? <p id={id("date-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("date")}</p> : null}
          </div>
          <div>
            <label htmlFor={id("party")} className={labelClass}>{t.party} <span aria-hidden="true">*</span></label>
            <input id={id("party")} name="party" type="number" inputMode="numeric" min={PARTY_MIN} max={PARTY_MAX} step={1} required aria-required="true" aria-invalid={!!errors.party} aria-describedby={describe("party")} value={values.party} onChange={(e) => update("party", e.target.value)} className={`${inputClass} mt-1.5 ${border("party")}`} />
            {errorText("party") ? <p id={id("party-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("party")}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor={id("notes")} className={labelClass}>{t.notes} <span className="font-normal text-[var(--site-ink-muted)]">{t.optional}</span></label>
          <textarea id={id("notes")} name="notes" rows={3} maxLength={NOTES_MAX + 200} aria-invalid={!!errors.notes} aria-describedby={describe("notes")} value={values.notes} onChange={(e) => update("notes", e.target.value)} className={`w-full rounded-md border bg-white px-3 py-2.5 text-[15px] text-[var(--site-ink)] ${focus} mt-1.5 ${border("notes")}`} />
          {errorText("notes") ? <p id={id("notes-err")} className="mt-1 text-[13px] text-[#B3261E]">{errorText("notes")}</p> : null}
        </div>

        <button type="submit" disabled={status === "submitting"} aria-busy={status === "submitting"} className={`inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-charcoal-raised)] disabled:opacity-60 ${focus}`}>
          {status === "submitting" ? t.sending : t.submit}
        </button>
      </form>

      {fallback}
    </div>
  );
}
