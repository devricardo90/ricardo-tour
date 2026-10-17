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
  "# RT-115 — Favela Rocinha: textos para revisão do Owner (PT / EN / ES)",
  "",
  "- Estado: **CONTENT REVIEW REQUIRED** — aguardando o parecer do Owner. Nada aprovado, nada publicado. RT-115 em Revisar.",
  "- Gerado de `lib/catalog/drafts/rocinha.draft.ts` (a mesma fonte da página local) por `scripts/rt-115-owner-review-md.ts`. **Os textos não foram reescritos** nesta etapa.",
  "- Sem preços: na página de revisão visual o preço aparece como **\"Valores em validação\"**. Os preços provisórios ficam só na versão interna local e no Manual Mestre.",
  "",
  "## Como revisar",
  "",
  "Marque cada critério e anote ajustes ao lado do item. A próxima rodada de redação só começa depois do seu parecer.",
  "",
  "- [ ] Os textos parecem de uma empresa de turismo profissional.",
  "- [ ] O inglês e o espanhol soam naturais.",
  "- [ ] A descrição vende uma experiência privativa.",
  "- [ ] O roteiro representa o que o Owner explicou.",
  "- [ ] Inclusões e exclusões estão corretas.",
  "- [ ] A informação sobre mototáxi está clara.",
  "- [ ] As perguntas frequentes não prometem serviços que não oferecemos.",
  "- [ ] Os botões incentivam a solicitar disponibilidade.",
  "",
  "## 1. Título do passeio",
  "",
  "| Idioma | Proposta atual (na página) | Preferência inicial do Owner (17/10, não aplicada — decisão após revisar o texto completo) |",
  "|---|---|---|",
  `| PT | ${ROCINHA_TITLE.pt} | (mantido — adequado) |`,
  `| EN | ${ROCINHA_TITLE.en} | Rocinha Favela — Private Cultural Tour |`,
  `| ES | ${ROCINHA_TITLE.es} | Tour Privado por la Favela de Rocinha |`,
  "",
  "Decisão: [ ] proposta atual · [ ] preferência do Owner · [ ] outra: ________",
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
lines.push("## 9. Perguntas frequentes (7) — conferir uma a uma", "");
(c.faq ?? []).forEach((f, i) => {
  lines.push(`### Pergunta ${i + 1}`, "");
  for (const l of L) lines.push(`**${FLAG[l]}** — **${f.question[l]}** ${f.answer[l]}`, "");
  lines.push("Parecer: [ ] aprovada · [ ] ajustar · [ ] remover — Promete algo que não oferecemos? [ ] não · [ ] sim: ________", "");
});
lines.push("## 10. CTA e mensagem do WhatsApp", "");
for (const l of L) {
  const t = tourContentCopy[l];
  lines.push(`**${FLAG[l]}** — Botão principal: **${t.cta}** · Botão secundário: **${t.ctaWhatsapp}** · Nota: ${t.ctaNote} · Preço na revisão visual: **${t.pricePending}**`, "", "```", ROCINHA_WHATSAPP_MESSAGE[l], "```", "");
}
lines.push(
  "## Pendências de conteúdo",
  "",
  "1. Parecer do Owner sobre a qualidade da copy, naturalidade de EN/ES e as 7 perguntas frequentes.",
  "2. Nomes comerciais EN/ES: escolher entre a proposta atual e a preferência inicial do Owner.",
  "3. Roteiro: confirmar se o agrupamento 10 → 8 etapas na página está correto.",
  "4. Horários e dias de operação: não definidos (o texto não menciona horários).",
  "5. Condições de cancelamento: o texto só remete à proposta; prazos e percentuais dependem do RT-81.",
  "6. Requisitos físicos objetivos: o texto fala em ladeiras e escadas, sem números (validação operacional).",
  "7. Pagamento: o texto diz \"meios previstos\" (PIX, cartão, dinheiro) — confirmar se podem ser apresentados como definitivos.",
  "8. Crédito do mural: a página mostra só a inscrição visível \"@WARK ROCINHA...\"; identidade do artista não verificada.",
  "9. Preços: a página de revisão mostra \"Valores em validação\"; publicação depende da validação de custos, tributos e operação.",
  "",
);
fs.writeFileSync(out, lines.join("\n"));
console.log(`written ${out} (${lines.length} lines)`);
