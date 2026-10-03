// Shared class strings for the Flight Planner prototype. Uses only the public-site tokens (--site-*).
export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-gold-deep)]";

export const labelClass = "block text-[13px] font-medium text-[var(--site-ink)]";

export const fieldClass = `min-h-12 w-full rounded-lg border bg-white px-3.5 text-[15px] text-[var(--site-ink)] placeholder:text-[var(--site-ink-muted)] ${focusRing}`;

export const fieldBorder = (invalid: boolean) => (invalid ? "border-[#B3261E]" : "border-[var(--fp-field-border)]");

export const errorText = "mt-1 text-[13px] leading-[1.4] text-[#B3261E]";

export const primaryButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--site-ink)] px-6 text-[15px] font-medium text-[var(--site-cream-soft)] transition-colors hover:bg-[var(--site-charcoal-raised)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const secondaryButton = `inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[var(--site-ink)] px-5 text-[15px] font-medium text-[var(--site-ink)] transition-colors hover:bg-[var(--fp-soft)] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const linkButton = `inline-flex min-h-11 items-center gap-2 rounded text-[14px] font-medium text-[var(--site-ink)] underline decoration-[var(--site-gold-deep)] underline-offset-[6px] transition-colors hover:text-[var(--site-gold-deep)] ${focusRing}`;

export const alertBox = "rounded-md border border-[#B3261E] bg-[#FBEAE8] p-4 text-[14px] leading-[1.55] text-[var(--site-ink)]";

export const noticeBox = "rounded-md border border-[var(--fp-notice-border)] bg-[var(--fp-soft)] p-4 text-[14px] leading-[1.55] text-[var(--site-ink)]";
