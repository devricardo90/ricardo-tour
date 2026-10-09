/** RT-69 Stage 2: deterministic, factual-only hosted retrieval projection. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validate } from "./rt-69-registry.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
export const digest = (value) => createHash("sha256").update(value).digest("hex");

// Exclude dynamic commercial facts and behavioral instructions from factual retrieval.
const excluded = /(?:\b(?:oner|comprar viagem|concierge|preç\w*|tarifa\w*|disponibilid\w*|reserva\w*|pagamento\w*|cancelamento|reembolso|pol[ií]tica\w*|hor[aá]rio\w*|seguran[cç]a|clima|tempo real|passagem\w*|fornecedor\w*|contrata[cç][aã]o|responsabilidade contratual)\b|R\$\s*\d|US\$\s*\d|€\s*\d)/iu;
const excludedPolicy = /(?:recomend[a-zçãõ]*|instru[cç][aã]o|regra para|n[aã]o deve|deve responder|deve informar)/iu;

// FAQ projection is a reviewed, digest-bound whole-section selection (see faq-projection-review.json).
// Answers are mostly Concierge behavior rules; only customer-facing factual/explanatory sections are published.
const factualLint = /R\$\s*\d|US\$\s*\d|€\s*\d|\boner\b|concierge[^\n]*\b(?:deve|pode)\b|\bnão deve\b|\bdeve (?:responder|informar)\b|regra para/iu;
const dynamicTopic = /preç\w*|tarifa\w*|disponibilid\w*|pagamento\w*|reembols\w*|cancel\w*|moeda|hor[aá]rio\w*|ingresso\w*|clima|chuva|bagagem|fornecedor\w*|reserva\w*/iu;

export function faqReview(source, snapshot) {
  const review = JSON.parse(read("knowledge/concierge/faq-projection-review.json"));
  if (review.source_id !== source.source_id || review.source_sha256 !== source.source_sha256 || review.source_version !== source.version) {
    throw new Error("FAQ projection review is stale for the active FAQ version; re-review required");
  }
  const publish = new Set(review.publish);
  const highRisk = new Set(review.high_risk);
  const classes = { A: [], B: [], C: [], D: [], E: [] };
  const kept = [];
  for (const section of sections(snapshot).filter((item) => /^## \d+\./.test(item))) {
    const number = Number(section.match(/^## (\d+)\./)[1]);
    const body = section.split("\n").slice(1).join("\n");
    let klass;
    if (publish.has(number)) {
      if (highRisk.has(number) || factualLint.test(body) || /concierge/i.test(body)) throw new Error(`FAQ ${number} fails factual lint`);
      klass = "A"; kept.push(section);
    } else if (highRisk.has(number)) klass = "D";
    else if (dynamicTopic.test(section)) klass = "B";
    else if (/concierge|não deve|fonte (?:oficial )?aprovad/iu.test(body)) klass = "C";
    else klass = "E";
    classes[klass].push(number);
  }
  const total = Object.values(classes).reduce((sum, list) => sum + list.length, 0);
  if (total !== 100 || [...publish].some((n) => !classes.A.includes(n))) throw new Error("FAQ classification must cover exactly the 100 canonical questions");
  return { kept, classes };
}

function sections(markdown) {
  return markdown.split(/(?=^## )/m).slice(1).map((section) => section.trim()).filter(Boolean);
}

function factualSections(source, snapshot) {
  if (source.source_class === "public-tour-catalog") {
    const item = JSON.parse(snapshot);
    return [`# ${item.title}\n\n${item.description}\n\n${item.public_url}`];
  }
  const candidates = sections(snapshot);
  if (source.source_class === "approved-faq") {
    return faqReview(source, snapshot).kept;
  }
  if (source.source_class === "canonical-public-contact") {
    return candidates.filter((section) => /^## (?:E-mail oficial|WhatsApp oficial|Website oficial)/.test(section));
  }
  if (source.source_class === "owner-approved-human-handoff") {
    return candidates.filter((section) => /^## Canal (?:principal|secundário)/.test(section));
  }
  if (source.source_class === "owner-approved-business-profile") {
    return candidates.filter((section) => /^## (?:Identidade|Foco principal)/.test(section))
      .map((section) => section.split(/\n\s*\n/).filter((paragraph) => !excluded.test(paragraph) && !excludedPolicy.test(paragraph)).join("\n\n"));
  }
  if (source.source_class === "rio-destination-editorial") {
    return candidates.map((section) => section.split(/\n\s*\n/).filter((paragraph) => !excluded.test(paragraph) && !excludedPolicy.test(paragraph)).join("\n\n"))
      .filter((section) => section.includes("\n\n"));
  }
  throw new Error(`Unapproved source class: ${source.source_class}`);
}

export function buildPlan() {
  const gate = validate();
  if (gate.registered !== 9 || gate.active !== 9 || gate.catalog !== 4) throw new Error("RT-69 active-source count changed");
  const manifest = JSON.parse(read("knowledge/concierge/manifest.json"));
  const current = JSON.parse(read("knowledge/concierge/catalog-current.json"));
  if (Date.now() - Date.parse(current.observed_at) > 30 * 60_000) throw new Error("Public catalog gate observation is stale");
  const active = manifest.sources.filter((source) => source.status === "ACTIVE" && source.approved_for_rag && source.locale === "pt")
    .sort((a, b) => a.source_id.localeCompare(b.source_id));
  if (active.length !== 9 || active.filter((source) => source.source_class === "public-tour-catalog").length !== 4) throw new Error("RT-69 eligible-source count changed");
  const chunks = [];
  const sourceStats = [];
  let faq;
  for (const source of active) {
    const snapshot = read(source.snapshot_path);
    const kept = factualSections(source, snapshot).map((section) => `${section.trim()}\n`).filter((section) => section.trim());
    if (!kept.length) throw new Error(`No factual chunks for ${source.source_id}`);
    const candidates = source.source_class === "approved-faq" ? 100 : source.source_class === "public-tour-catalog" ? 1 : sections(snapshot).length;
    for (const [index, content] of kept.entries()) {
      if (Buffer.byteLength(content, "utf8") > 2000) throw new Error(`Oversized factual chunk: ${source.source_id}/${index}`);
      if (source.source_class !== "approved-faq" && (excluded.test(content) || excludedPolicy.test(content)) || source.source_class === "approved-faq" && factualLint.test(content)) throw new Error(`Excluded content in factual chunk: ${source.source_id}/${index}`);
      const chunk_sha256 = digest(content);
      chunks.push({
        chunk_id: digest(`${source.source_id}\n${source.version}\npt\n${index}\n${chunk_sha256}`),
        chunk_ordinal: index, chunk_sha256, content,
        source_id: source.source_id, source_version: source.version,
        source_class: source.source_class, locale: "pt", source_location: source.source_location,
        source_sha256: source.source_sha256, normalized_sha256: source.normalized_sha256,
      });
    }
    sourceStats.push({ source_id: source.source_id, candidate_sections: candidates, published_chunks: kept.length });
    if (source.source_class === "approved-faq") faq = faqReview(source, snapshot).classes;
  }
  const manifest_sha256 = digest(read("knowledge/concierge/manifest.json"));
  const projection_sha256 = digest(chunks.map(({ chunk_id }) => chunk_id).join("\n"));
  return { manifest_sha256, projection_sha256, catalog_observed_at: current.observed_at, sourceStats, faq, chunks };
}

export function assertMappedResult(result, mapping, plan) {
  const mapped = mapping.files.find((file) => file.file_id === result.file_id);
  if (!mapped) return false;
  const chunk = plan.chunks.find((item) => item.chunk_id === mapped.chunk_id);
  if (!chunk || mapped.source_version !== chunk.source_version || mapped.chunk_sha256 !== chunk.chunk_sha256) return false;
  if (result.attributes?.source_id !== chunk.source_id || result.attributes?.source_version !== chunk.source_version ||
    result.attributes?.source_class !== chunk.source_class || result.attributes?.source_sha256 !== chunk.source_sha256 ||
    result.attributes?.normalized_sha256 !== chunk.normalized_sha256 || result.attributes?.chunk_id !== chunk.chunk_id ||
    result.attributes?.chunk_ordinal !== chunk.chunk_ordinal || result.attributes?.chunk_sha256 !== chunk.chunk_sha256 ||
    result.attributes?.locale !== "pt") return false;
  return true;
}

export function assertRollbackEligible(candidate, plan) {
  const active = plan.chunks.find((chunk) => chunk.source_id === candidate.source_id && chunk.source_version === candidate.source_version);
  if (!active || candidate.source_sha256 !== active.source_sha256 || candidate.normalized_sha256 !== active.normalized_sha256) throw new Error("Rollback denied: source version is no longer current and approved");
  return true;
}

/** Text that must never come back from hosted retrieval: live money values, provider inventory, runtime behavior rules. */
export const forbiddenResultText = /R\$\s*\d|US\$\s*\d|€\s*\d|\boner\b|regra para o concierge|\bnão deve\b/iu;