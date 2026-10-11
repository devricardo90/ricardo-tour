/**
 * Owner-run delivery test for the Daniela operational alerts. It sends ONE clearly-labelled test e-mail to the recipients
 * configured in AI_CONCIERGE_ALERT_EMAIL through the existing verified Resend sender, and prints the real result.
 * Alerts must not be described as working until this prints "DELIVERED" and the recipient confirms receipt.
 */
import dotenv from "dotenv";
import { getAlertStatus, readAlertRecipients, resendAlertSender } from "../lib/ai-concierge/observability/notify";

dotenv.config({ path: ".env.local", quiet: true });

async function main() {
  const status = getAlertStatus();
  console.log(JSON.stringify(status));
  const to = readAlertRecipients();
  if (to.length === 0) return console.log("NOT SENT: AI_CONCIERGE_ALERT_EMAIL is not set to a valid address.");
  if (!status.resend_configured) return console.log("NOT SENT: RESEND_API_KEY is not configured.");
  const ok = await resendAlertSender({ to, subject: "[Daniela] TESTE de alerta (sem incidente)", text: "Este é um e-mail de teste do sistema de alertas da Daniela. Nenhum incidente ocorreu." });
  console.log(ok ? `DELIVERED to ${to.length} recipient(s) (provider accepted). Ask the recipient to confirm receipt.` : "FAILED: the provider rejected or the send errored.");
}
main();
