"use client";

import { useEffect } from "react";
import { reportBrowserError } from "@/lib/observability/client";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

const COPY = {
  pt: { title: "Algo não saiu como esperado", body: "Tivemos um problema ao carregar esta página. Você pode tentar de novo ou falar com a nossa equipe.", retry: "Tentar novamente", contact: "Falar com a equipe" },
  en: { title: "Something didn't go as expected", body: "We had a problem loading this page. You can try again or talk to our team.", retry: "Try again", contact: "Talk to our team" },
  es: { title: "Algo no salió como esperábamos", body: "Tuvimos un problema al cargar esta página. Puedes intentarlo de nuevo o hablar con nuestro equipo.", retry: "Intentar de nuevo", contact: "Hablar con el equipo" },
} as const;

function pickCopy(locale?: string) {
  return COPY[locale === "en" || locale === "es" ? locale : "pt"];
}

/** RT-64: friendly boundary content. Reports the error once (sanitized server-side) and never shows technical details. */
export function ErrorFallback({ error, reset, locale }: { error: Error & { digest?: string }; reset: () => void; locale?: string }) {
  useEffect(() => {
    reportBrowserError("client_boundary", error);
  }, [error]);
  const copy = pickCopy(locale); // locale comes from the route params, never from window during render (no hydration mismatch)
  return (
    <main role="alert" style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>{copy.title}</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>{copy.body}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={reset} style={{ minHeight: 44, padding: "0 20px", fontSize: 16, cursor: "pointer", border: "1px solid currentColor", borderRadius: 8, background: "transparent", color: "inherit" }}>{copy.retry}</button>
        <a href={PUBLIC_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 20px", fontSize: 16, border: "1px solid currentColor", borderRadius: 8, color: "inherit", textDecoration: "none" }}>{copy.contact}</a>
      </div>
    </main>
  );
}
