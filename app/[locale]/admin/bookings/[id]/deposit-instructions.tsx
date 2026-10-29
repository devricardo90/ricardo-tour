'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markDepositInstructionsSentAction } from "@/app/actions/admin-payments";

type Props = {
  language: string;
  customerName: string;
  tourTitle: string;
  dateLabel: string;
  participants: number;
  totalLabel: string;
  depositLabel: string;
  balanceLabel: string;
  reference: string;
  /** RT-123 temporary hold: when the instructions were sent (the 48-hour deposit window starts then). */
  bookingId: string;
  locale: string;
  sentLabel: string | null;
  deadlineLabel: string | null;
  /** D3: the deposit deadline in the customer's language, Brasília time (null until the sending is registered). */
  customerDeadlineLabel: string | null;
  /** D1: last moment to send the instructions (24 hours after the request). */
  instructionsDueLabel: string;
  holdExpired: boolean;
  /** D1: the 24 hours to send the instructions passed (the request may still be protected by a payment). */
  instructionsOverdue: boolean;
  holdProtected: boolean;
};

const PAYMENT_PLACEHOLDER = {
  pt: "[preencher: chave Pix ou link de pagamento confirmado pela equipe]",
  en: "[fill in: Pix key or payment link confirmed by the team]",
  es: "[completar: clave Pix o enlace de pago confirmado por el equipo]",
} as const;

const DEADLINE_PENDING = "[o prazo do sinal entra aqui depois de registrar o envio]";

/** D3 (Owner, 29/10/2026): the customer is told the exact deposit deadline, in Brasília time. */
function deadlineSentence(p: Props) {
  const when = p.customerDeadlineLabel;
  if (!when) return ` ${DEADLINE_PENDING}`;
  if (p.language === "en") return ` Please pay the deposit by ${when} (Brasília time); after that, the date may be released.`;
  if (p.language === "es") return ` La seña debe pagarse hasta el ${when} (hora de Brasilia); después de ese plazo, la fecha puede liberarse.`;
  return ` O sinal deve ser pago até ${when} (horário de Brasília); depois desse prazo, a data pode ser liberada.`;
}

function message(p: Props) {
  const deadline = deadlineSentence(p);
  if (p.language === "en") {
    return `Hello, ${p.customerName}! We received your request for "${p.tourTitle}" on ${p.dateLabel}, for ${p.participants} ${p.participants === 1 ? "person" : "people"} (reference ${p.reference}). The total for your group is ${p.totalLabel}. To confirm the booking we ask for a 30% deposit of ${p.depositLabel}. The 70% balance (${p.balanceLabel}) is paid at the start of the tour. Deposit payment: ${PAYMENT_PLACEHOLDER.en}.${deadline} Your booking is confirmed once we verify the deposit.`;
  }
  if (p.language === "es") {
    return `¡Hola, ${p.customerName}! Recibimos tu solicitud de "${p.tourTitle}" para el ${p.dateLabel}, para ${p.participants} ${p.participants === 1 ? "persona" : "personas"} (referencia ${p.reference}). El total del grupo es ${p.totalLabel}. Para confirmar la reserva pedimos una seña del 30%: ${p.depositLabel}. El saldo del 70% (${p.balanceLabel}) se paga al inicio del tour. Pago de la seña: ${PAYMENT_PLACEHOLDER.es}.${deadline} La reserva queda confirmada cuando verificamos la seña.`;
  }
  return `Olá, ${p.customerName}! Recebemos sua solicitação do passeio "${p.tourTitle}" para ${p.dateLabel}, para ${p.participants} ${p.participants === 1 ? "pessoa" : "pessoas"} (referência ${p.reference}). O valor total do grupo é ${p.totalLabel}. Para confirmar a reserva, pedimos o sinal de 30%: ${p.depositLabel}. O saldo de 70% (${p.balanceLabel}) é pago no início do passeio. Pagamento do sinal: ${PAYMENT_PLACEHOLDER.pt}.${deadline} A reserva fica confirmada assim que verificarmos o sinal.`;
}

/**
 * RT-124/RT-125 MVP: ready-to-send deposit instructions, in the customer's language, with the amounts from the immutable
 * quote. The payment method is left for the team to fill in: no method is promised before its account is operational.
 */
export function DepositInstructions(props: Props) {
  const text = message(props);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [marking, startMarking] = useTransition();
  const [markError, setMarkError] = useState<string | null>(null);
  const markSent = () =>
    startMarking(async () => {
      setMarkError(null);
      const result = await markDepositInstructionsSentAction(props.bookingId, props.locale);
      if ("error" in result) setMarkError(result.error ?? "Falha ao registrar o envio.");
      else router.refresh();
    });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instruções do sinal para o cliente</CardTitle>
        <p className="text-xs text-muted-foreground">
          Confira a disponibilidade antes de enviar. Complete o meio de pagamento e envie por WhatsApp ou e-mail; o sistema não
          envia nada sozinho.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea readOnly value={text} rows={6} aria-label="Texto das instruções do sinal" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        <button
          type="button"
          disabled={!props.customerDeadlineLabel}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {copied ? "Copiado" : "Copiar texto"}
        </button>
        <div className="space-y-1 border-t pt-3 text-xs" data-testid="deposit-hold">
          {props.sentLabel ? (
            <>
              <p>
                Instruções enviadas em {props.sentLabel}. <span className="font-medium">Prazo do sinal: até {props.deadlineLabel}</span> (48 horas).
              </p>
              {props.holdProtected ? (
                <p className="text-muted-foreground">Há pagamento registrado: a data continua reservada e a reserva não expira.</p>
              ) : props.holdExpired ? (
                <p className="text-destructive">Prazo vencido sem pagamento registrado: a data será liberada no próximo pedido para o mesmo dia.</p>
              ) : (
                <p className="text-muted-foreground">A data fica reservada até o prazo. Sem pagamento registrado até lá, ela pode ser liberada.</p>
              )}
            </>
          ) : (
            <>
              {props.holdExpired ? (
                <p className="text-destructive">O prazo de 24 horas para enviar as instruções venceu ({props.instructionsDueLabel}): a data será liberada no próximo pedido para o mesmo dia.</p>
              ) : props.instructionsOverdue ? (
                <p className="text-muted-foreground">
                  O prazo de 24 horas para enviar as instruções venceu ({props.instructionsDueLabel}), mas há pagamento registrado: a data
                  continua reservada. Confirme ou cancele o pagamento em Pagamentos.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Registre o envio até {props.instructionsDueLabel} (24 horas após o pedido). O registro coloca no texto o prazo de 48 horas para o
                  sinal; depois copie e envie ao cliente.
                </p>
              )}
              <button
                type="button"
                onClick={markSent}
                disabled={marking || props.holdExpired || props.instructionsOverdue}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                {marking ? "Registrando..." : "Registrar envio e gerar o prazo"}
              </button>
              {markError ? <p className="text-destructive">{markError}</p> : null}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
