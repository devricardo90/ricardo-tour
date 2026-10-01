"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { SiteAnchor } from "@/components/site/site-anchor";
import type { AnchorMode } from "@/components/site/site-chrome-copy";

// Small client islands for the public header: a non-modal disclosure for small screens (no focus trap, no
// scroll lock, no role="menu"; Escape closes and returns focus to the button) and the PT/EN/ES links.

const LOCALES = ["pt", "en", "es"] as const;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--site-focus,#E8C780)]";

export function SiteLanguageNav({ locale, label, className = "", itemClassName = "min-h-8 min-w-8" }: { locale: string; label: string; className?: string; itemClassName?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={`flex items-center gap-1 text-[13px] font-medium ${className}`}>
      {LOCALES.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          hrefLang={code}
          aria-current={code === locale ? "true" : undefined}
          className={`inline-flex ${itemClassName} items-center justify-center rounded px-1.5 transition-colors hover:text-[var(--site-on-dark,#F4F0E8)] ${focusRing} focus-visible:outline-offset-2 ${
            code === locale ? "text-[var(--site-gold-bright,#E8C780)]" : "text-[var(--site-on-dark-subtle,#9DA3A5)]"
          }`}
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

type Item = { label: string; hash: string };

export function SiteMobileMenu({
  items,
  anchorMode,
  navLabel,
  openLabel,
  closeLabel,
  locale,
  languageLabel,
}: {
  items: readonly Item[];
  anchorMode: AnchorMode;
  navLabel: string;
  openLabel: string;
  closeLabel: string;
  locale: string;
  languageLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    mq.addEventListener("change", onMq);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="site-mobile-navigation"
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-11 w-11 place-items-center rounded-lg text-[var(--site-on-dark,#F4F0E8)] transition-colors hover:bg-white/5 ${focusRing} focus-visible:outline-offset-2`}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      <div
        ref={panel}
        id="site-mobile-navigation"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-[var(--site-gold,#C8A86B)]/25 bg-[var(--site-charcoal,#0B0E11)] px-5 pb-4 pt-1 shadow-[0_18px_40px_rgba(0,0,0,0.45)] md:px-10"
      >
        <nav aria-label={navLabel}>
          <ul>
            {items.map((item) => (
              <li key={item.hash} className="border-b border-white/8 last:border-b-0">
                <SiteAnchor
                  hash={item.hash}
                  mode={anchorMode}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-12 items-center text-[16px] text-[var(--site-on-dark,#F4F0E8)] ${focusRing} focus-visible:outline-offset-[-2px]`}
                >
                  {item.label}
                </SiteAnchor>
              </li>
            ))}
          </ul>
        </nav>
        <SiteLanguageNav locale={locale} label={languageLabel} className="mt-2 gap-2 border-t border-white/8 pt-3" itemClassName="min-h-11 min-w-11" />
      </div>
    </div>
  );
}
