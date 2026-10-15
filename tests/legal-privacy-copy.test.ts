import { describe, expect, it } from "vitest";
import { COMPANY_CNPJ, PRIVACY_COPY, PRIVACY_REVIEW_STATUS } from "@/lib/legal/privacy-copy";

describe("RT-80 privacy draft", () => {
  it("is a draft: Owner approval and legal review are PENDING and no lawyer approval is claimed", () => {
    expect(PRIVACY_REVIEW_STATUS).toMatchObject({ owner_approval: "PENDING", legal_review: "PENDING" });
    for (const [lang, copy] of Object.entries(PRIVACY_COPY)) {
      const all = JSON.stringify(copy);
      expect(copy.draftBanner, lang).toMatch(/PENDEN|PENDING|PENDIENTE/);
      expect(all, lang).not.toMatch(/(?<!não foi )aprovad[oa] por advogad|(?<!not been )approved by (?:a )?lawyer|(?<!no ha sido )aprobad[oa] por (?:un )?abogad/i);
    }
  });

  it("has the same sections in the three languages, states that Daniela is an AI, and names the contact and WhatsApp", () => {
    const ids = PRIVACY_COPY.pt.sections.map((s) => s.id);
    for (const lang of ["en", "es"] as const) expect(PRIVACY_COPY[lang].sections.map((s) => s.id)).toEqual(ids);
    expect(JSON.stringify(PRIVACY_COPY.pt)).toMatch(/inteligência artificial, não uma pessoa|inteligência artificial, não uma pessoa da equipe/);
    expect(JSON.stringify(PRIVACY_COPY.en)).toMatch(/artificial intelligence, not a member of the team/);
    expect(JSON.stringify(PRIVACY_COPY.es)).toMatch(/inteligencia artificial, no una persona del equipo/);
    for (const copy of Object.values(PRIVACY_COPY)) {
      expect(JSON.stringify(copy)).toContain("contato@ricardotour.com");
      expect(JSON.stringify(copy)).toContain("+55 22 99846-1906");
    }
  });

  it("never claims absolute non-retention by providers and states what is not defined yet", () => {
    for (const copy of Object.values(PRIVACY_COPY)) {
      const all = JSON.stringify(copy);
      expect(all).not.toMatch(/nenhum dado é (?:guardado|retido)|no data is (?:stored|retained)|ningún dato se (?:guarda|conserva)/i);
      expect(all).toMatch(/30/); // the provider's retention is stated with its hedge
    }
  });

  it("discloses the facts verified on 2026-10-15 (login session cookie, Oner widget) and lists the open decisions", () => {
    const storage = (lang: "pt" | "en" | "es") => JSON.stringify(PRIVACY_COPY[lang].sections.find((s) => s.id === "storage"));
    expect(storage("pt")).toMatch(/cookie de sessão de login/);
    expect(storage("en")).toMatch(/login session cookie/);
    expect(storage("es")).toMatch(/cookie de sesión/);
    for (const copy of Object.values(PRIVACY_COPY)) {
      expect(JSON.stringify(copy.sections.find((s) => s.id === "providers"))).toMatch(/Oner/);
      expect(copy.pending.map((p) => p.slice(0, p.indexOf(":")))).toEqual(["Q1", "Q3", "Q4", "Q5", "Q11"]);
    }
  });

  it("names the CNPJ confirmed by the Owner (2026-10-15) and the language cookie verified in production", () => {
    expect(COMPANY_CNPJ).toBe("49.142.341/0001-90");
    for (const copy of Object.values(PRIVACY_COPY)) {
      expect(JSON.stringify(copy.sections.find((s) => s.id === "who"))).toContain(COMPANY_CNPJ);
      expect(JSON.stringify(copy)).not.toMatch(/49\.14\.341/); // the malformed 13-digit value from the institutional document
    }
    expect(JSON.stringify(PRIVACY_COPY.pt)).toMatch(/cookie de idioma/);
    expect(JSON.stringify(PRIVACY_COPY.en)).toMatch(/language cookie/);
    expect(JSON.stringify(PRIVACY_COPY.es)).toMatch(/cookie de idioma/);
  });
});
