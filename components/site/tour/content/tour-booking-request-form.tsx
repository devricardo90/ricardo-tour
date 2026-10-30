"use client";

import { useId, useState } from "react";
import { submitPrivateBookingRequest, type BookingRequestErrors, type BookingRequestState } from "@/app/actions/private-booking-request";
import { quoteGroupPrice, splitDeposit } from "@/lib/commerce/group-pricing";
import { formatBrl } from "@/lib/commerce/money";
import { todayInRio } from "@/lib/tour-request";

type Lang = "pt" | "en" | "es";
const COPY = {
  pt: {
    title: "Solicitar reserva",
    intro: "Escolha a data e o número de participantes. Você recebe a confirmação da disponibilidade e as instruções do sinal pela equipe; nada é cobrado agora.",
    date: "Data do passeio",
    dateHint: "O horário de início é combinado com a equipe.",
    party: "Participantes",
    person: (n: number) => (n === 1 ? "1 pessoa" : `${n} pessoas`),
    infants: "Viaja com bebê de 0 a 2 anos? Fale com a equipe pelo WhatsApp antes de solicitar.",
    adultsOnly: "Passeio somente para adultos (18 anos ou mais).",
    infantsCount: "Dos quais, crianças de 0 a 2 anos",
    infantsRule: "Crianças de 0 a 2 anos pagam 50% da tarifa individual e contam no limite de 4 pessoas.",
    noInfants: "Nenhuma",
    name: "Nome completo",
    email: "E-mail",
    phone: "WhatsApp / telefone",
    pickup: "Hotel ou endereço de busca",
    optional: "(opcional)",
    notes: "Observações",
    total: "Total do grupo",
    deposit: "Sinal de 30% (após a confirmação da disponibilidade)",
    balance: "Saldo de 70% (no início do passeio)",
    priceNote: "Preço fechado para o grupo, não por pessoa.",
    submit: "Enviar solicitação",
    sending: "Enviando...",
    successTitle: "Solicitação recebida",
    successBody: (ref: string) => `Referência ${ref}. A equipe confere a disponibilidade e envia as instruções do sinal. A reserva só fica confirmada depois do sinal.`,
    errors: {
      required: "Preencha este campo.",
      invalid: "Confira este campo.",
      too_long: "Texto muito longo.",
      date_not_allowed: "Escolha uma data com pelo menos 24 horas de antecedência. Antes disso, a reserva é sob consulta pelo WhatsApp.",
      party_invalid: "Escolha o número de participantes.",
    },
    summary: "Confira os campos destacados.",
    date_unavailable: "Esta data não está disponível. Escolha outra data ou fale com a equipe pelo WhatsApp.",
    not_available: "A reserva online não está disponível para este passeio. Fale com a equipe pelo WhatsApp.",
    rate_limited: "Muitas tentativas em pouco tempo. Aguarde alguns minutos ou fale com a equipe pelo WhatsApp.",
    busy: "Muitas solicitações para esta data agora. Tente novamente em instantes.",
    unavailable: "Não foi possível enviar agora. Tente novamente ou fale com a equipe pelo WhatsApp.",
  },
  en: {
    title: "Request a booking",
    intro: "Choose the date and the number of guests. Our team confirms availability and sends the deposit instructions; nothing is charged now.",
    date: "Tour date",
    dateHint: "The start time is arranged with our team.",
    party: "Guests",
    person: (n: number) => (n === 1 ? "1 person" : `${n} people`),
    infants: "Travelling with a baby aged 0 to 2? Please message us on WhatsApp before requesting.",
    adultsOnly: "Adults only (18 and over).",
    infantsCount: "Of which, children aged 0–2",
    infantsRule: "Children aged 0–2 pay 50% of the individual fare and count toward the limit of 4 guests.",
    noInfants: "None",
    name: "Full name",
    email: "E-mail",
    phone: "WhatsApp / phone",
    pickup: "Hotel or pickup address",
    optional: "(optional)",
    notes: "Notes",
    total: "Group total",
    deposit: "30% deposit (after availability is confirmed)",
    balance: "70% balance (at the start of the tour)",
    priceNote: "Closed price for the whole group, not per person.",
    submit: "Send request",
    sending: "Sending...",
    successTitle: "Request received",
    successBody: (ref: string) => `Reference ${ref}. Our team checks availability and sends the deposit instructions. The booking is confirmed only after the deposit.`,
    errors: {
      required: "Please fill in this field.",
      invalid: "Please check this field.",
      too_long: "This text is too long.",
      date_not_allowed: "Choose a date at least 24 hours ahead. Sooner than that, booking is on request via WhatsApp.",
      party_invalid: "Choose the number of guests.",
    },
    summary: "Please check the highlighted fields.",
    date_unavailable: "This date is not available. Choose another date or message us on WhatsApp.",
    not_available: "Online booking is not available for this tour. Please message us on WhatsApp.",
    rate_limited: "Too many attempts in a short time. Please wait a few minutes or message us on WhatsApp.",
    busy: "Many requests for this date right now. Please try again shortly.",
    unavailable: "We could not send it now. Please try again or message us on WhatsApp.",
  },
  es: {
    title: "Solicitar reserva",
    intro: "Elige la fecha y el número de participantes. El equipo confirma la disponibilidad y envía las instrucciones de la seña; no se cobra nada ahora.",
    date: "Fecha del tour",
    dateHint: "El horario de inicio se acuerda con el equipo.",
    party: "Participantes",
    person: (n: number) => (n === 1 ? "1 persona" : `${n} personas`),
    infants: "¿Viajas con un bebé de 0 a 2 años? Escríbenos por WhatsApp antes de solicitar.",
    adultsOnly: "Paseo solo para adultos (18 años o más).",
    infantsCount: "De ellos, niños de 0 a 2 años",
    infantsRule: "Los niños de 0 a 2 años pagan el 50% de la tarifa individual y cuentan dentro del límite de 4 personas.",
    noInfants: "Ninguno",
    name: "Nombre completo",
    email: "Correo electrónico",
    phone: "WhatsApp / teléfono",
    pickup: "Hotel o dirección de recogida",
    optional: "(opcional)",
    notes: "Observaciones",
    total: "Total del grupo",
    deposit: "Seña del 30% (tras confirmar la disponibilidad)",
    balance: "Saldo del 70% (al inicio del tour)",
    priceNote: "Precio cerrado para el grupo, no por persona.",
    submit: "Enviar solicitud",
    sending: "Enviando...",
    successTitle: "Solicitud recibida",
    successBody: (ref: string) => `Referencia ${ref}. El equipo verifica la disponibilidad y envía las instrucciones de la seña. La reserva solo queda confirmada después de la seña.`,
    errors: {
      required: "Completa este campo.",
      invalid: "Revisa este campo.",
      too_long: "Texto demasiado largo.",
      date_not_allowed: "Elige una fecha con al menos 24 horas de antelación. Antes de eso, la reserva es bajo consulta por WhatsApp.",
      party_invalid: "Elige el número de participantes.",
    },
    summary: "Revisa los campos destacados.",
    date_unavailable: "Esta fecha no está disponible. Elige otra fecha o escríbenos por WhatsApp.",
    not_available: "La reserva en línea no está disponible para este tour. Escríbenos por WhatsApp.",
    rate_limited: "Demasiados intentos en poco tiempo. Espera unos minutos o escríbenos por WhatsApp.",
    busy: "Muchas solicitudes para esta fecha ahora. Inténtalo de nuevo en breve.",
    unavailable: "No fue posible enviarla ahora. Inténtalo de nuevo o escríbenos por WhatsApp.",
  },
} as const;

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-focus,#E8C780)]";
const input = `mt-1.5 h-12 w-full rounded-md border bg-[var(--site-charcoal,#0B0E11)] px-3 text-[15px] text-[var(--site-on-dark,#F4F0E8)] ${focus}`;
const label = "block text-[14px] font-medium text-[var(--site-on-dark,#F4F0E8)]";
const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * RT-124 (27/10/2026, local): booking request inside the approved tour page's "Solicitar" section. Shown only where the
 * price is approved and may be displayed; it creates a PENDING booking (nothing charged, nothing confirmed).
 */
export function TourBookingRequestForm({ tripId, locale, mode, groupTotalCents, adultsOnly = false, meetingPoint = false, infantHalfFare = false, optionNote }: { tripId: string; locale: string; mode: "public" | "lab"; groupTotalCents: Record<number, number>; adultsOnly?: boolean; meetingPoint?: boolean; infantHalfFare?: boolean; optionNote?: string }) {
  const t = COPY[(locale === "en" || locale === "es" ? locale : "pt") as Lang];
  const uid = useId();
  const sizes = Object.keys(groupTotalCents).map(Number).sort((a, b) => a - b);
  const [party, setParty] = useState<number | null>(null);
  const [infants, setInfants] = useState(0);
  const [errors, setErrors] = useState<BookingRequestErrors>({});
  const [result, setResult] = useState<BookingRequestState | null>(null);
  const [sending, setSending] = useState(false);
  const today = todayInRio();
  const childCount = party && infantHalfFare ? Math.min(infants, party - 1) : 0;
  const split = party ? splitDeposit(quoteGroupPrice({ currency: "BRL", groupTotalCents }, { fullFare: party - childCount, infants: childCount }).totalCents) : null;
  const money = (cents: number) => formatBrl(cents, locale === "en" ? "en-US" : locale === "es" ? "es" : "pt-BR");
  const err = (field: keyof BookingRequestErrors) => (errors[field] ? t.errors[errors[field]!] : null);
  const border = (field: keyof BookingRequestErrors) => (errors[field] ? "border-[#F2B8B5]" : "border-white/15");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setErrors({});
    try {
      const data = new FormData(event.currentTarget);
      data.set("tripId", tripId);
      data.set("locale", locale);
      data.set("mode", mode);
      const state = await submitPrivateBookingRequest(data);
      setResult(state);
      if (!state.ok && state.reason === "invalid") setErrors(state.errors);
    } catch {
      setResult({ ok: false, reason: "unavailable" });
    } finally {
      setSending(false);
    }
  }

  if (result?.ok) {
    return (
      <div role="status" data-testid="booking-request-success" className="mt-6 rounded-lg border border-[var(--site-gold,#C8A86B)]/40 p-5">
        <p className="text-[18px] font-semibold text-[var(--site-on-dark,#F4F0E8)]">{t.successTitle}</p>
        <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.successBody(result.reference)}</p>
        <dl className="mt-4 space-y-1 text-[15px] text-[var(--site-on-dark,#F4F0E8)]">
          <div className="flex justify-between gap-4"><dt>{t.total}</dt><dd className="font-semibold">{money(result.totalCents)}</dd></div>
          <div className="flex justify-between gap-4"><dt>{t.deposit}</dt><dd>{money(result.depositCents)}</dd></div>
          <div className="flex justify-between gap-4"><dt>{t.balance}</dt><dd>{money(result.balanceCents)}</dd></div>
        </dl>
      </div>
    );
  }

  const failure = result && !result.ok && result.reason !== "invalid" ? t[result.reason] : null;
  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4" data-testid="booking-request-form" aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`} className="text-[20px] font-semibold text-[var(--site-on-dark,#F4F0E8)]">{t.title}</h3>
      <p className="max-w-[60ch] text-[15px] leading-[1.6] text-[var(--site-on-dark-muted,#CAC7BF)]">{t.intro}</p>
      {optionNote ? <p className="max-w-[60ch] text-[14px] leading-[1.5] text-[var(--site-on-dark,#F4F0E8)]" data-testid="booking-request-option-note">{optionNote}</p> : null}
      {failure ? <p role="alert" className="rounded-md border border-[#F2B8B5]/60 bg-[#F2B8B5]/10 px-3 py-2 text-[14px] text-[var(--site-on-dark,#F4F0E8)]">{failure}</p> : null}
      {Object.keys(errors).length > 0 ? <p role="alert" className="text-[14px] text-[#F2B8B5]">{t.summary}</p> : null}

      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="company_website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-date`} className={label}>{t.date}</label>
          <input id={`${uid}-date`} name="date" type="date" required min={addDays(today, 1)} max={addDays(today, 365)} suppressHydrationWarning aria-invalid={!!errors.date} className={`${input} ${border("date")} [color-scheme:dark]`} />
          <p className="mt-1 text-[13px] text-[var(--site-on-dark-subtle,#9DA3A5)]">{err("date") ?? t.dateHint}</p>
        </div>
        <div>
          <label htmlFor={`${uid}-party`} className={label}>{t.party}</label>
          <select id={`${uid}-party`} name="party" required defaultValue="" onChange={(e) => setParty(Number(e.target.value) || null)} aria-invalid={!!errors.party} className={`${input} ${border("party")}`}>
            <option value="" disabled>—</option>
            {sizes.map((n) => <option key={n} value={n}>{t.person(n)}</option>)}
          </select>
          <p className="mt-1 text-[13px] text-[var(--site-on-dark-subtle,#9DA3A5)]">{err("party") ?? (adultsOnly ? t.adultsOnly : infantHalfFare ? t.infantsRule : t.infants)}</p>
        </div>
        {infantHalfFare && party && party > 1 ? (
          <div>
            <label htmlFor={`${uid}-infants`} className={label}>{t.infantsCount}</label>
            <select id={`${uid}-infants`} name="infants" value={childCount} onChange={(e) => setInfants(Number(e.target.value) || 0)} className={`${input} border-white/15`} data-testid="booking-request-infants">
              {Array.from({ length: party }, (_, n) => n).map((n) => <option key={n} value={n}>{n === 0 ? t.noInfants : n}</option>)}
            </select>
          </div>
        ) : null}
      </div>

      {split ? (
        <dl data-testid="booking-request-price" className="rounded-lg border border-white/10 p-4 text-[15px] text-[var(--site-on-dark,#F4F0E8)]">
          <div className="flex justify-between gap-4"><dt>{t.total}</dt><dd className="text-[18px] font-semibold">{money(split.totalCents)}</dd></div>
          <div className="mt-1 flex justify-between gap-4 text-[var(--site-on-dark-muted,#CAC7BF)]"><dt>{t.deposit}</dt><dd>{money(split.depositCents)}</dd></div>
          <div className="mt-1 flex justify-between gap-4 text-[var(--site-on-dark-muted,#CAC7BF)]"><dt>{t.balance}</dt><dd>{money(split.balanceCents)}</dd></div>
          <p className="mt-2 text-[13px] text-[var(--site-on-dark-subtle,#9DA3A5)]">{t.priceNote}</p>
        </dl>
      ) : null}

      <div>
        <label htmlFor={`${uid}-name`} className={label}>{t.name}</label>
        <input id={`${uid}-name`} name="name" type="text" autoComplete="name" required maxLength={120} aria-invalid={!!errors.name} className={`${input} ${border("name")}`} />
        {err("name") ? <p className="mt-1 text-[13px] text-[#F2B8B5]">{err("name")}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-email`} className={label}>{t.email}</label>
          <input id={`${uid}-email`} name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} aria-invalid={!!errors.email} className={`${input} ${border("email")}`} />
          {err("email") ? <p className="mt-1 text-[13px] text-[#F2B8B5]">{err("email")}</p> : null}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={label}>{t.phone}</label>
          <input id={`${uid}-phone`} name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={24} aria-invalid={!!errors.phone} className={`${input} ${border("phone")}`} />
          {err("phone") ? <p className="mt-1 text-[13px] text-[#F2B8B5]">{err("phone")}</p> : null}
        </div>
      </div>
      {meetingPoint ? null : (
        <div>
          <label htmlFor={`${uid}-pickup`} className={label}>{t.pickup} <span className="font-normal text-[var(--site-on-dark-subtle,#9DA3A5)]">{t.optional}</span></label>
          <input id={`${uid}-pickup`} name="pickup" type="text" maxLength={300} aria-invalid={!!errors.pickup} className={`${input} ${border("pickup")}`} />
        </div>
      )}
      <div>
        <label htmlFor={`${uid}-notes`} className={label}>{t.notes} <span className="font-normal text-[var(--site-on-dark-subtle,#9DA3A5)]">{t.optional}</span></label>
        <textarea id={`${uid}-notes`} name="notes" rows={3} maxLength={1000} aria-invalid={!!errors.notes} className={`mt-1.5 w-full rounded-md border bg-[var(--site-charcoal,#0B0E11)] px-3 py-2.5 text-[15px] text-[var(--site-on-dark,#F4F0E8)] ${focus} ${border("notes")}`} />
      </div>
      <button type="submit" disabled={sending} aria-busy={sending} className={`inline-flex min-h-12 w-full items-center justify-center rounded-[6px] border border-[var(--site-gold,#C8A86B)] bg-[var(--site-gold,#C8A86B)] px-6 text-[16px] font-semibold text-[var(--site-charcoal,#0B0E11)] hover:bg-[var(--site-gold-bright,#E8C780)] disabled:opacity-60 sm:w-auto ${focus}`}>
        {sending ? t.sending : t.submit}
      </button>
    </form>
  );
}
