"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// The portrait is requested only when its frame nears the viewport. Native loading="lazy" alone still
// fetched it at initial load: before the Hero runway expands, this section sits inside the browser's
// lazy-load distance (same problem and fix as components/institutional-marks.tsx, RT-31).
// The frame keeps its aspect ratio and accessible name before and after the image loads.
export function AboutPortrait({ src, alt }: { src: string; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
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
  }, []);

  return (
    <div
      ref={frame}
      role={near ? undefined : "img"}
      aria-label={near ? undefined : alt}
      className="group relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#E6DFD2]"
    >
      {near ? (
        <Image
          src={src}
          alt={alt}
          fill
          loading="lazy"
          sizes="(min-width: 1280px) 500px, (min-width: 768px) 40vw, 420px"
          className="object-cover object-[50%_20%] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}
