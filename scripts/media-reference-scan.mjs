// RT-79 preparation: lists every media file shipped with the app and where (if anywhere) its file name is referenced.
// Read-only. Usage: node scripts/media-reference-scan.mjs [--json]
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const MEDIA = /\.(jpe?g|png|webp|svg|mp4|webm|avif|gif|ico)$/i;
const ROOTS = ["public", "components/home/hero/assets"];
const SEARCH = ["app", "components", "lib", "messages", "data", "scripts", "prisma", "knowledge", "e2e", "tests", "docs", "i18n", "proxy.ts", "next.config.ts", "README.md"];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (MEDIA.test(entry.name)) acc.push(p.replaceAll("\\", "/"));
  }
  return acc;
}

function referencedBy(file) {
  try {
    const out = execFileSync("git", ["grep", "-l", "-F", "-e", basename(file), "--", ...SEARCH], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const rows = ROOTS.flatMap((r) => walk(r)).map((file) => {
  const refs = referencedBy(file);
  const code = refs.filter((r) => !r.startsWith("docs/") && !r.startsWith("tests/") && !r.startsWith("e2e/") && !r.startsWith("scripts/"));
  return { file, kb: Math.round(statSync(file).size / 1024), codeRefs: code, otherRefs: refs.filter((r) => !code.includes(r)) };
});

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  for (const r of rows) {
    const tag = r.codeRefs.length ? "USED " : r.otherRefs.length ? "DOCS " : "NOREF";
    const where = (r.codeRefs.length ? r.codeRefs : r.otherRefs).slice(0, 2).join(", ");
    console.log(`${tag} ${String(r.kb).padStart(5)} KB  ${r.file}${where ? "  <- " + where : ""}`);
  }
}
