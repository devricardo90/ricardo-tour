type ConciergeEnv = {
  AI_CONCIERGE_ENABLED?: string;
  NEXT_PUBLIC_AI_CONCIERGE_ENABLED?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);
const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

function normalizeFlag(value: string) {
  return value.trim().toLowerCase();
}

export function isAIConciergeEnabled(env: ConciergeEnv = process.env) {
  const configuredValue =
    env.AI_CONCIERGE_ENABLED ?? env.NEXT_PUBLIC_AI_CONCIERGE_ENABLED;

  if (configuredValue) {
    const normalized = normalizeFlag(configuredValue);

    if (ENABLED_VALUES.has(normalized)) {
      return true;
    }

    if (DISABLED_VALUES.has(normalized)) {
      return false;
    }
  }

  if (env.VERCEL_ENV === "production" || env.NODE_ENV === "production") {
    return false;
  }

  return true;
}
