// Resend client, created lazily and only when RESEND_API_KEY is configured. Without the key (previews, local builds)
// no client exists and nothing is sent: every send resolves to a "missing_api_key" error, so callers record a failed
// delivery instead of a fake success. Creating the client at import time made `next build` crash without the key.
import { Resend, type CreateEmailOptions, type CreateEmailRequestOptions, type CreateEmailResponse } from 'resend';

export const EMAIL_SERVICE_UNAVAILABLE_MESSAGE = 'Email service unavailable: RESEND_API_KEY is not configured. Nothing was sent.';

let cached: { apiKey: string; client: Resend } | undefined;
let warned = false;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (cached?.apiKey !== apiKey) cached = { apiKey, client: new Resend(apiKey) };
  return cached.client;
}

export function isEmailServiceConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export const resend = {
  emails: {
    async send(payload: CreateEmailOptions, options?: CreateEmailRequestOptions): Promise<CreateEmailResponse> {
      const client = getClient();
      if (!client) {
        if (!warned) {
          warned = true;
          console.warn('RESEND_API_KEY is not defined. Email delivery will be skipped.');
        }
        return { data: null, error: { name: 'missing_api_key', statusCode: null, message: EMAIL_SERVICE_UNAVAILABLE_MESSAGE }, headers: null };
      }
      return client.emails.send(payload, options);
    },
  },
};
