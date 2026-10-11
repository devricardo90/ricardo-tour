/** Same-origin browser requests only: a cross-site page cannot make a visitor's browser write to, or spend, our endpoints. */
export function isSameOrigin(headers: Headers) {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const origin = headers.get("origin");
  if (origin) {
    try {
      const host = headers.get("x-forwarded-host") ?? headers.get("host");
      if (!host || new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}
