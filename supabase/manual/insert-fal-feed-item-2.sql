-- One-off: second fal.ai output (requires seed users).
INSERT INTO public.stories (
  id,
  title,
  description,
  genre,
  tone,
  creator_user_id,
  root_clip_node_id,
  total_clips
) VALUES
  (
    '33333333-3333-4333-8333-333333333338',
    'Fal generation 2',
    'Second fal.ai output — open bets.',
    'demo',
    'neutral',
    '11111111-1111-4111-8111-111111111111',
    NULL,
    1
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clip_nodes (
  id,
  story_id,
  parent_clip_node_id,
  depth,
  creator_user_id,
  source_type,
  status,
  video_storage_path,
  poster_storage_path,
  scene_summary,
  genre,
  tone,
  duration_ms,
  betting_deadline,
  view_count,
  bet_count,
  published_at
) VALUES
  (
    '88888888-8888-4888-8888-888888888888',
    '33333333-3333-4333-8333-333333333338',
    NULL,
    0,
    '11111111-1111-4111-8111-111111111111',
    'image_to_video'::clip_source_type,
    'betting_open'::clip_node_status,
    'https://v3b.fal.media/files/b/0a93bf8f/28gQApTKzHOvrDjD4HE_Z_output.mp4',
    'https://picsum.photos/seed/falclip2/720/1280',
    'Second fal-generated clip — predictions open.',
    'demo',
    'neutral',
    8000,
    now() + interval '7 days',
    0,
    0,
    now()
  )
ON CONFLICT (id) DO NOTHING;

UPDATE public.stories
SET root_clip_node_id = '88888888-8888-4888-8888-888888888888'
WHERE id = '33333333-3333-4333-8333-333333333338';

INSERT INTO public.prediction_markets (
  id,
  clip_node_id,
  raw_creator_input,
  canonical_text,
  market_key,
  normalization_confidence,
  created_by_user_id,
  status
) VALUES
  (
    '66666666-6666-4666-8666-666666666669',
    '88888888-8888-4888-8888-888888888888',
    'The tense moment pays off',
    'The tense moment pays off',
    'main',
    1.000,
    '22222222-2222-4222-8222-222222222222',
    'open'::prediction_status
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.market_sides (
  prediction_market_id,
  side_key,
  current_odds_decimal,
  probability,
  pool_amount,
  bet_count
) VALUES
  ('66666666-6666-4666-8666-666666666669', 'yes'::market_side_key, 2.10, 0.4700, 0, 0),
  ('66666666-6666-4666-8666-666666666669', 'no'::market_side_key, 1.89, 0.5300, 0, 0)
ON CONFLICT (prediction_market_id, side_key) DO NOTHING;
