-- Store the provably-fair selection proof on continuation jobs
-- so anyone can verify the outcome was neutral.
ALTER TABLE continuation_jobs
  ADD COLUMN IF NOT EXISTS selection_seed TEXT,
  ADD COLUMN IF NOT EXISTS selection_proof JSONB,
  ADD COLUMN IF NOT EXISTS selected_candidates JSONB,
  ADD COLUMN IF NOT EXISTS video_generation_model TEXT;
