import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";

export const metadata: Metadata = {
    title: "Rebuild Lab — Rick Travel",
    robots: {
        index: false,
        follow: false,
    },
};

/**
 * RT-RB-S0-04 (RT-8) — isolated rebuild lab shell.
 *
 * This segment deliberately sits OUTSIDE the `(public)` route group, so it does
 * not inherit `PublicLayout` and therefore mounts none of `HeroHeader`, the
 * layout-level skip link, or `AIConciergeWidget`. It also does not mount
 * `FooterSection`, which the current production Home imports itself.
 *
 * That omission is a recorded decision, not an oversight: it keeps every future
 * rebuild experiment from leaking into the live public routes. The mount level
 * of header, footer and AI Concierge inside the rebuilt Home is decided later,
 * by RT-RB-S4-02 / RT-RB-S4-04 / RT-RB-S4-06.
 *
 * See docs/architecture/rebuild-lab-route.md.
 */
export default function RebuildLabLayout({
    children,
}: {
    children: ReactNode;
}) {
    if (!isRebuildLabEnabled()) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="border-b border-dashed border-muted-foreground/40 bg-muted/40 px-6 py-3">
                <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="rounded border border-muted-foreground/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Rebuild Lab
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                        RT-RB-S0-04
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Isolated prototype surface. Not the public Home, not production.
                    </span>
                </div>
            </div>
            <main id="rebuild-lab-content" className="w-full">
                {children}
            </main>
        </div>
    );
}
