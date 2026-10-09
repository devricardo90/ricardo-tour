import test from "node:test";
import assert from "node:assert/strict";
import { assertMappedResult, assertRollbackEligible, buildPlan, digest, forbiddenResultText } from "../scripts/rt-69-hosted-plan.mjs";

test("Stage 2 projects exactly nine active PT sources with stable chunk identities", () => {
  const first = buildPlan();
  const second = buildPlan();
  assert.equal(first.projection_sha256, second.projection_sha256);
  assert.equal(first.sourceStats.length, 9);
  assert.equal(first.sourceStats.filter((source) => source.source_id.startsWith("public-tour-catalog:")).length, 4);
  assert.equal(new Set(first.chunks.map((chunk) => chunk.source_id)).size, 9);
  for (const chunk of first.chunks) {
    assert.equal(chunk.locale, "pt");
    assert.ok(Buffer.byteLength(chunk.content, "utf8") <= 2000);
    assert.equal(chunk.chunk_sha256, digest(chunk.content));
    assert.ok(!forbiddenResultText.test(chunk.content));
  }
  assert.ok(first.chunks.filter((chunk) => chunk.source_id === "approved-faq:pt").every((chunk) => /^## \d+\./.test(chunk.content)));
});

test("unmapped, stale, wrong-locale and blocked retrieval results fail closed", () => {
  const plan = buildPlan();
  const chunk = plan.chunks[0];
  const mapping = { files: [{ file_id: "file_test", chunk_id: chunk.chunk_id, source_version: chunk.source_version, chunk_sha256: chunk.chunk_sha256 }] };
  const attributes = { source_id: chunk.source_id, source_version: chunk.source_version, source_class: chunk.source_class,
    source_sha256: chunk.source_sha256, normalized_sha256: chunk.normalized_sha256, chunk_id: chunk.chunk_id,
    chunk_ordinal: chunk.chunk_ordinal, chunk_sha256: chunk.chunk_sha256, locale: "pt" };
  assert.equal(assertMappedResult({ file_id: "file_test", attributes }, mapping, plan), true);
  assert.equal(assertMappedResult({ file_id: "file_unmapped", attributes }, mapping, plan), false);
  assert.equal(assertMappedResult({ file_id: "file_test", attributes: { ...attributes, locale: "en" } }, mapping, plan), false);
  assert.equal(assertMappedResult({ file_id: "file_test", attributes: { ...attributes, source_version: "sha256:stale" } }, mapping, plan), false);
});

test("rollback accepts only the exact still-current approved version", () => {
  const plan = buildPlan();
  const chunk = plan.chunks[0];
  const candidate = { source_id: chunk.source_id, source_version: chunk.source_version, source_sha256: chunk.source_sha256, normalized_sha256: chunk.normalized_sha256 };
  assert.equal(assertRollbackEligible(candidate, plan), true);
  assert.throws(() => assertRollbackEligible({ ...candidate, source_version: "sha256:retired" }, plan), /Rollback denied/);
  assert.throws(() => assertRollbackEligible({ ...candidate, source_sha256: "changed" }, plan), /Rollback denied/);
  assert.throws(() => assertRollbackEligible(candidate, { ...plan, chunks: plan.chunks.filter((item) => item.source_id !== candidate.source_id) }), /Rollback denied/);
});

test("FAQ projection is a digest-bound whole-section selection covering all 100 questions", () => {
  const plan = buildPlan();
  const total = Object.values(plan.faq).reduce((sum, list) => sum + list.length, 0);
  assert.equal(total, 100);
  assert.equal(new Set(Object.values(plan.faq).flat()).size, 100);
  const faqChunks = plan.chunks.filter((chunk) => chunk.source_class === "approved-faq");
  assert.equal(faqChunks.length, plan.faq.A.length);
  assert.deepEqual(faqChunks.map((chunk) => Number(chunk.content.match(/^## (\d+)\./)[1])), plan.faq.A);
  for (const chunk of faqChunks) assert.ok(!/concierge/i.test(chunk.content.split("\n").slice(1).join("\n")), "runtime behavior leaked into FAQ chunk");
  for (const number of [8, 9, 17, 18, 35, 56, 83, 84, 87, 92, 93]) assert.ok(!plan.faq.A.includes(number), "FAQ " + number + " must stay out of factual retrieval");
  for (const number of [3, 4, 7, 11, 12, 33, 79, 80]) assert.ok(plan.faq.A.includes(number), "FAQ " + number + " is safe explanatory knowledge");
});

test("a changed FAQ digest invalidates the projection review", async () => {
  const { faqReview } = await import("../scripts/rt-69-hosted-plan.mjs");
  assert.throws(() => faqReview({ source_id: "approved-faq:pt", source_sha256: "changed", version: "sha256:x" }, ""), /stale/);
});
