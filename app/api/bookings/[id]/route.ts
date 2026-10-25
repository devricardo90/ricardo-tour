import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { isDomainError } from "@/lib/errors/domain-error";
import { cancelBookingForUser } from "@/lib/services/booking.service";
import { reportServerError } from "@/lib/observability/report";
import { isBookingWriteLimited } from "@/lib/rate-limit/server";
import { isSameOrigin } from "@/lib/security/same-origin";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // RT-129: browser writes from this site only, and a bounded rate per account and per client.
    if (!isSameOrigin(req.headers)) {
      return NextResponse.json({ error: "Origem nao permitida" }, { status: 403 });
    }
    const session = await requireSession();
    if (await isBookingWriteLimited(req.headers, session.user.id, "cancel")) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
    }
    const { id } = await ctx.params;
    const updated = await cancelBookingForUser(session.user.id, id);
    return NextResponse.json(updated);
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    reportServerError({ source: "api_route", where: "api/bookings/[id]:PATCH", error });
    return NextResponse.json({ error: "Erro ao cancelar booking" }, { status: 500 });
  }
}
