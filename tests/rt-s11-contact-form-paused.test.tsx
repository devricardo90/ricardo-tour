import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

/**
 * Owner 31/10/2026: the /contato form collects personal data, so it is hidden while the Privacy Policy is not available.
 * WhatsApp and e-mail stay visible and working; the form comes back by itself once the Policy may be published (or
 * locally in the review lab). The server action refuses submissions in the same state, so a direct call stores nothing.
 */
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
  getLanguageAlternates: () => ({}),
}));
const create = vi.fn(async () => ({ id: "submission-1" }));
const notify = vi.fn(async () => undefined);
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { contactSubmission: { create } } }));
vi.mock("@/lib/services/tour-request-notification", () => ({ sendContactNotification: notify }));
vi.mock("@/lib/rate-limit/server", () => ({ isFormSubmissionLimited: async () => false }));

beforeEach(() => vi.stubEnv("REBUILD_LAB_ENABLED", "false"));
afterEach(() => vi.unstubAllEnvs());

const render = async (locale: string) => {
  const { default: ContactPage } = await import("@/app/[locale]/(site)/contato/page");
  return renderToStaticMarkup(await ContactPage({ params: Promise.resolve({ locale }) }));
};
const renderFooter = async (locale: string) => {
  const { SiteFooter } = await import("@/components/site/site-footer");
  return renderToStaticMarkup(<SiteFooter locale={locale} />);
};
const form = () => {
  const data = new FormData();
  for (const [k, v] of Object.entries({ locale: "pt", name: "Cliente Teste", email: "cliente@example.invalid", phone: "", message: "Quero saber sobre o passeio." })) data.set(k, v);
  return data;
};

describe("Owner 31/10/2026: /contato form hidden while the Privacy Policy is unavailable", { timeout: 60_000 }, () => {
  it("without the Policy the page shows no form or fields, only WhatsApp and e-mail, in PT/EN/ES", async () => {
    const expected = { pt: "Fale pelo WhatsApp ou e-mail", en: "Reach us on WhatsApp or by e-mail", es: "Escríbenos por WhatsApp o correo" };
    for (const [locale, heading] of Object.entries(expected)) {
      const html = await render(locale);
      expect(html).toContain('data-testid="contact-form-paused"');
      expect(html).toContain(heading);
      expect(html).not.toContain('data-testid="contact-form"');
      expect(html).not.toMatch(/<form|<input|<textarea/);
      // Channels: in the list and in the card.
      expect(html.split(`href="${PUBLIC_CONTACT.whatsappUrl}"`).length - 1).toBe(2);
      expect(html.split(`href="${PUBLIC_CONTACT.mailto}"`).length - 1).toBe(2);
      expect(html).toContain(PUBLIC_CONTACT.instagramUrl);
      // No text promises a form that is not there: intro, card and footer link.
      expect(html).not.toMatch(/formul[aá]rio|contact form|the form/i);
      const footer = await renderFooter(locale);
      expect(footer).toContain('href="/contato"');
      expect(footer).not.toMatch(/formul[aá]rio|contact form/i);
      const { generateMetadata } = await import("@/app/[locale]/(site)/contato/page");
      const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
      expect(JSON.stringify([meta.description, meta.openGraph?.description])).not.toMatch(/formul[aá]rio|contact form/i);
    }
  });

  it("where the Policy is available (local lab; later, once published) the form returns with its privacy notice", async () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    const html = await render("pt");
    expect(html).toContain('data-testid="contact-form"');
    expect(html).toContain('data-testid="contact-privacy-notice"');
    expect(html).toContain('href="/pt/privacidade"');
    expect(html).not.toContain('data-testid="contact-form-paused"');
    expect(html).toContain("Escreva pelo formulário");
    expect(await renderFooter("pt")).toContain("Formulário de contato");
  });

  it("a direct call to the action stores nothing and sends nothing while the Policy is unavailable", async () => {
    const { submitContactMessage } = await import("@/app/actions/contact-message");
    await expect(submitContactMessage(form())).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();

    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    await expect(submitContactMessage(form())).resolves.toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
