type RebuildLabEnv = {
  REBUILD_LAB_ENABLED?: string;
  NODE_ENV?: string;
  VERCEL_ENV?: string;
};

const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);
const DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

function normalizeFlag(value: string) {
  return value.trim().toLowerCase();
}

/**
 * RT-RB-S0-04 (RT-8) rebuild lab availability.
 *
 * Explicit `REBUILD_LAB_ENABLED` wins in both directions. With no flag set the
 * lab is available in local development only. `NODE_ENV` is `production` on every
 * Vercel deployment, Preview included, so Preview and Production both resolve to
 * disabled (404) and no deployed environment gains a new surface by default.
 */
export function isRebuildLabEnabled(env: RebuildLabEnv = process.env) {
  const configuredValue = env.REBUILD_LAB_ENABLED;

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
