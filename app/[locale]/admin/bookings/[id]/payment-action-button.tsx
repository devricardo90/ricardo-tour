'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { transitionBookingPaymentAction } from "@/app/actions/admin-payments";

type Target = "RECORDED" | "CONFIRMED" | "CANCELED" | "REFUNDED";

const COPY: Record<Target, { label: string; confirm: string }> = {
  RECORDED: { label: "Marcar recebido", confirm: "Marcar este pagamento como RECEBIDO? Ele ainda precisará ser confirmado." },
  CONFIRMED: { label: "Confirmar", confirm: "Confirmar este pagamento? Confira o valor no extrato, comprovante ou caixa antes." },
  CANCELED: { label: "Cancelar registro", confirm: "Cancelar este registro de pagamento? O histórico será mantido." },
  REFUNDED: { label: "Registrar estorno", confirm: "Registrar o ESTORNO deste pagamento? Use apenas se o valor foi devolvido ao cliente." },
};

const newKey = () => crypto.randomUUID().replace(/-/g, "");

/** RT-125: one status change of a payment line, explicit and idempotent (key kept until the server answers). */
export function PaymentActionButton({ paymentId, to, locale }: { paymentId: string; to: Target; locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [key, setKey] = useState(newKey);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm(COPY[to].confirm)) return;
    setError(null);
    startTransition(async () => {
      const result = await transitionBookingPaymentAction({ paymentId, to, idempotencyKey: key }, locale);
      if ("error" in result && result.error) {
        setError(result.error);
        if (result.code !== "BOOKING_BUSY") setKey(newKey());
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
          to === "CANCELED" || to === "REFUNDED" ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "hover:bg-muted"
        }`}
      >
        {isPending ? "..." : COPY[to].label}
      </button>
      {error && <span role="alert" className="max-w-[200px] text-[11px] text-destructive">{error}</span>}
    </span>
  );
}
