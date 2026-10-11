import { describe, expect, it, vi } from "vitest";
import { PANEL_COPY } from "@/components/ai-concierge/panel/copy";
import { handoffMessage, identityMessage } from "@/lib/ai-concierge/runtime/messages";
import { CONCIERGE_PERSONA } from "@/lib/ai-concierge/runtime/persona";
import { buildInstructions } from "@/lib/ai-concierge/runtime/policy";
import { checkGeneratedAnswer } from "@/lib/ai-concierge/runtime/postcheck";
import { loadRegistry } from "@/lib/ai-concierge/runtime/provenance";
import { runConcierge } from "@/lib/ai-concierge/runtime/run";

// Daniela: the runtime persona must stay aligned with the Owner-approved UI (RT-71/RT-74) and never imply a live human.
describe("runtime persona is aligned with the approved UI", () => {
  it("uses the same name as the panel", () => {
    expect(CONCIERGE_PERSONA.name).toBe(PANEL_COPY.persona);
    expect(CONCIERGE_PERSONA.name).toBe("Daniela");
  });

  it("the model instructions introduce Daniela as an AI, forbid claiming to be a person, and keep every safety rule", () => {
    const instructions = buildInstructions();
    expect(instructions).toContain("Você é a Daniela, assistente de IA da Ricardo Tour");
    expect(instructions).toMatch(/Você é uma inteligência artificial, nunca uma pessoa/);
    expect(instructions).toMatch(/13\. Você é uma IA\. Nunca diga nem sugira que é uma pessoa, humana, atendente, consultora ou membro da equipe/);
    for (const rule of ["1. Use SOMENTE", "3. Nunca informe valores em dinheiro", "4. Nunca diga que contatou, transferiu", "12. Nunca informe números ou serviços de emergência"]) {
      expect(instructions, rule).toContain(rule);
    }
    expect(instructions).not.toContain("Você é o Concierge");
  });

  it("the fixed emergency text speaks as Daniela, an AI, and never as a person", () => {
    const text = handoffMessage("emergency");
    expect(text).toContain("Sou a Daniela, uma assistente de IA");
    expect(text).not.toMatch(/Sou um assistente/);
  });
});

describe("the post-generation check blocks any claim of being human or a live team member", () => {
  const blocked = [
    "Sou uma pessoa de verdade e vou te ajudar.",
    "Oi! Sou a atendente da Ricardo Tour.",
    "Sou da equipe da Ricardo Tour e já te respondo.",
    "Sou humana, pode confiar.",
    "Estou digitando a resposta agora.",
    "Sou consultora de viagens da Ricardo Tour.",
    "Estou online agora para te atender.",
  ];
  it.each(blocked)("blocks: %s", (text) => {
    expect(checkGeneratedAnswer(text)).toMatchObject({ ok: false, reason: "human_claim" });
  });

  const allowed = [
    "Sou a Daniela, assistente de IA da Ricardo Tour.",
    "Eu não sou uma pessoa: sou uma inteligência artificial.",
    "Não sou da equipe, mas posso indicar como falar com ela pelos canais oficiais.",
    "A equipe da Ricardo Tour pode ajudar com isso pelo WhatsApp oficial.",
    "Posso sugerir passeios publicados para quem vem pela primeira vez.",
  ];
  it.each(allowed)("allows: %s", (text) => {
    expect(checkGeneratedAnswer(text)).toMatchObject({ ok: true });
  });
});

describe("identity questions get a fixed, honest answer with no retrieval and no model call", () => {
  const registry = loadRegistry();
  const makeDeps = () => ({ retrieve: vi.fn(async () => []), generate: vi.fn(async () => "x"), onEvent: () => undefined });
  const ask = (message: string, d: ReturnType<typeof makeDeps>) => runConcierge({ message, locale: "pt" }, d, registry);

  const questions = [
    "Você é uma pessoa de verdade?",
    "Estou falando com um atendente?",
    "Qual é o seu nome?",
    "Quem é você?",
    "Você é um robô?",
    "Você é da equipe da Ricardo Tour?",
    "Tem alguém aí?",
    "Como você se chama?",
    "Isso aqui é um robô?",
  ];
  it.each(questions)("answers as Daniela, an AI, without calling the model: %s", async (question) => {
    const d = makeDeps();
    const result = await ask(question, d);
    expect(result.outcome).toBe("ANSWER");
    expect(result.answer).toContain("Sou a Daniela, a assistente de IA da Ricardo Tour: uma inteligência artificial, não uma pessoa nem uma integrante da equipe");
    expect(result.answer).toContain("a equipe humana atende pelos canais oficiais");
    expect(d.retrieve).not.toHaveBeenCalled();
    expect(d.generate).not.toHaveBeenCalled();
    expect(result.source_ids).toEqual([]);
  });

  it("the fixed identity text itself passes the post-generation check (so it is valid assistant history)", () => {
    expect(checkGeneratedAnswer(identityMessage())).toMatchObject({ ok: true });
  });

  it("does not hijack ordinary questions or explicit requests for a person", async () => {
    for (const question of ["Como se chama o passeio de helicóptero?", "Qual é o nome do passeio mais clássico?", "O passeio é um bot de áudio?", "Quais passeios vocês recomendam?", "Quero falar com uma pessoa", "O que é a Ricardo Tour?"]) {
      const d = makeDeps();
      const result = await ask(question, d);
      expect(result.answer, question).not.toContain("Sou a Daniela, a assistente de IA");
    }
  });
});
