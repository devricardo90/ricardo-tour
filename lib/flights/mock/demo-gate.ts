/**
 * The prototype scenario switch (and the `?scenario=` param that drives it) is a review/test tool, never a production
 * control. It exists in development, and in a production build only when explicitly opted in at build time
 * (`NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS=1`, used by the RT-38 browser validation build). Literal env access so Next inlines it.
 * This is the only file in lib/flights allowed to read the environment (see the boundary test).
 */
export function demoControlsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_FLIGHTS_DEMO_CONTROLS === "1";
}
