import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { ADDRESS_STATUS, COMPANY_IDENTIFICATION, companyIdentificationLine } from "@/lib/legal/company-identification";
import { COMPANY_CNPJ } from "@/lib/legal/privacy-copy";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
}));

/** Owner 01/11/2026: address and CNPJ provided by the Owner; documentary validation pending (Decreto 7.962/2013, art. 2º). */
describe("supplier identification in the footer", () => {
  it("holds the Owner-provided address and CNPJ, recorded as provided by the Owner with documentary validation pending", () => {
    expect(COMPANY_CNPJ).toBe("49.142.341/0001-90");
    expect(COMPANY_IDENTIFICATION.address).toMatch(/^Rua Projetada, nº 8, Centro, Itaocara-RJ/);
    expect(ADDRESS_STATUS).toBe("Dados fornecidos pelo Owner. Validação documental pendente.");
    expect(COMPANY_IDENTIFICATION).toMatchObject({ legalName: "49.142.341 RICARDO DE SOUZA FRANCISCO", cnpj: COMPANY_CNPJ, email: PUBLIC_CONTACT.email, addressValidatedOn: null });
  });

  it("renders nothing while the documentary validation is pending: no line, no address, no partial identification, in PT/EN/ES", () => {
    expect(companyIdentificationLine()).toBeNull();
    for (const locale of ["pt", "en", "es"]) {
      const html = renderToStaticMarkup(<SiteFooter locale={locale} />);
      expect(html).not.toContain('data-testid="footer-company-identification"');
      expect(html).not.toMatch(/Rua Projetada|Itaocara|28570-000|RICARDO DE SOUZA FRANCISCO|49\.142\.341/);
    }
  });

  it("once the validation is recorded, the line carries legal name, CNPJ, address and e-mail", () => {
    const validated = { ...COMPANY_IDENTIFICATION, addressValidatedOn: "2026-11-02" };
    expect(companyIdentificationLine({ ...validated, address: "  " })).toBeNull();
    expect(companyIdentificationLine({ ...validated, legalName: "" })).toBeNull();
    expect(companyIdentificationLine(validated)).toBe(`49.142.341 RICARDO DE SOUZA FRANCISCO · CNPJ ${COMPANY_CNPJ} · Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000 · ${PUBLIC_CONTACT.email}`);
  });
});
