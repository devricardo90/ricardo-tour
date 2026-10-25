-- Rollback of 20261025120000_rt124_private_group_booking (local only). Drops ONLY what that migration created.
DROP TRIGGER IF EXISTS "BookingEvent_immutable" ON "BookingEvent";
DROP TRIGGER IF EXISTS "BookingQuote_immutable" ON "BookingQuote";
DROP FUNCTION IF EXISTS "rt_refuse_update"();
DROP TABLE IF EXISTS "BookingEvent";
DROP TABLE IF EXISTS "BookingContact";
DROP TABLE IF EXISTS "BookingQuote";
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_private_group_check";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "infantCount", DROP COLUMN IF EXISTS "fullFareCount", DROP COLUMN IF EXISTS "pricingModel";
