// RT-100: pure helper used by prisma/seed.ts to enforce the Owner decision of 2026-10-13 that the seed is DEVELOPMENT-ONLY.
// A connection string counts as local only when its host is the machine itself (or the Docker host alias).

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal"]);

export function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(connectionString).hostname.toLowerCase());
  } catch {
    return false; // unparseable: never assume it is local
  }
}

/** The only way to run the seed against a non-local database: an explicit, deliberate acknowledgement. */
export const REMOTE_SEED_OVERRIDE = "I_HAVE_OWNER_AUTHORIZATION";
