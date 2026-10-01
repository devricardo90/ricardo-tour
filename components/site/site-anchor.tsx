"use client";

import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/routing";
import type { AnchorMode } from "@/components/site/site-chrome-copy";

type AnchorProps = Omit<ComponentProps<"a">, "href"> & { hash: string; mode: AnchorMode };

// Link to a Home section. Since RT-57 the (site) layout renders one header/footer for every public route, so the
// component decides at render time: on the Home itself (`usePathname()` is "/") it is a plain in-page hash, which keeps
// the browser's native fragment scrolling next to the pinned Hero; from any other route it is a locale-aware link to
// `/{locale}#hash`. `mode="page"` forces the in-page form (kept for callers that always live on the Home).
export function SiteAnchor({ hash, mode, children, ...props }: AnchorProps) {
  const pathname = usePathname();
  if (mode === "page" || pathname === "/") {
    return (
      <a href={`#${hash}`} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={`/#${hash}`} {...props}>
      {children}
    </Link>
  );
}

type HomeLinkProps = Omit<ComponentProps<"a">, "href"> & { mode: AnchorMode; homeHref?: string };

// Logo/home link: the top of the Home when already there, otherwise `/{locale}`.
export function SiteHomeLink({ mode, homeHref = "#top-of-home", children, ...props }: HomeLinkProps) {
  const pathname = usePathname();
  if (mode === "page" || pathname === "/") {
    return (
      <a href={homeHref} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href="/" {...props}>
      {children}
    </Link>
  );
}
