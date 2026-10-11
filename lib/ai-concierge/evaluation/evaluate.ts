import type { RuntimeOutcome, RuntimeResult } from "../runtime/types";

/**
 * RT-75 evaluation harness (pure). A case declares what the real Concierge may and may never do; `judge` turns one runtime
 * result into a verdict. Nothing here calls a network: the script and the offline tests feed it results.
 */
export type EvalCase = {
  id: string;
  category: string;
  prompt: string;
  locale?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
  expect: {
    /** The outcome must be one of these. */
    outcomes: RuntimeOutcome[];
    /** True when a deterministic gate must answer: no retrieval and no model call. */
    no_model_call?: boolean;
    /** Case-insensitive patterns that must appear in the answer (when the outcome is answer-bearing). */
    must_match?: string[];
    /** Case-insensitive patterns that must NOT appear. */
    must_not_match?: string[];
    /** The handoff code must be one of these (when a handoff is expected). */
    handoff_code_in?: string[];
  };
};

export type EvalSet = { version: string; locale: "pt"; cases: EvalCase[]; global_must_not_match: string[] };

export type Verdict = { id: string; category: string; pass: boolean; failures: string[]; outcome: RuntimeOutcome; model_called: boolean };

export function judge(testCase: EvalCase, result: RuntimeResult, modelCalls: number, globalMustNot: string[]): Verdict {
  const failures: string[] = [];
  const { expect } = testCase;
  if (!expect.outcomes.includes(result.outcome)) failures.push(`outcome ${result.outcome} not in [${expect.outcomes.join(", ")}]`);
  if (expect.no_model_call && modelCalls > 0) failures.push(`a deterministic gate was expected but ${modelCalls} provider call(s) were made`);
  for (const pattern of expect.must_match ?? []) {
    if (!new RegExp(pattern, "i").test(result.answer)) failures.push(`answer does not match /${pattern}/i`);
  }
  for (const pattern of [...(expect.must_not_match ?? []), ...globalMustNot]) {
    if (new RegExp(pattern, "i").test(result.answer)) failures.push(`answer matches forbidden /${pattern}/i`);
  }
  if (expect.handoff_code_in && (!result.handoff || !expect.handoff_code_in.includes(result.handoff.code))) {
    failures.push(`handoff code ${result.handoff?.code ?? "none"} not in [${expect.handoff_code_in.join(", ")}]`);
  }
  return { id: testCase.id, category: testCase.category, pass: failures.length === 0, failures, outcome: result.outcome, model_called: modelCalls > 0 };
}

export function summarize(verdicts: Verdict[]) {
  const byCategory: Record<string, { total: number; passed: number }> = {};
  for (const verdict of verdicts) {
    const entry = (byCategory[verdict.category] ??= { total: 0, passed: 0 });
    entry.total++;
    if (verdict.pass) entry.passed++;
  }
  return { total: verdicts.length, passed: verdicts.filter((v) => v.pass).length, by_category: byCategory };
}
