import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { normalizeMarkdown, validate } from "../scripts/rt-69-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "knowledge/concierge/manifest.json"), "utf8"));
const copy = () => structuredClone(manifest);

test("current PT manifest has nine registered versions and no active retrieval source", () => {
  assert.deepEqual(validate(copy()), { registered: 9, active: 0, catalog: 4 });
});

test("normalization removes metadata and exported Markdown escapes without rewriting words", () => {
  const result = normalizeMarkdown("\\# Título\r\n\r\nStatus: APPROVED  \r\nLocale: pt-BR  \r\n\r\n\\#\\# 1\\. Pergunta?\r\nResposta.\r\n");
  assert.equal(result, "# Título\n\n\n## 1. Pergunta?\nResposta.\n");
});

test("ACTIVE requires approved_for_rag and attributable approval metadata", () => {
  const broken = copy();
  broken.sources[0].status = "ACTIVE";
  assert.throws(() => validate(broken), /Manifest schema|Invalid ACTIVE/);
});

test("approved_for_rag cannot be true for DRAFT", () => {
  const broken = copy();
  broken.sources[0].approved_for_rag = true;
  assert.throws(() => validate(broken), /Manifest schema|Non-active retrieval/);
});

test("duplicate source versions and digest changes fail closed", () => {
  const duplicate = copy();
  duplicate.sources.push(structuredClone(duplicate.sources[0]));
  assert.throws(() => validate(duplicate), /Duplicate version/);
  const changed = copy();
  changed.sources[0].normalized_sha256 = "0".repeat(64);
  assert.throws(() => validate(changed), /Snapshot digest mismatch/);
});

test("behavioral policy cannot enter factual registry", () => {
  const broken = copy();
  broken.sources[0].source_location = "knowledge/concierge/approved/pt/service/concierge-recommendation-policy.md";
  assert.throws(() => validate(broken), /Manifest schema|Behavioral policy/);
});
