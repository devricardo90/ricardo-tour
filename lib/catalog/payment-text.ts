/** Texts that name a payment method (RT-121: PIX, card terminal, cash; also card, bank transfer, boleto) in PT/EN/ES. */
export const PAYMENT_METHOD_TEXT = /\bPIX\b|maquininha|card terminal|terminal de pago|dinheiro|\bcash\b|efectivo|\bcart[ãa]o\b|\bcards?\b|\btarjetas?\b|transfer[êe]ncia|transferencia bancaria|bank transfer|\bboleto\b/i;

/**
 * Owner 31/10/2026: payment methods are named publicly only once PAID bookings open (separate PIX sprint). Independent
 * from the legal publication: publishing the Terms and the Privacy Policy opens the request form, not payments.
 */
export const PAID_BOOKINGS_OPEN = false;

/**
 * Owner 31/10/2026: until paid bookings open (separate PIX sprint) the informative catalog names no payment method. Drops
 * every sentence of an approved text that names one (e.g. the deposit/payment sentence of a price note); the remaining
 * sentences are kept verbatim.
 */
export function withoutPaymentSentences(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !PAYMENT_METHOD_TEXT.test(sentence))
    .join(" ")
    .trim();
}
