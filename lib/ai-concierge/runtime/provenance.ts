import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HostedHit } from "./types";

/** RT-69 immutable provenance contract, reconciled against the local approved knowledge registry. */
type ManifestSource = {
  source_id: string;
  version: string;
  status: string;
  approved_for_rag?: boolean;
  locale: string;
  source_class: string;
  source_sha256: string;
  normalized_sha256: string;
};
export type Registry = Map<string, ManifestSource>;

export type AcceptedEvidence = {
  source_id: string;
  source_version: string;
  source_class: string;
  chunk_id: string;
  chunk_ordinal: number;
  text: string;
  score: number;
};
export type HitCheck = { ok: true; evidence: AcceptedEvidence } | { ok: false; reason: string };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const key = (sourceId: string, version: string) => `${sourceId}\n${version}`;

export function loadRegistry(manifestPath = resolve(process.cwd(), "knowledge/concierge/manifest.json")): Registry {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { sources: ManifestSource[] };
  return new Map(manifest.sources.map((source) => [key(source.source_id, source.version), source]));
}

export function validateHit(hit: HostedHit, registry: Registry): HitCheck {
  const a = hit.attributes;
  if (!a || typeof a !== "object") return { ok: false, reason: "no_attributes" };
  const str = (name: string) => (typeof a[name] === "string" ? (a[name] as string) : "");
  const sourceId = str("source_id");
  const version = str("source_version");
  const entry = registry.get(key(sourceId, version));
  if (!entry) {
    const known = [...registry.values()].some((source) => source.source_id === sourceId);
    return { ok: false, reason: known ? "stale_version" : "unknown_source" };
  }
  if (entry.status !== "ACTIVE") return { ok: false, reason: entry.status === "BLOCKED" ? "blocked_source" : "retired_source" };
  if (!entry.approved_for_rag) return { ok: false, reason: "not_approved_for_rag" };
  if (entry.locale !== "pt" || str("locale") !== "pt") return { ok: false, reason: "wrong_locale" };
  if (str("source_class") !== entry.source_class) return { ok: false, reason: "wrong_source_class" };
  if (str("source_sha256") !== entry.source_sha256) return { ok: false, reason: "wrong_source_digest" };
  if (str("normalized_sha256") !== entry.normalized_sha256) return { ok: false, reason: "wrong_normalized_digest" };
  const ordinal = a.chunk_ordinal;
  if (typeof ordinal !== "number" || !Number.isInteger(ordinal) || ordinal < 0) return { ok: false, reason: "bad_ordinal" };
  const chunkSha = str("chunk_sha256");
  const text = hit.text ?? "";
  // The chunk text shown to the model must be exactly the digest-pinned chunk.
  const textMatches = [text, `${text.trim()}\n`, text.trim()].some((candidate) => sha256(candidate) === chunkSha);
  if (!chunkSha || !textMatches) return { ok: false, reason: "wrong_chunk_digest" };
  if (str("chunk_id") !== sha256(`${sourceId}\n${version}\npt\n${ordinal}\n${chunkSha}`)) return { ok: false, reason: "unknown_chunk" };
  return {
    ok: true,
    evidence: {
      source_id: sourceId,
      source_version: version,
      source_class: entry.source_class,
      chunk_id: str("chunk_id"),
      chunk_ordinal: ordinal,
      text: text.trim(),
      score: hit.score,
    },
  };
}

export function filterHits(hits: HostedHit[], registry: Registry) {
  const accepted: AcceptedEvidence[] = [];
  let rejected = 0;
  const reasons: Record<string, number> = {};
  const seen = new Set<string>();
  for (const hit of hits) {
    const check = validateHit(hit, registry);
    if (!check.ok) {
      rejected++;
      reasons[check.reason] = (reasons[check.reason] ?? 0) + 1;
      continue;
    }
    if (seen.has(check.evidence.chunk_id)) continue;
    seen.add(check.evidence.chunk_id);
    accepted.push(check.evidence);
  }
  return { accepted, rejected, reasons };
}
