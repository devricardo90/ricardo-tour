/**
 * RT-17 Version C — real 3D globe renderer (raw WebGL2, no external library).
 *
 * This is genuine 3D, not a transformed image: a UV-sphere mesh is rasterised through
 * a perspective projection with a depth buffer, the authored equirectangular atlas is
 * sampled as a real texture, a Lambert terminator and a Fresnel rim are evaluated per
 * fragment, and the camera physically orbits and dollies in world space. The Rio
 * anchor is a world-space point projected through the same matrices, so it is occluded
 * by the planet's own curvature at the limb.
 *
 * No dependency is added: WebGL2 is used directly. If no context is available the
 * factory returns null and the caller falls back to the static SVG frame.
 */

import { RIO, detailRegionUv } from "./world-atlas";
import type { GlobeTextures, TextureSource } from "./globe-textures";

export type GlobeState = {
  /** Camera distance in sphere radii. The surface is at 1. */
  dist: number;
  /** Latitude the camera is centred on, degrees. */
  lat: number;
  /** Longitude the camera is centred on, degrees. */
  lon: number;
  /** 0–1 mix of the Brazil highlight overlay. */
  brazilMix: number;
};

export type MarkerProjection = { x: number; y: number; visible: boolean };

export type Globe = {
  render(state: GlobeState): MarkerProjection;
  resize(): void;
  dispose(): void;
};

const POSITION_LOCATION = 0;
const UV_LOCATION = 1;
const SLICES = 128;
const STACKS = 64;
const FOV_DEGREES = 34;
const ATMOSPHERE_SCALE = 1.04;
const DEGREES = Math.PI / 180;

const VERTEX_SHADER = `#version 300 es
in vec3 aPosition;
in vec2 aUv;
uniform mat4 uProjection;
uniform mat4 uView;
uniform float uScale;
out vec3 vNormal;
out vec2 vUv;
out vec3 vWorld;
void main() {
  vNormal = aPosition;
  vUv = aUv;
  vWorld = aPosition * uScale;
  gl_Position = uProjection * uView * vec4(vWorld, 1.0);
}`;

const GLOBE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in vec3 vWorld;
uniform sampler2D uEarth;
uniform sampler2D uGlow;
uniform sampler2D uDetail;
uniform vec3 uCamera;
uniform vec3 uLight;
uniform float uDetailMix;
uniform vec4 uDetailRegion;
out vec4 outColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(uCamera - vWorld);
  vec3 light = normalize(uLight);

  vec3 base = texture(uEarth, vUv).rgb;
  float globalCoast = texture(uGlow, vUv).r;

  // The regional texture is higher resolution than the global atlas. Sampling outside
  // its box would smear its clamped edge across the globe, so it is masked explicitly.
  vec2 detailUv = (vUv - uDetailRegion.xy) / uDetailRegion.zw;
  vec4 detail = vec4(0.0);
  if (all(greaterThanEqual(detailUv, vec2(0.0))) && all(lessThanEqual(detailUv, vec2(1.0)))) {
    detail = texture(uDetail, detailUv);
  }
  float detailMix = clamp(uDetailMix, 0.0, 1.0);
  float southAmericaCoast = detail.r;
  float brazilSignal = detail.g * detailMix;
  float approachSignal = detail.b * detailMix;

  float lambert = max(dot(normal, light), 0.0);
  float terminator = smoothstep(-0.28, 0.34, dot(normal, light));
  vec3 color = base;
  color *= 0.17 + 0.98 * lambert;

  // Land stays matter-dark; the geographic reading comes from thin gold filaments.
  // The regional layer is brighter only as the camera enters Brazil, with the route
  // network kept below the coastline so it reads as connection rather than a HUD.
  vec3 gold = vec3(0.784, 0.659, 0.420);
  float coastline = globalCoast * 0.26 + southAmericaCoast * 0.38;
  float brazilEdge = brazilSignal * 0.46;
  float approach = approachSignal * 0.12;
  float litFilament = 0.36 + 0.64 * terminator;
  color += gold * (coastline + brazilEdge + approach) * litFilament;
  color += vec3(0.18, 0.13, 0.07) * brazilSignal * 0.18;

  float fresnel = pow(1.0 - max(dot(normal, view), 0.0), 2.7);
  color += gold * fresnel * (0.30 + 0.62 * terminator);

  outColor = vec4(color, 1.0);
}`;

const ATMOSPHERE_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in vec3 vWorld;
uniform vec3 uCamera;
uniform vec3 uLight;
out vec4 outColor;
void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(uCamera - vWorld);
  vec3 light = normalize(uLight);
  float rim = pow(1.0 - max(dot(normal, view), 0.0), 4.2);
  float lit = 0.28 + 0.72 * smoothstep(-0.45, 0.45, dot(normal, light));
  outColor = vec4(vec3(0.831, 0.729, 0.478) * rim * lit * 1.05, 1.0);
}`;

function perspective(fovYRadians: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovYRadians / 2);
  const range = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, near * far * range * 2, 0,
  ]);
}

function lookAt(eye: readonly [number, number, number], up: readonly [number, number, number]) {
  const length = Math.hypot(eye[0], eye[1], eye[2]) || 1;
  const z: [number, number, number] = [eye[0] / length, eye[1] / length, eye[2] / length];
  let x: [number, number, number] = [
    up[1] * z[2] - up[2] * z[1],
    up[2] * z[0] - up[0] * z[2],
    up[0] * z[1] - up[1] * z[0],
  ];
  const xLength = Math.hypot(x[0], x[1], x[2]) || 1;
  x = [x[0] / xLength, x[1] / xLength, x[2] / xLength];
  const y: [number, number, number] = [
    z[1] * x[2] - z[2] * x[1],
    z[2] * x[0] - z[0] * x[2],
    z[0] * x[1] - z[1] * x[0],
  ];
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
    1,
  ]);
}

/**
 * Outward unit direction for a geographic coordinate. This must stay in step with the
 * sphere parameterisation below and with the equirectangular mapping in world-atlas.ts.
 */
function direction(lat: number, lon: number): [number, number, number] {
  const phi = (90 - lat) * DEGREES;
  const theta = (lon + 180) * DEGREES;
  return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
}

function buildSphere() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let stack = 0; stack <= STACKS; stack += 1) {
    const v = stack / STACKS;
    const phi = v * Math.PI;
    for (let slice = 0; slice <= SLICES; slice += 1) {
      const u = slice / SLICES;
      const theta = u * Math.PI * 2;
      positions.push(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      uvs.push(u, v);
    }
  }
  for (let stack = 0; stack < STACKS; stack += 1) {
    for (let slice = 0; slice < SLICES; slice += 1) {
      const a = stack * (SLICES + 1) + slice;
      const b = a + SLICES + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint32Array(indices),
  };
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  // Both programs share one VAO, so the attribute slots are pinned before linking.
  gl.bindAttribLocation(program, POSITION_LOCATION, "aPosition");
  gl.bindAttribLocation(program, UV_LOCATION, "aUv");
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function uploadTexture(gl: WebGL2RenderingContext, source: TextureSource, wrapS: number) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if ("data" in source) {
    // Raw texels from the texture worker: un-premultiplied RGBA, the same values a canvas upload produces (RT-45).
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.width, source.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(source.data.buffer, source.data.byteOffset, source.data.byteLength));
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  antialias: true,
  depth: true,
  premultipliedAlpha: true,
  powerPreference: "default",
};

/**
 * Creates (and keeps) the canvas' WebGL2 context with the globe's attributes. Called before the textures are produced so
 * a device without WebGL2 never pays for rasterising them (RT-45 review); createGlobe() then gets this same context.
 */
export function supportsGlobe(canvas: HTMLCanvasElement): boolean {
  try {
    return Boolean(canvas.getContext("webgl2", CONTEXT_ATTRIBUTES));
  } catch {
    return false;
  }
}

export function createGlobe(canvas: HTMLCanvasElement, textures: GlobeTextures, onSizeChange?: () => void): Globe | null {
  const gl = canvas.getContext("webgl2", CONTEXT_ATTRIBUTES);
  if (!gl) return null;

  const globeProgram = link(gl, VERTEX_SHADER, GLOBE_FRAGMENT_SHADER);
  const atmosphereProgram = link(gl, VERTEX_SHADER, ATMOSPHERE_FRAGMENT_SHADER);
  if (!globeProgram || !atmosphereProgram) return null;

  const earthTexture = uploadTexture(gl, textures.earth, gl.REPEAT);
  const glowTexture = uploadTexture(gl, textures.glow, gl.REPEAT);
  const detailTexture = uploadTexture(gl, textures.detail, gl.CLAMP_TO_EDGE);
  if (!earthTexture || !glowTexture || !detailTexture) return null;

  const sphere = buildSphere();
  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();
  const uvBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(POSITION_LOCATION);
  gl.vertexAttribPointer(POSITION_LOCATION, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.uvs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(UV_LOCATION);
  gl.vertexAttribPointer(UV_LOCATION, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const uniforms = (program: WebGLProgram) => ({
    projection: gl.getUniformLocation(program, "uProjection"),
    view: gl.getUniformLocation(program, "uView"),
    scale: gl.getUniformLocation(program, "uScale"),
    camera: gl.getUniformLocation(program, "uCamera"),
    light: gl.getUniformLocation(program, "uLight"),
    earth: gl.getUniformLocation(program, "uEarth"),
    glow: gl.getUniformLocation(program, "uGlow"),
    detail: gl.getUniformLocation(program, "uDetail"),
    detailMix: gl.getUniformLocation(program, "uDetailMix"),
    detailRegion: gl.getUniformLocation(program, "uDetailRegion"),
  });
  const globeUniforms = uniforms(globeProgram);
  const atmosphereUniforms = uniforms(atmosphereProgram);

  /** Light sits to the upper east of the Rio anchor so the terminator frames the approach. */
  const light = direction(18, -6);
  const detailRegion = new Float32Array(detailRegionUv());

  let width = 0;
  let height = 0;
  // CSS size of the canvas, cached. Reading clientWidth/clientHeight inside render() forced a synchronous layout on
  // every frame, right after GSAP's style writes (Lighthouse forced-reflow; ~0.6 s of main-thread time on a 4x-throttled
  // load, RT-45). The cache is refreshed by a ResizeObserver, whose callback runs after layout: after a resize the first
  // frame may still use the previous size (one-frame stretch), then onSizeChange redraws at the new size. The drawing,
  // camera and marker maths are unchanged.
  let cssWidth = canvas.clientWidth;
  let cssHeight = canvas.clientHeight;
  const sizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
    if (canvas.clientWidth === cssWidth && canvas.clientHeight === cssHeight) return;
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;
    onSizeChange?.(); // the caller redraws on its next frame with the new size
  });
  sizeObserver?.observe(canvas);

  const resize = () => {
    // Without a ResizeObserver, or while no size has been observed yet (the canvas is display:none until the caller
    // marks the globe ready, so the first frame after that would otherwise use 0x0), read the layout size directly.
    if (!sizeObserver || cssWidth === 0 || cssHeight === 0) {
      cssWidth = canvas.clientWidth;
      cssHeight = canvas.clientHeight;
    }
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.round(cssWidth * ratio));
    const nextHeight = Math.max(1, Math.round(cssHeight * ratio));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  resize();
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);

  const render = (state: GlobeState): MarkerProjection => {
    resize();
    const aspect = width / Math.max(1, height);
    // The lens is fitted to the NARROWER axis. With a fixed vertical FOV a portrait
    // canvas would crop the globe left and right, and the Rio anchor would leave frame
    // on mobile long before the approach reaches Brazil.
    const fovY = 2 * Math.atan(Math.tan((FOV_DEGREES * DEGREES) / 2) / Math.min(aspect, 1));
    const projection = perspective(fovY, aspect, 0.01, 100);
    const axis = direction(state.lat, state.lon);
    const eye: [number, number, number] = [
      axis[0] * state.dist,
      axis[1] * state.dist,
      axis[2] * state.dist,
    ];
    // Guard the up vector so a near-polar target cannot degenerate the basis.
    const up: [number, number, number] = Math.abs(state.lat) > 84 ? [0, 0, 1] : [0, 1, 0];
    const view = lookAt(eye, up);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindVertexArray(vao);

    gl.useProgram(globeProgram);
    gl.uniformMatrix4fv(globeUniforms.projection, false, projection);
    gl.uniformMatrix4fv(globeUniforms.view, false, view);
    gl.uniform1f(globeUniforms.scale, 1);
    gl.uniform3fv(globeUniforms.camera, eye);
    gl.uniform3fv(globeUniforms.light, light);
    gl.uniform1f(globeUniforms.detailMix, state.brazilMix);
    gl.uniform4fv(globeUniforms.detailRegion, detailRegion);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, earthTexture);
    gl.uniform1i(globeUniforms.earth, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glowTexture);
    gl.uniform1i(globeUniforms.glow, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, detailTexture);
    gl.uniform1i(globeUniforms.detail, 2);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_INT, 0);

    // The halo is a second, larger shell. Depth testing keeps only the hemisphere in
    // front of the planet, so the glow wraps the real silhouette instead of overlaying it.
    gl.useProgram(atmosphereProgram);
    gl.uniformMatrix4fv(atmosphereUniforms.projection, false, projection);
    gl.uniformMatrix4fv(atmosphereUniforms.view, false, view);
    gl.uniform1f(atmosphereUniforms.scale, ATMOSPHERE_SCALE);
    gl.uniform3fv(atmosphereUniforms.camera, eye);
    gl.uniform3fv(atmosphereUniforms.light, light);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_INT, 0);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);

    // Project the Rio anchor with the same matrices and hide it past the limb.
    const point = direction(RIO.lat, RIO.lon);
    const facing = point[0] * axis[0] + point[1] * axis[1] + point[2] * axis[2];
    const viewX = view[0] * point[0] + view[4] * point[1] + view[8] * point[2] + view[12];
    const viewY = view[1] * point[0] + view[5] * point[1] + view[9] * point[2] + view[13];
    const viewZ = view[2] * point[0] + view[6] * point[1] + view[10] * point[2] + view[14];
    const clipW = -viewZ;
    if (clipW <= 0.001) return { x: 0, y: 0, visible: false };
    const ndcX = (projection[0] * viewX) / clipW;
    const ndcY = (projection[5] * viewY) / clipW;
    return {
      x: (ndcX * 0.5 + 0.5) * cssWidth,
      y: (0.5 - ndcY * 0.5) * cssHeight,
      visible: facing > 0.06 && Math.abs(ndcX) < 1.2 && Math.abs(ndcY) < 1.2,
    };
  };

  const dispose = () => {
    sizeObserver?.disconnect();
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(uvBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteTexture(earthTexture);
    gl.deleteTexture(glowTexture);
    gl.deleteTexture(detailTexture);
    gl.deleteProgram(globeProgram);
    gl.deleteProgram(atmosphereProgram);
  };

  return { render, resize, dispose };
}
