'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmBookingByAdminAction } from "@/app/actions/admin";

interface ConfirmBookingButtonProps {
  bookingId: string;
  locale: string;
  /** RT-124 MVP policy: why the booking cannot be confirmed yet (e.g. the deposit is not verified). */
  blockedReason?: string | null;
}

/**
 * RT-022A: Botao de confirmacao de reserva pelo admin.
 * Exibido apenas para status PENDING.
 * Nao altera paymentStatus nem aciona pagamento.
 */
export function ConfirmBookingButton({ bookingId, locale, blockedReason = null }: ConfirmBookingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    const confirmed = window.confirm(
      "Confirmar esta reserva?\n\nO status da reserva sera atualizado para CONFIRMED. O status de pagamento nao sera alterado."
    );

    if (!confirmed) return;

    setError(null);

    startTransition(async () => {
      const result = await confirmBookingByAdminAction(bookingId, locale);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConfirm}
        disabled={isPending || !!blockedReason}
        title={blockedReason ?? undefined}
        className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Confirmando..." : "Confirmar Reserva"}
      </button>
      {blockedReason && !error && <p className="max-w-[240px] text-right text-xs text-muted-foreground">{blockedReason}</p>}
      {error && <p className="max-w-[220px] text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
