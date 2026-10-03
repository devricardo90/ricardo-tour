"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Loader2, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getFlightSource } from "@/lib/flights/source";
import {
  FlightSourceError,
  type FlightErrorClass,
  type FlightOfferView,
  type FlightSearchCriteria,
  type FlightSearchForm,
  type FlightSort,
  type PlaceOption,
  type TripType,
} from "@/lib/flights/types";
import {
  FIELD_ORDER,
  toCriteria,
  todayYmd,
  totalPassengers,
  validateFlightForm,
  type FlightFieldKey,
  type FlightFormErrors,
} from "@/lib/flights/validation";
import { formatDateShort, offerFirstDeparture, offerTotalDurationMinutes } from "@/lib/flights/format";
import { parseCriteria, serializeCriteria } from "@/lib/flights/query";
import { fill, resolveFlightsCopy, totalForLabel } from "@/components/site/flights/flights-copy";
import { LocationCombobox } from "@/components/site/flights/location-combobox";
import { PassengerPicker } from "@/components/site/flights/passenger-picker";
import { OfferCard } from "@/components/site/flights/offer-card";
import { ValidationDialog, type DialogPhase } from "@/components/site/flights/validation-dialog";
import {
  alertBox,
  errorText,
  fieldBorder,
  fieldClass,
  focusRing,
  labelClass,
  linkButton,
  noticeBox,
  primaryButton,
  secondaryButton,
} from "@/components/site/flights/styles";

// Flight Planner prototype (RT-38), built from the RT-37 UX contract. MOCK ONLY: the UI depends on FlightSource
// (lib/flights/source.ts) and never builds offers itself. No provider calls, no payment, no order, no analytics.
// Not wired into the Home, header, footer or tour pages (Owner decision: HOME_ENTRY_INTEGRATION = OWNER_DECISION_REQUIRED).

const SLOW_SEARCH_MS = 8_000; // RT-37 §12: after this the loading message changes and Cancel is offered (PROPOSED value)

type SearchPhase =
  | { kind: "idle" }
  | { kind: "loading"; slow: boolean }
  | { kind: "cancelled" }
  | { kind: "empty" }
  | { kind: "results"; offers: FlightOfferView[]; partial: boolean }
  | { kind: "error"; errorClass: Exclude<FlightErrorClass, "VALIDATION_ERROR">; referenceId?: string };

// Product navigation only: tabs do not imply a shared backend or data model.
type Tab = "flights" | "hotels" | "flightHotel";

// Local palette for the planner only (transactional, neutral). Brand gold #C8A86B is decorative (tab accent); gold-deep stays for focus/text contrast.
const PLANNER_PALETTE = {
  "--site-cream": "#FAFAF8",
  "--site-rule-light": "#E2E2DF",
  "--fp-soft": "#F3F3F1",
  "--fp-notice-border": "#D6D6D3",
  "--fp-field-border": "#8F9296",
} as React.CSSProperties;

const FIELD_ID: Record<FlightFieldKey, string> = {
  origin: "fp-origin",
  destination: "fp-destination",
  departDate: "fp-depart",
  returnDate: "fp-return",
  passengers: "fp-passengers",
};

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function FlightPlanner({ locale }: { locale: string }) {
  const t = resolveFlightsCopy(locale);
  const source = useMemo(() => getFlightSource(), []);
  const config = source.passengerConfig;
  const defaultCounts = useMemo(() => Object.fromEntries(config.types.map((type) => [type.id, type.defaultCount])), [config]);

  const [tab, setTab] = useState<Tab>("flights");
  const [form, setForm] = useState<FlightSearchForm>({
    origin: null,
    destination: null,
    tripType: "ROUND_TRIP",
    departDate: "",
    returnDate: "",
    passengers: defaultCounts,
    cabin: "",
  });
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [errors, setErrors] = useState<FlightFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [today, setToday] = useState("");
  const [phase, setPhase] = useState<SearchPhase>({ kind: "idle" });
  const [criteria, setCriteria] = useState<FlightSearchCriteria | null>(null);
  const [sort, setSort] = useState<FlightSort>("RECOMMENDED");
  const [dialog, setDialog] = useState<DialogPhase | null>(null);
  const [selected, setSelected] = useState<FlightOfferView | null>(null);
  const [unavailableRefs, setUnavailableRefs] = useState<string[]>([]);
  const [scenario, setScenario] = useState(source.demo?.get() ?? "");
  const [summaryFocusTick, setSummaryFocusTick] = useState(0);

  const summaryRef = useRef<HTMLDivElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const validateAbort = useRef<AbortController | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ flights: null, hotels: null, flightHotel: null });

  // ---- mount: today's date, deep-link prefill (criteria only), demo scenario param ----
  useEffect(() => {
    setToday(todayYmd());
    const params = new URLSearchParams(window.location.search);
    const parsed = parseCriteria(params, config.types.map((type) => type.id));
    const scenarioParam = params.get("scenario");
    if (scenarioParam && source.demo) {
      source.demo.set(scenarioParam);
      setScenario(source.demo.get());
    }
    let cancelled = false;
    (async () => {
      const origin = parsed.originCode ? await source.getPlace(parsed.originCode, locale) : null;
      const destination = parsed.destinationCode ? await source.getPlace(parsed.destinationCode, locale) : null;
      if (cancelled) return;
      setForm((f) => ({
        ...f,
        origin: origin ?? f.origin,
        destination: destination ?? f.destination,
        tripType: parsed.tripType ?? f.tripType,
        departDate: parsed.departDate ?? f.departDate,
        returnDate: parsed.returnDate ?? f.returnDate,
        passengers: parsed.passengers ? { ...f.passengers, ...parsed.passengers } : f.passengers,
      }));
      if (origin) setOriginText(origin.label);
      if (destination) setDestText(destination.label);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      searchAbort.current?.abort();
      validateAbort.current?.abort();
      if (slowTimer.current) clearTimeout(slowTimer.current);
    },
    [],
  );

  // After the first submit attempt, keep the errors in step with the form so they clear as the user corrects them.
  useEffect(() => {
    if (!submitted) return;
    setErrors(validateFlightForm(form, config, today || todayYmd(), { origin: { text: originText }, destination: { text: destText } }));
  }, [form, originText, destText, submitted, today, config]);

  const update = useCallback(<K extends keyof FlightSearchForm>(key: K, value: FlightSearchForm[K]) => setForm((f) => ({ ...f, [key]: value })), []);

  // Same for the validation summary: focus only once it is in the DOM (tick bumps on each invalid submit).
  useEffect(() => {
    if (summaryFocusTick > 0) summaryRef.current?.focus();
  }, [summaryFocusTick]);

  // Move focus after the results/error region has committed (a rAF right after setPhase can run before the node exists).
  useEffect(() => {
    if (phase.kind === "results") resultsHeadingRef.current?.focus();
    else if (phase.kind === "error") failureRef.current?.focus();
  }, [phase]);

  const search = useCallback(
    async (c: FlightSearchCriteria) => {
      searchAbort.current?.abort();
      const controller = new AbortController();
      searchAbort.current = controller;
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setPhase({ kind: "loading", slow: false });
      setSelected(null);
      setUnavailableRefs([]);
      setDialog(null);
      slowTimer.current = setTimeout(() => setPhase((p) => (p.kind === "loading" ? { kind: "loading", slow: true } : p)), SLOW_SEARCH_MS);
      try {
        const result = await source.searchOffers(c, { signal: controller.signal });
        if (searchAbort.current !== controller) return;
        if (slowTimer.current) clearTimeout(slowTimer.current);
        setSort("RECOMMENDED");
        setPhase(result.offers.length === 0 ? { kind: "empty" } : { kind: "results", offers: result.offers, partial: result.partial });
      } catch (err) {
        if (searchAbort.current !== controller) return;
        if (slowTimer.current) clearTimeout(slowTimer.current);
        if (isAbort(err)) {
          setPhase({ kind: "cancelled" });
          return;
        }
        const errorClass = err instanceof FlightSourceError && err.errorClass !== "VALIDATION_ERROR" ? err.errorClass : "INTERNAL_ERROR";
        setPhase({ kind: "error", errorClass, referenceId: err instanceof FlightSourceError ? err.referenceId : undefined });
      }
    },
    [source],
  );

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const found = validateFlightForm(form, config, todayYmd(), { origin: { text: originText }, destination: { text: destText } });
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) {
      setSummaryFocusTick((n) => n + 1);
      return;
    }
    const c = toCriteria(form);
    setCriteria(c);
    window.history.replaceState(null, "", `${window.location.pathname}?${serializeCriteria(form).toString()}`);
    void search(c);
  }

  function cancelSearch() {
    searchAbort.current?.abort();
  }

  function focusForm() {
    document.getElementById(FIELD_ID.origin)?.focus();
    document.getElementById("flight-form")?.scrollIntoView({ block: "start" });
  }

  const selectOffer = useCallback(
    async (offer: FlightOfferView) => {
      validateAbort.current?.abort();
      const controller = new AbortController();
      validateAbort.current = controller;
      setSelected(offer);
      setDialog({ kind: "validating" });
      try {
        const result = await source.validateOffer(offer.offerRef, { signal: controller.signal });
        if (validateAbort.current !== controller) return;
        switch (result.status) {
          case "VALID":
            setDialog({ kind: "valid", total: result.newTotal ?? offer.price.total, currency: result.currency ?? offer.price.currency });
            break;
          case "PRICE_CHANGED":
            if (result.previousTotal === undefined || result.newTotal === undefined) setDialog({ kind: "failed" });
            else setDialog({ kind: "price_changed", previousTotal: result.previousTotal, newTotal: result.newTotal, currency: result.currency ?? offer.price.currency });
            break;
          case "UNAVAILABLE":
            setUnavailableRefs((refs) => [...refs, offer.offerRef]);
            setDialog({ kind: "unavailable" });
            break;
          case "STALE":
            setDialog({ kind: "stale" });
            break;
          default:
            setDialog({ kind: "failed" });
        }
      } catch (err) {
        if (validateAbort.current !== controller || isAbort(err)) return;
        setDialog({ kind: "failed" });
      }
    },
    [source],
  );

  function closeDialog() {
    validateAbort.current?.abort();
    setDialog(null);
    setSelected(null);
  }

  const sortedOffers = useMemo(() => {
    const list = phase.kind === "results" ? [...phase.offers] : [];
    if (sort === "LOWEST_PRICE") list.sort((a, b) => a.price.total - b.price.total);
    else if (sort === "SHORTEST") list.sort((a, b) => offerTotalDurationMinutes(a) - offerTotalDurationMinutes(b));
    else if (sort === "EARLIEST") list.sort((a, b) => offerFirstDeparture(a).localeCompare(offerFirstDeparture(b)));
    return list;
  }, [phase, sort]);

  const orderedTabs: Tab[] = ["flights", "hotels", "flightHotel"];
  function onTabKey(event: React.KeyboardEvent, current: Tab) {
    const index = orderedTabs.indexOf(current);
    let next: Tab | null = null;
    if (event.key === "ArrowRight") next = orderedTabs[(index + 1) % orderedTabs.length];
    else if (event.key === "ArrowLeft") next = orderedTabs[(index - 1 + orderedTabs.length) % orderedTabs.length];
    else if (event.key === "Home") next = orderedTabs[0];
    else if (event.key === "End") next = orderedTabs[orderedTabs.length - 1];
    if (next) {
      event.preventDefault();
      setTab(next);
      tabRefs.current[next]?.focus();
    }
  }

  const err = (key: FlightFieldKey) => (errors[key] ? t.errors[errors[key]!] : undefined);
  const errorKeys = FIELD_ORDER.filter((key) => errors[key]);
  const passengerCount = criteria ? totalPassengers(criteria.passengers) : totalPassengers(form.passengers);
  const loading = phase.kind === "loading";

  function swap() {
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
    setOriginText(destText);
    setDestText(originText);
  }

  const tabClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-t-lg border border-b-0 px-3 text-[14px] sm:px-5 sm:text-[15px] font-medium ${focusRing} ${
      active ? "border-[var(--site-rule-light)] bg-white text-[var(--site-ink)] shadow-[inset_0_2px_0_#C8A86B]" : "border-transparent text-[var(--site-ink-muted)] hover:text-[var(--site-ink)]"
    }`;

  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]" style={PLANNER_PALETTE}>
      <section aria-labelledby="flights-heading" className="px-5 pb-16 pt-8 md:px-10 md:pb-20 md:pt-10 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--site-ink-muted)] md:text-[13px]">{t.eyebrow}</p>
          <h1 id="flights-heading" className="site-display mt-2 text-balance text-[34px] font-medium leading-[1.05] md:text-[48px]">
            {t.heading}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.intro}</p>

          <div role="tablist" aria-label={t.tabs.label} className="mt-6 flex gap-1 max-sm:gap-0.5">
            {orderedTabs.map((id) => (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el;
                }}
                id={`fp-tab-${id}`}
                role="tab"
                type="button"
                aria-selected={tab === id}
                aria-controls={`fp-panel-${id}`}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(e) => onTabKey(e, id)}
                className={tabClass(tab === id)}
              >
                {id === "flights" ? t.tabs.flights : id === "hotels" ? t.tabs.hotels : t.tabs.flightHotel}
                {id !== "flights" ? <span className="ml-2 hidden rounded-full border border-[var(--site-rule-light)] px-2 py-0.5 text-[11px] font-normal text-[var(--site-ink-muted)] sm:inline">{t.tabs.soon}</span> : null}
              </button>
            ))}
          </div>

          {/* ---------------- Flights ---------------- */}
          <div id="fp-panel-flights" role="tabpanel" aria-labelledby="fp-tab-flights" hidden={tab !== "flights"} className="rounded-b-xl rounded-tr-xl border border-[var(--site-rule-light)] bg-white p-5 md:p-7">
            {source.isMock ? (
              <div role="note" data-testid="demo-banner" className={`${noticeBox} mb-6`}>
                <p className="font-semibold">{t.demo.bannerTitle}</p>
                <p className="mt-0.5">{t.demo.bannerBody}</p>
              </div>
            ) : null}

            <form id="flight-form" onSubmit={onSubmit} noValidate data-testid="flight-form" aria-label={t.form.heading}>
              {submitted && errorKeys.length > 0 ? (
                <div ref={summaryRef} tabIndex={-1} role="alert" data-testid="error-summary" className={`${alertBox} mb-5 outline-none`}>
                  <p className="font-semibold">{t.form.summaryTitle}</p>
                  <ul className="mt-2 list-disc pl-5">
                    {errorKeys.map((key) => (
                      <li key={key}>
                        <a
                          href={`#${FIELD_ID[key]}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(FIELD_ID[key])?.focus();
                          }}
                          className={`underline ${focusRing}`}
                        >
                          {err(key)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
                <LocationCombobox
                  id={FIELD_ID.origin}
                  label={t.form.origin}
                  locale={locale}
                  source={source}
                  t={t}
                  text={originText}
                  value={form.origin}
                  error={err("origin")}
                  onTextChange={setOriginText}
                  onSelect={(place: PlaceOption | null) => update("origin", place ? { code: place.code, label: place.label, metro: place.metro } : null)}
                />
                <button
                  type="button"
                  onClick={swap}
                  aria-label={t.form.swap}
                  className={`inline-flex h-12 w-12 items-center justify-center justify-self-center rounded-full border border-[var(--fp-field-border)] text-[var(--site-ink)] hover:bg-[var(--fp-soft)] md:mt-[26px] ${focusRing}`}
                >
                  <ArrowLeftRight className="h-4 w-4 max-md:rotate-90" aria-hidden="true" />
                </button>
                <LocationCombobox
                  id={FIELD_ID.destination}
                  label={t.form.destination}
                  locale={locale}
                  source={source}
                  t={t}
                  text={destText}
                  value={form.destination}
                  error={err("destination")}
                  onTextChange={setDestText}
                  onSelect={(place: PlaceOption | null) => update("destination", place ? { code: place.code, label: place.label, metro: place.metro } : null)}
                />
              </div>

              <div className="mt-4 grid items-start gap-4 md:grid-cols-4">
                <fieldset>
                  <legend className={labelClass}>{t.form.tripType}</legend>
                  <div className="mt-1.5 inline-flex rounded-lg border border-[var(--fp-field-border)] p-1">
                    {(["ROUND_TRIP", "ONE_WAY"] as TripType[]).map((value) => (
                      <label key={value} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="tripType"
                          value={value}
                          checked={form.tripType === value}
                          onChange={() => update("tripType", value)}
                          className="peer sr-only"
                        />
                        <span className="inline-flex min-h-10 items-center rounded-md px-3 text-[14px] text-[var(--site-ink)] peer-checked:bg-[var(--site-ink)] peer-checked:text-[var(--site-cream-soft)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--site-gold-deep)]">
                          {value === "ROUND_TRIP" ? t.form.roundTrip : t.form.oneWay}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor={FIELD_ID.departDate} className={labelClass}>
                    {t.form.departDate}
                  </label>
                  <input
                    id={FIELD_ID.departDate}
                    type="date"
                    min={today || undefined}
                    value={form.departDate}
                    aria-invalid={!!err("departDate")}
                    aria-describedby={err("departDate") ? `${FIELD_ID.departDate}-err` : undefined}
                    onChange={(e) => update("departDate", e.target.value)}
                    className={`${fieldClass} ${fieldBorder(!!err("departDate"))} mt-1.5`}
                  />
                  {err("departDate") ? (
                    <p id={`${FIELD_ID.departDate}-err`} className={errorText}>
                      {err("departDate")}
                    </p>
                  ) : null}
                </div>

                {form.tripType === "ROUND_TRIP" ? (
                  <div>
                    <label htmlFor={FIELD_ID.returnDate} className={labelClass}>
                      {t.form.returnDate}
                    </label>
                    <input
                      id={FIELD_ID.returnDate}
                      type="date"
                      min={form.departDate || today || undefined}
                      value={form.returnDate}
                      aria-invalid={!!err("returnDate")}
                      aria-describedby={err("returnDate") ? `${FIELD_ID.returnDate}-err` : undefined}
                      onChange={(e) => update("returnDate", e.target.value)}
                      className={`${fieldClass} ${fieldBorder(!!err("returnDate"))} mt-1.5`}
                    />
                    {err("returnDate") ? (
                      <p id={`${FIELD_ID.returnDate}-err`} className={errorText}>
                        {err("returnDate")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="hidden md:block" aria-hidden="true" />
                )}

                <PassengerPicker id={FIELD_ID.passengers} t={t} config={config} counts={form.passengers} error={err("passengers")} onChange={(counts) => update("passengers", counts)} />
              </div>

              {source.cabinSelectorSupported ? (
                <div className="mt-4 max-w-xs">
                  <label htmlFor="fp-cabin" className={labelClass}>
                    {t.form.cabin}
                  </label>
                  <select
                    id="fp-cabin"
                    value={form.cabin}
                    onChange={(e) => update("cabin", e.target.value)}
                    aria-describedby="fp-cabin-note"
                    className={`${fieldClass} ${fieldBorder(false)} mt-1.5`}
                  >
                    <option value="">{t.form.cabinAny}</option>
                    {Object.entries(t.form.cabinOptions).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p id="fp-cabin-note" className="mt-1 text-[12px] leading-[1.5] text-[var(--site-ink-muted)]">
                    {t.form.cabinNote}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 max-md:sticky max-md:bottom-0 max-md:-mx-5 max-md:border-t max-md:border-[var(--site-rule-light)] max-md:bg-white max-md:px-5 max-md:py-3">
                <button type="submit" disabled={loading} data-testid="search-submit" className={`${primaryButton} w-full md:w-auto md:min-w-[220px]`}>
                  {loading ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                  {loading ? t.form.searching : t.form.search}
                </button>
              </div>
            </form>

            {/* ---------------- Search outcome ---------------- */}
            <div className="mt-8" data-testid="search-outcome" data-phase={phase.kind}>
              {phase.kind === "loading" ? (
                <div>
                  <p role="status" aria-live="polite" data-testid="loading-message" className="flex items-center gap-2 text-[15px] text-[var(--site-ink)]">
                    <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                    {phase.slow ? t.loading.stillSearching : t.loading.searching}
                  </p>
                  {phase.slow ? (
                    <button type="button" onClick={cancelSearch} data-testid="cancel-search" className={`${secondaryButton} mt-3`}>
                      {t.loading.cancel}
                    </button>
                  ) : null}
                  <ul aria-hidden="true" className="mt-4 space-y-4">
                    {[0, 1, 2].map((i) => (
                      <li key={i} className="h-36 rounded-xl border border-[var(--site-rule-light)] bg-[var(--fp-soft)] motion-safe:animate-pulse" />
                    ))}
                  </ul>
                </div>
              ) : null}

              {phase.kind === "cancelled" ? (
                <p role="status" data-testid="cancelled-message" className={noticeBox}>
                  {t.loading.cancelled}
                </p>
              ) : null}

              {phase.kind === "empty" ? (
                <div ref={failureRef} data-testid="empty-state" className="rounded-xl border border-[var(--site-rule-light)] bg-[var(--site-cream)] p-5">
                  <h2 className="site-display text-[22px] font-medium leading-[1.15]">{t.empty.title}</h2>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.empty.body}</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={focusForm} className={secondaryButton}>
                      {t.empty.modify}
                    </button>
                    <Link href="/contato" className={linkButton}>
                      {t.failure.talk}
                    </Link>
                  </div>
                </div>
              ) : null}

              {phase.kind === "error" ? (
                <div ref={failureRef} tabIndex={-1} role="alert" data-testid="error-state" data-error-class={phase.errorClass} className={`${alertBox} outline-none`}>
                  <h2 className="site-display text-[22px] font-medium leading-[1.15]">{t.failure.byClass[phase.errorClass].title}</h2>
                  <p className="mt-1.5">{t.failure.byClass[phase.errorClass].body}</p>
                  {phase.referenceId ? (
                    <p className="mt-2 text-[13px]">
                      {t.failure.reference}: <span className="font-mono">{phase.referenceId}</span>
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button type="button" onClick={() => criteria && void search(criteria)} className={primaryButton}>
                      {t.failure.retry}
                    </button>
                    <button type="button" onClick={focusForm} className={secondaryButton}>
                      {t.failure.change}
                    </button>
                    <Link href="/contato" className={linkButton}>
                      {t.failure.talk}
                    </Link>
                  </div>
                </div>
              ) : null}

              {phase.kind === "results" && criteria ? (
                <section aria-labelledby="fp-results-heading" data-testid="results">
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-[var(--fp-soft)] p-4">
                    <div>
                      <h2 id="fp-results-heading" ref={resultsHeadingRef} tabIndex={-1} className="site-display text-[24px] font-medium leading-[1.1] outline-none">
                        {criteria.origin.code} → {criteria.destination.code}
                      </h2>
                      <p className="mt-1 text-[13px] text-[var(--site-ink-muted)]" aria-label={t.results.summary}>
                        {formatDateShort(locale, criteria.departDate)}
                        {criteria.returnDate ? ` – ${formatDateShort(locale, criteria.returnDate)}` : ""} · {totalForLabel(t, passengerCount)}
                      </p>
                    </div>
                    <button type="button" onClick={focusForm} className={secondaryButton}>
                      {t.results.modify}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <p role="status" aria-live="polite" data-testid="results-count" className="text-[14px] text-[var(--site-ink-muted)]">
                      {fill(t.results.count, { n: sortedOffers.length })}
                    </p>
                    <div>
                      <label htmlFor="fp-sort" className={labelClass}>
                        {t.results.sortLabel}
                      </label>
                      <select id="fp-sort" value={sort} onChange={(e) => setSort(e.target.value as FlightSort)} className={`${fieldClass} ${fieldBorder(false)} mt-1.5 min-w-[200px]`}>
                        {(Object.keys(t.results.sorts) as FlightSort[]).map((key) => (
                          <option key={key} value={key}>
                            {t.results.sorts[key]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {phase.partial ? (
                    <div role="status" data-testid="partial-notice" className={`${noticeBox} mt-4 flex flex-wrap items-center justify-between gap-3`}>
                      <p>{t.failure.partial}</p>
                      <button type="button" onClick={() => void search(criteria)} className={secondaryButton}>
                        {t.failure.retry}
                      </button>
                    </div>
                  ) : null}

                  <p className="mt-4 text-[13px] text-[var(--site-ink-muted)]">{t.results.priceNote}</p>

                  <ul className="mt-3 space-y-4" data-testid="offer-list">
                    {sortedOffers.map((offer) => (
                      <OfferCard
                        key={offer.offerRef}
                        offer={offer}
                        locale={locale}
                        t={t}
                        passengerCount={passengerCount}
                        selected={selected?.offerRef === offer.offerRef}
                        unavailable={unavailableRefs.includes(offer.offerRef)}
                        onSelect={(o) => void selectOffer(o)}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            {source.demo ? (
              <details className="mt-10 rounded-lg border border-dashed border-[var(--site-rule-light)] p-4" data-testid="demo-panel">
                <summary className={`cursor-pointer text-[13px] font-medium text-[var(--site-ink-muted)] ${focusRing}`}>{t.demo.panelTitle}</summary>
                <p className="mt-2 text-[12px] leading-[1.5] text-[var(--site-ink-muted)]">{t.demo.panelHelp}</p>
                <label htmlFor="fp-scenario" className={`${labelClass} mt-3`}>
                  {t.demo.scenarioLabel}
                </label>
                <select
                  id="fp-scenario"
                  value={scenario}
                  onChange={(e) => {
                    source.demo?.set(e.target.value);
                    setScenario(source.demo?.get() ?? "");
                  }}
                  className={`${fieldClass} ${fieldBorder(false)} mt-1.5 max-w-md`}
                >
                  {source.demo.scenarios.map((id) => (
                    <option key={id} value={id}>
                      {t.demo.scenarios[id] ?? id}
                    </option>
                  ))}
                </select>
              </details>
            ) : null}
          </div>

          {/* ---------------- Hotels / Flight + Hotel: not implemented (no search, no data, no provider) ---------------- */}
          {(["hotels", "flightHotel"] as const).map((id) => (
            <div key={id} id={`fp-panel-${id}`} role="tabpanel" aria-labelledby={`fp-tab-${id}`} hidden={tab !== id} data-testid={`coming-soon-${id}`} className="rounded-b-xl rounded-tr-xl border border-[var(--site-rule-light)] bg-white p-5 md:p-7">
              <h2 className="site-display text-[28px] font-medium leading-[1.1]">{id === "hotels" ? t.comingSoon.hotelsHeading : t.comingSoon.flightHotelHeading}</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.comingSoon.body}</p>
            </div>
          ))}

          {/* Separate Ricardo Tour catalog domain: non-invasive pointer only, not a distribution product. */}
          {tab === "flights" ? (
            <aside aria-labelledby="fp-extras-heading" data-testid="trip-extras" className="mt-8 border-t border-[var(--site-rule-light)] pt-6">
              <h2 id="fp-extras-heading" className="site-display text-[22px] font-medium leading-[1.1]">{t.tripExtras.heading}</h2>
              <p className="mt-2 max-w-xl text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{t.tripExtras.body}</p>
              <p className="mt-3">
                <Link href="/tours" data-testid="experiences-link" className={linkButton}>
                  {t.tripExtras.link} <span aria-hidden="true">→</span>
                </Link>
              </p>
            </aside>
          ) : null}
        </div>
      </section>

      <ValidationDialog
        phase={dialog}
        offer={selected}
        locale={locale}
        t={t}
        onBack={closeDialog}
        onAccept={() => {
          if (dialog?.kind === "price_changed") setDialog({ kind: "valid", total: dialog.newTotal, currency: dialog.currency });
        }}
        onContinue={() => setDialog({ kind: "handoff" })}
        onSearchAgain={() => {
          closeDialog();
          if (criteria) void search(criteria);
        }}
        onRetry={() => selected && void selectOffer(selected)}
      />
    </div>
  );
}
