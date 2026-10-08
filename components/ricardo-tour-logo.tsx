import Image from "next/image";
import { cn } from "@/lib/utils";

const src = "/images/ricardo-tour-logo.png";

/** The icon crop uses the Owner's original artwork without modifying its pixels. */
export function RicardoTourLogo({ className, variant = "full", priority = false }: { className?: string; variant?: "full" | "icon"; priority?: boolean }) {
  if (variant === "icon") {
    return (
      <span className={cn("relative block h-12 w-11 shrink-0 overflow-hidden", className)} role="img" aria-label="Ricardo Tour">
        <Image src={src} alt="" width={2172} height={724} className="absolute left-0 top-0 h-12 w-auto max-w-none" priority={priority} />
      </span>
    );
  }

  return <Image src={src} alt="Ricardo Tour — Rio de Janeiro Experiences" width={2172} height={724} className={cn("block h-12 w-auto shrink-0", className)} priority={priority} />;
}
