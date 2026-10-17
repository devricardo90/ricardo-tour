-- Rollback of the durable approval invalidation + media publication authorization. ORDER: revert the code first (the
-- current code selects the new columns and relies on the triggers). Removes only the objects created by migration.sql,
-- after demoting every approved content to DRAFT (without the per-media authorization the previous gate would show
-- every verified item again: fail-closed, a new review is required). Single transaction.
BEGIN;
UPDATE "TripContent" SET "status" = 'DRAFT', "approvedAt" = NULL, "approvedContentHash" = NULL WHERE "status" = 'OWNER_APPROVED';
DROP TRIGGER IF EXISTS "rt_trip_media_truncate_guard" ON "TripImage";
DROP TRIGGER IF EXISTS "rt_trip_faq_truncate_guard" ON "TripFaqItem";
DROP TRIGGER IF EXISTS "rt_trip_stop_truncate_guard" ON "TripItineraryStop";
DROP TRIGGER IF EXISTS "rt_trip_public_guard" ON "Trip";
DROP FUNCTION IF EXISTS "rt_trip_children_truncate_guard"();
DROP FUNCTION IF EXISTS "rt_trip_public_guard"();
DROP TRIGGER IF EXISTS "rt_trip_media_guard" ON "TripImage";
DROP TRIGGER IF EXISTS "rt_trip_faq_guard" ON "TripFaqItem";
DROP TRIGGER IF EXISTS "rt_trip_stop_guard" ON "TripItineraryStop";
DROP TRIGGER IF EXISTS "rt_trip_content_guard" ON "TripContent";
DROP FUNCTION IF EXISTS "rt_trip_media_guard"();
DROP FUNCTION IF EXISTS "rt_trip_faq_guard"();
DROP FUNCTION IF EXISTS "rt_trip_stop_guard"();
DROP FUNCTION IF EXISTS "rt_trip_content_guard"();
DROP FUNCTION IF EXISTS "rt_invalidate_trip_approval"(TEXT, TEXT);
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_publication_rights_check";
ALTER TABLE "TripImage" DROP COLUMN IF EXISTS "publicationApprovedAt";
ALTER TABLE "TripContent" DROP COLUMN IF EXISTS "approvalInvalidatedAt", DROP COLUMN IF EXISTS "approvalInvalidationReason";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017220000_rt113_durable_approval_media_publication';
COMMIT;
