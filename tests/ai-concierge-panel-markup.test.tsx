import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConciergePanel, DANIELA_PORTRAIT } from "@/components/ai-concierge/panel/concierge-panel";
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
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-label="Abrir o Concierge da Ricardo Tour: Daniela, assistente de IA"/);
    expect(html).toMatch(/<aside[^>]*role="dialog"[^>]*aria-modal="false"[^>]*aria-hidden="true"/);
    expect(html).toContain("inert");
    expect(html).toContain('data-state="closed"');
  });

  it("the panel is labelled by its visible title", () => {
    const labelledby = html.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledby).toBeTruthy();
    expect(html).toContain(`id="${labelledby}"`);
    expect(html).toContain("Daniela</h2>");
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
    expect(html).toContain('<a href="https://www.ricardotour.com/pt/tours" target="_blank" rel="noopener noreferrer">ver todos</a>.');
    expect(html).not.toMatch(/<a[^>]*href="https:\/\/evil\.example/);
    expect(html).not.toMatch(/<a[^>]*href="https:\/\/ricardotour\.com\.evil\.com/);
    expect(html).toContain("https://evil.example/x");
  });
});

describe("tour links inside answers", () => {
  it("shows a readable label for a single-tour link and keeps the canonical href", () => {
    const html = decoded(render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Veja https://www.ricardotour.com/pt/tours/cmlhxkpy9000028zq27rhytew para saber mais.", "grounded")] }));
    expect(html).toContain('<a href="https://www.ricardotour.com/pt/tours/cmlhxkpy9000028zq27rhytew" target="_blank" rel="noopener noreferrer">ver passeio</a>');
  });
});

describe("final round: Daniela, a named AI assistant (transparency stays explicit)", () => {
  it("presents the Concierge as Daniela in the header, welcome, message labels and accessible names", () => {
    const open = render({ open: true });
    expect(open).toMatch(/<h2[^>]*>Daniela<\/h2>/);
    expect(open).toContain("Concierge · Ricardo Tour");
    expect(open).toMatch(/Eu sou a Daniela/);
    const talking = render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Olá!", "grounded")] });
    expect(talking).toContain("Daniela · IA");
    expect(talking).not.toMatch(/>Concierge<\/span><p>/); // no unnamed speaker label left in the conversation
  });

  it("keeps the AI nature explicit everywhere: tag, welcome sentence, full disclosure, compact strip, avatar label and IA badge", () => {
    const open = render({ open: true });
    expect(open).toContain("Assistente de IA"); // header tag
    expect(open).toMatch(/uma inteligência artificial, não uma pessoa da equipe/); // in Daniela's own first words
    expect(decoded(open)).toContain(CONCIERGE_PRIVACY.ai_disclosure); // full RT-70 disclosure
    expect(open).toMatch(/aria-label="[^"]*assistente de IA[^"]*\(ilustração\)"/); // the portrait is announced as an AI illustration
    expect(open).toMatch(/class="[^"]*avatarBadge[^"]*" aria-hidden="true">IA</); // visible IA badge on the large portrait
    expect(render({ open: true, messages: [user("m1", "oi")] })).toContain("Assistente de IA: pode errar e não confirma preços, reservas ou pagamentos.");
  });

  it("never implies a live human: no claim of being a team member, of typing live or of 'online agora'", () => {
    const html = render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Olá!", "grounded")] });
    expect(html).not.toMatch(/online agora|atendente|nossa equipe responde|digitando|estou aqui para te atender como/i);
    expect(html).not.toMatch(/sou (?:uma )?(?:pessoa|humana|atendente|consultora da equipe)/i);
  });

  it("draws Daniela as an illustrated portrait: blonde hair, green eyes, no photo, no mascot", () => {
    const html = render({ open: true });
    expect(html).toMatch(/data-portrait="daniela"/);
    expect(html).toContain(DANIELA_PORTRAIT.hair);
    expect(html).toContain(DANIELA_PORTRAIT.eyes);
    expect(html).not.toMatch(/<img[^>]*(?:daniela|avatar|portrait)/i); // an inline illustration, not a photograph
    const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const [r, g, b] = hex(DANIELA_PORTRAIT.hair);
    expect(r).toBeGreaterThan(b + 60); // warm blonde, not grey or brown
    expect(r).toBeGreaterThan(190);
    const [er, eg, eb] = hex(DANIELA_PORTRAIT.eyes);
    expect(eg).toBeGreaterThan(er + 40); // green iris
    expect(eg).toBeGreaterThan(eb + 20);
    expect(g).toBeGreaterThan(150);
  });
});

describe("second refinement round: welcome, avatars, recommendation cards, hierarchy, composer", () => {
  const recommendation = replyFor("recommendation");
  const withCards = (extra: Partial<PanelMessage> = {}) =>
    render({ open: true, messages: [user("m1", "Primeira viagem ao Rio"), { ...assistant("m2", recommendation.answer, "grounded"), tours: recommendation.tour_ids, ...extra } as PanelMessage] });

  it("opens with a warm welcome in the Concierge's voice that states it is an AI and invites discovery, not an agency pitch", () => {
    const html = render({ open: true });
    expect(html).toContain("Vamos descobrir o Rio?");
    expect(html).toMatch(/Eu sou a Daniela, a assistente de IA da Ricardo Tour: uma inteligência artificial, não uma pessoa da equipe/);
    expect(html).toMatch(/primeira vez no Rio/);
    expect(html).not.toMatch(/Posso explicar os passeios e serviços da Ricardo Tour|agência de turismo/);
    expect(html).toMatch(/data-ai-disclosure/); // the full RT-70 disclosure is still there
  });

  it("offers exactly the three requested quick-start prompts as discreet pill buttons", () => {
    const html = render({ open: true });
    const labels = [...html.matchAll(/<button[^>]*class="[^"]*starterButton[^"]*"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]);
    expect(labels).toEqual(["É minha primeira vez no Rio", "Quero conhecer o Cristo", "Quais passeios vocês recomendam?"]);
  });

  it("uses a Concierge avatar (labelled image) and a decorative neutral visitor avatar", () => {
    const html = render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Olá", "grounded")] });
    expect(render({ open: true })).toMatch(/role="img"[^>]*aria-label="Daniela, assistente de IA da Ricardo Tour \(ilustração\)"/); // welcome and header: named
    const log = html.slice(html.indexOf('role="log"'));
    expect(log).not.toMatch(/role="img"/); // inside the live log the visible "Daniela · IA" label names the speaker; the header portrait stays named
    expect(html).toMatch(/<span class="[^"]*avatarConcierge[^"]*" aria-hidden="true">/);
    expect(html).toMatch(/<span class="[^"]*avatarVisitor[^"]*" aria-hidden="true">/);
    expect(html).not.toMatch(/robot|bot-|🤖/i);
  });

  it("shows recommendation cards from the approved catalog: real photo, title, approved summary and a 'Ver passeio' CTA, with no price, duration or availability", () => {
    const html = decoded(withCards());
    expect((html.match(/class="[^"]*tourCard/g) ?? []).length).toBe(3);
    expect(html).toContain("Passeios sugeridos");
    expect(html).toContain("Cristo Redentor + Pão de Açúcar");
    expect(html).toContain("Visite os dois pontos turísticos mais famosos do Rio em um único passeio");
    expect(html).toMatch(/<a[^>]*href="\/pt\/tours\/cmlhxkpy9000028zq27rhytew"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*aria-label="Ver passeio: Cristo Redentor \+ Pão de Açúcar"/);
    expect(html).toMatch(/<img[^>]*alt="Visitante no mirante do Pão de Açúcar, com a Baía de Guanabara ao fundo"/);
    expect(html).not.toMatch(/R\$\s*\d|\d+\s*(?:horas?|h|min)|vagas? (?:disponíve|restantes)|desconto/i);
  });

  it("ignores unknown or duplicated tour ids and never renders more than three cards", () => {
    const html = withCards({ tours: ["unknown-id", "cmlhxkpy9000028zq27rhytew", "cmlhxkpy9000028zq27rhytew", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p", "cmli1a6im000034zqqzc9sppb"] } as Partial<PanelMessage>);
    expect((html.match(/class="[^"]*tourCard/g) ?? []).length).toBe(3);
    expect(html).not.toContain("unknown-id");
  });

  it("separates the four message registers: informational, recommendation, handoff and system notice", () => {
    const offer = buildHandoffOffer("H1", "explicit_request");
    const info = render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Resposta informativa", "grounded")] });
    expect(info).not.toMatch(/tourCard|class="[^"]*handoff"|messageSystem/);
    expect(withCards()).toMatch(/<section[^>]*aria-labelledby="m2-tours"[\s\S]*<h3 id="m2-tours"[^>]*>Passeios sugeridos<\/h3>/);
    const handoff = render({ open: true, messages: [user("m1", "oi"), assistant("m2", "Posso ajudar", "handoff", offer)] });
    expect(handoff).toMatch(/data-handoff-code="H1"/);
    const reply = replyFor("degraded");
    const system = render({ open: true, status: "degraded", messages: [user("m1", "oi"), assistant("m2", reply.answer, "degraded", reply.handoff)] });
    expect(system).toMatch(/class="[^"]*messageSystem[^"]*" data-kind="degraded"/);
    expect(system).toContain(">Aviso<");
    expect(system).not.toMatch(/Concierge da Ricardo Tour"/); // no Concierge avatar on system notices
  });

  it("compacts the header once the conversation starts, while the AI strip stays visible", () => {
    expect(render({ open: true })).toMatch(/<header[^>]*data-compact="false"/);
    const started = render({ open: true, messages: [user("m1", "oi")] });
    expect(started).toMatch(/<header[^>]*data-compact="true"/);
    expect(started).toContain("Assistente de IA: pode errar e não confirma preços, reservas ou pagamentos.");
  });

  it("has a short placeholder and a send button with a visible word plus an accessible name", () => {
    const html = render({ open: true });
    expect(html).toMatch(/<textarea[^>]*placeholder="Pergunte sobre o Rio…"/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*aria-label="Enviar mensagem"[^>]*>[\s\S]*Enviar/);
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
