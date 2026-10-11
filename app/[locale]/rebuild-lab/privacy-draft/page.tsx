import type { Metadata } from "next";
import { PRIVACY_COPY, PRIVACY_REVIEW_STATUS } from "@/lib/legal/privacy-copy";

export const metadata: Metadata = { title: "RT-80 · Privacy page DRAFT — Ricardo Tour", robots: { index: false, follow: false } };

/** RT-80 draft for the Owner's review. Production-hidden by the rebuild-lab layout; not linked from the site footer. */
export default async function PrivacyDraftPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = PRIVACY_COPY[locale === "en" || locale === "es" ? locale : "pt"];
  return (
    <main style={{ minHeight: "100vh", background: "#f6f2ea", color: "#171a1e", fontFamily: "Inter, system-ui, sans-serif" }}>
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px", lineHeight: 1.65 }}>
        <p role="note" style={{ margin: "0 0 24px", padding: "12px 16px", background: "#fff3cd", border: "1px solid #c9a227", borderRadius: 10, fontSize: 14 }}>
          <strong>Owner approval: {PRIVACY_REVIEW_STATUS.owner_approval} · Legal review: {PRIVACY_REVIEW_STATUS.legal_review}.</strong> {copy.draftBanner}
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 500, margin: "0 0 8px" }}>{copy.title}</h1>
        <p style={{ margin: "0 0 32px", color: "#53565a", fontSize: 14 }}>{copy.updated}</p>
        {copy.sections.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} style={{ marginBottom: 28 }}>
            <h2 id={`privacy-${section.id}`} style={{ fontSize: 22, margin: "0 0 8px" }}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} style={{ margin: "0 0 12px", fontSize: 16 }}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
