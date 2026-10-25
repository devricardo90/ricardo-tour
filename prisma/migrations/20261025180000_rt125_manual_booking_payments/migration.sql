-- RT-125 manual payment control for private bookings (25/10/2026, local Sprint 11). Owner: payments by Pix, card
-- terminal ("maquininha") or cash are REGISTERED by an authenticated ADMIN; nothing is charged, no card data is stored,
-- a receipt is never confirmed automatically. Deposit and balance are tracked separately against the quote snapshot.
-- ADDITIVE ONLY: two new tables, CHECK constraints and integrity triggers. No existing row is touched.
-- Validated ONLY on local throw-away databases. Never applied to a hosted database.

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPaymentEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingPayment_idempotencyKey_key" ON "BookingPayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingPayment_bookingId_createdAt_idx" ON "BookingPayment"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPaymentEvent_idempotencyKey_key" ON "BookingPaymentEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BookingPaymentEvent_bookingId_createdAt_idx" ON "BookingPaymentEvent"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingPaymentEvent_paymentId_createdAt_idx" ON "BookingPaymentEvent"("paymentId", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentEvent" ADD CONSTRAINT "BookingPaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BookingPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPaymentEvent" ADD CONSTRAINT "BookingPaymentEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_values_check" CHECK (
  "kind" IN ('DEPOSIT', 'BALANCE')
  AND "method" IN ('PIX', 'CARD_TERMINAL', 'CASH')
  AND "status" IN ('PENDING', 'RECORDED', 'CONFIRMED', 'CANCELED', 'REFUNDED')
  AND "amountCents" > 0
  AND length("idempotencyKey") BETWEEN 16 AND 100
  AND ("reference" IS NULL OR length("reference") <= 80)
);

ALTER TABLE "BookingPaymentEvent" ADD CONSTRAINT "BookingPaymentEvent_values_check" CHECK (
  "type" IN ('CREATED', 'RECORDED', 'CONFIRMED', 'CANCELED', 'REFUNDED')
  AND "toStatus" IN ('PENDING', 'RECORDED', 'CONFIRMED', 'CANCELED', 'REFUNDED')
  AND ("fromStatus" IS NULL OR "fromStatus" IN ('PENDING', 'RECORDED', 'CONFIRMED'))
  AND "amountCents" > 0
  AND length("idempotencyKey") BETWEEN 16 AND 100
  AND ("note" IS NULL OR length("note") <= 300)
);

-- A payment line keeps its booking, kind, method, amount, reference, author and key forever; only the status moves,
-- and only along the allowed transitions. It is never deleted (the history and the totals depend on it).
CREATE FUNCTION "rt_booking_payment_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'BookingPayment rows are never deleted (RT-125)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."bookingId" IS DISTINCT FROM OLD."bookingId" OR NEW."kind" IS DISTINCT FROM OLD."kind"
     OR NEW."method" IS DISTINCT FROM OLD."method" OR NEW."amountCents" IS DISTINCT FROM OLD."amountCents"
     OR NEW."reference" IS DISTINCT FROM OLD."reference" OR NEW."idempotencyKey" IS DISTINCT FROM OLD."idempotencyKey"
     OR NEW."createdByUserId" IS DISTINCT FROM OLD."createdByUserId" OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
     OR NEW."id" IS DISTINCT FROM OLD."id" THEN
    RAISE EXCEPTION 'BookingPayment: only the status may change (RT-125)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."status" IS DISTINCT FROM OLD."status" AND NOT (
       (OLD."status" = 'PENDING' AND NEW."status" IN ('RECORDED', 'CANCELED'))
    OR (OLD."status" = 'RECORDED' AND NEW."status" IN ('CONFIRMED', 'CANCELED'))
    OR (OLD."status" = 'CONFIRMED' AND NEW."status" = 'REFUNDED')
  ) THEN
    RAISE EXCEPTION 'BookingPayment: transition % -> % not allowed (RT-125)', OLD."status", NEW."status" USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "BookingPayment_guard" BEFORE UPDATE OR DELETE ON "BookingPayment" FOR EACH ROW EXECUTE FUNCTION "rt_booking_payment_guard"();

-- The financial history is append-only: no UPDATE, no DELETE.
CREATE FUNCTION "rt_refuse_change"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only (RT-125)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
END;
$$;

CREATE TRIGGER "BookingPaymentEvent_append_only" BEFORE UPDATE OR DELETE ON "BookingPaymentEvent" FOR EACH ROW EXECUTE FUNCTION "rt_refuse_change"();
