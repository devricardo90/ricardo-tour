import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookingByIdAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocalizedField } from "@/lib/localized-field";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { CancelBookingButton } from "./cancel-booking-button";
import { ConfirmBookingButton } from "./confirm-booking-button";
import { PaymentsPanel } from "./payments-panel";
import { DepositInstructions } from "./deposit-instructions";
import { getBookingPaymentsAction } from "@/app/actions/admin-payments";
import { GUEST_REQUEST_OWNER_EMAIL } from "@/lib/services/private-booking-request.service";
import { DEPOSIT_INSTRUCTIONS_SENT_EVENT, HOLD_TIME_ZONE, PROTECTING_PAYMENT_STATUSES, holdDeadline, instructionsDueAt, isDepositHoldExpired } from "@/lib/booking/deposit-hold";

/**
 * RT-013G: Admin Booking Detail Read-Only
 * RT-014B: Admin Booking Cancellation Action
 * Página de detalhe de uma reserva individual.
 */
export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let booking: Awaited<ReturnType<typeof getBookingByIdAction>>;

  try {
    booking = await getBookingByIdAction(id);
  } catch {
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/admin/bookings`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Reservas
        </Link>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foi possível carregar os dados da reserva. Verifique suas permissões.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    notFound();
  }

  const tripTitle = getLocalizedField<string>(
    booking.trip.title as Record<string, string>,
    locale
  );

  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  const paymentStatusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    PARTIAL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    UNPAID: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  };

  const paymentAttemptStatusColors: Record<string, string> = {
    SUCCEEDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    CREATED: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
    REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmada",
    CANCELED: "Cancelada",
  };

  const bookingEventLabels: Record<string, string> = {
    CREATED: "Reserva solicitada",
    CONFIRMED: "Reserva confirmada",
    CANCELED: "Reserva cancelada",
    CANCELED_BY_ADMIN: "Reserva cancelada",
    CANCELED_BY_USER: "Reserva cancelada pelo cliente",
    DEPOSIT_INSTRUCTIONS_SENT: "Instruções do sinal enviadas",
    EXPIRED: "Prazo do sinal vencido (data liberada)",
  };

  const actorRoleLabels: Record<string, string> = {
    USER: "cliente",
    ADMIN: "admin",
    SYSTEM: "sistema",
  };

  const paymentStatusLabels: Record<string, string> = {
    UNPAID: "A combinar",
    PAID: "Pago",
    REFUNDED: "Estornado",
    PARTIAL: "Parcial",
  };

  const scheduleStatusLabels: Record<string, string> = {
    OPEN: "Disponível",
    CLOSED: "Fechada",
  };

  // The tour happens in Rio: date and time are always shown in Brazil's time zone.
  const tourDate = (value: Date) =>
    new Date(value).toLocaleDateString(locale, { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  const tourTime = (value: Date) =>
    new Date(value).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const dateTime = (value: Date) =>
    new Date(value).toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const brl = (cents: number) => (cents / 100).toLocaleString(locale, { style: "currency", currency: "BRL" });

  // RT-124: a private booking has a closed group price (quote snapshot); the legacy per-person schedule price does not apply.
  const quote = booking.quote;
  const participants = quote?.participants ?? booking.guestCount;
  const contact = booking.contact;
  const viaSiteRequest = booking.user.email === GUEST_REQUEST_OWNER_EMAIL;
  const languageLabels: Record<string, string> = { pt: "Português", en: "Inglês", es: "Espanhol" };

  // RT-124 MVP policy: a private booking is confirmed only after the 30% deposit is verified (RT-125 CONFIRMED lines).
  const payments = booking.pricingModel === "PRIVATE_GROUP" ? await getBookingPaymentsAction(booking.id) : null;
  const depositVerified = !payments || payments.summary.deposit.confirmedCents >= payments.summary.deposit.expectedCents;
  const confirmBlockedReason = depositVerified ? null : "Aguardando o sinal de 30% verificado (registre e confirme o sinal em Pagamentos).";

  // RT-123 temporary hold: 24 hours to send the deposit instructions (D1), then 48 hours from the sending to pay.
  const instructionsSentAt = booking.events.find((event) => event.type === DEPOSIT_INSTRUCTIONS_SENT_EVENT)?.createdAt ?? null;
  const protectingPayments = (payments?.payments ?? []).filter((line) => (PROTECTING_PAYMENT_STATUSES as readonly string[]).includes(line.status)).length;
  const hold = { status: booking.status, pricingModel: booking.pricingModel ?? "", requestedAt: booking.createdAt, instructionsSentAt, protectingPayments };
  const renderedAt = new Date();
  const holdExpired = isDepositHoldExpired(hold, renderedAt);
  const instructionsOverdue = !instructionsSentAt && renderedAt >= instructionsDueAt(booking.createdAt);
  // D3: the deadline told to the customer, in their language and in Brasília time.
  const customerLanguage = contact?.language ?? "pt";
  const customerDeadline = new Date(holdDeadline(hold)).toLocaleString(
    customerLanguage === "en" ? "en-GB" : customerLanguage === "es" ? "es-ES" : "pt-BR",
    { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: HOLD_TIME_ZONE },
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/bookings`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Reservas
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Detalhe da Reserva</h1>
          <p className="mt-1 break-all text-[11px] text-muted-foreground/80">
            Ref. <span className="font-mono select-all" title={booking.id}>{booking.id}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                statusColors[booking.status] ?? statusColors.PENDING
              }`}
            >
              {statusLabels[booking.status] ?? booking.status}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${
                paymentStatusColors[booking.paymentStatus] ?? paymentStatusColors.UNPAID
              }`}
            >
              {paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}
            </span>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row">
            {booking.status === "PENDING" && (
              <ConfirmBookingButton bookingId={booking.id} locale={locale} blockedReason={confirmBlockedReason} />
            )}
            {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
              <CancelBookingButton bookingId={booking.id} locale={locale} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Nome</span>
              <p className="font-medium">{contact?.fullName ?? booking.user.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">E-mail</span>
              <p className="break-all">{contact?.email ?? (viaSiteRequest ? "—" : booking.user.email)}</p>
            </div>
            {contact && (
              <>
                <div>
                  <span className="text-muted-foreground text-xs">WhatsApp / telefone</span>
                  <p>{contact.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Idioma</span>
                  <p>{languageLabels[contact.language] ?? contact.language}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Hotel ou endereço de busca</span>
                  <p className="break-words">{contact.pickupAddress ?? "Não informado"}</p>
                </div>
                {contact.notes && (
                  <div>
                    <span className="text-muted-foreground text-xs">Observações do cliente</span>
                    <p className="whitespace-pre-line break-words">{contact.notes}</p>
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground">
              {viaSiteRequest ? "Solicitação pelo formulário do site (sem conta de cliente)." : `Conta do cliente: ${booking.user.email}`}
            </p>
          </CardContent>
        </Card>

        {/* Passeio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Passeio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Passeio</span>
              <p className="font-medium">{tripTitle}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Data e horário</span>
              {booking.schedule ? (
                <p className="font-medium first-letter:uppercase">
                  {tourDate(booking.schedule.startAt)} · {tourTime(booking.schedule.startAt)}
                </p>
              ) : (
                <p className="text-muted-foreground">A definir</p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Cidade</span>
              <p>{booking.trip.city}</p>
            </div>
            {booking.trip.location && (
              <div>
                <span className="text-muted-foreground text-xs">Localização</span>
                <p>{booking.trip.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Participantes</span>
              <p className="font-medium">
                {participants}
                {quote && quote.infantCount > 0 && (
                  <span className="font-normal text-muted-foreground">
                    {" "}({quote.fullFareCount} pagantes integrais, {quote.infantCount} {quote.infantCount === 1 ? "bebê" : "bebês"})
                  </span>
                )}
              </p>
            </div>
            {quote ? (
              <div>
                <span className="text-muted-foreground text-xs">Total fechado do grupo (passeio privativo)</span>
                <p className="text-xl font-bold">{brl(quote.totalCents)}</p>
                <p className="text-xs text-muted-foreground">
                  Preço por grupo, não por pessoa · tabela {quote.priceTableId} v{quote.priceTableVersion}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground text-xs">Total</span>
                <p className="font-medium">{brl(booking.totalPriceCents)}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">Solicitada em</span>
              <p>{dateTime(booking.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Atualizada em</span>
              <p>{dateTime(booking.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!booking.schedule ? (
              <p className="text-muted-foreground">Sem data específica agendada.</p>
            ) : (
              <>
                <div>
                  <span className="text-muted-foreground text-xs">Início</span>
                  <p className="font-medium first-letter:uppercase">
                    {tourDate(booking.schedule.startAt)} · {tourTime(booking.schedule.startAt)}
                  </p>
                </div>
                {booking.schedule.endAt && (
                  <div>
                    <span className="text-muted-foreground text-xs">Fim</span>
                    <p className="first-letter:uppercase">
                      {tourDate(booking.schedule.endAt)} · {tourTime(booking.schedule.endAt)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground text-xs">Capacidade da agenda</span>
                  <p>{booking.schedule.capacity}</p>
                </div>
                {!quote && (
                  <div>
                    <span className="text-muted-foreground text-xs">Preço por pessoa (agenda)</span>
                    <p>{brl(booking.schedule.pricePerPersonCents)}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground text-xs">Status da agenda</span>
                  <p className="font-medium">{scheduleStatusLabels[booking.schedule.status] ?? booking.schedule.status}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RT-124: texto pronto com valores e prazo do sinal para enviar ao cliente (o meio de pagamento é preenchido pela equipe) */}
      {quote && booking.status === "PENDING" && !depositVerified && booking.schedule && (
        <DepositInstructions
          language={customerLanguage}
          customerName={contact?.fullName ?? booking.user.name}
          tourTitle={tripTitle}
          dateLabel={tourDate(booking.schedule.startAt)}
          participants={participants}
          totalLabel={brl(quote.totalCents)}
          depositLabel={brl(quote.depositCents)}
          balanceLabel={brl(quote.balanceCents)}
          reference={booking.id.slice(-8).toUpperCase()}
          bookingId={booking.id}
          locale={locale}
          sentLabel={instructionsSentAt ? dateTime(instructionsSentAt) : null}
          deadlineLabel={instructionsSentAt ? dateTime(holdDeadline(hold)) : null}
          customerDeadlineLabel={instructionsSentAt ? customerDeadline : null}
          instructionsDueLabel={dateTime(instructionsDueAt(booking.createdAt))}
          holdExpired={holdExpired}
          instructionsOverdue={instructionsOverdue}
          holdProtected={protectingPayments > 0}
        />
      )}

      {/* RT-125: controle manual de pagamentos (sinal e saldo) */}
      <PaymentsPanel bookingId={booking.id} bookingStatus={booking.status} locale={locale} />

      {/* RT-124: historico da reserva (criacao, confirmacao e cancelamento, com o responsavel) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico da Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          {booking.events.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum evento registrado para esta reserva.</p>
          ) : (
            <ol className="space-y-2 border-l pl-4 text-xs">
              {booking.events.map((event) => (
                <li key={event.id}>
                  <p className="font-medium">
                    {bookingEventLabels[event.type] ?? event.type}
                    {event.fromStatus ? (
                      <span className="font-normal text-muted-foreground">
                        {` (${statusLabels[event.fromStatus] ?? event.fromStatus} → ${statusLabels[event.toStatus ?? ""] ?? event.toStatus})`}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground">
                    {dateTime(event.createdAt)}
                    {" · "}
                    {actorRoleLabels[event.actorRole] ?? event.actorRole}
                    {event.actorName ? ` ${event.actorName}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Tentativas de Pagamento (recolhivel; dados preservados para auditoria) */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-base font-semibold">Tentativas de Pagamento (online)</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {booking.paymentAttempts.length === 0 ? "Nenhum registro" : `${booking.paymentAttempts.length} ${booking.paymentAttempts.length === 1 ? "registro" : "registros"}`}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
        <CardContent>
          {booking.paymentAttempts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma tentativa de pagamento online. Os pagamentos desta reserva são registrados manualmente no painel acima.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-semibold text-xs">ID</th>
                    <th className="py-2 px-3 font-semibold text-xs">Provedor</th>
                    <th className="py-2 px-3 font-semibold text-xs">Status</th>
                    <th className="py-2 px-3 font-semibold text-xs">Valor</th>
                    <th className="py-2 px-3 font-semibold text-xs">Pago em</th>
                    <th className="py-2 px-3 font-semibold text-xs">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.paymentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-muted-foreground">
                        {attempt.id.substring(0, 8)}
                      </td>
                      <td className="py-2 px-3 text-xs uppercase">{attempt.provider}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                            paymentAttemptStatusColors[attempt.status] ?? ""
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">
                        {(attempt.amountCents / 100).toLocaleString(locale, {
                          style: "currency",
                          currency: attempt.currency,
                        })}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {attempt.paidAt
                          ? new Date(attempt.paidAt).toLocaleDateString(locale, {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {new Date(attempt.createdAt).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        </details>
      </Card>

      {/* Logs de E-mail (recolhivel; dados preservados para auditoria) */}
      <Card>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-6 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-base font-semibold">Logs de E-mail</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              {booking.emailLogs.length === 0 ? "Nenhum registro" : `${booking.emailLogs.length} ${booking.emailLogs.length === 1 ? "registro" : "registros"}`}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
        <CardContent>
          {booking.emailLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum e-mail enviado para esta reserva. O sistema não envia confirmações comerciais automaticamente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-semibold text-xs">Template</th>
                    <th className="py-2 px-3 font-semibold text-xs">Status</th>
                    <th className="py-2 px-3 font-semibold text-xs">Enviado em</th>
                    <th className="py-2 px-3 font-semibold text-xs">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.emailLogs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 text-xs uppercase">{log.template}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                            log.status === "SENT"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : log.status === "FAILED"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {log.sentAt
                          ? new Date(log.sentAt).toLocaleDateString(locale, {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        </details>
      </Card>
    </div>
  );
}
