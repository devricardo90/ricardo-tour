/**
 * Sprint 10 closing (30/10/2026): extracts, from the same draft data the lab preview renders, every text of the three own
 * tours that still waits for the Owner's approval (status not CONFIRMED in some language), plus the price presentation.
 * Read-only; no database. Usage: npx tsx scripts/s10-owner-review-texts.ts <out.json>
 */
import fs from "node:fs";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "../lib/catalog/mock/tour-content.mock";

const TOURS = { "TOUR-01": "cmlhxkpy9000028zq27rhytew", "TOUR-02": "cmli1a6im000034zqqzc9sppb", "TOUR-03": "cmlibniq40000z4zqkbujnutt" } as const;
const L = ["pt", "en", "es"] as const;
type Status = string | undefined;
const pick = (v: unknown, l: string) => (v && typeof v === "object" ? ((v as Record<string, unknown>)[l] ?? null) : null);

const out = Object.entries(TOURS).map(([code, id]) => {
  const o = PROTOTYPE_OFFER[id];
  const r = MOCK_TOUR_CONTENT[id];
  const items: Array<{ field: string; status: Record<string, Status>; text: Record<string, unknown> }> = [];
  const add = (field: string, value: unknown, status: Status, byLocale?: Partial<Record<string, Status>>) => {
    const st = Object.fromEntries(L.map((l) => [l, byLocale?.[l] ?? status]));
    if (L.some((l) => st[l] !== "CONFIRMED")) items.push({ field, status: st, text: Object.fromEntries(L.map((l) => [l, pick(value, l)])) });
  };
  add("Nome", o.titleByLocale, o.titleStatus, o.titleStatusByLocale);
  add("Subtítulo", o.pitch, o.pitchStatus, o.pitchStatusByLocale);
  add("Benefícios", o.benefits, o.benefitsStatus, o.benefitsStatusByLocale);
  add("Resumo de preço", o.priceSummary, undefined, o.priceStatusByLocale);
  add("Condição do preço", o.priceCondition, undefined, o.priceStatusByLocale);
  add("Nota da tabela", o.pricingNote, undefined, o.priceStatusByLocale);
  const content = o.contentStatus ?? "PROVISIONAL";
  if (content !== "CONFIRMED" || o.contentStatusByLocale) {
    for (const f of ["summary", "description", "durationLabel", "meetingPoint", "requirements", "accessibility", "operationalConditions"] as const) add(`Conteúdo: ${f}`, r[f], content, o.contentStatusByLocale);
  }
  if ((o.conditionsStatus ?? "PROVISIONAL") !== "CONFIRMED") {
    (r.faq ?? []).forEach((f, i) => add(`FAQ ${i + 1}: ${f.question.pt}`, f.answer, o.conditionsStatus));
  }
  return { code, id, transport: o.transport, items };
});
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
console.log(out.map((t) => `${t.code}: ${t.items.length} itens`).join(" · "));
