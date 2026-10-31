import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLanguageAlternates } from "@/i18n/routing";
import { LegalDocument } from "@/components/site/legal/legal-document";
import { legalPagesAvailable, legalPagesPublished, privacyVersionFor } from "@/lib/legal/publication";
import { legalStatusLine } from "@/lib/legal/status-line";
import { PRIVACY_COPY, PRIVACY_REVIEW_STATUS, privacyCopyFor } from "@/lib/legal/privacy-copy";
import { isConciergeEnabled } from "@/lib/ai-concierge/launch";

const pick = (locale: string) => PRIVACY_COPY[locale === "en" || locale === "es" ? locale : "pt"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${pick(locale).title} | Ricardo Tour`,
    alternates: { canonical: `/${locale}/privacidade`, languages: getLanguageAlternates("/privacidade") },
    robots: legalPagesPublished() ? undefined : { index: false, follow: false },
  };
}

// RT-80 public Privacy Policy route. Same availability rule as the Terms (lib/legal/publication.ts). While the document is a
// draft its open decisions are listed at the end; once approved, that list is expected to be empty.
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!legalPagesAvailable()) notFound();
  // Without Daniela (disabled) the policy does not describe her processing (Owner 31/10/2026).
  const conciergeEnabled = isConciergeEnabled();
  const copy = privacyCopyFor(locale, { conciergeEnabled });
  const published = legalPagesPublished();
  return (
    <LegalDocument
      idPrefix="privacy"
      title={copy.title}
      updated={copy.updated}
      version={privacyVersionFor(conciergeEnabled)}
      banner={published ? null : copy.draftBanner}
      statusLine={published ? null : legalStatusLine(locale, PRIVACY_REVIEW_STATUS)}
      sections={copy.sections}
      pendingTitle={copy.pendingTitle}
      pending={published ? [] : copy.pending}
    />
  );
}
