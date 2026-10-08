/** RT-69 Stage 1.5: bind recorded approval to exact local versions. No hosted ingestion. */
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "./rt-69-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = (relative) => path.join(root, ...relative.split("/"));
const readJson = (relative) => JSON.parse(readFileSync(file(relative), "utf8"));
const manifestPath = "knowledge/concierge/manifest.json";
const approval = readJson("knowledge/concierge/approval-stage-1-5.json");
const pointer = readJson("knowledge/concierge/catalog-current.json");
const manifest = readJson(manifestPath);

// A recorded Owner directive approves only these exact editorial digests. Public
// catalog publication is the separate RT-53 approval gate for catalog versions.
if (approval.approved_by !== "Owner" || approval.approval_evidence !== "RT-69 Jira comment 13290" ||
    !Number.isFinite(Date.parse(approval.approval_recorded_at)) ||
    approval.catalog_gate_observed_at !== pointer.observed_at ||
    !Number.isFinite(Date.parse(pointer.observed_at))) {
  throw new Error("Approval or fresh catalog gate evidence is incomplete");
}
const ageMs = Date.now() - Date.parse(pointer.observed_at);
if (ageMs < 0 || ageMs > 10 * 60 * 1000) throw new Error("Catalog gate observation is not fresh; resnapshot and rebind");

validate(manifest);
const editorial = new Map(Object.entries(approval.editorial_versions));
const catalog = new Map(Object.entries(approval.catalog_versions));
if (editorial.size !== 5 || catalog.size !== pointer.entries.length || catalog.size !== 4) {
  throw new Error("Incomplete approval binding");
}
for (const entry of pointer.entries) {
  if (catalog.get(entry.source_id) !== `sha256:${entry.sha256}`) throw new Error(`Unapproved catalog version: ${entry.source_id}`);
}
const selected = new Set();
for (const source of manifest.sources) {
  const expected = source.source_class === "public-tour-catalog" ? catalog.get(source.source_id) : editorial.get(source.source_id);
  if (source.status === "RETIRED") continue;
  if (expected !== source.version || selected.has(source.source_id)) throw new Error(`Unapproved or duplicate current source: ${source.source_id}`);
  selected.add(source.source_id);
  source.status = "ACTIVE";
  source.approved_for_rag = true;
  source.approved_by = "Owner";
  // A refresh confirms the same immutable catalog version without rewriting the
  // original local activation timestamp. Editorial approval stays pinned to the
  // Owner's recorded directive.
  source.approved_at = source.approved_at ?? (source.source_class === "public-tour-catalog" ? pointer.observed_at : approval.approval_recorded_at);
  source.last_reviewed = source.source_class === "public-tour-catalog" ? pointer.observed_at : approval.approval_recorded_at;
  source.approval_evidence = source.source_class === "public-tour-catalog"
    ? `RT-53 Owner-approved public launch gate; fresh PT gate at ${pointer.observed_at}; RT-69 Stage 1.5 binding`
    : `RT-69 Jira comment 13290; exact RT-93 editorial digest ${source.source_sha256}`;
  source.notes = source.source_class === "public-tour-catalog"
    ? "Local-only active registration. Recheck live public gate before hosted publication and each retrieval use."
    : "Local-only active registration. Owner approval bound to this exact immutable PT version.";
}
if (selected.size !== editorial.size + catalog.size) throw new Error("Approval binding did not cover exactly nine sources");
const result = validate(manifest);
if (result.active !== 9) throw new Error("Atomic activation is incomplete");
const destination = file(manifestPath);
const temporary = `${destination}.stage-1-5.tmp`;
writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
renameSync(temporary, destination);
console.log(JSON.stringify(result));
