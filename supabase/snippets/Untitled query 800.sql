-- Character system: predefined + custom characters with rich personality data,
-- multi-angle reference images, trait history from resolutions, and video gallery.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Characters ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ownership: NULL = predefined (platform); non-null = user-created
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,                -- one-liner, e.g. "Impatient tech bro who hates mornings"

  -- Visual identity (enough for consistent Kling prompts)
  appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   age_range: "25-30",
  --   gender_presentation: "male",
  --   build: "average",
  --   height: "tall",
  --   hair: { color: "brown", style: "short messy", facial_hair: "stubble" },
  --   skin_tone: "light olive",
  --   distinguishing_features: ["scar on left eyebrow", "silver watch"],
  --   default_outfit: {
  --     top: "navy bomber jacket over white tee",
  --     bottom: "black slim jeans",
  --     shoes: "white sneakers",
  --     accessories: ["silver watch", "earbuds around neck"]
  --   }
  -- }

  -- Personality & behavioral traits (the prediction engine's secret sauce)
  personality JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   big_five: { openness: 0.7, conscientiousness: 0.3, extraversion: 0.8, agreeableness: 0.5, neuroticism: 0.6 },
  --   temperament: "impatient, impulsive, easily bored",
  --   decision_style: "gut-feeling, fast, rarely second-guesses",
  --   risk_appetite: "high — always picks the riskier option",
  --   social_style: "loud, center of attention, interrupts often"
  -- }

  -- Preferences & habits (what they like/dislike — drives prediction logic)
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   food: { likes: ["pizza", "energy drinks", "spicy"], dislikes: ["salad", "diet drinks"] },
  --   activities: { likes: ["gaming", "skateboarding"], dislikes: ["running", "yoga"] },
  --   brands: { likes: ["Coca-Cola", "Nike"], dislikes: ["Pepsi"] },
  --   shopping: "grabs first thing, never reads labels",
  --   general_tendencies: ["picks the flashiest option", "easily distracted", "checks phone constantly"]
  -- }

  -- Background story (adds depth for the LLM)
  backstory TEXT,
  -- "Mike grew up in a small town, moved to the city at 18 for college, dropped out to start a tech company..."

  -- Voice / speech patterns
  voice JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { tone: "sarcastic", vocabulary: "casual slang", catchphrases: ["bro", "no cap", "let's gooo"] }

  -- Accumulated trait history from resolved videos (grows over time)
  trait_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [
  --   { "clip_node_id": "...", "action": "chose Coca-Cola over Pepsi", "at": "2025-04-01T..." },
  --   { "clip_node_id": "...", "action": "walked away from salad bar", "at": "2025-04-02T..." }
  -- ]

  -- Stats
  total_videos INT NOT NULL DEFAULT 0,
  total_resolutions INT NOT NULL DEFAULT 0,
  total_bets_received INT NOT NULL DEFAULT 0,

  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_characters_creator ON characters(creator_user_id) WHERE creator_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_characters_active ON characters(active, sort_order);

-- ─── Character reference images (multi-angle for video consistency) ──────────

CREATE TABLE IF NOT EXISTS character_reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,

  image_storage_path TEXT NOT NULL,  -- patterns/characters/mike/front.png
  angle TEXT NOT NULL,               -- front, left_profile, right_profile, back, three_quarter, close_up
  is_primary BOOLEAN NOT NULL DEFAULT false,
  description TEXT,                   -- "front-facing medium shot, arms at sides, neutral expression"

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_char_ref_images_char ON character_reference_images(character_id);

-- ─── Link characters to clips (video gallery per character) ──────────────────

ALTER TABLE clip_nodes
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clip_nodes_character ON clip_nodes(character_id) WHERE character_id IS NOT NULL;

-- ─── Character trait events (structured resolution feedback) ─────────────────

CREATE TABLE IF NOT EXISTS character_trait_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  clip_node_id UUID NOT NULL REFERENCES clip_nodes(id) ON DELETE CASCADE,

  action_taken TEXT NOT NULL,          -- "chose Coca-Cola over Pepsi"
  context TEXT,                         -- "at vending machine, was thirsty after gym"
  trait_tags TEXT[] DEFAULT '{}',       -- {'impulsive', 'brand_loyal', 'coca_cola'}
  confidence NUMERIC(3,2) DEFAULT 1.0, -- how clearly the video showed this

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trait_events_char ON character_trait_events(character_id);
CREATE INDEX IF NOT EXISTS idx_trait_events_clip ON character_trait_events(clip_node_id);

-- ─── Update feed_clips view to include character data ────────────────────────

DROP VIEW IF EXISTS feed_clips;
CREATE OR REPLACE VIEW feed_clips AS
SELECT
  cn.id,
  cn.story_id,
  cn.parent_clip_node_id,
  cn.depth,
  cn.creator_user_id,
  cn.source_type,
  cn.status,
  cn.video_storage_path,
  cn.poster_storage_path,
  cn.scene_summary,
  cn.genre,
  cn.tone,
  cn.pause_start_ms,
  cn.duration_ms,
  cn.betting_deadline,
  cn.view_count,
  cn.bet_count,
  cn.published_at,
  cn.winning_outcome_text,
  cn.resolution_reason_text,
  cn.resolved_at,
  cn.transcript,
  cn.character_id,
  COALESCE(part2.video_storage_path, cn.part2_video_storage_path) AS part2_video_storage_path,
  s.title AS story_title,
  p.username AS creator_username,
  p.display_name AS creator_display_name,
  p.avatar_path AS creator_avatar_path,
  ch.name AS character_name,
  ch.slug AS character_slug,
  ch.tagline AS character_tagline,
  ch.appearance AS character_appearance
FROM clip_nodes cn
JOIN stories s ON s.id = cn.story_id
JOIN profiles p ON p.id = cn.creator_user_id
LEFT JOIN settlement_results sr ON sr.clip_node_id = cn.id
LEFT JOIN clip_nodes part2 ON part2.id = sr.continuation_clip_node_id
LEFT JOIN characters ch ON ch.id = cn.character_id
WHERE cn.status IN ('betting_open', 'continuation_ready', 'settled', 'betting_locked', 'continuation_generating')
  AND cn.published_at IS NOT NULL
ORDER BY cn.published_at DESC;
