-- RT-113 complement: fingerprint of every row of the tables that existed before the complement migration
-- (only the columns that existed before). Run before and after migrating; the two outputs must be identical.
SELECT 'Trip' AS t, md5(coalesce(string_agg(concat_ws('|', id, city, "priceCents", "imageUrl", title::text, description::text, highlights::text, "isPublished", "childrenAllowed", "durationDays", "physicalLevel", "maxGuests", "operationType", "partnerId"), '#' ORDER BY id), '')) AS h FROM "Trip"
UNION ALL
SELECT 'TripContent', md5(coalesce(string_agg(concat_ws('|', "tripId", status, source, summary::text, description::text, "durationLabel"::text, "meetingPoint"::text, "startTimeNote"::text, array_to_string(languages, ','), inclusions::text, exclusions::text, requirements::text, accessibility::text, "weatherPolicy"::text, "approvedAt"), '#' ORDER BY "tripId"), '')) FROM "TripContent"
UNION ALL
SELECT 'TripItineraryStop', md5(coalesce(string_agg(concat_ws('|', id, "tripId", position, title::text, description::text, "durationMinutes"), '#' ORDER BY id), '')) FROM "TripItineraryStop"
UNION ALL
SELECT 'TripImage', md5(coalesce(string_agg(concat_ws('|', id, "tripId", position, src, alt::text, "isCover", "focalX", "focalY", "rightsStatus", "rightsNote"), '#' ORDER BY id), '')) FROM "TripImage"
ORDER BY 1;
