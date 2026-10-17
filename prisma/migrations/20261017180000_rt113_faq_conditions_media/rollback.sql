-- RT-113 complement rollback: removes ONLY the objects added by migration.sql (FAQ rows, the two TripContent fields and
-- the media columns are lost; every pre-existing column and row is untouched). Single transaction; also removes the
-- "_prisma_migrations" row of this migration.
BEGIN;
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_media_src_check";
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_duration_check";
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_media_cover_check";
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_media_video_fields_check";
ALTER TABLE "TripImage" DROP CONSTRAINT IF EXISTS "TripImage_media_poster_check";
DROP TABLE IF EXISTS "TripFaqItem";
ALTER TABLE "TripImage" DROP COLUMN IF EXISTS "credit", DROP COLUMN IF EXISTS "durationSeconds", DROP COLUMN IF EXISTS "mediaType", DROP COLUMN IF EXISTS "mobileSrc", DROP COLUMN IF EXISTS "posterSrc";
ALTER TABLE "TripContent" DROP COLUMN IF EXISTS "operationalConditions", DROP COLUMN IF EXISTS "optionalServicesNote";
DROP TYPE IF EXISTS "TripMediaType";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261017180000_rt113_faq_conditions_media';
COMMIT;
