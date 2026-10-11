import Image from "next/image";
import { cn } from "@/lib/utils";

const src = "/images/ricardo-tour-logo.png";
// Rendered size, not the artwork's 2172x724: CSS sets the height (h-12 … sm:h-16, i.e. at most 64 px) and the width
// follows the 3:1 ratio. Declaring the intrinsic size made next/image emit a single w=3840 candidate, preloaded on
// every page (RT-45). 255x85 (3:1) yields 1x/2x candidates of 256/640 px, enough for 3x screens at the largest
// rendered height (footer h-16 = 64 px -> 576 px); the on-screen size and crop are unchanged.
const WIDTH = 255;
const HEIGHT = 85;

/** The icon crop uses the Owner's original artwork without modifying its pixels. */
export function RicardoTourLogo({ className, variant = "full", priority = false }: { className?: string; variant?: "full" | "icon"; priority?: boolean }) {
  if (variant === "icon") {
    return (
      <span className={cn("relative block h-12 w-11 shrink-0 overflow-hidden", className)} role="img" aria-label="Ricardo Tour">
        <Image src={src} alt="" width={WIDTH} height={HEIGHT} className="absolute left-0 top-0 h-12 w-auto max-w-none" priority={priority} />
      </span>
    );
  }

  return <Image src={src} alt="Ricardo Tour — Rio de Janeiro Experiences" width={WIDTH} height={HEIGHT} className={cn("block h-12 w-auto shrink-0", className)} priority={priority} />;
}
