/**
 * RT-115: exports the Rocinha commercial texts (PT/EN/ES) from the single source used by the preview
 * (lib/catalog/drafts/rocinha.draft.ts) into a review document, so the page and the document never diverge.
 * Internal provisional prices are NOT exported (they belong to the Manual Mestre); internal costs are not in the code.
 * Usage: npx tsx scripts/rt-115-export-rocinha.ts docs/product/rt-115-rocinha-content.md
 */
import fs from "node:fs";
import {
  ROCINHA_BENEFITS,
  ROCINHA_CONTENT,
  ROCINHA_GROUP_SIZE,
  ROCINHA_MIN_AGE,
  ROCINHA_SUBTITLE,
  ROCINHA_TITLE,
  ROCINHA_WHATSAPP_MESSAGE,
} from "../lib/catalog/drafts/rocinha.draft";
import { tourContentCopy } from "../components/site/tour/content/tour-content-copy";

const out = process.argv[2] ?? "docs/product/rt-115-rocinha-content.md";
const LOCALES = [
  ["pt", "Português"],
  ["en", "English"],
  ["es", "Español"],
] as const;
const lang = { pt: { pt: "Português", en: "Inglês", es: "Espanhol" }, en: { pt: "Portuguese", en: "English", es: "Spanish" }, es: { pt: "Portugués", en: "Inglés", es: "Español" } };
const c = ROCINHA_CONTENT;

const lines: string[] = [
  "# RT-115 — Tour Favela Rocinha: textos comerciais PT / EN / ES",
  "",
  "- Status: **CONTENT READY FOR OWNER REVIEW** (não aprovado, não publicado). Fonte: decisões do Owner de 17/10/2026 (RT-112). Gerado por `scripts/rt-115-export-rocinha.ts` a partir de `lib/catalog/drafts/rocinha.draft.ts` (a mesma fonte do preview).",
  "- Os nomes em EN/ES são propostas editoriais. Preços não aparecem nos textos (tabela interna provisória no Manual Mestre). Condições de cancelamento dependem do RT-81 e não são descritas além do que o Owner aprovou.",
  "",
];
for (const [l, name] of LOCALES) {
  const t = tourContentCopy[l];
  lines.push(`## ${name}`, "");
  lines.push(`**1. ${l === "pt" ? "Nome" : l === "en" ? "Name" : "Nombre"}:** ${ROCINHA_TITLE[l]}`, "");
  lines.push(`**2. ${l === "pt" ? "Subtítulo" : l === "en" ? "Subtitle" : "Subtítulo"}:** ${ROCINHA_SUBTITLE[l]}`, "");
  lines.push(`**3. ${l === "pt" ? "Descrição curta" : l === "en" ? "Short description" : "Descripción corta"}:** ${c.summary?.[l]}`, "");
  lines.push(`**4. ${t.about}**`, "", ...(c.description?.[l] ?? "").split("\n\n").flatMap((p) => [p, ""]));
  lines.push(`**5. ${t.benefits}**`, "", ...ROCINHA_BENEFITS[l].map((b) => `- ${b}`), "");
  lines.push(`**6. ${t.duration}:** ${c.durationLabel?.[l]}`, "");
  lines.push(`**7. ${t.modality}:** ${l === "pt" ? "Experiência privativa" : l === "en" ? "Private experience" : "Experiencia privada"}`, "");
  lines.push(`**8. ${t.participants}:** ${ROCINHA_GROUP_SIZE[l]} · ${t.minimumAge}: ${ROCINHA_MIN_AGE[l]} · ${t.languages}: ${c.languages.map((code) => lang[l][code as "pt" | "en" | "es"]).join(", ")}`, "");
  lines.push(`**9. ${t.meetingPoint}:** ${c.meetingPoint?.[l]}`, "");
  lines.push(`**10. ${t.itinerary}**`, "", ...c.itinerary.flatMap((s, i) => [`${i + 1}. **${s.title[l]}**${s.description?.[l] ? ` — ${s.description[l]}` : ""}`]), "");
  lines.push(`**11. ${l === "pt" ? "Incluído" : l === "en" ? "Included" : "Incluido"}**`, "", ...(c.inclusions?.[l] ?? []).map((x) => `- ${x}`), "");
  lines.push(`**12. ${l === "pt" ? "Não incluído" : l === "en" ? "Not included" : "No incluido"}**`, "", ...(c.exclusions?.[l] ?? []).map((x) => `- ${x}`), "", `*${t.optionalServices}:* ${c.optionalServicesNote?.[l]}`, "");
  lines.push(`**13. ${t.practical}:** ${c.requirements?.[l]}`, "", `*${t.accessibility}:* ${c.accessibility?.[l]}`, "");
  lines.push(`**14. ${t.operational}:** ${c.operationalConditions?.[l]}`, "");
  lines.push(`**15. ${t.faq}**`, "", ...(c.faq ?? []).flatMap((f) => [`- **${f.question[l]}** ${f.answer[l]}`]), "");
  lines.push(`**16. CTA:** ${t.cta} · WhatsApp: "${ROCINHA_WHATSAPP_MESSAGE[l].replace(/\n/g, " / ")}"`, "");
}
fs.writeFileSync(out, lines.join("\n"));
console.log(`written ${out} (${lines.length} lines)`);
