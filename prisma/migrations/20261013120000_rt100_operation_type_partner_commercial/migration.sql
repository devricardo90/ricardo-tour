-- RT-100 (Sprint 9 — Commercial Foundation): OWN/PARTNER catalog structure.
-- Owner decision 2026-10-13 (RT-99). ADDITIVE ONLY: no existing column is renamed, dropped or re-typed and no data is rewritten.
-- Existing trips receive operationType = 'UNCLASSIFIED' (the column DEFAULT) and partnerId = NULL, so they remain
-- unclassified; nothing is presumed OWN or PARTNER. The new commercial tables are created EMPTY: no tariff, cost,
-- commission or markup value is registered by this migration.
-- Rollback (nothing else depends on these objects):
--   ALTER TABLE "Trip" DROP CONSTRAINT "Trip_partner_consistency_check", DROP CONSTRAINT "Trip_partnerId_fkey",
--     DROP COLUMN "operationType", DROP COLUMN "partnerId";
--   DROP TABLE "TripCommercialRate"; DROP TABLE "TripCommercial"; DROP TABLE "Partner";
--   DROP TYPE "CommercialRecordStatus"; DROP TYPE "RemunerationModel"; DROP TYPE "PriceSource";
--   DROP TYPE "PartnerStatus"; DROP TYPE "OperationType";

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('UNCLASSIFIED', 'OWN', 'PARTNER');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('OWNER_SET', 'PARTNER_TARIFF', 'CONTRACT');

-- CreateEnum
CREATE TYPE "RemunerationModel" AS ENUM ('MARKUP', 'COMMISSION');

-- CreateEnum
CREATE TYPE "CommercialRecordStatus" AS ENUM ('UNCONFIRMED', 'CONFIRMED', 'APPROVED_FOR_PUBLICATION');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "operationType" "OperationType" NOT NULL DEFAULT 'UNCLASSIFIED',
ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'INACTIVE',
    "publicLabel" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCommercial" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "priceSource" "PriceSource",
    "tariffReference" TEXT,
    "tariffConfirmedAt" TIMESTAMP(3),
    "tariffConfirmedBy" TEXT,
    "currency" TEXT,
    "remunerationModel" "RemunerationModel",
    "recordStatus" "CommercialRecordStatus" NOT NULL DEFAULT 'UNCONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCommercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCommercialRate" (
    "id" TEXT NOT NULL,
    "tripCommercialId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "seasonLabel" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "netAmountCents" INTEGER,
    "currency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCommercialRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TripCommercial_tripId_key" ON "TripCommercial"("tripId");

-- CreateIndex
CREATE INDEX "TripCommercialRate_tripCommercialId_idx" ON "TripCommercialRate"("tripCommercialId");

-- CreateIndex
CREATE INDEX "Trip_partnerId_idx" ON "Trip"("partnerId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCommercial" ADD CONSTRAINT "TripCommercial_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCommercialRate" ADD CONSTRAINT "TripCommercialRate_tripCommercialId_fkey" FOREIGN KEY ("tripCommercialId") REFERENCES "TripCommercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK constraints (Prisma cannot express these; they are the database-level guarantees).

-- A trip is PARTNER if and only if it points to a partner. UNCLASSIFIED and OWN must have no partner.
ALTER TABLE "Trip"
ADD CONSTRAINT "Trip_partner_consistency_check"
CHECK (("operationType" = 'PARTNER') = ("partnerId" IS NOT NULL));

-- Partner slugs are URL-safe lowercase identifiers.
ALTER TABLE "Partner"
ADD CONSTRAINT "Partner_slug_format_check"
CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Currency, when present, is an upper-case ISO 4217 code.
ALTER TABLE "TripCommercial"
ADD CONSTRAINT "TripCommercial_currency_format_check"
CHECK ("currency" IS NULL OR "currency" ~ '^[A-Z]{3}$');

ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_currency_format_check"
CHECK ("currency" IS NULL OR "currency" ~ '^[A-Z]{3}$');

-- An amount can never be stored without its currency, and never negative.
ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_amount_requires_currency_check"
CHECK ("netAmountCents" IS NULL OR "currency" IS NOT NULL);

ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_amount_nonnegative_check"
CHECK ("netAmountCents" IS NULL OR "netAmountCents" >= 0);

-- Price category must be a non-empty code; age and validity ranges must be coherent.
ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_category_not_blank_check"
CHECK (char_length(btrim("category")) > 0);

ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_age_range_check"
CHECK (("ageMin" IS NULL OR "ageMin" >= 0) AND ("ageMin" IS NULL OR "ageMax" IS NULL OR "ageMin" <= "ageMax"));

ALTER TABLE "TripCommercialRate"
ADD CONSTRAINT "TripCommercialRate_validity_range_check"
CHECK ("validFrom" IS NULL OR "validTo" IS NULL OR "validFrom" <= "validTo");
