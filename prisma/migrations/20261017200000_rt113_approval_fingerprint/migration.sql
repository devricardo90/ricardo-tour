-- RT-113 data model, approval fingerprint (17/10/2026), prepared for RT-119. ADDITIVE ONLY: one nullable column and one
-- CHECK. Existing rows satisfy the CHECK (the column is NULL). Approved rows without a fingerprint are simply never public
-- (the gate requires the fingerprint to match the current content): fail-closed, no data rewritten.
-- Validated ONLY on local throw-away databases. Never applied to the hosted database.
-- AlterTable
ALTER TABLE "TripContent" ADD COLUMN "approvedContentHash" TEXT;

-- A fingerprint can only exist on approved content (a DRAFT never carries an approval).
ALTER TABLE "TripContent" ADD CONSTRAINT "TripContent_approval_hash_check" CHECK ("approvedContentHash" IS NULL OR ("status" = 'OWNER_APPROVED' AND "approvedContentHash" ~ '^[0-9a-f]{64}$'));
