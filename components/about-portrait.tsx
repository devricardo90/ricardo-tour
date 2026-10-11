"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// The portrait is requested only when its frame nears the viewport. Native loading="lazy" alone still
// fetched it at initial load: before the Hero runway expands, this section sits inside the browser's
// lazy-load distance (same problem and fix as components/institutional-marks.tsx, RT-31).
// The frame is a landscape editorial crop (16:10 on mobile, 3:2 from tablet up) (object-position keeps the subject); a replacement photo only
// needs a new src. The frame keeps its aspect ratio and accessible name before and after the image loads.
// `eager` (RT-45): on /quem-somos the portrait is above the fold and is the page's LCP element, so it is server-rendered
// with high priority instead of waiting for hydration + the observer (Lighthouse: not discoverable, ~2.7 s load delay).
// The Home keeps the deferred behaviour described above.
export function AboutPortrait({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const el = frame.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={frame}
      role={near ? undefined : "img"}
      aria-label={near ? undefined : alt}
      className="group relative aspect-[16/10] overflow-hidden md:aspect-[3/2] rounded-[2px] bg-[#E6DFD2]"
    >
      {near ? (
        <Image
          src={src}
          alt={alt}
          fill
          {...(eager ? { preload: true, fetchPriority: "high" as const } : { loading: "lazy" as const })}
          sizes="(min-width: 1280px) 500px, (min-width: 768px) 42vw, 100vw"
          className="object-cover object-[50%_40%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}
