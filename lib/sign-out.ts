import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Official better-auth sign-out (POST /api/auth/sign-out: deletes the session row and clears the cookie), then a full
 * navigation so every client island re-reads the (now empty) session. The destination is always a same-site path.
 * Returns false when the server did not confirm the sign-out, so the caller can tell the visitor.
 */
export async function signOutAndLeave(locale: string, to = `/${locale}`): Promise<boolean> {
  const { error } = await authClient.signOut();
  if (error) return false;
  window.location.assign(safeRedirectPath(to, `/${locale}`));
  return true;
}
