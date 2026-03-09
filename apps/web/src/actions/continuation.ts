"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { mockGenerateContinuation } from "@bettok/story-engine";

export async function startContinuation(clipNodeId: string) {
  const supabase = await createServiceClient();

  const { data: clipNode } = await supabase
    .from("clip_nodes")
    .select("*")
    .eq("id", clipNodeId)
    .single();

  if (!clipNode) return { error: "Clip not found" };

  if (
    clipNode.status !== "betting_locked" &&
    clipNode.status !== "betting_open"
  ) {
    return { error: "Clip is not in a lockable state" };
  }

  await supabase
    .from("clip_nodes")
    .update({ status: "betting_locked" })
    .eq("id", clipNodeId);

  await supabase
    .from("bets")
    .update({ status: "locked", locked_at: new Date().toISOString() })
    .eq("clip_node_id", clipNodeId)
    .eq("status", "active");

  await supabase
    .from("prediction_markets")
    .update({ status: "locked" })
    .eq("clip_node_id", clipNodeId)
    .in("status", ["open", "normalized"]);

  const { data: markets } = await supabase
    .from("prediction_markets")
    .select("canonical_text, market_key")
    .eq("clip_node_id", clipNodeId);

  const predictions = (markets || []).map(
    (m) => m.canonical_text
  );

  const { data: job, error: jobError } = await supabase
    .from("continuation_jobs")
    .insert({
      clip_node_id: clipNodeId,
      status: "queued",
    })
    .select()
    .single();

  if (jobError) return { error: "Failed to create job" };

  await supabase
    .from("clip_nodes")
    .update({ status: "continuation_generating" })
    .eq("id", clipNodeId);

  await supabase
    .from("continuation_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", job.id);

  const result = mockGenerateContinuation(
    clipNode.scene_summary || "",
    predictions
  );

  const { data: continuationClip } = await supabase
    .from("clip_nodes")
    .insert({
      story_id: clipNode.story_id,
      parent_clip_node_id: clipNodeId,
      depth: clipNode.depth + 1,
      creator_user_id: clipNode.creator_user_id,
      source_type: "continuation",
      status: "betting_open",
      scene_summary: result.continuation_summary,
      genre: clipNode.genre,
      tone: clipNode.tone,
      realism_level: clipNode.realism_level,
      published_at: new Date().toISOString(),
      betting_deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  await supabase
    .from("continuation_jobs")
    .update({
      status: "published",
      continuation_summary: result.continuation_summary,
      accepted_predictions: result.accepted_predictions,
      rejected_predictions: result.rejected_predictions,
      partially_matched: result.partially_matched,
      media_prompt: result.media_prompt,
      scene_explanation: result.scene_explanation,
      result_clip_node_id: continuationClip?.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  await supabase
    .from("clip_nodes")
    .update({ status: "continuation_ready" })
    .eq("id", clipNodeId);

  await supabase
    .from("stories")
    .update({
      max_depth: clipNode.depth + 1,
      total_clips: (clipNode.total_clips || 1) + 1,
    })
    .eq("id", clipNode.story_id);

  const { data: bettors } = await supabase
    .from("bets")
    .select("user_id")
    .eq("clip_node_id", clipNodeId)
    .eq("status", "locked");

  const uniqueUsers = [...new Set((bettors || []).map((b) => b.user_id))];

  for (const userId of uniqueUsers) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "continuation_live",
      title: "Continuation is live!",
      body: "The story continues — see what happened and check your bets.",
      link: `/clip/${clipNodeId}`,
      reference_type: "clip_node",
      reference_id: clipNodeId,
    });
  }

  return { data: { jobId: job.id, continuationClipId: continuationClip?.id } };
}
