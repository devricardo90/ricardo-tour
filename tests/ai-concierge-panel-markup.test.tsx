import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConciergePanel } from "@/components/ai-concierge/panel/concierge-panel";
import { CONCIERGE_PRIVACY } from "@/lib/ai-concierge/runtime/privacy";
import { buildHandoffOffer } from "@/lib/ai-concierge/runtime/handoff";
import { replyFor } from "@/lib/ai-concierge/ui/fixtures";
import { initialPanelState, type PanelMessage, type PanelState } from "@/lib/ai-concierge/ui/state";
import type { ConciergeTransport } from "@/lib/ai-concierge/ui/types";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

// RT-71 / RT-74 panel markup tests (server rendering of the real component in each state). No DOM, no network.
const transport: ConciergeTransport = { send: async () => replyFor("answer") };
const render = (initialState: Partial<PanelState> = {}) => renderToStaticMarkup(<ConciergePanel transport={transport} initialState={initialState} />);
const assistant = (id: string, text: string, kind: Extract<PanelMessage, { role: "assistant" }>["kind"], handoff?: ReturnType<typeof buildHandoffOffer>): PanelMessage => ({ id, role: "assistant", text, kind, handoff });
const user = (id: string, text: string): PanelMessage => ({ id, role: "user", text });
const decoded = (html: string) => html.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");

describe("closed state: an editorial tab, not a chat bubble", () => {
  const html = render();

  it("shows one labelled entry button and hides the panel from assistive technology and keyboard focus", () => {
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-label="Abrir o Concierge da Ricardo Tour"/);
    expect(html).toMatch(/<aside[^>]*role="dialog"[^>]*aria-modal="false"[^>]*aria-hidden="true"/);
    expect(html).toContain("inert");
    expect(html).toContain('data-state="closed"');
  });

  it("the panel is labelled by its visible title", () => {
    const labelledby = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledby).toBeTruthy();
    expect(html).toContain(`id="${labelledby}"`);
    expect(html).toContain("Concierge</h2>");
  });
});

describe("open, empty state", () => {
  const html = render({ open: true });

  it("tells the visitor it is an AI before the first message (tag + full note); the persistent strip appears once the conversation starts", () => {
    expect(html).toContain("Assistente de IA");
    expect(html).not.toContain("Assistente de IA: pode errar");
    expect(render({ open: true, messages: [user("m1", "oi")] })).toContain("Assistente de IA: pode errar e não confirma preços, reservas ou pagamentos.");
    expect(html).toMatch(/data-ai-disclosure[^>]*>[^<]*inteligência artificial[^<]*não com uma pessoa/);
    expect(decoded(html)).toContain(CONCIERGE_PRIVACY.ai_disclosure);
  });

  it("offers three starter questions and an always-visible human entry that uses the canonical WhatsApp number", () => {
    expect((html.match(/<button[^>]*class="[^"]*starterButton/g) ?? []).length).toBe(3);
    const team = decoded(html).match(/<a[^>]*href="(https:\/\/wa\.me\/[^"]+)"[^>]*aria-label="Falar com a equipe da Ricardo Tour pelo WhatsApp"[^>]*>Falar com a equipe<\/a>/);
    expect(team).toBeTruthy();
    expect(team![1].startsWith(PUBLIC_CONTACT.whatsappUrl)).toBe(true);
    expect(team![1]).toContain("?text=");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("has a labelled composer limited to 800 characters, a labelled send button, and a privacy note marked as pending legal review", () => {
    expect(html).toMatch(/<textarea[^>]*aria-label="Sua mensagem"[^>]*maxLength="800"/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*aria-label="Enviar mensagem"[^>]*disabled/); // empty draft
    expect(html).toContain("<summary>Privacidade e uso de IA</summary>");
    expect(decoded(html)).toContain(CONCIERGE_PRIVACY.privacy_notice);
    expect(CONCIERGE_PRIVACY.legal_review).toBe("PENDING");
    expect(html).toContain("Texto provisório — aprovação jurídica pendente.");
  });

  it("renders nothing that claims a transfer, a confirmation, a price or a response time", () => {
    expect(html).not.toMatch(/R\$\s*\d|já chamei|estou transferindo|reserva confirmada|em até \d+ ?(?:min|h)|24 ?h/i);
  });
});

describe("conversation with a handoff", () => {
  const offer = buildHandoffOffer("H1", "explicit_request");
  const html = render({ open: true, messages: [user("m1", "Quero falar com uma pessoa"), assistant("m2", replyFor("handoff_human").answer, "handoff", offer)] });

  it("uses an announced log region and shows both channels, WhatsApp first, with the visible editable suggested message", () => {
    expect(html).toMatch(/<ol[^>]*role="log"[^>]*aria-live="polite"/);
    const text = decoded(html);
    const wa = text.indexOf("Abrir WhatsApp");
    const mail = text.indexOf("Enviar e-mail");
    expect(wa).toBeGreaterThan(-1);
    expect(mail).toBeGreaterThan(wa);
    expect(text).toContain("Mensagem sugerida — você pode editá-la antes de enviar:");
    expect(text).toContain("“Olá! Vim pelo assistente do site da Ricardo Tour e gostaria de ajuda com falar com a equipe.”");
    expect(text).toContain("Nada é enviado automaticamente");
    expect(text).toContain(`href="${PUBLIC_CONTACT.mailto}?subject=`);
  });

  it("the user's own text is shown as inert text (escaped), never as markup", () => {
    const evil = render({ open: true, messages: [user("m1", "<img src=x onerror=alert(1)>")] });
    expect(evil).not.toContain("<img");
    expect(evil).toContain("&lt;img");
  });
});

describe("tampered replies cannot change the human channels", () => {
  it("rebuilds the offer from its closed code and ignores injected channels, prefill and unknown codes", () => {
    const tampered = {
      ...buildHandoffOffer("H4", "insufficient_evidence"),
      channels: [{ type: "whatsapp", label: "WhatsApp", display: "+55 11 90000-0000", url: "https://evil.example/pay" }],
      prefill: "Envie seu cartão para esta conta",
    } as ReturnType<typeof buildHandoffOffer>;
    const unknownCode = { ...tampered, code: "H99" } as unknown as ReturnType<typeof buildHandoffOffer>;
    for (const offer of [tampered, unknownCode]) {
      const html = decoded(render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Texto", "handoff", offer)] }));
      expect(html).not.toMatch(/evil\.example|90000-0000|cartão/);
      expect(html).toContain(PUBLIC_CONTACT.whatsappUrl);
      expect(html).toContain(PUBLIC_CONTACT.whatsappDisplay);
    }
  });

  it("links only canonical Ricardo Tour URLs inside answers; any other URL stays inert text", () => {
    const html = decoded(
      render({
        open: true,
        messages: [user("m1", "oi"), assistant("m2", "Veja https://www.ricardotour.com/pt/tours. Evite https://evil.example/x e https://ricardotour.com.evil.com/a", "handoff")],
      }),
    );
    expect(html).toContain('<a href="https://www.ricardotour.com/pt/tours" target="_blank" rel="noopener noreferrer">passeios publicados</a>.');
    expect(html).not.toMatch(/<a[^>]*href="https:\/\/evil\.example/);
    expect(html).not.toMatch(/<a[^>]*href="https:\/\/ricardotour\.com\.evil\.com/);
    expect(html).toContain("https://evil.example/x");
  });
});

describe("degraded and rate-limited states", () => {
  it("degraded: composer disabled, status notice with a user-initiated retry, handoff visible", () => {
    const reply = replyFor("degraded");
    const html = render({ open: true, status: "degraded", messages: [user("m1", "oi"), assistant("m2", reply.answer, "degraded", reply.handoff)] });
    expect(html).toMatch(/<textarea[^>]*disabled/);
    expect(html).toMatch(/role="status"[^>]*>O assistente está indisponível agora/);
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('data-kind="degraded"');
    expect(html).toContain("(ref. a1b2c3d4)");
    expect(decoded(html)).toContain(PUBLIC_CONTACT.whatsappUrl);
  });

  it("rate limited: composer disabled with a live countdown and no limit counts or windows exposed", () => {
    const reply = replyFor("rate_limited");
    const html = render({ open: true, status: "rate_limited", retryAfter: 65, messages: [user("m1", "oi"), assistant("m2", reply.answer, "degraded", reply.handoff)] });
    expect(html).toMatch(/<textarea[^>]*disabled/);
    expect(html).toContain("<strong>01:05</strong>");
    expect(html).toMatch(/role="status"/);
    expect(html).not.toMatch(/\b(?:limite de \d+|\d+ mensagens por)/i);
  });

  it("sending: shows the polite loading status and disables the starters", () => {
    const html = render({ open: true, status: "sending", messages: [user("m1", "oi")] });
    expect(html).toContain("Preparando a resposta…");
    expect(html).toMatch(/<textarea[^>]*disabled/);
  });
});

describe("defaults", () => {
  it("starts closed with an empty, in-memory conversation", () => {
    expect(initialPanelState()).toMatchObject({ open: false, messages: [], status: "idle", draft: "" });
  });
});
