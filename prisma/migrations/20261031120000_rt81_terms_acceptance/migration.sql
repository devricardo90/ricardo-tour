-- RT-81 (31/10/2026, local only): the booking request records which versions of the Terms of Use and of the Privacy
-- Policy the customer accepted, and when. Stored on the immutable quote (the BookingQuote_immutable trigger refuses
-- UPDATE), so the record cannot change after the request. Additive and nullable: existing rows keep NULL and the code
-- currently in production never reads these columns.
ALTER TABLE "BookingQuote" ADD COLUMN "termsVersion" TEXT;
ALTER TABLE "BookingQuote" ADD COLUMN "privacyVersion" TEXT;
ALTER TABLE "BookingQuote" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
