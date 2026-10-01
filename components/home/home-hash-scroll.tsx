"use client";

import { useEffect } from "react";

// Cross-route anchor landing (RT-57). When a section link on /tours, /tours/[id], /contato or /quem-somos is followed
// (`/{locale}#experiences`), the Next router calls scrollIntoView before the Hero has created its pinned ScrollTrigger
// stage, and the Hero's first refresh then resets the scroll to 0, so the visitor lands at the top instead of the section.
// A direct page load (full navigation to /{locale}#hash) already lands correctly through the browser's fragment scroll.
// This island only acts when, once the Hero is ready, the requested section is not where it should be: it scrolls
// there once, instantly, honoring the section's `scroll-mt` (sticky header) and stops if the visitor scrolls first.
export function HomeHashScroll() {
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("touchmove", cancel, opts);
    window.addEventListener("keydown", cancel, { once: true });

    const place = () => {
      const target = document.getElementById(hash);
      const header = document.querySelector("header[role='banner']");
      if (!target || !header) return false;
      const wanted = header.getBoundingClientRect().bottom;
      const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
      const top = target.getBoundingClientRect().top;
      if ((top >= wanted - 4 && top <= wanted + 8) || (atBottom && top >= wanted - 4)) return true;
      target.scrollIntoView({ behavior: "instant", block: "start" });
      return false;
    };

    // Wait for the Hero to initialize (data-mode), then verify a few times while layout and pins settle.
    let attempts = 0;
    const tick = () => {
      if (cancelled) return;
      const ready = document.querySelector("[data-testid='globe-journey'][data-mode]");
      if (ready) {
        const done = place();
        attempts += 1;
        if (done && attempts >= 3) return;
        if (attempts >= 12) return;
      }
      timer = window.setTimeout(tick, ready ? 150 : 100);
    };
    let timer = window.setTimeout(tick, 100);
    const giveUp = window.setTimeout(cancel, 8000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(giveUp);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, []);
  return null;
}
