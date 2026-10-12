/**
 * RT-17 Version C — authored schematic atlas for the 3D proof.
 *
 * Provenance: every outline below is hand-authored laboratory artwork written for this
 * proof, in the same class as the inline SVG placeholders used by Version A and Version
 * B. It is deliberately NOT cartographic reference data, NOT a licensed dataset and NOT
 * photography. No external image, no downloaded texture and no AI-generated picture is
 * presented here as a real photograph of the Earth.
 *
 * Coordinates are [longitude, latitude] in degrees, baked into equirectangular canvases
 * so the WebGL sphere samples them as real textures:
 *   u = (lon + 180) / 360      v = (90 - lat) / 180
 * which is exactly the mapping the sphere geometry in globe-3d.ts uses.
 *
 * Three textures are produced:
 *   1. albedo  — ocean and dark land bodies, the matter of the planet.
 *   2. glow    — coastlines as lit filaments, every continent EXCEPT South America.
 *   3. detail  — a high-resolution South America box carrying that continent's
 *                coastline, the Brazil highlight and the destination, one per channel.
 * South America is excluded from (2) precisely because (3) supplies it at roughly five
 * times the texel density; the shader adds the two, so nothing is drawn twice.
 */

export type Ring = ReadonlyArray<readonly [number, number]>;

/**
 * South America at working fidelity. The Owner's refinement targets this coastline
 * specifically, so it carries far more vertices than the surrounding continents: the
 * Guianas, the northeast shoulder, the Rio bight, the Plata mouth and the Patagonian
 * and Chilean margins are each resolved rather than cut straight.
 */
const SOUTH_AMERICA: Ring = [
  [-77.5, 7.5], [-77.3, 6.0], [-76.5, 8.0], [-75.5, 9.5], [-73.0, 11.3], [-71.3, 12.4],
  [-70.2, 11.5], [-68.0, 10.6], [-65.0, 10.2], [-63.8, 10.9], [-62.0, 10.7], [-61.0, 9.8],
  [-60.5, 8.6], [-59.8, 8.3], [-58.5, 7.2], [-57.2, 6.3], [-55.2, 5.9], [-54.0, 5.5],
  [-52.5, 4.9], [-51.6, 4.1], [-51.0, 2.5], [-50.2, 1.8], [-49.5, 0.8], [-48.5, -0.2],
  [-47.5, -0.6], [-46.0, -1.0], [-44.8, -1.6], [-43.5, -2.4], [-42.0, -2.8], [-41.0, -2.9],
  [-39.5, -3.0], [-38.5, -3.7], [-37.2, -4.9], [-35.5, -5.2], [-35.0, -6.5], [-34.8, -7.2],
  [-35.2, -8.5], [-35.8, -9.6], [-36.8, -10.5], [-37.8, -11.5], [-38.6, -12.8], [-38.9, -13.5],
  [-39.0, -15.0], [-39.5, -16.5], [-40.5, -18.5], [-40.8, -20.0], [-41.8, -21.5], [-43.2, -22.9],
  [-44.5, -23.2], [-46.3, -23.9], [-48.0, -25.4], [-48.5, -27.0], [-48.7, -28.5], [-50.0, -30.5],
  [-51.5, -31.5], [-52.5, -33.0], [-54.0, -34.5], [-55.5, -34.8], [-57.0, -34.5], [-58.4, -34.6],
  [-57.5, -36.5], [-56.8, -38.0], [-57.5, -39.0], [-62.0, -39.0], [-62.3, -40.5], [-63.5, -41.0],
  [-65.0, -41.0], [-64.5, -42.5], [-65.5, -43.5], [-65.3, -45.0], [-66.5, -45.5], [-67.5, -46.0],
  [-67.0, -48.0], [-68.3, -50.0], [-69.0, -52.0], [-68.5, -52.8], [-70.5, -53.5], [-71.5, -54.0],
  [-73.5, -53.5], [-74.5, -52.0], [-74.0, -50.5], [-75.0, -49.0], [-74.5, -47.0], [-75.5, -45.0],
  [-73.8, -43.5], [-73.5, -42.0], [-73.8, -40.5], [-73.5, -38.5], [-73.0, -37.0], [-72.5, -35.5],
  [-71.5, -33.0], [-71.3, -30.0], [-70.5, -27.0], [-70.4, -25.0], [-70.5, -23.0], [-70.2, -20.0],
  [-70.4, -18.5], [-71.5, -17.0], [-72.5, -16.5], [-74.0, -15.5], [-76.0, -14.0], [-77.0, -12.0],
  [-78.5, -9.0], [-79.5, -7.0], [-80.8, -5.0], [-81.3, -4.5], [-80.5, -3.0], [-80.3, -1.0],
  [-79.5, 0.5], [-78.8, 1.5], [-78.0, 3.0], [-77.5, 4.5],
];

/**
 * Brazil at the same working fidelity: the Atlantic coast is shared with the continent
 * outline above, then the Plata, Paraguay, Bolivian, Peruvian, Colombian, Venezuelan and
 * Guianese borders are walked back north. This is what carries state 03.
 */
const BRAZIL: Ring = [
  [-51.0, 4.3], [-50.5, 2.0], [-49.9, 1.2], [-48.6, -0.3], [-47.0, -0.8], [-45.0, -1.4],
  [-44.0, -2.2], [-42.5, -2.8], [-41.0, -2.9], [-39.0, -3.0], [-38.5, -3.8], [-37.0, -5.0],
  [-35.4, -5.3], [-34.8, -7.0], [-35.3, -8.8], [-36.5, -10.2], [-37.5, -11.2], [-38.5, -12.9],
  [-39.0, -14.5], [-39.5, -16.2], [-40.3, -18.3], [-40.8, -20.2], [-41.9, -21.7], [-43.2, -22.9],
  [-44.8, -23.3], [-46.5, -24.0], [-48.2, -25.6], [-48.6, -27.2], [-48.8, -28.6], [-50.2, -30.8],
  [-51.8, -31.8], [-52.3, -32.5], [-53.4, -33.7], [-54.0, -33.7], [-55.5, -31.0], [-56.5, -30.2],
  [-57.6, -30.2], [-57.6, -27.3], [-56.0, -27.4], [-54.6, -25.6], [-54.4, -24.0], [-54.3, -22.0],
  [-55.5, -22.3], [-57.9, -22.1], [-57.7, -20.5], [-58.0, -19.8], [-58.4, -19.2], [-60.0, -19.3],
  [-60.2, -18.0], [-62.5, -16.3], [-63.5, -15.0], [-64.5, -13.5], [-65.3, -11.0], [-65.4, -9.8],
  [-66.8, -9.9], [-68.0, -10.7], [-69.5, -10.9], [-70.6, -9.5], [-71.0, -9.8], [-72.2, -9.5],
  [-73.2, -9.4], [-72.9, -8.0], [-73.8, -7.3], [-73.7, -6.0], [-72.9, -5.1], [-71.9, -4.5],
  [-70.5, -4.2], [-70.0, -4.3], [-69.5, -1.0], [-69.8, 1.1], [-69.2, 1.1], [-67.9, 1.7],
  [-67.1, 2.3], [-67.3, 3.4], [-67.9, 4.5], [-67.5, 5.5], [-67.8, 6.3], [-66.0, 6.5],
  [-64.5, 4.2], [-63.5, 4.0], [-62.5, 4.1], [-61.0, 4.5], [-60.7, 5.2], [-60.4, 5.0],
  [-59.8, 4.5], [-59.5, 3.9], [-58.0, 4.0], [-57.3, 3.4], [-56.5, 2.0], [-55.9, 2.5],
  [-55.0, 2.6], [-54.6, 2.3], [-54.0, 3.6], [-52.6, 2.5], [-51.8, 4.1],
];

const NORTH_AMERICA: Ring = [
  [-168, 65.5], [-164, 68.5], [-160, 70.5], [-155, 71.3], [-148, 70.3], [-141, 69.6],
  [-133, 69.5], [-126, 70.2], [-120, 69.6], [-114, 68.9], [-108, 68.5], [-102, 68.9],
  [-95, 68.5], [-90, 69.5], [-85, 70.0], [-80, 68.0], [-76, 66.0], [-72, 63.0],
  [-68, 60.0], [-64, 58.5], [-62, 56.0], [-56, 53.5], [-55.5, 51.5], [-60, 49.5],
  [-64, 47.0], [-66, 44.8], [-70, 43.0], [-71.5, 41.5], [-74, 40.5], [-76, 37.5],
  [-78, 34.0], [-80.5, 32.0], [-81, 29.0], [-80, 25.5], [-82, 25.5], [-83, 28.5],
  [-84.5, 30.0], [-88, 30.3], [-91, 29.2], [-94, 29.5], [-97, 27.8], [-97.5, 25.5],
  [-95.5, 22.5], [-94.5, 18.5], [-91.5, 18.7], [-88.5, 17.5], [-87.5, 15.5], [-84, 15.0],
  [-83, 11.5], [-81.5, 9.0], [-79, 9.3], [-77.5, 8.5], [-80, 8.8], [-83.5, 10.5],
  [-86, 13.0], [-88, 15.8], [-92, 16.0], [-95, 16.5], [-99, 16.8], [-103, 18.5],
  [-106, 21.5], [-109.5, 23.5], [-112.5, 27.0], [-114.5, 30.0], [-117.5, 32.8], [-120.5, 34.5],
  [-122, 37.0], [-124, 40.5], [-124.5, 44.0], [-124, 47.5], [-127, 50.5], [-131, 53.5],
  [-135, 57.0], [-140, 59.5], [-146, 60.0], [-151, 59.0], [-155, 57.5], [-160, 55.5],
  [-162, 58.5], [-165, 60.5], [-166.5, 63.0],
];

const GREENLAND: Ring = [
  [-44, 60], [-42, 62.5], [-40, 65], [-36, 66], [-32, 68], [-26, 69.5], [-22, 70.5],
  [-21, 73], [-19.5, 75.5], [-18, 77.5], [-21, 80], [-28, 81.5], [-38, 83.2], [-48, 82.5],
  [-58, 81.5], [-64, 79.5], [-68, 77], [-64, 74], [-59, 71.5], [-55, 69], [-52, 66.5],
  [-50, 63.5], [-47, 61],
];

const AFRICA: Ring = [
  [-17.1, 14.8], [-16.5, 12.3], [-15.0, 10.5], [-13.5, 9.5], [-11.5, 8.5], [-9.0, 7.3],
  [-7.5, 4.8], [-5.0, 5.0], [-3.0, 5.1], [-1.0, 5.3], [1.0, 5.8], [3.0, 6.4],
  [5.5, 4.5], [8.5, 4.3], [9.5, 3.0], [9.8, 1.0], [9.3, -1.0], [11.5, -3.5],
  [13.0, -5.5], [12.0, -6.0], [12.5, -9.0], [13.5, -12.0], [12.0, -15.0], [11.8, -17.5],
  [13.5, -21.5], [14.5, -22.8], [15.5, -26.5], [17.5, -29.5], [18.5, -32.5], [20.0, -34.8],
  [23.0, -34.0], [25.5, -34.0], [27.5, -33.0], [30.0, -31.0], [32.0, -28.5], [32.5, -25.5],
  [34.5, -24.5], [35.5, -22.0], [35.0, -19.0], [38.5, -17.0], [40.5, -15.5], [40.5, -12.5],
  [39.5, -10.0], [39.5, -7.0], [40.0, -4.5], [41.5, -2.0], [43.5, 0.5], [45.5, 2.5],
  [48.5, 4.5], [51.3, 10.5], [50.5, 11.5], [47.0, 11.0], [44.0, 10.5], [43.3, 11.5],
  [43.0, 12.7], [41.0, 14.5], [39.5, 15.5], [38.5, 17.5], [37.0, 21.0], [35.5, 23.5],
  [34.5, 27.5], [32.5, 29.8], [32.5, 31.2], [30.0, 31.4], [27.0, 31.0], [24.0, 32.0],
  [20.0, 32.8], [17.5, 31.0], [15.0, 32.5], [11.5, 33.8], [10.0, 37.0], [8.0, 36.9],
  [4.0, 36.8], [0.0, 35.9], [-2.5, 35.3], [-5.5, 35.9], [-8.0, 33.5], [-9.5, 31.5],
  [-11.0, 28.5], [-13.0, 25.0], [-16.0, 21.5], [-16.5, 19.0],
];

const EURASIA: Ring = [
  [-9.5, 38.7], [-9.0, 41.5], [-8.5, 43.5], [-4.0, 43.5], [-1.5, 46.0], [-2.5, 48.5],
  [0.5, 49.5], [3.5, 51.5], [6.0, 53.5], [8.5, 54.5], [8.0, 57.0], [10.5, 57.8],
  [12.5, 56.0], [16.0, 56.5], [19.5, 57.5], [21.5, 59.0], [24.0, 60.0], [21.5, 62.5],
  [21.0, 65.5], [24.5, 65.8], [28.0, 68.5], [31.0, 70.0], [35.0, 69.5], [40.0, 66.5],
  [44.5, 66.5], [44.0, 68.5], [50.0, 69.0], [55.0, 69.5], [60.0, 70.0], [67.0, 69.0],
  [69.0, 73.0], [73.0, 72.0], [77.0, 72.5], [80.0, 74.0], [86.0, 74.5], [92.0, 76.0],
  [100.0, 77.0], [105.0, 78.0], [113.0, 76.5], [120.0, 75.5], [129.0, 74.0], [139.0, 72.5],
  [148.0, 70.5], [156.0, 71.0], [162.0, 70.0], [170.0, 69.5], [179.0, 68.0], [177.0, 65.0],
  [170.0, 62.5], [163.0, 60.0], [163.0, 57.5], [156.0, 51.5], [153.0, 47.5], [141.0, 46.0],
  [140.0, 42.5], [131.0, 43.5], [128.0, 38.5], [122.0, 39.5], [122.0, 37.0], [119.0, 34.5],
  [121.5, 30.5], [118.0, 24.5], [110.0, 21.0], [108.5, 16.0], [109.0, 11.0], [104.0, 8.5],
  [100.0, 13.5], [98.0, 16.5], [94.5, 16.0], [91.0, 21.5], [88.0, 21.5], [84.0, 19.0],
  [80.0, 15.5], [77.5, 8.5], [76.0, 13.0], [72.5, 19.5], [69.0, 22.5], [66.5, 25.0],
  [61.0, 25.0], [57.5, 24.0], [56.5, 26.5], [50.0, 29.5], [48.0, 30.0], [50.0, 27.0],
  [48.5, 24.5], [43.0, 17.0], [43.5, 12.8], [39.0, 21.5], [35.0, 28.0], [34.0, 31.5],
  [35.5, 36.5], [30.0, 36.5], [26.5, 38.5], [23.0, 40.0], [23.5, 37.5], [19.0, 40.0],
  [16.0, 41.5], [18.5, 40.0], [16.0, 38.0], [15.5, 42.0], [12.5, 45.0], [13.5, 45.5],
  [9.0, 44.0], [5.0, 43.0], [3.0, 42.0], [0.0, 39.5], [-3.0, 36.8], [-6.5, 37.0],
];

const AUSTRALIA: Ring = [
  [113.5, -22.0], [114.0, -26.0], [115.5, -31.5], [118.0, -34.5], [121.0, -34.0],
  [126.0, -32.5], [130.0, -31.5], [134.0, -33.0], [136.5, -35.0], [137.5, -33.0],
  [139.5, -35.5], [143.0, -38.5], [147.0, -38.5], [150.0, -37.5], [151.5, -33.0],
  [153.5, -28.5], [153.0, -25.5], [149.5, -22.0], [146.5, -19.0], [145.5, -15.0],
  [142.5, -11.0], [141.5, -13.5], [139.0, -17.5], [136.5, -12.5], [132.5, -11.5],
  [129.5, -14.5], [127.0, -14.0], [123.5, -16.5], [121.0, -19.5], [117.0, -20.5],
];

const ANTARCTICA: Ring = [
  [-180, -71], [-160, -74], [-140, -74.5], [-120, -73.5], [-100, -74.5], [-80, -72.5],
  [-60, -65], [-45, -66], [-30, -70], [-10, -71.5], [10, -70], [30, -69],
  [50, -67], [70, -67.5], [90, -66.5], [110, -66.5], [130, -66.5], [150, -70],
  [170, -72], [180, -71], [180, -90], [-180, -90],
];

/** Every landmass except South America, which the regional detail texture supplies. */
const LANDMASSES: ReadonlyArray<Ring> = [
  ANTARCTICA, NORTH_AMERICA, GREENLAND, AFRICA, EURASIA, AUSTRALIA,
];

/** Rio de Janeiro is the single anchor carried through globe → South America → Brazil. */
export const RIO = { lat: -22.9, lon: -43.2 } as const;

/**
 * Three restrained approach lines converging on the destination. They read as connection
 * rather than as a technical overlay, and they fade in with the destination so they
 * belong to the narrative instead of decorating it.
 */
const APPROACH_ROUTES: ReadonlyArray<readonly [number, number]> = [
  [-70.5, -12.0], [-52.0, -4.0], [-58.0, -31.0],
];

/** RT-10 palette. Land is matter; light is the coastline, not a fill. */
const PALETTE = {
  oceanHigh: "#121c26",
  oceanMid: "#0d1620",
  oceanLow: "#080e15",
  land: "#131a1c",
  landHigh: "#1a2224",
  graticule: "#c8a86b",
};

export const TEXTURE_WIDTH = 2048;
export const TEXTURE_HEIGHT = 1024;

/**
 * The South America detail texture covers only a regional box. A global 2048-wide map
 * carries ~6 texels per degree, which smears into a blur at the closest camera distance;
 * this box carries ~28 per degree over exactly the region inspected during 12–44%, at a
 * fraction of the memory a global 8k map would need.
 */
export const DETAIL_REGION = { lonMin: -85, lonMax: -30, latMin: -60, latMax: 15 } as const;
const DETAIL_TEXTURE_WIDTH = 1536;
const DETAIL_TEXTURE_HEIGHT = 2048;

/** [originU, originV, sizeU, sizeV] of the region inside the full equirectangular map. */
export function detailRegionUv(): [number, number, number, number] {
  return [
    (DETAIL_REGION.lonMin + 180) / 360,
    (90 - DETAIL_REGION.latMax) / 180,
    (DETAIL_REGION.lonMax - DETAIL_REGION.lonMin) / 360,
    (DETAIL_REGION.latMax - DETAIL_REGION.latMin) / 180,
  ];
}

type Projector = (lon: number, lat: number, width: number, height: number) => readonly [number, number];

function project(lon: number, lat: number, width: number, height: number) {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height] as const;
}

function projectRegion(lon: number, lat: number, width: number, height: number) {
  const { lonMin, lonMax, latMin, latMax } = DETAIL_REGION;
  return [
    ((lon - lonMin) / (lonMax - lonMin)) * width,
    ((latMax - lat) / (latMax - latMin)) * height,
  ] as const;
}

/**
 * Coastlines are traced as a smooth curve through the authored vertices rather than as a
 * polyline. Straight chords between sparse points were what made the earlier globe read
 * as crude; midpoint quadratics give the outline its finished, drawn quality without
 * inventing geographic detail that is not in the data.
 */
function tracePath(
  context: Context2D,
  ring: Ring,
  width: number,
  height: number,
  projector: Projector = project,
) {
  const points = ring.map(([lon, lat]) => projector(lon, lat, width, height));
  if (points.length < 3) return;
  context.beginPath();
  const first = points[0];
  const last = points[points.length - 1];
  context.moveTo((last[0] + first[0]) / 2, (last[1] + first[1]) / 2);
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(current[0], current[1], (current[0] + next[0]) / 2, (current[1] + next[1]) / 2);
  }
  context.closePath();
}

/** A texture canvas: a DOM canvas on the main thread, an OffscreenCanvas inside the texture worker (RT-45). */
export type TextureCanvas = HTMLCanvasElement | OffscreenCanvas;
type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function createCanvas(width: number, height: number): { canvas: TextureCanvas; context: Context2D } | null {
  // Same 2D API and drawing calls either way; pixel parity verified in Chromium (rt-45-globe-texture-parity).
  const canvas: TextureCanvas = typeof document === "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d") as Context2D | null;
  if (!context) return null;
  return { canvas, context };
}

/**
 * Lays a coastline down as a lit filament: a wide, dim halo, a tighter bloom, then a
 * crisp core. Drawn in a single colour channel so several independent signals can share
 * one texture under additive compositing.
 */
function strokeFilament(
  context: Context2D,
  colour: string,
  passes: ReadonlyArray<{ blur: number; width: number; alpha: number }>,
) {
  context.strokeStyle = colour;
  context.shadowColor = colour;
  context.lineJoin = "round";
  context.lineCap = "round";
  passes.forEach(pass => {
    context.shadowBlur = pass.blur;
    context.lineWidth = pass.width;
    context.globalAlpha = pass.alpha;
    context.stroke();
  });
  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

/**
 * Albedo: the matter of the planet. Deliberately dark and low contrast — the reading of
 * the continents comes from the glow texture, not from a bright fill, which is what
 * separates a premium night globe from a flat map.
 */
export function drawEarthTexture(): TextureCanvas | null {
  const made = createCanvas(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  if (!made) return null;
  const { canvas, context } = made;
  const { width, height } = canvas;

  const ocean = context.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, PALETTE.oceanLow);
  ocean.addColorStop(0.3, PALETTE.oceanHigh);
  ocean.addColorStop(0.5, PALETTE.oceanMid);
  ocean.addColorStop(0.72, PALETTE.oceanHigh);
  ocean.addColorStop(1, PALETTE.oceanLow);
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = PALETTE.graticule;
  context.globalAlpha = 0.055;
  context.lineWidth = 1.5;
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat, width, height);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const [x] = project(lon, 0, width, height);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  context.globalAlpha = 1;

  const land = context.createLinearGradient(0, 0, 0, height);
  land.addColorStop(0, PALETTE.land);
  land.addColorStop(0.45, PALETTE.landHigh);
  land.addColorStop(1, PALETTE.land);
  [...LANDMASSES, SOUTH_AMERICA].forEach(ring => {
    tracePath(context, ring, width, height);
    context.fillStyle = land;
    context.fill();
  });

  return canvas;
}

/**
 * Global coastline glow, every continent except South America. Grayscale: the shader
 * reads the red channel and tints it with the RT-10 gold.
 */
export function drawGlowTexture(): TextureCanvas | null {
  const made = createCanvas(TEXTURE_WIDTH, TEXTURE_HEIGHT);
  if (!made) return null;
  const { canvas, context } = made;
  const { width, height } = canvas;

  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "lighter";

  LANDMASSES.forEach(ring => {
    tracePath(context, ring, width, height);
    strokeFilament(context, "#ffffff", [
      { blur: 14, width: 2.4, alpha: 0.2 },
      { blur: 6, width: 1.6, alpha: 0.34 },
      { blur: 0, width: 1.0, alpha: 0.62 },
    ]);
  });

  return canvas;
}

/**
 * Regional detail for the segment the Owner is refining. One signal per channel so the
 * shader can drive them independently from the scroll:
 *   R — South America coastline, always present.
 *   G — the Brazil highlight, mixed in across 28–44%.
 *   B — the destination bloom and its approach lines.
 */
export function drawDetailTexture(): TextureCanvas | null {
  const made = createCanvas(DETAIL_TEXTURE_WIDTH, DETAIL_TEXTURE_HEIGHT);
  if (!made) return null;
  const { canvas, context } = made;
  const { width, height } = canvas;

  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "lighter";

  tracePath(context, SOUTH_AMERICA, width, height, projectRegion);
  strokeFilament(context, "#ff0000", [
    { blur: 26, width: 6, alpha: 0.16 },
    { blur: 12, width: 3.4, alpha: 0.3 },
    { blur: 0, width: 2.0, alpha: 0.72 },
  ]);

  tracePath(context, BRAZIL, width, height, projectRegion);
  context.globalAlpha = 0.1;
  context.fillStyle = "#00ff00";
  context.fill();
  strokeFilament(context, "#00ff00", [
    { blur: 30, width: 8, alpha: 0.18 },
    { blur: 14, width: 4, alpha: 0.32 },
    { blur: 0, width: 2.4, alpha: 0.85 },
  ]);

  const [rioX, rioY] = projectRegion(RIO.lon, RIO.lat, width, height);

  // Approach lines: thin, low alpha, curved toward the anchor. Connection, not a HUD.
  context.strokeStyle = "#0000ff";
  context.shadowColor = "#0000ff";
  context.lineCap = "round";
  APPROACH_ROUTES.forEach(([lon, lat]) => {
    const [x, y] = projectRegion(lon, lat, width, height);
    const bend = 0.28;
    const controlX = (x + rioX) / 2 + (rioY - y) * bend;
    const controlY = (y + rioY) / 2 - (rioX - x) * bend;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(controlX, controlY, rioX, rioY);
    context.shadowBlur = 10;
    context.lineWidth = 2.6;
    context.globalAlpha = 0.12;
    context.stroke();
    context.shadowBlur = 0;
    context.lineWidth = 1.2;
    context.globalAlpha = 0.28;
    context.stroke();
  });
  context.shadowBlur = 0;
  context.globalAlpha = 1;

  const bloom = context.createRadialGradient(rioX, rioY, 0, rioX, rioY, 120);
  bloom.addColorStop(0, "rgba(0,0,255,0.95)");
  bloom.addColorStop(0.14, "rgba(0,0,255,0.42)");
  bloom.addColorStop(0.45, "rgba(0,0,255,0.12)");
  bloom.addColorStop(1, "rgba(0,0,255,0)");
  context.fillStyle = bloom;
  context.beginPath();
  context.arc(rioX, rioY, 120, 0, Math.PI * 2);
  context.fill();

  return canvas;
}
