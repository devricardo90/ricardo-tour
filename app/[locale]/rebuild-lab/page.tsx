import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rebuild Lab — Rick Travel",
    description: "Isolated rebuild lab surface. Internal prototype route, excluded from indexing.",
    robots: {
        index: false,
        follow: false,
    },
};

const isolationBoundaries = [
    {
        surface: "Public Home",
        state: "Untouched",
        detail: "app/[locale]/(public)/page.tsx is not read, imported, or modified by this route.",
    },
    {
        surface: "Public layout",
        state: "Not inherited",
        detail: "This segment is outside the (public) route group, so PublicLayout does not wrap it.",
    },
    {
        surface: "Header",
        state: "Not mounted",
        detail: "HeroHeader stays layout-level on the public routes only.",
    },
    {
        surface: "Footer / Cadastur",
        state: "Not mounted",
        detail: "FooterSection remains imported by the production Home alone; the Cadastur mark is not duplicated here.",
    },
    {
        surface: "AI Concierge",
        state: "Not mounted",
        detail: "AIConciergeWidget stays mounted by PublicLayout; its rebuild mount is decided by RT-RB-S4-04.",
    },
    {
        surface: "Indexing",
        state: "noindex, nofollow",
        detail: "Set by route metadata. app/robots.ts and app/sitemap.ts are unchanged.",
    },
    {
        surface: "Data",
        state: "None",
        detail: "This shell reads no database, no API, and no product content.",
    },
];

export default function RebuildLabPage() {
    return (
        <div className="space-y-10">
            <header className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    RT-8 · RT-RB-S0-04 · Sprint 0 — Foundation &amp; Audit
                </p>
                <h1 className="text-3xl font-bold tracking-tight">Rebuild Lab</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    Isolated route and environment for the Rick Travel visual rebuild. Prototype work
                    lands here first, so the public Home keeps its current behaviour until an explicit
                    cutover task replaces it. This page is an internal shell: it carries no product
                    copy, no assets, and no visual direction yet.
                </p>
            </header>

            <section aria-labelledby="isolation-contract" className="space-y-4">
                <h2 id="isolation-contract" className="text-lg font-semibold tracking-tight">
                    Isolation contract
                </h2>
                <ul className="divide-y divide-border rounded-lg border border-border">
                    {isolationBoundaries.map((boundary) => (
                        <li key={boundary.surface} className="px-4 py-3">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span className="text-sm font-medium">{boundary.surface}</span>
                                <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {boundary.state}
                                </span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {boundary.detail}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="lab-stage" className="space-y-4">
                <h2 id="lab-stage" className="text-lg font-semibold tracking-tight">
                    Prototype stage
                </h2>
                <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 p-8">
                    <p className="max-w-md text-center text-sm leading-6 text-muted-foreground">
                        Empty by design. Design tokens, typography, the cinematic hero and the rebuilt
                        Home sections are delivered by later Sprint 1–4 tasks and mount inside this
                        stage.
                    </p>
                </div>
            </section>

            <div className="border-t border-border pt-6">
                <p className="text-xs leading-5 text-muted-foreground">
                    Availability is controlled by <code className="font-mono">REBUILD_LAB_ENABLED</code>.
                    With no value set the lab is available in local development only; preview and
                    production deployments return 404 until the flag is set explicitly. See
                    {" "}
                    <code className="font-mono">docs/architecture/rebuild-lab-route.md</code>.
                </p>
            </div>
        </div>
    );
}
