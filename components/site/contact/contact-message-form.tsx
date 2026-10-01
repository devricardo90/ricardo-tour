"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { submitContactMessage } from "@/app/actions/contact-message";
import { PUBLIC_CONTACT, buildPublicWhatsAppUrl } from "@/lib/public-contact";
import { MESSAGE_MAX, validateContactMessage, type ContactMessageErrors, type ContactMessageField, type ContactMessageValues } from "@/lib/contact-message";
import { resolveContactCopy } from "@/components/site/contact/contact-copy";

const empty: ContactMessageValues = { name: "", email: "", phone: "", message: "" };
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";
const inputClass = `h-12 w-full rounded-md border bg-white px-3 text-[15px] text-[var(--site-ink)] ${focus}`;
const labelClass = "block text-[14px] font-medium text-[var(--site-ink)]";
const FIELD_ORDER: ContactMessageField[] = ["name", "email", "phone", "message"];

type Status = "idle" | "submitting" | "success" | "failed" | "rate_limited";

// General contact form (RT-56). The server action is called inside try/catch (not <form action>), so a network failure
// shows a calm error with fallbacks and never a fake success; entered values are kept.
export function ContactMessageForm({ locale }: { locale: string }) {
  const t = resolveContactCopy(locale);
  const uid = useId();
  const [values, setValues] = useState<ContactMessageValues>(empty);
  const [errors, setErrors] = useState<ContactMessageErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const id = (name: string) => `${uid}-${name}`;

  useEffect(() => {
    if (status === "success" || status === "failed" || status === "rate_limited") resultRef.current?.focus();
  }, [status]);

  function update(field: keyof ContactMessageValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field] || (errors.contact && (field === "email" || field === "phone"))) {
      setErrors((e) => ({ ...e, [field]: undefined, ...(field === "email" || field === "phone" ? { contact: undefined } : {}) }));
    }
  }

  function focusFirstError(next: ContactMessageErrors) {
    // Visual order: name, contact (the contact-method error points at the e-mail field), message.
    const first = FIELD_ORDER.find((f) => (f === "email" ? next.email || next.contact : next[f]));
    if (first) formRef.current?.querySelector<HTMLElement>(`[name='${first}']`)?.focus();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    const clientErrors = validateContactMessage(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }
    setStatus("submitting");
    setErrors({});
    try {
      const data = new FormData(event.currentTarget);
      data.set("locale", locale);
      const result = await submitContactMessage(data);
      if (result.ok) setStatus("success");
      else if (result.reason === "invalid") {
        setErrors(result.errors);
        setStatus("idle");
        focusFirstError(result.errors);
      } else setStatus(result.reason === "rate_limited" ? "rate_limited" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  const fallback = (
    <div className="mt-4 flex flex-col gap-3">
      <a
        href={buildPublicWhatsAppUrl(t.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.whatsappAria}
        data-testid="contact-whatsapp-fallback"
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--site-cream)] ${focus}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {t.whatsapp} · {PUBLIC_CONTACT.whatsappDisplay}
      </a>
      <a href={PUBLIC_CONTACT.mailto} className={`inline-flex min-h-11 items-center justify-center gap-2 text-[14px] text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] ${focus}`}>
        <Mail className="h-4 w-4" aria-hidden="true" />
        {PUBLIC_CONTACT.email}
      </a>
    </div>
  );

  if (status === "success") {
    return (
      <div ref={resultRef} tabIndex={-1} role="status" data-testid="contact-success" className="outline-none">
        <h2 className="site-display text-[28px] font-medium leading-[1.1]">{t.successTitle}</h2>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.successBody}</p>
        {fallback}
      </div>
    );
  }

  const err = (field: ContactMessageField) => (errors[field] ? t.errors[errors[field]!] : null);
  const border = (invalid: boolean) => (invalid ? "border-[#B3261E]" : "border-[var(--site-rule-light)]");
  const contactInvalid = !!errors.contact;

  return (
    <div>
      <h2 className="site-display text-[28px] font-medium leading-[1.1]">{t.formHeading}</h2>
      <p className="mt-2 text-[14px] leading-[1.6] text-[var(--site-ink-muted)]">{t.formIntro}</p>

      {status === "failed" || status === "rate_limited" ? (
        <div ref={resultRef} tabIndex={-1} role="alert" data-testid="contact-failure" className="mt-4 rounded-md border border-[#B3261E] bg-[#FBEAE8] p-4 text-[14px] leading-[1.55] text-[var(--site-ink)] outline-none">
          <p className="font-semibold">{t.failureTitle}</p>
          <p className="mt-1">{status === "rate_limited" ? t.rateLimited : t.failureBody}</p>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-5 space-y-4" data-testid="contact-form">
        {Object.keys(errors).length > 0 ? <p role="alert" className="rounded-md border border-[#B3261E] bg-[#FBEAE8] px-3 py-2 text-[14px] text-[#7A1712]">{t.summary}</p> : null}

        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor={id("name")} className={labelClass}>{t.name} <span aria-hidden="true">*</span></label>
          <input id={id("name")} name="name" type="text" autoComplete="name" required aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined} value={values.name} onChange={(e) => update("name", e.target.value)} className={`${inputClass} mt-1.5 ${border(!!errors.name)}`} />
          {err("name") ? <p id={id("name-err")} className="mt-1 text-[13px] text-[#B3261E]">{err("name")}</p> : null}
        </div>

        <div className="space-y-4" role="group" aria-labelledby={id("hint")}>
          <p id={id("hint")} className="text-[13px] text-[var(--site-ink-muted)]">{t.contactHint}</p>
          <div>
            <label htmlFor={id("email")} className={labelClass}>{t.emailField}</label>
            <input id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!(errors.email || contactInvalid)} aria-describedby={[errors.email ? id("email-err") : null, contactInvalid ? id("contact-err") : null].filter(Boolean).join(" ") || undefined} value={values.email} onChange={(e) => update("email", e.target.value)} className={`${inputClass} mt-1.5 ${border(!!(errors.email || contactInvalid))}`} />
            {err("email") ? <p id={id("email-err")} className="mt-1 text-[13px] text-[#B3261E]">{err("email")}</p> : null}
          </div>
          <div>
            <label htmlFor={id("phone")} className={labelClass}>{t.phone}</label>
            <input id={id("phone")} name="phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!(errors.phone || contactInvalid)} aria-describedby={[errors.phone ? id("phone-err") : null, contactInvalid ? id("contact-err") : null].filter(Boolean).join(" ") || undefined} value={values.phone} onChange={(e) => update("phone", e.target.value)} className={`${inputClass} mt-1.5 ${border(!!(errors.phone || contactInvalid))}`} />
            {err("phone") ? <p id={id("phone-err")} className="mt-1 text-[13px] text-[#B3261E]">{err("phone")}</p> : null}
          </div>
          {contactInvalid ? <p id={id("contact-err")} className="text-[13px] text-[#B3261E]">{t.errors.contact_required}</p> : null}
        </div>

        <div>
          <label htmlFor={id("message")} className={labelClass}>{t.message} <span aria-hidden="true">*</span></label>
          <textarea id={id("message")} name="message" rows={5} maxLength={MESSAGE_MAX + 200} required aria-required="true" aria-invalid={!!errors.message} aria-describedby={errors.message ? id("message-err") : undefined} value={values.message} onChange={(e) => update("message", e.target.value)} className={`w-full rounded-md border bg-white px-3 py-2.5 text-[15px] text-[var(--site-ink)] ${focus} mt-1.5 ${border(!!errors.message)}`} />
          {err("message") ? <p id={id("message-err")} className="mt-1 text-[13px] text-[#B3261E]">{err("message")}</p> : null}
        </div>

        <button type="submit" disabled={status === "submitting"} aria-busy={status === "submitting"} className={`inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-charcoal-raised)] disabled:opacity-60 ${focus}`}>
          {status === "submitting" ? t.sending : t.submit}
        </button>
      </form>

      {fallback}
    </div>
  );
}
