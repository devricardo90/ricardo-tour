'use server'

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/authz";
import { isDomainError } from "@/lib/errors/domain-error";
import { reportServerError } from "@/lib/observability/report";
import {
  getBookingPaymentsOverview,
  recordBookingPayment,
  transitionBookingPayment,
  type AdminActor,
} from "@/lib/services/booking-payment.service";

/**
 * RT-125 admin actions. Every call authenticates the ADMIN first (requireAdminSession throws for anonymous or non-admin
 * sessions, before any input is read) and passes the admin as the responsible actor. Errors return a message only;
 * nothing about the payment input is logged.
 */
async function adminActor(): Promise<AdminActor> {
  const session = await requireAdminSession();
  return { userId: session.user.id, role: "ADMIN" };
}

function revalidateBooking(bookingId: string, locale?: string) {
  revalidatePath(`/admin/bookings/${bookingId}`);
  if (locale) revalidatePath(`/${locale}/admin/bookings/${bookingId}`);
}

export async function getBookingPaymentsAction(bookingId: string) {
  const actor = await adminActor();
  return getBookingPaymentsOverview(actor, bookingId);
}

export async function recordBookingPaymentAction(input: unknown, locale?: string) {
  const actor = await adminActor();
  try {
    const result = await recordBookingPayment(actor, input);
    revalidateBooking(result.payment.bookingId, locale);
    return { success: true as const, replayed: result.replayed };
  } catch (error) {
    if (isDomainError(error)) return { error: error.message, code: error.code };
    reportServerError({ source: "server_action", where: "admin:recordBookingPayment", error });
    return { error: "Falha ao registrar pagamento." };
  }
}

export async function transitionBookingPaymentAction(input: unknown, locale?: string) {
  const actor = await adminActor();
  try {
    const result = await transitionBookingPayment(actor, input);
    revalidateBooking(result.payment.bookingId, locale);
    return { success: true as const, replayed: result.replayed };
  } catch (error) {
    if (isDomainError(error)) return { error: error.message, code: error.code };
    reportServerError({ source: "server_action", where: "admin:transitionBookingPayment", error });
    return { error: "Falha ao atualizar pagamento." };
  }
}
