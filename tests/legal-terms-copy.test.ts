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

  it("leaves every undecided commercial or legal rule as an explicit placeholder; Q6, Q7, Q9 and Q10 are decided", () => {
    for (const lang of LANGS) {
      const byId = Object.fromEntries(TERMS_COPY[lang].sections.map((s) => [s.id, s.paragraphs]));
      expect(byId.legal.every((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/legal`).toBe(true);
      // Rules: children (RT-121 / Ficha TOUR-03 s.13), rain (base policy) and, since the Owner decision P6 of 01/11/2026,
      // physical condition and accessibility are decided.
      expect(byId.rules.filter((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/rules`).toHaveLength(0);
      // Cancellation: base policy (28/10/2026) + P2-P5 (01/11/2026); retention figures, participant changes and no-show
      // consequences stay with the legal review.
      expect(byId.cancellation.filter((p) => TERMS_PENDING_MARKER.test(p)), `${lang}/cancellation`).toHaveLength(1);
      for (const code of ["Q1", "Q8", "Q11"]) expect(allText(lang), `${lang} ${code}`).toMatch(new RegExp(`\\(${code}[),]`));
      for (const code of ["Q6", "Q7", "Q9", "Q10"]) expect(allText(lang), `${lang} ${code}`).not.toMatch(new RegExp(`\\(${code}[),]`));
    }
  });

  it("states the Owner decision P1-P6 of 01/11/2026 without claiming more than was approved", () => {
    expect(TERMS_REVIEW_STATUS.commercial_rules_p1_p6_approved_on).toBe("2026-11-01");
    const pt = allText("pt");
    const en = allText("en");
    const es = allText("es");
    // P1: a target, not an absolute deadline; the legal deadlines (Decreto 7.962/2013) are preserved.
    expect(pt).toMatch(/meta .* até 1 dia útil.*não um prazo absoluto.*Decreto nº 7\.962\/2013/);
    expect(en).toMatch(/within 1 business day.*not an absolute deadline.*Decree 7,962\/2013/);
    expect(es).toMatch(/hasta 1 día hábil.*no un plazo absoluto.*Decreto brasileño nº 7\.962\/2013/);
    // P2: one new date without an administrative charge, 72 h ahead, subject to availability.
    expect(pt).toMatch(/Uma remarcação .* 72 horas .* sem taxa administrativa, sujeita à disponibilidade/);
    expect(en).toMatch(/One change of date .* 72 hours .* without an administrative charge, subject to availability/);
    expect(es).toMatch(/Un cambio de fecha .* 72 horas .* sin cargo administrativo, sujeto a disponibilidad/);
    // P3: tolerance only when operationally possible.
    expect(pt).toMatch(/até 30 minutos .* operacionalmente possível .* serviços de terceiros/);
    expect(en).toMatch(/up to 30 minutes .* operationally possible .* third-party services/);
    expect(es).toMatch(/hasta 30 minutos .* operativamente posible .* servicios de terceros/);
    // P4: article 49 of the CDC preserved where applicable.
    expect(pt).toMatch(/art\. 49 do Código de Defesa do Consumidor é preservado, quando aplicável/);
    expect(en).toMatch(/article 49 of the Brazilian Consumer Protection Code is preserved, where applicable/);
    expect(es).toMatch(/art\. 49 del Código de Defensa del Consumidor de Brasil se preserva, cuando corresponda/);
    // P5: same payment method preferably; full and immediate refund on a valid withdrawal.
    expect(pt).toMatch(/mesmo meio de pagamento.*integral e imediata/);
    expect(en).toMatch(/same payment method.*in full and immediately/);
    expect(es).toMatch(/mismo medio de pago.*íntegra e inmediata/);
    // P6: informed before confirmation; never a claim that every tour page already shows these conditions.
    expect(pt).toMatch(/antes de confirmar a reserva, a Ricardo Tour informa as condições reais .* sem discriminação/);
    expect(en).toMatch(/before confirming the booking, Ricardo Tour states the real conditions .* without discrimination/);
    expect(es).toMatch(/antes de confirmar la reserva, Ricardo Tour informa las condiciones reales .* sin discriminación/);
    for (const all of [pt, en, es]) expect(all).not.toMatch(/(?:todas as|cada) páginas? .*(?:acessibilidade|condição física)|every tour page .*accessib|cada página .*accesibilidad/i);
  });

  it("uses only the deadlines and percentages the Owner approved, and invents no fee, guarantee or jurisdiction", () => {
    // 50%: children aged 0-2 on TOUR-01/TOUR-03 (RT-121 tables, Ficha TOUR-03 s.13).
    // 1 d: response target (P1, Owner 01/11/2026). 5 d: legal deadline quoted from Decreto 7.962/2013, not a promise.
    const approved = new Set(["24 h", "72 h", "30%", "70%", "50%", "1 d", "5 d"]);
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
