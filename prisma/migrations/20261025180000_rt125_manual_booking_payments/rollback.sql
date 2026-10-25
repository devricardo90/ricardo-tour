-- Rollback of 20261025180000_rt125_manual_booking_payments (local only). Drops ONLY what that migration created.
-- WARNING: on a database that recorded real payments this deletes the financial history; never run it there.
DROP TRIGGER IF EXISTS "BookingPaymentEvent_append_only" ON "BookingPaymentEvent";
DROP TRIGGER IF EXISTS "BookingPayment_guard" ON "BookingPayment";
DROP FUNCTION IF EXISTS "rt_refuse_change"();
DROP FUNCTION IF EXISTS "rt_booking_payment_guard"();
DROP TABLE IF EXISTS "BookingPaymentEvent";
DROP TABLE IF EXISTS "BookingPayment";
