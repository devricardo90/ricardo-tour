"use client";

import { useCallback, useId, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export type GalleryImage = {
  src: string;
  alt: string;
  /** CSS object-position for cropped frames (thumbnails). */
  objectPosition?: string;
  /** Visible credit for the current photo (e.g. the artist of a mural), shown under the frame. */
  credit?: string | null;
};
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

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-focus,#E8C780)]";

/**
 * RT-116/RT-117: reusable, accessible image gallery in the Design System's dark surface (Home "Experiences" tokens).
 * - The main view NEVER crops or distorts: the photo is shown whole (object-contain) over a blurred copy of itself, so
 *   portrait and landscape photos both fill the frame without aggressive cuts or empty bars.
 * - Thumbnails crop with each image's focal point (TripImage.focalX/Y → objectPosition).
 * - min-w-0: inside grid/flex parents the thumbnail strip scrolls instead of widening the column (5+ photos on
 *   mobile overflowed the 390 px viewport, found in RT-116).
 * - 1 image renders a plain figure (no controls, no empty slots); 2+ add previous/next, a scrollable thumbnail strip
 *   (works for 3, 5, 8…) and Left/Right arrow keys; the position is announced politely.
 * Uses next/image directly: OptimizedImage starts blurred and only clears on onLoad, which is lost when an image
 * finishes loading before hydration (observed 17/10: photos stuck blurred/grey). No loading effect here.
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
    <section aria-labelledby={headingId} onKeyDown={onKeyDown} data-testid="image-gallery" data-count={total} className="min-w-0">
      <h2 id={headingId} className="sr-only">{labels.gallery}</h2>
      <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-[var(--site-charcoal-raised,#15191D)] ${aspectClassName}`}>
        {/* Blurred backdrop of the same photo (decorative) so the uncropped photo never leaves empty bars. */}
        <Image key={`bg-${current.src}`} src={current.src} alt="" aria-hidden="true" fill sizes="10vw" className="scale-110 object-cover opacity-45 blur-2xl" />
        <Image key={current.src} src={current.src} alt={current.alt} fill priority={priority && index === 0} sizes={sizes} className="object-contain" data-testid="gallery-main-image" />
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={labels.prev}
              className={`absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--site-gold,#C8A86B)]/50 bg-[var(--site-charcoal,#0B0E11)]/75 text-[var(--site-on-dark,#F4F0E8)] backdrop-blur transition-colors hover:border-[var(--site-gold,#C8A86B)] ${focusRing}`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={labels.next}
              className={`absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--site-gold,#C8A86B)]/50 bg-[var(--site-charcoal,#0B0E11)]/75 text-[var(--site-on-dark,#F4F0E8)] backdrop-blur transition-colors hover:border-[var(--site-gold,#C8A86B)] ${focusRing}`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p aria-live="polite" className="absolute bottom-3 right-3 rounded-full bg-[var(--site-charcoal,#0B0E11)]/80 px-3 py-1 text-[13px] font-medium text-[var(--site-on-dark,#F4F0E8)]">
              {fill(labels.position, index + 1, total)}
            </p>
          </>
        ) : null}
      </div>
      {current.credit ? (
        <p className="mt-2 text-[13px] text-[var(--site-on-dark-subtle,#9DA3A5)]" data-testid="gallery-credit">
          {current.credit}
        </p>
      ) : null}
      {total > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label={labels.gallery} data-testid="gallery-thumbs">
          {images.map((image, i) => (
            <li key={`${image.src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={fill(labels.thumb, i + 1, total)}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-16 w-24 overflow-hidden rounded-md border-2 ${i === index ? "border-[var(--site-gold,#C8A86B)]" : "border-transparent opacity-70 hover:opacity-100"} ${focusRing}`}
              >
                <Image src={image.src} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition: image.objectPosition ?? "50% 50%" }} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
