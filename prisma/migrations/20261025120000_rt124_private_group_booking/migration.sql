-- RT-124 private group booking (25/10/2026, local Sprint 11). Owner model: closed price per group, adults and children
-- (infants 0-2 at 50%), deposit + balance, one private group per schedule slot.
-- ADDITIVE ONLY: three nullable Booking columns, three new tables, CHECK constraints and two immutability triggers.
-- No existing row is rewritten; legacy bookings keep pricingModel = NULL. No price is stored by this migration.
-- Validated ONLY on local throw-away databases. Never applied to a hosted database.

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "fullFareCount" INTEGER,
ADD COLUMN     "infantCount" INTEGER,
ADD COLUMN     "pricingModel" TEXT;

-- CreateTable
CREATE TABLE "BookingQuote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "priceTableId" TEXT NOT NULL,
    "priceTableVersion" TEXT NOT NULL,
    "participants" INTEGER NOT NULL,
    "fullFareCount" INTEGER NOT NULL,
    "infantCount" INTEGER NOT NULL,
    "groupTotalCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "prepaidTicketsCents" INTEGER NOT NULL,
    "depositBasisPoints" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingContact" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingQuote_bookingId_key" ON "BookingQuote"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingContact_bookingId_key" ON "BookingContact"("bookingId");

-- CreateIndex
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingQuote" ADD CONSTRAINT "BookingQuote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingContact" ADD CONSTRAINT "BookingContact_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A private-group booking carries a consistent composition (legacy rows: all three NULL).
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_private_group_check" CHECK (
  ("pricingModel" IS NULL AND "fullFareCount" IS NULL AND "infantCount" IS NULL)
  OR ("pricingModel" = 'PRIVATE_GROUP' AND "fullFareCount" >= 1 AND "infantCount" >= 0
      AND "guestCount" = "fullFareCount" + "infantCount")
);

-- The quote snapshot is internally consistent: participants add up, deposit + balance = total, deposit covers tickets.
ALTER TABLE "BookingQuote" ADD CONSTRAINT "BookingQuote_amounts_check" CHECK (
  "fullFareCount" >= 1 AND "infantCount" >= 0 AND "participants" = "fullFareCount" + "infantCount"
  AND "groupTotalCents" > 0 AND "totalCents" > 0 AND "prepaidTicketsCents" >= 0
  AND "depositBasisPoints" BETWEEN 0 AND 10000
  AND "depositCents" >= "prepaidTicketsCents" AND "balanceCents" >= 0
  AND "depositCents" + "balanceCents" = "totalCents"
  AND "currency" = 'BRL'
);

-- Quote snapshots and booking events are never edited: a correction is a new event (or a new booking), never an UPDATE
-- of what the customer was shown or of the history. Deleting a booking still cascades (no DELETE trigger).
CREATE FUNCTION "rt_refuse_update"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% rows are immutable (RT-124)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
END;
$$;

CREATE TRIGGER "BookingQuote_immutable" BEFORE UPDATE ON "BookingQuote" FOR EACH ROW EXECUTE FUNCTION "rt_refuse_update"();
CREATE TRIGGER "BookingEvent_immutable" BEFORE UPDATE ON "BookingEvent" FOR EACH ROW EXECUTE FUNCTION "rt_refuse_update"();
