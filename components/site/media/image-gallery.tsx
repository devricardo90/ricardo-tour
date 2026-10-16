"use client";

import { useCallback, useId, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

export type GalleryImage = { src: string; alt: string };
export type GalleryLabels = {
  gallery: string;
  prev: string;
  next: string;
  /** Plain strings (serializable across the server/client boundary) with {n} and {total} placeholders. */
  thumb: string;
  position: string;
};

function fill(template: string, n: number, total: number) {
  return template.replace("{n}", String(n)).replace("{total}", String(total));
}

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";

/**
 * RT-116/RT-117: reusable, accessible image gallery. One image renders as a plain figure (no controls); several images
 * get previous/next buttons, a thumbnail strip and Left/Right arrow keys. The current position is announced politely.
 * The caller decides which images are allowed (rights gate in lib/catalog/tour-content.ts); this component only shows.
 */
export function ImageGallery({
  images,
  labels,
  sizes = "(max-width: 1023px) 92vw, 56vw",
  aspectClassName = "aspect-[4/3] md:aspect-[16/10]",
  priority = false,
}: {
  images: GalleryImage[];
  labels: GalleryLabels;
  sizes?: string;
  aspectClassName?: string;
  priority?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const headingId = useId();
  const total = images.length;
  const go = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  if (total === 0) return null;
  const current = images[Math.min(index, total - 1)];

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (total < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
  };

  return (
    <section aria-labelledby={headingId} onKeyDown={onKeyDown} data-testid="image-gallery">
      <h2 id={headingId} className="sr-only">{labels.gallery}</h2>
      <div className={`relative overflow-hidden rounded-xl bg-[var(--site-cream-soft)] ${aspectClassName}`}>
        <OptimizedImage key={current.src} src={current.src} alt={current.alt} fill priority={priority && index === 0} sizes={sizes} className="object-cover" />
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={labels.prev}
              className={`absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--site-cream)]/90 text-[var(--site-ink)] shadow ${focusRing}`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={labels.next}
              className={`absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--site-cream)]/90 text-[var(--site-ink)] shadow ${focusRing}`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p aria-live="polite" className="absolute bottom-3 right-3 rounded-full bg-[var(--site-charcoal,#0B0E11)]/75 px-3 py-1 text-[12px] font-medium text-[var(--site-on-dark,#F4F0E8)]">
              {fill(labels.position, index + 1, total)}
            </p>
          </>
        ) : null}
      </div>
      {total > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={labels.gallery}>
          {images.map((image, i) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={fill(labels.thumb, i + 1, total)}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-16 w-24 overflow-hidden rounded-md border-2 ${i === index ? "border-[var(--site-gold-deep)]" : "border-transparent opacity-80 hover:opacity-100"} ${focusRing}`}
              >
                <OptimizedImage src={image.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
