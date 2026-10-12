import { drawDetailTexture, drawEarthTexture, drawGlowTexture } from "./world-atlas";

/** Raw un-premultiplied RGBA texels, as produced by getImageData. */
export type TexturePixels = { width: number; height: number; data: Uint8ClampedArray };
export type TextureSource = TexImageSource | TexturePixels;
export type GlobeTextures = { earth: TextureSource; glow: TextureSource; detail: TextureSource };

function drawOnMainThread(): GlobeTextures | null {
  // Never throws: a drawing failure resolves to null (the caller marks the globe "unavailable" and keeps the static frame),
  // exactly like the pre-RT-45 try/catch around createGlobe.
  try {
    const earth = drawEarthTexture();
    const glow = drawGlowTexture();
    const detail = drawDetailTexture();
    return earth && glow && detail ? { earth, glow, detail } : null;
  } catch {
    return null;
  }
}

function workerSupported() {
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return false;
  try {
    return Boolean(new OffscreenCanvas(1, 1).getContext("2d"));
  } catch {
    return false;
  }
}

/**
 * RT-45: produce the globe textures without blocking the main thread when the browser can rasterise 2D canvas in a
 * worker (OffscreenCanvas). Otherwise — or if the worker fails — the textures are drawn on the main thread exactly as
 * before. Same drawing code; pixel parity verified in Chromium (rt-45-globe-texture-parity), not yet in Firefox/WebKit.
 * Resolves null when no 2D context exists or drawing fails (never rejects).
 */
export function loadGlobeTextures(): { promise: Promise<GlobeTextures | null>; cancel: () => void } {
  if (!workerSupported()) return { promise: Promise.resolve(drawOnMainThread()), cancel: () => {} };
  const worker = new Worker(new URL("./globe-textures.worker.ts", import.meta.url));
  let settled = false;
  const promise = new Promise<GlobeTextures | null>((resolve) => {
    const fallback = () => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(drawOnMainThread());
    };
    worker.onmessage = (event: MessageEvent<{ ok: boolean } & Partial<GlobeTextures>>) => {
      if (settled) return;
      if (!event.data.ok) return fallback();
      settled = true;
      worker.terminate();
      const { earth, glow, detail } = event.data;
      resolve({ earth: earth!, glow: glow!, detail: detail! });
    };
    worker.onerror = fallback;
    worker.onmessageerror = fallback; // a reply that cannot be deserialised must not leave the static frame forever
    worker.postMessage("draw");
  });
  return {
    promise,
    cancel: () => {
      settled = true;
      worker.terminate();
    },
  };
}
