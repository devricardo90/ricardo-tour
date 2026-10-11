// RT-45: split the WebGL globe's start-up cost into phases, using the REAL texture code (components/home/hero/world-atlas.ts
// bundled with esbuild), in headless Chromium with 4x CPU throttling. Phases per texture:
//   draw   = the 2D canvas JS calls (drawEarthTexture/drawGlowTexture/drawDetailTexture)
//   raster = forcing the deferred 2D rasterisation (1x1 getImageData)
//   upload = texImage2D from the canvas;  mipmap = generateMipmap
// Run with GPU=1 for the host GPU (ANGLE/D3D11) instead of SwiftShader. Usage: node scripts/rt-45-globe-texture-phases.mjs [runs=3]
import { build } from "esbuild";
import { chromium } from "@playwright/test";

const runs = Number(process.argv[2] ?? 3);
const bundle = await build({
  entryPoints: ["components/home/hero/world-atlas.ts"], bundle: true, write: false, format: "iife", globalName: "Atlas", target: "es2022",
});
const code = bundle.outputFiles[0].text;
const gpu = process.env.GPU === "1";
const browser = await chromium.launch({ headless: true, args: gpu ? ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] : [] });
const all = [];
for (let r = 0; r < runs; r++) {
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.setContent("<canvas id=c width=600 height=600></canvas>");
  await page.addScriptTag({ content: code });
  const res = await page.evaluate(() => {
    const gl = document.getElementById("c").getContext("webgl2");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "?";
    const out = { renderer };
    for (const name of ["drawEarthTexture", "drawGlowTexture", "drawDetailTexture"]) {
      const t0 = performance.now();
      const canvas = globalThis.Atlas[name]();
      const t1 = performance.now();
      canvas.getContext("2d").getImageData(0, 0, 1, 1);
      const t2 = performance.now();
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.finish();
      const t3 = performance.now();
      gl.generateMipmap(gl.TEXTURE_2D); gl.finish();
      const t4 = performance.now();
      out[name] = { draw: Math.round(t1 - t0), raster: Math.round(t2 - t1), upload: Math.round(t3 - t2), mipmap: Math.round(t4 - t3), size: `${canvas.width}x${canvas.height}` };
    }
    return out;
  });
  all.push(res);
  await page.close();
}
await browser.close();
console.log(JSON.stringify({ gpu, renderer: all[0].renderer, runs: all.map((run) => Object.fromEntries(Object.entries(run).filter(([key]) => key !== "renderer"))) }, null, 1));
