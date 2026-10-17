-- RT-113 (RT-RB-S10-03): structured tour content + gallery. ADDITIVE ONLY: new enums and tables, no change to any
-- existing table, column or row. Validated only on local throw-away databases. NOT authorized for the hosted database.
-- Rollback: rollback.sql in this folder (drops only what this migration created).
-- CreateEnum
CREATE TYPE "TripContentStatus" AS ENUM ('DRAFT', 'OWNER_APPROVED');

-- CreateEnum
CREATE TYPE "TripImageRightsStatus" AS ENUM ('UNVERIFIED', 'OWNER_ATTESTED', 'LICENSED');

-- CreateTable
CREATE TABLE "TripContent" (
    "tripId" TEXT NOT NULL,
    "status" "TripContentStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT,
    "summary" JSONB,
    "description" JSONB,
    "durationLabel" JSONB,
    "meetingPoint" JSONB,
    "startTimeNote" JSONB,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inclusions" JSONB,
    "exclusions" JSONB,
    "requirements" JSONB,
    "accessibility" JSONB,
    "weatherPolicy" JSONB,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripContent_pkey" PRIMARY KEY ("tripId")
);

-- CreateTable
CREATE TABLE "TripItineraryStop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripItineraryStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripImage" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "alt" JSONB NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "focalX" DOUBLE PRECISION,
    "focalY" DOUBLE PRECISION,
    "rightsStatus" "TripImageRightsStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "rightsNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripItineraryStop_tripId_position_key" ON "TripItineraryStop"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TripImage_tripId_position_key" ON "TripImage"("tripId", "position");

-- AddForeignKey
ALTER TABLE "TripContent" ADD CONSTRAINT "TripContent_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripItineraryStop" ADD CONSTRAINT "TripItineraryStop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RT-113 database rules (not representable in the Prisma schema)
ALTER TABLE "TripItineraryStop" ADD CONSTRAINT "TripItineraryStop_position_check" CHECK ("position" >= 0);
ALTER TABLE "TripItineraryStop" ADD CONSTRAINT "TripItineraryStop_duration_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" > 0);
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_position_check" CHECK ("position" >= 0);
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_src_check" CHECK (length(btrim("src")) > 0);
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_focal_check" CHECK (("focalX" IS NULL OR ("focalX" >= 0 AND "focalX" <= 1)) AND ("focalY" IS NULL OR ("focalY" >= 0 AND "focalY" <= 1)));
-- An OWNER_APPROVED content row must record when it was approved; a DRAFT row must not claim an approval date.
ALTER TABLE "TripContent" ADD CONSTRAINT "TripContent_approval_check" CHECK ((("status" = 'OWNER_APPROVED') = ("approvedAt" IS NOT NULL)));
