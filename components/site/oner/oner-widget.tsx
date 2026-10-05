"use client";

import { useEffect, useState } from "react";
import { OnerWidgetFallback } from "./oner-widget-fallback";
import { loadOnerWidget } from "./oner-widget-loader";
import { ONER_EVENTS, emitOnerEvent } from "./oner-widget-events";

// Typed declaration for the provider custom element (no global suppression).
declare module "react" {
  // JSX augmentation requires a namespace; scoped to this one declaration.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "befly-widget": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        language?: string;
        "new-tab"?: string;
      };
    }
  }
}

type Status = "loading" | "ready" | "error";

// Provider-approved first implementation: language and new-tab are exactly what Oner documented. No other
// language codes are known to be supported (EN/ES = PROVIDER_CONFIRMATION_REQUIRED).
export function OnerWidget() {
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (attempt === 0) emitOnerEvent(ONER_EVENTS.pageView);
    emitOnerEvent(ONER_EVENTS.loadStarted);
    loadOnerWidget().then(
      () => {
        if (cancelled) return;
        setStatus("ready");
        emitOnerEvent(ONER_EVENTS.loaded);
      },
      (error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        emitOnerEvent(ONER_EVENTS.loadFailed, { reason: error instanceof Error ? error.message : "unknown" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (status === "error") {
    return (
      <div data-oner-status="error">
        <OnerWidgetFallback />
        <button
          type="button"
          className="mt-3 text-[14px] underline"
          onClick={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // The provider element is rendered only on the client after the script is ready, so SSR/hydration never sees provider DOM.
  return (
    <div id="wrapper" data-oner-status={status} className="min-h-[320px]">
      {status === "loading" ? (
        <p role="status" className="py-8 text-center text-[15px] text-[var(--site-ink)]">
          Carregando o motor de busca…
        </p>
      ) : null}
      {status === "ready" ? <befly-widget language="pt-br" new-tab="true" /> : null}
    </div>
  );
}
