const WORD: Record<"pt" | "en" | "es", { owner: string; legal: string; values: Record<string, string> }> = {
  pt: { owner: "Aprovação do Owner", legal: "Revisão jurídica", values: { PENDING: "PENDENTE", APPROVED: "APROVADA" } },
  en: { owner: "Owner approval", legal: "Legal review", values: { PENDING: "PENDING", APPROVED: "APPROVED" } },
  es: { owner: "Aprobación del Owner", legal: "Revisión jurídica", values: { PENDING: "PENDIENTE", APPROVED: "APROBADA" } },
};

/** The review status of a legal draft, shown above it while it is not approved (e.g. "Revisão jurídica: PENDENTE"). */
export function legalStatusLine(locale: string, status: { owner_approval: string; legal_review: string }) {
  const w = WORD[locale === "en" || locale === "es" ? locale : "pt"];
  return `${w.owner}: ${w.values[status.owner_approval] ?? status.owner_approval} · ${w.legal}: ${w.values[status.legal_review] ?? status.legal_review}.`;
}
