/// <reference lib="webworker" />
/**
 * RT-45: rasterises the globe's three authored textures off the main thread. The drawing code is the same
 * world-atlas.ts used on the main thread (it switches to OffscreenCanvas when there is no `document`), so the pixels
 * are the same (verified in Chromium); only the thread changes. Software-rendered 2D canvas (Lighthouse/SwiftShader, devices without
 * canvas acceleration) spent ~4 s of blocking main-thread time here before this change.
 *
 * Replies with un-premultiplied RGBA (getImageData), which is exactly what texImage2D uploads from a canvas with the
 * default pixel-store flags, so the WebGL side sees identical texels.
 */
import { drawDetailTexture, drawEarthTexture, drawGlowTexture, type TextureCanvas } from "./world-atlas";

type Pixels = { width: number; height: number; data: Uint8ClampedArray };

function pixels(canvas: TextureCanvas | null): Pixels | null {
  if (!canvas) return null;
  const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
  if (!context) return null;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  return { width: canvas.width, height: canvas.height, data };
}

self.onmessage = () => {
  try {
    const earth = pixels(drawEarthTexture());
    const glow = pixels(drawGlowTexture());
    const detail = pixels(drawDetailTexture());
    if (!earth || !glow || !detail) {
      self.postMessage({ ok: false });
      return;
    }
    self.postMessage({ ok: true, earth, glow, detail }, [earth.data.buffer, glow.data.buffer, detail.data.buffer]);
  } catch {
    self.postMessage({ ok: false });
  }
};
