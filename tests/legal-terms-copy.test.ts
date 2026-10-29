import { describe, expect, it } from "vitest";
import { PUBLIC_CONTACT, SUPERSEDED_CONTACT_PATTERNS } from "@/lib/public-contact";
import { TERMS_COPY, TERMS_PENDING_MARKER, TERMS_REVIEW_STATUS } from "@/lib/legal/terms-copy";
import { PRIVACY_COPY } from "@/lib/legal/privacy-copy";

const LANGS = ["pt", "en", "es"] as const;
const allText = (lang: (typeof LANGS)[number]) => TERMS_COPY[lang].sections.flatMap((s) => s.paragraphs).join("\n");

describe("RT-81 terms draft (approved commercial rules + pending items)", () => {
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

  it("leaves every undecided commercial or legal rule as an explicit placeholder; Q6 and Q9 are decided", () => {
    for (const lang of LANGS) {
      const byId = Object.fromEntries(TERMS_COPY[lang].sections.map((s) => [s.id, s.paragraphs]));
      for (const id of ["rules", "legal"]) {
        expect(byId[id].every((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/${id}`).toBe(true);
      }
      // Cancellation: the Owner's base policy (28/10/2026) plus the retention details left to the legal review.
      expect(byId.cancellation.filter((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/cancellation`).toHaveLength(1);
      for (const code of ["Q1", "Q7", "Q8", "Q10", "Q11"]) expect(allText(lang), `${lang} ${code}`).toMatch(new RegExp(`\\(${code}[),]`));
      for (const code of ["Q6", "Q9"]) expect(allText(lang), `${lang} ${code}`).not.toMatch(new RegExp(`\\(${code}[),]`));
    }
  });

  it("uses only the deadlines and percentages the Owner approved, and invents no fee, guarantee or jurisdiction", () => {
    const approved = new Set(["24 h", "72 h", "30%", "70%"]);
    for (const lang of LANGS) {
      const all = allText(lang);
      const figures = [...all.matchAll(/(\d+)\s*(h\b|horas?|hours?|dias?|days?|días?|%)/gi)].map(([, n, unit]) => (unit === "%" ? `${n}%` : /^d/i.test(unit) ? `${n} d` : `${n} h`));
      expect(figures.filter((f) => !approved.has(f)), lang).toEqual([]);
      expect(all, lang).toMatch(/72/);
      expect(all, lang).not.toMatch(/garant|guarantee|taxa de|fee of|comarca de|courts of|tribunales de/i);
      expect(all, lang).not.toMatch(/R\$\s*\d/); // the policy names the currency only, never an amount
    }
  });

  it("states the approved rules: request is not a booking, no online payment, closed group price in R$, 30% deposit", () => {
    expect(allText("pt")).toMatch(/não é uma reserva/);
    expect(allText("en")).toMatch(/is not a booking/);
    expect(allText("es")).toMatch(/no es una reserva/);
    expect(allText("pt")).toMatch(/não recebe pagamentos online/);
    expect(allText("en")).toMatch(/does not take online payments/);
    expect(allText("es")).toMatch(/no recibe pagos en línea/);
    for (const lang of LANGS) expect(allText(lang)).toContain("R$");
    expect(allText("pt")).toMatch(/preço fechado por grupo privativo/);
    expect(allText("en")).toMatch(/closed price per private group/);
    expect(allText("es")).toMatch(/precio cerrado por grupo privado/);
    expect(allText("pt")).toMatch(/não são retidos automaticamente/);
    expect(allText("en")).toMatch(/not retained automatically/);
    expect(allText("es")).toMatch(/no se retienen automáticamente/);
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

describe("Owner-declared address (28/10/2026), registry check still pending", () => {
  it("shows the declared address and never claims it was verified, in the terms and the privacy policy", () => {
    for (const lang of LANGS) {
      for (const all of [allText(lang), JSON.stringify(PRIVACY_COPY[lang])]) {
        expect(all, lang).toContain("Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000");
        expect(all, lang).toMatch(/Cartão CNPJ|pendente|pending|pendiente/);
        expect(all, lang).not.toMatch(/endereço (?:oficialmente )?verificado:|address verified|dirección verificada:/i);
      }
    }
  });
});
