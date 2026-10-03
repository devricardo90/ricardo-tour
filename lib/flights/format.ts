import type { FlightOfferView } from "@/lib/flights/types";

// Locale-aware formatting for the Flight Planner (RT-37 §23): dates, times, money and durations via Intl.
// Times are the LOCAL time of each airport and are read from the ISO local string, never converted through a timezone.

const INTL_LOCALE: Record<string, string> = { pt: "pt-BR", en: "en-GB", es: "es-ES" };
const intlLocale = (locale: string) => INTL_LOCALE[locale] ?? INTL_LOCALE.pt;

export function formatMoney(locale: string, currency: string, amount: number): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatDateShort(locale: string, ymd: string): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatDateWeekday(locale: string, ymd: string): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }).format(date);
}

/** "08:10" from "2026-11-03T08:10:00". 24-hour clock. */
export function formatClock(isoLocal: string): string {
  return isoLocal.slice(11, 16);
}

/** Whole-day difference between departure and arrival calendar dates ("+1"). */
export function dayOffset(departIso: string, arriveIso: string): number {
  const a = Date.UTC(+departIso.slice(0, 4), +departIso.slice(5, 7) - 1, +departIso.slice(8, 10));
  const b = Date.UTC(+arriveIso.slice(0, 4), +arriveIso.slice(5, 7) - 1, +arriveIso.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function formatDuration(minutes: number, units: { h: string; min: string }): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} ${units.min}`;
  if (m === 0) return `${h} ${units.h}`;
  return `${h} ${units.h} ${m} ${units.min}`;
}

export function offerTotalDurationMinutes(offer: FlightOfferView): number {
  return offer.directions.reduce((sum, d) => sum + d.durationMinutes, 0);
}

export function offerFirstDeparture(offer: FlightOfferView): string {
  return offer.directions[0]?.segments[0]?.departAt ?? "";
}
