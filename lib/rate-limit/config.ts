/**
 * Server-only limiter configuration. Credentials are read from the environment (Vercel Marketplace injects them for the
 * Upstash integration) and are never logged, returned or exposed through NEXT_PUBLIC_*.
 */
export type LimiterConfig = { url: string; token: string; secret: string; namespace: string };

const TOKEN = /^[A-Za-z0-9_=+/.-]{16,512}$/;

/**
 * Returns null unless everything is present and well-formed. The REST URL must be https on an upstash.io host, so a
 * tampered variable cannot redirect rate-limit traffic (and its bearer token) to another server.
 */
export function readLimiterConfig(env: Record<string, string | undefined> = process.env): LimiterConfig | null {
  if (typeof window !== "undefined") return null;
  const url = (env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL)?.trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN)?.trim();
  const secret = env.RATE_LIMIT_HMAC_SECRET?.trim();
  if (!url || !token || !secret) return null;
  if (secret.length < 32 || !TOKEN.test(token)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !/(^|\.)upstash\.io$/i.test(parsed.hostname) || parsed.username || parsed.password) return null;
  } catch {
    return null;
  }
  // Separate counters per deployment environment (R5): production never shares keys with preview or development.
  const namespace = (env.VERCEL_ENV ?? env.NODE_ENV ?? "development").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "dev";
  return { url: url.replace(/\/+$/, ""), token, secret, namespace };
}
