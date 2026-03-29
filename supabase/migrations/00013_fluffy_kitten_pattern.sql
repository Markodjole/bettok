-- Last catalog pattern is a kitten asset (was roller-skater placeholder); align slug/path with real image uploads.
UPDATE image_patterns
SET
  slug = 'fluffy_kitten',
  title = 'Fluffy kitten',
  description = 'Long-haired kitten on wood, soft indoor light',
  image_storage_path = 'patterns/fluffy_kitten.png',
  base_scene = jsonb_build_object(
    'subject', 'small long-haired grey tabby kitten, sitting upright facing camera on polished wooden surface',
    'subject_state', 'alert, wide eyes, whiskers forward, calm seated pose',
    'environment', 'indoor, shallow depth of field, soft warm bokeh behind',
    'camera', 'front-facing, medium shot, eye-level, 9:16 vertical',
    'textures', 'soft fluffy fur, wood grain, delicate whiskers'
  )
WHERE slug = 'roller_skater';
