-- Rollback of 20261027120000_rt124_guest_booking_contact_email (local only). Drops ONLY the column that migration added.
ALTER TABLE "BookingContact" DROP COLUMN IF EXISTS "email";
