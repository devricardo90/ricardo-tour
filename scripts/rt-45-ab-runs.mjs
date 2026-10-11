// RT-45: interleaved A/B Lighthouse runs. Two builds are served side by side (A = before, B = after) and every
// measurement of B is taken right next to the matching measurement of A on the same page and form factor, alternating
// the order each round (AB, BA, AB, ...). Host-load drift therefore hits both builds equally, which a "before matrix,
// then after matrix" design cannot guarantee. Usage:
//   LIGHTHOUSE_CLI=.../lighthouse/cli/index.js node scripts/rt-45-ab-runs.mjs <urlA> <urlB> <outDir> [rounds=5] [paths]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const [urlA, urlB, outDir, roundsArg = "5", pathsArg] = process.argv.slice(2);
const rounds = Number(roundsArg);
const paths = (pathsArg ?? "/pt,/pt/tours,/pt/contato,/pt/quem-somos,/pt/planeje-sua-viagem").split(",");
if (!process.env.LIGHTHOUSE_CLI) throw new Error("set LIGHTHOUSE_CLI");
const chromePath = chromium.executablePath();
fs.mkdirSync(outDir, { recursive: true });

function cpuLoad() {
  if (process.platform !== "win32") return null;
  const ps = spawnSync("powershell", ["-NoProfile", "-Command", "$v = 1..3 | % { (Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average; Start-Sleep -Milliseconds 900 }; [int](($v | Measure-Object -Average).Average)"], { encoding: "utf8" });
  const n = Number.parseInt(ps.stdout, 10);
  return Number.isFinite(n) ? n : null;
}
// Both servers must answer before every run; a measurement against a dead server would be an error page, not data.
async function assertUp(base) {
  try {
    const res = await fetch(base + "/pt", { signal: AbortSignal.timeout(60000) });
    if (res.status !== 200) throw new Error(`status ${res.status}`);
  } catch (error) {
    throw new Error(`server ${base} is not serving (${error.message}); aborting so no run is measured against an error page`);
  }
}
function run(label, base, formFactor, p, i) {
  const file = path.join(outDir, `${label}_${formFactor}${p.replace(/\//g, "_")}_${i}.json`);
  const args = [process.env.LIGHTHOUSE_CLI, base + p, "--output=json", `--output-path=${file}`, "--quiet",
    "--chrome-flags=--headless=new --no-sandbox", "--only-categories=performance"];
  if (formFactor === "desktop") args.push("--preset=desktop");
  const cpu = cpuLoad();
  fs.rmSync(file, { force: true });
  spawnSync(process.execPath, args, { env: { ...process.env, CHROME_PATH: chromePath }, encoding: "utf8" });
  if (!fs.existsSync(file)) throw new Error(`run failed ${label} ${formFactor} ${p} #${i}`);
  const r = JSON.parse(fs.readFileSync(file, "utf8"));
  if (r.runtimeError) throw new Error(`runtimeError ${r.runtimeError.code} ${label} ${formFactor} ${p} #${i}`);
  const a = r.audits;
  return { perf: Math.round(r.categories.performance.score * 100), lcp: a["largest-contentful-paint"].numericValue, tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue, fcp: a["first-contentful-paint"].numericValue, benchmarkIndex: r.environment.benchmarkIndex, cpu };
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const results = {};
const started = new Date().toISOString();
for (let i = 1; i <= rounds; i++) {
  for (const formFactor of (process.env.AB_FORM_FACTORS ?? "mobile,desktop").split(",")) {
    for (const p of paths) {
      const order = i % 2 ? [["A", urlA], ["B", urlB]] : [["B", urlB], ["A", urlA]];
      for (const [label, base] of order) {
        await assertUp(urlA);
        await assertUp(urlB);
        const m = run(label, base, formFactor, p, i);
        const key = `${formFactor} ${p}`;
        ((results[key] ??= { A: [], B: [] })[label]).push(m);
        process.stdout.write(`round ${i} ${label} ${key} perf=${m.perf} lcp=${Math.round(m.lcp)} tbt=${Math.round(m.tbt)} cpu=${m.cpu} bi=${m.benchmarkIndex}\n`);
      }
    }
  }
}
const summary = { urlA, urlB, rounds, started, finished: new Date().toISOString(), host: { cpu: os.cpus()[0].model, logical: os.cpus().length }, pages: {} };
for (const [key, { A, B }] of Object.entries(results)) {
  const agg = (arr) => Object.fromEntries(Object.keys(arr[0]).map((k) => { const v = arr.map((x) => x[k]).filter((x) => x != null); return [k, { median: median(v), min: Math.min(...v), max: Math.max(...v) }]; }));
  // Paired deltas: round i of B minus round i of A (same page, same minute).
  const paired = Object.fromEntries(["perf", "lcp", "tbt", "cls", "fcp"].map((k) => [k, A.map((a, i) => B[i][k] - a[k])]));
  summary.pages[key] = { A: agg(A), B: agg(B), paired: Object.fromEntries(Object.entries(paired).map(([k, d]) => [k, { median: median(d), min: Math.min(...d), max: Math.max(...d), allSameSign: d.every((x) => x < 0) || d.every((x) => x > 0) }])), raw: { A, B } };
}
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
