-- Resolved clip display: outcome text, reason, resolved_at; feed view includes Part 2 video
ALTER TABLE clip_nodes
  ADD COLUMN IF NOT EXISTS winning_outcome_text TEXT,
  ADD COLUMN IF NOT EXISTS resolution_reason_text TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

DROP VIEW IF EXISTS feed_clips;

CREATE VIEW feed_clips AS
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
  part2.video_storage_path AS part2_video_storage_path,
  s.title AS story_title,
  p.username AS creator_username,
  p.display_name AS creator_display_name,
  p.avatar_path AS creator_avatar_path
FROM clip_nodes cn
JOIN stories s ON s.id = cn.story_id
JOIN profiles p ON p.id = cn.creator_user_id
LEFT JOIN settlement_results sr ON sr.clip_node_id = cn.id
LEFT JOIN clip_nodes part2 ON part2.id = sr.continuation_clip_node_id
WHERE cn.status IN ('betting_open', 'continuation_ready', 'settled')
  AND cn.published_at IS NOT NULL
ORDER BY cn.published_at DESC;
