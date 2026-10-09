/**
 * Server-only runtime configuration. None of these may ever be NEXT_PUBLIC_*.
 * The model is a DEVELOPMENT / VALIDATION choice supplied by configuration; it is NOT the final production model.
 * RT-74: values must have the expected shape, so a tampered or malformed environment value fails closed
 * instead of being forwarded to the provider.
 */
export type RuntimeConfig = { apiKey: string; vectorStoreId: string; model: string };

const VECTOR_STORE_ID = /^vs_[A-Za-z0-9]{8,64}$/;
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,63}$/;
const API_KEY = /^[A-Za-z0-9_-]{16,256}$/;

export function readRuntimeConfig(env: Record<string, string | undefined> = process.env): RuntimeConfig | null {
  if (typeof window !== "undefined") return null;
  const apiKey = env.OPENAI_API_KEY?.trim();
  const vectorStoreId = env.OPENAI_CONCIERGE_VECTOR_STORE_ID?.trim();
  const model = env.OPENAI_CONCIERGE_MODEL?.trim();
  if (!apiKey || !vectorStoreId || !model) return null;
  if (!API_KEY.test(apiKey) || !VECTOR_STORE_ID.test(vectorStoreId) || !MODEL_ID.test(model)) return null;
  return { apiKey, vectorStoreId, model };
}
