"use client";

import type { ComponentProps } from "react";
import { OPEN_CONCIERGE_EVENT } from "@/lib/ai-concierge/ui/open-event";

/** A navigation entry that opens the Daniela side panel (replaces the old Home section anchor). Keyboard-activatable native button. */
export function OpenConciergeButton({ children, onClick, ...props }: Omit<ComponentProps<"button">, "type">) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        window.dispatchEvent(new Event(OPEN_CONCIERGE_EVENT));
      }}
    >
      {children}
    </button>
  );
}
