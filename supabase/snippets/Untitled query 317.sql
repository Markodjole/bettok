-- Feed: expose capture location from llm_generation_json (no clip_nodes column required).
-- Owner uploads store capture_location_text on the JSON blob; avoids schema drift on publish.

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
  NULLIF(BTRIM(cn.llm_generation_json->>'capture_location_text'), '') AS capture_location_text,
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
  ch.appearance AS character_appearance,
  ch.betting_signals AS character_betting_signals
FROM clip_nodes cn
JOIN stories s ON s.id = cn.story_id
JOIN profiles p ON p.id = cn.creator_user_id
LEFT JOIN settlement_results sr ON sr.clip_node_id = cn.id
LEFT JOIN clip_nodes part2 ON part2.id = sr.continuation_clip_node_id
LEFT JOIN characters ch ON ch.id = cn.character_id
WHERE cn.status IN ('betting_open', 'continuation_ready', 'settled', 'betting_locked', 'continuation_generating')
  AND cn.published_at IS NOT NULL
ORDER BY cn.published_at DESC;
