import { detectInjection, runGates } from "./gates";
import { INVALID_INPUT_MESSAGE, REFUSAL_MESSAGE, UNSUPPORTED_LOCALE_MESSAGE, dynamicMessage, handoffMessage } from "./messages";
import { buildInput, buildInstructions } from "./policy";
import { checkGeneratedAnswer } from "./postcheck";
import { filterHits, type Registry } from "./provenance";
import { isSupportedRuntimeLocale, validateRuntimeInput } from "./input";
import { UpstreamFailure, classifyProviderError } from "./openai";
import type { RuntimeDeps, RuntimeEvent, RuntimeResult } from "./types";

/** Hits below this relevance are never shown to the model. Tuned against the RT-69 hosted store (see RT-67 doc). */
export const MIN_RELEVANCE_SCORE = 0.3;
export const MAX_EVIDENCE_CHUNKS = 4;

const noSources = () => ({ source_ids: [] as string[], source_versions: [] as string[], chunk_ids: [] as string[] });

function defaultEmit(event: RuntimeEvent) {
  // Content-free by construction: no message, answer, prompt or identifier is part of RuntimeEvent.
  if (process.env.NODE_ENV !== "test") console.info(JSON.stringify({ event: "ai_concierge_runtime", ...event }));
}

/**
 * RT-67 pipeline: input -> locale -> injection -> deterministic gates -> hosted retrieval -> provenance ->
 * policy -> Responses API -> post-generation validation -> answer/handoff/safe failure.
 * Stateless: nothing from the request is persisted.
 */
export async function runConcierge(raw: unknown, deps: RuntimeDeps, registry: Registry): Promise<RuntimeResult> {
  const started = Date.now();
  const emit = deps.onEvent ?? defaultEmit;
  const stats = { retrieval_results: 0, accepted_results: 0, rejected_results: 0, source_classes: [] as string[] };
  const finish = (result: RuntimeResult): RuntimeResult => {
    emit({
      outcome: result.outcome,
      latency_ms: Date.now() - started,
      ...stats,
      handoff_reason: result.handoff_reason,
      dynamic_reason: result.dynamic_reason,
      error_class: result.error_class,
    });
    return result;
  };

  const input = validateRuntimeInput(raw);
  if (!input.ok) return finish({ outcome: "INVALID_INPUT", answer: INVALID_INPUT_MESSAGE, invalid_reason: input.reason, ...noSources() });
  const { message, locale } = input.value;
  if (!isSupportedRuntimeLocale(locale)) return finish({ outcome: "UNSUPPORTED_LOCALE", answer: UNSUPPORTED_LOCALE_MESSAGE, ...noSources() });

  if (detectInjection(message)) return finish({ outcome: "REFUSED", answer: REFUSAL_MESSAGE, refusal_reason: "prompt_injection", ...noSources() });

  const gate = runGates(message);
  if (gate.kind === "dynamic") {
    return finish({ outcome: "DYNAMIC_LOOKUP_REQUIRED", answer: dynamicMessage(gate.reason), dynamic_reason: gate.reason, ...noSources() });
  }
  if (gate.kind === "handoff") {
    return finish({ outcome: "HANDOFF", answer: handoffMessage(gate.reason), handoff_reason: gate.reason, ...noSources() });
  }

  const upstream = (error: unknown, fallback: "retrieval" | "generation") => {
    const failure = classifyProviderError(error, fallback);
    return finish({ outcome: "UPSTREAM_ERROR", answer: handoffMessage("upstream_error"), handoff_reason: "upstream_error", error_class: failure.errorClass, ...noSources() });
  };
  const insufficient = (invalid_reason?: string) =>
    finish({ outcome: "INSUFFICIENT_EVIDENCE", answer: handoffMessage("insufficient_evidence"), handoff_reason: "insufficient_evidence", invalid_reason, ...noSources() });

  let hits;
  try {
    hits = await deps.retrieve(message);
  } catch (error) {
    return upstream(error, "retrieval");
  }
  if (!Array.isArray(hits)) return upstream(new UpstreamFailure("malformed"), "retrieval");
  stats.retrieval_results = hits.length;

  // Rejected evidence is dropped here and never reaches the model.
  const { accepted, rejected } = filterHits(hits, registry);
  stats.rejected_results = rejected;
  const evidence = accepted
    .filter((item) => item.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EVIDENCE_CHUNKS);
  stats.accepted_results = evidence.length;
  stats.source_classes = [...new Set(evidence.map((item) => item.source_class))];
  if (!evidence.length) return insufficient("no_accepted_evidence");

  let generated: string;
  try {
    generated = await deps.generate({ instructions: buildInstructions(), input: buildInput(message, evidence) });
  } catch (error) {
    return upstream(error, "generation");
  }

  const checked = checkGeneratedAnswer(generated);
  if (!checked.ok) return insufficient(checked.reason);

  return finish({
    outcome: "ANSWER",
    answer: checked.answer,
    source_ids: [...new Set(evidence.map((item) => item.source_id))],
    source_versions: [...new Set(evidence.map((item) => item.source_version))],
    chunk_ids: evidence.map((item) => item.chunk_id),
  });
}
