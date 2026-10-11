import { NextResponse } from "next/server";
import { isConciergeEnabled } from "@/lib/ai-concierge/launch";
import { getServerObservability } from "@/lib/ai-concierge/observability";
import { clientKeyFromHeaders, createRateLimiter } from "@/lib/security/rate-limit";
import { isSameOrigin } from "@/lib/security/same-origin";

export const dynamic = "force-dynamic";

/**
 * Daniela V1 client events (RT-73 contract): `concierge_opened` and `handoff_clicked` (channel + handoff code only). Same guards
 * as the other intake endpoints: off with the Concierge, same-origin, JSON, tiny body, per-instance limits (no shared-quota use),
 * and the strict RT-73 schema, so nothing but the two closed events can ever be recorded. 204 on success, no body.
 */
const perClient = createRateLimiter({ limit: 60, windowMs: 60_000 });
const globalCeiling = createRateLimiter({ limit: 600, windowMs: 60_000 });
const MAX_BYTES = 1_024;

export async function POST(request: Request) {
  if (!isConciergeEnabled()) return new NextResponse(null, { status: 404 });
  if (!isSameOrigin(request.headers)) return new NextResponse(null, { status: 403 });
  if (!(request.headers.get("content-type") ?? "").includes("json")) return new NextResponse(null, { status: 415 });
  if (Number(request.headers.get("content-length") ?? "0") > MAX_BYTES) return new NextResponse(null, { status: 413 });
  if (globalCeiling.isLimited("all") || perClient.isLimited(clientKeyFromHeaders(request.headers))) return new NextResponse(null, { status: 429 });

  const text = await request.text().catch(() => "");
  if (!text || new TextEncoder().encode(text).length > MAX_BYTES) return new NextResponse(null, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const outcome = getServerObservability().ingestClientEvent(json);
  return new NextResponse(null, { status: outcome.ok ? 204 : 400 });
}
