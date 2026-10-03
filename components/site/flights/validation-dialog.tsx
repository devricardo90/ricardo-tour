"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { FlightOfferView } from "@/lib/flights/types";
import { formatMoney } from "@/lib/flights/format";
import type { FlightsCopy } from "@/components/site/flights/flights-copy";
import { primaryButton, secondaryButton } from "@/components/site/flights/styles";

// Selected Offer -> revalidation dialog (RT-37 §18). Native <dialog> + showModal(): the page behind is inert, focus is
// trapped, Esc is handled by us (it never silently accepts anything). Focus moves to the heading on every state change.
// Price changes ALWAYS require an explicit "Accept new price" press (Owner-approved rule); "accept" is never the
// default-focused control and nothing is charged here (no payment exists in this prototype).

export type DialogPhase =
  | { kind: "validating" }
  | { kind: "valid"; total: number; currency: string }
  | { kind: "price_changed"; previousTotal: number; newTotal: number; currency: string }
  | { kind: "unavailable" }
  | { kind: "stale" }
  | { kind: "failed" }
  | { kind: "handoff" };

type Props = {
  phase: DialogPhase | null;
  offer: FlightOfferView | null;
  locale: string;
  t: FlightsCopy;
  onBack: () => void;
  onAccept: () => void;
  onContinue: () => void;
  onSearchAgain: () => void;
  onRetry: () => void;
};

export function ValidationDialog({ phase, offer, locale, t, onBack, onAccept, onContinue, onSearchAgain, onRetry }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const open = phase !== null;
  const kind = phase?.kind;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, kind]);

  const d = t.dialog;
  const money = (currency: string, amount: number) => formatMoney(locale, currency, amount);
  const carrier = offer?.directions[0]?.segments[0]?.carrierName ?? "";

  let title = "";
  let body: React.ReactNode = null;
  let actions: React.ReactNode = null;

  switch (phase?.kind) {
    case "validating":
      title = d.validatingTitle;
      body = (
        <p className="mt-2 flex items-center gap-2 text-[15px] text-[var(--site-ink-muted)]">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          {d.validatingBody}
        </p>
      );
      actions = (
        <button type="button" onClick={onBack} className={secondaryButton}>
          {d.cancel}
        </button>
      );
      break;
    case "valid":
      title = d.validTitle;
      body = (
        <>
          <p className="mt-2 text-[15px] text-[var(--site-ink-muted)]">{d.validBody}</p>
          <p className="mt-3 text-[24px] font-medium tabular-nums">{money(phase.currency, phase.total)}</p>
          {carrier ? <p className="text-[13px] text-[var(--site-ink-muted)]">{carrier}</p> : null}
        </>
      );
      actions = (
        <>
          <button type="button" onClick={onContinue} className={primaryButton}>
            {d.continue}
          </button>
          <button type="button" onClick={onBack} className={secondaryButton}>
            {d.back}
          </button>
        </>
      );
      break;
    case "price_changed": {
      title = d.priceChangedTitle;
      const diff = phase.newTotal - phase.previousTotal;
      body = (
        <>
          <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{d.priceChangedBody}</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-[15px]">
            <dt className="text-[var(--site-ink-muted)]">{d.previous}</dt>
            <dd className="tabular-nums line-through">{money(phase.currency, phase.previousTotal)}</dd>
            <dt className="text-[var(--site-ink-muted)]">{d.updated}</dt>
            <dd className="font-medium tabular-nums" data-testid="new-price">
              {money(phase.currency, phase.newTotal)}
            </dd>
            <dt className="text-[var(--site-ink-muted)]">{d.difference}</dt>
            <dd className="tabular-nums">{`${diff > 0 ? "+" : ""}${money(phase.currency, diff)}`}</dd>
          </dl>
        </>
      );
      actions = (
        <>
          <button type="button" onClick={onBack} className={secondaryButton}>
            {d.back}
          </button>
          <button type="button" onClick={onAccept} className={primaryButton}>
            {d.accept}
          </button>
        </>
      );
      break;
    }
    case "unavailable":
      title = d.unavailableTitle;
      body = <p className="mt-2 text-[15px] text-[var(--site-ink-muted)]">{d.unavailableBody}</p>;
      actions = (
        <button type="button" onClick={onBack} className={primaryButton}>
          {d.back}
        </button>
      );
      break;
    case "stale":
      title = d.staleTitle;
      body = <p className="mt-2 text-[15px] text-[var(--site-ink-muted)]">{d.staleBody}</p>;
      actions = (
        <>
          <button type="button" onClick={onSearchAgain} className={primaryButton}>
            {d.searchAgain}
          </button>
          <button type="button" onClick={onBack} className={secondaryButton}>
            {d.back}
          </button>
        </>
      );
      break;
    case "failed":
      title = d.failedTitle;
      body = <p className="mt-2 text-[15px] text-[var(--site-ink-muted)]">{d.failedBody}</p>;
      actions = (
        <>
          <button type="button" onClick={onRetry} className={primaryButton}>
            {d.retry}
          </button>
          <button type="button" onClick={onBack} className={secondaryButton}>
            {d.back}
          </button>
        </>
      );
      break;
    case "handoff":
      title = d.handoffTitle;
      body = <p className="mt-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">{d.handoffBody}</p>;
      actions = (
        <>
          <Link href="/contato" className={primaryButton}>
            {d.talk}
          </Link>
          <button type="button" onClick={onBack} className={secondaryButton}>
            {d.back}
          </button>
        </>
      );
      break;
    default:
      break;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="flight-dialog-title"
      data-testid="flight-dialog"
      data-phase={kind ?? "closed"}
      onCancel={(event) => {
        event.preventDefault();
        onBack();
      }}
      className="m-auto w-[min(92vw,460px)] rounded-xl border border-[var(--site-rule-light)] bg-white p-6 text-[var(--site-ink)] shadow-[0_24px_60px_rgba(23,26,30,0.3)] backdrop:bg-black/50"
    >
      {open ? (
        <div>
          <h2 id="flight-dialog-title" ref={headingRef} tabIndex={-1} className="site-display text-[24px] font-medium leading-[1.15] outline-none">
            {title}
          </h2>
          <div aria-live="polite">{body}</div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>
        </div>
      ) : null}
    </dialog>
  );
}
