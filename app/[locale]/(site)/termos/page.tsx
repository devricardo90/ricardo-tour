import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLanguageAlternates } from "@/i18n/routing";
import { LegalDocument } from "@/components/site/legal/legal-document";
import { LEGAL_DOCUMENT_VERSIONS, legalPagesAvailable, legalPagesPublished } from "@/lib/legal/publication";
import { legalStatusLine } from "@/lib/legal/status-line";
import { TERMS_COPY, TERMS_REVIEW_STATUS } from "@/lib/legal/terms-copy";

const pick = (locale: string) => TERMS_COPY[locale === "en" || locale === "es" ? locale : "pt"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${pick(locale).title} | Ricardo Tour`,
    alternates: { canonical: `/${locale}/termos`, languages: getLanguageAlternates("/termos") },
    // A draft is never indexed.
    robots: legalPagesPublished() ? undefined : { index: false, follow: false },
  };
}

// RT-81 public Terms of Use route. 404 until the document may be shown here (lib/legal/publication.ts): published after the
// Owner's and the legal approval, or locally in the review lab. The text is the RT-81 copy, unchanged.
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!legalPagesAvailable()) notFound();
  const copy = pick(locale);
  const published = legalPagesPublished();
  return (
    <LegalDocument
      idPrefix="terms"
      title={copy.title}
      updated={copy.updated}
      version={LEGAL_DOCUMENT_VERSIONS.terms}
      banner={published ? null : copy.draftBanner}
      statusLine={published ? null : legalStatusLine(locale, TERMS_REVIEW_STATUS)}
      sections={copy.sections}
    />
  );
}
