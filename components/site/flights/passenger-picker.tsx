"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import type { PassengerCounts, PassengerTypeConfig } from "@/lib/flights/types";
import { totalPassengers } from "@/lib/flights/validation";
import { fill, type FlightsCopy } from "@/components/site/flights/flights-copy";
import { errorText, fieldBorder, fieldClass, focusRing, labelClass, primaryButton } from "@/components/site/flights/styles";

// Passenger selector (RT-37 §9, §20, §22). Types, labels, limits and rules come from the ACTIVE PassengerTypeConfig:
// no age band or ratio is hard-coded here (provider-dependent, EXTERNAL_DECISION_REQUIRED). On mobile the panel is a
// bottom sheet; on desktop a popover. Esc closes and returns focus to the trigger.

type Props = {
  id: string;
  t: FlightsCopy;
  config: PassengerTypeConfig;
  counts: PassengerCounts;
  error?: string;
  onChange: (counts: PassengerCounts) => void;
};

export function PassengerPicker({ id, t, config, counts, error, onChange }: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const errId = `${id}-err`;
  const total = totalPassengers(counts);

  const typeLabel = (typeId: string, n: number) => {
    const entry = t.passengers.types[typeId];
    return entry ? (n === 1 ? entry.one : entry.other) : typeId;
  };

  const summary =
    config.types
      .filter((type) => (counts[type.id] ?? 0) > 0)
      .map((type) => `${counts[type.id]} ${typeLabel(type.id, counts[type.id] ?? 0)}`)
      .join(", ") || "0";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function step(typeId: string, delta: number) {
    const next = Math.max(0, (counts[typeId] ?? 0) + delta);
    onChange({ ...counts, [typeId]: next });
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
    >
      <span id={`${id}-label`} className={labelClass}>
        {t.form.passengers}
      </span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={error ? errId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`${fieldClass} ${fieldBorder(!!error)} mt-1.5 flex items-center justify-between gap-2 text-left`}
      >
        <span id={`${id}-value`} className="flex items-center gap-2 truncate">
          <Users className="h-4 w-4 shrink-0 text-[var(--site-ink-muted)]" aria-hidden="true" />
          {summary}
        </span>
      </button>

      {open ? <div className="fixed inset-0 z-40 bg-black/30 md:hidden" aria-hidden="true" /> : null}
      <div
        id={panelId}
        role="group"
        aria-label={t.passengers.sheetTitle}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-[var(--site-rule-light)] bg-white p-5 shadow-[0_-18px_40px_rgba(23,26,30,0.18)] md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:w-[340px] md:rounded-xl md:shadow-[0_18px_40px_rgba(23,26,30,0.14)]"
      >
        <p className="text-[14px] font-medium text-[var(--site-ink)]">{t.passengers.sheetTitle}</p>
        <ul className="mt-3 divide-y divide-[var(--site-rule-light)]">
          {config.types.map((type) => {
            const n = counts[type.id] ?? 0;
            const atMax = (type.max !== undefined && n >= type.max) || (config.maxTotal !== undefined && total >= config.maxTotal);
            const atMin = n <= (type.min ?? 0);
            const singular = typeLabel(type.id, 1);
            return (
              <li key={type.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[15px] text-[var(--site-ink)]">{t.passengers.types[type.id]?.other ?? type.id}</p>
                  {type.ageHint ? <p className="text-[12px] text-[var(--site-ink-muted)]">{type.ageHint}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={fill(t.passengers.decrease, { type: singular })}
                    disabled={atMin}
                    onClick={() => step(type.id, -1)}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--fp-field-border)] text-[var(--site-ink)] disabled:opacity-40 ${focusRing}`}
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <output aria-live="polite" className="w-6 text-center text-[16px] font-medium tabular-nums">
                    {n}
                  </output>
                  <button
                    type="button"
                    aria-label={fill(t.passengers.increase, { type: singular })}
                    disabled={atMax}
                    onClick={() => step(type.id, 1)}
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--fp-field-border)] text-[var(--site-ink)] disabled:opacity-40 ${focusRing}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {config.isPlaceholder ? <p className="mt-3 text-[12px] leading-[1.5] text-[var(--site-ink-muted)]">{t.passengers.placeholderNote}</p> : null}
        <button type="button" onClick={close} className={`${primaryButton} mt-4 w-full`}>
          {t.passengers.done}
        </button>
      </div>

      {error ? (
        <p id={errId} className={errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
