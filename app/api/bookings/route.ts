import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/authz";
import { isDomainError } from "@/lib/errors/domain-error";
import { createBookingForUser, listBookingsForUser } from "@/lib/services/booking.service";
import { reportServerError } from "@/lib/observability/report";

// Shape check of the request body (audit 24/10/2026). The business rules (guest count limits, schedule, gate) stay in
// createBookingForUser; this only refuses malformed input with 400 instead of coercing it or failing with 500.
const createBookingBodySchema = z.object({
  tripId: z.string().trim().min(1).max(64),
  scheduleId: z.string().trim().min(1).max(64).optional(),
  guestCount: z.number().int().min(1).max(1000).optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const bookings = await listBookingsForUser(session.user.id);
    return NextResponse.json(bookings);
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    reportServerError({ source: "api_route", where: "api/bookings:GET", error });
    return NextResponse.json({ error: "Erro ao carregar bookings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body: unknown = await req.json().catch(() => null);
    const parsed = createBookingBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados da reserva invalidos" }, { status: 400 });
    }
    const created = await createBookingForUser(session.user.id, parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isDomainError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    reportServerError({ source: "api_route", where: "api/bookings:POST", error });
    return NextResponse.json({ error: "Erro ao criar booking" }, { status: 500 });
  }
}
