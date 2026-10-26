import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookingPaymentsAction } from "@/app/actions/admin-payments";
import { formatBrl } from "@/lib/commerce/money";
import { canTransitionPayment, type KindSummary, type PaymentStatus } from "@/lib/payments/payment-state";
import { PaymentForm } from "./payment-form";
import { PaymentActionButton } from "./payment-action-button";

const KIND: Record<string, string> = { DEPOSIT: "Sinal", BALANCE: "Saldo" };
const METHOD: Record<string, string> = { PIX: "PIX", CARD_TERMINAL: "Maquininha", CASH: "Dinheiro" };
const STATUS: Record<string, string> = {
  PENDING: "Pendente",
  RECORDED: "Registrado",
  CONFIRMED: "Confirmado",
  CANCELED: "Cancelado",
  REFUNDED: "Estornado",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RECORDED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  REFUNDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
const ACTIONS: Array<"RECORDED" | "CONFIRMED" | "CANCELED" | "REFUNDED"> = ["RECORDED", "CONFIRMED", "CANCELED", "REFUNDED"];

function KindRow({ label, kind, locale }: { label: string; kind: KindSummary; locale: string }) {
  return (
    <tr className="border-b">
      <td className="py-2 px-3 text-xs font-medium">{label}</td>
      <td className="py-2 px-3 text-xs">{formatBrl(kind.expectedCents, locale)}</td>
      <td className="py-2 px-3 text-xs">{formatBrl(kind.pendingCents, locale)}</td>
      <td className="py-2 px-3 text-xs">{formatBrl(kind.recordedCents, locale)}</td>
      <td className="py-2 px-3 text-xs font-medium">{formatBrl(kind.confirmedCents, locale)}</td>
      <td className="py-2 px-3 text-xs">{formatBrl(kind.refundedCents, locale)}</td>
      <td className="py-2 px-3 text-xs font-semibold">{formatBrl(kind.openCents, locale)}</td>
    </tr>
  );
}

/** RT-125: manual payment control of a private booking (registration, confirmation, history). Admin only. */
export async function PaymentsPanel({ bookingId, bookingStatus, locale }: { bookingId: string; bookingStatus: string; locale: string }) {
  const overview = await getBookingPaymentsAction(bookingId);
  const dateTime = (value: Date) =>
    new Date(value).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pagamentos (controle manual)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Registro administrativo de valores recebidos por PIX, maquininha ou dinheiro. Nenhuma cobranca e feita pelo site,
          nenhum dado de cartao e guardado e nada e confirmado automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!overview ? (
          <p className="text-sm text-muted-foreground">
            Disponivel apenas para reservas privativas com cotacao registrada.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    {["Parcela", "Previsto", "Pendente", "Registrado", "Confirmado", "Estornado", "Em aberto"].map((h) => (
                      <th key={h} className="py-2 px-3 font-semibold text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <KindRow label="Sinal" kind={overview.summary.deposit} locale={locale} />
                  <KindRow label="Saldo" kind={overview.summary.balance} locale={locale} />
                </tbody>
              </table>
              <p className="mt-2 text-xs text-muted-foreground">
                Total contratado {formatBrl(overview.summary.totalCents, locale)} · confirmado{" "}
                {formatBrl(overview.summary.confirmedCents, locale)} · cotacao {overview.quote.priceTableId} v{overview.quote.priceTableVersion}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Politica RT-121: sinal de 30% do total na reserva; saldo de 70% pago no inicio do passeio, no encontro com o
                cliente. Confirmar um pagamento nao confirma a reserva.
              </p>
            </div>

            <div className="overflow-x-auto">
              {overview.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left">
                      {["Parcela", "Meio", "Valor", "Situacao", "Referencia", "Registrado em", "Acoes"].map((h) => (
                        <th key={h} className="py-2 px-3 font-semibold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {overview.payments.map((payment) => (
                      <tr key={payment.id} className="border-b align-top">
                        <td className="py-2 px-3 text-xs">{KIND[payment.kind] ?? payment.kind}</td>
                        <td className="py-2 px-3 text-xs">{METHOD[payment.method] ?? payment.method}</td>
                        <td className="py-2 px-3 text-xs font-medium">{formatBrl(payment.amountCents, locale)}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLE[payment.status] ?? ""}`}>
                            {STATUS[payment.status] ?? payment.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{payment.reference ?? "—"}</td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{dateTime(payment.createdAt)}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-2">
                            {ACTIONS.filter((to) => canTransitionPayment(payment.status as PaymentStatus, to)).map((to) => (
                              <PaymentActionButton key={to} paymentId={payment.id} to={to} locale={locale} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {bookingStatus === "CANCELED" ? (
              <p className="text-xs text-muted-foreground">Reserva cancelada: novos pagamentos nao podem ser registrados.</p>
            ) : (
              <PaymentForm bookingId={bookingId} locale={locale} />
            )}

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historico financeiro</h3>
              {overview.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem operacoes.</p>
              ) : (
                <ol className="space-y-1 text-xs">
                  {overview.events.map((event) => (
                    <li key={event.id} className="text-muted-foreground">
                      {dateTime(event.createdAt)} · {event.fromStatus ? `${STATUS[event.fromStatus] ?? event.fromStatus} → ` : ""}
                      {STATUS[event.toStatus] ?? event.toStatus} · {formatBrl(event.amountCents, locale)} · admin {event.actorUserId.slice(0, 8)}
                      {event.note ? ` · ${event.note}` : ""}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
