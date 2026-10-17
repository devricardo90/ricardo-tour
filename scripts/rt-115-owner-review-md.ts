/**
 * RT-115: Owner review document for the Rocinha texts — items 1–10 with PT / EN / ES side by side, the Owner's review
 * criteria as checkboxes and one check per FAQ. Generated from lib/catalog/drafts/rocinha.draft.ts (the preview source);
 * the texts are NOT rewritten here. No prices, no internal costs.
 * Usage: npx tsx scripts/rt-115-owner-review-md.ts docs/product/rt-115-rocinha-owner-review.md
 */
import fs from "node:fs";
import { ROCINHA_CONTENT, ROCINHA_SUBTITLE, ROCINHA_TITLE, ROCINHA_WHATSAPP_MESSAGE } from "../lib/catalog/drafts/rocinha.draft";
import { tourContentCopy } from "../components/site/tour/content/tour-content-copy";

const out = process.argv[2] ?? "docs/product/rt-115-rocinha-owner-review.md";
const c = ROCINHA_CONTENT;
const L = ["pt", "en", "es"] as const;
const FLAG = { pt: "🇧🇷 PT", en: "🇬🇧 EN", es: "🇪🇸 ES" } as const;
const lines: string[] = [];
const tri = (get: (l: (typeof L)[number]) => string | string[]) => {
  for (const l of L) {
    const v = get(l);
    lines.push(`**${FLAG[l]}**`, "");
    if (Array.isArray(v)) lines.push(...v.map((x) => `- ${x}`));
    else lines.push(...v.split("\n\n").flatMap((p) => [p, ""]).slice(0, -1));
    lines.push("");
  }
};

lines.push(
  "# RT-115 — Favela Rocinha: textos finais PT / EN / ES (correções editoriais aprovadas)",
  "",
  "- Estado: **EDITORIAL IMPLEMENTED AND VERIFIED** — o Owner aprovou a aplicação dos ajustes editoriais PT/EN/ES da Favela Rocinha em 17/10/2026. Nada publicado: preços públicos, produção e reservas comerciais NÃO autorizados (gates RT-81, RT-110, RT-118, RT-119, RT-120).",
  "- Gerado de `lib/catalog/drafts/rocinha.draft.ts` (a mesma fonte da página local) por `scripts/rt-115-owner-review-md.ts`.",
  "- A pergunta frequente 7 é uma redação editorial provisória: será reconciliada com os termos aprovados no RT-81.",
  "- Sem preços: na página de revisão visual o preço aparece como **\"Valores em validação\"**. Os preços provisórios ficam só na versão interna local e no Manual Mestre.",
  "",
  "## Correções aplicadas (aprovadas pelo Owner)",
  "",
  "- Nomes EN/ES aprovados aplicados no título, na mensagem do WhatsApp e na prévia.",
  "- Subtítulos, descrições curtas e completas com os textos aprovados; menos linguagem operacional.",
  "- Roteiro mantido em 8 etapas (explicações na caminhada; fotos na parada panorâmica).",
  "- Inclusões centradas no que o cliente recebe; a tarifa do operador local saiu da lista pública (custo interno).",
  "- Exclusões separadas das atividades culturais eventuais, sem afirmar que toda apresentação é paga e sem datas.",
  "- Mototáxi de subida e descida explícito nas inclusões, na descrição e na pergunta 6.",
  "- Inglês e espanhol revisados (espanhol internacional: anticipo, actividades de pago, terraza).",
  "- Cancelamento: nenhuma condição inventada antes do RT-81.",
  "",
  "## 1. Título do passeio",
  "",
  "| Idioma | Nome aprovado (17/10/2026) |",
  "|---|---|",
  `| PT | ${ROCINHA_TITLE.pt} |`,
  `| EN | ${ROCINHA_TITLE.en} |`,
  `| ES | ${ROCINHA_TITLE.es} |`,
  "",
  "## 2. Subtítulo",
  "",
);
tri((l) => ROCINHA_SUBTITLE[l]);
lines.push("## 3. Descrição curta", "");
tri((l) => c.summary?.[l] ?? "");
lines.push("## 4. Descrição completa", "");
tri((l) => c.description?.[l] ?? "");
lines.push("## 5. Roteiro", "", "Roteiro-base aprovado pelo Owner com 10 etapas; na página aparecem 8, agrupando \"explicações sobre história e vida cotidiana\" na caminhada e \"tempo para fotografias autorizadas\" no mirante.", "");
tri((l) => c.itinerary.map((s, i) => `${i + 1}. **${s.title[l]}**${s.description?.[l] ? ` — ${s.description[l]}` : ""}`));
lines.push("## 6. Inclusões", "");
tri((l) => c.inclusions?.[l] ?? []);
lines.push("## 7. Exclusões", "");
tri((l) => [...(c.exclusions?.[l] ?? []), `*${tourContentCopy[l].optionalServices}:* ${c.optionalServicesNote?.[l] ?? ""}`]);
lines.push("## 8. Condições práticas", "");
tri((l) => [
  `**${tourContentCopy[l].requirements}:** ${c.requirements?.[l] ?? ""}`,
  `**${tourContentCopy[l].accessibility}:** ${c.accessibility?.[l] ?? ""}`,
  `**${tourContentCopy[l].operational}:** ${c.operationalConditions?.[l] ?? ""}`,
  `**${tourContentCopy[l].meetingPoint}:** ${c.meetingPoint?.[l] ?? ""}`,
  `**${tourContentCopy[l].duration}:** ${c.durationLabel?.[l] ?? ""}`,
]);
lines.push("## 9. Perguntas frequentes (7)", "");
(c.faq ?? []).forEach((f, i) => {
  lines.push(`### Pergunta ${i + 1}`, "");
  for (const l of L) lines.push(`**${FLAG[l]}** — **${f.question[l]}** ${f.answer[l]}`, "");
  if (i === 6) lines.push("*Redação editorial provisória: reconciliar com os termos aprovados no RT-81 antes da publicação.*", "");
});
lines.push("## 10. CTA e mensagem do WhatsApp", "");
for (const l of L) {
  const t = tourContentCopy[l];
  lines.push(`**${FLAG[l]}** — Botão principal: **${t.cta}** · Botão secundário: **${t.ctaWhatsapp}** · Nota: ${t.ctaNote} · Preço na revisão visual: **${t.pricePending}**`, "", "```", ...ROCINHA_WHATSAPP_MESSAGE[l].split("\n").map((line) => line.trimEnd()), "```", "");
}
lines.push(
  "## Pendências que permanecem (fora da etapa editorial)",
  "",
  "1. Pergunta 7 e condições: reconciliar com os termos do RT-81 (prazos e percentuais não definidos; nada inventado).",
  "2. Horários e dias de operação: não definidos (o texto não menciona horários).",
  "3. Requisitos físicos objetivos: validação operacional (checklist do Manual Mestre §11.23).",
  "4. Crédito do mural: só a inscrição visível \"@WARK ROCINHA...\"; identidade do artista não verificada.",
  "5. Preços: \"Valores em validação\" na revisão; publicação depende da validação de custos, tributos e operação.",
  "6. Aplicação no site: RT-119 (carga controlada) e RT-114 (página pública), após os gates RT-81, RT-110, RT-118 e RT-120.",
  "",
);
fs.writeFileSync(out, lines.join("\n"));
console.log(`written ${out} (${lines.length} lines)`);
