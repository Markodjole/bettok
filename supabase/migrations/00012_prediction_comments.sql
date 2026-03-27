CREATE TABLE IF NOT EXISTS prediction_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_market_id UUID NOT NULL REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES prediction_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE prediction_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES prediction_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pred_comments_market ON prediction_comments(prediction_market_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pred_comments_user ON prediction_comments(user_id);

ALTER TABLE prediction_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prediction_comments'
      AND policyname = 'Anyone can read prediction comments'
  ) THEN
    CREATE POLICY "Anyone can read prediction comments"
      ON prediction_comments FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prediction_comments'
      AND policyname = 'Authenticated users can insert comments'
  ) THEN
    CREATE POLICY "Authenticated users can insert comments"
      ON prediction_comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
