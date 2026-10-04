// Canonical e-mail identity for automated messages (RT-61 / RT-62).
//
// ricardotour.com is verified in Resend (eu-west-1). notificacoes@ is reserved for automated transactional mail and has
// no mailbox; people reply to the canonical public inbox. The retired ricktravel.com.br domain has no DNS and must not be
// used as a sender. Both values are fixed constants: user input is never used as the From address.
import { PUBLIC_CONTACT } from "@/lib/public-contact";

export const TRANSACTIONAL_FROM = "Ricardo Tour <notificacoes@ricardotour.com>";
export const BUSINESS_REPLY_TO = PUBLIC_CONTACT.email;

const SIMPLE_ADDRESS = /^[^\s<>"',;:\\()[\]]+@[^\s<>"',;:\\()[\]]+\.[^\s<>"',;:\\()[\]]+$/;

/**
 * Reply-To for a message that was submitted by a visitor: the visitor's address when it is a plain, well-formed address,
 * otherwise the business inbox. Rejects display names, lists, control characters and anything else a visitor could use to
 * smuggle extra headers or recipients.
 */
export function resolveReplyTo(visitorEmail?: string | null) {
  const candidate = visitorEmail?.trim();
  return candidate && candidate.length <= 254 && SIMPLE_ADDRESS.test(candidate) ? candidate : BUSINESS_REPLY_TO;
}

/** Single-line subject: visitor-controlled text must not carry line breaks into headers. */
export function toSingleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}
