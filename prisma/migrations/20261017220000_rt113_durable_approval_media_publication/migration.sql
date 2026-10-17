-- RT-113 data model, durable approval invalidation + media publication authorization (17/10/2026), for RT-119.
-- Owner decisions (17/10/2026): (1) any relevant change to approved commercial content requires a new approval and
-- restoring old values never restores it; (2) editorial approval, media rights and publication authorization are
-- separate; a later rights clearance never publishes automatically; a revocation blocks the media immediately; direct
-- data changes must not bypass these controls.
-- ADDITIVE ONLY: three nullable columns, one CHECK, plpgsql functions and triggers (also on "Trip": public fields only;
-- the trigger writes nothing on Trip and acts only when the tour content is approved). No existing row is rewritten
-- (existing media get publicationApprovedAt = NULL → not public until an explicit approval: fail-closed).
-- Validated ONLY on local throw-away databases. Never applied to the hosted database.

-- AlterTable
ALTER TABLE "TripContent" ADD COLUMN "approvalInvalidatedAt" TIMESTAMP(3),
ADD COLUMN "approvalInvalidationReason" TEXT;

-- AlterTable
ALTER TABLE "TripImage" ADD COLUMN "publicationApprovedAt" TIMESTAMP(3);

-- A media item without verified rights can never carry a publication authorization.
ALTER TABLE "TripImage" ADD CONSTRAINT "TripImage_publication_rights_check" CHECK ("publicationApprovedAt" IS NULL OR "rightsStatus" <> 'UNVERIFIED');

-- Demotes an approved tour content to DRAFT and records why (no-op when the content is not approved).
-- The content row is locked FIRST (even when it is DRAFT): an edit and the approval act (which locks the same row) are
-- serialized, so an approval can never record a fingerprint of content that a concurrent edit is changing.
CREATE FUNCTION "rt_invalidate_trip_approval"(p_trip_id TEXT, p_reason TEXT) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM "TripContent" WHERE "tripId" = p_trip_id FOR UPDATE;
  UPDATE "TripContent"
     SET "status" = 'DRAFT', "approvedAt" = NULL, "approvedContentHash" = NULL,
         "approvalInvalidatedAt" = CURRENT_TIMESTAMP, "approvalInvalidationReason" = p_reason
   WHERE "tripId" = p_trip_id AND "status" = 'OWNER_APPROVED';
END;
$$;

-- TripContent: a change to any public field of APPROVED content demotes it (same statement). jsonb comparison is
-- semantic, so rewriting identical values does not invalidate anything.
CREATE FUNCTION "rt_trip_content_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."status" = 'OWNER_APPROVED' AND (
       NEW."summary" IS DISTINCT FROM OLD."summary"
    OR NEW."description" IS DISTINCT FROM OLD."description"
    OR NEW."durationLabel" IS DISTINCT FROM OLD."durationLabel"
    OR NEW."meetingPoint" IS DISTINCT FROM OLD."meetingPoint"
    OR NEW."startTimeNote" IS DISTINCT FROM OLD."startTimeNote"
    OR NEW."languages" IS DISTINCT FROM OLD."languages"
    OR NEW."inclusions" IS DISTINCT FROM OLD."inclusions"
    OR NEW."exclusions" IS DISTINCT FROM OLD."exclusions"
    OR NEW."requirements" IS DISTINCT FROM OLD."requirements"
    OR NEW."accessibility" IS DISTINCT FROM OLD."accessibility"
    OR NEW."weatherPolicy" IS DISTINCT FROM OLD."weatherPolicy"
    OR NEW."operationalConditions" IS DISTINCT FROM OLD."operationalConditions"
    OR NEW."optionalServicesNote" IS DISTINCT FROM OLD."optionalServicesNote"
    OR NEW."tripId" IS DISTINCT FROM OLD."tripId"
  ) THEN
    NEW."status" := 'DRAFT';
    NEW."approvedAt" := NULL;
    NEW."approvedContentHash" := NULL;
    NEW."approvalInvalidatedAt" := CURRENT_TIMESTAMP;
    NEW."approvalInvalidationReason" := 'TripContent changed after approval';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "rt_trip_content_guard" BEFORE UPDATE ON "TripContent" FOR EACH ROW EXECUTE FUNCTION "rt_trip_content_guard"();

-- Itinerary: any insert/delete, or an update of a public field, invalidates the approval of the tour.
CREATE FUNCTION "rt_trip_stop_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."title" IS NOT DISTINCT FROM OLD."title" AND NEW."description" IS NOT DISTINCT FROM OLD."description"
       AND NEW."durationMinutes" IS NOT DISTINCT FROM OLD."durationMinutes" AND NEW."position" = OLD."position" AND NEW."tripId" = OLD."tripId" THEN
      RETURN NULL;
    END IF;
    PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripItineraryStop changed after approval');
  END IF;
  IF TG_OP = 'INSERT' THEN PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripItineraryStop added after approval'); END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN PERFORM "rt_invalidate_trip_approval"(OLD."tripId", 'TripItineraryStop changed or removed after approval'); END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER "rt_trip_stop_guard" AFTER INSERT OR UPDATE OR DELETE ON "TripItineraryStop" FOR EACH ROW EXECUTE FUNCTION "rt_trip_stop_guard"();

-- FAQ: same rule.
CREATE FUNCTION "rt_trip_faq_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW."question" IS NOT DISTINCT FROM OLD."question" AND NEW."answer" IS NOT DISTINCT FROM OLD."answer"
       AND NEW."position" = OLD."position" AND NEW."tripId" = OLD."tripId" THEN
      RETURN NULL;
    END IF;
    PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripFaqItem changed after approval');
  END IF;
  IF TG_OP = 'INSERT' THEN PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripFaqItem added after approval'); END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN PERFORM "rt_invalidate_trip_approval"(OLD."tripId", 'TripFaqItem changed or removed after approval'); END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER "rt_trip_faq_guard" AFTER INSERT OR UPDATE OR DELETE ON "TripFaqItem" FOR EACH ROW EXECUTE FUNCTION "rt_trip_faq_guard"();

-- Media (BEFORE): a new row can never arrive pre-authorized; a change to a public media field invalidates the tour
-- approval and the item's authorization; a rights change (clearance OR revocation) clears the item's authorization only
-- (the revoked item disappears at once; a cleared item needs a new explicit approval).
CREATE FUNCTION "rt_trip_media_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW."publicationApprovedAt" := NULL;
    PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripImage added after approval');
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM "rt_invalidate_trip_approval"(OLD."tripId", 'TripImage removed after approval');
    RETURN OLD;
  END IF;
  IF NEW."src" IS DISTINCT FROM OLD."src" OR NEW."alt" IS DISTINCT FROM OLD."alt" OR NEW."isCover" IS DISTINCT FROM OLD."isCover"
     OR NEW."focalX" IS DISTINCT FROM OLD."focalX" OR NEW."focalY" IS DISTINCT FROM OLD."focalY" OR NEW."credit" IS DISTINCT FROM OLD."credit"
     OR NEW."mediaType" IS DISTINCT FROM OLD."mediaType" OR NEW."posterSrc" IS DISTINCT FROM OLD."posterSrc" OR NEW."mobileSrc" IS DISTINCT FROM OLD."mobileSrc"
     OR NEW."durationSeconds" IS DISTINCT FROM OLD."durationSeconds" OR NEW."position" IS DISTINCT FROM OLD."position" OR NEW."tripId" IS DISTINCT FROM OLD."tripId" THEN
    NEW."publicationApprovedAt" := NULL;
    PERFORM "rt_invalidate_trip_approval"(OLD."tripId", 'TripImage changed after approval');
    IF NEW."tripId" IS DISTINCT FROM OLD."tripId" THEN PERFORM "rt_invalidate_trip_approval"(NEW."tripId", 'TripImage moved after approval'); END IF;
  ELSIF NEW."rightsStatus" IS DISTINCT FROM OLD."rightsStatus" THEN
    NEW."publicationApprovedAt" := NULL;
  END IF;
  -- A publication authorization can be GRANTED only by the approval act: inside its transaction (transaction-local
  -- setting rt.approval_act = trip id) and equal to the approvedAt of the approved content. A direct SQL "fix-up" fails.
  IF NEW."publicationApprovedAt" IS NOT NULL AND NEW."publicationApprovedAt" IS DISTINCT FROM OLD."publicationApprovedAt" THEN
    IF coalesce(current_setting('rt.approval_act', true), '') <> NEW."tripId" OR NOT EXISTS (
         SELECT 1 FROM "TripContent" c WHERE c."tripId" = NEW."tripId" AND c."status" = 'OWNER_APPROVED' AND c."approvedAt" = NEW."publicationApprovedAt") THEN
      RAISE EXCEPTION 'TripImage publication authorization can only be granted by the approval act' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "rt_trip_media_guard" BEFORE INSERT OR UPDATE OR DELETE ON "TripImage" FOR EACH ROW EXECUTE FUNCTION "rt_trip_media_guard"();

-- Trip: the public tour fields shown with the content (title, description, highlights, cover, city/location, duration,
-- physical level, children, group size) are part of what was approved: changing one demotes the approved content.
-- Prices (priceCents) stay under their own publication gate; isPublished/operationType/partnerId are not content.
CREATE FUNCTION "rt_trip_public_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."title" IS DISTINCT FROM OLD."title" OR NEW."description" IS DISTINCT FROM OLD."description"
     OR NEW."highlights" IS DISTINCT FROM OLD."highlights" OR NEW."imageUrl" IS DISTINCT FROM OLD."imageUrl"
     OR NEW."city" IS DISTINCT FROM OLD."city" OR NEW."location" IS DISTINCT FROM OLD."location"
     OR NEW."durationDays" IS DISTINCT FROM OLD."durationDays" OR NEW."physicalLevel" IS DISTINCT FROM OLD."physicalLevel"
     OR NEW."childrenAllowed" IS DISTINCT FROM OLD."childrenAllowed" OR NEW."maxGuests" IS DISTINCT FROM OLD."maxGuests" THEN
    PERFORM "rt_invalidate_trip_approval"(NEW."id", 'Trip public field changed after approval');
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER "rt_trip_public_guard" AFTER UPDATE ON "Trip" FOR EACH ROW EXECUTE FUNCTION "rt_trip_public_guard"();

-- TRUNCATE skips row triggers: truncating itinerary, FAQ or media demotes every approved content.
CREATE FUNCTION "rt_trip_children_truncate_guard"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE "TripContent"
     SET "status" = 'DRAFT', "approvedAt" = NULL, "approvedContentHash" = NULL,
         "approvalInvalidatedAt" = CURRENT_TIMESTAMP, "approvalInvalidationReason" = TG_TABLE_NAME || ' truncated after approval'
   WHERE "status" = 'OWNER_APPROVED';
  RETURN NULL;
END;
$$;
CREATE TRIGGER "rt_trip_stop_truncate_guard" BEFORE TRUNCATE ON "TripItineraryStop" FOR EACH STATEMENT EXECUTE FUNCTION "rt_trip_children_truncate_guard"();
CREATE TRIGGER "rt_trip_faq_truncate_guard" BEFORE TRUNCATE ON "TripFaqItem" FOR EACH STATEMENT EXECUTE FUNCTION "rt_trip_children_truncate_guard"();
CREATE TRIGGER "rt_trip_media_truncate_guard" BEFORE TRUNCATE ON "TripImage" FOR EACH STATEMENT EXECUTE FUNCTION "rt_trip_children_truncate_guard"();
