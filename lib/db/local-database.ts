// RT-100: pure helper used by prisma/seed.ts to enforce the Owner decision of 2026-10-13 that the seed is DEVELOPMENT-ONLY.
// A connection string counts as local only when its host is the machine itself (or the Docker host alias) AND nothing in
// the string can redirect the connection elsewhere.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal"]);

// libpq/pg-connection-string accept these query parameters and let them OVERRIDE the host in the URL
// (e.g. postgresql://u:p@localhost/db?host=evil.example.com), so any of them makes the string non-local.
const HOST_OVERRIDING_PARAMS = ["host", "hostaddr", "service"];

export function isLocalDatabaseUrl(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    if (HOST_OVERRIDING_PARAMS.some((name) => url.searchParams.has(name))) return false;
    return LOCAL_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false; // unparseable: never assume it is local
  }
}
