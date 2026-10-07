/** RT-69 Stage 1: local-only source registration and validation. No provider calls. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = "knowledge/concierge";
const manifestPath = `${registryDir}/manifest.json`;
const schemaPath = `${registryDir}/manifest.schema.json`;
const policyPath = `${registryDir}/approved/pt/service/concierge-recommendation-policy.md`;

export const editorialSources = [
  { source_id: "owner-approved-business-profile:pt", source_class: "owner-approved-business-profile", title: "Ricardo Tour business profile", source_location: `${registryDir}/approved/pt/business/business-profile-ricardo-tour.md` },
  { source_id: "rio-destination-editorial:pt", source_class: "rio-destination-editorial", title: "Rio de Janeiro destination guide", source_location: `${registryDir}/approved/pt/business/rio-guide-pt.md` },
  { source_id: "canonical-public-contact:pt", source_class: "canonical-public-contact", title: "Ricardo Tour official contact", source_location: `${registryDir}/approved/pt/contact/contact-ricardo-tour.md` },
  { source_id: "owner-approved-human-handoff:pt", source_class: "owner-approved-human-handoff", title: "Ricardo Tour human handoff", source_location: `${registryDir}/approved/pt/service/handoff-ricardo-tour.md` },
  { source_id: "approved-faq:pt", source_class: "approved-faq", title: "Ricardo Tour official FAQ V1", source_location: `${registryDir}/approved/pt/service/faq-ricardo-tour-pt.md` },
];

const newClasses = {
  "owner-approved-business-profile": { title: "Owner-approved Ricardo Tour business profile", source_id_pattern: "owner-approved-business-profile:pt", source_location: editorialSources[0].source_location, registration_status: "DRAFT", approved_for_rag: false, notes: "RT-93 Owner-approved editorial copy; RT-69 version approval evidence still required before activation." },
  "owner-approved-human-handoff": { title: "Owner-approved human handoff wording", source_id_pattern: "owner-approved-human-handoff:pt", source_location: editorialSources[3].source_location, registration_status: "DRAFT", approved_for_rag: false, notes: "Customer-facing service wording only. Runtime behavior remains in RT-71/RT-74." },
  "approved-faq": { title: "Owner-approved Ricardo Tour FAQ", source_id_pattern: "approved-faq:pt", source_location: editorialSources[4].source_location, registration_status: "DRAFT", approved_for_rag: false, notes: "Exact 100-question PT V1 file; no pricing or availability facts may be invented." },
  "rio-destination-editorial": { title: "Owner-approved Rio destination guide", source_id_pattern: "rio-destination-editorial:pt", source_location: editorialSources[1].source_location, registration_status: "DRAFT", approved_for_rag: false, notes: "Destination context only; dynamic safety, prices, hours and conditions require current external confirmation." },
};

const absolute = (relative) => path.join(root, ...relative.split("/"));
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const readJson = (relative) => JSON.parse(readFileSync(absolute(relative), "utf8"));

/** Remove only editorial metadata, line ending variance, and ChatGPT-export Markdown escapes. */
export function normalizeMarkdown(input) {
  const lines = input.replace(/^\uFEFF/, "").normalize("NFC").replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end < 0) throw new Error("Unclosed editorial front matter");
    lines.splice(0, end + 1);
  } else {
    const metadata = /^(Status|Locale|Owner approval|RAG eligible|FAQ version|Question count|Policy type):\s/;
    for (let i = Math.min(1, lines.length - 1); i < lines.length && i < 12;) {
      if (metadata.test(lines[i])) lines.splice(i, 1);
      else i++;
    }
  }
  return `${lines.join("\n")
    .replace(/\\([#.*-])/g, "$1")
    .trim()}\n`;
}

function writeImmutable(relative, bytes) {
  const destination = absolute(relative);
  mkdirSync(path.dirname(destination), { recursive: true });
  if (existsSync(destination)) {
    if (!readFileSync(destination).equals(bytes)) throw new Error(`Immutable snapshot collision: ${relative}`);
  } else {
    writeFileSync(destination, bytes, { flag: "wx" });
  }
}

function gitRevision(relative) {
  return execFileSync("git", ["log", "-1", "--format=%H", "--", relative], { cwd: root, encoding: "utf8" }).trim();
}

function editorialEntry(spec) {
  const revision = gitRevision(spec.source_location);
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error(`No committed source revision: ${spec.source_location}`);
  const committed = execFileSync("git", ["show", `${revision}:${spec.source_location}`], { cwd: root });
  const sourceDigest = sha256(committed);
  const normalized = Buffer.from(normalizeMarkdown(committed.toString("utf8")), "utf8");
  if (sha256(Buffer.from(normalizeMarkdown(readFileSync(absolute(spec.source_location), "utf8")))) !== sha256(normalized)) {
    throw new Error(`Current editorial file differs from committed source: ${spec.source_location}`);
  }
  const snapshot = `${registryDir}/versions/editorial/${spec.source_class}/${sourceDigest}.md`;
  writeImmutable(snapshot, normalized);
  return {
    ...spec, locale: "pt", source_location: spec.source_location,
    version: `sha256:${sourceDigest}`, source_sha256: sourceDigest,
    normalized_sha256: sha256(normalized), snapshot_path: snapshot,
    source_revision: revision, approval_evidence: "RT-93 Owner-approved editorial file; exact approver identity/time not recorded",
    status: "DRAFT", approved_for_rag: false, last_reviewed: null,
    approved_at: null, approved_by: null, supersedes: null,
    notes: "Editorial approval does not activate RAG. Exact activation evidence and live-source checks pending.",
  };
}

function publicLaunchIds() {
  const gateSource = readFileSync(absolute("lib/catalog/public-trips.ts"), "utf8");
  const launchBlock = gateSource.match(/export const LAUNCH_TRIP_IDS = \[([\s\S]*?)\] as const/);
  if (!launchBlock) throw new Error("Cannot read current public catalog allowlist");
  return [...launchBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

function catalogEntries() {
  const base = `${registryDir}/versions/public-tour-catalog`;
  const launchIds = publicLaunchIds();
  const current = readJson(`${registryDir}/catalog-current.json`);
  if (current.locale !== "pt" || !Array.isArray(current.entries) || current.entries.length !== launchIds.length) throw new Error("Current catalog pointer does not match PT public gate");
  const entries = [];
  for (const id of launchIds) {
    const pointer = current.entries.find((entry) => entry.source_id === `public-tour-catalog:${id}:pt`);
    if (!pointer) throw new Error(`No current catalog pointer for ${id}`);
    const relative = pointer.snapshot_path;
    if (!relative.startsWith(`${base}/${id}/`) || !relative.endsWith(`/${pointer.sha256}.json`)) throw new Error(`Invalid catalog pointer path for ${id}`);
    const bytes = readFileSync(absolute(relative));
    const digest = sha256(bytes);
    if (pointer.sha256 !== digest) throw new Error(`Catalog snapshot digest mismatch: ${relative}`);
    const value = JSON.parse(bytes.toString("utf8"));
    if (value.source_id !== pointer.source_id || value.source_class !== "public-tour-catalog" || value.locale !== "pt" || value.trip_id !== id || value.source_revision !== pointer.source_revision) throw new Error(`Invalid catalog identity: ${relative}`);
    entries.push({
      source_id: value.source_id, source_class: "public-tour-catalog", title: value.title,
      locale: "pt", source_location: `lib/catalog/public-trips.ts#Trip/${id}`,
      version: `sha256:${digest}`, source_sha256: digest, normalized_sha256: digest,
      snapshot_path: relative, source_revision: value.source_revision,
      approval_evidence: "RT-53 public catalog gate and publication; per-row approval actor/time not recorded",
      status: "DRAFT", approved_for_rag: false, last_reviewed: null,
      approved_at: null, approved_by: null, supersedes: null,
      notes: "Price-free current PT public projection. Recheck live public gate before activation/use.",
    });
  }
  return entries;
}

export function register() {
  const manifest = readJson(manifestPath);
  manifest.schema_version = "2.0.0";
  for (const source of manifest.sources) {
    if (!("supersedes" in source)) source.supersedes = null;
  }
  manifest.source_classes = { ...manifest.source_classes, ...newClasses };
  manifest.source_classes["canonical-public-contact"].source_location = "lib/public-contact.ts; knowledge/concierge/approved/pt/contact/contact-ricardo-tour.md";
  manifest.source_classes["canonical-public-contact"].notes = "Canonical lib/public-contact.ts values cross-checked against Owner-approved PT editorial contact. No other social/contact claims.";
  const candidates = [...editorialSources.map(editorialEntry), ...catalogEntries()];
  const candidateIds = new Set(candidates.map((candidate) => candidate.source_id));
  for (const old of manifest.sources) {
    if (!candidateIds.has(old.source_id) && old.status !== "RETIRED") {
      old.status = "RETIRED";
      old.approved_for_rag = false;
    }
  }
  for (const candidate of candidates) {
    const existing = manifest.sources.find((source) => source.source_id === candidate.source_id && source.version === candidate.version);
    if (existing) {
      for (const key of ["source_class", "locale", "source_location", "source_sha256", "normalized_sha256", "snapshot_path", "source_revision"]) {
        if (existing[key] !== candidate[key]) throw new Error(`Immutable version changed: ${candidate.source_id} ${key}`);
      }
      continue;
    }
    const prior = manifest.sources.filter((source) => source.source_id === candidate.source_id && source.status !== "RETIRED");
    candidate.supersedes = prior[0]?.version ?? null;
    for (const old of prior) { old.status = "RETIRED"; old.approved_for_rag = false; }
    manifest.sources.push(candidate);
  }
  manifest.sources.sort((a, b) => `${a.source_id}:${a.version}`.localeCompare(`${b.source_id}:${b.version}`));
  validate(manifest);
  writeFileSync(absolute(manifestPath), json(manifest), "utf8");
  return manifest;
}

export function validate(manifest = readJson(manifestPath)) {
  const schema = readJson(schemaPath);
  const ajv = new Ajv({ allErrors: true, jsonPointers: true });
  const valid = ajv.compile(schema);
  if (!valid(manifest)) throw new Error(`Manifest schema: ${ajv.errorsText(valid.errors)}`);
  const identities = new Set();
  const activeIds = new Set();
  const currentIds = new Set();
  const launchIds = new Set(publicLaunchIds());
  const currentCatalog = readJson(`${registryDir}/catalog-current.json`);
  if (currentCatalog.locale !== "pt" || !Array.isArray(currentCatalog.entries) || currentCatalog.entries.length !== launchIds.size) throw new Error("Invalid current PT catalog pointer");
  if (new Set(currentCatalog.entries.map((entry) => entry.source_id)).size !== currentCatalog.entries.length) throw new Error("Duplicate catalog pointer");
  for (const source of manifest.sources) {
    const identity = `${source.source_id}:${source.version}`;
    if (identities.has(identity)) throw new Error(`Duplicate version: ${identity}`);
    identities.add(identity);
    if (source.status !== "RETIRED") {
      if (currentIds.has(source.source_id)) throw new Error(`Duplicate current source: ${source.source_id}`);
      currentIds.add(source.source_id);
    }
    if (source.version !== `sha256:${source.source_sha256}`) throw new Error(`Non-deterministic version: ${identity}`);
    if (source.supersedes !== null) {
      const previous = manifest.sources.find((candidate) => candidate.source_id === source.source_id && candidate.version === source.supersedes);
      if (!previous || previous.status !== "RETIRED") throw new Error(`Invalid supersession: ${identity}`);
    }
    if (source.status === "ACTIVE") {
      if (!source.approved_for_rag || source.locale !== "pt" || activeIds.has(source.source_id)) throw new Error(`Invalid ACTIVE source: ${identity}`);
      if (/not recorded|pending/i.test(source.approval_evidence)) throw new Error(`Missing approval evidence: ${identity}`);
      activeIds.add(source.source_id);
    }
    if (source.approved_for_rag && source.status !== "ACTIVE") throw new Error(`Non-active retrieval source: ${identity}`);
    if (source.status === "RETIRED" && source.approved_for_rag) throw new Error(`Retired retrieval source: ${identity}`);
    if (source.source_location === policyPath || /recommendation-policy/i.test(source.source_id)) throw new Error("Behavioral policy entered factual registry");
    if (/rick travel|travelrick/i.test(source.title)) throw new Error(`Legacy title: ${identity}`);
    const snapshot = readFileSync(absolute(source.snapshot_path));
    if (sha256(snapshot) !== source.normalized_sha256) throw new Error(`Snapshot digest mismatch: ${identity}`);
    if (source.source_class === "public-tour-catalog") {
      if (source.source_sha256 !== source.normalized_sha256) throw new Error(`Catalog digest mismatch: ${identity}`);
      const projection = JSON.parse(snapshot.toString("utf8"));
      const expectedSnapshot = `${registryDir}/versions/public-tour-catalog/${projection.trip_id}/${source.source_sha256}.json`;
      if (source.snapshot_path !== expectedSnapshot || source.source_location !== `lib/catalog/public-trips.ts#Trip/${projection.trip_id}`) throw new Error(`Catalog source path mismatch: ${identity}`);
      const allowed = ["source_id", "source_class", "locale", "trip_id", "title", "description", "public_url", "source_revision"];
      if (Object.keys(projection).some((key) => !allowed.includes(key))) throw new Error(`Forbidden catalog field: ${identity}`);
      if ((source.status !== "RETIRED" && !launchIds.has(projection.trip_id)) || projection.source_id !== source.source_id || projection.locale !== "pt" || source.locale !== projection.locale || projection.public_url !== `/pt/tours/${projection.trip_id}` || projection.source_revision !== source.source_revision) throw new Error(`Catalog provenance mismatch: ${identity}`);
      if (source.status !== "RETIRED") {
        const pointer = currentCatalog.entries.find((entry) => entry.source_id === source.source_id);
        if (!pointer || pointer.snapshot_path !== source.snapshot_path || pointer.sha256 !== source.source_sha256 || pointer.source_revision !== source.source_revision) throw new Error(`Stale catalog version: ${identity}`);
      }
      if (/rick travel|travelrick/i.test(`${projection.title}\n${projection.description}`)) throw new Error(`Legacy catalog content: ${identity}`);
      if (/R\$\s*\d|US\$\s*\d|€\s*\d|\b(?:preço|tarifa|valor|disponibilidade|vagas)\b|\boner\b|comprar viagem/i.test(`${projection.title}\n${projection.description}`)) throw new Error(`Commercial text: ${identity}`);
    } else {
      if (source.locale !== "pt" || !editorialSources.some((spec) => spec.source_id === source.source_id && spec.source_class === source.source_class && spec.source_location === source.source_location)) throw new Error(`Editorial source not allowlisted: ${identity}`);
      if (source.snapshot_path !== `${registryDir}/versions/editorial/${source.source_class}/${source.source_sha256}.md`) throw new Error(`Editorial snapshot path mismatch: ${identity}`);
      const committed = execFileSync("git", ["show", `${source.source_revision}:${source.source_location}`], { cwd: root });
      if (sha256(committed) !== source.source_sha256) throw new Error(`Git revision provenance mismatch: ${identity}`);
      if (source.status !== "RETIRED") {
        const raw = readFileSync(absolute(source.source_location));
        if (sha256(Buffer.from(normalizeMarkdown(raw.toString("utf8")))) !== source.normalized_sha256) throw new Error(`Current editorial content changed: ${identity}`);
      }
      if (/rick travel|travelrick/i.test(snapshot.toString("utf8"))) throw new Error(`Legacy content: ${identity}`);
      if (/R\$\s*\d|US\$\s*\d|€\s*\d/i.test(snapshot.toString("utf8"))) throw new Error(`Price literal in editorial source: ${identity}`);
    }
  }
  for (const pointer of currentCatalog.entries) {
    if (!currentIds.has(pointer.source_id)) throw new Error(`Current catalog source not registered: ${pointer.source_id}`);
  }
  const faq = manifest.sources.find((source) => source.source_id === "approved-faq:pt" && source.status !== "RETIRED");
  if (!faq) throw new Error("Current PT FAQ missing");
  const faqText = readFileSync(absolute(faq.snapshot_path), "utf8");
  const headings = [...faqText.matchAll(/^## (\d+)\./gm)].map((match) => Number(match[1]));
  if (headings.length !== 100 || headings.some((number, index) => number !== index + 1)) throw new Error("FAQ must contain exactly 100 sequential questions");
  const answers = faqText.split(/^## \d+\.[^\n]*\n/gm).slice(1);
  if (answers.length !== 100 || answers.some((answer) => !answer.trim())) throw new Error("FAQ question without answer");
  const policy = readFileSync(absolute(policyPath), "utf8");
  if (!policy.includes("Policy type: RUNTIME / BEHAVIOR")) throw new Error("Behavioral policy label missing");
  const contact = manifest.sources.find((source) => source.source_id === "canonical-public-contact:pt" && source.status !== "RETIRED");
  const values = readFileSync(absolute("lib/public-contact.ts"), "utf8");
  const contactText = readFileSync(absolute(contact.snapshot_path), "utf8");
  for (const value of ["contato@ricardotour.com", "+55 22 99846-1906"]) {
    if (!values.includes(value) || !contactText.includes(value)) throw new Error(`Contact mismatch: ${value}`);
  }
  return { registered: manifest.sources.length, active: activeIds.size, catalog: manifest.sources.filter((source) => source.source_class === "public-tour-catalog" && source.status !== "RETIRED").length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2] ?? "validate";
    if (mode === "register") register();
    else if (mode !== "validate") throw new Error("Usage: node scripts/rt-69-registry.mjs [register|validate]");
    console.log(JSON.stringify(validate()));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
