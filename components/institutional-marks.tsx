"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Frames show each mark from the unmodified composite (same framing as the approved RT-12/13 preview).
// The file is requested only when the strip nears the viewport: native lazy loading alone still
// fetched it at initial load because the section sits within the browser's lazy-load distance.
// Cadastur is uniformly enlarged for legibility.
const MARKS_SRC = "/logos/logo-turismo.webp";
const marks = [
  { name: "Cadastur", box: [0, 30, 255, 62], boost: 1.3 },
  { name: "ABAV", box: [325, 8, 168, 107], boost: 1 },
  { name: "TripAdvisor", box: [565, 11, 145, 100], boost: 1 },
  { name: "Visit Rio", box: [779, 10, 297, 101], boost: 1 },
  { name: "Visit Brasil", box: [1149, 0, 175, 122], boost: 1 },
] as const;

export function InstitutionalMarks({ labelledBy }: { labelledBy: string }) {
  const list = useRef<HTMLUListElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = list.current;
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
    <ul
      ref={list}
      aria-labelledby={labelledBy}
      className="flex flex-wrap items-center gap-x-8 gap-y-5 [--mark-scale:0.4] md:gap-x-10 md:[--mark-scale:0.44]"
    >
      {marks.map(({ name, box: [x, y, w, h], boost }) => {
        const px = (n: number) => `calc(${n * boost}px * var(--mark-scale))`;
        return (
          <li key={name}>
            <span
              role="img"
              aria-label={name}
              className="relative block overflow-hidden"
              style={{ width: px(w), height: px(h) }}
              data-mark-frame={`${x} ${y} ${w} ${h}`}
            >
              {near ? (
                <Image
                  src={MARKS_SRC}
                  alt=""
                  width={1324}
                  height={122}
                  unoptimized
                  className="absolute max-w-none"
                  style={{ width: px(1324), height: px(122), left: px(-x), top: px(-y) }}
                />
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
