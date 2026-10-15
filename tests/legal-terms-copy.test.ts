import { describe, expect, it } from "vitest";
import { PUBLIC_CONTACT, SUPERSEDED_CONTACT_PATTERNS } from "@/lib/public-contact";
import { TERMS_COPY, TERMS_PENDING_MARKER, TERMS_REVIEW_STATUS } from "@/lib/legal/terms-copy";

const LANGS = ["pt", "en", "es"] as const;
const allText = (lang: (typeof LANGS)[number]) => TERMS_COPY[lang].sections.flatMap((s) => s.paragraphs).join("\n");

describe("RT-81 terms draft (factual skeleton)", () => {
  it("is a draft: Owner approval and legal review are PENDING and no lawyer approval is claimed", () => {
    expect(TERMS_REVIEW_STATUS).toMatchObject({ owner_approval: "PENDING", legal_review: "PENDING" });
    for (const lang of LANGS) {
      const all = JSON.stringify(TERMS_COPY[lang]);
      expect(TERMS_COPY[lang].draftBanner, lang).toMatch(/PENDENTE|PENDING|PENDIENTE/);
      expect(all, lang).not.toMatch(/(?<!não foi )aprovad[oa] por advogad|(?<!not been )approved by (?:a )?lawyer|(?<!no ha sido )aprobad[oa] por (?:un )?abogad/i);
    }
  });

  it("has the same sections, in the same order and with the same pending codes, in the three languages", () => {
    const ids = TERMS_COPY.pt.sections.map((s) => s.id);
    const codes = (lang: (typeof LANGS)[number]) => allText(lang).match(/Q\d{1,2}/g);
    for (const lang of ["en", "es"] as const) {
      expect(TERMS_COPY[lang].sections.map((s) => s.id)).toEqual(ids);
      expect(codes(lang)).toEqual(codes("pt"));
    }
  });

  it("leaves every undecided commercial or legal rule as an explicit placeholder", () => {
    for (const lang of LANGS) {
      const byId = Object.fromEntries(TERMS_COPY[lang].sections.map((s) => [s.id, s.paragraphs]));
      for (const id of ["operator", "cancellation", "rules", "legal"]) {
        expect(byId[id].every((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/${id}`).toBe(true);
      }
      for (const code of ["Q1", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11"]) expect(allText(lang), `${lang} ${code}`).toMatch(new RegExp(`\\(${code}[),]`));
    }
  });

  it("invents no deadline, percentage, fee, guarantee, refund or jurisdiction", () => {
    for (const lang of LANGS) {
      const all = allText(lang);
      expect(all, lang).not.toMatch(/\d+\s*(?:h\b|horas?|hours?|dias?|days?|días?|%)/i);
      expect(all, lang).not.toMatch(/garant|guarantee|reembolso (?:integral|total)|full refund|taxa de|fee of|comarca de|courts of|tribunales de/i);
      expect(all, lang).not.toMatch(/R\$\s*\d/); // the policy names the currency only, never an amount
    }
  });

  it("states the facts the site already shows: request is not a booking, no online payment, prices per person in R$", () => {
    expect(allText("pt")).toMatch(/não é uma reserva/);
    expect(allText("en")).toMatch(/is not a booking/);
    expect(allText("es")).toMatch(/no es una reserva/);
    expect(allText("pt")).toMatch(/não recebe pagamentos online/);
    expect(allText("en")).toMatch(/does not take online payments/);
    expect(allText("es")).toMatch(/no recibe pagos en línea/);
    for (const lang of LANGS) expect(allText(lang)).toContain("R$");
  });

  it("reads contact values from PUBLIC_CONTACT and contains no superseded contact data", () => {
    for (const lang of LANGS) {
      const all = JSON.stringify(TERMS_COPY[lang]);
      expect(all).toContain(PUBLIC_CONTACT.email);
      expect(all).toContain(PUBLIC_CONTACT.whatsappDisplay);
      for (const pattern of SUPERSEDED_CONTACT_PATTERNS) expect(all).not.toMatch(pattern);
    }
  });
});
