import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Session state for the header islands. Only what the interface shows: the session token stays in its httpOnly cookie
 * and is never returned to page scripts (better-auth's own get-session response includes it).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as { id: string; name: string | null; role?: string } | undefined;

  return NextResponse.json(
    { session: user ? { user: { id: user.id, name: user.name, role: user.role } } : null },
    { headers: { "cache-control": "no-store" } },
  );
}
