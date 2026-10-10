"use client";

import { useMemo, useState } from "react";
import { ConciergePanel } from "@/components/ai-concierge/panel/concierge-panel";
import { SCENARIOS, createLabTransport, type ScenarioId } from "@/lib/ai-concierge/ui/fixtures";
import type { PanelEvent } from "@/lib/ai-concierge/ui/types";

/**
 * RT-71 / RT-74 lab harness. Everything here is local: scenarios come from deterministic fixtures built with the real
 * runtime texts, the transport never touches the network, and client events are only displayed (never sent anywhere).
 */
export default function ConciergePanelLab() {
  const [scenario, setScenario] = useState<ScenarioId>("answer");
  const [events, setEvents] = useState<PanelEvent[]>([]);
  const [session, setSession] = useState(0);
  // A new transport per selected scenario; the panel always uses the latest one when sending.
  const transport = useMemo(() => createLabTransport(() => scenario), [scenario]);

  return (
    <main style={{ minHeight: "100vh", background: "#f3efe6", color: "#171a1e", fontFamily: "var(--journey-body, Inter, system-ui, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a6a2b" }}>
          RT-71 · RT-74 · protótipo isolado
        </p>
        <h1 style={{ margin: "8px 0 12px", fontFamily: "var(--journey-display, Georgia, serif)", fontSize: 44, fontWeight: 500, lineHeight: 1.02 }}>
          Painel do Concierge
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 15, lineHeight: 1.6, color: "#53565a" }}>
          Superfície de revisão visual. Não é a Home, não está ligada ao endpoint real e não chama nenhum modelo: as respostas vêm de cenários
          determinísticos que usam os textos fixos reais do runtime. O Concierge público continua desativado até o gate RT-75.
        </p>

        <section aria-labelledby="scenario-title" style={{ padding: 20, background: "#fcf9f2", border: "1px solid #cfc7ba", borderRadius: 14 }}>
          <h2 id="scenario-title" style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>Cenário da próxima resposta</h2>
          <div role="radiogroup" aria-labelledby="scenario-title" style={{ display: "grid", gap: 8 }}>
            {SCENARIOS.map((item) => (
              <label key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", minHeight: 44, fontSize: 14, cursor: "pointer" }}>
                <input type="radio" name="scenario" value={item.id} checked={scenario === item.id} onChange={() => setScenario(item.id)} style={{ marginTop: 4 }} />
                <span>
                  <strong>{item.label}</strong>
                  <br />
                  <span style={{ color: "#53565a", fontSize: 13 }}>{item.description}</span>
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setSession((value) => value + 1);
              setEvents([]);
            }}
            style={{ marginTop: 14, minHeight: 44, padding: "0 16px", fontSize: 14, fontWeight: 600, background: "#171a1e", color: "#f4f0e8", border: 0, borderRadius: 10, cursor: "pointer" }}
          >
            Reiniciar conversa (memória da sessão)
          </button>
        </section>

        <section aria-labelledby="events-title" style={{ marginTop: 20, padding: 20, background: "#fcf9f2", border: "1px solid #cfc7ba", borderRadius: 14 }}>
          <h2 id="events-title" style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>Eventos de cliente emitidos (contrato RT-73, só exibidos)</h2>
          {events.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#53565a" }}>Nenhum evento ainda. Abra o painel e use “Abrir WhatsApp”.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, fontFamily: "var(--font-mono, monospace)" }}>
              {events.map((event, index) => (
                <li key={index} style={{ overflowWrap: "anywhere" }}>{JSON.stringify(event)}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConciergePanel key={session} transport={transport} surface="public_site" onEvent={(event) => setEvents((list) => [...list, event])} />
    </main>
  );
}
