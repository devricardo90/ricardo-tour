import { randomUUID } from "node:crypto";
import {
  detectAbuse,
  detectCompetitorComparison,
  detectEmergency,
  detectInjection,
  detectInternalInfoRequest,
  isSafetySensitive,
  runGates,
} from "./gates";
import { isSupportedRuntimeLocale, validateRuntimeInput } from "./input";
import {
  INVALID_INPUT_MESSAGE,
  PERSONAL_DATA_REMINDER,
  REFUSAL_MESSAGE,
  UNSUPPORTED_LOCALE_MESSAGE,
  degradedMessage,
  dynamicMessage,
  handoffMessage,
  refusalMessage,
} from "./messages";
import { UpstreamFailure, classifyProviderError } from "./openai";
import { buildInput, buildInstructions } from "./policy";
import { checkGeneratedAnswer } from "./postcheck";
import { redactPersonalData } from "./privacy";
import { filterHits, type Registry } from "./provenance";
import type {
  HandoffReason,
  RefusalReason,
  ResponseKind,
  RuntimeDeps,
  RuntimeEvent,
  RuntimeResult,
} from "./types";

/** Hits below this relevance are never shown to the model. Tuned against the RT-69 hosted store (see RT-67 doc). */
export const MIN_RELEVANCE_SCORE = 0.3;
export const MAX_EVIDENCE_CHUNKS = 4;
/**
 * RT-74 §2 row 5: one retry only for transient failures (timeout / provider 5xx), and only while the request is still
 * inside its budget. Auth and rate-limit errors are never retried. RT-72 may later replace these local constants.
 */
export const RETRY_BUDGET_MS = 20_000;

const noSources = () => ({
  source_ids: [] as string[],
  source_versions: [] as string[],
  chunk_ids: [] as string[],
});

const KIND: Record<RuntimeResult["outcome"], ResponseKind> = {
  ANSWER: "grounded",
  HANDOFF: "handoff",
  DYNAMIC_LOOKUP_REQUIRED: "handoff",
  INSUFFICIENT_EVIDENCE: "handoff",
  UNSUPPORTED_LOCALE: "handoff",
  REFUSED: "refusal",
  INVALID_INPUT: "refusal",
  UPSTREAM_ERROR: "degraded",
};

function defaultEmit(event: RuntimeEvent) {
  // Content-free by construction: no message, answer, prompt or identifier is part of RuntimeEvent.
  if (process.env.NODE_ENV !== "test")
    console.info(JSON.stringify({ event: "ai_concierge_runtime", ...event }));
}

type Draft = Omit<
  RuntimeResult,
  "response_kind" | "source_ids" | "source_versions" | "chunk_ids"
> &
  Partial<Pick<RuntimeResult, "source_ids" | "source_versions" | "chunk_ids">>;

/**
 * Pipeline: input -> locale -> emergency -> injection / internal-info / abuse / comparison -> deterministic gates ->
 * hosted retrieval -> provenance + retrieved-content safety -> policy -> Responses API -> post-generation validation ->
 * answer / handoff / safe failure. Stateless: nothing from the request is persisted.
 */
export async function runConcierge(
  raw: unknown,
  deps: RuntimeDeps,
  registry: Registry,
): Promise<RuntimeResult> {
  const now = deps.now ?? Date.now;
  const started = now();
  const emit = deps.onEvent ?? defaultEmit;
  const stats = {
    retrieval_results: 0,
    accepted_results: 0,
    rejected_results: 0,
    source_classes: [] as string[],
    retried: false,
  };
  let personalDataShared = false;

  const finish = (draft: Draft): RuntimeResult => {
    const result: RuntimeResult = {
      ...noSources(),
      ...draft,
      response_kind: KIND[draft.outcome],
    };
    if (result.outcome === "UPSTREAM_ERROR") {
      result.reference_id = randomUUID().slice(0, 8);
      result.answer = degradedMessage(result.reference_id);
    }
    // The personal-data reminder is deterministic and never depends on the model.
    if (
      personalDataShared &&
      result.outcome !== "INVALID_INPUT" &&
      result.outcome !== "UNSUPPORTED_LOCALE"
    ) {
      result.answer = `${result.answer} ${PERSONAL_DATA_REMINDER}`;
    }
    // RT-74 §4: observability is best-effort and must never block or alter the answer.
    try {
      emit({
        outcome: result.outcome,
        latency_ms: now() - started,
        retrieval_results: stats.retrieval_results,
        accepted_results: stats.accepted_results,
        rejected_results: stats.rejected_results,
        source_classes: stats.source_classes,
        handoff_reason: result.handoff_reason,
        dynamic_reason: result.dynamic_reason,
        error_class: result.error_class,
        refusal_reason: result.refusal_reason,
        retried: stats.retried || undefined,
      });
    } catch {
      // Telemetry sink failure is intentionally ignored.
    }
    return result;
  };
  const refuse = (reason: RefusalReason) =>
    finish({
      outcome: "REFUSED",
      answer: reason.startsWith("prompt_injection")
        ? REFUSAL_MESSAGE
        : refusalMessage(reason),
      refusal_reason: reason,
    });
  const handoff = (
    reason: HandoffReason,
    outcome: "HANDOFF" | "INSUFFICIENT_EVIDENCE" = "HANDOFF",
    invalid_reason?: string,
  ) =>
    finish({
      outcome,
      answer: handoffMessage(reason),
      handoff_reason: reason,
      invalid_reason,
    });

  const input = validateRuntimeInput(raw);
  if (!input.ok)
    return finish({
      outcome: "INVALID_INPUT",
      answer: INVALID_INPUT_MESSAGE,
      invalid_reason: input.reason,
    });
  const { message, locale, history } = input.value;
  if (!isSupportedRuntimeLocale(locale))
    return finish({
      outcome: "UNSUPPORTED_LOCALE",
      answer: UNSUPPORTED_LOCALE_MESSAGE,
    });

  const safeMessage = redactPersonalData(message);
  personalDataShared =
    safeMessage !== message ||
    history.some((turn) => redactPersonalData(turn.text) !== turn.text);

  // Emergencies take priority over every other rule: fixed wording only, no retrieval, no model.
  if (detectEmergency(message)) return handoff("emergency");

  // Session context is untrusted: injection in a prior user turn, or any unsafe/forged assistant turn, fails closed.
  if (
    history.some((turn) => turn.role === "user" && detectInjection(turn.text))
  )
    return refuse("prompt_injection_history");
  if (
    history.some(
      (turn) =>
        turn.role === "assistant" && !checkGeneratedAnswer(turn.text).ok,
    )
  ) {
    return finish({
      outcome: "INVALID_INPUT",
      answer: INVALID_INPUT_MESSAGE,
      invalid_reason: "history_unsafe_assistant_turn",
    });
  }
  if (detectInjection(message)) return refuse("prompt_injection");
  if (detectInternalInfoRequest(message)) return refuse("internal_information");
  if (detectAbuse(message)) return refuse("abusive_content");
  if (detectCompetitorComparison(message))
    return refuse("third_party_comparison");

  const gate = runGates(message);
  if (gate.kind === "dynamic")
    return finish({
      outcome: "DYNAMIC_LOOKUP_REQUIRED",
      answer: dynamicMessage(gate.reason),
      dynamic_reason: gate.reason,
    });
  if (gate.kind === "handoff") return handoff(gate.reason);

  const safetySensitive = isSafetySensitive(message);
  // When a safety-sensitive question cannot be answered from approved evidence, the fixed no-guarantee handoff is used.
  const noAnswer = (invalid_reason: string) =>
    safetySensitive
      ? handoff("safety_sensitive", "INSUFFICIENT_EVIDENCE", invalid_reason)
      : handoff(
          "insufficient_evidence",
          "INSUFFICIENT_EVIDENCE",
          invalid_reason,
        );

  const upstream = (error: unknown, fallback: "retrieval" | "generation") => {
    const failure = classifyProviderError(error, fallback);
    return finish({
      outcome: "UPSTREAM_ERROR",
      answer: "",
      handoff_reason: "upstream_error",
      error_class: failure.errorClass,
    });
  };
  /** One bounded retry for transient failures; never for auth/rate-limit and never past the retry budget. */
  const withRetry = async <T>(
    call: () => Promise<T>,
    fallback: "retrieval" | "generation",
  ): Promise<T> => {
    try {
      return await call();
    } catch (error) {
      const failure = classifyProviderError(error, fallback);
      const transient =
        failure.errorClass === "timeout" ||
        (failure.status !== undefined && failure.status >= 500);
      if (!transient || now() - started > RETRY_BUDGET_MS) throw failure;
      stats.retried = true;
      try {
        return await call();
      } catch (second) {
        throw classifyProviderError(second, fallback);
      }
    }
  };

  const safeHistory = history.map((turn) => ({
    role: turn.role,
    text: redactPersonalData(turn.text),
  }));
  const lastUser = [...safeHistory]
    .reverse()
    .find((turn) => turn.role === "user");
  // A short follow-up ("e o segundo?") is retrieved together with the previous user turn.
  const retrievalQuery =
    lastUser && safeMessage.length < 80
      ? `${lastUser.text} ${safeMessage}`
      : safeMessage;

  let hits;
  try {
    hits = await withRetry(() => deps.retrieve(retrievalQuery), "retrieval");
  } catch (error) {
    return upstream(error, "retrieval");
  }
  if (!Array.isArray(hits))
    return upstream(new UpstreamFailure("malformed"), "retrieval");
  stats.retrieval_results = hits.length;

  // Rejected evidence is dropped here and never reaches the model.
  const { accepted, rejected } = filterHits(hits, registry);
  // Retrieved text is data, never instructions: a chunk that reads like an injection is dropped (defense in depth).
  const clean = accepted.filter((item) => !detectInjection(item.text));
  stats.rejected_results = rejected + (accepted.length - clean.length);
  const evidence = clean
    .filter((item) => item.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EVIDENCE_CHUNKS);
  stats.accepted_results = evidence.length;
  stats.source_classes = [
    ...new Set(evidence.map((item) => item.source_class)),
  ];
  if (!evidence.length) return noAnswer("no_accepted_evidence");

  let generated: string;
  try {
    generated = await withRetry(
      () =>
        deps.generate({
          instructions: buildInstructions(),
          input: buildInput(safeMessage, evidence, safeHistory),
        }),
      "generation",
    );
  } catch (error) {
    return upstream(error, "generation");
  }

  const checked = checkGeneratedAnswer(generated);
  if (!checked.ok) return noAnswer(checked.reason);

  return finish({
    outcome: "ANSWER",
    answer: checked.answer,
    source_ids: [...new Set(evidence.map((item) => item.source_id))],
    source_versions: [...new Set(evidence.map((item) => item.source_version))],
    chunk_ids: evidence.map((item) => item.chunk_id),
  });
}
