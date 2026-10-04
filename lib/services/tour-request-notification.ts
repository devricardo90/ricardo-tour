// Notification e-mail for guest tour requests (RT-55). The request is ALREADY stored (ContactSubmission) before this
// runs, so a delivery problem never loses a request and never turns a stored request into a fake failure.
//
// Sender (RT-62): the verified transactional identity from lib/email-identity.ts. The
// earlier sender on the retired ricktravel.com.br domain was removed. The visitor's e-mail, when it is a plain valid
// address, is used as Reply-To; otherwise replies go to the business inbox.
import { TRANSACTIONAL_FROM, resolveReplyTo, toSingleLine } from "@/lib/email-identity";
import { PUBLIC_CONTACT } from "@/lib/public-contact";

export const NOTIFICATION_RECIPIENT = PUBLIC_CONTACT.email;
export const NOTIFICATION_SENDER = TRANSACTIONAL_FROM;

export type NotificationResult = "sent" | "muted" | "skipped" | "failed";

/**
 * CONTACT_EMAIL_MODE: "send" (default when RESEND_API_KEY exists) | "log" (mute: print a one-line summary instead of
 * sending, used by automated tests) | "off" (do nothing).
 */
export function resolveEmailMode(env: Record<string, string | undefined> = process.env): "send" | "log" | "off" {
  const mode = env.CONTACT_EMAIL_MODE?.trim().toLowerCase();
  if (mode === "log" || mode === "off" || mode === "send") return mode;
  return env.RESEND_API_KEY ? "send" : "off";
}

export async function sendContactNotification(input: { submissionId: string; subject: string; message: string; replyTo?: string; logTag?: string }): Promise<NotificationResult> {
  const mode = resolveEmailMode();
  const subject = toSingleLine(input.subject);
  const tag = input.logTag ?? "contact";
  if (mode === "off") return "skipped";
  if (mode === "log") {
    console.info(`[${tag}] email muted submission=${input.submissionId} to=${NOTIFICATION_RECIPIENT} replyTo=${input.replyTo ? "set" : "none"} subject="${subject}"`);
    return "muted";
  }
  try {
    const { resend } = await import("@/lib/resend");
    const { error } = await resend.emails.send({
      from: NOTIFICATION_SENDER,
      to: [NOTIFICATION_RECIPIENT],
      subject,
      text: input.message,
      replyTo: resolveReplyTo(input.replyTo),
    });
    if (error) {
      console.error(`[${tag}] notification failed`, error.message);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error(`[${tag}] notification error`, error instanceof Error ? error.message : error);
    return "failed";
  }
}

export function sendTourRequestNotification(input: { submissionId: string; tripTitle: string; message: string; replyTo?: string }) {
  return sendContactNotification({ submissionId: input.submissionId, subject: `Nova solicitação de passeio: ${input.tripTitle}`, message: input.message, replyTo: input.replyTo, logTag: "tour-request" });
}
