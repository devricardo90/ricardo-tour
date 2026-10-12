import { NextResponse, after } from "next/server";
import { isConciergeEnabled } from "@/lib/ai-concierge/launch";
import { handleConciergeMessage } from "@/lib/ai-concierge/runtime";
import { getServerObservability } from "@/lib/ai-concierge/observability";
import { getAlertNotifier } from "@/lib/ai-concierge/observability/notify";
import { toConciergeReply } from "@/lib/ai-concierge/ui/reply";
import { isSameOrigin } from "@/lib/security/same-origin";
import { reportServerError } from "@/lib/observability/report";

export const dynamic = "force-dynamic";

/**
 * Daniela V1 endpoint. It is OFF by default and, in production, only answers when every mandatory launch criterion is met
 * (lib/ai-concierge/launch.ts). Privacy: the server keeps no conversation; the body is never logged; the response is never cached;
 * only the closed `ConciergeReply` shape (text, kind, handoff, tour ids, retry seconds, support reference) leaves the server.
 * The client address comes from the platform headers, never from the body.
 */
const MAX_BODY_BYTES = 12_000;
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * RT-96 (G3): alert evaluation and e-mail delivery run AFTER the response is sent, so a slow mail provider never delays the
 * visitor. `after()` needs a request scope; outside one (unit tests) the task still runs, fire-and-forget. The notifier never throws.
 */
function checkAlertsAfterResponse() {
  const task = () => getAlertNotifier().check(getServerObservability().metrics.snapshot());
  try {
    after(task);
  } catch {
    void task().catch(() => {});
  }
}

const error = (code: string, status: number, extra: Record<string, string> = {}) =>
  NextResponse.json({ status: "error", error: { code } }, { status, headers: { ...NO_STORE, ...extra } });

export async function POST(request: Request) {
  if (!isConciergeEnabled()) return error("FEATURE_DISABLED", 503);
  if (!isSameOrigin(request.headers)) return error("FORBIDDEN", 403);
  if (!(request.headers.get("content-type") ?? "").includes("json")) return error("UNSUPPORTED_MEDIA_TYPE", 415);
  if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return error("PAYLOAD_TOO_LARGE", 413);

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return error("PAYLOAD_TOO_LARGE", 413);
    body = JSON.parse(text);
  } catch {
    return error("INVALID_REQUEST", 400);
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    // Temporary anonymous session id (memory-only in the browser, rotated hourly): enforced by the per-session limit, never stored.
    const sessionId = request.headers.get("x-concierge-session") ?? undefined;
    const result = await handleConciergeMessage(body, process.env, { ip: forwarded || request.headers.get("x-real-ip") || undefined, sessionId });
    // Essential alerts (content-free; e-mail only to explicitly configured recipients; never affects or delays the response).
    checkAlertsAfterResponse();
    const reply = toConciergeReply(result);
    const headers: Record<string, string> = { ...NO_STORE };
    if (result.outcome === "RATE_LIMITED" && typeof result.retry_after_seconds === "number") headers["Retry-After"] = String(Math.max(1, Math.ceil(result.retry_after_seconds)));
    return NextResponse.json(reply, { status: result.outcome === "RATE_LIMITED" ? 429 : 200, headers });
  } catch (cause) {
    // Never surface internals; the visitor still gets a degraded reply that offers the team.
    reportServerError({ source: "api_route", where: "api/ai-concierge:POST", error: cause });
    checkAlertsAfterResponse(); // failures are exactly what the alerts watch, so they are evaluated on this path too
    return error("INTERNAL_ERROR", 500);
  }
}
