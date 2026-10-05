// Oner search widget loader (provider-confirmed install, 2026-10-04). The ONLY place that knows the provider URLs
// and touches the DOM to load them. Idempotent: the stylesheet and script are each added at most once per document,
// whatever the number of mounts/remounts, and a previously failed load can be retried.
//
// The provider script is loaded from the provider origin at runtime; it is never copied into this repository.

export const ONER_ORIGIN = "https://static.onertravel.com";
export const ONER_STYLES_URL = `${ONER_ORIGIN}/widget/search/production/styles.css`;
export const ONER_SCRIPT_URL = `${ONER_ORIGIN}/widget/search/production/widget-befly.js`;

const STYLES_ID = "oner-widget-styles";
const SCRIPT_ID = "oner-widget-script";
const LOAD_TIMEOUT_MS = 15_000;

let pending: Promise<void> | null = null;

function ensureStyles() {
  if (document.getElementById(STYLES_ID) || document.querySelector(`link[href="${ONER_STYLES_URL}"]`)) return;
  const link = document.createElement("link");
  link.id = STYLES_ID;
  link.rel = "stylesheet";
  link.href = ONER_STYLES_URL;
  document.head.appendChild(link);
}

function injectScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = ONER_SCRIPT_URL;
    script.async = true;
    script.dataset.loaded = "false";

    let timer = 0;
    const fail = (reason: string) => {
      window.clearTimeout(timer);
      script.remove(); // allow a clean retry
      reject(new Error(reason));
    };
    timer = window.setTimeout(() => fail("oner-script-timeout"), LOAD_TIMEOUT_MS);

    script.addEventListener("load", () => {
      window.clearTimeout(timer);
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => fail("oner-script-error"));
    document.body.appendChild(script);
  });
}

/** Loads the provider stylesheet and script once. Safe to call repeatedly and concurrently. */
export function loadOnerWidget(): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("oner-no-document"));

  ensureStyles();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();
  if (pending) return pending;

  pending = injectScript().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}
