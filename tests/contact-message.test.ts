import { describe, expect, it } from "vitest";
import { buildStoredContactMessage, normalizeContactValues, validateContactMessage, type ContactMessageValues } from "@/lib/contact-message";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/security/rate-limit";
import { isValidEmail, isValidPhone } from "@/lib/tour-request";
import { resolveAboutCopy } from "@/components/site/about/about-copy";
import { resolveContactCopy } from "@/components/site/contact/contact-copy";

const valid: ContactMessageValues = { name: "Ana", email: "ana@example.com", phone: "", message: "Gostaria de saber mais sobre os passeios." };

describe("contact message validation (RT-56)", () => {
  it("accepts either contact method, but needs at least one", () => {
    expect(validateContactMessage(valid)).toEqual({});
    expect(validateContactMessage({ ...valid, email: "", phone: "+55 21 91234-5678" })).toEqual({});
    expect(validateContactMessage({ ...valid, email: "", phone: "" }).contact).toBe("contact_required");
  });

  it("requires a name and a message of a sensible length", () => {
    expect(validateContactMessage({ ...valid, name: "" }).name).toBe("name_required");
    expect(validateContactMessage({ ...valid, message: "" }).message).toBe("message_required");
    expect(validateContactMessage({ ...valid, message: "curto" }).message).toBe("message_too_short");
    expect(validateContactMessage({ ...valid, message: "x".repeat(2001) }).message).toBe("message_too_long");
  });

  it("rejects malformed contacts using the shared validators", () => {
    expect(validateContactMessage({ ...valid, email: "nope" }).email).toBe("email_invalid");
    expect(validateContactMessage({ ...valid, email: "", phone: "12" }).phone).toBe("phone_invalid");
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidPhone("+55 21 91234-5678")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });

  it("normalizes untrusted input and stores the structured message", () => {
    expect(normalizeContactValues({ name: " Ana ", email: null, message: " olá " })).toMatchObject({ name: "Ana", email: "", message: "olá" });
    const stored = buildStoredContactMessage({ ...valid, phone: "+55 21 91234-5678" }, { locale: "es", pageUrl: "https://x.test/es/contato" });
    for (const part of ["Idioma da página: es", "e-mail ana@example.com", "telefone/WhatsApp +55 21 91234-5678", "https://x.test/es/contato", "Gostaria de saber mais"]) expect(stored).toContain(part);
  });
});

describe("shared rate limiter (RT-56)", () => {
  it("refuses attempts over the limit within the window and recovers after it", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.isLimited("ip", 0)).toBe(false);
    expect(limiter.isLimited("ip", 10)).toBe(false);
    expect(limiter.isLimited("ip", 20)).toBe(true);
    expect(limiter.isLimited("other", 20)).toBe(false);
    expect(limiter.isLimited("ip", 2000)).toBe(false);
  });

  it("derives the client key from forwarding headers", () => {
    const h = (map: Record<string, string>) => ({ get: (name: string) => map[name] ?? null });
    expect(clientKeyFromHeaders(h({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    expect(clientKeyFromHeaders(h({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientKeyFromHeaders(h({}))).toBe("unknown");
  });
});

describe("public contact and about copy (RT-56)", () => {
  const unsupported = /(credenciad|accredit|acreditad|certific|experi[eê]ncia segura|contato seguro|secure contact|garant|parceir[oa] oficial|official partner|24\s*\/\s*7)/i;
  const everything = (value: unknown): string => (typeof value === "string" ? value : Array.isArray(value) ? value.map(everything).join(" ") : value && typeof value === "object" ? Object.values(value).map(everything).join(" ") : "");

  it("exists in PT, EN and ES with distinct headings", () => {
    const headings = ["pt", "en", "es"].map((l) => resolveAboutCopy(l).heading);
    expect(new Set(headings).size).toBe(3);
    expect(new Set(["pt", "en", "es"].map((l) => resolveContactCopy(l).heading)).size).toBe(3);
  });

  it("contains no unsupported claims, mission/values structure or invented facts", () => {
    for (const locale of ["pt", "en", "es"]) {
      const text = everything(resolveAboutCopy(locale)) + " " + everything(resolveContactCopy(locale));
      expect(text, locale).not.toMatch(unsupported);
      expect(text, locale).not.toMatch(/\b\d+\s*(anos|years|años)\b/i);
    }
  });
});
