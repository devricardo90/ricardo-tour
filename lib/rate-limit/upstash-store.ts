import { RateLimitStoreError, type HitResult, type RateLimitRule, type RateLimitStore, type StoreErrorClass } from "./types";

/**
 * Upstash Redis over its REST API (plain fetch, no extra npm dependency, no Upstash analytics).
 * Each check is exactly ONE round trip and ONE atomic EVAL: INCR, then EXPIRE only when the key was just created, so
 * a key can never be left without a TTL. Fixed window: the window index is part of the key, and the TTL is the window
 * plus a small slack, so every key expires by itself and nothing permanent is stored.
 *
 * Free-plan budget: a check costs at most 3 billable commands (EVAL + INCR + EXPIRE on the first hit of a window,
 * otherwise EVAL + INCR); Upstash does not document whether commands inside a script are billed, so the worst case
 * is assumed.
 */
export const HIT_SCRIPT = [
  "local c = redis.call('INCR', KEYS[1])",
  "if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "return c",
].join("\n");

export const TTL_SLACK_SECONDS = 5;
export const DEFAULT_TIMEOUT_MS = 1_500;

export type UpstashStoreOptions = {
  url: string;
  token: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

const QUOTA_TEXT = /max(?:imum)?\s+(?:daily\s+|monthly\s+)?requests?\s+limit|limit\s+exceeded|quota/i;

function classifyStatus(status: number): StoreErrorClass {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "quota_exhausted";
  return "unavailable";
}

export function createUpstashStore(options: UpstashStoreOptions): RateLimitStore {
  const { url, token, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const doFetch = options.fetchImpl ?? fetch;

  return {
    async hit(key: string, rule: RateLimitRule, nowMs: number = Date.now()): Promise<HitResult> {
      const windowMs = rule.windowSeconds * 1000;
      const index = Math.floor(nowMs / windowMs);
      const windowEnd = (index + 1) * windowMs;
      const redisKey = `${key}:${index}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await doFetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(["EVAL", HIT_SCRIPT, "1", redisKey, String(rule.windowSeconds + TTL_SLACK_SECONDS)]),
          signal: controller.signal,
          cache: "no-store",
        });
      } catch (error) {
        throw new RateLimitStoreError((error as { name?: string })?.name === "AbortError" ? "timeout" : "connection");
      } finally {
        clearTimeout(timer);
      }

      type Body = { result?: unknown; error?: unknown } | null;
      let body = null as Body;
      try {
        body = (await response.json()) as Body;
      } catch {
        body = null;
      }
      // Provider text is inspected only to classify; it is never copied into an error, a log or a result.
      if (typeof body?.error === "string") throw new RateLimitStoreError(QUOTA_TEXT.test(body.error) ? "quota_exhausted" : classifyStatus(response.status));
      if (!response.ok) throw new RateLimitStoreError(classifyStatus(response.status));
      const count = Array.isArray(body?.result) ? body?.result[0] : body?.result;
      if (typeof count !== "number" || !Number.isInteger(count) || count < 1) throw new RateLimitStoreError("malformed");

      return {
        allowed: count <= rule.limit,
        count,
        limit: rule.limit,
        remaining: Math.max(0, rule.limit - count),
        retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - nowMs) / 1000)),
      };
    },
  };
}
