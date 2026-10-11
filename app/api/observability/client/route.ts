import { NextResponse } from "next/server";
import { clientReportSchema, MAX_CLIENT_REPORT_BYTES } from "@/lib/observability/client-schema";
import { reportServerError, reportWebVital } from "@/lib/observability/report";
import { createRateLimiter, clientKeyFromHeaders } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// RT-64 browser error / web-vitals intake. Per-instance limiters on purpose: they protect the log volume without spending
// commands from the shared (Upstash Free) quota that RT-72/RT-82 budgeted for the Concierge and the forms.
const perClient = createRateLimiter({ limit: 60, windowMs: 60_000 });
const globalCeiling = createRateLimiter({ limit: 600, windowMs: 60_000 }); // all clients together, per instance

/** Same-origin browser requests only: cross-site pages cannot make a visitor's browser write fake records. */
function isSameOrigin(headers: Headers) {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const origin = headers.get("origin");
  if (origin) {
    try {
      const host = headers.get("x-forwarded-host") ?? headers.get("host");
      if (!host || new URL(origin).host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers)) return new NextResponse(null, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").includes("json")) return new NextResponse(null, { status: 415 });
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_CLIENT_REPORT_BYTES) return new NextResponse(null, { status: 413 });
  if (globalCeiling.isLimited("all") || perClient.isLimited(clientKeyFromHeaders(req.headers))) return new NextResponse(null, { status: 429 });

  const text = await req.text().catch(() => "");
  if (!text || new TextEncoder().encode(text).length > MAX_CLIENT_REPORT_BYTES) return new NextResponse(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = clientReportSchema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const report = parsed.data;
  if (report.kind === "vital") {
    reportWebVital({ name: report.name, value: report.value, rating: report.rating, path: report.path });
  } else {
    const error = Object.assign(new Error(report.message), { name: report.name, digest: report.digest });
    reportServerError({ source: report.source, where: "browser", error, path: report.path });
  }
  return new NextResponse(null, { status: 204 });
}
