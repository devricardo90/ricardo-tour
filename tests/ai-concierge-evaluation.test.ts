import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { judge, summarize, type EvalCase, type EvalSet } from "@/lib/ai-concierge/evaluation/evaluate";
import { loadRegistry } from "@/lib/ai-concierge/runtime/provenance";
import { runConcierge } from "@/lib/ai-concierge/runtime/run";

// RT-75 evaluation set: the deterministic part runs here with NO network. Cases that need the model are only validated for shape.
const set = JSON.parse(readFileSync(resolve(process.cwd(), "knowledge/concierge/evaluation/rt-75-evaluation-set-pt.json"), "utf8")) as EvalSet;
const registry = loadRegistry();

describe("RT-75 evaluation set", () => {
  it("is well-formed: unique ids, known categories, valid regexes, synthetic prompts only", () => {
    const ids = set.cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(set.cases.length).toBeGreaterThanOrEqual(80);
    for (const testCase of set.cases) {
      expect(["grounded", "dynamic_gate", "handoff_gate", "safety", "refusal", "persona", "input", "followup", "recommendation", "multilingual", "handoff_context"]).toContain(testCase.category);
      expect(testCase.expect.outcomes.length).toBeGreaterThan(0);
      for (const pattern of [...(testCase.expect.must_match ?? []), ...(testCase.expect.must_not_match ?? [])]) expect(() => new RegExp(pattern, "i"), `${testCase.id} ${pattern}`).not.toThrow();
    }
    for (const pattern of set.global_must_not_match) expect(() => new RegExp(pattern, "i")).not.toThrow();
    // synthetic data only: the single CPF-shaped value is a documented fake used to prove redaction
    expect(JSON.stringify(set.cases)).not.toMatch(/@[a-z0-9-]+\.[a-z]{2,}/i);
  });

  it("covers every risk category the Owner gate reviews, including persona transparency", () => {
    const categories = new Set(set.cases.map((c) => c.category));
    for (const category of ["grounded", "dynamic_gate", "handoff_gate", "safety", "refusal", "persona", "input", "followup", "recommendation", "multilingual", "handoff_context"]) expect(categories.has(category)).toBe(true);
    expect(set.cases.filter((c) => c.category === "persona").length).toBeGreaterThanOrEqual(8);
    // V1: every language is exercised
    for (const locale of ["en", "es"]) expect(set.cases.some((c) => c.locale === locale)).toBe(true);
  });

  it("every deterministic-gate case passes with NO retrieval and NO model call (provider functions throw if touched)", async () => {
    const deterministic = set.cases.filter((c) => c.expect.no_model_call);
    expect(deterministic.length).toBeGreaterThanOrEqual(55);
    const verdicts = [];
    for (const testCase of deterministic) {
      const retrieve = vi.fn(async () => {
        throw new Error("retrieval must not be called");
      });
      const generate = vi.fn(async () => {
        throw new Error("generation must not be called");
      });
      const result = await runConcierge({ message: testCase.prompt, locale: testCase.locale ?? "pt", history: testCase.history }, { retrieve, generate, onEvent: () => undefined }, registry);
      verdicts.push(judge(testCase, result, retrieve.mock.calls.length + generate.mock.calls.length, set.global_must_not_match));
    }
    const failed = verdicts.filter((v) => !v.pass);
    expect(failed, JSON.stringify(failed, null, 1)).toEqual([]);
    expect(summarize(verdicts).passed).toBe(deterministic.length);
  });
});

describe("judge()", () => {
  const base: EvalCase = { id: "X", category: "grounded", prompt: "p", expect: { outcomes: ["ANSWER"], must_match: ["ok"], must_not_match: ["ruim"] } };
  const result = (answer: string, outcome = "ANSWER") => ({ outcome, answer, response_kind: "grounded", source_ids: [], source_versions: [], chunk_ids: [] }) as never;

  it("flags a wrong outcome, a missing required pattern, a forbidden pattern and a global violation", () => {
    expect(judge(base, result("tudo ok"), 1, []).pass).toBe(true);
    expect(judge(base, result("tudo ok", "HANDOFF"), 1, []).failures[0]).toMatch(/outcome HANDOFF/);
    expect(judge(base, result("nada"), 1, []).failures.join()).toMatch(/does not match/);
    expect(judge(base, result("ok mas ruim"), 1, []).failures.join()).toMatch(/forbidden/);
    expect(judge(base, result("ok R$ 10"), 1, ["R\\$\\s*\\d"]).pass).toBe(false);
  });

  it("flags a model call where a deterministic gate was required", () => {
    const gated: EvalCase = { ...base, expect: { outcomes: ["ANSWER"], no_model_call: true } };
    expect(judge(gated, result("x"), 2, []).failures.join()).toMatch(/2 provider call/);
  });
});
