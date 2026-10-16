-- RT-113 rollback: removes ONLY the objects created by migration.sql (content of these tables is lost; no existing
-- table is touched). Run inside a transaction, then delete the "_prisma_migrations" row of this migration.
BEGIN;
DROP TABLE IF EXISTS "TripImage";
DROP TABLE IF EXISTS "TripItineraryStop";
DROP TABLE IF EXISTS "TripContent";
DROP TYPE IF EXISTS "TripImageRightsStatus";
DROP TYPE IF EXISTS "TripContentStatus";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20261016120000_rt113_tour_content_gallery';
COMMIT;
