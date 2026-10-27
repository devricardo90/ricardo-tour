'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordBookingPaymentAction } from "@/app/actions/admin-payments";
import { formatBrl, parseBrlToCents } from "@/lib/commerce/money";

const newKey = () => crypto.randomUUID().replace(/-/g, "");

type Kind = "DEPOSIT" | "BALANCE";
type Installment = { expectedCents: number; openCents: number };
const KIND_LABEL: Record<Kind, string> = { DEPOSIT: "sinal", BALANCE: "saldo" };

/**
 * RT-125: registers one manual payment line. The idempotency key is created once per form and kept until the server
 * answers, so a double click or a retry after a network error cannot register the same payment twice.
 */
export function PaymentForm({
  bookingId,
  locale,
  installments,
}: {
  bookingId: string;
  locale: string;
  installments: Record<Kind, Installment>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [key, setKey] = useState(newKey);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>(installments.DEPOSIT.openCents > 0 ? "DEPOSIT" : "BALANCE");
  const [amount, setAmount] = useState("");
  const selected = installments[kind];
  const typedCents = amount.trim() ? parseBrlToCents(amount) : null;
  const overLimit = typedCents !== null && typedCents > selected.openCents;
  const toInput = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amountCents = parseBrlToCents(String(form.get("amount") ?? ""));
    setError(null);
    setNotice(null);
    if (amountCents === null) {
      setError("Valor inválido. Digite apenas números, com vírgula para os centavos (exemplo: 270,00).");
      return;
    }
    if (amountCents > selected.openCents) {
      setError(
        `O valor informado (${formatBrl(amountCents, locale)}) é maior que o ${KIND_LABEL[kind]} ainda sem registro (${formatBrl(selected.openCents, locale)}). Pagamentos parciais são permitidos até esse limite.`,
      );
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
        setError(
          result.code === "AMOUNT_EXCEEDS_EXPECTED"
            ? `O valor é maior que o ${KIND_LABEL[kind]} ainda sem registro. Atualize a página e confira o resumo financeiro.`
            : result.error,
        );
        if (result.code !== "BOOKING_BUSY") setKey(newKey()); // a refused request can be corrected and sent again
        return;
      }
      setNotice("Pagamento registrado. A confirmação é uma ação separada, no item do pagamento.");
      setKey(newKey());
      formElement.reset();
      setAmount("");
      router.refresh();
    });
  }

  const field = "h-9 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Registrar pagamento">
      <label className="grid gap-1 text-xs text-muted-foreground">
        Parcela
        <select name="kind" className={field} value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
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
        Valor recebido (R$)
        <input
          name="amount"
          inputMode="decimal"
          required
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={overLimit || undefined}
          aria-describedby="payment-amount-help"
          className={`${field} ${overLimit ? "border-destructive" : ""}`}
          autoComplete="off"
        />
      </label>
      <div id="payment-amount-help" className="grid content-end gap-1 text-xs sm:col-span-2 lg:col-span-1">
        <p className="text-muted-foreground">
          Previsto para o {KIND_LABEL[kind]}: <strong className="text-foreground">{formatBrl(selected.expectedCents, locale)}</strong>
          {" · "}sem registro: <strong className="text-foreground">{formatBrl(selected.openCents, locale)}</strong>
        </p>
        {selected.openCents > 0 ? (
          <button
            type="button"
            onClick={() => setAmount(toInput(selected.openCents))}
            className="w-fit rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-muted"
          >
            Usar valor sem registro ({formatBrl(selected.openCents, locale)})
          </button>
        ) : (
          <p className="text-muted-foreground">Este {KIND_LABEL[kind]} já está todo registrado.</p>
        )}
        {overLimit && (
          <p className="text-destructive">Acima do {KIND_LABEL[kind]} sem registro. Pagamentos parciais são permitidos até esse limite.</p>
        )}
      </div>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Situação
        <select name="initialStatus" className={field} defaultValue="RECORDED">
          <option value="RECORDED">Recebido (aguardando confirmação)</option>
          <option value="PENDING">Pendente (ainda não recebido)</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Referência (ID PIX, NSU ou recibo; nunca o número do cartão)
        <input name="reference" maxLength={80} className={field} autoComplete="off" />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        Observação
        <input name="note" maxLength={300} className={field} autoComplete="off" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={isPending || overLimit || selected.openCents === 0}
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
