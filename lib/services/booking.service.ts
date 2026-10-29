import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { isBookingBlockedForUnapprovedPrice } from "@/lib/catalog/price-on-request";
import { getPublicTripById } from "@/lib/catalog/public-trips";
import type { BookingActor, BookingEventType, BookingStatusValue } from "@/lib/booking/booking-state";

const USER_CANCELLATION_WINDOW_HOURS = 24;

/**
 * Serialization key for the booking write. With a schedule, every booking of that schedule shares the key (capacity is
 * per schedule); without one, the key is per user and trip (the duplicate check). Used with pg_advisory_xact_lock, so
 * the lock is released automatically when the transaction ends.
 */
export function bookingLockKey(userId: string, tripId: string, scheduleId?: string) {
    return scheduleId ? `booking:schedule:${scheduleId}` : `booking:user-trip:${userId}:${tripId}`;
}

/**
 * Bounds for the serialized booking write. Prisma's transaction timeout does not cancel a statement that waits on the
 * advisory lock (audit 24/10/2026: a request stayed blocked for as long as the lock was held), so the wait is bounded
 * on the server with a transaction-local lock_timeout, shorter than the transaction timeout. Both are compatible with
 * a transaction-mode pooler (set_config(..., true) and the xact lock end with the transaction).
 */
export const BOOKING_LOCK_TIMEOUT = "2s";
export const BOOKING_TRANSACTION_OPTIONS = { maxWait: 2_000, timeout: 5_000 } as const;

/**
 * RT-124: a status change and its history row are written together. The write is conditional on the exact status that
 * was read, so the recorded "from" status is the real one; a concurrent change makes the write affect 0 rows and
 * nothing is recorded. Returns false when the booking was no longer in `from`.
 */
async function transitionBooking(input: {
    bookingId: string;
    userId?: string;
    from: BookingStatusValue;
    to: BookingStatusValue;
    type: BookingEventType;
    actor: BookingActor;
}, inTx?: Prisma.TransactionClient): Promise<boolean> {
    const write = async (tx: Prisma.TransactionClient) => {
        const updated = await tx.booking.updateMany({
            where: { id: input.bookingId, ...(input.userId ? { userId: input.userId } : {}), status: input.from },
            data: { status: input.to },
        });
        if (updated.count === 0) return false;
        await tx.bookingEvent.create({
            data: {
                bookingId: input.bookingId,
                type: input.type,
                fromStatus: input.from,
                toStatus: input.to,
                actorUserId: input.actor.userId,
                actorRole: input.actor.role,
            },
        });
        return true;
    };
    return inTx ? write(inTx) : prisma.$transaction(write);
}

const SYSTEM_ACTOR: BookingActor = { userId: null, role: "SYSTEM" };

/** Largest value of a Postgres INTEGER column (Booking.totalPriceCents). */
const MAX_INT4 = 2_147_483_647;

/**
 * True when the booking write could not get the lock, a connection or finish in time: the lock wait hit lock_timeout
 * (SQLSTATE 55P03) or Prisma refused/expired the interactive transaction (P2028). Nothing was written in either case.
 */
export function isBookingBusyError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const candidate = error as { code?: unknown; meta?: unknown; cause?: unknown; message?: unknown };
    if (candidate.code === "P2028" || candidate.code === "55P03") return true;
    const text = `${typeof candidate.message === "string" ? candidate.message : ""} ${safeJson(candidate.meta)} ${safeJson(candidate.cause)}`;
    return /55P03|lock timeout|canceling statement due to lock timeout/i.test(text);
}

function safeJson(value: unknown) {
    try {
        return value === undefined ? "" : JSON.stringify(value);
    } catch {
        return "";
    }
}

/** A guest count must be an integer from 1 (absent means 1); fractions, zero, negatives and non-numbers are refused. */
export function parseGuestCount(value: unknown): number {
    if (value === undefined || value === null) return 1;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
        throw new DomainError("Quantidade de hospedes invalida.", {
            code: "INVALID_GUEST_COUNT",
            status: 400,
        });
    }
    return value;
}

export interface CreateBookingInput {
    tripId: string;
    scheduleId?: string;
    guestCount?: number;
}

export async function listBookingsForUser(userId: string) {
    return prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            trip: { select: { id: true, title: true, city: true, priceCents: true } },
            schedule: { select: { startAt: true } },
        },
    });
}

export async function getBookingForUser(bookingId: string, userId: string) {
    const normalizedBookingId = typeof bookingId === "string" ? bookingId.trim() : "";

    if (!normalizedBookingId) {
        throw new DomainError("bookingId invalido", {
            code: "INVALID_BOOKING_ID",
            status: 400,
        });
    }

    return prisma.booking.findFirst({
        where: {
            id: normalizedBookingId,
            userId,
        },
        include: {
            trip: { select: { id: true, title: true, city: true, priceCents: true } },
            schedule: { select: { startAt: true, endAt: true, pricePerPersonCents: true } },
        },
    });
}

export async function listAllBookings() {
    return prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            trip: { select: { id: true, title: true, city: true, priceCents: true } },
            schedule: { select: { startAt: true } },
            user: { select: { name: true, email: true } },
            // RT-124: a request from the tour page belongs to the site's request account; the customer is the contact.
            contact: { select: { fullName: true, email: true } },
        },
    });
}

/**
 * Busca uma reserva pelo ID com todos os dados relevantes para visualizacao admin.
 * Somente leitura (RT-013G).
 */
export async function getBookingById(id: string) {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            // RT-124: append-only history of the booking status (who confirmed or canceled, and when).
            events: {
                select: { id: true, type: true, fromStatus: true, toStatus: true, actorUserId: true, actorRole: true, createdAt: true },
                orderBy: { createdAt: "asc" },
            },
            user: { select: { name: true, email: true } },
            trip: { select: { id: true, title: true, city: true, location: true, priceCents: true } },
            schedule: { select: { startAt: true, endAt: true, capacity: true, pricePerPersonCents: true, status: true } },
            // RT-124: closed group price of a private booking (read only; the snapshot itself is immutable).
            quote: { select: { totalCents: true, depositCents: true, balanceCents: true, participants: true, fullFareCount: true, infantCount: true, priceTableId: true, priceTableVersion: true } },
            // RT-124: the customer's contact and pickup data (personal data; this read is ADMIN only).
            contact: { select: { fullName: true, email: true, phone: true, language: true, pickupAddress: true, notes: true } },
            paymentAttempts: {
                select: { id: true, provider: true, status: true, amountCents: true, currency: true, paidAt: true, createdAt: true },
                orderBy: { createdAt: "desc" },
            },
            emailLogs: {
                select: { id: true, template: true, status: true, sentAt: true, createdAt: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!booking) return null;
    // Names of the people who acted on the booking (the event row keeps only the id, by design).
    const actorIds = [...new Set(booking.events.map((event) => event.actorUserId).filter((value): value is string => !!value))];
    const actors = actorIds.length
        ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
        : [];
    const actorNames = new Map(actors.map((actor) => [actor.id, actor.name]));
    return {
        ...booking,
        events: booking.events.map((event) => ({ ...event, actorName: event.actorUserId ? actorNames.get(event.actorUserId) ?? null : null })),
    };
}

/**
 * Cancela uma reserva pelo admin. Somente PENDING ou CONFIRMED podem ser cancelados.
 * Reservas ja CANCELED sao tratadas como idempotente.
 * Nao altera paymentStatus. Nao envia e-mail. Nao registra analytics.
 * Admin nao segue janela de 24h. Funcao separada de cancelBookingForUser (RT-014B).
 */
export async function cancelBookingByAdmin(bookingId: string, actor: BookingActor = SYSTEM_ACTOR) {
    const normalizedId = typeof bookingId === "string" ? bookingId.trim() : "";

    if (!normalizedId) {
        throw new DomainError("bookingId invalido", {
            code: "INVALID_BOOKING_ID",
            status: 400,
        });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: normalizedId },
        select: { id: true, status: true },
    });

    if (!booking) {
        throw new DomainError("Reserva nao encontrada", {
            code: "BOOKING_NOT_FOUND",
            status: 404,
        });
    }

    // Idempotente: ja cancelada
    if (booking.status === "CANCELED") {
        return { id: booking.id, status: "CANCELED" as const };
    }

    // Apenas PENDING e CONFIRMED sao permitidos
    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
        throw new DomainError(
            `Cancelamento nao permitido para o status atual da reserva`,
            {
                code: "INVALID_STATUS_FOR_CANCELLATION",
                status: 400,
            }
        );
    }

    // Altera apenas booking.status — paymentStatus permanece intacto. Gravacao condicional ao status lido: uma
    // mudanca concorrente nao e sobrescrita (auditoria 24/10/2026); o historico registra a transicao (RT-124).
    const changed = await transitionBooking({ bookingId: normalizedId, from: booking.status, to: "CANCELED", type: "CANCELED_BY_ADMIN", actor });

    if (!changed) {
        const current = await prisma.booking.findUnique({ where: { id: normalizedId }, select: { status: true } });
        if (current?.status === "CANCELED") {
            return { id: normalizedId, status: "CANCELED" as const };
        }
        throw new DomainError("A reserva mudou durante a operacao. Atualize a pagina.", {
            code: "BOOKING_STATUS_CHANGED",
            status: 409,
        });
    }

    return { id: normalizedId, status: "CANCELED" as const };
}

/**
 * Confirma uma reserva pelo admin. Somente PENDING pode ser confirmado.
 * Nao altera paymentStatus. Nao envia e-mail. Nao registra analytics.
 */
export async function confirmBookingByAdmin(bookingId: string, actor: BookingActor = SYSTEM_ACTOR) {
    const normalizedId = typeof bookingId === "string" ? bookingId.trim() : "";

    if (!normalizedId) {
        throw new DomainError("bookingId invalido", {
            code: "INVALID_BOOKING_ID",
            status: 400,
        });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: normalizedId },
        select: { id: true, status: true, paymentStatus: true, pricingModel: true, quote: { select: { depositCents: true } } },
    });

    if (!booking) {
        throw new DomainError("Reserva nao encontrada", {
            code: "BOOKING_NOT_FOUND",
            status: 404,
        });
    }

    if (booking.status !== "PENDING") {
        throw new DomainError("Confirmacao permitida apenas para reservas pendentes.", {
            code: "INVALID_STATUS_FOR_CONFIRMATION",
            status: 400,
        });
    }

    // MVP policy (Owner, 27/10/2026): a private booking is confirmed only after the 30% deposit was received AND verified
    // (RT-125 payment lines CONFIRMED by an ADMIN). Recorded-but-unverified money does not count. Still an explicit
    // admin action: a confirmed deposit never confirms the booking by itself.
    // The deposit check and the write run in one transaction under the booking's payment lock (the lock every payment
    // change takes), so a refund of the deposit cannot land between the check and the confirmation (review 29/10/2026).
    const confirmUnderPaymentLock = async (tx: Prisma.TransactionClient) => {
        if (booking.pricingModel === "PRIVATE_GROUP") {
            await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
            await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${`booking-payments:${normalizedId}`}))) AS l`;
            const deposit = await tx.bookingPayment.aggregate({
                where: { bookingId: normalizedId, kind: "DEPOSIT", status: "CONFIRMED" },
                _sum: { amountCents: true },
            });
            const required = booking.quote?.depositCents ?? Number.POSITIVE_INFINITY;
            if ((deposit._sum.amountCents ?? 0) < required) {
                throw new DomainError("Confirme o recebimento do sinal de 30% antes de confirmar a reserva.", {
                    code: "DEPOSIT_NOT_CONFIRMED",
                    status: 409,
                });
            }
        }

        // Gravacao condicional: so confirma se a reserva ainda estiver PENDING no momento da escrita. Sem isso, um
        // cancelamento feito entre a leitura e a escrita era sobrescrito e a reserva voltava a ocupar lugares ja liberados
        // (auditoria 24/10/2026: 6 hospedes numa agenda de 4). Confirmar nao muda a ocupacao (PENDING ja conta).
        return transitionBooking({ bookingId: normalizedId, from: "PENDING", to: "CONFIRMED", type: "CONFIRMED", actor }, tx);
    };
    let changed: boolean;
    try {
        changed = await prisma.$transaction(confirmUnderPaymentLock, BOOKING_TRANSACTION_OPTIONS);
    } catch (error) {
        if (!(error instanceof DomainError) && isBookingBusyError(error)) {
            throw new DomainError("Operacao em andamento nesta reserva. Tente novamente.", { code: "BOOKING_BUSY", status: 409 });
        }
        throw error;
    }

    if (!changed) {
        throw new DomainError("A reserva mudou durante a operacao e nao esta mais pendente. Atualize a pagina.", {
            code: "BOOKING_STATUS_CHANGED",
            status: 409,
        });
    }

    return { id: booking.id, status: "CONFIRMED" as const, paymentStatus: booking.paymentStatus };
}

export async function createBookingForUser(userId: string, input: CreateBookingInput) {
    const tripId = typeof input.tripId === "string" ? input.tripId.trim() : "";
    const scheduleId = typeof input.scheduleId === "string" ? input.scheduleId.trim() : undefined;

    if (!tripId) {
        throw new DomainError("Campo obrigatorio: tripId", {
            code: "INVALID_TRIP_ID",
            status: 400,
        });
    }

    // RT-110 (local, Owner 18/10/2026): no new booking for a tour whose commercial price is not approved (the stored
    // price is obsolete). Checked on the server before any database access; existing bookings are not changed.
    if (isBookingBlockedForUnapprovedPrice(tripId)) {
        throw new DomainError("Este passeio e reservado mediante solicitacao de disponibilidade. Fale com a equipe pelo WhatsApp.", {
            code: "PRICE_NOT_APPROVED",
            status: 409,
        });
    }

    // Before 24/10/2026 the count was floored (0.5 became a 0-guest booking); now only integers from 1 are accepted.
    const guestCount = parseGuestCount(input.guestCount);

    // RT-110: the booking API applies the same public catalog gate as the tour page and the request form (launch
    // allowlist, published, Rio, active and identified partner, data integrity). A trip hidden from visitors answers
    // exactly like a missing one, so the API does not reveal that it exists.
    if (!(await getPublicTripById(tripId))) {
        throw new DomainError("Trip nao encontrada", {
            code: "TRIP_NOT_FOUND",
            status: 404,
        });
    }

    const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
            id: true,
            priceCents: true,
            maxGuests: true,
            schedules: {
                where: { status: "OPEN" },
                select: { id: true },
                take: 1,
            },
        },
    });

    if (!trip) {
        throw new DomainError("Trip nao encontrada", {
            code: "TRIP_NOT_FOUND",
            status: 404,
        });
    }

    const hasOpenSchedules = trip.schedules.length > 0;

    if (hasOpenSchedules && !scheduleId) {
        throw new DomainError("Selecione uma data disponivel para concluir a reserva.", {
            code: "SCHEDULE_REQUIRED",
            status: 400,
        });
    }

    if (trip.maxGuests && guestCount > trip.maxGuests) {
        throw new DomainError(`Maximo de ${trip.maxGuests} hospedes para esta viagem.`, {
            code: "MAX_GUESTS_EXCEEDED",
            status: 400,
        });
    }

    // The duplicate check, the capacity check and the insert run in one transaction under an advisory lock, so two
    // concurrent requests cannot both pass the checks and overbook a schedule or create the same booking twice.
    // The lock wait is bounded (BOOKING_LOCK_TIMEOUT); a busy lock or an expired transaction answers 409 BOOKING_BUSY
    // ("try again") instead of a generic 500, and nothing is written.
    try {
        return await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT set_config('lock_timeout', ${BOOKING_LOCK_TIMEOUT}, true) AS lock_timeout`;
            await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${bookingLockKey(userId, tripId, scheduleId)}))) AS l`;

            const duplicateBooking = await tx.booking.findFirst({
                where: scheduleId
                    ? {
                          userId,
                          scheduleId,
                          status: { in: ["PENDING", "CONFIRMED"] },
                      }
                    : {
                          userId,
                          tripId,
                          scheduleId: null,
                          status: { in: ["PENDING", "CONFIRMED"] },
                      },
                select: { id: true },
            });

            if (duplicateBooking) {
                throw new DomainError(
                    scheduleId ? "Voce ja possui reserva para esta data" : "Voce ja possui reserva para esse passeio",
                    {
                        code: "DUPLICATE_BOOKING",
                        status: 409,
                    }
                );
            }

            let totalPriceCents = trip.priceCents * guestCount;

            if (scheduleId) {
                const [schedule, bookedGuests] = await Promise.all([
                    tx.tripSchedule.findUnique({
                        where: { id: scheduleId },
                        select: {
                            id: true,
                            tripId: true,
                            capacity: true,
                            pricePerPersonCents: true,
                            status: true,
                            startAt: true,
                        },
                    }),
                    tx.booking.aggregate({
                        where: {
                            scheduleId,
                            status: { in: ["PENDING", "CONFIRMED"] },
                        },
                        _sum: { guestCount: true },
                    }),
                ]);

                // A schedule that already started is not bookable, even if nobody closed it (the public page hides past
                // dates, but the API accepted them until 24/10/2026).
                if (
                    !schedule ||
                    schedule.tripId !== tripId ||
                    schedule.status === "CLOSED" ||
                    !(schedule.startAt instanceof Date) ||
                    schedule.startAt.getTime() <= Date.now()
                ) {
                    throw new DomainError("Agenda nao disponivel", {
                        code: "SCHEDULE_UNAVAILABLE",
                        status: 400,
                    });
                }

                const usedCapacity = bookedGuests._sum.guestCount ?? 0;

                if (schedule.capacity > 0 && usedCapacity + guestCount > schedule.capacity) {
                    throw new DomainError("Capacidade esgotada para esta data", {
                        code: "SCHEDULE_CAPACITY_EXCEEDED",
                        status: 400,
                    });
                }

                totalPriceCents = schedule.pricePerPersonCents * guestCount;
            }

            if (!Number.isSafeInteger(totalPriceCents) || totalPriceCents > MAX_INT4) {
                throw new DomainError("Quantidade de hospedes invalida.", {
                    code: "INVALID_GUEST_COUNT",
                    status: 400,
                });
            }

            return tx.booking.create({
                data: {
                    userId,
                    tripId,
                    scheduleId,
                    guestCount,
                    totalPriceCents,
                    status: "PENDING",
                    paymentStatus: "UNPAID",
                },
                include: {
                    trip: { select: { id: true, title: true, city: true, priceCents: true } },
                },
            });
        }, BOOKING_TRANSACTION_OPTIONS);
    } catch (error) {
        if (!(error instanceof DomainError) && isBookingBusyError(error)) {
            throw new DomainError("Muitas solicitacoes para esta data agora. Tente novamente em instantes.", {
                code: "BOOKING_BUSY",
                status: 409,
            });
        }
        throw error;
    }
}

export async function cancelBookingForUser(userId: string, bookingId: string) {
    const normalizedBookingId = typeof bookingId === "string" ? bookingId.trim() : "";

    if (!normalizedBookingId) {
        throw new DomainError("bookingId invalido", {
            code: "INVALID_BOOKING_ID",
            status: 400,
        });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: normalizedBookingId },
        select: {
            id: true,
            userId: true,
            status: true,
            schedule: {
                select: { startAt: true },
            },
        },
    });

    // RT-129: another account's booking answers exactly like a missing one, so booking ids cannot be probed.
    if (!booking || booking.userId !== userId) {
        throw new DomainError("Reserva nao encontrada", {
            code: "BOOKING_NOT_FOUND",
            status: 404,
        });
    }

    if (booking.status === "CANCELED") {
        return { ok: true, status: "CANCELED" as const };
    }

    if (booking.schedule?.startAt) {
        const cancellationDeadline = new Date(
            booking.schedule.startAt.getTime() - USER_CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000
        );

        if (new Date() > cancellationDeadline) {
            throw new DomainError(
                `Cancelamentos online precisam ser feitos com pelo menos ${USER_CANCELLATION_WINDOW_HOURS}h de antecedencia.`,
                {
                    code: "CANCELLATION_WINDOW_EXPIRED",
                    status: 400,
                }
            );
        }
    }

    // Conditional write (audit 24/10/2026): only an active booking of this user is canceled; a concurrent change is
    // never overwritten. The history records the transition (RT-124).
    const changed = await transitionBooking({
        bookingId: normalizedBookingId,
        userId,
        from: booking.status,
        to: "CANCELED",
        type: "CANCELED_BY_USER",
        actor: { userId, role: "USER" },
    });

    if (!changed) {
        const current = await prisma.booking.findUnique({ where: { id: normalizedBookingId }, select: { status: true } });
        if (current?.status === "CANCELED") {
            return { ok: true, status: "CANCELED" as const };
        }
        throw new DomainError("A reserva mudou durante a operacao. Atualize a pagina.", {
            code: "BOOKING_STATUS_CHANGED",
            status: 409,
        });
    }

    return { id: normalizedBookingId, status: "CANCELED" as const };
}
