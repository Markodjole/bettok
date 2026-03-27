"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export async function getClipComments(clipId: string) {
  const supabase = await createServerClient();

  const { data: markets } = await supabase
    .from("prediction_markets")
    .select("id")
    .eq("clip_node_id", clipId);
  const marketIds = (markets || []).map((m: any) => m.id);
  if (marketIds.length === 0) return [];

  const { data, error } = await supabase
    .from("prediction_comments")
    .select("id, body, created_at, user_id, parent_comment_id")
    .in("prediction_market_id", marketIds)
    .order("created_at", { ascending: true })
    .limit(60);

  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
  let profileMap = new Map<string, { username: string | null; display_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);
    profileMap = new Map(
      (profiles || []).map((p: any) => [
        p.id,
        { username: p.username ?? null, display_name: p.display_name ?? null },
      ]),
    );
  }

  return data.map((c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    userId: c.user_id,
    parentCommentId: c.parent_comment_id ?? null,
    username: profileMap.get(c.user_id)?.username ?? "anon",
    displayName: profileMap.get(c.user_id)?.display_name ?? "Anonymous",
  }));
}

export async function getPredictionComments(predictionMarketId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("prediction_comments")
    .select("id, body, created_at, user_id, parent_comment_id")
    .eq("prediction_market_id", predictionMarketId)
    .order("created_at", { ascending: true })
    .limit(80);

  if (error || !data) return [];

  const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
  let profileMap = new Map<string, { username: string | null; display_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);
    profileMap = new Map(
      (profiles || []).map((p: any) => [
        p.id,
        { username: p.username ?? null, display_name: p.display_name ?? null },
      ]),
    );
  }

  return data.map((c: any) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    userId: c.user_id,
    parentCommentId: c.parent_comment_id ?? null,
    username: profileMap.get(c.user_id)?.username ?? "anon",
    displayName: profileMap.get(c.user_id)?.display_name ?? "Anonymous",
  }));
}

export async function postPredictionComment(
  predictionMarketId: string,
  body: string,
  parentCommentId?: string | null,
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 280) return { error: "Comment must be 1-280 characters" };

  const serviceClient = await createServiceClient();
  const row: Record<string, unknown> = {
    prediction_market_id: predictionMarketId,
    user_id: user.id,
    body: trimmed,
  };
  if (parentCommentId) row.parent_comment_id = parentCommentId;

  const { data, error } = await serviceClient
    .from("prediction_comments")
    .insert(row)
    .select("id, body, created_at, parent_comment_id")
    .single();

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return {
    data: {
      id: data.id,
      body: data.body,
      createdAt: data.created_at,
      userId: user.id,
      parentCommentId: (data as any).parent_comment_id ?? null,
      username: profile?.username ?? "anon",
      displayName: profile?.display_name ?? "Anonymous",
    },
  };
}
