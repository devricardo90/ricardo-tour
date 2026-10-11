import { randomUUID } from "node:crypto";
import {
  detectAbuse,
  detectCompetitorComparison,
  detectEmergency,
  detectIdentityQuestion,
  detectRecommendationIntent,
  detectInjection,
  detectInternalInfoRequest,
  isSafetySensitive,
  runGates,
} from "./gates";
import {
  HANDOFF_CODE_BY_DYNAMIC,
  HANDOFF_CODE_BY_REASON,
  buildHandoffOffer,
} from "./handoff";
import { validateRuntimeInput } from "./input";
import { detectLanguage, langFromLocale, type Lang } from "./lang";
import { detectTourMention, selectRecommendations } from "../ui/tours";
import {
  UNSUPPORTED_LOCALE_MESSAGE,
  invalidInputMessage,
  isFixedRuntimeText,
  personalDataReminder,
  recommendationMessage,
  degradedMessage,
  dynamicMessage,
  handoffMessage,
  identityMessage,
  isFixedMissMessage,
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

const HANDOFF_OUTCOMES = new Set<RuntimeResult["outcome"]>([
  "HANDOFF",
  "DYNAMIC_LOOKUP_REQUIRED",
  "INSUFFICIENT_EVIDENCE",
  "UPSTREAM_ERROR",
  "UNSUPPORTED_LOCALE",
]);

const KIND: Record<RuntimeResult["outcome"], ResponseKind> = {
  ANSWER: "grounded",
  HANDOFF: "handoff",
  DYNAMIC_LOOKUP_REQUIRED: "handoff",
  INSUFFICIENT_EVIDENCE: "handoff",
  UNSUPPORTED_LOCALE: "handoff",
  REFUSED: "refusal",
  INVALID_INPUT: "refusal",
  UPSTREAM_ERROR: "degraded",
  RATE_LIMITED: "degraded",
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
    // RT-73: measured values only.
    stage_ms: {} as { retrieve?: number; generate?: number },
    provider_calls: { retrieve: 0, generate: 0 },
    usage: undefined as { input_tokens: number; output_tokens: number } | undefined,
    rag_empty: false,
    stale_filtered: 0,
    stale_content_served: 0,
    rejected_by_reason: {} as Record<string, number>,
    source_ids: [] as string[],
    failed_stage: undefined as "retrieve" | "generate" | "config" | undefined,
    message_length_bucket: "short" as "short" | "medium" | "long",
  };
  let personalDataShared = false;
  // RT-71 H12: the previous assistant turn was already a fixed "could not help" text.
  let previousMiss = false;
  // V1 (pt/en/es): language of the visitor's message (page locale as fallback) and the approved tour they are asking about.
  // Both come from closed sets, so a handoff message can never carry free text.
  let lang: Lang = "pt";
  let tourId: string | null = null;

  const finish = (draft: Draft): RuntimeResult => {
    const result: RuntimeResult = {
      ...noSources(),
      ...draft,
      response_kind: KIND[draft.outcome],
    };
    if (result.outcome === "UPSTREAM_ERROR") {
      result.reference_id = randomUUID().slice(0, 8);
      result.answer = degradedMessage(result.reference_id, lang);
    }
    // RT-71: structured, user-initiated handoff built from static canonical data; it works with every backend down.
    if (HANDOFF_OUTCOMES.has(result.outcome)) {
      const reason = result.handoff_reason ?? result.dynamic_reason ?? "unsupported_locale";
      const base = result.handoff_reason
        ? HANDOFF_CODE_BY_REASON[result.handoff_reason]
        : result.dynamic_reason
          ? HANDOFF_CODE_BY_DYNAMIC[result.dynamic_reason]
          : "H3";
      const missed = result.outcome === "INSUFFICIENT_EVIDENCE" || result.outcome === "UPSTREAM_ERROR";
      result.handoff = buildHandoffOffer(previousMiss && missed ? "H12" : base, reason, { lang, tourId });
    }
    // The personal-data reminder is deterministic and never depends on the model.
    if (
      personalDataShared &&
      result.outcome !== "INVALID_INPUT" &&
      result.outcome !== "UNSUPPORTED_LOCALE"
    ) {
      result.answer = `${result.answer} ${personalDataReminder(lang)}`;
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
        handoff_offered: result.handoff?.code,
        retried: stats.retried || undefined,
        response_kind: result.response_kind,
        message_length_bucket: stats.message_length_bucket,
        stage_ms: stats.stage_ms,
        provider_calls: stats.provider_calls,
        usage: stats.usage,
        rag_empty: stats.rag_empty,
        stale_filtered: stats.stale_filtered,
        stale_content_served: stats.stale_content_served,
        rejected_by_reason: stats.rejected_by_reason,
        source_ids: stats.source_ids,
        failed_stage: stats.failed_stage,
      });
    } catch {
      // Telemetry sink failure is intentionally ignored.
    }
    return result;
  };
  const refuse = (reason: RefusalReason) =>
    finish({
      outcome: "REFUSED",
      answer: refusalMessage(reason, lang),
      refusal_reason: reason,
    });
  const handoff = (
    reason: HandoffReason,
    outcome: "HANDOFF" | "INSUFFICIENT_EVIDENCE" = "HANDOFF",
    invalid_reason?: string,
  ) =>
    finish({
      outcome,
      answer: handoffMessage(reason, lang),
      handoff_reason: reason,
      invalid_reason,
    });

  const input = validateRuntimeInput(raw);
  if (!input.ok) {
    const rawLocale = typeof raw === "object" && raw !== null ? (raw as { locale?: unknown }).locale : undefined;
    lang = (typeof rawLocale === "string" ? langFromLocale(rawLocale) : null) ?? "pt";
    return finish({
      outcome: "INVALID_INPUT",
      answer: invalidInputMessage(lang),
      invalid_reason: input.reason,
    });
  }
  const { message, locale, history } = input.value;
  stats.message_length_bucket = message.length <= 80 ? "short" : message.length <= 300 ? "medium" : "long";
  const pageLang = langFromLocale(locale);
  if (!pageLang)
    return finish({
      outcome: "UNSUPPORTED_LOCALE",
      answer: UNSUPPORTED_LOCALE_MESSAGE,
    });
  lang = detectLanguage(message, pageLang);
  // The tour the visitor is interested in: the current message first, then their earlier turns, then our last answer.
  tourId =
    detectTourMention(message) ??
    [...history].reverse().filter((turn) => turn.role === "user").map((turn) => detectTourMention(turn.text)).find(Boolean) ??
    detectTourMention([...history].reverse().find((turn) => turn.role === "assistant")?.text ?? "");

  const lastAssistant = [...history].reverse().find((turn) => turn.role === "assistant");
  previousMiss = lastAssistant ? isFixedMissMessage(lastAssistant.text) : false;

  const safeMessage = redactPersonalData(message);
  personalDataShared =
    safeMessage !== message ||
    // Only visitor-typed text counts: our own earlier answers legitimately contain the canonical contact number.
    history.some(
      (turn) =>
        turn.role === "user" && redactPersonalData(turn.text) !== turn.text,
    );

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
        turn.role === "assistant" && !isFixedRuntimeText(turn.text) && !checkGeneratedAnswer(turn.text, { checkLanguage: false }).ok,
    )
  ) {
    return finish({
      outcome: "INVALID_INPUT",
      answer: invalidInputMessage(lang),
      invalid_reason: "history_unsafe_assistant_turn",
    });
  }
  if (detectInjection(message)) return refuse("prompt_injection");
  if (detectInternalInfoRequest(message)) return refuse("internal_information");
  if (detectAbuse(message)) return refuse("abusive_content");
  if (detectCompetitorComparison(message))
    return refuse("third_party_comparison");

  // Persona transparency (Daniela): identity questions are answered by fixed text, never by retrieval or the model.
  if (detectIdentityQuestion(message)) return finish({ outcome: "ANSWER", answer: identityMessage(lang) });

  const gate = runGates(message);
  if (gate.kind === "dynamic")
    return finish({
      outcome: "DYNAMIC_LOOKUP_REQUIRED",
      answer: dynamicMessage(gate.reason, lang),
      dynamic_reason: gate.reason,
    });
  if (gate.kind === "handoff") return handoff(gate.reason);

  // V1: recommendations come ONLY from the approved catalog, selected deterministically (1 to 3 tours). The model never
  // chooses, invents or describes recommended experiences, so nothing outside the catalog can be offered.
  if (detectRecommendationIntent(message)) {
    const picks = selectRecommendations(message);
    return finish({
      outcome: "ANSWER",
      answer: recommendationMessage(picks.map((tour) => tour.title), lang),
      tour_ids: picks.map((tour) => tour.id),
    });
  }

  const safetySensitive = isSafetySensitive(message);
  // When a safety-sensitive question cannot be answered from approved evidence, the fixed no-guarantee handoff is used.
  const noAnswer = (invalid_reason: string) =>
    safetySensitive
      ? handoff("safety_sensitive", "INSUFFICIENT_EVIDENCE", invalid_reason)
      : handoff(
          previousMiss ? "repeated_failure" : "insufficient_evidence",
          "INSUFFICIENT_EVIDENCE",
          invalid_reason,
        );

  const upstream = (error: unknown, fallback: "retrieval" | "generation") => {
    const failure = classifyProviderError(error, fallback);
    stats.failed_stage = fallback === "retrieval" ? "retrieve" : "generate";
    return finish({
      outcome: "UPSTREAM_ERROR",
      answer: "",
      handoff_reason: "upstream_error",
      error_class: failure.errorClass,
    });
  };
  /** One bounded retry for transient failures; never for auth/rate-limit and never past the retry budget. */
  /** Measures each provider call (retries included): call count and wall-clock per stage. */
  const timed = async <T>(stage: "retrieve" | "generate", call: () => Promise<T>) => {
    stats.provider_calls[stage]++;
    const t0 = now();
    try {
      return await call();
    } finally {
      stats.stage_ms[stage] = (stats.stage_ms[stage] ?? 0) + (now() - t0);
    }
  };
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
    hits = await withRetry(() => timed("retrieve", () => deps.retrieve(retrievalQuery)), "retrieval");
  } catch (error) {
    return upstream(error, "retrieval");
  }
  if (!Array.isArray(hits))
    return upstream(new UpstreamFailure("malformed"), "retrieval");
  stats.retrieval_results = hits.length;

  // Rejected evidence is dropped here and never reaches the model.
  const { accepted, rejected, reasons } = filterHits(hits, registry);
  // Retrieved text is data, never instructions: a chunk that reads like an injection is dropped (defense in depth).
  const clean = accepted.filter((item) => !detectInjection(item.text));
  stats.rejected_results = rejected + (accepted.length - clean.length);
  stats.rejected_by_reason = reasons;
  stats.stale_filtered = ["stale_version", "retired_source", "blocked_source", "not_approved_for_rag"].reduce((sum, reason) => sum + (reasons[reason] ?? 0), 0);
  const ranked = clean
    .filter((item) => item.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EVIDENCE_CHUNKS);
  // Defensive invariant (RT-73 alert): superseded/inactive content must never reach the model.
  const evidence = ranked.filter((item) => registry.get(`${item.source_id}
${item.source_version}`)?.status === "ACTIVE");
  stats.stale_content_served = ranked.length - evidence.length;
  stats.rag_empty = evidence.length === 0;
  stats.source_ids = [...new Set(evidence.map((item) => item.source_id))];
  stats.accepted_results = evidence.length;
  stats.source_classes = [
    ...new Set(evidence.map((item) => item.source_class)),
  ];
  if (!evidence.length) return noAnswer("no_accepted_evidence");

  let generated: Awaited<ReturnType<RuntimeDeps["generate"]>>;
  try {
    generated = await withRetry(
      () =>
        timed("generate", () =>
          deps.generate({
            instructions: buildInstructions(lang),
            input: buildInput(safeMessage, evidence, safeHistory),
          }),
        ),
      "generation",
    );
  } catch (error) {
    return upstream(error, "generation");
  }

  const generatedText = typeof generated === "string" ? generated : generated.text;
  if (typeof generated !== "string" && generated.usage) stats.usage = generated.usage;
  const checked = checkGeneratedAnswer(generatedText, { lang });
  if (!checked.ok) return noAnswer(checked.reason);

  return finish({
    outcome: "ANSWER",
    answer: checked.answer,
    source_ids: [...new Set(evidence.map((item) => item.source_id))],
    source_versions: [...new Set(evidence.map((item) => item.source_version))],
    chunk_ids: evidence.map((item) => item.chunk_id),
  });
}
