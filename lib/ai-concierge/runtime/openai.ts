import OpenAI from "openai";
import type { RuntimeConfig } from "./config";
import type { HostedHit, RuntimeDeps, UpstreamErrorClass } from "./types";

/** Server-only OpenAI adapter. Retrieval hits the RT-69 hosted store; generation uses the Responses API with store:false. */
export const RETRIEVAL_MAX_RESULTS = 5;
export const GENERATION_MAX_OUTPUT_TOKENS = 600;

export class UpstreamFailure extends Error {
  constructor(
    readonly errorClass: UpstreamErrorClass,
    readonly status?: number
  ) {
    super(errorClass); // Never carries the provider message: it may contain request details.
  }
}

export function classifyProviderError(error: unknown, fallback: UpstreamErrorClass): UpstreamFailure {
  if (error instanceof UpstreamFailure) return error;
  const status = typeof (error as { status?: unknown })?.status === "number" ? ((error as { status: number }).status as number) : undefined;
  const name = (error as { name?: string })?.name ?? "";
  if (/Timeout/i.test(name) || (error as { code?: string })?.code === "ETIMEDOUT") return new UpstreamFailure("timeout", status);
  if (status === 401 || status === 403) return new UpstreamFailure("auth", status);
  if (status === 429) return new UpstreamFailure("rate_limit", status);
  return new UpstreamFailure(fallback, status);
}

export function createOpenAIDeps(config: RuntimeConfig, client?: OpenAI): Pick<RuntimeDeps, "retrieve" | "generate"> {
  const openai = client ?? new OpenAI({ apiKey: config.apiKey, timeout: 30_000, maxRetries: 0 });
  return {
    async retrieve(query: string): Promise<HostedHit[]> {
      try {
        // Filters are fixed server-side; callers can never influence the store, locale or filter.
        const page = await openai.vectorStores.search(config.vectorStoreId, {
          query,
          filters: { type: "eq", key: "locale", value: "pt" },
          max_num_results: RETRIEVAL_MAX_RESULTS,
          rewrite_query: false,
        });
        if (!Array.isArray(page?.data)) throw new UpstreamFailure("malformed");
        return page.data.map((item) => ({
          file_id: item.file_id,
          score: typeof item.score === "number" ? item.score : 0,
          text: (item.content ?? []).map((part) => part.text ?? "").join(""),
          attributes: (item.attributes as Record<string, unknown> | null) ?? null,
        }));
      } catch (error) {
        throw classifyProviderError(error, "retrieval");
      }
    },
    async generate({ instructions, input }) {
      try {
        const response = await openai.responses.create({
          model: config.model,
          instructions,
          input,
          store: false,
          max_output_tokens: GENERATION_MAX_OUTPUT_TOKENS,
        });
        if (typeof response.output_text !== "string") throw new UpstreamFailure("malformed");
        // Token usage is the provider-reported (measured) value; absent when the provider omits it.
        const usage = response.usage ? { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens } : undefined;
        return { text: response.output_text, usage };
      } catch (error) {
        throw classifyProviderError(error, "generation");
      }
    },
  };
}
