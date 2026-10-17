-- RT-113 complement (Sprint 10, 17/10/2026): FAQ, public operating conditions, optional services note, media credit and
-- video support. ADDITIVE ONLY: one enum, nullable/defaulted columns, one new table, CHECK rules. No existing column is
-- changed or dropped; existing TripImage rows become mediaType = IMAGE (default) and satisfy every new CHECK.
-- Generated with `prisma migrate diff` from a local database holding all previous migrations; CHECKs added by hand.
-- Validated ONLY on local throw-away databases (localhost:5433/rt113b_*). Never applied to the hosted database.
-- CreateEnum
CREATE TYPE "TripMediaType" AS ENUM ('IMAGE', 'VIDEO');
-- AlterTable
ALTER TABLE "TripContent" ADD COLUMN     "operationalConditions" JSONB,
ADD COLUMN     "optionalServicesNote" JSONB;
-- AlterTable
ALTER TABLE "TripImage" ADD COLUMN     "credit" JSONB,
ADD COLUMN     "durationSeconds" DOUBLE PRECISION,
ADD COLUMN     "mediaType" "TripMediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "mobileSrc" TEXT,
ADD COLUMN     "posterSrc" TEXT;
-- CreateTable
CREATE TABLE "TripFaqItem" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TripFaqItem_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "TripFaqItem_tripId_position_key" ON "TripFaqItem"("tripId", "position");
-- AddForeignKey
ALTER TABLE "TripFaqItem" ADD CONSTRAINT "TripFaqItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Database rules (same discipline as 20261016120000_rt113_tour_content_gallery)
ALTER TABLE "TripFaqItem" ADD CONSTRAINT "TripFaqItem_position_check" CHECK ("position" >= 0);
-- A video always has a poster; an image never has one.
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_media_poster_check" CHECK ((("mediaType" = 'VIDEO') = ("posterSrc" IS NOT NULL)));
-- Video-only fields stay empty on images.
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_media_video_fields_check" CHECK ("mediaType" = 'VIDEO' OR ("mobileSrc" IS NULL AND "durationSeconds" IS NULL));
-- A video is never the cover image.
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_media_cover_check" CHECK (NOT ("mediaType" = 'VIDEO' AND "isCover"));
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_duration_check" CHECK ("durationSeconds" IS NULL OR "durationSeconds" > 0);
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_media_src_check" CHECK (("posterSrc" IS NULL OR length(btrim("posterSrc")) > 0) AND ("mobileSrc" IS NULL OR length(btrim("mobileSrc")) > 0));
