import type { ComponentProps } from "react";
import { Link } from "@/i18n/routing";
import type { AnchorMode } from "@/components/site/site-chrome-copy";

type AnchorProps = Omit<ComponentProps<"a">, "href"> & { hash: string; mode: AnchorMode };

// Link to a Home section. On the Home (`page`) it is a plain in-page hash; from any other route (`home`) it is a
// locale-aware link to `/{locale}#hash`. Usable from server and client components.
export function SiteAnchor({ hash, mode, children, ...props }: AnchorProps) {
  if (mode === "page") {
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
