-- RT-119 local preparation: FICTITIOUS rows for the 4 tour ids (only so the loader can find its trip; never real data,
-- never production). Prices here are arbitrary test values; the verification proves the loader never changes them.
INSERT INTO "Trip" (id, city, "priceCents", "updatedAt", title, highlights, "isPublished")
VALUES
  ('cmlhxkpy9000028zq27rhytew', 'Rio de Janeiro', 11111, '2026-10-17T00:00:00Z', '{"pt":"Fixture Cristo","en":"Fixture Cristo","es":"Fixture Cristo"}', '[]', true),
  ('cmli1a6im000034zqqzc9sppb', 'Rio de Janeiro', 22222, '2026-10-17T00:00:00Z', '{"pt":"Fixture Rocinha","en":"Fixture Rocinha","es":"Fixture Rocinha"}', '[]', true),
  ('cmlibniq40000z4zqkbujnutt', 'Rio de Janeiro', 33333, '2026-10-17T00:00:00Z', '{"pt":"Fixture Colombo","en":"Fixture Colombo","es":"Fixture Colombo"}', '[]', true),
  ('cmljo0s1u0000t0zqa0bpd23p', 'Rio de Janeiro', 44444, '2026-10-17T00:00:00Z', '{"pt":"Fixture Premium","en":"Fixture Premium","es":"Fixture Premium"}', '[]', true);
