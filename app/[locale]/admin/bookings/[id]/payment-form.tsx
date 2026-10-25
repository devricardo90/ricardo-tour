'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordBookingPaymentAction } from "@/app/actions/admin-payments";
import { parseBrlToCents } from "@/lib/commerce/money";

const newKey = () => crypto.randomUUID().replace(/-/g, "");

/**
 * RT-125: registers one manual payment line. The idempotency key is created once per form and kept until the server
 * answers, so a double click or a retry after a network error cannot register the same payment twice.
 */
export function PaymentForm({ bookingId, locale }: { bookingId: string; locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [key, setKey] = useState(newKey);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amountCents = parseBrlToCents(String(form.get("amount") ?? ""));
    setError(null);
    setNotice(null);
    if (amountCents === null) {
      setError("Valor invalido. Use o formato 350,00.");
      return;
    }
    const formElement = event.currentTarget;
    startTransition(async () => {
      const result = await recordBookingPaymentAction(
        {
          bookingId,
          kind: form.get("kind"),
          method: form.get("method"),
          amountCents,
          initialStatus: form.get("initialStatus"),
          reference: String(form.get("reference") ?? ""),
          note: String(form.get("note") ?? ""),
          idempotencyKey: key,
        },
        locale,
      );
      if ("error" in result && result.error) {
        setError(result.error);
        if (result.code !== "BOOKING_BUSY") setKey(newKey()); // a refused request can be corrected and sent again
        return;
      }
      setNotice("Pagamento registrado. A confirmacao e uma acao separada.");
      setKey(newKey());
      formElement.reset();
      router.refresh();
    });
  }

  const field = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Registrar pagamento">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Parcela
        <select name="kind" className={field} defaultValue="DEPOSIT">
          <option value="DEPOSIT">Sinal</option>
          <option value="BALANCE">Saldo</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Meio
        <select name="method" className={field} defaultValue="PIX">
          <option value="PIX">PIX</option>
          <option value="CARD_TERMINAL">Maquininha</option>
          <option value="CASH">Dinheiro</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Valor (R$)
        <input name="amount" inputMode="decimal" required placeholder="350,00" className={field} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Situacao
        <select name="initialStatus" className={field} defaultValue="RECORDED">
          <option value="RECORDED">Recebido (aguardando confirmacao)</option>
          <option value="PENDING">Pendente (ainda nao recebido)</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Referencia (ID PIX, NSU ou recibo; nunca o numero do cartao)
        <input name="reference" maxLength={80} className={field} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Observacao
        <input name="note" maxLength={300} className={field} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Registrando..." : "Registrar pagamento"}
        </button>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {notice && <p role="status" className="text-xs text-muted-foreground">{notice}</p>}
      </div>
    </form>
  );
}
