import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

/**
 * Owner 31/10/2026: the legacy tour request form (RT-55, shown by the fallback tour layout whenever the approved design
 * cannot render) collects personal data, so it is hidden while the Privacy Policy is not available, by the same central
 * rule as /contato. WhatsApp and e-mail stay; the server action refuses submissions in the same state.
 */
const create = vi.fn(async () => ({ id: "submission-1" }));
const notify = vi.fn(async () => undefined);
vi.mock("next/headers", () => ({ headers: async () => new Headers({ host: "localhost:3000" }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { contactSubmission: { create } } }));
vi.mock("@/lib/services/tour-request-notification", () => ({ sendTourRequestNotification: notify }));
vi.mock("@/lib/rate-limit/server", () => ({ isFormSubmissionLimited: async () => false }));
vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id, title: { pt: "Centro Histórico" } }) }));

const TRIP = "cmlibniq40000z4zqkbujnutt";
beforeEach(() => vi.stubEnv("REBUILD_LAB_ENABLED", "false"));
afterEach(() => vi.unstubAllEnvs());

const slot = async (locale: string) => {
  const { TourConversionSlot } = await import("@/components/site/tour/tour-conversion-slot");
  return renderToStaticMarkup(<TourConversionSlot tripId={TRIP} title="Centro Histórico" locale={locale} />);
};
const form = () => {
  const data = new FormData();
  const fields = { locale: "pt", tripId: TRIP, name: "Cliente Teste", email: "cliente@example.invalid", phone: "", date: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10), party: "2", notes: "" };
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

describe("Owner 31/10/2026: legacy tour request form hidden while the Privacy Policy is unavailable", { timeout: 60_000 }, () => {
  it("without the Policy the slot keeps its heading and anchor, has no fields, and offers WhatsApp and e-mail, in PT/EN/ES", async () => {
    const expected = {
      pt: ["Solicite este passeio", "Fale pelo WhatsApp ou escreva por e-mail."],
      en: ["Request this tour", "Message us on WhatsApp or write by e-mail."],
      es: ["Solicita este tour", "Escríbenos por WhatsApp o por correo."],
    };
    for (const [locale, [heading, intro]] of Object.entries(expected)) {
      const html = await slot(locale);
      expect(html).toContain('id="tour-contact"');
      expect(html).toContain('data-testid="tour-request-paused"');
      expect(html).toContain(heading);
      expect(html).toContain(intro);
      expect(html).not.toMatch(/<form|<input|<textarea|<select/);
      expect(html).toContain('data-testid="tour-whatsapp"');
      expect(html).toContain("https://wa.me/");
      expect(html).toContain(`href="${PUBLIC_CONTACT.mailto}"`);
      // The request intro that offers to "send a request" is not shown.
      expect(html).not.toMatch(/Envie uma solicitação|Send a request|Envía una solicitud/);
    }
  });

  it("where the Policy is available (local lab; later, once published) the form returns", async () => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    const html = await slot("pt");
    expect(html).toMatch(/<form/);
    expect(html).not.toContain('data-testid="tour-request-paused"');
  });

  it("a direct call to submitTourRequest stores nothing and sends nothing while the Policy is unavailable", async () => {
    const { submitTourRequest } = await import("@/app/actions/tour-request");
    await expect(submitTourRequest(form())).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();

    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    await expect(submitTourRequest(form())).resolves.toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("the fallback tour layout renders the request only through the protected slot", () => {
    const view = readFileSync(resolve(process.cwd(), "components/site/tour/tour-detail-view.tsx"), "utf8");
    expect(view).toContain("<TourConversionSlot");
    expect(view).not.toContain("<TourRequestForm");
  });
});
