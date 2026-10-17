-- Rollback of the approval fingerprint: removes only the CHECK and the column. ORDER: revert the code first (the current
-- code selects approvedContentHash), and set approved rows back to DRAFT before rolling back, because older code trusts
-- status-only approval (an approved-then-edited row would become public). Single transaction.
BEGIN;
ALTER TABLE "TripContent" DROP CONSTRAINT IF EXISTS "TripContent_approval_hash_check";
ALTER TABLE "TripContent" DROP COLUMN IF EXISTS "approvedContentHash";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017200000_rt113_approval_fingerprint';
COMMIT;
