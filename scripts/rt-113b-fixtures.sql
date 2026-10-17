-- RT-113 complement: FICTITIOUS fixtures for the local throw-away database rt113b_check (never real data, never
-- production). Loaded at the state BEFORE the complement migration to prove that existing rows survive unchanged.
INSERT INTO "Trip" (id, city, "priceCents", "updatedAt", title, highlights, "isPublished")
VALUES
  ('fixture_trip_a', 'Rio de Janeiro', 10000, '2026-10-17T00:00:00Z', '{"pt":"Fixture A","en":"Fixture A","es":"Fixture A"}', '[]', true),
  ('fixture_trip_b', 'Rio de Janeiro', 20000, '2026-10-17T00:00:00Z', '{"pt":"Fixture B","en":"Fixture B","es":"Fixture B"}', '[]', true),
  ('fixture_trip_c', 'Rio de Janeiro', 30000, '2026-10-17T00:00:00Z', '{"pt":"Fixture C","en":"Fixture C","es":"Fixture C"}', '[]', false),
  ('fixture_trip_d', 'Rio de Janeiro', 40000, '2026-10-17T00:00:00Z', '{"pt":"Fixture D","en":"Fixture D","es":"Fixture D"}', '[]', true);

INSERT INTO "TripContent" ("tripId", status, source, summary, "meetingPoint", languages, inclusions, "approvedAt", "updatedAt")
VALUES
  ('fixture_trip_a', 'OWNER_APPROVED', 'fixture source A', '{"pt":"Resumo A","en":"Summary A","es":"Resumen A"}', '{"pt":"Ponto A","en":"Point A","es":"Punto A"}', '{pt,en,es}', '{"pt":["Item"],"en":["Item"],"es":["Item"]}', '2026-10-17T00:00:00Z', '2026-10-17T00:00:00Z'),
  ('fixture_trip_b', 'DRAFT', 'fixture source B', '{"pt":"Resumo B","en":"Summary B","es":"Resumen B"}', NULL, '{pt}', NULL, NULL, '2026-10-17T00:00:00Z');

INSERT INTO "TripItineraryStop" (id, "tripId", position, title, "durationMinutes", "updatedAt")
VALUES
  ('fixture_stop_1', 'fixture_trip_a', 0, '{"pt":"Parada 1","en":"Stop 1","es":"Parada 1"}', 30, '2026-10-17T00:00:00Z'),
  ('fixture_stop_2', 'fixture_trip_a', 1, '{"pt":"Parada 2","en":"Stop 2","es":"Parada 2"}', NULL, '2026-10-17T00:00:00Z');

INSERT INTO "TripImage" (id, "tripId", position, src, alt, "isCover", "rightsStatus", "rightsNote", "focalX", "focalY", "updatedAt")
VALUES
  ('fixture_img_1', 'fixture_trip_a', 0, '/fixtures/a1.jpg', '{"pt":"Foto 1","en":"Photo 1","es":"Foto 1"}', true, 'OWNER_ATTESTED', 'fixture rights', 0.5, 0.6, '2026-10-17T00:00:00Z'),
  ('fixture_img_2', 'fixture_trip_a', 1, '/fixtures/a2.jpg', '{"pt":"Foto 2","en":"Photo 2","es":"Foto 2"}', false, 'UNVERIFIED', NULL, NULL, NULL, '2026-10-17T00:00:00Z');
