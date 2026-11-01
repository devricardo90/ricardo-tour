import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/site/site-footer";
import { TourBookingRequestForm } from "@/components/site/tour/content/tour-booking-request-form";
import { ContactMessageForm } from "@/components/site/contact/contact-message-form";
import { LEGAL_DOCUMENT_VERSIONS, legalHref, legalPagesAvailable, legalPagesPublished, privacyVersionFor } from "@/lib/legal/publication";
import { PRIVACY_COPY, PRIVACY_REVIEW_STATUS, privacyCopyFor } from "@/lib/legal/privacy-copy";
import { PAYMENT_METHOD_TEXT } from "@/lib/catalog/public-tour-presentation";
import { TERMS_COPY, TERMS_REVIEW_STATUS } from "@/lib/legal/terms-copy";
import { publicRequestTable } from "@/lib/booking/public-request";
import TermsPage from "@/app/[locale]/(site)/termos/page";
import PrivacyPage from "@/app/[locale]/(site)/privacidade/page";

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
  getLanguageAlternates: () => ({}),
}));
vi.mock("@/app/actions/private-booking-request", () => ({ submitPrivateBookingRequest: vi.fn() }));
vi.mock("@/app/actions/contact-message", () => ({ submitContactMessage: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const page = async (Page: typeof TermsPage, locale: string) => renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }));
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

describe("RT-80/RT-81 legal pages stay drafts until approved (Owner 31/10/2026)", () => {
  it("both documents are still PENDING the Owner's and the legal approval, so they are not published", () => {
    expect(TERMS_REVIEW_STATUS).toMatchObject({ owner_approval: "PENDING", legal_review: "PENDING" });
    expect(PRIVACY_REVIEW_STATUS).toMatchObject({ owner_approval: "PENDING", legal_review: "PENDING" });
    expect(legalPagesPublished()).toBe(false);
    // Publishing needs BOTH approvals on BOTH documents.
    const ok = { owner_approval: "APPROVED", legal_review: "APPROVED" } as const;
    expect(legalPagesPublished(ok as never, ok as never)).toBe(true);
    expect(legalPagesPublished({ ...ok, legal_review: "PENDING" } as never, ok as never)).toBe(false);
    expect(legalPagesPublished(ok as never, { ...ok, owner_approval: "PENDING" } as never)).toBe(false);
  });

  it("on a deployment the routes are unavailable (404) and the footer shows no legal links; the local review lab shows both", async () => {
    expect(legalPagesAvailable({ NODE_ENV: "production" })).toBe(false);
    expect(legalPagesAvailable({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
    expect(legalPagesAvailable({ NODE_ENV: "development", REBUILD_LAB_ENABLED: "true" })).toBe(true);

    vi.stubEnv("REBUILD_LAB_ENABLED", "false");
    await expect(page(TermsPage, "pt")).rejects.toThrow();
    await expect(page(PrivacyPage, "en")).rejects.toThrow();
    expect(renderToStaticMarkup(<SiteFooter locale="pt" />)).not.toContain('data-testid="footer-legal-links"');
    expect(renderToStaticMarkup(<ContactMessageForm locale="pt" privacyHref={null} />)).not.toContain("contact-privacy-notice");

    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    const footer = renderToStaticMarkup(<SiteFooter locale="pt" />);
    expect(footer).toContain('data-testid="footer-legal-links"');
    expect(footer).toContain('href="/termos"');
    expect(footer).toContain('href="/privacidade"');
    expect(footer).toContain("Termos de Uso");
    expect(footer).toContain("Política de Privacidade");
  });

  it("the routes render the RT-80/RT-81 copy in PT/EN/ES with the draft banner, the review status, the version and the PENDING items", async () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    for (const locale of ["pt", "en", "es"] as const) {
      const terms = await page(TermsPage, locale);
      expect(terms).toContain(TERMS_COPY[locale].title);
      expect(terms).toContain('data-testid="legal-draft-banner"');
      expect(terms).toContain(LEGAL_DOCUMENT_VERSIONS.terms);
      expect(terms).toMatch(locale === "en" ? /Legal review: PENDING/ : /Revisión jurídica: PENDIENTE|Revisão jurídica: PENDENTE/);
      for (const section of TERMS_COPY[locale].sections) expect(terms).toContain(section.title);
      expect(terms).toContain('data-pending="true"');

      const privacy = await page(PrivacyPage, locale);
      expect(privacy).toContain(PRIVACY_COPY[locale].title);
      expect(privacy).toContain(LEGAL_DOCUMENT_VERSIONS.privacy);
      expect(privacy).toContain(PRIVACY_COPY[locale].pendingTitle);
    }
  });

  it("the route pages are never indexed while the documents are drafts and the sitemap lists them only once published", () => {
    for (const file of ["app/[locale]/(site)/termos/page.tsx", "app/[locale]/(site)/privacidade/page.tsx"]) {
      expect(read(file)).toMatch(/robots: legalPagesPublished\(\) \? undefined : \{ index: false, follow: false \}/);
      expect(read(file)).toMatch(/if \(!legalPagesAvailable\(\)\) notFound\(\);/);
    }
    expect(read("app/sitemap.ts")).toMatch(/legalPagesPublished\(\) \? \[LEGAL_PATHS\.terms, LEGAL_PATHS\.privacy\] : \[\]/);
  });

  it("any change to a document's text requires a new version (the request stores the accepted version)", () => {
    // If this fails after editing lib/legal/*-copy.ts: bump LEGAL_DOCUMENT_VERSIONS and update the fingerprints here.
    expect({ version: LEGAL_DOCUMENT_VERSIONS.terms, text: fingerprint(TERMS_COPY) }).toEqual({ version: "2026-11-01-draft", text: TERMS_FINGERPRINT });
    expect({ version: LEGAL_DOCUMENT_VERSIONS.privacy, text: fingerprint(PRIVACY_COPY) }).toEqual({ version: "2026-10-31-draft-r2", text: PRIVACY_FINGERPRINT });
  });
});

describe("Owner 31/10/2026: nothing describes Daniela or a payment method as available while they are not", () => {
  it("with Daniela disabled the policy has no Daniela section, AI provider, Daniela retention or browser line, in PT/EN/ES", () => {
    for (const locale of ["pt", "en", "es"] as const) {
      const full = JSON.stringify(PRIVACY_COPY[locale]);
      const off = JSON.stringify(privacyCopyFor(locale, { conciergeEnabled: false }));
      expect(full).toMatch(/Daniela/);
      expect(full).toMatch(/OpenAI/);
      expect(off).not.toMatch(/Daniela|OpenAI/);
      // Everything else stays: same other sections, providers still named, the rights channel still there.
      expect(privacyCopyFor(locale, { conciergeEnabled: false }).sections.map((s) => s.id)).toEqual(PRIVACY_COPY[locale].sections.map((s) => s.id).filter((id) => id !== "daniela"));
      expect(off).toMatch(/Vercel/);
      expect(off).toContain("contato@ricardotour.com");
      expect(privacyCopyFor(locale, { conciergeEnabled: true })).toBe(PRIVACY_COPY[locale]);
    }
    expect(privacyVersionFor(false)).toBe(LEGAL_DOCUMENT_VERSIONS.privacy);
    expect(privacyVersionFor(true)).toBe(`${LEGAL_DOCUMENT_VERSIONS.privacy}+daniela`);
  });

  it("the public privacy page renders the variant for the current concierge state (off here)", async () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    const html = await page(PrivacyPage, "pt");
    expect(html).not.toMatch(/Daniela|OpenAI/);
    expect(html).toContain(LEGAL_DOCUMENT_VERSIONS.privacy);
  });

  it("until paid bookings open, answers listing payment methods are left out of the public tour page (PT/EN/ES)", () => {
    for (const text of ["O sinal e o saldo podem ser pagos por PIX, cartão na maquininha ou dinheiro.", "paid by PIX, card (on a card terminal) or cash", "por PIX, tarjeta (en terminal de pago) o efectivo"]) {
      expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(true);
    }
    // Each method alone (a lone PIX or cash mention must be caught too), but not a word that merely contains it.
    for (const text of ["Pagamento por PIX.", "Pay in cash at the start.", "Pago en efectivo.", "Em dinheiro."]) expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(true);
    for (const text of ["PIXEL", "cashew"]) expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(false);
    // No control characters in the pattern (a "\b" written through a non-raw string once became a backspace).
    expect(PAYMENT_METHOD_TEXT.source).not.toMatch(/[\u0000-\u001f]/);
    for (const text of ["A reserva é confirmada com sinal de 30% do valor total. O site não processa pagamentos.", "Payments are not processed on this website.", "Los pagos no se procesan en este sitio web."]) {
      expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(false);
    }
    expect(read("lib/catalog/public-tour-presentation.ts")).toMatch(/if \(!bookingsOpen\) content = \{ \.\.\.content, faq: content\.faq\.filter\(\(item\) => !PAYMENT_METHOD_TEXT\.test\(item\.answer\)\) \};/);
  });
});

describe("RT-81 acceptance in the forms", () => {
  const formHtml = (locale: string) =>
    renderToStaticMarkup(<TourBookingRequestForm tripId="cmlibniq40000z4zqkbujnutt" locale={locale} mode="lab" groupTotalCents={{ 1: 65_000, 2: 76_000, 3: 90_000, 4: 104_000 }} />);

  it("the booking request shows the privacy NOTICE (no consent box) and a separate, unchecked, required acceptance of the Terms", () => {
    for (const [locale, terms, privacy] of [["pt", "Termos de Uso", "Política de Privacidade"], ["en", "Terms of Use", "Privacy Policy"], ["es", "Términos de Uso", "Política de Privacidad"]] as const) {
      const html = formHtml(locale);
      expect(html).toContain('data-testid="booking-request-privacy-notice"');
      expect(html).toContain(`href="${legalHref(locale, "privacy")}"`);
      expect(html).toContain(`href="${legalHref(locale, "terms")}"`);
      expect(html).toContain(terms);
      expect(html).toContain(privacy);
      const box = html.match(/<input[^>]*data-testid="booking-request-terms"[^>]*>/)?.[0] ?? "";
      expect(box).toContain('type="checkbox"');
      expect(box).toContain('name="acceptTerms"');
      expect(box).toContain("required");
      expect(box).not.toContain("checked");
      expect(html).toContain(`name="termsVersion" value="${LEGAL_DOCUMENT_VERSIONS.terms}"`);
      expect(html).toContain(`name="privacyVersion" value="${LEGAL_DOCUMENT_VERSIONS.privacy}"`);
      // Only one checkbox: there is no marketing or LGPD consent box (the data serve the request itself).
      expect(html.match(/type="checkbox"/g)).toHaveLength(1);
    }
  });

  it("the contact form shows the privacy notice and link when the policy page is available; it asks for no acceptance", () => {
    const html = renderToStaticMarkup(<ContactMessageForm locale="es" privacyHref="/es/privacidade" />);
    expect(html).toContain('data-testid="contact-privacy-notice"');
    expect(html).toContain('href="/es/privacidade"');
    expect(html).not.toContain('type="checkbox"');
  });

  it("a public request also needs the legal pages published: today it stays closed even for an approved table", () => {
    for (const id of ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt"]) expect(publicRequestTable(id, "public")).toBeNull();
    expect(read("lib/booking/public-request.ts")).toMatch(/PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS\.has\(tripId\) && legalPagesPublished\(\)/);
  });
});

const TERMS_FINGERPRINT = "0fcbaba2cc8c444f";
const PRIVACY_FINGERPRINT = "d3a46164e77b42ba";
