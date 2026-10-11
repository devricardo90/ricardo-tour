// RT-45: prove the worker texture path is pixel-identical to the previous main-thread path. Uploads each of the three
// textures twice — (A) the DOM canvas drawn on the main thread (old path), (B) the raw texels returned by the REAL
// globe-textures.worker.ts running in a Worker (new path) — reads both back from level 0 with readPixels, and
// compares every byte. Run with GPU=1 for the host GPU. Usage: node scripts/rt-45-globe-texture-parity.mjs
import { build } from "esbuild";
import { chromium } from "@playwright/test";

const bundle = async (entry, globalName) =>
  (await build({ entryPoints: [entry], bundle: true, write: false, format: "iife", globalName, target: "es2022" })).outputFiles[0].text;
const atlas = await bundle("components/home/hero/world-atlas.ts", "Atlas");
const worker = await bundle("components/home/hero/globe-textures.worker.ts", undefined);
const gpu = process.env.GPU === "1";
const browser = await chromium.launch({ headless: true, args: gpu ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] : [] });
const page = await browser.newPage();
await page.setContent("<canvas id=c width=8 height=8></canvas>");
await page.addScriptTag({ content: atlas });
const result = await page.evaluate(async (workerCode) => {
  const gl = document.getElementById("c").getContext("webgl2");
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "?";
  const readBack = (upload, w, h) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    upload();
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const out = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    return out;
  };
  const fromWorker = await new Promise((resolve, reject) => {
    const w = new Worker(URL.createObjectURL(new Blob([workerCode], { type: "text/javascript" })));
    w.onmessage = (e) => resolve(e.data);
    w.onerror = (e) => reject(new Error(e.message));
    w.postMessage("draw");
  });
  if (!fromWorker.ok) return { renderer, error: "worker returned ok:false" };
  const report = { renderer };
  for (const [key, draw] of [["earth", "drawEarthTexture"], ["glow", "drawGlowTexture"], ["detail", "drawDetailTexture"]]) {
    const canvas = globalThis.Atlas[draw]();
    const { width, height, data } = fromWorker[key];
    const a = readBack(() => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas), width, height);
    const b = readBack(() => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(data.buffer)), width, height);
    let differing = 0, maxDiff = 0, nonZero = 0;
    for (let i = 0; i < a.length; i++) {
      const d = Math.abs(a[i] - b[i]);
      if (d) { differing++; if (d > maxDiff) maxDiff = d; }
      if (a[i]) nonZero++;
    }
    // CPU-side comparison, independent of the GL driver: main-thread canvas texels vs worker texels.
    const main = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let cpuDiffering = 0;
    for (let i = 0; i < main.length; i++) if (main[i] !== data[i]) cpuDiffering++;
    report[key] = { cpuBytes: main.length, cpuDiffering, size: `${width}x${height}`, bytes: a.length, differing, maxDiff, nonZeroBytes: nonZero, sameSize: canvas.width === width && canvas.height === height };
  }
  return report;
}, worker);
await browser.close();
console.log(JSON.stringify({ gpu, ...result }, null, 1));
// An all-zero GL readback proves nothing (seen with SwiftShader): the GL comparison then counts as inconclusive, and
// the CPU-side comparison must carry the result on its own.
const failed = ["earth", "glow", "detail"].some((k) => !result[k] || !result[k].sameSize || result[k].cpuDiffering !== 0 || (result[k].nonZeroBytes > 0 && result[k].differing !== 0));
for (const k of ["earth", "glow", "detail"]) if (result[k] && result[k].nonZeroBytes === 0) console.log(`note: ${k} GL readback was empty on this renderer — GL comparison inconclusive, CPU comparison used`);
process.exit(failed ? 1 : 0);
