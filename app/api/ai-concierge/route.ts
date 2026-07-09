import { NextResponse } from "next/server";
import { isAIConciergeEnabled } from "@/lib/ai-concierge/config";
import {
  createAIConciergeError,
  parseAIConciergeRequest,
  type AIConciergeSuccessEnvelope,
} from "@/lib/ai-concierge/contract";
import { createMockAIConciergeResponse } from "@/lib/ai-concierge/mock-backend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAIConciergeEnabled()) {
    return NextResponse.json(
      createAIConciergeError(
        "FEATURE_DISABLED",
        "AI Concierge is disabled."
      ),
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      createAIConciergeError("INVALID_REQUEST", "Invalid JSON body."),
      { status: 400 }
    );
  }

  const parsed = parseAIConciergeRequest(body);

  if (!parsed.ok) {
    return NextResponse.json(
      {
        status: "error",
        error: parsed.error,
      },
      { status: 400 }
    );
  }

  const data = createMockAIConciergeResponse(parsed.value);

  return NextResponse.json({
    status: "success",
    data,
  } satisfies AIConciergeSuccessEnvelope);
}
