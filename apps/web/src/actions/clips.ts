"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export interface FeedClip {
  id: string;
  story_id: string;
  parent_clip_node_id: string | null;
  depth: number;
  creator_user_id: string;
  source_type: string;
  status: string;
  video_storage_path: string | null;
  poster_storage_path: string | null;
  scene_summary: string | null;
  genre: string | null;
  tone: string | null;
  pause_start_ms: number | null;
  duration_ms: number | null;
  betting_deadline: string | null;
  view_count: number;
  bet_count: number;
  published_at: string;
  story_title: string;
  creator_username: string;
  creator_display_name: string;
  creator_avatar_path: string | null;
}

export async function getFeedClips(
  cursor?: string,
  limit = 10
): Promise<{ clips: FeedClip[]; nextCursor: string | null }> {
  const supabase = await createServerClient();

  let query = supabase
    .from("feed_clips")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Feed query error:", error);
    return { clips: [], nextCursor: null };
  }

  const clips = (data || []) as FeedClip[];
  const nextCursor =
    clips.length === limit
      ? clips[clips.length - 1]?.published_at ?? null
      : null;

  return { clips, nextCursor };
}

export async function getClipById(id: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clip_nodes")
    .select(
      `
      *,
      stories!inner(title, genre, tone, realism_level),
      profiles!clip_nodes_creator_user_id_fkey(username, display_name, avatar_path)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getClipMarkets(clipNodeId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("prediction_markets")
    .select(
      `
      *,
      market_sides(*)
    `
    )
    .eq("clip_node_id", clipNodeId)
    .in("status", ["open", "normalized", "locked", "settled"])
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function incrementViewCount(clipId: string) {
  const supabase = await createServiceClient();
  try {
    await supabase.rpc("increment_view_count", { clip_id: clipId });
  } catch {
    // view count is non-critical
  }
}

export async function uploadClip(formData: FormData) {
  const supabase = await createServerClient();
  const serviceClient = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("video") as File;
  const title = formData.get("title") as string;
  const genre = (formData.get("genre") as string) || null;
  const tone = (formData.get("tone") as string) || null;

  if (!file || !title) return { error: "Missing required fields" };

  const ext = file.name.split(".").pop();
  const path = `clips/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file);

  if (uploadError) return { error: "Upload failed: " + uploadError.message };

  const { data: story, error: storyError } = await serviceClient
    .from("stories")
    .insert({
      title,
      genre,
      tone,
      creator_user_id: user.id,
    })
    .select()
    .single();

  if (storyError) return { error: "Failed to create story" };

  const { data: clipNode, error: clipError } = await serviceClient
    .from("clip_nodes")
    .insert({
      story_id: story.id,
      creator_user_id: user.id,
      source_type: "upload",
      status: "betting_open",
      video_storage_path: path,
      genre,
      tone,
      published_at: new Date().toISOString(),
      betting_deadline: new Date(
        Date.now() + 5 * 60 * 1000
      ).toISOString(),
    })
    .select()
    .single();

  if (clipError) return { error: "Failed to create clip" };

  await serviceClient
    .from("stories")
    .update({ root_clip_node_id: clipNode.id })
    .eq("id", story.id);

  return { data: clipNode };
}
