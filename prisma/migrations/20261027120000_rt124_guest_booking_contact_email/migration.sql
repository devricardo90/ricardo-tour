-- RT-124 (27/10/2026, local only): a booking requested from the public tour page without an account keeps the
-- customer's e-mail in its contact row (personal data: shown only to ADMIN). Additive and nullable: existing rows keep NULL.
ALTER TABLE "BookingContact" ADD COLUMN "email" TEXT;
