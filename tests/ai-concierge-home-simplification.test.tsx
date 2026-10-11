import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenConciergeButton } from "@/components/ai-concierge/open-concierge-button";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { OPEN_CONCIERGE_EVENT } from "@/lib/ai-concierge/ui/open-event";

// Owner decision 2026-10-11: no dedicated AI Concierge section on the Home; the "AI Concierge" menu entry opens the Daniela panel.
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
}));

afterEach(() => vi.unstubAllEnvs());

describe("Home has no AI Concierge section", () => {
  it("the Home page composes no concierge section and the section components are gone", () => {
    const page = read("app/[locale]/(site)/page.tsx");
    expect(page).not.toMatch(/AIConciergeSection|ai-concierge-section/);
    expect(() => read("components/ai-concierge-section.tsx")).toThrow();
    expect(() => read("components/ai-concierge-shell.tsx")).toThrow();
    expect(read("components/site/site-chrome-copy.ts")).not.toContain('"ai-concierge"');
  });
});

describe("menu entry opens the panel", () => {
  it("is a native button (keyboard activatable), not an anchor to a removed section", () => {
    const html = renderToStaticMarkup(<OpenConciergeButton className="x">AI Concierge</OpenConciergeButton>);
    expect(html).toMatch(/^<button[^>]*type="button"/);
    expect(html).not.toContain("href");
  });

  it("dispatches the open event the panel listens to", () => {
    const events: string[] = [];
    const dispatch = vi.fn((event: Event) => { events.push(event.type); return true; });
    vi.stubGlobal("window", { dispatchEvent: dispatch });
    const element = OpenConciergeButton({ children: "AI Concierge" }) as { props: { onClick: (event: unknown) => void } };
    element.props.onClick({});
    expect(events).toEqual([OPEN_CONCIERGE_EVENT]);
    vi.unstubAllGlobals();
  });

  it("the panel subscribes to that event", () => {
    const panel = read("components/ai-concierge/panel/concierge-panel.tsx");
    expect(panel).toContain("addEventListener(OPEN_CONCIERGE_EVENT");
    expect(panel).toContain("removeEventListener(OPEN_CONCIERGE_EVENT");
  });

  it("header and footer show the entry only while Daniela is enabled (no dead link when it is off)", () => {
    const off = renderToStaticMarkup(<SiteHeader locale="pt" />) + renderToStaticMarkup(<SiteFooter locale="pt" />);
    expect(off).not.toContain("AI Concierge");
    vi.stubEnv("AI_CONCIERGE_ENABLED", "true");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-0000000000000000");
    vi.stubEnv("OPENAI_CONCIERGE_MODEL", "test-model");
    vi.stubEnv("OPENAI_CONCIERGE_VECTOR_STORE_ID", "vs_test0000000000");
    const on = renderToStaticMarkup(<SiteHeader locale="pt" />);
    expect(on).toMatch(/<button[^>]*aria-haspopup="dialog"[^>]*>AI Concierge<\/button>/);
    expect(on).not.toContain("#ai-concierge");
  });
});
