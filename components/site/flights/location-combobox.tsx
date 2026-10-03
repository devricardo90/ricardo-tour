"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { FlightSource } from "@/lib/flights/source";
import type { PlaceOption, PlaceRef } from "@/lib/flights/types";
import { fill, type FlightsCopy } from "@/components/site/flights/flights-copy";
import { errorText, fieldBorder, fieldClass, focusRing, labelClass } from "@/components/site/flights/styles";

// Origin / destination combobox (RT-37 §5, §6, §22). ARIA 1.2 combobox + listbox: arrow keys, Enter to select, Esc to
// close. Free-typed text is never a location: the field stays invalid until a suggestion is chosen.
// Text is controlled by the parent so swap / deep-link prefill keep text and value in sync.

type Props = {
  id: string;
  label: string;
  locale: string;
  source: FlightSource;
  t: FlightsCopy;
  text: string;
  value: PlaceRef | null;
  error?: string;
  onTextChange: (text: string) => void;
  onSelect: (place: PlaceOption | null) => void;
};

export function LocationCombobox({ id, label, locale, source, t, text, value, error, onTextChange, onSelect }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loaded">("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState("");
  // Suggestions are only usable for the query they were fetched for: a stale list must never be selectable (Enter right
  // after typing would otherwise pick an option from the previous query).
  const [resultsQuery, setResultsQuery] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    if (query.trim().length < 2) return; // suggestions for another query are never shown (see liveOptions)
    const current = ++requestId.current;
    const timer = setTimeout(() => {
      source.searchPlaces(query, locale).then((found) => {
        if (current !== requestId.current) return;
        setOptions(found);
        setResultsQuery(query);
        setStatus("loaded");
        setActive(-1);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query, locale, source]);

  const liveOptions = resultsQuery === query ? options : [];
  const optionId = (i: number) => `${listId}-opt-${i}`;
  const showList = open && status === "loaded" && resultsQuery === query;
  const errId = `${id}-err`;

  function choose(option: PlaceOption) {
    onSelect(option);
    onTextChange(option.label);
    setQuery("");
    setOptions([]);
    setStatus("idle");
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (liveOptions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % liveOptions.length);
    } else if (event.key === "ArrowUp") {
      if (liveOptions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? liveOptions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (showList && active >= 0 && liveOptions[active]) {
        event.preventDefault();
        choose(liveOptions[active]);
      }
    } else if (event.key === "Escape") {
      if (showList) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  const liveMessage = showList ? (liveOptions.length > 0 ? fill(t.location.count, { n: liveOptions.length }) : t.location.noResults) : "";

  return (
    <div className="relative">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-expanded={showList && liveOptions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          placeholder={t.location.placeholder}
          value={text}
          onChange={(e) => {
            const next = e.target.value;
            onTextChange(next);
            if (value) onSelect(null);
            setQuery(next);
            setOpen(true);
          }}
          onFocus={() => {
            if (status === "loaded") setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
          }}
          onKeyDown={onKeyDown}
          className={`${fieldClass} ${fieldBorder(!!error)} ${text ? "pr-11" : ""}`}
        />
        {text ? (
          <button
            type="button"
            aria-label={`${t.location.clear}: ${label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onTextChange("");
              onSelect(null);
              setQuery("");
              setOptions([]);
              setStatus("idle");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className={`absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-[var(--site-ink-muted)] hover:text-[var(--site-ink)] ${focusRing}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label={`${label} — ${t.location.listLabel}`}
        hidden={!(showList && liveOptions.length > 0)}
        className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-[var(--site-rule-light)] bg-white py-1 shadow-[0_18px_40px_rgba(23,26,30,0.14)]"
      >
        {liveOptions.map((option, i) => (
          <li
            key={option.code}
            id={optionId(i)}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(option)}
            onMouseMove={() => setActive(i)}
            className={`flex min-h-11 cursor-pointer items-center px-3.5 py-2 text-[14px] text-[var(--site-ink)] ${i === active ? "bg-[var(--site-cream)]" : ""}`}
          >
            <span className={option.kind === "METRO" ? "font-medium" : ""}>{option.label}</span>
          </li>
        ))}
      </ul>

      {showList && liveOptions.length === 0 ? (
        <p className="absolute left-0 right-0 z-30 mt-1 rounded-lg border border-[var(--site-rule-light)] bg-white px-3.5 py-3 text-[14px] text-[var(--site-ink-muted)] shadow-[0_18px_40px_rgba(23,26,30,0.14)]">
          {t.location.noResults}
        </p>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
      {error ? (
        <p id={errId} className={errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
