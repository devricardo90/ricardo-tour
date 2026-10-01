import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStoredRequestMessage, buildTourWhatsAppMessage, buildTourWhatsAppUrl, formatRequestDate, normalizeValues, validateTourRequest, type TourRequestValues } from "@/lib/tour-request";
import { NOTIFICATION_RECIPIENT, resolveEmailMode, sendTourRequestNotification } from "@/lib/services/tour-request-notification";

const TODAY = "2026-10-10";
const valid: TourRequestValues = { name: "Ana", email: "ana@example.com", phone: "", date: "2026-10-20", party: "2", notes: "" };

describe("guest tour request validation (RT-55)", () => {
  it("accepts a complete request with either contact method", () => {
    expect(validateTourRequest(valid, TODAY)).toEqual({});
    expect(validateTourRequest({ ...valid, email: "", phone: "+55 21 91234-5678" }, TODAY)).toEqual({});
  });

  it("requires name, date, party size and at least one contact method (not both)", () => {
    const errors = validateTourRequest({ name: "", email: "", phone: "", date: "", party: "", notes: "" }, TODAY);
    expect(errors).toMatchObject({ name: "name_required", contact: "contact_required", date: "date_required", party: "party_invalid" });
    expect(validateTourRequest({ ...valid, phone: "" }, TODAY).contact).toBeUndefined();
  });

  it("rejects malformed contacts, past dates and out-of-range party sizes", () => {
    expect(validateTourRequest({ ...valid, email: "nope" }, TODAY).email).toBe("email_invalid");
    expect(validateTourRequest({ ...valid, email: "", phone: "12" }, TODAY).phone).toBe("phone_invalid");
    expect(validateTourRequest({ ...valid, date: "2026-10-09" }, TODAY).date).toBe("date_past");
    expect(validateTourRequest({ ...valid, date: TODAY }, TODAY).date).toBeUndefined();
    expect(validateTourRequest({ ...valid, date: "2026-13-45" }, TODAY).date).toBe("date_invalid");
    expect(validateTourRequest({ ...valid, party: "0" }, TODAY).party).toBe("party_invalid");
    expect(validateTourRequest({ ...valid, party: "21" }, TODAY).party).toBe("party_invalid");
    expect(validateTourRequest({ ...valid, party: "2.5" }, TODAY).party).toBe("party_invalid");
    expect(validateTourRequest({ ...valid, notes: "x".repeat(1001) }, TODAY).notes).toBe("notes_too_long");
  });

  it("normalizes untrusted input", () => {
    expect(normalizeValues({ name: "  Ana  ", email: null, phone: 5, date: " 2026-10-20 " })).toMatchObject({ name: "Ana", email: "", phone: "", date: "2026-10-20" });
  });
});

describe("WhatsApp message and stored request (RT-55)", () => {
  const title = "Cristo Redentor + Pão de Açúcar";

  it("builds natural PT/EN/ES messages that ask for availability without promising anything", () => {
    const pt = buildTourWhatsAppMessage({ locale: "pt", title, date: "2026-10-20", party: "4" });
    const en = buildTourWhatsAppMessage({ locale: "en", title, date: "2026-10-20", party: "1" });
    const es = buildTourWhatsAppMessage({ locale: "es", title, party: "2" });
    expect(pt).toBe(`Olá, tenho interesse no passeio "${title}". Gostaria de consultar disponibilidade para 20 de outubro de 2026 para 4 pessoas.`);
    expect(en).toContain("I'd like to ask about availability for 20 October 2026 for 1 person.");
    expect(es).toBe(`Hola, me interesa el tour "${title}". Quisiera consultar la disponibilidad para 2 personas.`);
    for (const message of [pt, en, es]) expect(message).not.toMatch(/confirm|garant|guarant|pag|pay/i);
  });

  it("omits date and party until the visitor enters them", () => {
    expect(buildTourWhatsAppMessage({ locale: "pt", title })).toBe(`Olá, tenho interesse no passeio "${title}". Gostaria de consultar disponibilidade.`);
  });

  it("targets only the canonical WhatsApp number", () => {
    const url = buildTourWhatsAppUrl({ locale: "pt", title });
    expect(url.startsWith("https://wa.me/5522998461906?text=")).toBe(true);
  });

  it("formats dates without a time-zone shift", () => {
    expect(formatRequestDate("2026-10-01", "pt")).toBe("1 de outubro de 2026");
  });

  it("stores the tour context in the structured message", () => {
    const message = buildStoredRequestMessage(
      { ...valid, phone: "+55 21 91234-5678", notes: "Prefiro manhã." },
      { tripId: "cmlhxkpy9000028zq27rhytew", tripTitle: title, locale: "es", pageUrl: "https://x.test/es/tours/cmlhxkpy9000028zq27rhytew" }
    );
    for (const part of ["ID cmlhxkpy9000028zq27rhytew", title, "Idioma da página: es", "Data preferida: 2026-10-20", "Pessoas: 2", "e-mail ana@example.com", "telefone/WhatsApp +55 21 91234-5678", "/es/tours/cmlhxkpy9000028zq27rhytew", "Prefiro manhã."]) {
      expect(message).toContain(part);
    }
  });
});

describe("notification e-mail mode (RT-55)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("goes to the approved recipient", () => {
    expect(NOTIFICATION_RECIPIENT).toBe("contato@ricardotour.com");
  });

  it("resolves the mode: explicit value wins, otherwise send only when a key exists", () => {
    expect(resolveEmailMode({ CONTACT_EMAIL_MODE: "log", RESEND_API_KEY: "k" })).toBe("log");
    expect(resolveEmailMode({ CONTACT_EMAIL_MODE: "off", RESEND_API_KEY: "k" })).toBe("off");
    expect(resolveEmailMode({ RESEND_API_KEY: "k" })).toBe("send");
    expect(resolveEmailMode({})).toBe("off");
  });

  it("never sends in log mode and skips quietly when off", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubEnv("CONTACT_EMAIL_MODE", "log");
    expect(await sendTourRequestNotification({ submissionId: "s1", tripTitle: "T", message: "m", replyTo: "a@b.co" })).toBe("muted");
    expect(info).toHaveBeenCalledWith(expect.stringContaining("to=contato@ricardotour.com"));
    vi.stubEnv("CONTACT_EMAIL_MODE", "off");
    expect(await sendTourRequestNotification({ submissionId: "s2", tripTitle: "T", message: "m" })).toBe("skipped");
  });
});
