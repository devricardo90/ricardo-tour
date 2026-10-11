// RT-45: compare two Lighthouse matrices produced by rt-45-lighthouse-runs.mjs. For each page × form factor prints
// median [min–max] before/after, the median delta, and whether the 5-run ranges overlap. Non-overlapping ranges are
// used as the (conservative) criterion for a robust change with n=5. Usage: node scripts/rt-45-compare.mjs <before> <after>
import fs from "node:fs";
import path from "node:path";

const [beforeDir, afterDir, outFile] = process.argv.slice(2);
const load = (d) => JSON.parse(fs.readFileSync(path.join(d, "summary.json"), "utf8"));
const before = load(beforeDir), after = load(afterDir);
const metrics = [["perf", "Perf", 0, 1], ["lcp", "LCP ms", 0, -1], ["tbt", "TBT ms", 0, -1], ["cls", "CLS", 3, -1], ["fcp", "FCP ms", 0, -1], ["a11y", "A11y", 0, 1]];
const rows = [];
for (const b of before.results) {
  const a = after.results.find((r) => r.formFactor === b.formFactor && r.path === b.path);
  if (!a) continue;
  const row = { page: `${b.formFactor} ${b.path}`, conditions: {
    cpuBefore: b.agg.hostCpuBusyBefore?.median, cpuAfter: a.agg.hostCpuBusyBefore?.median,
    benchBefore: b.agg.benchmarkIndex.median, benchAfter: a.agg.benchmarkIndex.median } };
  for (const [k, , , better] of metrics) {
    const B = b.agg[k], A = a.agg[k];
    const overlap = !(A.max < B.min || A.min > B.max);
    const delta = A.median - B.median;
    const verdict = overlap ? "within noise" : (Math.sign(delta) === better ? "IMPROVED" : "REGRESSED");
    row[k] = { before: B, after: A, delta, verdict };
  }
  rows.push(row);
}
const fmt = (x, d) => (x == null ? "-" : Number(x).toFixed(d));
for (const r of rows) {
  console.log(`\n${r.page}   (CPU load ${r.conditions.cpuBefore}%→${r.conditions.cpuAfter}%, benchmarkIndex ${r.conditions.benchBefore}→${r.conditions.benchAfter})`);
  for (const [k, label, d] of metrics) {
    const m = r[k];
    console.log(`  ${label.padEnd(7)} ${fmt(m.before.median, d).padStart(7)} [${fmt(m.before.min, d)}–${fmt(m.before.max, d)}]  →  ${fmt(m.after.median, d).padStart(7)} [${fmt(m.after.min, d)}–${fmt(m.after.max, d)}]   Δ ${fmt(m.delta, d).padStart(7)}  ${m.verdict}`);
  }
}
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ before: { startedAt: before.startedAt, lighthouse: before.lighthouseVersion }, after: { startedAt: after.startedAt, lighthouse: after.lighthouseVersion }, host: before.host, rows }, null, 2));
