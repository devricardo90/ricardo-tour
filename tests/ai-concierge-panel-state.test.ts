import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateRuntimeInput } from "@/lib/ai-concierge/runtime/input";
import { checkGeneratedAnswer } from "@/lib/ai-concierge/runtime/postcheck";
import type { RuntimeResult } from "@/lib/ai-concierge/runtime/types";
import { SCENARIOS, replyFor } from "@/lib/ai-concierge/ui/fixtures";
import { toConciergeReply } from "@/lib/ai-concierge/ui/reply";
import {
  MAX_COUNTDOWN_SECONDS,
  STARTER_QUESTIONS,
  clampSeconds,
  formatCountdown,
  historyFor,
  initialPanelState,
  panelReducer,
  type PanelMessage,
  type PanelState,
} from "@/lib/ai-concierge/ui/state";
import { gates } from "./helpers/gates-probe";

// RT-71 / RT-74 Concierge panel — pure logic tests. No DOM, no network, no OpenAI.
const run = (state: PanelState, ...actions: Parameters<typeof panelReducer>[1][]) => actions.reduce(panelReducer, state);
const reply = (id: Parameters<typeof replyFor>[0]) => replyFor(id);

describe("panel state machine", () => {
  it("opens, closes and keeps the conversation when closed", () => {
    let s = run(initialPanelState(), { type: "open" }, { type: "send", text: "olá" });
    expect(s.open).toBe(true);
    s = run(s, { type: "close" });
    expect(s.open).toBe(false);
    expect(s.messages).toHaveLength(1);
  });

  it("sends only non-empty text while idle, trims, and clips to the server limit", () => {
    expect(run(initialPanelState(), { type: "send", text: "   " }).messages).toHaveLength(0);
    const long = run(initialPanelState(), { type: "send", text: "a".repeat(2_000) });
    expect(long.messages[0].text).toHaveLength(800);
    expect(long.status).toBe("sending");
    expect(run(long, { type: "send", text: "segunda" }).messages).toHaveLength(1); // not while sending
    expect(panelReducer(initialPanelState(), { type: "draft", text: "b".repeat(2_000) }).draft).toHaveLength(800);
  });

  it("a grounded reply returns to idle; replies are ignored unless a message is in flight", () => {
    const sent = run(initialPanelState(), { type: "send", text: "O que é a Ricardo Tour?" });
    const done = run(sent, { type: "reply", reply: reply("answer") });
    expect(done.status).toBe("idle");
    expect(done.messages.at(-1)).toMatchObject({ role: "assistant", kind: "grounded" });
    expect(run(initialPanelState(), { type: "reply", reply: reply("answer") }).messages).toHaveLength(0);
  });

  it("handoff replies keep idle status and carry the offer", () => {
    const s = run(initialPanelState(), { type: "send", text: "Quero falar com uma pessoa" }, { type: "reply", reply: reply("handoff_human") });
    expect(s.status).toBe("idle");
    expect(s.messages.at(-1)).toMatchObject({ kind: "handoff", handoff: { code: "H1", required: true } });
  });

  it("a degraded reply disables the composer until the visitor retries", () => {
    let s = run(initialPanelState(), { type: "send", text: "oi" }, { type: "reply", reply: reply("degraded") });
    expect(s.status).toBe("degraded");
    expect(run(s, { type: "send", text: "de novo" }).messages).toHaveLength(2); // blocked
    s = run(s, { type: "retry" });
    expect(s.status).toBe("idle");
    expect(run(initialPanelState(), { type: "retry" }).status).toBe("idle");
  });

  it("rate limiting counts down every second and re-enables the composer by itself", () => {
    let s = run(initialPanelState(), { type: "send", text: "oi" }, { type: "reply", reply: reply("rate_limited") });
    expect(s).toMatchObject({ status: "rate_limited", retryAfter: 20 });
    for (let i = 0; i < 19; i++) s = run(s, { type: "tick" });
    expect(s).toMatchObject({ status: "rate_limited", retryAfter: 1 });
    s = run(s, { type: "tick" });
    expect(s).toMatchObject({ status: "idle", retryAfter: 0 });
    expect(run(initialPanelState(), { type: "tick" })).toEqual(initialPanelState());
  });

  it("countdown seconds are clamped and formatted", () => {
    expect(clampSeconds(undefined)).toBe(30);
    expect(clampSeconds(Number.NaN)).toBe(30);
    expect(clampSeconds(0)).toBe(1);
    expect(clampSeconds(-5)).toBe(1);
    expect(clampSeconds(1e9)).toBe(MAX_COUNTDOWN_SECONDS);
    expect(clampSeconds(2.2)).toBe(3);
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });

  it("a transport failure becomes a fixed degraded message with the static handoff, never a raw error", () => {
    const s = run(initialPanelState(), { type: "send", text: "oi" }, { type: "failed" });
    const last = s.messages.at(-1) as Extract<PanelMessage, { role: "assistant" }>;
    expect(s.status).toBe("degraded");
    expect(last.kind).toBe("degraded");
    expect(last.handoff?.code).toBe("H5");
    expect(last.text).toContain("contato@ricardotour.com");
    expect(last.text).not.toMatch(/Error|undefined|stack|fetch/i);
  });

  it("reset clears the in-memory conversation but keeps the panel open", () => {
    const s = run(initialPanelState({ open: true }), { type: "send", text: "oi" }, { type: "reply", reply: reply("answer") }, { type: "reset" });
    expect(s).toMatchObject({ open: true, messages: [], status: "idle", draft: "" });
  });
});

describe("history sent to the server stays within the runtime limits", () => {
  const msg = (role: "user" | "assistant", text: string, i: number): PanelMessage =>
    role === "user" ? { id: `u${i}`, role, text } : { id: `a${i}`, role, text, kind: "grounded" };

  it("keeps the most recent turns in order, at most 8", () => {
    const messages = Array.from({ length: 20 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", `turno ${i}`, i));
    const history = historyFor(messages);
    expect(history).toHaveLength(8);
    expect(history[0].text).toBe("turno 12");
    expect(history.at(-1)?.text).toBe("turno 19");
  });

  it("truncates each turn to 1,200 characters and drops the oldest turns beyond 4,000 characters in total", () => {
    const big = Array.from({ length: 8 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", "x".repeat(1_500), i));
    const history = historyFor(big);
    expect(history.every((t) => t.text.length <= 1_200)).toBe(true);
    expect(history.reduce((sum, t) => sum + t.text.length, 0)).toBeLessThanOrEqual(4_000);
    expect(history.length).toBeLessThan(8);
  });

  it("whatever the panel builds is accepted by the real server-side input validation", () => {
    const messages = Array.from({ length: 30 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", "y".repeat(900 + (i % 3) * 200), i));
    const parsed = validateRuntimeInput({ message: "e o segundo?", locale: "pt", history: historyFor(messages) });
    expect(parsed.ok).toBe(true);
  });

  it("skips empty turns", () => {
    expect(historyFor([msg("user", "   ", 1)])).toEqual([]);
  });
});

describe("what the browser receives and shows", () => {
  it("toConciergeReply strips every internal field", () => {
    const result: RuntimeResult = {
      outcome: "ANSWER", answer: "Resposta pública.", response_kind: "grounded",
      source_ids: ["approved-faq:pt"], source_versions: ["sha256:abc"], chunk_ids: ["deadbeef"],
      error_class: "limiter", invalid_reason: "x", refusal_reason: "prompt_injection", handoff_reason: "insufficient_evidence",
    };
    const out = toConciergeReply(result);
    expect(Object.keys(out).sort()).toEqual(["answer", "outcome", "response_kind"]);
    expect(JSON.stringify(out)).not.toMatch(/approved-faq|sha256|deadbeef|limiter|prompt_injection|insufficient_evidence/);
    const limited = toConciergeReply({ ...result, outcome: "RATE_LIMITED", response_kind: "degraded", retry_after_seconds: 12, reference_id: "ab12cd34" });
    expect(limited).toMatchObject({ retry_after_seconds: 12, reference_id: "ab12cd34" });
  });

  it("every lab scenario uses real runtime texts that are valid conversation history and respect the honesty rules", () => {
    for (const scenario of SCENARIOS) {
      const r = replyFor(scenario.id);
      expect(checkGeneratedAnswer(r.answer), scenario.id).toMatchObject({ ok: true });
      expect(r.answer).not.toMatch(/R\$\s*\d|já chamei|estou transferindo|reserva confirmada/i);
      if (r.handoff) expect(["H1", "H4", "H5", "H9"]).toContain(r.handoff.code);
    }
    expect(replyFor("rate_limited")).toMatchObject({ outcome: "RATE_LIMITED", retry_after_seconds: 20 });
    expect(replyFor("degraded").reference_id).toBe("a1b2c3d4");
  });

  it("starter questions stay inside the approved scope and never trip a dynamic-data gate", () => {
    for (const question of STARTER_QUESTIONS) expect(gates(question), question).toBe("pass");
  });
});

describe("privacy and integrity of the panel code", () => {
  const roots = ["components/ai-concierge/panel", "lib/ai-concierge/ui"];
  const files = roots.flatMap((root) => readdirSync(resolve(process.cwd(), root)).map((name) => resolve(process.cwd(), root, name)));
  // Scan code, not prose: block comments and whole-line comments are removed first.
  const code = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("uses no browser storage, cookies, network calls or tracking APIs: history is in memory only", () => {
    for (const file of files.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const source = code(file);
      expect(source, file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|gtag|posthog/);
    }
  });

  it("never hardcodes contact data: phone numbers and addresses come from the canonical constants", () => {
    for (const file of files.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const source = code(file);
      expect(source, file).not.toMatch(/99846|5522998461906|contato@ricardotour|wa\.me/);
    }
  });

  it("styles respect the approved typography minimum (12px), keep a visible focus ring and honour reduced motion", () => {
    const css = readFileSync(resolve(process.cwd(), "components/ai-concierge/panel/concierge-panel.module.css"), "utf8");
    for (const match of css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) expect(Number(match[1]), match[0]).toBeGreaterThanOrEqual(12);
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    // Regression: an un-scoped link rule once overrode the handoff button text colour (pale gold on gold).
    expect(css).not.toMatch(/\.messageAssistant a\s*\{/);
    expect(css).toMatch(/\.primaryLink\s*\{[^}]*color:\s*var\(--cp-bg\)/);
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    for (const match of css.matchAll(/min-height:\s*(\d+)px/g)) expect(Number(match[1]), match[0]).toBeGreaterThanOrEqual(24);
  });

  it("is not mounted by any public route or layout", () => {
    const publicFiles = ["app/[locale]/(public)/layout.tsx"];
    for (const file of publicFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).not.toContain("concierge-panel");
    }
  });
});
