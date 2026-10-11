// RT-45: reproducible Lighthouse runs against a local production build.
// Usage: node scripts/rt-45-lighthouse-runs.mjs <baseUrl> <outDir> [runs=5] [paths=comma list]
// Runs each path N times for mobile (Lighthouse default: Moto G Power emulation, simulated 4x CPU / slow 4G)
// and desktop (--preset=desktop), sequentially, one Chrome per run. Writes every JSON plus summary.json.
// LIGHTHOUSE_CLI must point at lighthouse/cli/index.js (12.8.2 was used for the RT-45 evidence; it is not a project
// dependency). It is spawned with node directly, without a shell, so --chrome-flags is passed as one argument.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const [base = "http://127.0.0.1:3200", outDir = ".tmp/lh-runs", runsArg = "5", pathsArg] = process.argv.slice(2);
const runs = Number(runsArg);
const paths = (pathsArg ?? "/pt,/en,/pt/tours,/pt/contato,/pt/quem-somos,/pt/planeje-sua-viagem").split(",");
const chromePath = chromium.executablePath();
fs.mkdirSync(outDir, { recursive: true });

// Whole-machine CPU load % as Windows reports it (WMI Win32_Processor.LoadPercentage, mean of 3 samples ~1 s apart).
// os.cpus()-based sampling disagreed with Task Manager on this host, and os.loadavg() is always 0 on Windows.
function sampleCpuBusy() {
  if (process.platform !== "win32") return null;
  const ps = spawnSync("powershell", ["-NoProfile", "-Command",
    "$v = 1..3 | % { (Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average; Start-Sleep -Milliseconds 900 }; [int](($v | Measure-Object -Average).Average)"], { encoding: "utf8" });
  const n = Number.parseInt(ps.stdout, 10);
  return Number.isFinite(n) ? n : null;
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
if (!process.env.LIGHTHOUSE_CLI) throw new Error("set LIGHTHOUSE_CLI to lighthouse/cli/index.js");
const lighthouseVersion = JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.LIGHTHOUSE_CLI), "..", "package.json"), "utf8")).version;
const summary = { base, runs, lighthouseVersion, chromePath, host: { cpu: os.cpus()[0].model, cores: os.cpus().length, ramGb: Math.round(os.totalmem() / 2 ** 30) }, startedAt: new Date().toISOString(), results: [] };

for (const formFactor of ["mobile", "desktop"]) {
  for (const p of paths) {
    const metrics = [];
    for (let i = 1; i <= runs; i++) {
      const file = path.join(outDir, `${formFactor}${p.replace(/\//g, "_")}_${i}.json`);
      const args = [process.env.LIGHTHOUSE_CLI, base + p, "--output=json", `--output-path=${file}`, "--quiet",
        "--chrome-flags=--headless=new --no-sandbox", "--only-categories=performance,accessibility,best-practices,seo"];
      if (formFactor === "desktop") args.push("--preset=desktop");
      const hostCpuBusyBefore = sampleCpuBusy();
      fs.rmSync(file, { force: true });
      const run = spawnSync(process.execPath, args, { env: { ...process.env, CHROME_PATH: chromePath }, encoding: "utf8" });
      // On Windows Lighthouse can exit non-zero only because Chrome's temp profile cannot be deleted (EPERM) after the
      // report is written. A run counts only when its report exists and has no runtimeError; anything else aborts.
      if (!fs.existsSync(file)) throw new Error(`run failed (${formFactor} ${p} #${i}), exit ${run.status}: ${(run.stderr ?? "").slice(-800)}`);
      const r = JSON.parse(fs.readFileSync(file, "utf8"));
      if (r.runtimeError) throw new Error(`lighthouse runtimeError ${r.runtimeError.code} (${formFactor} ${p} #${i})`);
      const a = r.audits;
      metrics.push({
        perf: Math.round(r.categories.performance.score * 100), a11y: Math.round(r.categories.accessibility.score * 100),
        seo: Math.round(r.categories.seo.score * 100), bp: Math.round(r.categories["best-practices"].score * 100),
        lcp: a["largest-contentful-paint"].numericValue, tbt: a["total-blocking-time"].numericValue,
        cls: a["cumulative-layout-shift"].numericValue, fcp: a["first-contentful-paint"].numericValue,
        si: a["speed-index"].numericValue, benchmarkIndex: r.environment.benchmarkIndex, hostCpuBusyBefore,
      });
      process.stdout.write(`${formFactor} ${p} #${i} perf=${metrics.at(-1).perf} lcp=${Math.round(metrics.at(-1).lcp)} tbt=${Math.round(metrics.at(-1).tbt)}\n`);
    }
    const agg = {};
    for (const k of Object.keys(metrics[0])) { const v = metrics.map((m) => m[k]); agg[k] = { median: median(v), min: Math.min(...v), max: Math.max(...v) }; }
    summary.results.push({ formFactor, path: p, runs: metrics, agg });
  }
}
summary.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
