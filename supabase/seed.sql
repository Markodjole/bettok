-- =============================================================================
-- Local / dev seed (runs after migrations on `supabase db reset`)
-- =============================================================================
-- Log in with:
--   creator@seed.local  / SeedDemo123!
--   viewer@seed.local   / SeedDemo123!
--
-- Feed videos use public HTTPS URLs (see getMediaUrl in apps/web — http(s) passthrough).
-- Replace URLs below if you want your own assets, or use Storage paths after uploading
-- to the `media` bucket, e.g. clips/seed/demo1.mp4
-- =============================================================================

-- Sample media (replace freely)
-- Video: short MP4 samples | Poster: placeholder images
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'creator@seed.local',
    extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"seedcreator","display_name":"Seed Creator"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'viewer@seed.local',
    extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"seedviewer","display_name":"Seed Viewer"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Email identities (required for password sign-in)
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    jsonb_build_object(
      'sub', '11111111-1111-4111-8111-111111111111',
      'email', 'creator@seed.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    jsonb_build_object(
      'sub', '22222222-2222-4222-8222-222222222222',
      'email', 'viewer@seed.local',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Trigger already created profiles + wallets; bump role for creator
UPDATE public.profiles
SET role = 'creator'::user_role
WHERE id = '11111111-1111-4111-8111-111111111111';

-- Stories (root clip filled after clip insert)
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
    '33333333-3333-4333-8333-333333333333',
    'Will the putt drop?',
    'Golf green — betting open on the outcome.',
    'sports',
    'tense',
    '11111111-1111-4111-8111-111111111111',
    NULL,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333334',
    'Lion notices movement',
    'Savanna clip — open prediction.',
    'nature',
    'calm',
    '11111111-1111-4111-8111-111111111111',
    NULL,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333336',
    'Fal generation',
    'Imported fal.ai output — open bets.',
    'demo',
    'neutral',
    '11111111-1111-4111-8111-111111111111',
    NULL,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333338',
    'Fal generation 2',
    'Second fal.ai output — open bets.',
    'demo',
    'neutral',
    '11111111-1111-4111-8111-111111111111',
    NULL,
    1
  ),
  (
    '33333333-3333-4333-8333-333333333339',
    'Fal generation 3',
    'Third fal.ai output — open bets.',
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
    '44444444-4444-4444-8444-444444444444',
    '33333333-3333-4333-8333-333333333333',
    NULL,
    0,
    '11111111-1111-4111-8111-111111111111',
    'image_to_video'::clip_source_type,
    'betting_open'::clip_node_status,
    'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    'https://picsum.photos/seed/putt/720/1280',
    'Close-up on the ball rolling toward the cup — outcome still unclear.',
    'sports',
    'tense',
    5000,
    now() + interval '7 days',
    42,
    3,
    now() - interval '1 hour'
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    '33333333-3333-4333-8333-333333333334',
    NULL,
    0,
    '11111111-1111-4111-8111-111111111111',
    'image_to_video'::clip_source_type,
    'betting_open'::clip_node_status,
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://picsum.photos/seed/lion/720/1280',
    'Lion resting — something shifts in the tall grass nearby.',
    'nature',
    'calm',
    15000,
    now() + interval '7 days',
    128,
    7,
    now() - interval '30 minutes'
  ),
  (
    '99999999-9999-4999-8999-999999999999',
    '33333333-3333-4333-8333-333333333336',
    NULL,
    0,
    '11111111-1111-4111-8111-111111111111',
    'image_to_video'::clip_source_type,
    'betting_open'::clip_node_status,
    'https://v3b.fal.media/files/b/0a93e533/EIBpKFeedqkzEsk5V1tW1_output.mp4',
    'https://picsum.photos/seed/falclip/720/1280',
    'Fal-generated clip — outcome still open for predictions.',
    'demo',
    'neutral',
    8000,
    now() + interval '7 days',
    0,
    0,
    now() - interval '2 minutes'
  ),
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
    now() - interval '1 minute'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
    '33333333-3333-4333-8333-333333333339',
    NULL,
    0,
    '11111111-1111-4111-8111-111111111111',
    'image_to_video'::clip_source_type,
    'betting_open'::clip_node_status,
    'https://v3b.fal.media/files/b/0a93bf1c/G3TWEbMgolUJ-9kRkAX7D_output.mp4',
    'https://picsum.photos/seed/falclip3/720/1280',
    'Third fal-generated clip — predictions open.',
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
SET root_clip_node_id = '44444444-4444-4444-8444-444444444444'
WHERE id = '33333333-3333-4333-8333-333333333333';

UPDATE public.stories
SET root_clip_node_id = '55555555-5555-4555-8555-555555555555'
WHERE id = '33333333-3333-4333-8333-333333333334';

UPDATE public.stories
SET root_clip_node_id = '99999999-9999-4999-8999-999999999999'
WHERE id = '33333333-3333-4333-8333-333333333336';

UPDATE public.stories
SET root_clip_node_id = '88888888-8888-4888-8888-888888888888'
WHERE id = '33333333-3333-4333-8333-333333333338';

UPDATE public.stories
SET root_clip_node_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'
WHERE id = '33333333-3333-4333-8333-333333333339';

-- Prediction markets + sides (viewer-created text)
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
    '66666666-6666-4666-8666-666666666666',
    '44444444-4444-4444-8444-444444444444',
    'Ball goes in the hole',
    'The ball goes in the hole',
    'main',
    1.000,
    '22222222-2222-4222-8222-222222222222',
    'open'::prediction_status
  ),
  (
    '66666666-6666-4666-8666-666666666667',
    '55555555-5555-4555-8555-555555555555',
    'Lion stands up to investigate',
    'The lion stands up to investigate the movement',
    'main',
    1.000,
    '22222222-2222-4222-8222-222222222222',
    'open'::prediction_status
  ),
  (
    '66666666-6666-4666-8666-666666666668',
    '99999999-9999-4999-8999-999999999999',
    'Something surprising happens before the cut',
    'Something surprising happens before the cut',
    'main',
    1.000,
    '22222222-2222-4222-8222-222222222222',
    'open'::prediction_status
  ),
  (
    '66666666-6666-4666-8666-666666666669',
    '88888888-8888-4888-8888-888888888888',
    'The tense moment pays off',
    'The tense moment pays off',
    'main',
    1.000,
    '22222222-2222-4222-8222-222222222222',
    'open'::prediction_status
  ),
  (
    '66666666-6666-4666-8666-666666666670',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
    'Outcome swings in viewers favor',
    'Outcome swings in viewers favor',
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
  ('66666666-6666-4666-8666-666666666666', 'yes'::market_side_key, 2.50, 0.4000, 0, 0),
  ('66666666-6666-4666-8666-666666666666', 'no'::market_side_key, 1.67, 0.6000, 0, 0),
  ('66666666-6666-4666-8666-666666666667', 'yes'::market_side_key, 3.00, 0.3333, 0, 0),
  ('66666666-6666-4666-8666-666666666667', 'no'::market_side_key, 1.50, 0.6667, 0, 0),
  ('66666666-6666-4666-8666-666666666668', 'yes'::market_side_key, 2.20, 0.4500, 0, 0),
  ('66666666-6666-4666-8666-666666666668', 'no'::market_side_key, 1.82, 0.5500, 0, 0),
  ('66666666-6666-4666-8666-666666666669', 'yes'::market_side_key, 2.10, 0.4700, 0, 0),
  ('66666666-6666-4666-8666-666666666669', 'no'::market_side_key, 1.89, 0.5300, 0, 0),
  ('66666666-6666-4666-8666-666666666670', 'yes'::market_side_key, 2.05, 0.4800, 0, 0),
  ('66666666-6666-4666-8666-666666666670', 'no'::market_side_key, 1.95, 0.5200, 0, 0)
ON CONFLICT (prediction_market_id, side_key) DO NOTHING;

-- Threaded comments demo
INSERT INTO public.prediction_comments (id, prediction_market_id, user_id, parent_comment_id, body)
VALUES
  (
    '77777777-7777-4777-8777-777777777771',
    '66666666-6666-4666-8666-666666666666',
    '22222222-2222-4222-8222-222222222222',
    NULL,
    'Feels like it breaks slightly left at the end.'
  ),
  (
    '77777777-7777-4777-8777-777777777772',
    '66666666-6666-4666-8666-666666666666',
    '11111111-1111-4111-8111-111111111111',
    '77777777-7777-4777-8777-777777777771',
    'Could be — grain is fast here.'
  )
ON CONFLICT (id) DO NOTHING;
