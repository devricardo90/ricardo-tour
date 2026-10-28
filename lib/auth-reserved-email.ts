/**
 * Addresses of the reserved system domain belong to internal accounts that nobody signs in to (e.g. the site's
 * request account, which owns every booking requested without an account). `.invalid` never receives e-mail (RFC 2606).
 * Sign-up refuses them, so no visitor can take one over (RT-124 isolation, 28/10/2026).
 */
export const RESERVED_SYSTEM_EMAIL_DOMAIN = "ricardotour.invalid";

export function isReservedSystemEmail(email: unknown): boolean {
  return typeof email === "string" && email.trim().toLowerCase().endsWith(`@${RESERVED_SYSTEM_EMAIL_DOMAIN}`);
}
