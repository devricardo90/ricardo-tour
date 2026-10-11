import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConciergePanel } from "@/components/ai-concierge/panel/concierge-panel";
import { getPanelCopy } from "@/components/ai-concierge/panel/copy";
import { CONCIERGE_PRIVACY, CONCIERGE_PRIVACY_TEXTS } from "@/lib/ai-concierge/runtime/privacy";
import { buildHandoffOffer } from "@/lib/ai-concierge/runtime/handoff";
import { initialPanelState, panelReducer, type PanelMessage, type PanelState } from "@/lib/ai-concierge/ui/state";
import type { ConciergeTransport } from "@/lib/ai-concierge/ui/types";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

// Daniela V1: the panel in Portuguese, English and Spanish. Server rendering of the real component; no DOM, no network.
const transport: ConciergeTransport = { send: async () => ({ outcome: "ANSWER", answer: "ok", response_kind: "grounded" }) };
const render = (locale: string, initialState: Partial<PanelState> = {}) => renderToStaticMarkup(<ConciergePanel transport={transport} locale={locale} initialState={initialState} />);
const decoded = (html: string) => html.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
const user = (id: string, text: string): PanelMessage => ({ id, role: "user", text });
const assistant = (id: string, text: string, tours?: string[], handoff?: ReturnType<typeof buildHandoffOffer>): PanelMessage => ({ id, role: "assistant", text, kind: "grounded", tours, handoff });
const handoffMessage = (id: string, offer: ReturnType<typeof buildHandoffOffer>): PanelMessage => ({ id, role: "assistant", text: "Text", kind: "handoff", handoff: offer });

describe("panel copy by language", () => {
  it("has the same keys in every language and a non-empty text for each", () => {
    const pt = getPanelCopy("pt");
    for (const lang of ["en", "es"]) {
      const copy = getPanelCopy(lang);
      expect(Object.keys(copy).sort()).toEqual(Object.keys(pt).sort());
      for (const [key, value] of Object.entries(copy)) {
        if (typeof value === "string") expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
      }
      expect(copy.starterQuestions).toHaveLength(3);
    }
  });

  it("falls back to Portuguese for anything else", () => {
    expect(getPanelCopy(undefined).title).toBe("Daniela");
    expect(getPanelCopy("fr").teamEntry).toBe("Falar com a equipe");
  });

  it("keeps the legal-review flag on the translated disclosure and notice", () => {
    expect(CONCIERGE_PRIVACY.legal_review).toBe("PENDING");
    expect(CONCIERGE_PRIVACY_TEXTS.en.ai_disclosure).toMatch(/artificial intelligence assistant .* not with a person/);
    expect(CONCIERGE_PRIVACY_TEXTS.es.ai_disclosure).toMatch(/inteligencia artificial .* no con una persona/);
  });
});

describe.each([
  ["en", /I'm Daniela, Ricardo Tour's AI assistant: an artificial intelligence, not a person on the team/, "Talk to the team", "Suggested tours", "Ask about Rio…"],
  ["es", /Soy Daniela, la asistente de IA de Ricardo Tour: una inteligencia artificial, no una persona del equipo/, "Hablar con el equipo", "Paseos sugeridos", "Pregunta sobre Río…"],
  ["pt", /Eu sou a Daniela, a assistente de IA da Ricardo Tour/, "Falar com a equipe", "Passeios sugeridos", "Pergunte sobre o Rio…"],
] as const)("the panel in %s", (locale, welcome, team, suggested, placeholder) => {
  it("welcomes as an AI, shows the localized disclosure, three quick-start prompts and the team entry", () => {
    const html = render(locale, { open: true });
    expect(decoded(html)).toMatch(welcome);
    expect(html).toContain(`lang="${locale}"`);
    expect(decoded(html)).toContain(CONCIERGE_PRIVACY_TEXTS[locale].ai_disclosure);
    expect((html.match(/<button[^>]*class="[^"]*starterButton/g) ?? []).length).toBe(3);
    expect(html).toContain(`>${team}</a>`);
    expect(decoded(html)).toContain(`placeholder="${placeholder}"`);
    expect(decoded(html)).toContain(getPanelCopy(locale).privacyPending); // the legal-review flag is visible in every language
  });

  it("shows recommendation cards with the localized summary, tour link in the page language and a contextual WhatsApp link", () => {
    const cristo = "cmlhxkpy9000028zq27rhytew";
    const html = decoded(render(locale, { open: true, messages: [user("m1", "x"), assistant("m2", "Texto", [cristo])] }));
    expect(html).toContain(suggested);
    expect(html).toContain(`href="/${locale}/tours/${cristo}"`);
    const wa = html.match(/<a[^>]*class="[^"]*tourCtaSecondary[^"]*"[^>]*href="([^"]+)"/)?.[1] ?? "";
    expect(wa.startsWith(PUBLIC_CONTACT.whatsappUrl)).toBe(true);
    const text = decodeURIComponent(wa.split("?text=")[1] ?? "");
    expect(text).toContain("Cristo Redentor + Pão de Açúcar");
    expect(text).not.toMatch(/https?:|@/); // closed: a tour title and a fixed sentence, nothing else
  });
});

describe("handoff card language", () => {
  it("uses the offer's language and approved tour, and ignores forged values", () => {
    const offer = buildHandoffOffer("H9", "price", { lang: "en", tourId: "cmlhxkpy9000028zq27rhytew" });
    const html = decoded(render("pt", { open: true, messages: [user("m1", "x"), handoffMessage("m2", offer)] }));
    expect(html).toContain("Hello! I came from the Ricardo Tour website assistant");
    expect(html).toContain('the price, availability or conditions of the &quot;Cristo Redentor + Pão de Açúcar&quot; tour'.replaceAll("&quot;", '"'));
    const forged = { ...offer, tour_id: "<script>alert(1)</script>", lang: "xx" } as unknown as ReturnType<typeof buildHandoffOffer>;
    const html2 = decoded(render("en", { open: true, messages: [user("m1", "x"), handoffMessage("m2", forged)] }));
    expect(html2).not.toMatch(/<script|alert\(1\)/);
    expect(html2).toContain("price, availability or conditions.");
  });

  it("the failed-transport message follows the visitor's language", () => {
    const state = panelReducer(panelReducer(initialPanelState(), { type: "send", text: "hi" }), { type: "failed", lang: "es" });
    const last = state.messages.at(-1) as Extract<PanelMessage, { role: "assistant" }>;
    expect(last.text).toContain("No pude responder ahora");
    expect(last.handoff?.lang).toBe("es");
  });
});
