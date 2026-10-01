// Notification e-mail for guest tour requests (RT-55). The request is ALREADY stored (ContactSubmission) before this
// runs, so a delivery problem never loses a request and never turns a stored request into a fake failure.
//
// Sender: unchanged. This reuses the sender the project already sends booking e-mails from (see
// lib/services/email.service.ts). Its domain verification state could not be confirmed from here (the Resend key is
// restricted to sending), so the sender is deliberately NOT switched to ricardotour.com; that is infrastructure debt
// reported for the Owner. The visitor's e-mail, when given, is used as Reply-To.
import { PUBLIC_CONTACT } from "@/lib/public-contact";

export const NOTIFICATION_RECIPIENT = PUBLIC_CONTACT.email;
export const NOTIFICATION_SENDER = "Rick Travel <reservas@ricktravel.com.br>";

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

export async function sendTourRequestNotification(input: { submissionId: string; tripTitle: string; message: string; replyTo?: string }): Promise<NotificationResult> {
  const mode = resolveEmailMode();
  const subject = `Nova solicitação de passeio: ${input.tripTitle}`;
  if (mode === "off") return "skipped";
  if (mode === "log") {
    console.info(`[tour-request] email muted submission=${input.submissionId} to=${NOTIFICATION_RECIPIENT} replyTo=${input.replyTo ? "set" : "none"} subject="${subject}"`);
    return "muted";
  }
  try {
    const { resend } = await import("@/lib/resend");
    const { error } = await resend.emails.send({
      from: NOTIFICATION_SENDER,
      to: [NOTIFICATION_RECIPIENT],
      subject,
      text: input.message,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) {
      console.error("[tour-request] notification failed", error.message);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[tour-request] notification error", error instanceof Error ? error.message : error);
    return "failed";
  }
}
