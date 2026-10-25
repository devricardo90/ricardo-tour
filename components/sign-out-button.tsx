"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAndLeave } from "@/lib/sign-out";

/** "Sair" for any signed-in account (admin header, access-denied card). */
export function SignOutButton({ locale, label, errorLabel, className }: { locale: string; label: string; errorLabel: string; className?: string }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    setPending(true);
    setFailed(false);
    const ok = await signOutAndLeave(locale, `/${locale}/login`).catch(() => false);
    if (!ok) {
      setPending(false);
      setFailed(true);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={pending} aria-busy={pending} className={className}>
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      {failed && (
        <span role="alert" className="text-xs text-destructive">
          {errorLabel}
        </span>
      )}
    </span>
  );
}
