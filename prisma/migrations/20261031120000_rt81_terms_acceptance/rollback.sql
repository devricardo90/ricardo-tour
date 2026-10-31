-- Rollback of 20261031120000_rt81_terms_acceptance (drops the acceptance record of every request made since).
ALTER TABLE "BookingQuote" DROP COLUMN IF EXISTS "termsAcceptedAt";
ALTER TABLE "BookingQuote" DROP COLUMN IF EXISTS "privacyVersion";
ALTER TABLE "BookingQuote" DROP COLUMN IF EXISTS "termsVersion";
