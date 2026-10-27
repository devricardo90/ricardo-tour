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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_STYLE[status] ?? ""}`}>
      {STATUS[status] ?? status}
    </span>
  );
}

/** Situation of one installment, in words the team uses every day. */
function kindState(kind: KindSummary) {
  if (kind.confirmedCents >= kind.expectedCents && kind.expectedCents > 0) return { label: "Quitado", style: STATUS_STYLE.CONFIRMED };
  if (kind.recordedCents + kind.pendingCents > 0) return { label: "Aguardando confirmação", style: STATUS_STYLE.RECORDED };
  if (kind.confirmedCents > 0) return { label: "Parcial", style: STATUS_STYLE.PENDING };
  return { label: "Não recebido", style: STATUS_STYLE.CANCELED };
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold" : ""}>{value}</dd>
    </div>
  );
}

function KindCard({ title, kind, locale }: { title: string; kind: KindSummary; locale: string }) {
  const state = kindState(kind);
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${state.style}`}>{state.label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{formatBrl(kind.expectedCents, locale)}</p>
      <dl className="mt-3 space-y-1 text-xs">
        <Line label="Confirmado" value={formatBrl(kind.confirmedCents, locale)} strong />
        <Line label="Registrado (a confirmar)" value={formatBrl(kind.recordedCents, locale)} />
        <Line label="Pendente (não recebido)" value={formatBrl(kind.pendingCents, locale)} />
        {kind.refundedCents > 0 && <Line label="Estornado" value={formatBrl(kind.refundedCents, locale)} />}
        <Line label="Sem registro" value={formatBrl(Math.max(kind.openCents, 0), locale)} />
      </dl>
    </div>
  );
}

function StatCard({ title, value, note, tone }: { title: string; value: string; note?: string; tone?: "positive" | "attention" }) {
  const toneClass =
    tone === "positive" ? "text-green-700 dark:text-green-400" : tone === "attention" ? "text-orange-700 dark:text-orange-400" : "";
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
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
          Registro administrativo de valores recebidos por PIX, maquininha ou dinheiro. Nenhuma cobrança é feita pelo site,
          nenhum dado de cartão é guardado e nada é confirmado automaticamente.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!overview ? (
          <p className="text-sm text-muted-foreground">
            Disponível apenas para reservas privativas com cotação registrada.
          </p>
        ) : (
          <>
            {(() => {
              const { summary } = overview;
              const awaitingCents =
                summary.deposit.recordedCents + summary.deposit.pendingCents + summary.balance.recordedCents + summary.balance.pendingCents;
              const outstandingCents = Math.max(summary.totalCents - summary.confirmedCents, 0);
              return (
                <section aria-label="Resumo financeiro" className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                      title="Total contratado"
                      value={formatBrl(summary.totalCents, locale)}
                      note={`Tabela ${overview.quote.priceTableId} v${overview.quote.priceTableVersion}`}
                    />
                    <StatCard title="Total confirmado" value={formatBrl(summary.confirmedCents, locale)} tone="positive" />
                    <StatCard
                      title="Valor em aberto"
                      value={formatBrl(outstandingCents, locale)}
                      tone={outstandingCents > 0 ? "attention" : undefined}
                      note={
                        awaitingCents > 0
                          ? `Inclui ${formatBrl(awaitingCents, locale)} registrado ou pendente, ainda sem confirmação.`
                          : outstandingCents === 0
                            ? "Nada a receber."
                            : "Ainda não registrado."
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <KindCard title="Sinal 30% · na reserva" kind={summary.deposit} locale={locale} />
                    <KindCard title="Saldo 70% · no início do passeio" kind={summary.balance} locale={locale} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Política RT-121: sinal de 30% do total na reserva; saldo de 70% pago no início do passeio, no encontro com o
                    cliente. Confirmar um pagamento não confirma a reserva.
                  </p>
                </section>
              );
            })()}

            <section aria-label="Pagamentos registrados" className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagamentos registrados</h3>
              {overview.payments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Nenhum pagamento registrado ainda. Use o formulário abaixo quando o sinal for recebido.
                </p>
              ) : (
                <>
                  {/* Desktop: table */}
                  <table className="hidden w-full text-sm border-collapse md:table">
                    <thead>
                      <tr className="border-b text-left">
                        {["Parcela", "Meio", "Valor", "Situação", "Referência", "Registrado em", "Ações"].map((h) => (
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
                          <td className="py-2 px-3"><StatusBadge status={payment.status} /></td>
                          <td className="py-2 px-3 text-xs text-muted-foreground break-all">{payment.reference ?? "—"}</td>
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
                  {/* Mobile: one card per payment, no horizontal scroll */}
                  <ul className="space-y-3 md:hidden">
                    {overview.payments.map((payment) => (
                      <li key={payment.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {KIND[payment.kind] ?? payment.kind} · {formatBrl(payment.amountCents, locale)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {METHOD[payment.method] ?? payment.method} · {dateTime(payment.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={payment.status} />
                        </div>
                        {payment.reference && <p className="mt-2 text-xs text-muted-foreground break-all">Ref.: {payment.reference}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ACTIONS.filter((to) => canTransitionPayment(payment.status as PaymentStatus, to)).map((to) => (
                            <PaymentActionButton key={to} paymentId={payment.id} to={to} locale={locale} />
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {bookingStatus === "CANCELED" ? (
              <p className="text-xs text-muted-foreground">Reserva cancelada: novos pagamentos não podem ser registrados.</p>
            ) : (
              <section aria-label="Registrar pagamento" className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registrar pagamento</h3>
                <PaymentForm
                  bookingId={bookingId}
                  locale={locale}
                  installments={{
                    DEPOSIT: { expectedCents: overview.summary.deposit.expectedCents, openCents: Math.max(overview.summary.deposit.openCents, 0) },
                    BALANCE: { expectedCents: overview.summary.balance.expectedCents, openCents: Math.max(overview.summary.balance.openCents, 0) },
                  }}
                />
              </section>
            )}

            <section aria-label="Histórico financeiro">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico financeiro</h3>
              {overview.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma operação financeira registrada.</p>
              ) : (
                <ol className="space-y-1 text-xs">
                  {overview.events.map((event) => {
                    const kind = overview.payments.find((payment) => payment.id === event.paymentId)?.kind;
                    return (
                      <li key={event.id} className="text-muted-foreground">
                        {dateTime(event.createdAt)} · {kind ? `${KIND[kind] ?? kind} · ` : ""}
                        {event.fromStatus ? `${STATUS[event.fromStatus] ?? event.fromStatus} → ` : ""}
                        {STATUS[event.toStatus] ?? event.toStatus} · {formatBrl(event.amountCents, locale)} · admin{" "}
                        {event.actorName ?? event.actorUserId.slice(0, 8)}
                        {event.note ? ` · ${event.note}` : ""}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}
