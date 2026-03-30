"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import {
  analyzeClipVideo,
  getContinuationContext,
  getAnalysisStatus,
} from "@/video-intelligence/pipeline";
import type { ContinuationContext } from "@/video-intelligence/types";

// ─── Trigger analysis for a clip ────────────────────────────────────────────

export async function triggerVideoAnalysis(clipNodeId: string): Promise<{
  analysisId?: string;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  return analyzeClipVideo(clipNodeId);
}

// ─── Get continuation context for continuation engine ───────────────────────

export async function getClipContinuationContext(clipNodeId: string): Promise<{
  context: ContinuationContext | null;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { context: null, error: "Not signed in" };

  const context = await getContinuationContext(clipNodeId);
  return { context };
}

// ─── Get analysis status (polling) ──────────────────────────────────────────

export async function getVideoAnalysisStatus(clipNodeId: string): Promise<{
  status: string | null;
  analysisId: string | null;
  score: Record<string, number> | null;
  error: string | null;
}> {
  const result = await getAnalysisStatus(clipNodeId);
  if (!result) return { status: null, analysisId: null, score: null, error: null };
  return {
    status: result.status,
    analysisId: result.analysisId,
    score: result.score as Record<string, number> | null,
    error: result.error,
  };
}

// ─── Debug: get full stored analysis row + continuation payload ─────────────

export async function getVideoAnalysisDump(clipNodeId: string): Promise<{
  data: {
    analysis: Record<string, unknown> | null;
    continuationContext: ContinuationContext | null;
  } | null;
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not signed in" };

  const serviceClient = await createServiceClient();
  const { data: analysis } = await serviceClient
    .from("video_analyses")
    .select("*")
    .eq("clip_node_id", clipNodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const continuationContext = await getContinuationContext(clipNodeId);
  return {
    data: {
      analysis: (analysis as Record<string, unknown>) ?? null,
      continuationContext,
    },
  };
}
