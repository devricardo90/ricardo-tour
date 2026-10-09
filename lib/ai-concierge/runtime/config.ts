/**
 * Server-only runtime configuration. None of these may ever be NEXT_PUBLIC_*.
 * The model is a DEVELOPMENT / VALIDATION choice supplied by configuration; it is NOT the final production model.
 */
export type RuntimeConfig = { apiKey: string; vectorStoreId: string; model: string };

export function readRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig | null {
  if (typeof window !== "undefined") return null;
  const apiKey = env.OPENAI_API_KEY?.trim();
  const vectorStoreId = env.OPENAI_CONCIERGE_VECTOR_STORE_ID?.trim();
  const model = env.OPENAI_CONCIERGE_MODEL?.trim();
  if (!apiKey || !vectorStoreId || !model) return null;
  return { apiKey, vectorStoreId, model };
}
