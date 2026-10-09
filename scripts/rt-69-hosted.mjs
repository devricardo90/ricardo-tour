/** RT-69 Stage 2 isolated hosted retrieval. Never used by production Concierge runtime. */
import { readFileSync, existsSync, writeFileSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";
import { assertMappedResult, buildPlan, forbiddenResultText } from "./rt-69-hosted-plan.mjs";

const root = resolve(import.meta.dirname, "..");
const mapPath = resolve(root, "knowledge/concierge/.hosted-publication.local.json");
const mode = process.argv[2] ?? "plan";
let apiCalls = 0;

function save(mapping) {
  const temporary = `${mapPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(mapping, null, 2)}\n`, "utf8");
  renameSync(temporary, mapPath);
}

function client() {
  dotenv.config({ path: resolve(root, ".env.local"), quiet: true });
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is unavailable");
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0,
    fetch: (...args) => { apiCalls++; return fetch(...args); },
  });
}

function attributes(chunk) {
  return {
    source_id: chunk.source_id, source_version: chunk.source_version,
    source_class: chunk.source_class, locale: chunk.locale,
    source_sha256: chunk.source_sha256, normalized_sha256: chunk.normalized_sha256,
    chunk_id: chunk.chunk_id, chunk_ordinal: chunk.chunk_ordinal,
    chunk_sha256: chunk.chunk_sha256,
  };
}

async function publish(plan) {
  if (existsSync(mapPath)) throw new Error("Hosted publication mapping already exists; refuse duplicate publication");
  const openai = client();
  const store = await openai.vectorStores.create({
    name: `Ricardo Tour Concierge RT-69 PT factual ${plan.projection_sha256.slice(0,12)}`,
    expires_after: { anchor: "last_active_at", days: 30 },
  });
  const mapping = {
    schema_version: 1, state: "UPLOADING", vector_store_id: store.id,
    manifest_sha256: plan.manifest_sha256, projection_sha256: plan.projection_sha256,
    catalog_observed_at: plan.catalog_observed_at, created_at: new Date().toISOString(),
    source_stats: plan.sourceStats, files: [],
  };
  save(mapping);
  for (const chunk of plan.chunks) {
    const uploaded = await openai.files.create({
      file: await toFile(Buffer.from(chunk.content, "utf8"), `rt69-${chunk.chunk_id}.md`, { type: "text/markdown" }),
      purpose: "assistants",
    });
    mapping.files.push({ file_id: uploaded.id, chunk_id: chunk.chunk_id, chunk_sha256: chunk.chunk_sha256,
      source_id: chunk.source_id, source_version: chunk.source_version });
    save(mapping);
  }
  mapping.state = "INDEXING";
  save(mapping);
  const batch = await openai.vectorStores.fileBatches.createAndPoll(store.id, {
    files: mapping.files.map((file) => {
      const chunk = plan.chunks.find((item) => item.chunk_id === file.chunk_id);
      return { file_id: file.file_id, attributes: attributes(chunk) };
    }),
  });
  if (batch.status !== "completed" || batch.file_counts.completed !== plan.chunks.length || batch.file_counts.failed !== 0) {
    throw new Error(`Hosted indexing incomplete: status=${batch.status}, completed=${batch.file_counts.completed}, failed=${batch.file_counts.failed}`);
  }
  mapping.batch_id = batch.id;
  mapping.state = "INDEXED";
  mapping.indexed_at = new Date().toISOString();
  save(mapping);
  console.log(JSON.stringify({ status: "INDEXED", sources: plan.sourceStats.length, chunks: plan.chunks.length, api_calls: apiCalls }));
}

/** Reuses the existing isolated store: uploads only missing chunks, then retires files no longer in the plan. */
async function sync(plan) {
  if (!existsSync(mapPath)) throw new Error("No hosted publication mapping");
  const mapping = JSON.parse(readFileSync(mapPath, "utf8"));
  if (!["INDEXED", "VERIFIED", "SYNCING"].includes(mapping.state)) throw new Error(`Hosted publication cannot sync from state ${mapping.state}`);
  const openai = client();
  const wanted = new Set(plan.chunks.map((chunk) => chunk.chunk_id));
  const present = new Set(mapping.files.map((file) => file.chunk_id));
  const additions = plan.chunks.filter((chunk) => !present.has(chunk.chunk_id));
  const retirements = mapping.files.filter((file) => !wanted.has(file.chunk_id));
  mapping.state = "SYNCING";
  mapping.pending_sync = { add: additions.length, retire: retirements.length };
  save(mapping);
  const uploaded = [];
  for (const chunk of additions) {
    const file = await openai.files.create({
      file: await toFile(Buffer.from(chunk.content, "utf8"), `rt69-${chunk.chunk_id}.md`, { type: "text/markdown" }),
      purpose: "assistants",
    });
    const entry = { file_id: file.id, chunk_id: chunk.chunk_id, chunk_sha256: chunk.chunk_sha256, source_id: chunk.source_id, source_version: chunk.source_version };
    mapping.files.push(entry);
    uploaded.push({ entry, chunk });
    save(mapping);
  }
  if (uploaded.length) {
    const batch = await openai.vectorStores.fileBatches.createAndPoll(mapping.vector_store_id, {
      files: uploaded.map(({ entry, chunk }) => ({ file_id: entry.file_id, attributes: attributes(chunk) })),
    });
    if (batch.status !== "completed" || batch.file_counts.completed !== uploaded.length || batch.file_counts.failed !== 0) {
      throw new Error(`Hosted sync indexing incomplete: status=${batch.status}, completed=${batch.file_counts.completed}, failed=${batch.file_counts.failed}`);
    }
    mapping.batch_id = batch.id;
  }
  mapping.retired ??= [];
  for (const file of retirements) {
    for (const remove of [
      () => openai.vectorStores.files.delete(file.file_id, { vector_store_id: mapping.vector_store_id }),
      () => openai.files.delete(file.file_id),
    ]) {
      try { await remove(); } catch (error) { if (error?.status !== 404) throw error; }
    }
    mapping.files = mapping.files.filter((item) => item.file_id !== file.file_id);
    mapping.retired.push({ ...file, retired_at: new Date().toISOString(), reason: "superseded-by-faq-projection-review" });
    save(mapping);
  }
  Object.assign(mapping, {
    state: "INDEXED", manifest_sha256: plan.manifest_sha256, projection_sha256: plan.projection_sha256,
    catalog_observed_at: plan.catalog_observed_at, source_stats: plan.sourceStats, indexed_at: new Date().toISOString(),
  });
  delete mapping.pending_sync; delete mapping.verified_at; delete mapping.evidence;
  save(mapping);
  console.log(JSON.stringify({ status: "SYNCED", added: additions.length, retired: retirements.length, chunks: plan.chunks.length, api_calls: apiCalls }));
}

async function searchChecked(openai, mapping, plan, query, filters, minimum = 0) {
  const page = await openai.vectorStores.search(mapping.vector_store_id, { query, filters, max_num_results: 10, rewrite_query: false });
  if (page.data.length < minimum) throw new Error(`Retrieval smoke returned fewer than ${minimum} results`);
  for (const result of page.data) {
    if (!assertMappedResult(result, mapping, plan)) throw new Error("Unmapped, stale or wrong-locale hosted result");
    for (const part of result.content ?? []) {
      if (forbiddenResultText.test(part.text ?? "")) {
        throw new Error("Excluded commercial, provider or behavioral text returned by hosted retrieval");
      }
    }
  }
  return page.data;
}

async function verify(plan) {
  if (!existsSync(mapPath)) throw new Error("No hosted publication mapping");
  const mapping = JSON.parse(readFileSync(mapPath, "utf8"));
  if (mapping.state !== "INDEXED" && mapping.state !== "VERIFIED") throw new Error(`Hosted publication not indexed: ${mapping.state}`);
  if (mapping.manifest_sha256 !== plan.manifest_sha256 || mapping.projection_sha256 !== plan.projection_sha256 || mapping.files.length !== plan.chunks.length) throw new Error("Hosted mapping differs from current active manifest or projection");
  const openai = client();
  const store = await openai.vectorStores.retrieve(mapping.vector_store_id);
  if (store.status !== "completed" || store.file_counts.completed !== plan.chunks.length) throw new Error("Hosted store indexing status changed");
  let positive = 0;
  for (const source of plan.sourceStats) {
    const chunk = plan.chunks.find((item) => item.source_id === source.source_id);
    const query = chunk.content.slice(0, 160).replace(/^#+\s*/, "");
    const results = await searchChecked(openai, mapping, plan, query,
      { type: "and", filters: [{ type: "eq", key: "locale", value: "pt" }, { type: "eq", key: "source_id", value: source.source_id }] }, 1);
    if (!results.some((result) => result.attributes?.source_id === source.source_id)) throw new Error(`Positive retrieval missed ${source.source_id}`);
    positive++;
  }
  const faqFilter = { type: "and", filters: [{ type: "eq", key: "locale", value: "pt" }, { type: "eq", key: "source_id", value: "approved-faq:pt" }] };
  for (const [query, number] of [
    ["Posso falar com uma pessoa em vez do Concierge?", 11], ["A Ricardo Tour atende em outros idiomas?", 12],
    ["O preço mostrado no site é garantido?", 7], ["Minha reserva está confirmada quando envio uma mensagem no WhatsApp?", 33],
  ]) {
    const results = await searchChecked(openai, mapping, plan, query, faqFilter, 1);
    if (!results.some((result) => result.content?.some((part) => part.text?.startsWith(`## ${number}.`)))) throw new Error(`FAQ positive retrieval missed question ${number}`);
    positive++;
  }
  let negative = 0;
  const excludedFaq = new Set([...plan.faq.B, ...plan.faq.C, ...plan.faq.D, ...plan.faq.E].map(String));
  for (const query of ["Posso cancelar um passeio?", "Tenho direito a reembolso?", "Preciso de passaporte ou visto?", "Quanto tempo leva para receber um reembolso?", "O Concierge pode informar o preço de um passeio?"]) {
    const results = await searchChecked(openai, mapping, plan, query, { type: "eq", key: "source_id", value: "approved-faq:pt" });
    for (const result of results) {
      for (const part of result.content ?? []) {
        const number = part.text?.match(/^## (\d+)\./)?.[1];
        if (number && excludedFaq.has(number)) throw new Error(`Excluded FAQ question ${number} returned by hosted retrieval`);
      }
    }
    negative++;
  }
  for (const query of ["Qual o preço exato e disponibilidade hoje?", "Inventário Oner de voos e hotéis", "Política de cancelamento e reservas confirmadas"]) {
    await searchChecked(openai, mapping, plan, query, { type: "eq", key: "locale", value: "pt" });
    negative++;
  }
  for (const filter of [
    { type: "eq", key: "locale", value: "en" },
    { type: "eq", key: "locale", value: "es" },
    { type: "eq", key: "source_id", value: "current-about-and-institutional-content:pt" },
    { type: "eq", key: "source_id", value: "concierge-recommendation-policy:pt" },
    { type: "eq", key: "source_version", value: "sha256:stale" },
  ]) {
    const results = await searchChecked(openai, mapping, plan, "Ricardo Tour Rio de Janeiro", filter);
    if (results.length) throw new Error("Excluded locale, blocked, policy or stale source returned");
    negative++;
  }
  mapping.state = "VERIFIED";
  mapping.verified_at = new Date().toISOString();
  mapping.evidence = { positive, negative, api_calls: apiCalls };
  save(mapping);
  console.log(JSON.stringify({ status: "VERIFIED", sources: plan.sourceStats.length, chunks: plan.chunks.length, positive, negative, api_calls: apiCalls }));
}

try {
  const plan = buildPlan();
  if (mode === "plan") console.log(JSON.stringify({ status: "READY", sources: plan.sourceStats, chunks: plan.chunks.length, projection_sha256: plan.projection_sha256 }));
  else if (mode === "publish") await publish(plan);
  else if (mode === "sync") await sync(plan);
  else if (mode === "verify") await verify(plan);
  else throw new Error("Usage: node scripts/rt-69-hosted.mjs [plan|publish|sync|verify]");
} catch (error) {
  const key = process.env.OPENAI_API_KEY ?? "";
  const message = String(error?.message ?? error).replaceAll(key || "__no_key__", "[REDACTED]");
  console.error(JSON.stringify({ status: "STOPPED", mode, http_status: error?.status ?? null, code: error?.code ?? null, error: message.slice(0, 800), api_calls: apiCalls }));
  process.exitCode = 1;
}
