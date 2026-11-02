import { COMPANY_CNPJ } from "@/lib/legal/privacy-copy";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

/**
 * Supplier identification for the public site (Decreto 7.962/2013, art. 2º: legal name, CNPJ, physical address and
 * electronic contact).
 *
 * Owner 01/11/2026: address and CNPJ provided by the Owner (Rua Projetada, nº 8, Centro, Itaocara – RJ; CNPJ
 * 49.142.341/0001-90). That is the Owner's data and authorization, recorded as ADDRESS_STATUS; it is kept separate from the
 * documentary/legal validation, which is still pending (the public CNPJ record shows the Cidade Nova district; no Cartão
 * CNPJ is on file). The line stays off until that validation is recorded (`addressValidatedOn`) and the legal review
 * decides where the identification appears; the legal documents are not published either.
 */
export const ADDRESS_STATUS = "Dados fornecidos pelo Owner. Validação documental pendente." as const;

export const COMPANY_IDENTIFICATION = {
  /** Registry legal name (public CNPJ record, checked 28/10/2026). */
  legalName: "49.142.341 RICARDO DE SOUZA FRANCISCO",
  cnpj: COMPANY_CNPJ,
  /** Provided by the Owner (28/10, 29/10 and 01/11/2026). ADDRESS_STATUS applies. */
  address: "Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000",
  /** ISO date of the documentary validation; null = validation pending (identification stays unpublished). */
  addressValidatedOn: null as string | null,
  email: PUBLIC_CONTACT.email,
} as const;

export type CompanyIdentification = { legalName: string; cnpj: string; address: string; addressValidatedOn: string | null; email: string };

/** The footer line, or null while the documentary validation is pending (then nothing is shown, not even a partial line). */
export function companyIdentificationLine(id: CompanyIdentification = COMPANY_IDENTIFICATION): string | null {
  if (!id.addressValidatedOn) return null;
  // All four elements or nothing: never a partial identification.
  if (![id.legalName, id.cnpj, id.address, id.email].every((v) => v.trim().length > 0)) return null;
  return `${id.legalName} · CNPJ ${id.cnpj} · ${id.address} · ${id.email}`;
}
