const PROBE_ORIGIN = "https://internal.invalid";

/**
 * Post-login / post-logout redirect target: only a same-site path ("/pt/admin", "/en/reservas?x=1"). Anything else
 * returns `fallback`: absolute URLs, other schemes (javascript:, data:), protocol-relative ("//host"), backslash tricks
 * ("/\host"), control characters and whitespace (browsers strip tabs/newlines, so "/\t/host" would become "//host"), and
 * any value that does not resolve to this site when parsed as a URL.
 */
export function safeRedirectPath(candidate: string | null | undefined, fallback: string): string {
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 512) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (/[\u0000- \u007f\\]/.test(candidate)) return fallback;
  try {
    const resolved = new URL(candidate, PROBE_ORIGIN);
    // Dot segments are resolved first ("/.//host" becomes "//host"), so the normalized path is checked again.
    if (resolved.origin !== PROBE_ORIGIN || resolved.pathname.startsWith("//")) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
