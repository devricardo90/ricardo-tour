import { TERMS_PENDING_MARKER } from "@/lib/legal/terms-copy";

type Section = { id: string; title: string; paragraphs: string[] };

/**
 * RT-80/RT-81 public legal page body, inside the (site) layout (SiteHeader/SiteFooter, public tokens). While a document is
 * not approved it keeps its draft banner and review status visible and every undecided rule shows as PENDING: nothing
 * here presents a draft as approved.
 */
export function LegalDocument({ idPrefix, title, updated, version, banner, statusLine, sections, pendingTitle, pending }: {
  idPrefix: string;
  title: string;
  updated: string;
  version: string;
  banner: string | null;
  statusLine: string | null;
  sections: Section[];
  pendingTitle?: string;
  pending?: string[];
}) {
  return (
    <div className="bg-[var(--site-cream)] text-[var(--site-ink)]">
      <article aria-labelledby={`${idPrefix}-title`} className="mx-auto max-w-[760px] px-5 pb-16 pt-10 md:px-10 md:pb-20 md:pt-14">
        {banner ? (
          <p role="note" data-testid="legal-draft-banner" className="mb-6 rounded-lg border border-[var(--site-gold-deep)] bg-[var(--site-gold,#C8A86B)]/10 px-4 py-3 text-[14px] leading-[1.55]">
            {statusLine ? <strong className="font-semibold">{statusLine} </strong> : null}
            {banner}
          </p>
        ) : null}
        <h1 id={`${idPrefix}-title`} className="site-display text-balance text-[34px] font-medium leading-[1.08] md:text-[44px]">{title}</h1>
        <p className="mt-2 text-[14px] text-[var(--site-ink-muted)]">
          {updated} <span data-testid="legal-version">({version})</span>
        </p>
        {sections.map((section) => (
          <section key={section.id} aria-labelledby={`${idPrefix}-${section.id}`} className="mt-8">
            <h2 id={`${idPrefix}-${section.id}`} className="text-[21px] font-semibold leading-[1.3]">{section.title}</h2>
            {section.paragraphs.map((paragraph) => {
              const isPending = TERMS_PENDING_MARKER.test(paragraph);
              return (
                <p
                  key={paragraph.slice(0, 48)}
                  data-pending={isPending ? "true" : undefined}
                  className={isPending ? "mt-3 rounded-md border border-dashed border-[var(--site-gold-deep)] px-3 py-2 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]" : "mt-3 text-[16px] leading-[1.7]"}
                >
                  {paragraph}
                </p>
              );
            })}
          </section>
        ))}
        {pending && pending.length > 0 ? (
          <section aria-labelledby={`${idPrefix}-pending`} className="mt-10 border-t border-[var(--site-gold-deep)]/30 pt-6">
            <h2 id={`${idPrefix}-pending`} className="text-[18px] font-semibold">{pendingTitle}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-[1.6] text-[var(--site-ink-muted)]">
              {pending.map((item) => <li key={item.slice(0, 48)}>{item}</li>)}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  );
}
