'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
};

const PAYMENT_PLACEHOLDER = {
  pt: "[preencher: chave Pix ou link de pagamento confirmado pela equipe]",
  en: "[fill in: Pix key or payment link confirmed by the team]",
  es: "[completar: clave Pix o enlace de pago confirmado por el equipo]",
} as const;

function message(p: Props) {
  if (p.language === "en") {
    return `Hello, ${p.customerName}! We received your request for "${p.tourTitle}" on ${p.dateLabel}, for ${p.participants} ${p.participants === 1 ? "person" : "people"} (reference ${p.reference}). The total for your group is ${p.totalLabel}. To confirm the booking we ask for a 30% deposit of ${p.depositLabel}. The 70% balance (${p.balanceLabel}) is paid at the start of the tour. Deposit payment: ${PAYMENT_PLACEHOLDER.en}. Your booking is confirmed once we verify the deposit.`;
  }
  if (p.language === "es") {
    return `¡Hola, ${p.customerName}! Recibimos tu solicitud de "${p.tourTitle}" para el ${p.dateLabel}, para ${p.participants} ${p.participants === 1 ? "persona" : "personas"} (referencia ${p.reference}). El total del grupo es ${p.totalLabel}. Para confirmar la reserva pedimos una seña del 30%: ${p.depositLabel}. El saldo del 70% (${p.balanceLabel}) se paga al inicio del tour. Pago de la seña: ${PAYMENT_PLACEHOLDER.es}. La reserva queda confirmada cuando verificamos la seña.`;
  }
  return `Olá, ${p.customerName}! Recebemos sua solicitação do passeio "${p.tourTitle}" para ${p.dateLabel}, para ${p.participants} ${p.participants === 1 ? "pessoa" : "pessoas"} (referência ${p.reference}). O valor total do grupo é ${p.totalLabel}. Para confirmar a reserva, pedimos o sinal de 30%: ${p.depositLabel}. O saldo de 70% (${p.balanceLabel}) é pago no início do passeio. Pagamento do sinal: ${PAYMENT_PLACEHOLDER.pt}. A reserva fica confirmada assim que verificarmos o sinal.`;
}

/**
 * RT-124/RT-125 MVP: ready-to-send deposit instructions, in the customer's language, with the amounts from the immutable
 * quote. The payment method is left for the team to fill in: no method is promised before its account is operational.
 */
export function DepositInstructions(props: Props) {
  const text = message(props);
  const [copied, setCopied] = useState(false);
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
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          {copied ? "Copiado" : "Copiar texto"}
        </button>
      </CardContent>
    </Card>
  );
}
