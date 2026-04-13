-- Link each user to their playable "self" character and persist onboarding wizard state.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS primary_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS character_onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS character_onboarding_draft JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_primary_character
  ON profiles(primary_character_id)
  WHERE primary_character_id IS NOT NULL;

COMMENT ON COLUMN profiles.primary_character_id IS 'User-owned character row used like seeded platform characters (Viktor, Darius, …).';
COMMENT ON COLUMN profiles.character_onboarding_completed_at IS 'When the user finished the character builder; NULL means redirect to onboarding.';
COMMENT ON COLUMN profiles.character_onboarding_draft IS 'Partial wizard answers and storage paths for resume across sessions.';

-- Optional rich media from onboarding (intro clip, extra paths) without new tables.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS media JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN characters.media IS 'e.g. {"intro_video_path":"user_characters/<uid>/intro.mp4","extra_image_paths":[]}';
